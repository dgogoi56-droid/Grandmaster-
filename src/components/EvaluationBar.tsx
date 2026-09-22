import React from 'react';
import { Cpu } from 'lucide-react';

interface EvaluationBarProps {
  evaluation: number; // centipawns from white's perspective
  mateIn?: number;
  depth: number;
  isCalculating?: boolean;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  evaluation,
  mateIn,
  depth,
  isCalculating,
}) => {
  // Convert centipawns to percentage for White (clamped between 5% and 95%)
  // Standard sigmoid conversion: 1 / (1 + 10^(-score / 400))
  let whitePercent = 50;

  if (mateIn !== undefined) {
    whitePercent = mateIn > 0 ? 100 : 0;
  } else {
    const pawns = evaluation / 100;
    // Logistic curve
    const sigmoid = 1 / (1 + Math.exp(-pawns * 0.7));
    whitePercent = Math.min(Math.max(sigmoid * 100, 5), 95);
  }

  // Text display
  let scoreText = '0.0';
  if (mateIn !== undefined) {
    scoreText = `M${Math.abs(mateIn)}`;
  } else {
    const val = (evaluation / 100).toFixed(1);
    scoreText = evaluation > 0 ? `+${val}` : val;
  }

  return (
    <div className="flex flex-col items-center justify-between bg-[#0f172a] rounded-xl p-2 border border-slate-800 shadow-md h-full min-h-[140px] select-none w-14">
      {/* Top Black Score / Engine status */}
      <div className="text-[10px] font-mono-code text-slate-400 font-bold flex flex-col items-center">
        {evaluation < 0 && <span className="text-slate-300">{scoreText}</span>}
        {isCalculating && <Cpu className="w-3 h-3 text-amber-400 animate-spin my-0.5" />}
      </div>

      {/* Vertical Gauge */}
      <div className="relative w-4 h-full my-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 flex flex-col justify-end">
        {/* Black side (top) */}
        <div className="w-full bg-[#1e293b] flex-1" />

        {/* White side (bottom) */}
        <div
          className="w-full bg-slate-100 transition-all duration-300 ease-out shadow-sm"
          style={{ height: `${whitePercent}%` }}
        />

        {/* Center baseline tick */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-amber-500/60 -translate-y-1/2 z-10 pointer-events-none" />
      </div>

      {/* Bottom White Score & Depth */}
      <div className="text-[10px] font-mono-code font-bold flex flex-col items-center">
        {evaluation >= 0 && <span className="text-slate-200">{scoreText}</span>}
        <span className="text-[9px] text-slate-500 mt-0.5">D:{depth}</span>
      </div>
    </div>
  );
};
