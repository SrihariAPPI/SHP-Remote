import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Terminal,
  Volume2,
  Lock,
  Globe,
  Folder,
  Code,
  FileText,
  Calculator,
  Settings,
  X,
  Minus,
  Square,
} from 'lucide-react';
import { LogEntry, RemoteConfig } from '../types/remote';

interface VirtualWindowsPreviewProps {
  logs: LogEntry[];
  cursorPos: { x: number; y: number };
  lastClickPos: { x: number; y: number; time: number } | null;
  activeAppWindow: string | null;
  onCloseAppWindow: () => void;
  typedTextStream: string[];
  volumeHud: { volume: number; visible: boolean; isMuted: boolean };
  isLocked: boolean;
  onUnlock: () => void;
  config: RemoteConfig;
  isSimulated: boolean;
  setIsSimulated: (val: boolean) => void;
}

export const VirtualWindowsPreview: React.FC<VirtualWindowsPreviewProps> = ({
  logs,
  cursorPos,
  lastClickPos,
  activeAppWindow,
  onCloseAppWindow,
  typedTextStream,
  volumeHud,
  isLocked,
  onUnlock,
  config,
  isSimulated,
  setIsSimulated,
}) => {
  const [activeTab, setActiveTab] = useState<'desktop' | 'packets'>('desktop');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full gap-2.5">
      {/* Top Controls: Switch between Desktop View & Packet Inspector */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#121215] border border-white/8">
        <div className="flex items-center gap-1 bg-[#18181c] p-0.5 rounded border border-white/6 font-mono text-xs">
          <button
            onClick={() => setActiveTab('desktop')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'desktop'
                ? 'bg-[#202025] text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Live Screen
          </button>
          <button
            onClick={() => setActiveTab('packets')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'packets'
                ? 'bg-[#202025] text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3 h-3 text-zinc-400" />
            <span>Packets ({logs.length})</span>
          </button>
        </div>

        {/* Engine mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulated(!isSimulated)}
            className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors ${
              isSimulated
                ? 'bg-sky-950/40 text-sky-300 border-sky-500/30'
                : 'bg-[#18181c] text-zinc-400 border-white/8'
            }`}
          >
            {isSimulated ? '✓ Simulator Engine' : 'Hardware Target'}
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 min-h-[440px] rounded-lg bg-[#09090b] border border-white/8 overflow-hidden relative flex flex-col">
        {activeTab === 'desktop' ? (
          <div className="relative flex-1 flex flex-col bg-gradient-to-br from-[#0a0f1d] via-[#090c15] to-[#0c1322] overflow-hidden select-none">
            {/* Windows 11 Lock Screen Overlay */}
            {isLocked ? (
              <div className="absolute inset-0 z-40 bg-[#09090b]/90 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center p-6">
                <div className="w-12 h-12 rounded bg-[#18181c] border border-white/12 flex items-center justify-center text-zinc-300">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Workstation Locked</h3>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">Win32 Session Suspended (Win+L)</p>
                </div>
                <button
                  onClick={onUnlock}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded transition-colors font-mono"
                >
                  Unlock Session
                </button>
              </div>
            ) : null}

            {/* Desktop Workspace Area */}
            <div className="relative flex-1 p-3 overflow-hidden">
              {/* Desktop Icons */}
              <div className="grid grid-cols-1 gap-3 w-16">
                <div className="flex flex-col items-center gap-1 p-1 rounded hover:bg-white/6 cursor-pointer">
                  <Globe className="w-6 h-6 text-sky-400" />
                  <span className="text-[10px] text-zinc-300 font-mono">Chrome</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-1 rounded hover:bg-white/6 cursor-pointer">
                  <Folder className="w-6 h-6 text-amber-400" />
                  <span className="text-[10px] text-zinc-300 font-mono">Explorer</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-1 rounded hover:bg-white/6 cursor-pointer">
                  <Code className="w-6 h-6 text-blue-400" />
                  <span className="text-[10px] text-zinc-300 font-mono">VSCode</span>
                </div>
              </div>

              {/* Volume HUD Floating Overlay */}
              {volumeHud.visible && (
                <div className="absolute top-3 left-3 z-30 flex items-center gap-3 px-3.5 py-2.5 rounded bg-[#121215]/95 border border-white/14 shadow-xl font-mono">
                  <Volume2 className="w-4 h-4 text-sky-400" />
                  <div className="w-28 h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-sky-400"
                      style={{ width: `${volumeHud.isMuted ? 0 : volumeHud.volume}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {volumeHud.isMuted ? 'MUTE' : `${volumeHud.volume}`}
                  </span>
                </div>
              )}

              {/* Active Application Window */}
              {activeAppWindow && (
                <div className="absolute top-10 left-12 sm:left-20 w-72 sm:w-88 rounded bg-[#121215] border border-white/12 shadow-2xl flex flex-col overflow-hidden z-20">
                  <div className="h-7 bg-[#18181c] px-2.5 flex items-center justify-between border-b border-white/8">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3 text-sky-400" />
                      <span className="text-[11px] font-mono font-medium text-zinc-300 capitalize">
                        {activeAppWindow}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500">
                      <button className="w-3.5 h-3.5 flex items-center justify-center hover:text-white">
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <button className="w-3.5 h-3.5 flex items-center justify-center hover:text-white">
                        <Square className="w-2 h-2" />
                      </button>
                      <button onClick={onCloseAppWindow} className="w-3.5 h-3.5 flex items-center justify-center hover:text-rose-400">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 min-h-[120px] text-xs font-mono text-zinc-300 overflow-y-auto max-h-40">
                    {typedTextStream.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {typedTextStream.map((line, idx) => (
                          <div key={idx} className="flex gap-2">
                            <span className="text-zinc-600 select-none">{idx + 1}</span>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-zinc-600 italic">
                        Type using the phone keyboard above...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Simulated Windows 11 Cursor */}
              <div
                className="absolute pointer-events-none transition-transform duration-75 ease-out z-30"
                style={{
                  transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`,
                }}
              >
                <svg
                  className="w-4 h-4 text-white fill-white stroke-black stroke-[1.2]"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.428z" />
                </svg>
              </div>

              {/* Click Indicator */}
              {lastClickPos && (
                <div
                  key={lastClickPos.time}
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400 bg-sky-400/20 w-8 h-8 animate-ping duration-200 z-20"
                  style={{
                    left: lastClickPos.x,
                    top: lastClickPos.y,
                  }}
                />
              )}
            </div>

            {/* Windows 11 Taskbar */}
            <div className="h-10 bg-[#121215]/95 border-t border-white/8 flex items-center justify-between px-3 z-30">
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 rounded hover:bg-white/6 flex items-center justify-center text-sky-400">
                  <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                    <div className="bg-sky-400 rounded-xs" />
                    <div className="bg-sky-400 rounded-xs" />
                    <div className="bg-sky-400 rounded-xs" />
                    <div className="bg-sky-400 rounded-xs" />
                  </div>
                </button>
                <div className="w-7 h-7 rounded hover:bg-white/6 flex items-center justify-center text-sky-400">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div className="w-7 h-7 rounded hover:bg-white/6 flex items-center justify-center text-amber-400">
                  <Folder className="w-3.5 h-3.5" />
                </div>
                <div className="w-7 h-7 rounded hover:bg-white/6 flex items-center justify-center text-blue-400">
                  <Code className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono tabular-nums">
                <Volume2 className="w-3 h-3 text-zinc-500" />
                <span>{currentTime}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Packet Inspector Terminal View */
          <div className="flex-1 flex flex-col p-3 bg-[#09090b] font-mono text-xs overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/8 text-zinc-500 text-[10px]">
              <span>TIME</span>
              <span>DIR</span>
              <span>TYPE</span>
              <span>PAYLOAD</span>
            </div>

            <div className="flex-1 flex flex-col gap-1 py-1.5">
              {logs.length === 0 ? (
                <div className="text-zinc-600 italic py-6 text-center text-xs">
                  No packets recorded yet. Move touchpad or click to generate telemetry.
                </div>
              ) : (
                logs.slice(-25).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-3 py-0.5 border-b border-white/4 hover:bg-white/2 px-1 rounded text-[11px]"
                  >
                    <span className="text-zinc-500 tabular-nums shrink-0">{log.time}</span>
                    <span
                      className={`px-1 py-0.2 rounded font-bold shrink-0 text-[10px] ${
                        log.direction === 'out' ? 'text-sky-400' : 'text-emerald-400'
                      }`}
                    >
                      {log.direction === 'out' ? '→ OUT' : '← IN'}
                    </span>
                    <span className="text-zinc-200 font-semibold shrink-0">{log.type}</span>
                    <span className="text-zinc-500 truncate flex-1 text-right">
                      {JSON.stringify(log.payload)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Coordinate & Gateway status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded bg-[#121215] border border-white/8 text-[11px] font-mono text-zinc-500">
        <div>
          Cursor: <span className="text-zinc-300 font-semibold tabular-nums">{cursorPos.x}px, {cursorPos.y}px</span>
        </div>
        <div>
          Relay: <span className="text-zinc-300">ws://{config.apIp}:{config.wsPort}</span>
        </div>
      </div>
    </div>
  );
};
