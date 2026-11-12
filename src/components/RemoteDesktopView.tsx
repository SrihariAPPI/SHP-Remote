import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Monitor,
  Maximize2,
  Minimize2,
  Keyboard,
  Radio,
  RotateCcw,
  Zap,
  Volume2,
  AlertTriangle,
  Play,
  Square,
} from 'lucide-react';
import { RemoteConfig, OutgoingMessage } from '../types/remote';
import { hapticFeedback } from '../utils/haptics';

interface RemoteDesktopViewProps {
  config: RemoteConfig;
  isSimulated: boolean;
  onSendAbsMouse: (x: number, y: number) => void;
  onSendMouseDown: (button: 'left' | 'right' | 'middle', x?: number, y?: number) => void;
  onSendMouseUp: (button: 'left' | 'right' | 'middle') => void;
  onSendMouseClick: (button: 'left' | 'right' | 'middle', double?: boolean, x?: number, y?: number) => void;
  onSendMouseScroll: (dy: number) => void;
  onSendKey: (key: string) => void;
  onSendText: (text: string) => void;
  onSendShortcut: (combo: any) => void;
  onStreamConfigChange?: (quality: 'low' | 'med' | 'high' | 'ultra', fps: number) => void;
  onSendWebRtcSignal?: (msg: OutgoingMessage) => void;
  incomingWebRtcAnswer?: string | null;
  incomingWebRtcIce?: any;
}

export const RemoteDesktopView: React.FC<RemoteDesktopViewProps> = ({
  config,
  isSimulated,
  onSendAbsMouse,
  onSendMouseDown,
  onSendMouseUp,
  onSendMouseClick,
  onSendMouseScroll,
  onSendKey,
  onSendText,
  onSendShortcut,
  onStreamConfigChange,
  onSendWebRtcSignal,
  incomingWebRtcAnswer,
  incomingWebRtcIce,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const streamImgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamProtocol, setStreamProtocol] = useState<'webrtc' | 'mjpeg'>('webrtc');
  const [webrtcState, setWebrtcState] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const [streamError, setStreamError] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [fitMode, setFitMode] = useState<'fit' | 'fill' | 'original'>('fit');
  const [quality, setQuality] = useState<'low' | 'med' | 'high' | 'ultra'>(config.streamQuality);
  const [fps, setFps] = useState<number>(config.streamFps);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showKeyboardDrawer, setShowKeyboardDrawer] = useState<boolean>(false);
  const [quickInputText, setQuickInputText] = useState<string>('');
  const [streamLatency, setStreamLatency] = useState<number>(12);
  const [mouseIndicator, setMouseIndicator] = useState<{ x: number; y: number; active: boolean } | null>(null);
  const [fallbackToast, setFallbackToast] = useState<string | null>(null);

  // Desktop resolution baseline
  const WINDOWS_WIDTH = 1920;
  const WINDOWS_HEIGHT = 1080;

  // Stream URL calculation with active streaming token
  const activeStreamToken = (config.streamToken || config.authToken || 'SHP_SECRET_TOKEN_2026').trim();
  const streamUrl = `http://${config.streamHost}:${config.streamPort}/stream?token=${encodeURIComponent(activeStreamToken)}`;

  // Simulated desktop state for when hardware laptop is not attached
  const [simWindowsPos, setSimWindowsPos] = useState({ x: 180, y: 110 });
  const [simActiveApp, setSimActiveApp] = useState<'editor' | 'browser' | 'terminal'>('editor');
  const [simTypedCode, setSimTypedCode] = useState<string[]>([
    '// Windows 11 Active Session — Home Wi-Fi',
    'const remote = new SHPRemoteClient();',
    `remote.connect("${config.esp32Ip}");`,
  ]);

  // Touch tracking refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const twoFingerStartYRef = useRef<number>(0);
  const initialPinchDistRef = useRef<number | null>(null);

  // Fast transmit helper: Prioritizes WebRTC DataChannel (UDP, sub-5ms) over WebSocket
  const sendFastControl = useCallback(
    (msg: any, fallbackCb: () => void) => {
      if (
        dataChannelRef.current &&
        dataChannelRef.current.readyState === 'open'
      ) {
        try {
          dataChannelRef.current.send(JSON.stringify(msg));
          return;
        } catch (e) {
          // fall through to fallback
        }
      }
      fallbackCb();
    },
    []
  );

  // Fullscreen toggle using standard Web API
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
    hapticFeedback.actionKey(config.hapticFeedback);
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // WebRTC Peer Connection Setup with shp-control DataChannel and ICE signaling
  const startWebRtc = useCallback(async () => {
    if (isSimulated || typeof window === 'undefined' || !window.RTCPeerConnection) {
      return;
    }

    try {
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (dataChannelRef.current) {
        dataChannelRef.current = null;
      }

      setWebrtcState('connecting');
      const stun = config.webrtcStunServer || 'stun:stun.l.google.com:19302';
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: stun }],
      });
      pcRef.current = pc;

      // Create WebRTC DataChannel for low-latency input control directly over P2P connection
      try {
        const dc = pc.createDataChannel('shp-control', { ordered: false, maxRetransmits: 0 });
        dc.onopen = () => {
          dataChannelRef.current = dc;
        };
        dc.onclose = () => {
          dataChannelRef.current = null;
        };
      } catch (e) {
        console.warn('DataChannel creation notice:', e);
      }

      // Add transceiver to receive remote desktop video track
      pc.addTransceiver('video', { direction: 'recvonly' });

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setWebrtcState('connected');
          setStreamLatency(8);
          if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
        }
      };

      // Bidirectional ICE candidate handler
      pc.onicecandidate = (event) => {
        if (event.candidate && onSendWebRtcSignal) {
          onSendWebRtcSignal({
            type: 'webrtc_ice',
            candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setWebrtcState('connected');
          if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setWebrtcState('failed');
        }
      };

      // Start 6-second timeout: If WebRTC doesn't connect, fall back automatically to MJPEG
      timeoutTimerRef.current = setTimeout(() => {
        if (pc.connectionState !== 'connected') {
          setStreamProtocol('mjpeg');
          setFallbackToast('WebRTC negotiation timed out on home router. Switched to MJPEG stream.');
          setTimeout(() => setFallbackToast(null), 4500);
        }
      }, 6000);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 1. Try direct HTTP signaling to companion host
      try {
        const resp = await fetch(`http://${config.streamHost}:${config.streamPort}/offer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeStreamToken}`,
          },
          body: JSON.stringify({
            sdp: offer.sdp,
            type: 'offer',
            token: activeStreamToken,
          }),
        });
        if (resp.ok) {
          const answer = await resp.json();
          if (answer.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answer.sdp }));
            return;
          }
        }
      } catch (err) {
        // Direct HTTP blocked (e.g. Mixed Content) -> fallback to ESP32 WebSocket relay
      }

      // 2. Relay via ESP32 WebSocket
      if (onSendWebRtcSignal && offer.sdp) {
        onSendWebRtcSignal({
          type: 'webrtc_offer',
          sdp: offer.sdp,
        });
      }
    } catch (err) {
      console.warn('WebRTC startup notice:', err);
      setWebrtcState('failed');
      setStreamProtocol('mjpeg');
    }
  }, [config.streamHost, config.streamPort, config.webrtcStunServer, isSimulated, onSendWebRtcSignal]);

  // Handle incoming SDP Answer from WebSocket relay
  useEffect(() => {
    if (incomingWebRtcAnswer && pcRef.current) {
      const pc = pcRef.current;
      if (pc.signalingState !== 'stable') {
        pc.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: incomingWebRtcAnswer })
        ).catch((e) => console.warn('WebRTC answer application:', e));
      }
    }
  }, [incomingWebRtcAnswer]);

  // Handle incoming ICE candidate from companion
  useEffect(() => {
    if (incomingWebRtcIce && pcRef.current) {
      try {
        const candData = typeof incomingWebRtcIce === 'string' ? JSON.parse(incomingWebRtcIce) : incomingWebRtcIce;
        pcRef.current.addIceCandidate(new RTCIceCandidate(candData)).catch((e) => {
          console.warn('Add ICE candidate warning:', e);
        });
      } catch (e) {
        console.warn('ICE parse warning:', e);
      }
    }
  }, [incomingWebRtcIce]);

  // Start or stop streaming
  useEffect(() => {
    if (isStreaming && !isSimulated) {
      if (streamProtocol === 'webrtc') {
        startWebRtc();
      }
    } else {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      setWebrtcState('idle');
    }

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [isStreaming, streamProtocol, isSimulated, startWebRtc]);

  // Calculate rendered video rectangle inside container (accounting for letterbox/pillarbox)
  const getRenderedVideoRect = (): { left: number; top: number; width: number; height: number } | null => {
    const el = videoRef.current || streamImgRef.current;
    const container = containerRef.current;
    if (!el && !container) return null;

    const targetEl = el || container;
    if (!targetEl) return null;
    const rect = targetEl.getBoundingClientRect();

    if (fitMode === 'fill') {
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }

    const desktopAspect = WINDOWS_WIDTH / WINDOWS_HEIGHT; // 16:9
    const containerAspect = rect.width / rect.height;
    let renderedW = rect.width;
    let renderedH = rect.height;
    let offX = 0;
    let offY = 0;

    if (containerAspect > desktopAspect) {
      // Pillarboxed (black bars on left/right)
      renderedW = rect.height * desktopAspect;
      offX = (rect.width - renderedW) / 2;
    } else {
      // Letterboxed (black bars on top/bottom)
      renderedH = rect.width / desktopAspect;
      offY = (rect.height - renderedH) / 2;
    }

    return {
      left: rect.left + offX,
      top: rect.top + offY,
      width: renderedW,
      height: renderedH,
    };
  };

  // Map touch position to exact Windows 11 pixel coordinates (with full letterbox & zoom support)
  const getMappedCoordinates = (clientX: number, clientY: number): { winX: number; winY: number } | null => {
    const rendered = getRenderedVideoRect();
    if (!rendered) return null;

    // Account for zoom transform centered on the rendered element
    const centerX = rendered.left + rendered.width / 2;
    const centerY = rendered.top + rendered.height / 2;

    const unscaledX = (clientX - centerX) / zoomLevel + rendered.width / 2;
    const unscaledY = (clientY - centerY) / zoomLevel + rendered.height / 2;

    if (unscaledX < 0 || unscaledX > rendered.width || unscaledY < 0 || unscaledY > rendered.height) {
      return null;
    }

    const winX = Math.round((unscaledX / rendered.width) * WINDOWS_WIDTH);
    const winY = Math.round((unscaledY / rendered.height) * WINDOWS_HEIGHT);
    return {
      winX: Math.max(0, Math.min(WINDOWS_WIDTH, winX)),
      winY: Math.max(0, Math.min(WINDOWS_HEIGHT, winY)),
    };
  };

  // Touch handlers for direct interaction on the remote desktop
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isStreaming) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: now };
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };

      const coords = getMappedCoordinates(touch.clientX, touch.clientY);
      if (coords) {
        setMouseIndicator({ x: touch.clientX, y: touch.clientY, active: true });
        // Set long-press timer for right click
        longPressTimerRef.current = setTimeout(() => {
          sendFastControl(
            { type: 'mouse_click', button: 'right', double: false, x: coords.winX, y: coords.winY },
            () => onSendMouseClick('right', false, coords.winX, coords.winY)
          );
          setMouseIndicator({ x: touch.clientX, y: touch.clientY, active: true });
          hapticFeedback.longPress(config.hapticFeedback);
          touchStartRef.current = null;
        }, 500);
      }
    } else if (e.touches.length === 2) {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      twoFingerStartYRef.current = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isStreaming) return;

    if (e.touches.length === 1 && touchStartRef.current) {
      const touch = e.touches[0];
      const dist = Math.hypot(
        touch.clientX - touchStartRef.current.x,
        touch.clientY - touchStartRef.current.y
      );

      // If dragged more than 8px, cancel tap and start dragging / mouse move
      if (dist > 8) {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

        const coords = getMappedCoordinates(touch.clientX, touch.clientY);
        if (coords) {
          if (!isDraggingRef.current) {
            isDraggingRef.current = true;
            sendFastControl(
              { type: 'mouse_down', button: 'left', x: coords.winX, y: coords.winY },
              () => onSendMouseDown('left', coords.winX, coords.winY)
            );
            hapticFeedback.keyPress(config.hapticFeedback);
          } else {
            sendFastControl(
              { type: 'mouse_abs', x: coords.winX, y: coords.winY, screenWidth: 1920, screenHeight: 1080 },
              () => onSendAbsMouse(coords.winX, coords.winY)
            );
          }
          setMouseIndicator({ x: touch.clientX, y: touch.clientY, active: true });
        }
      }
    } else if (e.touches.length === 2) {
      // 2-finger scroll
      const curY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const deltaY = curY - twoFingerStartYRef.current;
      if (Math.abs(deltaY) > 12) {
        const scrollDir = deltaY > 0 ? 1 : -1;
        sendFastControl(
          { type: 'mouse_scroll', dy: scrollDir },
          () => onSendMouseScroll(scrollDir)
        );
        twoFingerStartYRef.current = curY;
        hapticFeedback.scrollTick(config.hapticFeedback);
      }
    }
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      sendFastControl(
        { type: 'mouse_up', button: 'left' },
        () => onSendMouseUp('left')
      );
      hapticFeedback.keyPress(config.hapticFeedback);
    } else if (touchStartRef.current && e.touches.length === 0) {
      const duration = Date.now() - touchStartRef.current.time;
      if (duration < 350) {
        const coords = getMappedCoordinates(touchStartRef.current.x, touchStartRef.current.y);
        if (coords) {
          sendFastControl(
            { type: 'mouse_click', button: 'left', double: false, x: coords.winX, y: coords.winY },
            () => onSendMouseClick('left', false, coords.winX, coords.winY)
          );
          hapticFeedback.trackpadClick(config.hapticFeedback);
          if (isSimulated) {
            setSimWindowsPos({ x: coords.winX / 4, y: coords.winY / 4 });
          }
        }
      }
    }

    touchStartRef.current = null;
    initialPinchDistRef.current = null;
    setTimeout(() => setMouseIndicator(null), 300);
  };

  // Mouse fallback for testing directly in desktop browser
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getMappedCoordinates(e.clientX, e.clientY);
    if (coords) {
      sendFastControl(
        { type: 'mouse_down', button: 'left', x: coords.winX, y: coords.winY },
        () => onSendMouseDown('left', coords.winX, coords.winY)
      );
      isDraggingRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      const coords = getMappedCoordinates(e.clientX, e.clientY);
      if (coords) {
        sendFastControl(
          { type: 'mouse_abs', x: coords.winX, y: coords.winY, screenWidth: 1920, screenHeight: 1080 },
          () => onSendAbsMouse(coords.winX, coords.winY)
        );
      }
    }
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      sendFastControl(
        { type: 'mouse_up', button: 'left' },
        () => onSendMouseUp('left')
      );
    }
  };

  const handleSendQuickText = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInputText.trim()) {
      onSendText(quickInputText);
      hapticFeedback.actionKey(config.hapticFeedback);
      if (isSimulated) {
        setSimTypedCode((prev) => [...prev, quickInputText]);
      }
      setQuickInputText('');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-[#09090b] text-zinc-100 select-none overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 p-2 bg-black' : 'rounded-lg border border-white/8'
      }`}
    >
      {/* Precision Stream Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#121215] border-b border-white/8 shrink-0 text-xs">
        {/* Left: Stream Status & Resolution */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isStreaming
                  ? isSimulated
                    ? 'bg-amber-400'
                    : webrtcState === 'connected' || streamProtocol === 'mjpeg'
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                  : 'bg-zinc-600'
              }`}
            />
            <span className="font-semibold text-zinc-200">
              {isStreaming
                ? isSimulated
                  ? 'Virtual Desktop'
                  : streamProtocol === 'webrtc' && webrtcState === 'connected'
                  ? 'WebRTC Live'
                  : streamProtocol === 'webrtc' && webrtcState === 'connecting'
                  ? 'WebRTC Connecting'
                  : 'MJPEG Stream Live'
                : 'Stream Stopped'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-zinc-500 font-mono text-[11px] tabular-nums">
            <span>·</span>
            <span>1920×1080</span>
            <span>·</span>
            <span>{streamLatency}ms</span>
            <span>·</span>
            <span>{fps} FPS</span>
          </div>
        </div>

        {/* Center/Right: Protocol & Controls Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Protocol Toggle: WebRTC vs MJPEG */}
          <div className="flex items-center p-0.5 bg-[#18181c] border border-white/8 rounded font-mono text-[10px]">
            <button
              onClick={() => {
                setStreamProtocol('webrtc');
                hapticFeedback.selection(config.hapticFeedback);
              }}
              className={`px-2 py-1 rounded transition-colors ${
                streamProtocol === 'webrtc'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              WebRTC
            </button>
            <button
              onClick={() => {
                setStreamProtocol('mjpeg');
                hapticFeedback.selection(config.hapticFeedback);
              }}
              className={`px-2 py-1 rounded transition-colors ${
                streamProtocol === 'mjpeg'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              MJPEG
            </button>
          </div>

          {/* Quality Picker */}
          <select
            value={quality}
            onChange={(e) => {
              const q = e.target.value as any;
              setQuality(q);
              hapticFeedback.scrollTick(config.hapticFeedback);
              if (onStreamConfigChange) onStreamConfigChange(q, fps);
            }}
            className="bg-[#18181c] border border-white/8 hover:border-white/16 text-zinc-300 rounded px-2 py-1 text-[11px] font-mono outline-none cursor-pointer"
          >
            <option value="low">480p</option>
            <option value="med">720p</option>
            <option value="high">1080p</option>
            <option value="ultra">Native</option>
          </select>

          {/* Zoom controls: Out, Reset, In */}
          <div className="flex items-center p-0.5 bg-[#18181c] border border-white/8 rounded font-mono text-[10px]">
            <button
              onClick={() => {
                setZoomLevel((prev) => Math.max(0.5, Math.round((prev - 0.25) * 100) / 100));
                hapticFeedback.selection(config.hapticFeedback);
              }}
              title="Zoom Out"
              className="px-1.5 py-0.5 hover:text-white text-zinc-400 font-bold"
            >
              -
            </button>
            <button
              onClick={() => {
                setZoomLevel(1.0);
                hapticFeedback.selection(config.hapticFeedback);
              }}
              title="Reset Zoom to 100%"
              className="px-1.5 py-0.5 hover:text-white text-zinc-300 font-semibold"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => {
                setZoomLevel((prev) => Math.min(3.0, Math.round((prev + 0.25) * 100) / 100));
                hapticFeedback.selection(config.hapticFeedback);
              }}
              title="Zoom In"
              className="px-1.5 py-0.5 hover:text-white text-zinc-400 font-bold"
            >
              +
            </button>
          </div>

          {/* Fit mode toggle */}
          <button
            onClick={() => {
              setFitMode(fitMode === 'fit' ? 'original' : 'fit');
              hapticFeedback.actionKey(config.hapticFeedback);
            }}
            title="Toggle Fit to Screen / Original Size"
            className="px-2 py-1 rounded bg-[#18181c] border border-white/8 hover:border-white/16 text-zinc-300 font-mono text-[11px]"
          >
            {fitMode === 'fit' ? 'Fit' : '1:1'}
          </button>

          {/* Toggle Virtual Keyboard Drawer */}
          <button
            onClick={() => {
              setShowKeyboardDrawer(!showKeyboardDrawer);
              hapticFeedback.actionKey(config.hapticFeedback);
            }}
            title="Toggle On-Screen Keyboard & Hotkeys"
            className={`p-1.5 rounded transition-colors ${
              showKeyboardDrawer
                ? 'bg-sky-600 text-white'
                : 'bg-[#18181c] border border-white/8 hover:border-white/16 text-zinc-300'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Fullscreen mode"
            className="p-1.5 rounded bg-[#18181c] border border-white/8 hover:border-white/16 text-zinc-300"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Stream Start/Stop Switch */}
          <button
            onClick={() => {
              setIsStreaming(!isStreaming);
              hapticFeedback.actionKey(config.hapticFeedback);
            }}
            className={`px-2.5 py-1 rounded font-medium text-[11px] transition-colors flex items-center gap-1 ${
              isStreaming
                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            {isStreaming ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Start</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Stream Canvas Area with touch-action: none */}
      <div
        className="touch-canvas relative flex-1 bg-black flex items-center justify-center overflow-hidden cursor-crosshair"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Automatic Fallback Toast */}
        {fallbackToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 bg-amber-500/90 text-zinc-950 font-medium text-xs rounded-md shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-1 pointer-events-none">
            {fallbackToast}
          </div>
        )}

        {isStreaming ? (
          !isSimulated && !streamError ? (
            streamProtocol === 'webrtc' ? (
              /* Live WebRTC Video Stream */
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`max-w-full max-h-full transition-transform ${
                  fitMode === 'fit' ? 'object-contain w-full h-full' : 'object-none'
                }`}
                style={{ transform: `scale(${zoomLevel})` }}
              />
            ) : (
              /* Fallback MJPEG Stream */
              <img
                ref={streamImgRef}
                src={streamUrl}
                alt="Windows 11 Live Desktop"
                onError={() => setStreamError(true)}
                className={`max-w-full max-h-full transition-transform ${
                  fitMode === 'fit' ? 'object-contain w-full h-full' : 'object-none'
                }`}
                style={{ transform: `scale(${zoomLevel})` }}
              />
            )
          ) : (
            /* Interactive Simulated Windows 11 Desktop (for browser testing / fallback) */
            <div
              className="relative w-full h-full bg-[#0c1222] flex flex-col justify-between overflow-hidden p-4 select-none"
              style={{ aspectRatio: '16/9' }}
            >
              {/* Windows 11 Desktop Icons */}
              <div className="relative z-10 grid grid-cols-1 gap-3 w-16">
                <div
                  onClick={() => {
                    setSimActiveApp('browser');
                    hapticFeedback.trackpadClick(config.hapticFeedback);
                  }}
                  className="p-1.5 rounded hover:bg-white/10 flex flex-col items-center gap-1 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-zinc-300 font-medium">Browser</span>
                </div>
                <div
                  onClick={() => {
                    setSimActiveApp('editor');
                    hapticFeedback.trackpadClick(config.hapticFeedback);
                  }}
                  className="p-1.5 rounded hover:bg-white/10 flex flex-col items-center gap-1 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                    <Keyboard className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-zinc-300 font-medium">Code</span>
                </div>
              </div>

              {/* Interactive Draggable Window */}
              <div
                className="absolute z-20 w-80 sm:w-[420px] rounded-lg bg-[#121215]/95 border border-white/14 shadow-2xl overflow-hidden animate-in fade-in"
                style={{ left: Math.max(10, simWindowsPos.x), top: Math.max(10, simWindowsPos.y) }}
              >
                <div className="h-7 bg-[#18181c] px-3 flex items-center justify-between border-b border-white/8">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-mono font-medium text-zinc-300">
                      Visual Studio Code — Windows 11
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono">
                    <span>1920×1080</span>
                  </div>
                </div>
                <div className="p-3.5 font-mono text-[11px] text-zinc-300 min-h-[140px] space-y-1">
                  {simTypedCode.map((line, idx) => (
                    <div key={idx} className="flex gap-2.5">
                      <span className="text-zinc-600 select-none w-4">{idx + 1}</span>
                      <span className="text-sky-300">{line}</span>
                    </div>
                  ))}
                  <div className="text-zinc-500 italic pt-2">
                    Tap to move mouse cursor, double-tap to open, drag to move window.
                  </div>
                </div>
              </div>

              {/* Windows 11 Taskbar */}
              <div className="relative z-30 h-10 rounded-lg bg-[#121215]/90 border border-white/8 backdrop-blur-md flex items-center justify-between px-3">
                <div className="flex items-center gap-1.5">
                  <button className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-sky-400">
                    <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                      <div className="bg-sky-400 rounded-xs" />
                      <div className="bg-sky-400 rounded-xs" />
                      <div className="bg-sky-400 rounded-xs" />
                      <div className="bg-sky-400 rounded-xs" />
                    </div>
                  </button>
                  <div className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-zinc-400 text-xs">
                    📁
                  </div>
                  <div className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-zinc-400 text-xs">
                    🌐
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 tabular-nums">
                  <span>ENG</span>
                  <span>10:48 AM</span>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-3 text-zinc-500 p-6 text-center">
            <Monitor className="w-10 h-10 text-zinc-700" />
            <div className="text-sm font-semibold text-zinc-300">Desktop Streaming Suspended</div>
            <p className="text-xs max-w-sm text-zinc-500">
              Click &quot;Start&quot; above to connect directly to the Python companion at{' '}
              <code className="text-zinc-300 font-mono">{config.streamHost}:{config.streamPort}</code>.
            </p>
          </div>
        )}

        {/* Dynamic touch indicator circle */}
        {mouseIndicator && (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400 bg-sky-400/20 w-8 h-8 animate-ping duration-200"
            style={{ left: mouseIndicator.x, top: mouseIndicator.y }}
          />
        )}
      </div>

      {/* Slide-out Virtual Keyboard & Hotkey Drawer */}
      {showKeyboardDrawer && (
        <div className="p-3 bg-[#121215] border-t border-white/8 shrink-0 flex flex-col gap-2.5 animate-in slide-in-from-bottom-2">
          {/* Quick Text Input Line */}
          <form onSubmit={handleSendQuickText} className="flex gap-2">
            <input
              type="text"
              value={quickInputText}
              onChange={(e) => setQuickInputText(e.target.value)}
              placeholder="Type directly into Windows desktop..."
              className="flex-1 bg-[#18181c] border border-white/8 focus:border-sky-500 rounded px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs rounded transition-colors"
            >
              Send
            </button>
          </form>

          {/* Quick Hotkeys & Modifiers Row with Haptic Feedback */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            {[
              { label: 'Enter', action: () => onSendKey('ENTER') },
              { label: 'Esc', action: () => onSendKey('ESCAPE') },
              { label: 'Tab', action: () => onSendKey('TAB') },
              { label: 'Bksp', action: () => onSendKey('BACKSPACE') },
              { label: 'Alt+Tab', action: () => onSendShortcut('alt_tab') },
              { label: 'Win+D', action: () => onSendShortcut('win_d') },
              { label: 'Ctrl+C', action: () => onSendShortcut('ctrl_c') },
              { label: 'Ctrl+V', action: () => onSendShortcut('ctrl_v') },
              { label: 'TaskMgr', action: () => onSendShortcut('ctrl_shift_esc') },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => {
                  btn.action();
                  hapticFeedback.actionKey(config.hapticFeedback);
                }}
                className="px-2.5 py-1 rounded bg-[#18181c] border border-white/8 hover:border-white/16 active:bg-sky-600 active:text-white text-zinc-300 whitespace-nowrap shrink-0 transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Status Information Strip */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e0e11] border-t border-white/6 text-[11px] font-mono text-zinc-500">
        <div>
          Stream:{' '}
          <span className="text-zinc-300 font-medium">
            {streamProtocol === 'webrtc' ? 'WebRTC P2P' : 'HTTP MJPEG'}
          </span>
          <span className="text-zinc-600 mx-1.5">|</span>
          <span className="text-zinc-400">
            {config.streamHost}:{config.streamPort}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>Tap: Click</span>
          <span>·</span>
          <span>Hold: Right-Click</span>
          <span>·</span>
          <span>Drag: Move</span>
          <span>·</span>
          <span>2-Finger: Scroll</span>
        </div>
      </div>
    </div>
  );
};
