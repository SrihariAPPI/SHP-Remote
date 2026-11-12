import React, { useState } from 'react';
import { Send, CornerDownLeft, Delete, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

interface KeyboardViewProps {
  onSendKey: (key: string) => void;
  onKeyDown: (key: string) => void;
  onKeyUp: (key: string) => void;
  onSendText: (text: string) => void;
  onEmergencyRelease: () => void;
  hapticsEnabled?: boolean;
}

export const KeyboardView: React.FC<KeyboardViewProps> = ({
  onSendKey,
  onKeyDown,
  onKeyUp,
  onSendText,
  onEmergencyRelease,
  hapticsEnabled = true,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeModifiers, setActiveModifiers] = useState<Set<string>>(new Set());

  const handleToggleModifier = (mod: string) => {
    setActiveModifiers((prev) => {
      const next = new Set(prev);
      const willBeActive = !next.has(mod);
      if (next.has(mod)) {
        next.delete(mod);
        onKeyUp(mod);
      } else {
        next.add(mod);
        onKeyDown(mod);
      }
      hapticFeedback.modifierToggle(willBeActive, hapticsEnabled);
      return next;
    });
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendText(inputText);
      hapticFeedback.actionKey(hapticsEnabled);
      setInputText('');
    }
  };

  const handleKeyTap = (key: string, isActionKey = false) => {
    onSendKey(key);
    if (isActionKey) {
      hapticFeedback.actionKey(hapticsEnabled);
    } else {
      hapticFeedback.keyPress(hapticsEnabled);
    }
  };

  const rows = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
  ];

  return (
    <div className="flex flex-col h-full gap-2.5 select-none">
      {/* Precision Text Dispatcher Line */}
      <form onSubmit={handleTextSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type sentence to send to Windows..."
          className="flex-1 bg-[#121215] border border-white/8 focus:border-sky-500 rounded px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none font-mono"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs rounded transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>

      {/* Modifier Keycaps Bar with LED indicators & Haptic Feedback */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
        {(['ctrl', 'alt', 'shift', 'win'] as const).map((mod) => {
          const isActive = activeModifiers.has(mod);
          return (
            <button
              key={mod}
              onClick={() => handleToggleModifier(mod)}
              className={`py-1.5 px-2.5 rounded text-xs font-mono font-medium tracking-wide uppercase border transition-colors flex items-center justify-between ${
                isActive
                  ? 'bg-sky-950/80 text-sky-200 border-sky-500/50'
                  : 'bg-[#121215] text-zinc-300 border-white/8 hover:border-white/14'
              }`}
            >
              <span>{mod}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-sky-400' : 'bg-zinc-700'
                }`}
              />
            </button>
          );
        })}

        <button
          onClick={() => {
            setActiveModifiers(new Set());
            onEmergencyRelease();
            hapticFeedback.actionKey(hapticsEnabled);
          }}
          className="col-span-4 sm:col-span-1 py-1.5 px-2 rounded text-xs font-mono text-zinc-400 bg-[#121215] border border-white/8 hover:border-white/14 flex items-center justify-center gap-1.5"
          title="Release held keys"
        >
          <Shield className="w-3 h-3 text-zinc-500" />
          <span>Reset</span>
        </button>
      </div>

      {/* Function Command Row */}
      <div className="grid grid-cols-5 gap-1.5 font-mono text-xs">
        <button
          onClick={() => handleKeyTap('ESCAPE', true)}
          className="py-1.5 rounded bg-[#121215] text-zinc-300 border border-white/8 hover:border-white/14 active:bg-[#18181c]"
        >
          Esc
        </button>
        <button
          onClick={() => handleKeyTap('TAB', true)}
          className="py-1.5 rounded bg-[#121215] text-zinc-300 border border-white/8 hover:border-white/14 active:bg-[#18181c]"
        >
          Tab
        </button>
        <button
          onClick={() => handleKeyTap('BACKSPACE', true)}
          className="py-1.5 rounded bg-[#121215] text-zinc-300 border border-white/8 hover:border-white/14 active:bg-[#18181c] flex items-center justify-center gap-1"
        >
          <Delete className="w-3.5 h-3.5 text-zinc-400" />
          <span>Bksp</span>
        </button>
        <button
          onClick={() => handleKeyTap('ENTER', true)}
          className="col-span-2 py-1.5 rounded bg-[#18181c] text-sky-300 border border-white/10 hover:border-sky-500/40 active:bg-sky-600 active:text-white font-semibold flex items-center justify-center gap-1"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
          <span>Enter</span>
        </button>
      </div>

      {/* Virtual QWERTY Keyboard */}
      <div className="flex-1 bg-[#0e0e11] p-2 rounded-lg border border-white/8 flex flex-col justify-around gap-1 font-mono">
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1">
            {row.map((char) => (
              <button
                key={char}
                onClick={() => handleKeyTap(char)}
                className="flex-1 min-w-[22px] max-w-[40px] h-9 sm:h-10 rounded bg-[#18181c] hover:bg-[#202025] active:bg-sky-600 active:text-white text-zinc-200 border border-white/6 text-xs sm:text-sm font-semibold transition-transform active:scale-95 flex items-center justify-center"
              >
                {char}
              </button>
            ))}
          </div>
        ))}

        {/* Spacebar and Navigation Cluster */}
        <div className="flex gap-1.5 mt-0.5">
          <button
            onClick={() => handleKeyTap('SPACE')}
            className="flex-[4] h-9 sm:h-10 rounded bg-[#18181c] hover:bg-[#202025] active:bg-sky-600 active:text-white text-zinc-300 border border-white/6 text-xs tracking-wider uppercase transition-transform active:scale-[0.99] flex items-center justify-center"
          >
            Space
          </button>

          <div className="flex-[2] grid grid-cols-3 gap-1">
            <div />
            <button
              onClick={() => handleKeyTap('UP')}
              className="h-9 sm:h-10 rounded bg-[#18181c] hover:bg-[#202025] active:bg-sky-600 active:text-white text-zinc-300 border border-white/6 flex items-center justify-center"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <div />
            <button
              onClick={() => handleKeyTap('LEFT')}
              className="h-9 sm:h-10 rounded bg-[#18181c] hover:bg-[#202025] active:bg-sky-600 active:text-white text-zinc-300 border border-white/6 flex items-center justify-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleKeyTap('DOWN')}
              className="h-9 sm:h-10 rounded bg-[#18181c] hover:bg-[#202025] active:bg-sky-600 active:text-white text-zinc-300 border border-white/6 flex items-center justify-center"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleKeyTap('RIGHT')}
              className="h-9 sm:h-10 rounded bg-[#18181c] hover:bg-[#202025] active:bg-sky-600 active:text-white text-zinc-300 border border-white/6 flex items-center justify-center"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
