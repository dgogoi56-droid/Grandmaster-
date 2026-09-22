import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Copy, 
  Check, 
  Bot, 
  Lightbulb, 
  Sparkles, 
  AlertTriangle, 
  HelpCircle, 
  Compass,
  Download,
  FileText,
  Trophy,
  GraduationCap
} from 'lucide-react';
import { MoveRecord, Square } from '../types';
import { EngineResult } from '../services/stockfishEngine';
import { copyPgnToClipboard, downloadPgnFile } from '../utils/pgnExporter';

interface AnalysisPanelProps {
  moves: MoveRecord[];
  currentMoveIndex: number;
  engineResult: EngineResult | null;
  onJumpToMove: (index: number) => void;
  onSendHintToBoard?: (squares: Square[]) => void;
  isEngineActive: boolean;
  onOpenPgnModal?: () => void;
  onOpenRecordsModal?: () => void;
  onOpenTrainingArena?: () => void;
  onShowToast?: (msg: string) => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  moves,
  currentMoveIndex,
  engineResult,
  onJumpToMove,
  onSendHintToBoard,
  isEngineActive,
  onOpenPgnModal,
  onOpenRecordsModal,
  onOpenTrainingArena,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  // Generate PGN string from move history
  const generatePgn = () => {
    let pgn = '';
    for (let i = 0; i < moves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const white = moves[i]?.san || '';
      const black = moves[i + 1]?.san || '';
      pgn += `${moveNum}. ${white} ${black} `.trim() + ' ';
    }
    return pgn.trim() || '*';
  };

  const handleCopyPgn = async () => {
    const pgn = generatePgn();
    const res = await copyPgnToClipboard(pgn);
    if (res.success) {
      setCopied(true);
      if (onShowToast) {
        onShowToast(`PGN copied to clipboard (${moves.length} moves)!`);
      }
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPgn = () => {
    const pgn = generatePgn();
    downloadPgnFile(pgn);
    if (onShowToast) {
      onShowToast('PGN file downloaded.');
    }
  };

  // Move evaluation counts
  let whiteBlunders = 0, whiteMistakes = 0, whiteInaccuracies = 0;
  let blackBlunders = 0, blackMistakes = 0, blackInaccuracies = 0;

  moves.forEach(m => {
    if (m.color === 'w') {
      if (m.evalType === 'blunder') whiteBlunders++;
      if (m.evalType === 'mistake') whiteMistakes++;
      if (m.evalType === 'inaccuracy') whiteInaccuracies++;
    } else {
      if (m.evalType === 'blunder') blackBlunders++;
      if (m.evalType === 'mistake') blackMistakes++;
      if (m.evalType === 'inaccuracy') blackInaccuracies++;
    }
  });

  const currentMove = currentMoveIndex >= 0 ? moves[currentMoveIndex] : null;

  return (
    <div className="flex flex-col h-full bg-[#0e1626] rounded-xl border border-slate-800 p-3 shadow-md select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs font-mono-code">
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
          <Bot className="w-3.5 h-3.5" />
          <span>STOCKFISH &amp; ANALYSIS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyPgn}
            className={`px-2 py-0.5 rounded text-[11px] font-mono-code font-medium flex items-center gap-1 transition-all ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
            title="Copy current game move history as PGN to device clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-amber-400" />
                <span>Copy PGN</span>
              </>
            )}
          </button>
          {onOpenPgnModal && (
            <button
              onClick={onOpenPgnModal}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
              title="View full PGN & options"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleDownloadPgn}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title="Download PGN file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          {onOpenRecordsModal && (
            <button
              onClick={onOpenRecordsModal}
              className="p-1 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded transition-colors"
              title="Personal Records Room & Match Vault"
            >
              <Trophy className="w-3.5 h-3.5" />
            </button>
          )}
          {onOpenTrainingArena && (
            <button
              onClick={onOpenTrainingArena}
              className="p-1 hover:bg-slate-800 text-amber-300 hover:text-amber-200 rounded transition-colors"
              title="Open Grandmaster Training Arena"
            >
              <GraduationCap className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stockfish Best Move & PV Suggestion Banner */}
      {engineResult && (
        <div className="mb-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 shadow-inner">
          <div className="flex items-center justify-between text-xs font-mono-code mb-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Engine Recommendation:
            </span>
            <span className="text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              {engineResult.bestMove.toUpperCase()}
            </span>
          </div>

          <div className="text-[11px] font-mono-code text-slate-300 flex items-center justify-between gap-1">
            <span className="truncate text-slate-400">
              PV: {engineResult.pv.length > 0 ? engineResult.pv.join(' ') : 'none'}
            </span>
            {onSendHintToBoard && engineResult.from && engineResult.to && (
              <button
                onClick={() => onSendHintToBoard([engineResult.from, engineResult.to])}
                className="px-2 py-0.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded text-[10px] whitespace-nowrap transition-colors flex items-center gap-1"
                title="Light up best move on physical ESP32 chessboard"
              >
                <Lightbulb className="w-3 h-3 text-cyan-300" />
                <span>LED Hint</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Move Quality Summary */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-[10px] font-mono-code">
        <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
          <div className="text-slate-400 font-semibold mb-0.5">White Accuracy</div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">?? {whiteBlunders}</span>
            <span className="text-orange-400">? {whiteMistakes}</span>
            <span className="text-yellow-400">?! {whiteInaccuracies}</span>
          </div>
        </div>
        <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
          <div className="text-slate-400 font-semibold mb-0.5">Black Accuracy</div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">?? {blackBlunders}</span>
            <span className="text-orange-400">? {blackMistakes}</span>
            <span className="text-yellow-400">?! {blackInaccuracies}</span>
          </div>
        </div>
      </div>

      {/* Move History Table */}
      <div className="flex-1 overflow-y-auto min-h-[140px] max-h-[220px] bg-slate-950/70 rounded-lg p-2 border border-slate-800/80 font-mono-code text-xs">
        {moves.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">
            Game awaiting first move...
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] border-b border-slate-800">
                <th className="pb-1 w-8">#</th>
                <th className="pb-1">WHITE</th>
                <th className="pb-1">BLACK</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, rIdx) => {
                const wIdx = rIdx * 2;
                const bIdx = wIdx + 1;
                const wMove = moves[wIdx];
                const bMove = moves[bIdx];

                return (
                  <tr key={rIdx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-1 text-slate-500 text-[11px]">{rIdx + 1}.</td>

                    {/* White Move */}
                    <td className="py-1">
                      {wMove && (
                        <button
                          onClick={() => onJumpToMove(wIdx)}
                          className={`px-1.5 py-0.5 rounded text-left flex items-center gap-1 transition-colors ${
                            currentMoveIndex === wIdx
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'text-slate-200 hover:text-white'
                          }`}
                        >
                          <span>{wMove.san}</span>
                          {wMove.evalType === 'blunder' && <span className="text-red-400 font-bold">??</span>}
                          {wMove.evalType === 'mistake' && <span className="text-orange-400 font-bold">?</span>}
                          {wMove.evalType === 'inaccuracy' && <span className="text-yellow-400 font-bold">?!</span>}
                          {wMove.evalType === 'brilliant' && <span className="text-cyan-400 font-bold">!!</span>}
                        </button>
                      )}
                    </td>

                    {/* Black Move */}
                    <td className="py-1">
                      {bMove && (
                        <button
                          onClick={() => onJumpToMove(bIdx)}
                          className={`px-1.5 py-0.5 rounded text-left flex items-center gap-1 transition-colors ${
                            currentMoveIndex === bIdx
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'text-slate-200 hover:text-white'
                          }`}
                        >
                          <span>{bMove.san}</span>
                          {bMove.evalType === 'blunder' && <span className="text-red-400 font-bold">??</span>}
                          {bMove.evalType === 'mistake' && <span className="text-orange-400 font-bold">?</span>}
                          {bMove.evalType === 'inaccuracy' && <span className="text-yellow-400 font-bold">?!</span>}
                          {bMove.evalType === 'brilliant' && <span className="text-cyan-400 font-bold">!!</span>}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Navigation stepper buttons */}
      <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-800">
        <button
          onClick={() => onJumpToMove(-1)}
          disabled={moves.length === 0 || currentMoveIndex === -1}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded text-slate-300"
          title="Initial position"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onJumpToMove(Math.max(-1, currentMoveIndex - 1))}
          disabled={moves.length === 0 || currentMoveIndex === -1}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded text-slate-300"
          title="Previous move"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono-code text-slate-400">
          {currentMoveIndex + 1} / {moves.length}
        </span>
        <button
          onClick={() => onJumpToMove(Math.min(moves.length - 1, currentMoveIndex + 1))}
          disabled={moves.length === 0 || currentMoveIndex === moves.length - 1}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded text-slate-300"
          title="Next move"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onJumpToMove(moves.length - 1)}
          disabled={moves.length === 0 || currentMoveIndex === moves.length - 1}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded text-slate-300"
          title="Latest move"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Coach Commentary Box */}
      {currentMove && currentMove.coachComment && (
        <div className="mt-2.5 p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Coach Note ({currentMove.san}):</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {currentMove.coachComment}
          </p>
        </div>
      )}
    </div>
  );
};
