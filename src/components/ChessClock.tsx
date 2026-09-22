import React from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

interface ChessClockProps {
  whiteTimeSec: number;
  blackTimeSec: number;
  activeSide: 'w' | 'b' | null;
  isRunning: boolean;
  formatName: string;
  onTogglePlayPause: () => void;
  onResetClock: () => void;
  onSelectPreset?: (mins: number, inc: number, name: string) => void;
}

function formatTime(totalSeconds: number): string {
  if (totalSeconds < 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const padMins = mins.toString().padStart(2, '0');
  const padSecs = secs.toString().padStart(2, '0');
  return `${padMins}:${padSecs}`;
}

export const ChessClock: React.FC<ChessClockProps> = ({
  whiteTimeSec,
  blackTimeSec,
  activeSide,
  isRunning,
  formatName,
  onTogglePlayPause,
  onResetClock,
  onSelectPreset,
}) => {
  const isWhiteLow = whiteTimeSec <= 30 && whiteTimeSec > 0;
  const isBlackLow = blackTimeSec <= 30 && blackTimeSec > 0;

  return (
    <div className="w-full bg-[#111827] rounded-xl p-3 border border-slate-800 shadow-md">
      {/* Header controls */}
      <div className="flex items-center justify-between mb-2 text-xs text-slate-400 font-mono-code">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Timer className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold uppercase tracking-wider">{formatName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlayPause}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1 text-[11px] transition-colors"
          >
            {isRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            <span>{isRunning ? 'Pause' : 'Start'}</span>
          </button>
          <button
            onClick={onResetClock}
            title="Reset Clock"
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Dual Clocks */}
      <div className="grid grid-cols-2 gap-2">
        {/* Black Clock */}
        <div
          className={`p-2.5 rounded-lg border transition-all flex flex-col items-center justify-center ${
            activeSide === 'b'
              ? 'bg-slate-900 border-amber-400/80 shadow-md shadow-amber-500/10'
              : 'bg-slate-950/70 border-slate-800 opacity-80'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px] text-slate-400 uppercase font-mono-code mb-1">
            <span className="w-2 h-2 rounded-full bg-slate-800 border border-slate-600"></span>
            <span>Black</span>
            {activeSide === 'b' && isRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping ml-1" />
            )}
          </div>
          <div
            className={`font-mono-code text-2xl font-bold tracking-tight ${
              isBlackLow ? 'text-red-400 animate-pulse' : activeSide === 'b' ? 'text-white' : 'text-slate-400'
            }`}
          >
            {formatTime(blackTimeSec)}
          </div>
        </div>

        {/* White Clock */}
        <div
          className={`p-2.5 rounded-lg border transition-all flex flex-col items-center justify-center ${
            activeSide === 'w'
              ? 'bg-slate-900 border-amber-400/80 shadow-md shadow-amber-500/10'
              : 'bg-slate-950/70 border-slate-800 opacity-80'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px] text-slate-400 uppercase font-mono-code mb-1">
            <span className="w-2 h-2 rounded-full bg-white border border-slate-300"></span>
            <span>White</span>
            {activeSide === 'w' && isRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping ml-1" />
            )}
          </div>
          <div
            className={`font-mono-code text-2xl font-bold tracking-tight ${
              isWhiteLow ? 'text-red-400 animate-pulse' : activeSide === 'w' ? 'text-white' : 'text-slate-400'
            }`}
          >
            {formatTime(whiteTimeSec)}
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      {onSelectPreset && (
        <div className="flex items-center justify-between gap-1 mt-2 text-[10px] font-mono-code">
          <button
            onClick={() => onSelectPreset(3, 2, 'Blitz 3+2')}
            className="flex-1 py-1 px-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded border border-slate-800 transition-colors text-center"
          >
            3+2 Blitz
          </button>
          <button
            onClick={() => onSelectPreset(5, 0, 'Blitz 5+0')}
            className="flex-1 py-1 px-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded border border-slate-800 transition-colors text-center"
          >
            5+0 Blitz
          </button>
          <button
            onClick={() => onSelectPreset(10, 0, 'Rapid 10+0')}
            className="flex-1 py-1 px-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded border border-slate-800 transition-colors text-center"
          >
            10m Rapid
          </button>
          <button
            onClick={() => onSelectPreset(15, 10, 'Classical 15+10')}
            className="flex-1 py-1 px-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded border border-slate-800 transition-colors text-center"
          >
            15+10 Class
          </button>
        </div>
      )}
    </div>
  );
};
