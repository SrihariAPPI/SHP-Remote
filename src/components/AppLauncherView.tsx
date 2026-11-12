import React from 'react';
import { Globe, Folder, Code, FileText, Calculator, Settings, Terminal, ShieldCheck } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

interface AppLauncherViewProps {
  onLaunchApp: (appId: 'browser' | 'explorer' | 'vscode' | 'notepad' | 'calc' | 'settings' | 'terminal') => void;
  hapticsEnabled?: boolean;
}

export const AppLauncherView: React.FC<AppLauncherViewProps> = ({ onLaunchApp, hapticsEnabled = true }) => {
  const apps = [
    { id: 'browser' as const, name: 'Web Browser', exec: 'chrome.exe / msedge.exe', icon: Globe },
    { id: 'explorer' as const, name: 'File Explorer', exec: 'explorer.exe', icon: Folder },
    { id: 'vscode' as const, name: 'VS Code', exec: 'code.cmd', icon: Code },
    { id: 'notepad' as const, name: 'Notepad', exec: 'notepad.exe', icon: FileText },
    { id: 'calc' as const, name: 'Calculator', exec: 'calc.exe', icon: Calculator },
    { id: 'settings' as const, name: 'Settings', exec: 'ms-settings:', icon: Settings },
    { id: 'terminal' as const, name: 'Terminal', exec: 'wt.exe', icon: Terminal },
  ];

  return (
    <div className="flex flex-col h-full gap-2.5 select-none">
      <div className="flex items-center gap-2 p-2.5 rounded bg-[#121215] border border-white/8 text-xs text-zinc-400 font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <span>Strict allowlist: only approved local executables can be launched.</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 overflow-y-auto">
        {apps.map((app) => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              onClick={() => {
                onLaunchApp(app.id);
                hapticFeedback.actionKey(hapticsEnabled);
              }}
              className="p-3 rounded-lg bg-[#121215] border border-white/8 hover:border-white/16 active:bg-[#18181c] text-left transition-colors flex flex-col justify-between gap-3 group"
            >
              <div className="w-8 h-8 rounded bg-[#18181c] border border-white/8 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-200">
                  {app.name}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">
                  {app.exec}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
