import React from 'react';
import {
  Wifi,
  Laptop,
  Monitor,
  MousePointer,
  Keyboard,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Sliders,
  Folder,
  Activity,
  Lock,
  Layers,
  Power,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Info,
} from 'lucide-react';
import { RemoteConfig, LogEntry } from '../types/remote';
import { hapticFeedback } from '../utils/haptics';

interface DashboardOverviewProps {
  config: RemoteConfig;
  isSimulated: boolean;
  isConnected: boolean;
  isCompanionConnected?: boolean;
  logs: LogEntry[];
  volumeHud: { volume: number; visible: boolean; isMuted: boolean };
  onNavigateTab: (tab: 'touchpad' | 'desktop' | 'keyboard' | 'more', moreModule?: 'media' | 'shortcuts' | 'apps' | 'power' | 'code' | 'guide') => void;
  onShortcut: (combo: 'alt_tab' | 'win_d' | 'win_e' | 'win_r' | 'ctrl_c' | 'ctrl_v' | 'ctrl_z' | 'ctrl_shift_esc' | 'win_l') => void;
  onMediaAction: (action: 'playpause' | 'next' | 'prev' | 'volumeup' | 'volumedown' | 'mute' | 'stop') => void;
  onOpenSettings: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  config,
  isSimulated,
  isConnected,
  isCompanionConnected = false,
  logs,
  volumeHud,
  onNavigateTab,
  onShortcut,
  onMediaAction,
  onOpenSettings,
}) => {
  const haptics = config.hapticFeedback;
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const esp32TargetIp = config.esp32Ip || config.apIp || '172.16.27.92';

  const handleShortcutClick = (combo: any) => {
    hapticFeedback.actionKey(haptics);
    onShortcut(combo);
  };

  const handleMediaClick = (action: any) => {
    hapticFeedback.mediaButton(haptics);
    onMediaAction(action);
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
      {/* HTTPS / Mixed-Content Architectural Notice on Vercel */}
      {isHttps && !isConnected && !isSimulated && (
        <div className="p-4 bg-sky-950/30 border border-sky-500/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-zinc-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-white">
                Vercel HTTPS &amp; Local Network Architecture Notice
              </div>
              <div className="text-zinc-300">
                Browsers enforce HTTPS origin isolation and block unencrypted WebSocket calls to local LAN IP (<code className="text-sky-300">{esp32TargetIp}</code>).
              </div>
              <div className="text-[11px] text-zinc-400">
                <strong>Recommended Solutions (No security downgrade needed):</strong>
                <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-zinc-300">
                  <li><strong>WebRTC Desktop:</strong> Switch to the Desktop tab. Encrypted DTLS WebRTC P2P streams and control channels operate natively over HTTPS.</li>
                  <li><strong>Direct LAN Access:</strong> Open <a href={`http://${esp32TargetIp}`} target="_blank" rel="noreferrer" className="underline text-sky-400 font-mono">http://{esp32TargetIp}</a> or <code className="text-sky-300 font-mono">http://&lt;PC_IP&gt;:8082</code> directly on your phone (pure HTTP origin with 0 mixed-content limits).</li>
                </ul>
              </div>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/40 rounded text-xs font-semibold text-sky-200 whitespace-nowrap shrink-0 transition-colors"
          >
            Network Settings
          </button>
        </div>
      )}

      {/* Top Banner / System Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Device 1: ESP32 Access Point / Station Gateway */}
        <div className="p-3.5 bg-[#121215] border border-white/8 rounded-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#18181c] border border-white/10 flex items-center justify-center text-sky-400">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white tracking-tight">ESP32 Gateway</h3>
                <p className="text-[11px] font-mono text-zinc-400">{esp32TargetIp}:{config.wsPort}</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                isSimulated
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  : isConnected
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSimulated ? 'bg-amber-400' : isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              {isSimulated ? 'Simulation' : isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/6 flex items-center justify-between text-[11px] text-zinc-400">
            <span>SSID: <strong className="font-mono text-zinc-300">{config.ssid}</strong></span>
            <span>Mode: <strong className="font-mono text-zinc-300">Station (DHCP)</strong></span>
          </div>
        </div>

        {/* Device 2: Windows 11 Laptop Companion */}
        <div className="p-3.5 bg-[#121215] border border-white/8 rounded-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#18181c] border border-white/10 flex items-center justify-center text-sky-400">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white tracking-tight">Windows 11 Companion</h3>
                <p className="text-[11px] font-mono text-zinc-400">{config.streamHost}</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                isSimulated
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  : isConnected && isCompanionConnected
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : isConnected
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {isConnected && isCompanionConnected ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : isConnected ? (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              )}
              {isSimulated ? 'Virtual' : isConnected && isCompanionConnected ? 'Linked' : isConnected ? 'Waiting PC' : 'Offline'}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/6 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Resolution: <strong className="font-mono text-zinc-300">1920×1080</strong></span>
            <span>Auth: <strong className="font-mono text-zinc-300">{isConnected ? 'Verified' : 'Token'}</strong></span>
          </div>
        </div>

        {/* Device 3: Desktop Streaming Channel */}
        <div className="p-3.5 bg-[#121215] border border-white/8 rounded-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#18181c] border border-white/10 flex items-center justify-center text-sky-400">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white tracking-tight">WebRTC Streamer</h3>
                <p className="text-[11px] font-mono text-zinc-400">{config.streamHost}:{config.streamPort}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
              {config.streamFps} FPS
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/6 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Protocol: <strong className="font-mono text-zinc-300">WebRTC / MJPEG</strong></span>
            <span>P2P: <strong className="font-mono text-emerald-400">~12ms</strong></span>
          </div>
        </div>
      </div>

      {/* Quick Launchpad Buttons (Primary User Paths) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => {
            hapticFeedback.selection(haptics);
            onNavigateTab('touchpad');
          }}
          className="p-3 bg-[#121215] hover:bg-[#18181c] active:bg-[#1e1e24] border border-white/8 rounded-lg text-left transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#18181c] group-hover:bg-[#222228] border border-white/10 flex items-center justify-center text-sky-400">
              <MousePointer className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Touchpad</div>
              <div className="text-[10px] text-zinc-400">Mouse &amp; gestures</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
        </button>

        <button
          onClick={() => {
            hapticFeedback.selection(haptics);
            onNavigateTab('desktop');
          }}
          className="p-3 bg-[#121215] hover:bg-[#18181c] active:bg-[#1e1e24] border border-white/8 rounded-lg text-left transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#18181c] group-hover:bg-[#222228] border border-white/10 flex items-center justify-center text-sky-400">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Remote Screen</div>
              <div className="text-[10px] text-zinc-400">Live WebRTC mirror</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
        </button>

        <button
          onClick={() => {
            hapticFeedback.selection(haptics);
            onNavigateTab('keyboard');
          }}
          className="p-3 bg-[#121215] hover:bg-[#18181c] active:bg-[#1e1e24] border border-white/8 rounded-lg text-left transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#18181c] group-hover:bg-[#222228] border border-white/10 flex items-center justify-center text-sky-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Keyboard</div>
              <div className="text-[10px] text-zinc-400">QWERTY &amp; text</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
        </button>

        <button
          onClick={() => {
            hapticFeedback.selection(haptics);
            onNavigateTab('more', 'power');
          }}
          className="p-3 bg-[#121215] hover:bg-[#18181c] active:bg-[#1e1e24] border border-white/8 rounded-lg text-left transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#18181c] group-hover:bg-[#222228] border border-white/10 flex items-center justify-center text-rose-400">
              <Power className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Power &amp; Sleep</div>
              <div className="text-[10px] text-zinc-400">Lock, sleep, shut</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
        </button>
      </div>

      {/* Main Control Panel: Quick Hotkeys & Audio Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Quick Hotkeys Bar */}
        <div className="p-4 bg-[#121215] border border-white/8 rounded-lg flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Windows 11 Quick Hotkeys</h2>
            </div>
            <button
              onClick={() => onNavigateTab('more', 'shortcuts')}
              className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleShortcutClick('win_d')}
              className="py-2.5 px-3 bg-[#18181c] hover:bg-[#202026] active:bg-[#272730] border border-white/8 rounded text-left transition-colors"
            >
              <div className="text-xs font-semibold text-white">Desktop</div>
              <div className="text-[10px] font-mono text-zinc-400">Win + D</div>
            </button>

            <button
              onClick={() => handleShortcutClick('win_e')}
              className="py-2.5 px-3 bg-[#18181c] hover:bg-[#202026] active:bg-[#272730] border border-white/8 rounded text-left transition-colors"
            >
              <div className="text-xs font-semibold text-white">Explorer</div>
              <div className="text-[10px] font-mono text-zinc-400">Win + E</div>
            </button>

            <button
              onClick={() => handleShortcutClick('ctrl_shift_esc')}
              className="py-2.5 px-3 bg-[#18181c] hover:bg-[#202026] active:bg-[#272730] border border-white/8 rounded text-left transition-colors"
            >
              <div className="text-xs font-semibold text-white">Task Mgr</div>
              <div className="text-[10px] font-mono text-zinc-400">Ctrl+Shift+Esc</div>
            </button>

            <button
              onClick={() => handleShortcutClick('win_l')}
              className="py-2.5 px-3 bg-[#18181c] hover:bg-[#202026] active:bg-[#272730] border border-white/8 rounded text-left transition-colors"
            >
              <div className="text-xs font-semibold text-white">Lock PC</div>
              <div className="text-[10px] font-mono text-zinc-400">Win + L</div>
            </button>
          </div>
        </div>

        {/* Master Audio & Playback Control */}
        <div className="p-4 bg-[#121215] border border-white/8 rounded-lg flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Audio &amp; Playback</h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {volumeHud.isMuted ? 'Muted' : `${volumeHud.volume}%`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMediaClick('mute')}
              className={`p-2.5 rounded border transition-colors ${
                volumeHud.isMuted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-[#18181c] text-zinc-300 hover:text-white border-white/8'
              }`}
            >
              {volumeHud.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume1 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => handleMediaClick('volumedown')}
              className="flex-1 py-2 px-3 bg-[#18181c] hover:bg-[#202026] active:bg-[#272730] border border-white/8 rounded text-xs font-medium text-zinc-200 transition-colors"
            >
              Vol -5%
            </button>

            <button
              onClick={() => handleMediaClick('volumeup')}
              className="flex-1 py-2 px-3 bg-[#18181c] hover:bg-[#202026] active:bg-[#272730] border border-white/8 rounded text-xs font-medium text-zinc-200 transition-colors"
            >
              Vol +5%
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-white/6">
            <button
              onClick={() => handleMediaClick('prev')}
              className="flex-1 py-1.5 bg-[#18181c] hover:bg-[#202026] border border-white/8 rounded text-zinc-300 hover:text-white flex items-center justify-center"
              title="Previous Track"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleMediaClick('playpause')}
              className="flex-2 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              title="Play / Pause"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play / Pause</span>
            </button>
            <button
              onClick={() => handleMediaClick('next')}
              className="flex-1 py-1.5 bg-[#18181c] hover:bg-[#202026] border border-white/8 rounded text-zinc-300 hover:text-white flex items-center justify-center"
              title="Next Track"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Network & Station Details Card */}
      <div className="p-4 bg-[#121215] border border-white/8 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#18181c] border border-white/10 flex items-center justify-center text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Home Wi-Fi Architecture Active</div>
            <div className="text-[11px] text-zinc-400">
              ESP32 &amp; PC connected to router: Control and WebRTC signaling routed via ESP32, desktop video streams P2P over Wi-Fi.
            </div>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="px-3 py-1.5 bg-[#18181c] hover:bg-[#202026] border border-white/10 rounded text-xs font-medium text-zinc-200 flex items-center gap-1.5 whitespace-nowrap self-end sm:self-auto transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Configure Wi-Fi &amp; IPs</span>
        </button>
      </div>

      {/* Monospace Packet Stream Preview */}
      <div className="p-3.5 bg-[#0e0e11] border border-white/8 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
              Live Telemetry &amp; Commands
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {logs.length} packets logged
          </span>
        </div>

        <div className="space-y-1 font-mono text-[11px] max-h-24 overflow-y-auto pr-1">
          {logs.slice(-4).reverse().map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 text-zinc-400">
              <span className="text-zinc-600 text-[10px]">{entry.time}</span>
              <span className={entry.direction === 'out' ? 'text-sky-400' : 'text-emerald-400'}>
                {entry.direction === 'out' ? '→' : '←'}
              </span>
              <span className="text-zinc-300 font-semibold">{entry.type}</span>
              <span className="text-zinc-500 truncate">{JSON.stringify(entry.payload)}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-zinc-600 text-xs italic">Awaiting transmission events...</div>
          )}
        </div>
      </div>
    </div>
  );
};
