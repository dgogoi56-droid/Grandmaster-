import { Chess } from 'chess.js';
import { MoveRecord, GameMode, StockfishSettings, OnlineRoom } from '../types';

export interface PgnExportOptions {
  gameMode?: GameMode;
  stockfishSettings?: StockfishSettings;
  onlineRoom?: OnlineRoom | null;
  clockFormat?: string;
  result?: string;
  includeComments?: boolean;
  whiteName?: string;
  blackName?: string;
  eventName?: string;
  siteName?: string;
}

/**
 * Copies string text to the user's device clipboard with multiple fallback strategies
 * to ensure compatibility with iframes, Android WebViews, and desktop browsers.
 */
export async function copyPgnToClipboard(pgn: string): Promise<{ success: boolean; method: string }> {
  if (!pgn) {
    return { success: false, method: 'empty' };
  }

  // 1. Primary modern method: navigator.clipboard API
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(pgn);
      return { success: true, method: 'clipboard-api' };
    }
  } catch (err) {
    console.warn('navigator.clipboard.writeText failed, attempting execCommand fallback', err);
  }

  // 2. Secondary fallback method: temporary textarea with execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = pgn;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, 999999);
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) {
      return { success: true, method: 'execCommand' };
    }
  } catch (fallbackErr) {
    console.error('execCommand copy fallback failed', fallbackErr);
  }

  return { success: false, method: 'failed' };
}

/**
 * Generates a standard Seven Tag Roster PGN string compatible with Lichess, Chess.com, and FIDE PGN readers.
 */
export function generatePgnString(
  chess: Chess,
  moves: MoveRecord[],
  options: PgnExportOptions = {}
): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  // Determine game result
  let result = options.result || '*';
  let termination = 'In progress';

  if (chess.isCheckmate()) {
    result = chess.turn() === 'w' ? '0-1' : '1-0';
    termination = 'Normal - Checkmate';
  } else if (chess.isDraw()) {
    result = '1/2-1/2';
    if (chess.isStalemate()) termination = 'Normal - Stalemate';
    else if (chess.isThreefoldRepetition()) termination = 'Normal - Threefold repetition';
    else if (chess.isInsufficientMaterial()) termination = 'Normal - Insufficient material';
    else termination = 'Normal - Draw';
  }

  // Determine player labels based on mode
  let white = options.whiteName || 'Player (White)';
  let black = options.blackName || 'Player (Black)';

  if (options.gameMode === 'vs-stockfish') {
    const elo = options.stockfishSettings ? [800, 1100, 1400, 1650, 1900, 2150, 2400, 2850][options.stockfishSettings.difficulty - 1] : 1900;
    white = 'Human (ESP32 Board)';
    black = `Stockfish AI (Level ${options.stockfishSettings?.difficulty || 5}, ~${elo} ELO)`;
  } else if (options.gameMode === 'online-multiplayer' && options.onlineRoom) {
    if (options.onlineRoom.playerWhite) {
      white = `${options.onlineRoom.playerWhite.name} (${options.onlineRoom.playerWhite.rating})`;
    }
    if (options.onlineRoom.playerBlack) {
      black = `${options.onlineRoom.playerBlack.name} (${options.onlineRoom.playerBlack.rating})`;
    }
  }

  const event = options.eventName || 'Grandmaster OS ESP32 Smart Match';
  const site = options.siteName || 'ESP32 Electronic Chessboard';
  const timeControl = options.clockFormat || 'Rapid 10+0';

  const headers: string[] = [
    `[Event "${event}"]`,
    `[Site "${site}"]`,
    `[Date "${dateStr}"]`,
    `[Round "1"]`,
    `[White "${white}"]`,
    `[Black "${black}"]`,
    `[Result "${result}"]`,
    `[TimeControl "${timeControl}"]`,
    `[Time "${timeStr}"]`,
    `[Termination "${termination}"]`,
    `[Mode "ESP32 Hall-Sensor Magnetic Grid & WS2812B LEDs"]`,
  ];

  // Build move notation text
  const moveTokens: string[] = [];

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const moveNumber = Math.floor(i / 2) + 1;
    const isWhite = i % 2 === 0;

    let token = isWhite ? `${moveNumber}. ${move.san}` : `${move.san}`;

    // Add evaluation glyph or comment if available
    if (options.includeComments && move.evalType) {
      if (move.evalType === 'blunder') token += ' ??';
      else if (move.evalType === 'mistake') token += ' ?';
      else if (move.evalType === 'inaccuracy') token += ' ?!';
      else if (move.evalType === 'brilliant') token += ' !!';
    }

    if (options.includeComments && move.coachComment) {
      token += ` {${move.coachComment}}`;
    }

    moveTokens.push(token);
  }

  // Format into standard lines of ~70 characters
  let movesBody = '';
  let currentLine = '';

  for (const token of moveTokens) {
    if ((currentLine + ' ' + token).length > 72) {
      movesBody += (movesBody ? '\n' : '') + currentLine;
      currentLine = token;
    } else {
      currentLine = currentLine ? `${currentLine} ${token}` : token;
    }
  }
  if (currentLine) {
    movesBody += (movesBody ? '\n' : '') + currentLine;
  }

  if (moves.length === 0) {
    movesBody = '*';
  } else {
    movesBody += ` ${result}`;
  }

  return `${headers.join('\n')}\n\n${movesBody}\n`;
}

/**
 * Triggers browser file download for the PGN string
 */
export function downloadPgnFile(pgn: string, filename?: string) {
  const name = filename || `grandmaster_os_${new Date().toISOString().slice(0, 10)}.pgn`;
  const blob = new Blob([pgn], { type: 'application/x-chess-pgn;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
