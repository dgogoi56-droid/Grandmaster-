import React, { useState } from 'react';
import { Chess, Square as ChessSquare, PieceSymbol, Color } from 'chess.js';
import { Square, BoardLeds, HallSensors } from '../types';

interface ChessboardViewProps {
  chess: Chess;
  boardLeds: BoardLeds;
  hallSensors: HallSensors;
  orientation: 'w' | 'b';
  selectedSquare: Square | null;
  validDestinations: Square[];
  lastMove: { from: Square; to: Square } | null;
  onSquareClick: (sq: Square) => void;
  isPhysicalBoardSyncing?: boolean;
}

// Crisp chess piece glyphs
const PIECE_UNICODE: Record<string, string> = {
  wp: '♙',
  wn: '♘',
  wb: '♗',
  wr: '♖',
  wq: '♕',
  wk: '♔',
  bp: '♟',
  bn: '♞',
  bb: '♝',
  br: '♜',
  bq: '♛',
  bk: '♚',
};

export const ChessboardView: React.FC<ChessboardViewProps> = ({
  chess,
  boardLeds,
  hallSensors,
  orientation,
  selectedSquare,
  validDestinations,
  lastMove,
  onSquareClick,
  isPhysicalBoardSyncing,
}) => {
  const [hoverSquare, setHoverSquare] = useState<Square | null>(null);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = orientation === 'w' ? files : [...files].reverse();
  const displayRanks = orientation === 'w' ? ranks : [...ranks].reverse();

  // Find King square if in check
  let checkedKingSquare: Square | null = null;
  if (chess.inCheck()) {
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          checkedKingSquare = `${files[c]}${8 - r}` as Square;
        }
      }
    }
  }

  // Calculate captured pieces & material advantage
  const initialCounts: Record<PieceSymbol, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
  const currentWhiteCounts: Record<PieceSymbol, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
  const currentBlackCounts: Record<PieceSymbol, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };

  const boardMatrix = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = boardMatrix[r][c];
      if (p) {
        if (p.color === 'w') currentWhiteCounts[p.type]++;
        else currentBlackCounts[p.type]++;
      }
    }
  }

  const whiteCaptured: PieceSymbol[] = [];
  const blackCaptured: PieceSymbol[] = []; // Black pieces taken by White
  const pieceOrder: PieceSymbol[] = ['p', 'n', 'b', 'r', 'q'];

  pieceOrder.forEach(type => {
    const missingBlack = initialCounts[type] - currentBlackCounts[type];
    for (let i = 0; i < missingBlack; i++) blackCaptured.push(type);

    const missingWhite = initialCounts[type] - currentWhiteCounts[type];
    for (let i = 0; i < missingWhite; i++) whiteCaptured.push(type);
  });

  const pieceValues: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let materialAdvantage = 0;
  for (const p of blackCaptured) materialAdvantage += pieceValues[p];
  for (const p of whiteCaptured) materialAdvantage -= pieceValues[p];

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* Top Captured Bar (Opponent pieces) */}
      <div className="w-full max-w-[500px] flex items-center justify-between px-2 py-1.5 mb-1 text-xs text-slate-400 font-mono-code bg-slate-900/60 rounded-t-lg border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600 inline-block"></span>
          <span className="font-semibold text-slate-300">
            {orientation === 'w' ? 'Black (Opponent)' : 'White (Opponent)'}
          </span>
          <div className="flex items-center gap-0.5 text-slate-400 text-sm">
            {(orientation === 'w' ? whiteCaptured : blackCaptured).map((type, idx) => (
              <span key={idx} className="opacity-90">
                {PIECE_UNICODE[`${orientation === 'w' ? 'w' : 'b'}${type}`]}
              </span>
            ))}
          </div>
        </div>
        {materialAdvantage !== 0 && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-amber-300">
            {orientation === 'w'
              ? materialAdvantage < 0 ? `+${Math.abs(materialAdvantage)}` : ''
              : materialAdvantage > 0 ? `+${materialAdvantage}` : ''}
          </span>
        )}
      </div>

      {/* Physical Board Frame */}
      <div className="relative p-2.5 sm:p-3 bg-gradient-to-b from-[#1e2738] to-[#121929] rounded-2xl shadow-2xl border border-slate-700/80 max-w-[520px] w-full aspect-square flex flex-col justify-between">
        {/* Hardware Sync Overlay Badge */}
        {isPhysicalBoardSyncing && (
          <div className="absolute top-4 right-4 z-20 px-2 py-1 bg-amber-500/90 text-slate-950 font-mono-code text-[10px] font-bold rounded-full shadow flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
            ESP32 SYNC
          </div>
        )}

        {/* 8x8 Board Grid */}
        <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden border-2 border-slate-800 shadow-inner relative bg-[#1c2230]">
          {displayRanks.map((rank, rIdx) =>
            displayFiles.map((file, fIdx) => {
              const sq = `${file}${rank}` as Square;
              const isDark = (rIdx + fIdx) % 2 === 1;
              const piece = chess.get(sq as ChessSquare);
              const isSelected = selectedSquare === sq;
              const isValidDest = validDestinations.includes(sq);
              const isLastMoveSq = lastMove && (lastMove.from === sq || lastMove.to === sq);
              const isCheckedKing = checkedKingSquare === sq;
              const led = boardLeds[sq];
              const hasMagneticPiece = hallSensors[sq];

              // Determine LED glow color style
              let ledBgStyle = '';
              let ledIndicatorColor = '';
              if (led) {
                if (led.r > 200 && led.g < 100) {
                  ledBgStyle = 'bg-red-500/30 led-glow-red border-red-500';
                  ledIndicatorColor = 'bg-red-500';
                } else if (led.g > 150 && led.r < 100) {
                  ledBgStyle = 'bg-emerald-500/30 led-glow-green border-emerald-500';
                  ledIndicatorColor = 'bg-emerald-500';
                } else if (led.b > 180 && led.g > 150) {
                  ledBgStyle = 'bg-cyan-500/30 led-glow-cyan border-cyan-400';
                  ledIndicatorColor = 'bg-cyan-400';
                } else {
                  ledBgStyle = 'bg-amber-500/30 led-glow-amber border-amber-400';
                  ledIndicatorColor = 'bg-amber-400';
                }
              }

              return (
                <div
                  key={sq}
                  onClick={() => onSquareClick(sq)}
                  onMouseEnter={() => setHoverSquare(sq)}
                  onMouseLeave={() => setHoverSquare(null)}
                  className={`relative flex items-center justify-center cursor-pointer transition-all duration-150 select-none ${
                    isDark ? 'bg-[#2a364f]' : 'bg-[#e2e8f0]'
                  } ${isSelected ? 'ring-4 ring-amber-400 ring-inset z-10' : ''} ${
                    isLastMoveSq ? 'bg-amber-400/25' : ''
                  } ${isCheckedKing ? 'bg-red-600/60 animate-pulse' : ''} ${ledBgStyle}`}
                >
                  {/* WS2812B Physical LED Dot in corner */}
                  {led && (
                    <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${ledIndicatorColor} shadow-lg shadow-current animate-ping opacity-75`}></span>
                      <span className={`w-2 h-2 rounded-full ${ledIndicatorColor} shadow-md`}></span>
                    </div>
                  )}

                  {/* Hall Sensor Magnet Badge (subtle magnetic detection indicator) */}
                  {hasMagneticPiece && (
                    <div 
                      title="Hall Sensor: Magnetic piece detected on physical board"
                      className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-indigo-500/60 pointer-events-none" 
                    />
                  )}

                  {/* Coordinate labels */}
                  {fIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] font-mono-code font-bold pointer-events-none ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  {rIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] font-mono-code font-bold pointer-events-none ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Chess piece */}
                  {piece && (
                    <div
                      className={`relative z-1 transition-transform transform ${
                        isSelected ? 'scale-110 -translate-y-1 drop-shadow-xl' : 'scale-100'
                      } ${hoverSquare === sq ? 'scale-105' : ''}`}
                    >
                      <span
                        className={`text-3xl sm:text-4xl leading-none font-bold ${
                          piece.color === 'w'
                            ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                            : 'text-slate-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]'
                        }`}
                      >
                        {PIECE_UNICODE[`${piece.color}${piece.type}`]}
                      </span>
                    </div>
                  )}

                  {/* Valid move target destination dot */}
                  {isValidDest && (
                    <div className="absolute z-10 inset-0 flex items-center justify-center pointer-events-none">
                      {piece ? (
                        <div className="w-full h-full border-4 border-amber-400/80 rounded-full animate-pulse" />
                      ) : (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500/80 rounded-full shadow-md shadow-emerald-500/40 animate-pulse" />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Captured Bar (Player pieces) */}
      <div className="w-full max-w-[500px] flex items-center justify-between px-2 py-1.5 mt-1 text-xs text-slate-400 font-mono-code bg-slate-900/60 rounded-b-lg border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300 inline-block"></span>
          <span className="font-semibold text-slate-300">
            {orientation === 'w' ? 'White (You)' : 'Black (You)'}
          </span>
          <div className="flex items-center gap-0.5 text-slate-300 text-sm">
            {(orientation === 'w' ? blackCaptured : whiteCaptured).map((type, idx) => (
              <span key={idx} className="opacity-90">
                {PIECE_UNICODE[`${orientation === 'w' ? 'b' : 'w'}${type}`]}
              </span>
            ))}
          </div>
        </div>
        {materialAdvantage !== 0 && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-amber-300">
            {orientation === 'w'
              ? materialAdvantage > 0 ? `+${materialAdvantage}` : ''
              : materialAdvantage < 0 ? `+${Math.abs(materialAdvantage)}` : ''}
          </span>
        )}
      </div>
    </div>
  );
};
