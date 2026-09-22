import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Share2, 
  MessageSquare,
  Sparkles,
  Award
} from 'lucide-react';
import { Chess } from 'chess.js';
import { MoveRecord, GameMode, StockfishSettings, OnlineRoom } from '../types';
import { generatePgnString, copyPgnToClipboard, downloadPgnFile } from '../utils/pgnExporter';

interface ExportPgnModalProps {
  isOpen: boolean;
  onClose: () => void;
  chess: Chess;
  moves: MoveRecord[];
  gameMode: GameMode;
  stockfishSettings: StockfishSettings;
  onlineRoom: OnlineRoom | null;
  clockFormat: string;
  onShowToast: (msg: string) => void;
}

export const ExportPgnModal: React.FC<ExportPgnModalProps> = ({
  isOpen,
  onClose,
  chess,
  moves,
  gameMode,
  stockfishSettings,
  onlineRoom,
  clockFormat,
  onShowToast,
}) => {
  const [includeComments, setIncludeComments] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pgnText, setPgnText] = useState('');

  // Update PGN whenever moves, options, or modal state changes
  useEffect(() => {
    if (!isOpen) return;
    const generated = generatePgnString(chess, moves, {
      gameMode,
      stockfishSettings,
      onlineRoom,
      clockFormat,
      includeComments,
    });
    setPgnText(generated);
  }, [isOpen, chess, moves, gameMode, stockfishSettings, onlineRoom, clockFormat, includeComments]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const res = await copyPgnToClipboard(pgnText);
    if (res.success) {
      setCopied(true);
      onShowToast(`PGN copied to device clipboard (${moves.length} moves)!`);
      setTimeout(() => setCopied(false), 2500);
    } else {
      onShowToast('Failed to copy to clipboard. Please copy manually from the text box.');
    }
  };

  const handleDownload = () => {
    downloadPgnFile(pgnText);
    onShowToast('PGN file downloaded successfully.');
  };

  const moveCount = moves.length;
  const fullMoves = Math.ceil(moveCount / 2);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#0b111e] border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#080d1a] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-tech text-base sm:text-lg font-bold text-white tracking-wide">
                EXPORT GAME PGN
              </h2>
              <p className="text-[11px] font-mono-code text-slate-400">
                Standard Portable Game Notation for Chess.com, Lichess &amp; Analysis
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
        <div className="p-4 overflow-y-auto space-y-4 text-xs font-mono-code">
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Moves</div>
              <div className="text-sm font-bold text-amber-400">{fullMoves} <span className="text-[10px] text-slate-400 font-normal">({moveCount} plies)</span></div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Game Mode</div>
              <div className="text-xs font-bold text-slate-200 truncate">
                {gameMode === 'vs-stockfish' ? 'VS Stockfish' : gameMode === 'online-multiplayer' ? 'Online Match' : 'Local 2P'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Status</div>
              <div className="text-xs font-bold text-emerald-400 truncate">
                {chess.isGameOver() ? 'Completed' : 'Active Game'}
              </div>
            </div>
          </div>

          {/* Configuration Options */}
          <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeComments}
                onChange={(e) => setIncludeComments(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Include Coach notes &amp; evaluation glyphs (??, ?, !!)
              </span>
            </label>
          </div>

          {/* PGN Textbox View */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Standard PGN String:</span>
              <span className="text-slate-400">{pgnText.length} characters</span>
            </div>
            <div className="relative">
              <textarea
                readOnly
                value={pgnText}
                rows={10}
                className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 font-mono-code text-[11px] leading-relaxed resize-none focus:outline-none focus:border-amber-500/50 select-all"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-[#080d1a] border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            {copied ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Copied to Clipboard!
              </span>
            ) : (
              <span>Ready for import into any chess software.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono-code font-semibold flex items-center gap-1.5 transition-colors"
              title="Download as .pgn file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .pgn</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-lg text-xs font-mono-code font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
              title="Copy entire PGN string to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY PGN TO CLIPBOARD'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
