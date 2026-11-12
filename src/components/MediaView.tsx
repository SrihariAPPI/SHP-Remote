import React, { useState } from 'react';
import { Volume2, VolumeX, Volume1, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

interface MediaViewProps {
  onMediaAction: (action: 'playpause' | 'next' | 'prev' | 'volumeup' | 'volumedown' | 'mute' | 'stop') => void;
  hapticsEnabled?: boolean;
}

export const MediaView: React.FC<MediaViewProps> = ({ onMediaAction, hapticsEnabled = true }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(65);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    onMediaAction('playpause');
    hapticFeedback.mediaButton(hapticsEnabled);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    onMediaAction('mute');
    hapticFeedback.mediaButton(hapticsEnabled);
  };

  const handleVolumeUp = () => {
    setVolume((v) => Math.min(100, v + 5));
    onMediaAction('volumeup');
    hapticFeedback.scrollTick(hapticsEnabled);
  };

  const handleVolumeDown = () => {
    setVolume((v) => Math.max(0, v - 5));
    onMediaAction('volumedown');
    hapticFeedback.scrollTick(hapticsEnabled);
  };

  const handleTrackChange = (action: 'prev' | 'next') => {
    onMediaAction(action);
    hapticFeedback.mediaButton(hapticsEnabled);
  };

  return (
    <div className="flex flex-col h-full gap-3 select-none justify-center">
      {/* Master Volume Section */}
      <div className="p-4 rounded-lg bg-[#121215] border border-white/8 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-300">
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-zinc-500" />
            ) : volume > 50 ? (
              <Volume2 className="w-4 h-4 text-zinc-300" />
            ) : (
              <Volume1 className="w-4 h-4 text-zinc-300" />
            )}
            <span className="font-semibold">Master Audio Level</span>
          </div>
          <span className="tabular-nums text-zinc-400 font-semibold">
            {isMuted ? 'MUTED' : `${volume}%`}
          </span>
        </div>

        {/* Precision Volume Level Rail */}
        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-sky-500 transition-all duration-100"
            style={{ width: `${isMuted ? 0 : volume}%` }}
          />
        </div>

        {/* Stepper Buttons */}
        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
          <button
            onClick={handleVolumeDown}
            className="py-2.5 rounded bg-[#18181c] hover:bg-[#202025] active:bg-[#26262e] border border-white/8 text-zinc-200 transition-colors"
          >
            VOL −5%
          </button>
          <button
            onClick={handleMute}
            className={`py-2.5 rounded font-semibold border transition-colors ${
              isMuted
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : 'bg-[#18181c] hover:bg-[#202025] active:bg-[#26262e] text-zinc-300 border-white/8'
            }`}
          >
            {isMuted ? 'UNMUTE' : 'MUTE'}
          </button>
          <button
            onClick={handleVolumeUp}
            className="py-2.5 rounded bg-[#18181c] hover:bg-[#202025] active:bg-[#26262e] border border-white/8 text-zinc-200 transition-colors"
          >
            VOL +5%
          </button>
        </div>
      </div>

      {/* Multimedia Playback Section */}
      <div className="p-4 rounded-lg bg-[#121215] border border-white/8 flex flex-col items-center gap-4">
        <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
          Windows 11 Transport Controls
        </div>

        {/* Transport Keycaps */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleTrackChange('prev')}
            className="w-12 h-12 rounded bg-[#18181c] hover:bg-[#202025] active:bg-[#26262e] text-zinc-300 border border-white/8 flex items-center justify-center transition-transform active:scale-95"
            title="Previous Track"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={handlePlayPause}
            className="w-14 h-14 rounded bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white flex items-center justify-center transition-transform active:scale-95"
            title="Play / Pause"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={() => handleTrackChange('next')}
            className="w-12 h-12 rounded bg-[#18181c] hover:bg-[#202025] active:bg-[#26262e] text-zinc-300 border border-white/8 flex items-center justify-center transition-transform active:scale-95"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] font-mono text-zinc-500">
          Emulates Win32 Virtual Keycodes VK_MEDIA_*
        </div>
      </div>
    </div>
  );
};
