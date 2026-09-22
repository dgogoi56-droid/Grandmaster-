export type Square = 
  | 'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8'
  | 'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7'
  | 'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6'
  | 'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5'
  | 'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4'
  | 'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3'
  | 'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2'
  | 'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1';

export type GameMode = 'local-2p' | 'vs-stockfish' | 'online-multiplayer' | 'analysis' | 'training';

export type ConnectionMode = 'disconnected' | 'ble' | 'wifi' | 'simulated';

export interface LedColor {
  r: number;
  g: number;
  b: number;
  mode?: 'solid' | 'pulse' | 'blink' | 'fade';
}

export type BoardLeds = Partial<Record<Square, LedColor>>;
export type HallSensors = Record<Square, boolean>;

export interface OledScreenState {
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  clockWhite: string;
  clockBlack: string;
  turn: 'WHITE' | 'BLACK';
  mode: string;
  connectionIcon: 'BLE' | 'WIFI' | 'NONE';
}

export interface SerialPacket {
  id: string;
  timestamp: string;
  direction: 'RX' | 'TX'; // RX = ESP32 -> App, TX = App -> ESP32
  raw: string;
  type: 'MOVE' | 'LIFT' | 'PLACE' | 'LED' | 'OLED' | 'TOUCH' | 'SOUND' | 'SYNC' | 'INFO';
  description: string;
}

export interface Esp32HardwareState {
  connectionMode: ConnectionMode;
  deviceName: string;
  ipAddress: string;
  bleRssi: number;
  batteryLevel: number; // percentage
  firmwareVersion: string;
  hallSensors: HallSensors;
  leds: BoardLeds;
  oled: OledScreenState;
  touchButtons: {
    btn1: boolean; // Reset / New Game
    btn2: boolean; // Undo
    btn3: boolean; // Hint LED
    btn4: boolean; // Confirm / Pass
  };
  speakerMuted: boolean;
  rawPackets: SerialPacket[];
}

export type MoveEvaluationType = 'brilliant' | 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'book';

export interface MoveRecord {
  san: string;
  uci: string;
  from: Square;
  to: Square;
  color: 'w' | 'b';
  fen: string;
  captured?: string;
  promotion?: string;
  eval?: number; // centipawns relative to white (+ is good for white)
  mate?: number; // moves to mate
  evalType?: MoveEvaluationType;
  coachComment?: string;
  timeTaken?: number;
}

export interface StockfishSettings {
  difficulty: number; // 1 to 8 (ELO 800 - 2850+)
  depth: number; // 2 to 20
  thinkTimeMs: number; // 200ms to 4000ms
  autoMove: boolean;
  showHints: boolean;
  coachEnabled: boolean;
}

export interface ClockSettings {
  initialMinutes: number;
  incrementSeconds: number;
  name: string;
}

export interface OnlinePlayer {
  id: string;
  name: string;
  rating: number;
  avatar: string;
  color: 'w' | 'b';
  ready: boolean;
  pingMs: number;
}

export interface OnlineRoom {
  code: string;
  status: 'idle' | 'searching' | 'matched' | 'playing' | 'ended';
  playerWhite: OnlinePlayer | null;
  playerBlack: OnlinePlayer | null;
  spectatorsCount: number;
  rematchOfferedBy?: 'w' | 'b';
  drawOfferedBy?: 'w' | 'b';
}

export type GameResult = 'win' | 'loss' | 'draw';

export type GameTermination = 
  | 'checkmate'
  | 'resignation'
  | 'timeout'
  | 'stalemate'
  | 'insufficient_material'
  | 'threefold_repetition'
  | 'draw_agreement'
  | 'abandoned'
  | 'manual';

export interface StoredGameRecord {
  id: string;
  timestamp: number;
  dateFormatted: string;
  gameMode: GameMode;
  difficultyLevel?: number;
  difficultyName?: string;
  difficultyElo?: number;
  playerColor: 'w' | 'b';
  opponentName: string;
  result: GameResult;
  winner: 'w' | 'b' | 'draw';
  termination: GameTermination;
  movesCount: number; // total plies
  fullMoves: number;
  durationSec: number;
  finalFen: string;
  pgn: string;
  moves: MoveRecord[];
  accuracyPercentage: number;
  brilliantCount: number;
  bestCount: number;
  goodCount: number;
  inaccuracyCount: number;
  mistakeCount: number;
  blunderCount: number;
  notes?: string;
}

export interface PersonalRecords {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  currentWinStreak: number;
  bestWinStreak: number;
  highestAiLevelBeaten: number; // 0 if none
  highestAiEloBeaten: number;
  fastestCheckmateMoves: number | null; // fewest full moves in a win
  fastestWinTimeSec: number | null; // shortest win time in seconds
  highestAccuracy: number; // highest accuracy in a game
  totalCheckmates: number;
  totalBrilliantMoves: number;
  totalCaptures: number;
  totalPlayTimeSec: number;
}
