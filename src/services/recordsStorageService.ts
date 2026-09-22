import { StoredGameRecord, PersonalRecords, MoveRecord, GameResult } from '../types';
import { DIFFICULTY_LEVELS } from '../utils/difficultyLevels';

const GAMES_STORAGE_KEY = 'grandmaster_os_games_archive_v1';
const RECORDS_STORAGE_KEY = 'grandmaster_os_personal_records_v1';

// Initial sample games for initial room presentation if empty
const INITIAL_SAMPLE_GAMES: StoredGameRecord[] = [
  {
    id: 'game_rec_sample_1',
    timestamp: Date.now() - 86400000 * 2, // 2 days ago
    dateFormatted: new Date(Date.now() - 86400000 * 2).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    gameMode: 'vs-stockfish',
    difficultyLevel: 5,
    difficultyName: 'Advanced',
    difficultyElo: 1900,
    playerColor: 'w',
    opponentName: 'Stockfish AI (Level 5, ~1900 ELO)',
    result: 'win',
    winner: 'w',
    termination: 'checkmate',
    movesCount: 38,
    fullMoves: 19,
    durationSec: 412,
    finalFen: 'r1b2rk1/pp3ppp/2n1p3/3pP3/5PP1/2NB1Q2/P1P4P/R4RK1 b - - 0 19',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Bd2 Bxd2+ 8. Nbxd2 d5 9. exd5 Nxd5 10. Qb3 Nce7 11. O-O O-O 12. Rfe1 c6 13. a4 Rb8 14. Ne4 Bf5 15. Nc5 b6 16. Na6 Rc8 17. Ne5 Qd6 18. Re2 f6 19. Qf3 fxe5 1-0',
    moves: [],
    accuracyPercentage: 92.4,
    brilliantCount: 2,
    bestCount: 11,
    goodCount: 5,
    inaccuracyCount: 1,
    mistakeCount: 0,
    blunderCount: 0,
    notes: 'Flawless King-side initiative on ESP32 smartboard',
  },
  {
    id: 'game_rec_sample_2',
    timestamp: Date.now() - 86400000, // 1 day ago
    dateFormatted: new Date(Date.now() - 86400000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    gameMode: 'vs-stockfish',
    difficultyLevel: 6,
    difficultyName: 'Expert',
    difficultyElo: 2150,
    playerColor: 'w',
    opponentName: 'Stockfish AI (Level 6, ~2150 ELO)',
    result: 'win',
    winner: 'w',
    termination: 'resignation',
    movesCount: 46,
    fullMoves: 23,
    durationSec: 580,
    finalFen: '2r2rk1/5pp1/pp1b1q1p/3p4/P2P4/1PN2N1P/1Q3PP1/2R1R1K1 b - - 0 23',
    pgn: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. cxd5 exd5 5. Bg5 Be7 6. e3 c6 7. Bd3 Nbd7 8. Qc2 O-O 9. Nf3 Re8 10. O-O Nf8 11. h3 g6 12. Rab1 Ne6 13. Bh4 Ng7 14. b4 a6 15. a4 Bf5 16. Bxf5 Nxf5 17. Bxf6 Bxf6 18. b5 axb5 19. axb5 Qd6 20. bxc6 bxc6 21. Rfc1 Rec8 22. Na4 Rab8 23. Rxb8 1-0',
    moves: [],
    accuracyPercentage: 88.7,
    brilliantCount: 1,
    bestCount: 13,
    goodCount: 7,
    inaccuracyCount: 2,
    mistakeCount: 0,
    blunderCount: 0,
    notes: 'Queen-side minority attack conversion',
  },
  {
    id: 'game_rec_sample_3',
    timestamp: Date.now() - 3600000 * 5, // 5 hours ago
    dateFormatted: new Date(Date.now() - 3600000 * 5).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    gameMode: 'online-multiplayer',
    playerColor: 'w',
    opponentName: 'GrandmasterAlex (Rating 1840)',
    result: 'win',
    winner: 'w',
    termination: 'checkmate',
    movesCount: 32,
    fullMoves: 16,
    durationSec: 285,
    finalFen: 'r1bqk2r/pppp1ppp/2n5/4p3/1bB1P3/2NP1N2/PPP2PPP/R1BQK2R b KQkq - 0 6',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 a6 7. Bb3 Ba7 8. Nbd2 O-O 9. h3 h6 10. Re1 Re8 11. Nf1 Be6 12. Bc2 d5 13. Qe2 Qd7 14. Ng3 Rad8 15. Nh4 dxe4 16. dxe4 b5 1-0',
    moves: [],
    accuracyPercentage: 94.1,
    brilliantCount: 3,
    bestCount: 10,
    goodCount: 3,
    inaccuracyCount: 0,
    mistakeCount: 0,
    blunderCount: 0,
    notes: 'Online blitz synchronization match with Hall sensors',
  },
];

export function calculateAccuracyFromMoves(
  moves: MoveRecord[],
  playerColor: 'w' | 'b'
): {
  accuracy: number;
  brilliant: number;
  best: number;
  good: number;
  inaccuracy: number;
  mistake: number;
  blunder: number;
  captures: number;
} {
  const playerMoves = moves.filter((m) => m.color === playerColor);
  if (playerMoves.length === 0) {
    return {
      accuracy: 85.0,
      brilliant: 0,
      best: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
      captures: 0,
    };
  }

  let totalScore = 0;
  let brilliant = 0;
  let best = 0;
  let good = 0;
  let inaccuracy = 0;
  let mistake = 0;
  let blunder = 0;
  let captures = 0;

  for (const m of playerMoves) {
    if (m.captured) captures++;
    const t = m.evalType || 'good';
    switch (t) {
      case 'brilliant':
        totalScore += 100;
        brilliant++;
        break;
      case 'best':
      case 'book':
        totalScore += 100;
        best++;
        break;
      case 'good':
        totalScore += 85;
        good++;
        break;
      case 'inaccuracy':
        totalScore += 60;
        inaccuracy++;
        break;
      case 'mistake':
        totalScore += 30;
        mistake++;
        break;
      case 'blunder':
        totalScore += 0;
        blunder++;
        break;
      default:
        totalScore += 80;
        good++;
    }
  }

  const accuracy = Math.round((totalScore / playerMoves.length) * 10) / 10;
  return {
    accuracy,
    brilliant,
    best,
    good,
    inaccuracy,
    mistake,
    blunder,
    captures,
  };
}

export function recalculatePersonalRecords(games: StoredGameRecord[]): PersonalRecords {
  let totalGames = games.length;
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let highestAiLevelBeaten = 0;
  let highestAiEloBeaten = 0;
  let fastestCheckmateMoves: number | null = null;
  let fastestWinTimeSec: number | null = null;
  let highestAccuracy = 0;
  let totalCheckmates = 0;
  let totalBrilliantMoves = 0;
  let totalCaptures = 0;
  let totalPlayTimeSec = 0;

  // For streak calculation, sort chronological (oldest to newest)
  const chronological = [...games].sort((a, b) => a.timestamp - b.timestamp);
  let currentWinStreak = 0;
  let bestWinStreak = 0;
  let runningStreak = 0;

  for (const g of chronological) {
    if (g.result === 'win') {
      runningStreak++;
      if (runningStreak > bestWinStreak) {
        bestWinStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  // Current streak is from the most recent games backwards
  const newestFirst = [...games].sort((a, b) => b.timestamp - a.timestamp);
  for (const g of newestFirst) {
    if (g.result === 'win') {
      currentWinStreak++;
    } else {
      break;
    }
  }

  for (const g of games) {
    totalPlayTimeSec += g.durationSec || 0;
    totalBrilliantMoves += g.brilliantCount || 0;

    if (g.accuracyPercentage > highestAccuracy) {
      highestAccuracy = g.accuracyPercentage;
    }

    if (g.result === 'win') {
      wins++;

      // Check AI beaten
      if (g.gameMode === 'vs-stockfish' && g.difficultyLevel) {
        if (g.difficultyLevel > highestAiLevelBeaten) {
          highestAiLevelBeaten = g.difficultyLevel;
          highestAiEloBeaten = g.difficultyElo || (DIFFICULTY_LEVELS[g.difficultyLevel - 1]?.elo ?? 1500);
        }
      }

      // Fastest checkmate
      if (g.termination === 'checkmate') {
        totalCheckmates++;
        if (g.fullMoves > 0) {
          if (fastestCheckmateMoves === null || g.fullMoves < fastestCheckmateMoves) {
            fastestCheckmateMoves = g.fullMoves;
          }
        }
      }

      // Fastest win time (at least 15s to be realistic)
      if (g.durationSec > 10) {
        if (fastestWinTimeSec === null || g.durationSec < fastestWinTimeSec) {
          fastestWinTimeSec = g.durationSec;
        }
      }
    } else if (g.result === 'loss') {
      losses++;
    } else {
      draws++;
    }

    // Accumulate captures from moves
    for (const m of g.moves || []) {
      if (m.captured && m.color === g.playerColor) {
        totalCaptures++;
      }
    }
  }

  return {
    totalGames,
    wins,
    losses,
    draws,
    currentWinStreak,
    bestWinStreak,
    highestAiLevelBeaten,
    highestAiEloBeaten,
    fastestCheckmateMoves,
    fastestWinTimeSec,
    highestAccuracy,
    totalCheckmates,
    totalBrilliantMoves,
    totalCaptures,
    totalPlayTimeSec,
  };
}

class RecordsStorageService {
  private gamesCache: StoredGameRecord[] | null = null;
  private recordsCache: PersonalRecords | null = null;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    try {
      const stored = localStorage.getItem(GAMES_STORAGE_KEY);
      if (!stored) {
        // Initialize with default sample records so user has immediate rich data
        localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_GAMES));
        this.gamesCache = INITIAL_SAMPLE_GAMES;
        const stats = recalculatePersonalRecords(INITIAL_SAMPLE_GAMES);
        localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(stats));
        this.recordsCache = stats;
      }
    } catch {
      // In case localStorage is blocked or restricted
    }
  }

  public getGames(): StoredGameRecord[] {
    try {
      const raw = localStorage.getItem(GAMES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredGameRecord[];
        this.gamesCache = parsed;
        return parsed;
      }
    } catch {
      // fallback
    }
    return this.gamesCache || INITIAL_SAMPLE_GAMES;
  }

  public getPersonalRecords(): PersonalRecords {
    try {
      const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersonalRecords;
        this.recordsCache = parsed;
        return parsed;
      }
    } catch {
      // fallback
    }
    const games = this.getGames();
    const stats = recalculatePersonalRecords(games);
    this.recordsCache = stats;
    return stats;
  }

  public saveGame(
    gameData: Omit<StoredGameRecord, 'id' | 'timestamp' | 'dateFormatted'>
  ): StoredGameRecord {
    const currentGames = this.getGames();

    const now = Date.now();
    const formatted = new Date(now).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newRecord: StoredGameRecord = {
      ...gameData,
      id: `game_${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      dateFormatted: formatted,
    };

    // Prepend new game to list
    const updatedGames = [newRecord, ...currentGames].slice(0, 300); // keep up to 300 games
    this.gamesCache = updatedGames;

    try {
      localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(updatedGames));
    } catch {
      // Quota exceeded: trim older games
      const trimmed = updatedGames.slice(0, 50);
      try {
        localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(trimmed));
        this.gamesCache = trimmed;
      } catch {
        // failed
      }
    }

    const updatedRecords = recalculatePersonalRecords(this.gamesCache);
    this.recordsCache = updatedRecords;
    try {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(updatedRecords));
    } catch {
      // ignore
    }

    return newRecord;
  }

  public deleteGame(id: string): boolean {
    const currentGames = this.getGames();
    const filtered = currentGames.filter((g) => g.id !== id);
    this.gamesCache = filtered;

    try {
      localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(filtered));
      const stats = recalculatePersonalRecords(filtered);
      this.recordsCache = stats;
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(stats));
      return true;
    } catch {
      return false;
    }
  }

  public clearAllRecords(): void {
    this.gamesCache = [];
    const emptyStats = recalculatePersonalRecords([]);
    this.recordsCache = emptyStats;

    try {
      localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(emptyStats));
    } catch {
      // ignore
    }
  }

  public exportBackupJson(): string {
    const data = {
      appName: 'GRANDMASTER OS',
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      personalRecords: this.getPersonalRecords(),
      games: this.getGames(),
    };
    return JSON.stringify(data, null, 2);
  }

  public importBackupJson(jsonStr: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data.games)) {
        return { success: false, message: 'Invalid backup format: games list not found.' };
      }
      this.gamesCache = data.games;
      localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(data.games));
      const stats = recalculatePersonalRecords(data.games);
      this.recordsCache = stats;
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(stats));
      return { success: true, message: `Successfully imported ${data.games.length} games!` };
    } catch {
      return { success: false, message: 'JSON parsing failed. Please verify file format.' };
    }
  }
}

export const recordsStorage = new RecordsStorageService();
