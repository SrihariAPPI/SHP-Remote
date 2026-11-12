import React, { useState } from 'react';
import { Lock, Moon, RotateCcw, Power, AlertTriangle, ShieldCheck } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

interface PowerViewProps {
  onPowerAction: (action: 'lock' | 'sleep' | 'restart' | 'shutdown', confirmed: boolean) => void;
  hapticsEnabled?: boolean;
}

export const PowerView: React.FC<PowerViewProps> = ({ onPowerAction, hapticsEnabled = true }) => {
  const [pendingAction, setPendingAction] = useState<'restart' | 'shutdown' | null>(null);

  const handleActionClick = (action: 'lock' | 'sleep' | 'restart' | 'shutdown') => {
    hapticFeedback.actionKey(hapticsEnabled);
    if (action === 'lock' || action === 'sleep') {
      onPowerAction(action, true);
    } else {
      setPendingAction(action);
    }
  };

  const confirmDestructiveAction = () => {
    if (pendingAction) {
      hapticFeedback.actionKey(hapticsEnabled);
      onPowerAction(pendingAction, true);
      setPendingAction(null);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 select-none justify-center">
      <div className="flex items-center gap-2 p-2.5 rounded bg-[#121215] border border-white/8 text-xs text-zinc-400 font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <span>Windows Session State Management</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Instant Safe Controls */}
        <button
          onClick={() => handleActionClick('lock')}
          className="p-3.5 rounded-lg bg-[#121215] border border-white/8 hover:border-white/16 active:bg-[#18181c] text-left transition-colors flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded bg-[#18181c] border border-white/8 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">
              Lock Workstation
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Win32 LockWorkStation
            </div>
          </div>
        </button>

        <button
          onClick={() => handleActionClick('sleep')}
          className="p-3.5 rounded-lg bg-[#121215] border border-white/8 hover:border-white/16 active:bg-[#18181c] text-left transition-colors flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded bg-[#18181c] border border-white/8 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">
              Sleep Mode
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
              PowrProf SetSuspendState
            </div>
          </div>
        </button>

        {/* Destructive Controls */}
        <button
          onClick={() => handleActionClick('restart')}
          className="p-3.5 rounded-lg bg-[#121215] border border-amber-500/20 hover:border-amber-500/40 active:bg-amber-500/10 text-left transition-colors flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded bg-[#18181c] border border-amber-500/20 flex items-center justify-center text-amber-400">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">
              Restart Laptop...
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Requires confirmation modal
            </div>
          </div>
        </button>

        <button
          onClick={() => handleActionClick('shutdown')}
          className="p-3.5 rounded-lg bg-[#121215] border border-rose-500/20 hover:border-rose-500/40 active:bg-rose-500/10 text-left transition-colors flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded bg-[#18181c] border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Power className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">
              Shut Down Laptop...
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Requires confirmation modal
            </div>
          </div>
        </button>
      </div>

      {/* Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-[#121215] border border-white/14 p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Confirm {pendingAction}
                </h4>
                <p className="text-[11px] text-zinc-500">Laptop session will be terminated.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to execute a remote{' '}
              <strong className="text-white font-semibold font-mono uppercase">{pendingAction}</strong> command on your
              Windows 11 laptop?
            </p>

            <div className="flex gap-2 font-mono text-xs">
              <button
                onClick={() => setPendingAction(null)}
                className="flex-1 py-2 rounded bg-[#18181c] hover:bg-[#202025] text-zinc-300 transition-colors border border-white/8"
              >
                Cancel
              </button>
              <button
                onClick={confirmDestructiveAction}
                className="flex-1 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors"
              >
                Yes, {pendingAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
