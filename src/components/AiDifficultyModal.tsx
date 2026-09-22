import React from 'react';
import { 
  X, 
  Bot, 
  Sliders, 
  Zap, 
  ShieldAlert, 
  Check, 
  Sparkles, 
  Crown, 
  Award,
  ChevronRight
} from 'lucide-react';
import { StockfishSettings } from '../types';
import { DIFFICULTY_LEVELS, DifficultyLevelInfo } from '../utils/difficultyLevels';

interface AiDifficultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockfishSettings: StockfishSettings;
  onSelectDifficulty: (level: number, autoDepth?: boolean) => void;
  onUpdateSettings?: (settings: Partial<StockfishSettings>) => void;
}

export const AiDifficultyModal: React.FC<AiDifficultyModalProps> = ({
  isOpen,
  onClose,
  stockfishSettings,
  onSelectDifficulty,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const currentLevel = stockfishSettings.difficulty;

  const handleSelect = (lvl: DifficultyLevelInfo) => {
    onSelectDifficulty(lvl.level, true);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#0b111e] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#080d1a] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-tech text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                CHOOSE AI PLAYING HARDNESS
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-mono-code font-bold">
                  Level {currentLevel} of 8
                </span>
              </h2>
              <p className="text-[11px] font-mono-code text-slate-400">
                Select Stockfish AI engine strength, calculation depth &amp; tactical hardness
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Quick Presets Bar */}
          <div className="flex items-center justify-between gap-2 p-2 bg-slate-900/90 rounded-xl border border-slate-800">
            <span className="text-[11px] font-mono-code text-slate-400 flex items-center gap-1.5 pl-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Presets:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: 'Casual (Lv 2)', level: 2 },
                { label: 'Club (Lv 4)', level: 4 },
                { label: 'Advanced (Lv 5)', level: 5 },
                { label: 'Master (Lv 7)', level: 7 },
                { label: 'Max GM (Lv 8)', level: 8 },
              ].map((p) => (
                <button
                  key={p.level}
                  onClick={() => onSelectDifficulty(p.level, true)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code font-semibold transition-all ${
                    currentLevel === p.level
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of 8 Difficulty Levels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DIFFICULTY_LEVELS.map((lvl) => {
              const isSelected = currentLevel === lvl.level;
              return (
                <div
                  key={lvl.level}
                  onClick={() => handleSelect(lvl)}
                  className={`relative p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900/95 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                      : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top row: Title + ELO Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-tech text-sm font-bold tracking-wide ${lvl.colorClass}`}>
                          Level {lvl.level}: {lvl.name}
                        </span>
                        {lvl.level === 8 && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 inline" />
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono-code font-bold text-slate-200 border border-slate-700">
                        ~{lvl.elo} ELO
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed mb-2.5">
                      {lvl.description}
                    </p>
                  </div>

                  {/* Bottom Stats & Checkmark */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono-code">
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>Depth: <strong className="text-slate-200">{lvl.depth} plies</strong></span>
                      <span>Blunders: <strong className="text-slate-300">{lvl.blunderRate}</strong></span>
                    </div>

                    {isSelected ? (
                      <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                        <Check className="w-3 h-3 text-amber-400" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-slate-500 hover:text-slate-300 flex items-center gap-0.5">
                        Select <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Engine Search Depth Fine-Tuning */}
          {onUpdateSettings && (
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2 text-xs font-mono-code">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Manual Calculation Depth (Plies):</span>
                </span>
                <span className="text-amber-300 font-bold">{stockfishSettings.depth} plies</span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                value={stockfishSettings.depth}
                onChange={(e) => onUpdateSettings({ depth: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Fast (2 plies)</span>
                <span>Standard (4-5 plies)</span>
                <span>Deep Search (10-12 plies)</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#080d1a] border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] font-mono-code text-slate-400">
            Difficulty applies instantly to physical board OLED &amp; live engine.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-mono-code transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
