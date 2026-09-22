import React from 'react';
import { X, Sliders, Bot, Lightbulb, Wifi, Volume2, Shield } from 'lucide-react';
import { StockfishSettings } from '../types';
import { DIFFICULTY_LEVELS, getDifficultyInfo } from '../utils/difficultyLevels';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockfishSettings: StockfishSettings;
  onUpdateStockfish: (settings: Partial<StockfishSettings>) => void;
  ledBrightness: number;
  onUpdateBrightness: (b: number) => void;
  boardOrientation: 'w' | 'b';
  onToggleOrientation: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  stockfishSettings,
  onUpdateStockfish,
  ledBrightness,
  onUpdateBrightness,
  boardOrientation,
  onToggleOrientation,
}) => {
  if (!isOpen) return null;

  const currentDiff = getDifficultyInfo(stockfishSettings.difficulty);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-[#0b111e] border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-[#080d1a] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="font-tech text-base sm:text-lg font-bold text-white">
              GRANDMASTER OS SETTINGS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Section 1: Stockfish Engine Config */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 font-mono-code">
              <Bot className="w-4 h-4" />
              <span>STOCKFISH AI ENGINE PARAMETERS</span>
            </div>

            {/* Difficulty */}
            <div>
              <div className="flex justify-between text-xs font-mono-code mb-1">
                <span className="text-slate-300">Difficulty Level:</span>
                <span className={`font-bold ${currentDiff.colorClass}`}>
                  Level {stockfishSettings.difficulty} ({currentDiff.name} - ~{currentDiff.elo} ELO)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                value={stockfishSettings.difficulty}
                onChange={(e) => onUpdateStockfish({ difficulty: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Search Depth */}
            <div>
              <div className="flex justify-between text-xs font-mono-code mb-1">
                <span className="text-slate-300">Search Depth (plies):</span>
                <span className="text-amber-300 font-bold">{stockfishSettings.depth}</span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                value={stockfishSettings.depth}
                onChange={(e) => onUpdateStockfish({ depth: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* AI Coach toggles */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono-code">
              <span className="text-slate-300">Grandmaster AI Coach Commentary</span>
              <input
                type="checkbox"
                checked={stockfishSettings.coachEnabled}
                onChange={(e) => onUpdateStockfish({ coachEnabled: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Section 2: Physical Board & WS2812B LEDs */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-mono-code">
              <Lightbulb className="w-4 h-4" />
              <span>PHYSICAL BOARD &amp; WS2812B LEDS</span>
            </div>

            {/* LED Brightness */}
            <div>
              <div className="flex justify-between text-xs font-mono-code mb-1">
                <span className="text-slate-300">WS2812B LED Brightness:</span>
                <span className="text-emerald-300 font-bold">{ledBrightness}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={ledBrightness}
                onChange={(e) => onUpdateBrightness(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Flip Board View */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono-code">
              <span className="text-slate-300">Board Perspective</span>
              <button
                onClick={onToggleOrientation}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
              >
                Playing as: <strong className="text-amber-400">{boardOrientation === 'w' ? 'White' : 'Black'}</strong>
              </button>
            </div>
          </div>

          {/* Section 3: Hardware specs summary */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono-code text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold mb-1">HARDWARE CONFIGURATION:</div>
            <div>&bull; Microcontroller: ESP32 DevKit-v1 (Dual Core 240MHz)</div>
            <div>&bull; Sensors: 64 Hall-effect A3144 matrix with shift registers</div>
            <div>&bull; LEDs: 64 WS2812B individually addressable RGB LEDs</div>
            <div>&bull; Display: 0.96" I2C SSD1306 OLED (128x64 pixels)</div>
            <div>&bull; Buttons: TTP224 4-key capacitive touch module</div>
            <div>&bull; Audio: PAM8403 3W stereo amplifier &amp; speaker</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#080d1a] border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-mono-code transition-colors"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
