import React from 'react';
import { Wifi, Download, Sliders, Laptop, Terminal, Monitor, Keyboard, Home, Grid, BookOpen } from 'lucide-react';
import { RemoteConfig } from '../types/remote';

export type MainTab = 'home' | 'touchpad' | 'desktop' | 'keyboard' | 'more' | 'code' | 'guide';

interface HeaderProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  isSimulated: boolean;
  setIsSimulated: (sim: boolean) => void;
  isConnected: boolean;
  config: RemoteConfig;
  onOpenSettings: () => void;
  onDownloadZip: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isSimulated,
  setIsSimulated,
  isConnected,
  config,
  onOpenSettings,
  onDownloadZip,
}) => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-3 px-3 sm:px-6 py-2 bg-[#09090b]/95 backdrop-blur-md border-b border-white/8 select-none">
      {/* Zone 1: Single Brand Wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={() => setActiveTab('home')}
          className="text-sm font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-2 focus:outline-none"
        >
          <div className="w-6 h-6 rounded bg-[#18181c] border border-white/12 flex items-center justify-center text-sky-400">
            <Wifi className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono uppercase tracking-wider text-xs sm:text-sm">SHP REMOTE</span>
        </button>
      </div>

      {/* Zone 2: Desktop Segmented Navigation (Hidden on small mobile where BottomNav is used) */}
      <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-zinc-400">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'home'
              ? 'bg-[#18181c] text-white font-semibold border border-white/10'
              : 'hover:text-zinc-200'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('touchpad')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'touchpad'
              ? 'bg-[#18181c] text-white font-semibold border border-white/10'
              : 'hover:text-zinc-200'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Touchpad</span>
        </button>

        <button
          onClick={() => setActiveTab('desktop')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'desktop'
              ? 'bg-[#18181c] text-sky-400 font-semibold border border-sky-500/30'
              : 'hover:text-zinc-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Remote Desktop</span>
        </button>

        <button
          onClick={() => setActiveTab('keyboard')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'keyboard'
              ? 'bg-[#18181c] text-white font-semibold border border-white/10'
              : 'hover:text-zinc-200'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Keyboard</span>
        </button>

        <button
          onClick={() => setActiveTab('more')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'more'
              ? 'bg-[#18181c] text-white font-semibold border border-white/10'
              : 'hover:text-zinc-200'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Tools & More</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'code'
              ? 'bg-[#18181c] text-white font-semibold border border-white/10'
              : 'hover:text-zinc-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Firmware</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'guide'
              ? 'bg-[#18181c] text-white font-semibold border border-white/10'
              : 'hover:text-zinc-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Setup</span>
        </button>
      </nav>

      {/* Zone 3: Connection Status & Quick Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Toggle simulator or live connection */}
        <button
          onClick={() => setIsSimulated(!isSimulated)}
          title="Click to toggle between Simulator and Hardware WebSocket mode"
          className="flex items-center gap-1.5 text-xs text-zinc-300 bg-[#121215] hover:bg-[#18181c] px-2.5 py-1.5 rounded border border-white/8 font-mono transition-colors"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSimulated
                ? 'bg-amber-400'
                : isConnected
                ? 'bg-emerald-400'
                : 'bg-rose-500'
            }`}
          />
          <span className="tabular-nums text-[11px] hidden xs:inline">
            {isSimulated ? 'Simulator' : isConnected ? 'ESP32 Linked' : 'Offline'}
          </span>
        </button>

        {/* Configuration settings modal trigger */}
        <button
          onClick={onOpenSettings}
          title="Network & Stream Settings"
          aria-label="Settings"
          className="p-1.5 text-zinc-400 hover:text-white bg-[#121215] border border-white/8 hover:border-white/14 rounded transition-colors"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Primary Download Button */}
        <button
          onClick={onDownloadZip}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download</span>
          <span>.ZIP</span>
        </button>
      </div>
    </header>
  );
};
