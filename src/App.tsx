import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MousePointer,
  Keyboard,
  Music,
  Zap,
  Grid,
  Power,
  Monitor,
  Home,
  ChevronLeft,
} from 'lucide-react';
import { Header, MainTab } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { DashboardOverview } from './components/DashboardOverview';
import { TouchpadView } from './components/TouchpadView';
import { KeyboardView } from './components/KeyboardView';
import { MediaView } from './components/MediaView';
import { ShortcutsView } from './components/ShortcutsView';
import { AppLauncherView } from './components/AppLauncherView';
import { PowerView } from './components/PowerView';
import { RemoteDesktopView } from './components/RemoteDesktopView';
import { VirtualWindowsPreview } from './components/VirtualWindowsPreview';
import { SourceCodeExplorer } from './components/SourceCodeExplorer';
import { SetupGuidesView } from './components/SetupGuidesView';
import { SettingsModal } from './components/SettingsModal';
import { MoreView } from './components/MoreView';
import {
  RemoteConfig,
  DEFAULT_CONFIG,
  LogEntry,
  OutgoingMessage,
} from './types/remote';
import { generateProjectZip, downloadBlob } from './services/zipExport';

const getInitialConfig = (): RemoteConfig => {
  try {
    const saved = localStorage.getItem('shp_remote_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Cleanly normalize legacy tokens or missing keys
      if (!parsed.authToken || parsed.authToken === 'shp_remote_secret_key_2025') {
        parsed.authToken = DEFAULT_CONFIG.authToken;
      }
      if (!parsed.streamToken) {
        parsed.streamToken = parsed.authToken || DEFAULT_CONFIG.streamToken;
      }
      // Migrate legacy template IPs to active hardware configuration
      if (!parsed.esp32Ip || parsed.esp32Ip === '192.168.1.105') {
        parsed.esp32Ip = DEFAULT_CONFIG.esp32Ip;
        parsed.apIp = DEFAULT_CONFIG.apIp;
      }
      if (!parsed.streamHost || parsed.streamHost === '192.168.1.100') {
        parsed.streamHost = DEFAULT_CONFIG.streamHost;
      }
      if (!parsed.ssid || parsed.ssid === 'MyHomeWiFi') {
        parsed.ssid = DEFAULT_CONFIG.ssid;
      }
      if (!parsed.wifiPassword || parsed.wifiPassword === 'MyWiFiPassword') {
        parsed.wifiPassword = DEFAULT_CONFIG.wifiPassword;
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return DEFAULT_CONFIG;
};

const getInitialSimulated = (): boolean => {
  try {
    const saved = localStorage.getItem('shp_remote_simulated');
    if (saved !== null) {
      return saved === 'true';
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  // REAL HARDWARE MODE IS THE PRODUCTION DEFAULT!
  return false;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [moreSubModule, setMoreSubModule] = useState<
    'overview' | 'media' | 'shortcuts' | 'apps' | 'power' | 'code' | 'guide'
  >('overview');

  const [config, setConfig] = useState<RemoteConfig>(getInitialConfig);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(getInitialSimulated);
  const [isConnected, setIsConnected] = useState(false);
  const [isCompanionConnected, setIsCompanionConnected] = useState(false);
  const [incomingWebRtcAnswer, setIncomingWebRtcAnswer] = useState<string | null>(null);
  const [incomingWebRtcIce, setIncomingWebRtcIce] = useState<any | null>(null);

  // Telemetry & Simulated Windows 11 State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 190, y: 150 });
  const [lastClickPos, setLastClickPos] = useState<{ x: number; y: number; time: number } | null>(null);
  const [activeAppWindow, setActiveAppWindow] = useState<string | null>('notepad');
  const [typedTextStream, setTypedTextStream] = useState<string[]>([
    'SHP Remote Windows 11 Controller Active.',
    'Ready for touchpad, keyboard, shortcuts & remote desktop streaming.',
  ]);
  const [volumeHud, setVolumeHud] = useState<{ volume: number; visible: boolean; isMuted: boolean }>({
    volume: 65,
    visible: false,
    isMuted: false,
  });
  const [isLocked, setIsLocked] = useState(false);

  // Real WebSocket reference for ESP32 hardware connection
  const wsRef = useRef<WebSocket | null>(null);
  const volumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Log Entry dispatcher
  const addLog = useCallback(
    (direction: 'out' | 'in', type: LogEntry['type'], payload: Record<string, unknown>) => {
      const entry: LogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        direction,
        type,
        payload,
      };
      setLogs((prev) => [...prev.slice(-49), entry]);
    },
    []
  );

  // Transmit packet over WebSocket or Simulator
  const transmit = useCallback(
    (message: OutgoingMessage) => {
      addLog('out', message.type, message as unknown as Record<string, unknown>);

      if (!isSimulated && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      }
    },
    [isSimulated, addLog]
  );

  // WebSocket Connection Management (Real Hardware Mode)
  useEffect(() => {
    if (isSimulated) {
      setIsConnected(false);
      setIsCompanionConnected(false);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const host = config.esp32Ip || config.apIp || '172.16.27.92';
    const url = `ws://${host}:${config.wsPort}/`;
    let ws: WebSocket;

    try {
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        addLog('in', 'auth', { status: `Connected to ESP32 at ${host}. Authenticating...` });
        ws.send(
          JSON.stringify({
            type: 'auth',
            role: 'ui',
            token: config.authToken,
            clientInfo: 'SHP Remote Client v2.5 (Home Wi-Fi)',
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addLog('in', data.type || 'status', data);
          if (data.type === 'auth_response' && data.success) {
            setIsConnected(true);
          } else if (data.type === 'status') {
            setIsConnected(true);
            setIsCompanionConnected(Boolean(data.companionConnected && data.companionAuthenticated));
          } else if (data.type === 'webrtc_answer') {
            setIncomingWebRtcAnswer(data.sdp);
          } else if (data.type === 'webrtc_ice') {
            setIncomingWebRtcIce(data.candidate);
          }
        } catch (e) {
          console.error(e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsCompanionConnected(false);
        addLog('in', 'status', { status: 'ESP32 Gateway disconnected' });
      };

      ws.onerror = (e) => {
        console.warn('WS error', e);
        setIsConnected(false);
        setIsCompanionConnected(false);
      };
    } catch (e) {
      console.error(e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [isSimulated, config.esp32Ip, config.apIp, config.wsPort, config.authToken, addLog]);

  const handleToggleSimulated = (sim: boolean) => {
    setIsSimulated(sim);
    try {
      localStorage.setItem('shp_remote_simulated', String(sim));
    } catch (e) {}
  };

  const handleSaveConfig = (newCfg: RemoteConfig) => {
    setConfig(newCfg);
    try {
      localStorage.setItem('shp_remote_config', JSON.stringify(newCfg));
    } catch (e) {}
  };

  // Touchpad Mouse Movement Handler
  const handleMouseMove = useCallback(
    (dx: number, dy: number) => {
      transmit({ type: 'mouse_move', dx, dy });
      setCursorPos((prev) => {
        const nextX = Math.max(10, Math.min(360, prev.x + dx));
        const nextY = Math.max(10, Math.min(320, prev.y + dy));
        return { x: nextX, y: nextY };
      });
    },
    [transmit]
  );

  // Absolute Mouse Movement (Remote Desktop direct touch mapping)
  const handleSendAbsMouse = useCallback(
    (x: number, y: number) => {
      transmit({ type: 'mouse_abs', x, y, screenWidth: 1920, screenHeight: 1080 });
      setCursorPos({ x: (x / 1920) * 360, y: (y / 1080) * 320 });
    },
    [transmit]
  );

  const handleSendMouseDown = useCallback(
    (button: 'left' | 'right' | 'middle', x?: number, y?: number) => {
      transmit({ type: 'mouse_down', button, x, y });
    },
    [transmit]
  );

  const handleSendMouseUp = useCallback(
    (button: 'left' | 'right' | 'middle') => {
      transmit({ type: 'mouse_up', button });
    },
    [transmit]
  );

  // Mouse Click Handler
  const handleMouseClick = useCallback(
    (button: 'left' | 'right' | 'middle', double = false, x?: number, y?: number) => {
      transmit({ type: 'mouse_click', button, double, x, y });
      setLastClickPos({
        x: x !== undefined ? (x / 1920) * 360 : cursorPos.x,
        y: y !== undefined ? (y / 1080) * 320 : cursorPos.y,
        time: Date.now(),
      });
    },
    [transmit, cursorPos]
  );

  // Mouse Scroll Handler
  const handleMouseScroll = useCallback(
    (dy: number) => {
      transmit({ type: 'mouse_scroll', dy });
    },
    [transmit]
  );

  // Keyboard Handlers
  const handleSendKey = useCallback(
    (key: string) => {
      transmit({ type: 'key', key });
      if (key === 'ENTER') {
        setTypedTextStream((prev) => [...prev, '']);
      } else if (key === 'BACKSPACE') {
        setTypedTextStream((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), last.slice(0, -1)];
        });
      } else if (key === 'SPACE') {
        setTypedTextStream((prev) => {
          if (prev.length === 0) return [' '];
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), last + ' '];
        });
      } else if (key.length === 1) {
        setTypedTextStream((prev) => {
          if (prev.length === 0) return [key];
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), last + key];
        });
      }
    },
    [transmit]
  );

  const handleKeyDown = useCallback(
    (key: string) => {
      transmit({ type: 'key_down', key });
    },
    [transmit]
  );

  const handleKeyUp = useCallback(
    (key: string) => {
      transmit({ type: 'key_up', key });
    },
    [transmit]
  );

  const handleSendText = useCallback(
    (text: string) => {
      transmit({ type: 'text', text });
      setTypedTextStream((prev) => [...prev, text]);
    },
    [transmit]
  );

  const handleEmergencyRelease = useCallback(() => {
    transmit({ type: 'emergency_release' });
  }, [transmit]);

  // Media Handler
  const handleMediaAction = useCallback(
    (action: 'playpause' | 'next' | 'prev' | 'volumeup' | 'volumedown' | 'mute' | 'stop') => {
      transmit({ type: 'media', action });

      setVolumeHud((prev) => {
        let newVol = prev.volume;
        let muted = prev.isMuted;
        if (action === 'volumeup') newVol = Math.min(100, prev.volume + 5);
        if (action === 'volumedown') newVol = Math.max(0, prev.volume - 5);
        if (action === 'mute') muted = !prev.isMuted;
        return { volume: newVol, visible: true, isMuted: muted };
      });

      if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
      volumeTimerRef.current = setTimeout(() => {
        setVolumeHud((prev) => ({ ...prev, visible: false }));
      }, 2000);
    },
    [transmit]
  );

  // Shortcut Handler
  const handleShortcut = useCallback(
    (combo: 'alt_tab' | 'win_d' | 'win_e' | 'win_r' | 'ctrl_c' | 'ctrl_v' | 'ctrl_z' | 'ctrl_shift_esc' | 'win_l') => {
      transmit({ type: 'shortcut', combination: combo });
      if (combo === 'win_l') {
        setIsLocked(true);
      } else if (combo === 'win_e') {
        setActiveAppWindow('explorer');
      } else if (combo === 'win_d') {
        setActiveAppWindow((prev) => (prev ? null : 'notepad'));
      }
    },
    [transmit]
  );

  // Application Launch Handler
  const handleLaunchApp = useCallback(
    (appId: 'browser' | 'explorer' | 'vscode' | 'notepad' | 'calc' | 'settings' | 'terminal') => {
      transmit({ type: 'launch_app', appId });
      setActiveAppWindow(appId);
    },
    [transmit]
  );

  // Power Action Handler
  const handlePowerAction = useCallback(
    (action: 'lock' | 'sleep' | 'restart' | 'shutdown', confirmed: boolean) => {
      transmit({ type: 'power', action, confirmed });
      if (action === 'lock' || action === 'sleep') {
        setIsLocked(true);
      }
    },
    [transmit]
  );

  // Remote Desktop Stream Configuration Change
  const handleStreamConfigChange = useCallback(
    (quality: 'low' | 'med' | 'high' | 'ultra', fps: number) => {
      transmit({ type: 'stream_request', action: 'quality', quality, fps });
      setConfig((c) => ({ ...c, streamQuality: quality, streamFps: fps }));
    },
    [transmit]
  );

  // 1-Click ZIP Downloader
  const handleDownloadZip = async () => {
    try {
      const blob = await generateProjectZip(config);
      downloadBlob(blob, 'SHP-REMOTE-PROJECT.zip');
    } catch (e) {
      console.error('ZIP generation error', e);
    }
  };

  // Bottom Navigation selector mapping
  const handleBottomNavSelect = (tab: NavTab) => {
    if (tab === 'more') {
      setActiveTab('more');
      setMoreSubModule('overview');
    } else {
      setActiveTab(tab as MainTab);
    }
  };

  const handleNavigateFromHome = (
    targetTab: 'touchpad' | 'desktop' | 'keyboard' | 'more',
    moreModule?: 'media' | 'shortcuts' | 'apps' | 'power' | 'code' | 'guide'
  ) => {
    if (targetTab === 'more' && moreModule) {
      setActiveTab('more');
      setMoreSubModule(moreModule);
    } else {
      setActiveTab(targetTab);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-200">
      {/* Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSimulated={isSimulated}
        setIsSimulated={handleToggleSimulated}
        isConnected={isConnected}
        config={config}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDownloadZip={handleDownloadZip}
      />

      {/* Main Content Viewport with mobile bottom nav safe-area padding */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-3 pb-20 md:pb-5">
        {/* VIEW 1: HOME DASHBOARD OVERVIEW */}
        {activeTab === 'home' && (
          <DashboardOverview
            config={config}
            isSimulated={isSimulated}
            isConnected={isConnected}
            isCompanionConnected={isCompanionConnected}
            logs={logs}
            volumeHud={volumeHud}
            onNavigateTab={handleNavigateFromHome}
            onShortcut={handleShortcut}
            onMediaAction={handleMediaAction}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* VIEW 2: PRECISION TOUCHPAD & HARDWARE CONTROLS DECK */}
        {activeTab === 'touchpad' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">
            {/* Left Column: Touchpad Canvas */}
            <div className="flex flex-col gap-2.5 lg:col-span-7">
              <div className="flex-1 rounded-lg bg-[#121215] border border-white/8 p-3.5 flex flex-col min-h-[460px]">
                <TouchpadView
                  onMouseMove={handleMouseMove}
                  onMouseClick={handleMouseClick}
                  onMouseScroll={handleMouseScroll}
                  config={config}
                  onUpdateSensitivity={(val) => setConfig((c) => ({ ...c, mouseSensitivity: val }))}
                />
              </div>
            </div>

            {/* Right Column: Virtual Windows 11 Desktop Preview & Telemetry Inspector */}
            <div className="flex flex-col gap-2.5 lg:col-span-5">
              <VirtualWindowsPreview
                logs={logs}
                cursorPos={cursorPos}
                lastClickPos={lastClickPos}
                activeAppWindow={activeAppWindow}
                onCloseAppWindow={() => setActiveAppWindow(null)}
                typedTextStream={typedTextStream}
                volumeHud={volumeHud}
                isLocked={isLocked}
                onUnlock={() => setIsLocked(false)}
                config={config}
                isSimulated={isSimulated}
                setIsSimulated={handleToggleSimulated}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: FULL REMOTE DESKTOP */}
        {activeTab === 'desktop' && (
          <div className="flex-1 flex flex-col min-h-[520px]">
            <RemoteDesktopView
              config={config}
              isSimulated={isSimulated}
              onSendAbsMouse={handleSendAbsMouse}
              onSendMouseDown={handleSendMouseDown}
              onSendMouseUp={handleSendMouseUp}
              onSendMouseClick={handleMouseClick}
              onSendMouseScroll={handleMouseScroll}
              onSendKey={handleSendKey}
              onSendText={handleSendText}
              onSendShortcut={handleShortcut}
              onStreamConfigChange={handleStreamConfigChange}
              onSendWebRtcSignal={transmit}
              incomingWebRtcAnswer={incomingWebRtcAnswer}
              incomingWebRtcIce={incomingWebRtcIce}
            />
          </div>
        )}

        {/* VIEW 4: FULL KEYBOARD */}
        {activeTab === 'keyboard' && (
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
            <div className="rounded-lg bg-[#121215] border border-white/8 p-4">
              <KeyboardView
                onSendKey={handleSendKey}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onSendText={handleSendText}
                onEmergencyRelease={handleEmergencyRelease}
                hapticsEnabled={config.hapticFeedback}
              />
            </div>
          </div>
        )}

        {/* VIEW 5: EXTENDED TOOLS (MORE) */}
        {activeTab === 'more' && (
          <div className="flex-1 flex flex-col">
            {moreSubModule !== 'overview' && (
              <div className="mb-3">
                <button
                  onClick={() => setMoreSubModule('overview')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-[#121215] border border-white/8 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to All Tools</span>
                </button>
              </div>
            )}

            {moreSubModule === 'overview' && (
              <MoreView
                config={config}
                onSelectSubView={(sub) => setMoreSubModule(sub)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onDownloadZip={handleDownloadZip}
              />
            )}

            {moreSubModule === 'media' && (
              <div className="max-w-2xl mx-auto w-full rounded-lg bg-[#121215] border border-white/8 p-4">
                <MediaView
                  onMediaAction={handleMediaAction}
                  hapticsEnabled={config.hapticFeedback}
                />
              </div>
            )}

            {moreSubModule === 'shortcuts' && (
              <div className="max-w-3xl mx-auto w-full rounded-lg bg-[#121215] border border-white/8 p-4">
                <ShortcutsView
                  onShortcut={handleShortcut}
                  hapticsEnabled={config.hapticFeedback}
                />
              </div>
            )}

            {moreSubModule === 'apps' && (
              <div className="max-w-3xl mx-auto w-full rounded-lg bg-[#121215] border border-white/8 p-4">
                <AppLauncherView
                  onLaunchApp={handleLaunchApp}
                  hapticsEnabled={config.hapticFeedback}
                />
              </div>
            )}

            {moreSubModule === 'power' && (
              <div className="max-w-2xl mx-auto w-full rounded-lg bg-[#121215] border border-white/8 p-4">
                <PowerView
                  onPowerAction={handlePowerAction}
                  hapticsEnabled={config.hapticFeedback}
                />
              </div>
            )}

            {moreSubModule === 'code' && (
              <SourceCodeExplorer
                config={config}
                onDownloadZip={handleDownloadZip}
              />
            )}

            {moreSubModule === 'guide' && (
              <SetupGuidesView config={config} />
            )}
          </div>
        )}

        {/* VIEW 6: DIRECT SOURCE CODE TAB */}
        {activeTab === 'code' && (
          <div className="flex-1">
            <SourceCodeExplorer
              config={config}
              onDownloadZip={handleDownloadZip}
            />
          </div>
        )}

        {/* VIEW 7: DIRECT SETUP MANUAL TAB */}
        {activeTab === 'guide' && (
          <div className="flex-1">
            <SetupGuidesView config={config} />
          </div>
        )}
      </main>

      {/* Mobile-First Bottom Navigation (5 tabs: Home, Touchpad, Desktop, Keyboard, More) */}
      <BottomNav
        currentTab={
          activeTab === 'home'
            ? 'home'
            : activeTab === 'touchpad'
            ? 'touchpad'
            : activeTab === 'desktop'
            ? 'desktop'
            : activeTab === 'keyboard'
            ? 'keyboard'
            : 'more'
        }
        onSelectTab={handleBottomNavSelect}
        hapticsEnabled={config.hapticFeedback}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}
