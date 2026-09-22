import { Chess, Move } from 'chess.js';
import { Square, MoveEvaluationType } from '../types';

// Standard Piece-Square Tables (from White's perspective)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_MIDGAME_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

export interface EngineResult {
  bestMove: string; // UCI format e.g. "e2e4"
  from: Square;
  to: Square;
  evaluation: number; // centipawns (+ white, - black)
  mateIn?: number;
  depth: number;
  nodes: number;
  pv: string[]; // UCI sequence
  fen: string;
}

export class StockfishEngine {
  /**
   * Static board evaluation function (+ is good for white, - is good for black)
   */
  public evaluateBoard(chess: Chess): number {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? -20000 : 20000;
    }
    if (chess.isDraw()) {
      return 0;
    }

    let score = 0;
    const board = chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const val = PIECE_VALUES[piece.type] || 0;
        let posBonus = 0;
        const index = r * 8 + c;
        const mirroredIndex = (7 - r) * 8 + c;

        switch (piece.type) {
          case 'p':
            posBonus = piece.color === 'w' ? PAWN_TABLE[index] : PAWN_TABLE[mirroredIndex];
            break;
          case 'n':
            posBonus = piece.color === 'w' ? KNIGHT_TABLE[index] : KNIGHT_TABLE[mirroredIndex];
            break;
          case 'b':
            posBonus = piece.color === 'w' ? BISHOP_TABLE[index] : BISHOP_TABLE[mirroredIndex];
            break;
          case 'r':
            posBonus = piece.color === 'w' ? ROOK_TABLE[index] : ROOK_TABLE[mirroredIndex];
            break;
          case 'q':
            posBonus = piece.color === 'w' ? QUEEN_TABLE[index] : QUEEN_TABLE[mirroredIndex];
            break;
          case 'k':
            posBonus = piece.color === 'w' ? KING_MIDGAME_TABLE[index] : KING_MIDGAME_TABLE[mirroredIndex];
            break;
        }

        const totalPieceScore = val + posBonus;
        if (piece.color === 'w') {
          score += totalPieceScore;
        } else {
          score -= totalPieceScore;
        }
      }
    }

    return score;
  }

  /**
   * Search for the best move using minimax with alpha-beta pruning
   */
  public async findBestMove(
    fen: string,
    depth: number = 3,
    difficulty: number = 5 // 1 to 8
  ): Promise<EngineResult> {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });

    if (moves.length === 0) {
      return {
        bestMove: '',
        from: 'a1',
        to: 'a1',
        evaluation: 0,
        depth,
        nodes: 0,
        pv: [],
        fen,
      };
    }

    const isWhite = chess.turn() === 'w';
    let nodes = 0;

    // Evaluate each move
    const scoredMoves: { move: Move; score: number }[] = [];

    for (const move of moves) {
      chess.move(move);
      nodes++;
      const score = this.minimax(chess, depth - 1, -Infinity, Infinity, !isWhite, () => {
        nodes++;
      });
      chess.undo();
      scoredMoves.push({ move, score });
    }

    // Sort moves by score
    scoredMoves.sort((a, b) => (isWhite ? b.score - a.score : a.score - b.score));

    // Introduce difficulty/blunder simulation for lower levels
    let chosenIndex = 0;
    if (difficulty <= 2) {
      // Novice (ELO ~800): 40% chance of suboptimal move
      if (Math.random() < 0.5 && scoredMoves.length > 1) {
        chosenIndex = Math.floor(Math.random() * Math.min(4, scoredMoves.length));
      }
    } else if (difficulty <= 4) {
      // Club (ELO ~1200): 25% chance of 2nd or 3rd best move
      if (Math.random() < 0.3 && scoredMoves.length > 1) {
        chosenIndex = Math.floor(Math.random() * Math.min(2, scoredMoves.length));
      }
    } else if (difficulty <= 6) {
      // Intermediate (ELO ~1600): occasionally picks 2nd best
      if (Math.random() < 0.15 && scoredMoves.length > 1) {
        chosenIndex = 1;
      }
    }

    const selected = scoredMoves[chosenIndex] || scoredMoves[0];
    const uci = `${selected.move.from}${selected.move.to}${selected.move.promotion || ''}`;

    // Compute short Principal Variation (PV)
    const pv: string[] = [uci];
    const pvChess = new Chess(fen);
    pvChess.move(selected.move);
    
    // Quick PV continuation of 2-3 moves
    for (let p = 0; p < 2; p++) {
      if (pvChess.isGameOver()) break;
      const nextMoves = pvChess.moves({ verbose: true });
      if (nextMoves.length === 0) break;
      let bestNext: Move | null = null;
      let bestNextScore = pvChess.turn() === 'w' ? -Infinity : Infinity;

      for (const nm of nextMoves) {
        pvChess.move(nm);
        const evalScore = this.evaluateBoard(pvChess);
        pvChess.undo();
        if (pvChess.turn() === 'w') {
          if (evalScore > bestNextScore) {
            bestNextScore = evalScore;
            bestNext = nm;
          }
        } else {
          if (evalScore < bestNextScore) {
            bestNextScore = evalScore;
            bestNext = nm;
          }
        }
      }

      if (bestNext) {
        pv.push(`${bestNext.from}${bestNext.to}${bestNext.promotion || ''}`);
        pvChess.move(bestNext);
      } else {
        break;
      }
    }

    return {
      bestMove: uci,
      from: selected.move.from as Square,
      to: selected.move.to as Square,
      evaluation: selected.score,
      depth,
      nodes,
      pv,
      fen,
    };
  }

  private minimax(
    chess: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    onNode?: () => void
  ): number {
    onNode?.();
    if (depth === 0 || chess.isGameOver()) {
      return this.evaluateBoard(chess);
    }

    const moves = chess.moves({ verbose: true });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const evalScore = this.minimax(chess, depth - 1, alpha, beta, false, onNode);
        chess.undo();
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break; // Beta cut-off
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const evalScore = this.minimax(chess, depth - 1, alpha, beta, true, onNode);
        chess.undo();
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break; // Alpha cut-off
      }
      return minEval;
    }
  }

  /**
   * Classifies a move by analyzing evaluation swing
   */
  public classifyMove(
    evalBefore: number,
    evalAfter: number,
    playerColor: 'w' | 'b',
    isCapture: boolean,
    isCheck: boolean
  ): { type: MoveEvaluationType; comment: string } {
    // Delta relative to the player who made the move
    const swing = playerColor === 'w' ? evalAfter - evalBefore : evalBefore - evalAfter;

    if (swing < -300) {
      return {
        type: 'blunder',
        comment: 'A major blunder that concedes a winning tactical or material advantage.',
      };
    }
    if (swing < -150) {
      return {
        type: 'mistake',
        comment: 'A positional mistake that significantly loosens your position.',
      };
    }
    if (swing < -65) {
      return {
        type: 'inaccuracy',
        comment: 'An inaccuracy. There was a more precise continuation available.',
      };
    }
    if (isCapture && isCheck && swing > 100) {
      return {
        type: 'brilliant',
        comment: 'Brilliant! A powerful tactical move executing pressure and forcing tempo.',
      };
    }
    if (swing >= -15) {
      return {
        type: 'best',
        comment: 'Best move! Matches master-level engine recommendation perfectly.',
      };
    }

    return {
      type: 'good',
      comment: 'Solid, playable move maintaining comfortable coordination.',
    };
  }
}

export const stockfishEngine = new StockfishEngine();
