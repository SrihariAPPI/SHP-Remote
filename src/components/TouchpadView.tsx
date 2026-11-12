import React, { useRef, useState } from 'react';
import { MousePointer, ChevronsUpDown, Sliders, ChevronUp, ChevronDown } from 'lucide-react';
import { RemoteConfig } from '../types/remote';
import { hapticFeedback } from '../utils/haptics';

interface TouchpadViewProps {
  onMouseMove: (dx: number, dy: number) => void;
  onMouseClick: (button: 'left' | 'right' | 'middle', double?: boolean) => void;
  onMouseScroll: (dy: number) => void;
  config: RemoteConfig;
  onUpdateSensitivity: (val: number) => void;
}

export const TouchpadView: React.FC<TouchpadViewProps> = ({
  onMouseMove,
  onMouseClick,
  onMouseScroll,
  config,
  onUpdateSensitivity,
}) => {
  const padRef = useRef<HTMLDivElement>(null);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [lastAction, setLastAction] = useState<string>('Ready');

  // Tracking refs
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const initialTouchPosRef = useRef<{ x: number; y: number } | null>(null);
  const twoFingerStartYRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);

  // Touch Start
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    touchStartTimeRef.current = now;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = padRef.current?.getBoundingClientRect();
      if (rect) {
        setTouchPos({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
      }
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      initialTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
    } else if (e.touches.length === 2) {
      twoFingerStartYRef.current = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      lastTouchRef.current = null;
      setLastAction('Two-finger Scroll');
    }
  };

  // Touch Move
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && lastTouchRef.current) {
      const touch = e.touches[0];
      const dx = Math.round((touch.clientX - lastTouchRef.current.x) * config.mouseSensitivity);
      const dy = Math.round((touch.clientY - lastTouchRef.current.y) * config.mouseSensitivity);

      const rect = padRef.current?.getBoundingClientRect();
      if (rect) {
        setTouchPos({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
      }

      if (dx !== 0 || dy !== 0) {
        onMouseMove(dx, dy);
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
        setLastAction(`Δx:${dx > 0 ? '+' : ''}${dx} Δy:${dy > 0 ? '+' : ''}${dy}`);
      }
    } else if (e.touches.length === 2) {
      const currentY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const deltaY = currentY - twoFingerStartYRef.current;

      if (Math.abs(deltaY) > 8) {
        const scrollDir = config.invertScroll ? (deltaY > 0 ? -1 : 1) : (deltaY > 0 ? 1 : -1);
        onMouseScroll(scrollDir);
        twoFingerStartYRef.current = currentY;
        setLastAction(`Scroll ${scrollDir > 0 ? 'Up' : 'Down'}`);
        hapticFeedback.scrollTick(config.hapticFeedback);
      }
    }
    e.preventDefault();
  };

  // Touch End
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    const duration = now - touchStartTimeRef.current;

    // Detect Single-Finger Tap
    if (e.touches.length === 0 && initialTouchPosRef.current && lastTouchRef.current) {
      const dist = Math.hypot(
        lastTouchRef.current.x - initialTouchPosRef.current.x,
        lastTouchRef.current.y - initialTouchPosRef.current.y
      );

      if (duration < 220 && dist < 12) {
        if (now - lastTapTimeRef.current < 280) {
          onMouseClick('left', true);
          setLastAction('Double Click');
          hapticFeedback.doubleClick(config.hapticFeedback);
        } else {
          lastTapTimeRef.current = now;
          onMouseClick('left', false);
          setLastAction('Click');
          hapticFeedback.trackpadClick(config.hapticFeedback);
        }
      }
      setTouchPos(null);
    }
  };

  // Mouse fallback for testing in desktop browser
  const isMouseDownRef = useRef(false);
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDownRef.current = true;
    lastTouchRef.current = { x: e.clientX, y: e.clientY };
    const rect = padRef.current?.getBoundingClientRect();
    if (rect) {
      setTouchPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMouseDownRef.current && lastTouchRef.current) {
      const dx = Math.round((e.clientX - lastTouchRef.current.x) * config.mouseSensitivity);
      const dy = Math.round((e.clientY - lastTouchRef.current.y) * config.mouseSensitivity);
      const rect = padRef.current?.getBoundingClientRect();
      if (rect) {
        setTouchPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      if (dx !== 0 || dy !== 0) {
        onMouseMove(dx, dy);
        lastTouchRef.current = { x: e.clientX, y: e.clientY };
      }
    }
  };
  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    setTouchPos(null);
  };

  return (
    <div className="flex flex-col h-full gap-2.5 select-none">
      {/* Precision Trackpad Canvas */}
      <div
        ref={padRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="touch-canvas relative flex-1 min-h-[320px] sm:min-h-[440px] rounded-lg bg-[#0e0e11] border border-white/8 flex flex-col items-center justify-center overflow-hidden cursor-crosshair group transition-colors hover:border-white/12"
      >
        {/* Architectural Subtle Grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Center Trackpad Subtle Mark */}
        <div className="relative z-10 flex flex-col items-center gap-1.5 pointer-events-none text-zinc-500">
          <MousePointer className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          <span className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase">
            Precision Trackpad
          </span>
          <span className="text-[10px] text-zinc-600">
            Glide · Tap to Click · Two-Finger Scroll
          </span>
        </div>

        {/* Minimalist touch feedback ring */}
        {touchPos && (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/80 bg-sky-400/10 w-8 h-8 transition-transform"
            style={{ left: touchPos.x, top: touchPos.y }}
          />
        )}

        {/* Micro-telemetry status badge in corner */}
        <div className="absolute bottom-2.5 left-3 text-[10px] font-mono text-zinc-500 tabular-nums">
          {lastAction}
        </div>
      </div>

      {/* Tactile Click Pads with Haptic Feedback */}
      <div className="grid grid-cols-12 gap-1.5 h-14">
        <button
          onClick={() => {
            onMouseClick('left');
            hapticFeedback.trackpadClick(config.hapticFeedback);
          }}
          className="col-span-5 h-full rounded bg-[#121215] border border-white/8 hover:border-white/14 active:bg-[#18181c] font-medium text-xs text-zinc-200 transition-transform active:scale-[0.98] flex flex-col items-center justify-center gap-0.5"
        >
          <span className="font-semibold text-xs">Left Click</span>
          <span className="text-[10px] text-zinc-500 font-mono">Primary</span>
        </button>

        <button
          onClick={() => {
            onMouseClick('middle');
            hapticFeedback.trackpadClick(config.hapticFeedback);
          }}
          className="col-span-2 h-full rounded bg-[#121215] border border-white/8 hover:border-white/14 active:bg-[#18181c] text-zinc-400 font-medium text-xs transition-transform active:scale-[0.98] flex items-center justify-center"
          title="Middle Mouse Click"
        >
          <ChevronsUpDown className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            onMouseClick('right');
            hapticFeedback.rightClick(config.hapticFeedback);
          }}
          className="col-span-5 h-full rounded bg-[#121215] border border-white/8 hover:border-white/14 active:bg-[#18181c] font-medium text-xs text-zinc-200 transition-transform active:scale-[0.98] flex flex-col items-center justify-center gap-0.5"
        >
          <span className="font-semibold text-xs">Right Click</span>
          <span className="text-[10px] text-zinc-500 font-mono">Context</span>
        </button>
      </div>

      {/* Sensitivity & Fast Scroll Bar */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded bg-[#121215] border border-white/8 text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-400">
          <Sliders className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px]">Sensitivity</span>
          <span className="text-zinc-200 font-semibold tabular-nums">
            {config.mouseSensitivity.toFixed(1)}×
          </span>
        </div>

        <input
          type="range"
          min="0.5"
          max="3.5"
          step="0.1"
          value={config.mouseSensitivity}
          onChange={(e) => {
            onUpdateSensitivity(parseFloat(e.target.value));
            hapticFeedback.scrollTick(config.hapticFeedback);
          }}
          className="w-32 sm:w-44 h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-sky-500"
        />

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onMouseScroll(1);
              hapticFeedback.scrollTick(config.hapticFeedback);
            }}
            className="p-1 rounded bg-[#18181c] border border-white/8 hover:border-white/14 text-zinc-300"
            title="Scroll Up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onMouseScroll(-1);
              hapticFeedback.scrollTick(config.hapticFeedback);
            }}
            className="p-1 rounded bg-[#18181c] border border-white/8 hover:border-white/14 text-zinc-300"
            title="Scroll Down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
