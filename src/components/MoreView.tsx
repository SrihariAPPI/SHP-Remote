import React from 'react';
import {
  Music,
  Zap,
  Grid,
  Power,
  Terminal,
  BookOpen,
  Sliders,
  Download,
  Wifi,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { RemoteConfig } from '../types/remote';
import { hapticFeedback } from '../utils/haptics';

interface MoreViewProps {
  onSelectSubView: (viewId: 'media' | 'shortcuts' | 'apps' | 'power' | 'code' | 'guide') => void;
  onOpenSettings: () => void;
  onDownloadZip: () => void;
  config: RemoteConfig;
}

export const MoreView: React.FC<MoreViewProps> = ({
  onSelectSubView,
  onOpenSettings,
  onDownloadZip,
  config,
}) => {
  const haptics = config.hapticFeedback;

  const handleSelect = (viewId: 'media' | 'shortcuts' | 'apps' | 'power' | 'code' | 'guide') => {
    hapticFeedback.selection(haptics);
    onSelectSubView(viewId);
  };

  const sections = [
    {
      id: 'media' as const,
      title: 'Media Controller',
      desc: 'Play, pause, skip, seek and volume sliders',
      icon: Music,
      color: 'text-sky-400',
    },
    {
      id: 'shortcuts' as const,
      title: 'Windows Hotkeys',
      desc: 'Alt+Tab, Win+D, Win+E, Task Manager, Clipboard',
      icon: Zap,
      color: 'text-amber-400',
    },
    {
      id: 'apps' as const,
      title: 'App Launcher',
      desc: 'Chrome, VS Code, File Explorer, Terminal, Calc',
      icon: Grid,
      color: 'text-emerald-400',
    },
    {
      id: 'power' as const,
      title: 'Power & Session',
      desc: 'Lock screen, sleep mode, restart, shutdown',
      icon: Power,
      color: 'text-rose-400',
    },
    {
      id: 'code' as const,
      title: 'Firmware & Companion Code',
      desc: 'ESP32 .ino sketch, Python companion script, requirements',
      icon: Terminal,
      color: 'text-indigo-400',
    },
    {
      id: 'guide' as const,
      title: 'Hardware Setup Manual',
      desc: 'Wiring diagrams, Arduino IDE config, Wi-Fi guide',
      icon: BookOpen,
      color: 'text-teal-400',
    },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full pb-8">
      <div>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Extended Remote Tools</h2>
        <p className="text-xs text-zinc-400 mt-0.5">Control systems, developer tools and hardware firmware</p>
      </div>

      {/* Grid of tool cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => handleSelect(section.id)}
              className="p-4 bg-[#121215] hover:bg-[#18181c] active:bg-[#202026] border border-white/8 hover:border-white/14 rounded-lg text-left transition-colors flex items-center justify-between group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded bg-[#18181c] border border-white/10 flex items-center justify-center shrink-0 ${section.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
                    {section.title}
                  </div>
                  <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                    {section.desc}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
            </button>
          );
        })}
      </div>

      {/* System Actions & Settings */}
      <div className="pt-2 border-t border-white/8 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => {
            hapticFeedback.selection(haptics);
            onOpenSettings();
          }}
          className="p-3.5 bg-[#121215] hover:bg-[#18181c] border border-white/8 rounded-lg text-left transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#18181c] border border-white/10 flex items-center justify-center text-zinc-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">System Settings</div>
              <div className="text-[11px] text-zinc-400">IPs, auth token, mouse sensitivity</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>

        <button
          onClick={() => {
            hapticFeedback.actionKey(haptics);
            onDownloadZip();
          }}
          className="p-3.5 bg-sky-950/30 hover:bg-sky-900/40 border border-sky-500/20 rounded-lg text-left transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-sky-900/50 border border-sky-400/20 flex items-center justify-center text-sky-300">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Download Standalone Package</div>
              <div className="text-[11px] text-sky-300/80">Complete .ZIP (firmware, companion, docs)</div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-sky-400" />
        </button>
      </div>
    </div>
  );
};
