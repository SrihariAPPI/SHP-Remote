import React from 'react';
import {
  Layers,
  Monitor,
  FolderOpen,
  Terminal,
  Activity,
  Copy,
  ClipboardPaste,
  Undo2,
  Lock,
} from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

interface ShortcutsViewProps {
  onShortcut: (
    combo:
      | 'alt_tab'
      | 'win_d'
      | 'win_e'
      | 'win_r'
      | 'ctrl_c'
      | 'ctrl_v'
      | 'ctrl_z'
      | 'ctrl_shift_esc'
      | 'win_l'
  ) => void;
  hapticsEnabled?: boolean;
}

export const ShortcutsView: React.FC<ShortcutsViewProps> = ({ onShortcut, hapticsEnabled = true }) => {
  const shortcuts = [
    { id: 'alt_tab' as const, label: 'Alt + Tab', desc: 'App Switcher', icon: Layers },
    { id: 'win_d' as const, label: 'Win + D', desc: 'Show Desktop', icon: Monitor },
    { id: 'win_e' as const, label: 'Win + E', desc: 'File Explorer', icon: FolderOpen },
    { id: 'win_r' as const, label: 'Win + R', desc: 'Run Command', icon: Terminal },
    { id: 'ctrl_shift_esc' as const, label: 'Ctrl+Shift+Esc', desc: 'Task Manager', icon: Activity },
    { id: 'ctrl_c' as const, label: 'Ctrl + C', desc: 'Copy Selection', icon: Copy },
    { id: 'ctrl_v' as const, label: 'Ctrl + V', desc: 'Paste Clipboard', icon: ClipboardPaste },
    { id: 'ctrl_z' as const, label: 'Ctrl + Z', desc: 'Undo Action', icon: Undo2 },
    { id: 'win_l' as const, label: 'Win + L', desc: 'Lock Screen', icon: Lock },
  ];

  return (
    <div className="flex flex-col h-full gap-2.5 select-none">
      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
        <span>Windows Hotkeys</span>
        <span className="text-[11px] text-zinc-500">PyAutoGUI Win32</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 overflow-y-auto">
        {shortcuts.map((sc) => {
          const Icon = sc.icon;
          return (
            <button
              key={sc.id}
              onClick={() => {
                onShortcut(sc.id);
                hapticFeedback.actionKey(hapticsEnabled);
              }}
              className="p-3 rounded-lg bg-[#121215] border border-white/8 hover:border-white/16 active:bg-[#18181c] text-left transition-colors flex flex-col justify-between gap-3 group"
            >
              <div className="w-7 h-7 rounded bg-[#18181c] border border-white/8 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-mono font-semibold text-zinc-200">
                  {sc.label}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {sc.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
