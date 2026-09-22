import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess, Square as ChessSquare } from 'chess.js';
import confetti from 'canvas-confetti';
import { 
  Square, 
  GameMode, 
  ConnectionMode, 
  BoardLeds, 
  HallSensors, 
  MoveRecord, 
  StockfishSettings, 
  OnlineRoom, 
  OledScreenState 
} from './types';
import { esp32 } from './services/esp32Service';
import { stockfishEngine, EngineResult } from './services/stockfishEngine';
import { sound } from './services/soundService';
import { HeaderBar } from './components/HeaderBar';
import { ChessboardView } from './components/ChessboardView';
import { ChessClock } from './components/ChessClock';
import { EvaluationBar } from './components/EvaluationBar';
import { AnalysisPanel } from './components/AnalysisPanel';
import { BoardHardwareModal } from './components/BoardHardwareModal';
import { OnlineMultiplayerModal } from './components/OnlineMultiplayerModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportPgnModal } from './components/ExportPgnModal';
import { AiDifficultyModal } from './components/AiDifficultyModal';
import { PersonalRecordsRoomModal } from './components/PersonalRecordsRoomModal';
import { TrainingArenaView } from './components/TrainingArenaView';
import { DIFFICULTY_LEVELS, getDifficultyInfo } from './utils/difficultyLevels';
import { generatePgnString, copyPgnToClipboard } from './utils/pgnExporter';
import { recordsStorage, calculateAccuracyFromMoves } from './services/recordsStorageService';
import { StoredGameRecord, GameTermination } from './types';
import { 
  RotateCcw, 
  Flag, 
  Handshake, 
  Lightbulb, 
  Sparkles, 
  Bot, 
  Users, 
  Globe, 
  CheckCircle,
  Play,
  Pause,
  Shuffle,
  Copy,
  Check,
  FileText,
  Sliders,
  ChevronDown,
  Trophy,
  GraduationCap
} from 'lucide-react';

export default function App() {
  // Main Chess logic instance
  const [chess] = useState(() => new Chess());
  const [, setForceUpdate] = useState({});

  // Game UI state
  const [gameMode, setGameMode] = useState<GameMode>('vs-stockfish');
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validDestinations, setValidDestinations] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [isPhysicalBoardSyncing, setIsPhysicalBoardSyncing] = useState(false);

  // Hardware State
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>(esp32.connectionMode);
  const [boardLeds, setBoardLeds] = useState<BoardLeds>(esp32.leds);
  const [hallSensors, setHallSensors] = useState<HallSensors>(esp32.hallSensors);
  const [oledState, setOledState] = useState<OledScreenState>(esp32.oled);

  // Stockfish AI State
  const [engineResult, setEngineResult] = useState<EngineResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [stockfishSettings, setStockfishSettings] = useState<StockfishSettings>({
    difficulty: 5,
    depth: 4,
    thinkTimeMs: 400,
    autoMove: true,
    showHints: true,
    coachEnabled: true,
  });

  // Clocks
  const [whiteTimeSec, setWhiteTimeSec] = useState(600); // 10 minutes
  const [blackTimeSec, setBlackTimeSec] = useState(600);
  const [clockRunning, setClockRunning] = useState(false);
  const [clockFormat, setClockFormat] = useState('Rapid 10+0');
  const [clockIncrement, setClockIncrement] = useState(0);

  // Modals
  const [hardwareModalOpen, setHardwareModalOpen] = useState(false);
  const [onlineModalOpen, setOnlineModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [pgnModalOpen, setPgnModalOpen] = useState(false);
  const [aiDifficultyModalOpen, setAiDifficultyModalOpen] = useState(false);
  const [recordsModalOpen, setRecordsModalOpen] = useState(false);
  const [lastSavedGame, setLastSavedGame] = useState<StoredGameRecord | null>(null);
  const hasSavedCurrentGameRef = useRef(false);
  const movesRef = useRef(moves);
  movesRef.current = moves;
  const [ledBrightness, setLedBrightness] = useState(85);
  const [pgnCopiedDirectly, setPgnCopiedDirectly] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active AI difficulty level metadata
  const currentDiffInfo = useMemo(
    () => getDifficultyInfo(stockfishSettings.difficulty),
    [stockfishSettings.difficulty]
  );

  // Online Multiplayer state
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoom | null>(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);

  // Status banner
  const [statusMessage, setStatusMessage] = useState<string>('Grandmaster OS ready. White to move.');

  // Subscribe to ESP32 hardware events
  useEffect(() => {
    const unsubState = esp32.subscribeStateChange(() => {
      setConnectionMode(esp32.connectionMode);
      setBoardLeds({ ...esp32.leds });
      setHallSensors({ ...esp32.hallSensors });
      setOledState({ ...esp32.oled });
    });

    const unsubMoves = esp32.subscribeMoves((uci) => {
      handlePhysicalBoardMove(uci);
    });

    const unsubTouch = esp32.subscribeTouch((btn) => {
      handlePhysicalTouchButton(btn);
    });

    return () => {
      unsubState();
      unsubMoves();
      unsubTouch();
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  }, []);

  // Helper to persist completed game into records storage service
  const recordAndSaveGame = useCallback(
    (
      result: 'win' | 'loss' | 'draw',
      termination: GameTermination,
      winner: 'w' | 'b' | 'draw',
      gameMoves: MoveRecord[]
    ) => {
      if (gameMoves.length === 0) return null;

      const playerColor = orientation;
      const accuracyData = calculateAccuracyFromMoves(gameMoves, playerColor);

      let opponentName = 'Opponent';
      let diffLevel: number | undefined;
      let diffName: string | undefined;
      let diffElo: number | undefined;

      if (gameMode === 'vs-stockfish') {
        diffLevel = stockfishSettings.difficulty;
        const info = getDifficultyInfo(diffLevel);
        diffName = info.name;
        diffElo = info.elo;
        opponentName = `Stockfish AI (Lv.${diffLevel} ${diffName}, ~${diffElo} ELO)`;
      } else if (gameMode === 'online-multiplayer') {
        const opp = playerColor === 'w' ? onlineRoom?.playerBlack : onlineRoom?.playerWhite;
        opponentName = opp ? `${opp.name} (${opp.rating})` : 'Online Opponent';
      } else if (gameMode === 'local-2p') {
        opponentName = 'Player 2 (Local)';
      } else {
        opponentName = 'Analysis Session';
      }

      const pgn = generatePgnString(chess, gameMoves, {
        gameMode,
        stockfishSettings,
        onlineRoom,
        clockFormat,
        includeComments: true,
      });

      const initialClockSec = clockFormat.includes('Rapid') ? 600 : clockFormat.includes('Blitz') ? 180 : 300;
      const remainingSec = playerColor === 'w' ? whiteTimeSec : blackTimeSec;
      const durationSec = Math.max(10, initialClockSec - remainingSec);

      const saved = recordsStorage.saveGame({
        gameMode,
        difficultyLevel: diffLevel,
        difficultyName: diffName,
        difficultyElo: diffElo,
        playerColor,
        opponentName,
        result,
        winner,
        termination,
        movesCount: gameMoves.length,
        fullMoves: Math.ceil(gameMoves.length / 2),
        durationSec,
        finalFen: chess.fen(),
        pgn,
        moves: gameMoves,
        accuracyPercentage: accuracyData.accuracy,
        brilliantCount: accuracyData.brilliant,
        bestCount: accuracyData.best,
        goodCount: accuracyData.good,
        inaccuracyCount: accuracyData.inaccuracy,
        mistakeCount: accuracyData.mistake,
        blunderCount: accuracyData.blunder,
        notes: `${termination.toUpperCase().replace('_', ' ')} • ${accuracyData.accuracy}% accuracy`,
      });

      setLastSavedGame(saved);
      showToast(`Game archived in Personal Records Room (${result.toUpperCase()})!`);
      return saved;
    },
    [
      orientation,
      gameMode,
      stockfishSettings,
      onlineRoom,
      chess,
      clockFormat,
      whiteTimeSec,
      blackTimeSec,
      showToast,
    ]
  );

  // Clock countdown timer
  useEffect(() => {
    if (!clockRunning || chess.isGameOver()) return;

    const interval = setInterval(() => {
      const turn = chess.turn();
      if (turn === 'w') {
        setWhiteTimeSec((prev) => {
          if (prev <= 1) {
            setClockRunning(false);
            setStatusMessage('Black wins on time!');
            sound.playVictory();
            if (!hasSavedCurrentGameRef.current && movesRef.current.length > 0) {
              hasSavedCurrentGameRef.current = true;
              const playerWon = orientation === 'b';
              recordAndSaveGame(playerWon ? 'win' : 'loss', 'timeout', 'b', movesRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTimeSec((prev) => {
          if (prev <= 1) {
            setClockRunning(false);
            setStatusMessage('White wins on time!');
            sound.playVictory();
            if (!hasSavedCurrentGameRef.current && movesRef.current.length > 0) {
              hasSavedCurrentGameRef.current = true;
              const playerWon = orientation === 'w';
              recordAndSaveGame(playerWon ? 'win' : 'loss', 'timeout', 'w', movesRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [clockRunning, chess, orientation, recordAndSaveGame]);

  // Run Stockfish evaluation whenever position changes
  const runStockfishEvaluation = useCallback(async (fen: string) => {
    setIsCalculating(true);
    try {
      const res = await stockfishEngine.findBestMove(fen, stockfishSettings.depth, stockfishSettings.difficulty);
      setEngineResult(res);

      // Update OLED screen with evaluation and turn
      const evalPawns = (res.evaluation / 100).toFixed(1);
      esp32.updateOled({
        line1: 'GRANDMASTER OS',
        line2: chess.turn() === 'w' ? 'WHITE TO MOVE' : 'BLACK TO MOVE',
        line3: `EVAL: ${res.evaluation > 0 ? '+' : ''}${evalPawns} (D:${res.depth})`,
        line4: res.bestMove ? `BEST: ${res.bestMove.toUpperCase()}` : 'READY',
        turn: chess.turn() === 'w' ? 'WHITE' : 'BLACK',
      });
    } finally {
      setIsCalculating(false);
    }
  }, [stockfishSettings.depth, stockfishSettings.difficulty, chess]);

  // Handle move execution
  const executeMove = useCallback((from: Square, to: Square, promotionPiece = 'q') => {
    try {
      const evalBefore = engineResult ? engineResult.evaluation : stockfishEngine.evaluateBoard(chess);
      const isCapture = !!chess.get(to as ChessSquare);
      const turnBefore = chess.turn();

      const move = chess.move({
        from: from as ChessSquare,
        to: to as ChessSquare,
        promotion: promotionPiece,
      });

      if (!move) {
        sound.playIllegal();
        return false;
      }

      // Flash hardware sync badge
      setIsPhysicalBoardSyncing(true);
      setTimeout(() => setIsPhysicalBoardSyncing(false), 800);

      // Sound synthesis
      if (chess.inCheck()) {
        sound.playCheck();
      } else if (isCapture) {
        sound.playCapture();
      } else {
        sound.playMove();
      }

      // Add increment to clock
      if (clockIncrement > 0) {
        if (turnBefore === 'w') {
          setWhiteTimeSec((prev) => prev + clockIncrement);
        } else {
          setBlackTimeSec((prev) => prev + clockIncrement);
        }
      }

      // Calculate evaluation after move
      const evalAfter = stockfishEngine.evaluateBoard(chess);
      const classification = stockfishEngine.classifyMove(
        evalBefore,
        evalAfter,
        turnBefore,
        isCapture,
        chess.inCheck()
      );

      const newRecord: MoveRecord = {
        san: move.san,
        uci: `${from}${to}`,
        from,
        to,
        color: turnBefore,
        fen: chess.fen(),
        captured: move.captured,
        promotion: move.promotion,
        eval: evalAfter,
        evalType: classification.type,
        coachComment: classification.comment,
      };

      const nextMoves = [...moves, newRecord];
      setMoves(nextMoves);
      setCurrentMoveIndex(nextMoves.length - 1);
      setLastMove({ from, to });
      setSelectedSquare(null);
      setValidDestinations([]);
      setForceUpdate({});

      // Start clock if not already running
      if (!clockRunning && !chess.isGameOver()) {
        setClockRunning(true);
      }

      // Transmit to ESP32 physical board: lights up from/to WS2812B LEDs!
      esp32.sendMoveToBoard(from, to, 'GREEN');

      // If King in check, light up king square with pulsing red LED
      if (chess.inCheck()) {
        const board = chess.board();
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.type === 'k' && p.color === chess.turn()) {
              const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
              const kingSq = `${files[c]}${8 - r}` as Square;
              esp32.sendCheckAlert(kingSq);
            }
          }
        }
      }

      // Check game end conditions
      if (chess.isCheckmate()) {
        setClockRunning(false);
        const winner = turnBefore === 'w' ? 'White' : 'Black';
        setStatusMessage(`Checkmate! ${winner} wins.`);
        sound.playVictory();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

        if (!hasSavedCurrentGameRef.current && nextMoves.length > 0) {
          hasSavedCurrentGameRef.current = true;
          const playerWon = (orientation === 'w' && winner === 'White') || (orientation === 'b' && winner === 'Black');
          recordAndSaveGame(playerWon ? 'win' : 'loss', 'checkmate', winner === 'White' ? 'w' : 'b', nextMoves);
        }
      } else if (chess.isDraw()) {
        setClockRunning(false);
        setStatusMessage('Game drawn (Stalemate or insufficient material).');

        if (!hasSavedCurrentGameRef.current && nextMoves.length > 0) {
          hasSavedCurrentGameRef.current = true;
          recordAndSaveGame('draw', 'stalemate', 'draw', nextMoves);
        }
      } else if (chess.inCheck()) {
        setStatusMessage(`Check! ${chess.turn() === 'w' ? 'White' : 'Black'} is in check.`);
      } else {
        setStatusMessage(`${chess.turn() === 'w' ? 'White' : 'Black'} to move.`);
      }

      // Evaluate new position with Stockfish
      runStockfishEvaluation(chess.fen());

      // Trigger AI opponent move if playing vs Stockfish and it's Black's turn (or player is Black and it's White's turn)
      if (gameMode === 'vs-stockfish' && !chess.isGameOver()) {
        const isAiTurn = (orientation === 'w' && chess.turn() === 'b') || (orientation === 'b' && chess.turn() === 'w');
        if (isAiTurn) {
          triggerStockfishAiMove();
        }
      }

      // If in Online Multiplayer, send move over network
      if (gameMode === 'online-multiplayer' && onlineRoom?.status === 'playing') {
        simulateOnlineOpponentResponse();
      }

      return true;
    } catch {
      return false;
    }
  }, [chess, clockIncrement, clockRunning, engineResult, gameMode, moves, onlineRoom?.status, orientation, recordAndSaveGame, runStockfishEvaluation]);

  // AI response trigger
  const triggerStockfishAiMove = useCallback(() => {
    setTimeout(async () => {
      if (chess.isGameOver()) return;
      const res = await stockfishEngine.findBestMove(
        chess.fen(),
        stockfishSettings.depth,
        stockfishSettings.difficulty
      );
      if (res.from && res.to) {
        // Light up opponent move on physical board so the user knows what physical piece to move!
        esp32.sendMoveToBoard(res.from, res.to, 'CYAN');
        executeMove(res.from, res.to);
      }
    }, stockfishSettings.thinkTimeMs);
  }, [chess, executeMove, stockfishSettings.depth, stockfishSettings.difficulty, stockfishSettings.thinkTimeMs]);

  // Online opponent simulation bridge
  const simulateOnlineOpponentResponse = useCallback(() => {
    setTimeout(async () => {
      if (chess.isGameOver()) return;
      const res = await stockfishEngine.findBestMove(chess.fen(), 3, 6);
      if (res.from && res.to) {
        // Physical board illumination for online opponent move
        esp32.sendMoveToBoard(res.from, res.to, 'CYAN');
        executeMove(res.from, res.to);
      }
    }, 1500);
  }, [chess, executeMove]);

  // Physical board move received from ESP32 UART/BLE
  const handlePhysicalBoardMove = useCallback((uci: string) => {
    if (uci.length < 4) return;
    const from = uci.substring(0, 2) as Square;
    const to = uci.substring(2, 4) as Square;
    executeMove(from, to);
  }, [executeMove]);

  // Physical touch buttons (TTP224) on chessboard
  const handlePhysicalTouchButton = useCallback((btn: 1 | 2 | 3 | 4) => {
    if (btn === 1) {
      // BTN1: New Game
      handleNewGame();
    } else if (btn === 2) {
      // BTN2: Undo
      handleUndo();
    } else if (btn === 3) {
      // BTN3: Show Hint on 64-LEDs
      if (engineResult?.from && engineResult?.to) {
        esp32.sendHintsToBoard([engineResult.from, engineResult.to]);
      }
    } else if (btn === 4) {
      // BTN4: Confirm / Toggle Clock
      setClockRunning((prev) => !prev);
    }
  }, [engineResult?.from, engineResult?.to]);

  // Square click handler
  const handleSquareClick = (sq: Square) => {
    const piece = chess.get(sq as ChessSquare);

    // If a piece was already selected
    if (selectedSquare) {
      // If clicking same square, deselect
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        setValidDestinations([]);
        esp32.clearLeds();
        return;
      }

      // If valid destination, execute move
      if (validDestinations.includes(sq)) {
        executeMove(selectedSquare, sq);
        return;
      }

      // If clicking another of own pieces, change selection
      if (piece && piece.color === chess.turn()) {
        selectPiece(sq);
        return;
      }

      // Otherwise deselect
      setSelectedSquare(null);
      setValidDestinations([]);
      esp32.clearLeds();
    } else {
      // Select new piece if it belongs to active turn
      if (piece && piece.color === chess.turn()) {
        selectPiece(sq);
      }
    }
  };

  const selectPiece = (sq: Square) => {
    setSelectedSquare(sq);
    const legalMoves = chess.moves({ square: sq as ChessSquare, verbose: true });
    const dests = legalMoves.map((m) => m.to as Square);
    setValidDestinations(dests);

    // Send hint LEDs to physical board WS2812B
    esp32.sendHintsToBoard([sq, ...dests]);
    sound.playMove();
  };

  // Actions
  const handleNewGame = () => {
    chess.reset();
    setMoves([]);
    setCurrentMoveIndex(-1);
    setLastMove(null);
    setSelectedSquare(null);
    setValidDestinations([]);
    setWhiteTimeSec(600);
    setBlackTimeSec(600);
    setClockRunning(false);
    hasSavedCurrentGameRef.current = false;
    setLastSavedGame(null);
    setStatusMessage('New Game initialized. White to move.');
    esp32.clearLeds();
    esp32.updateOled({
      line1: 'GRANDMASTER OS',
      line2: 'NEW GAME READY',
      line3: 'WHITE TO MOVE',
      line4: 'CLOCK: 10:00',
      turn: 'WHITE',
    });
    runStockfishEvaluation(chess.fen());
    setForceUpdate({});
  };

  const handleUndo = () => {
    if (moves.length === 0) return;
    chess.undo();
    if (gameMode === 'vs-stockfish' && moves.length >= 2) {
      chess.undo(); // Undo both player and AI moves
      setMoves((prev) => prev.slice(0, -2));
      setCurrentMoveIndex((prev) => Math.max(-1, prev - 2));
    } else {
      setMoves((prev) => prev.slice(0, -1));
      setCurrentMoveIndex((prev) => Math.max(-1, prev - 1));
    }
    const history = chess.history({ verbose: true });
    const last = history[history.length - 1];
    setLastMove(last ? { from: last.from as Square, to: last.to as Square } : null);
    setSelectedSquare(null);
    setValidDestinations([]);
    esp32.clearLeds();
    runStockfishEvaluation(chess.fen());
    setStatusMessage('Move undone.');
    setForceUpdate({});
  };

  const handleResign = () => {
    setClockRunning(false);
    const winner = chess.turn() === 'w' ? 'Black' : 'White';
    setStatusMessage(`${chess.turn() === 'w' ? 'White' : 'Black'} resigned. ${winner} wins.`);
    sound.playIllegal();

    if (!hasSavedCurrentGameRef.current && moves.length > 0) {
      hasSavedCurrentGameRef.current = true;
      const playerResigned = (orientation === 'w' && chess.turn() === 'w') || (orientation === 'b' && chess.turn() === 'b');
      recordAndSaveGame(playerResigned ? 'loss' : 'win', 'resignation', winner === 'White' ? 'w' : 'b', moves);
    }
  };

  const handleDraw = () => {
    setClockRunning(false);
    setStatusMessage('Game drawn by mutual agreement.');

    if (!hasSavedCurrentGameRef.current && moves.length > 0) {
      hasSavedCurrentGameRef.current = true;
      recordAndSaveGame('draw', 'draw_agreement', 'draw', moves);
    }
  };

  // Review past archived game from Personal Records Room
  const handleLoadGameForReview = useCallback((record: StoredGameRecord) => {
    try {
      chess.reset();
      setGameMode('analysis');

      const replayedMoves: MoveRecord[] = [];
      for (const m of record.moves) {
        const res = chess.move({
          from: m.from as ChessSquare,
          to: m.to as ChessSquare,
          promotion: m.promotion || 'q',
        });
        if (res) {
          replayedMoves.push(m);
        }
      }

      if (replayedMoves.length > 0) {
        setMoves(replayedMoves);
        setCurrentMoveIndex(replayedMoves.length - 1);
        const last = replayedMoves[replayedMoves.length - 1];
        setLastMove({ from: last.from, to: last.to });
      } else if (record.pgn) {
        chess.loadPgn(record.pgn);
        const hist = chess.history({ verbose: true });
        const converted: MoveRecord[] = hist.map((h) => ({
          san: h.san,
          uci: `${h.from}${h.to}`,
          from: h.from as Square,
          to: h.to as Square,
          color: h.color,
          fen: h.after,
          captured: h.captured,
          promotion: h.promotion,
          evalType: 'good',
        }));
        setMoves(converted);
        setCurrentMoveIndex(converted.length - 1);
        const last = converted[converted.length - 1];
        setLastMove(last ? { from: last.from, to: last.to } : null);
      }

      setOrientation(record.playerColor);
      setClockRunning(false);
      setStatusMessage(`Reviewing record: vs ${record.opponentName} (${record.result.toUpperCase()})`);
      sound.playEsp32Beep();
      runStockfishEvaluation(chess.fen());
      showToast(`Loaded match vs ${record.opponentName} into Analysis view!`);
      setForceUpdate({});
    } catch {
      showToast('Could not load game record into board.');
    }
  }, [chess, runStockfishEvaluation, showToast]);

  // Manually save active game to personal records room on demand
  const handleManualSaveCurrentGame = useCallback(() => {
    if (moves.length === 0) {
      showToast('No moves made in current game to store.');
      return;
    }
    const isMate = chess.isCheckmate();
    const isDraw = chess.isDraw();
    let result: 'win' | 'loss' | 'draw' = 'draw';
    let winner: 'w' | 'b' | 'draw' = 'draw';
    let termination: GameTermination = 'manual';

    if (isMate) {
      termination = 'checkmate';
      winner = chess.turn() === 'b' ? 'w' : 'b';
      result = orientation === winner ? 'win' : 'loss';
    } else if (isDraw) {
      termination = 'stalemate';
      winner = 'draw';
      result = 'draw';
    }

    recordAndSaveGame(result, termination, winner, moves);
    hasSavedCurrentGameRef.current = true;
  }, [moves, chess, orientation, recordAndSaveGame, showToast]);

  // Load position from Training Arena into Main Analysis Board
  const handleLoadTrainingPositionToAnalysis = useCallback((fen: string) => {
    try {
      chess.load(fen);
      setMoves([]);
      setCurrentMoveIndex(-1);
      setLastMove(null);
      setGameMode('analysis');
      setOrientation(chess.turn());
      setClockRunning(false);
      setStatusMessage(`Analysis session from Training Arena (${chess.turn() === 'w' ? 'White' : 'Black'} to move)`);
      sound.playEsp32Beep();
      runStockfishEvaluation(fen);
      showToast('Training position loaded into Analysis Board!');
      setForceUpdate({});
    } catch {
      showToast('Could not load position into board.');
    }
  }, [chess, runStockfishEvaluation, showToast]);

  // Load position from Training Arena to play against Stockfish AI
  const handlePracticeTrainingWithAi = useCallback((fen: string, playerColor: 'w' | 'b') => {
    try {
      chess.load(fen);
      setMoves([]);
      setCurrentMoveIndex(-1);
      setLastMove(null);
      setGameMode('vs-stockfish');
      setOrientation(playerColor);
      setWhiteTimeSec(600);
      setBlackTimeSec(600);
      setClockRunning(true);
      setStatusMessage(`AI Challenge from Training Arena: Playing as ${playerColor === 'w' ? 'White' : 'Black'}`);
      sound.playEsp32Beep();
      runStockfishEvaluation(fen);
      showToast(`AI challenge started as ${playerColor === 'w' ? 'White' : 'Black'}!`);
      setForceUpdate({});

      // If it's AI's turn immediately, trigger move
      if (chess.turn() !== playerColor) {
        setTimeout(() => {
          triggerStockfishAiMove();
        }, 600);
      }
    } catch {
      showToast('Could not start AI practice for this position.');
    }
  }, [chess, runStockfishEvaluation, showToast, triggerStockfishAiMove]);

  const handleExportPgnToClipboard = useCallback(async () => {
    const pgn = generatePgnString(chess, moves, {
      gameMode,
      stockfishSettings,
      onlineRoom,
      clockFormat,
      includeComments: true,
    });
    const res = await copyPgnToClipboard(pgn);
    if (res.success) {
      setPgnCopiedDirectly(true);
      sound.playEsp32Beep();
      showToast(`PGN copied to clipboard (${moves.length} moves)!`);
      setTimeout(() => setPgnCopiedDirectly(false), 2000);
    } else {
      setPgnModalOpen(true);
      showToast('Please copy PGN from dialog.');
    }
  }, [chess, moves, gameMode, stockfishSettings, onlineRoom, clockFormat, showToast]);

  // Set AI Playing Hardness level (1 to 8)
  const handleSetDifficulty = useCallback(
    (level: number, autoDepth: boolean = true) => {
      const info = getDifficultyInfo(level);
      setStockfishSettings((prev) => ({
        ...prev,
        difficulty: level,
        ...(autoDepth ? { depth: info.depth } : {}),
      }));

      sound.playEsp32Beep();
      showToast(`AI Hardness: Level ${level} · ${info.name} (~${info.elo} ELO)`);

      esp32.updateOled({
        line3: `AI: LV${level} ${info.name.toUpperCase()}`,
      });

      // Update evaluation if currently in AI mode
      if (gameMode === 'vs-stockfish') {
        runStockfishEvaluation(chess.fen());
      }
    },
    [chess, gameMode, runStockfishEvaluation, showToast]
  );

  // Jump to historic move for analysis review
  const handleJumpToMove = (idx: number) => {
    setCurrentMoveIndex(idx);
    const tempChess = new Chess();
    for (let i = 0; i <= idx; i++) {
      if (moves[i]) {
        tempChess.move({
          from: moves[i].from as ChessSquare,
          to: moves[i].to as ChessSquare,
          promotion: moves[i].promotion,
        });
      }
    }
    runStockfishEvaluation(tempChess.fen());
  };

  // Initial evaluation on mount
  useEffect(() => {
    runStockfishEvaluation(chess.fen());
  }, [chess, runStockfishEvaluation]);

  // Online Multiplayer Handlers
  const handleStartMatchmaking = (timeControl: string) => {
    setIsMatchmaking(true);
    setStatusMessage(`Searching for online opponent (${timeControl})...`);
    setTimeout(() => {
      setIsMatchmaking(false);
      const room: OnlineRoom = {
        code: `GM-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'playing',
        playerWhite: {
          id: 'user_1',
          name: 'Physical Board User (You)',
          rating: 1720,
          avatar: '♔',
          color: 'w',
          ready: true,
          pingMs: 18,
        },
        playerBlack: {
          id: 'user_opp',
          name: 'Alex_Master',
          rating: 1845,
          avatar: '♚',
          color: 'b',
          ready: true,
          pingMs: 32,
        },
        spectatorsCount: 3,
      };
      setOnlineRoom(room);
      setGameMode('online-multiplayer');
      setClockRunning(true);
      setStatusMessage('Connected to online opponent! Your turn (White). Move physically on board.');
      esp32.updateOled({
        line1: 'ONLINE MATCH',
        line2: 'OPP: Alex_Master',
        line3: 'WHITE TO MOVE',
        line4: room.code,
      });
    }, 2000);
  };

  const handleCreateRoom = () => {
    const code = `GM-${Math.floor(1000 + Math.random() * 9000)}`;
    const room: OnlineRoom = {
      code,
      status: 'playing',
      playerWhite: {
        id: 'user_1',
        name: 'You (Physical Board)',
        rating: 1720,
        avatar: '♔',
        color: 'w',
        ready: true,
        pingMs: 12,
      },
      playerBlack: {
        id: 'user_friend',
        name: 'Friend (Web Guest)',
        rating: 1680,
        avatar: '♚',
        color: 'b',
        ready: true,
        pingMs: 24,
      },
      spectatorsCount: 1,
    };
    setOnlineRoom(room);
    setGameMode('online-multiplayer');
    setStatusMessage(`Room ${code} created. Physical board synced.`);
  };

  const handleJoinRoom = (code: string) => {
    const room: OnlineRoom = {
      code,
      status: 'playing',
      playerWhite: {
        id: 'user_host',
        name: 'Room Host',
        rating: 1800,
        avatar: '♔',
        color: 'w',
        ready: true,
        pingMs: 22,
      },
      playerBlack: {
        id: 'user_1',
        name: 'You (Physical Board)',
        rating: 1720,
        avatar: '♚',
        color: 'b',
        ready: true,
        pingMs: 15,
      },
      spectatorsCount: 2,
    };
    setOnlineRoom(room);
    setGameMode('online-multiplayer');
    setOrientation('b');
    setStatusMessage(`Joined room ${code}. Playing as Black.`);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-amber-500/30">
      {/* Android Top Header */}
      <HeaderBar
        activeTab={gameMode}
        setActiveTab={(tab) => {
          if (tab === 'hardware') {
            setHardwareModalOpen(true);
          } else if (tab === 'online-multiplayer') {
            setOnlineModalOpen(true);
            setGameMode('online-multiplayer');
          } else {
            setGameMode(tab);
          }
        }}
        connectionMode={connectionMode}
        onOpenHardwareModal={() => setHardwareModalOpen(true)}
        onOpenSettingsModal={() => setSettingsModalOpen(true)}
        onOpenRecordsModal={() => setRecordsModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6">
        {gameMode === 'training' ? (
          <TrainingArenaView
            onLoadPositionToAnalysis={handleLoadTrainingPositionToAnalysis}
            onPracticeWithAi={handlePracticeTrainingWithAi}
            onShowToast={showToast}
            hallSensors={hallSensors}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Board & Clock (Col 1 to 7 on desktop) */}
            <div className="lg:col-span-7 flex flex-col items-center space-y-3">
          {/* Status Message Pill */}
          <div className="w-full max-w-[520px] px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono-code shadow-sm">
            <div className="flex items-center gap-2 truncate">
              <span className={`w-2 h-2 rounded-full ${chess.inCheck() ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></span>
              <span className="font-semibold text-slate-200 truncate">{statusMessage}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {gameMode === 'vs-stockfish' ? (
                <button
                  onClick={() => setAiDifficultyModalOpen(true)}
                  className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer font-bold text-[10px] uppercase shadow-sm group"
                  title="Choose AI playing hardness level"
                >
                  <Bot className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>HARDNESS: LV.{stockfishSettings.difficulty} {currentDiffInfo.name}</span>
                  <ChevronDown className="w-3 h-3 text-amber-400/80" />
                </button>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 font-bold uppercase">
                  {gameMode === 'online-multiplayer' ? 'ONLINE SYNC' : 'LOCAL 2P'}
                </span>
              )}
            </div>
          </div>

          {/* Match Completion & Stored in Records Banner */}
          {chess.isGameOver() && (
            <div className="w-full max-w-[520px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/50 flex items-center justify-between gap-2 text-xs font-mono-code shadow-md animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                <span className="text-amber-200 font-semibold truncate">
                  Match completed &amp; saved to Personal Records Room!
                </span>
              </div>
              <button
                onClick={() => setRecordsModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <span>View Records</span>
              </button>
            </div>
          )}

          {/* AI Mode: Playing Hardness Selector Bar */}
          {gameMode === 'vs-stockfish' && (
            <div className="w-full max-w-[520px] px-3 py-1.5 rounded-xl bg-slate-900/95 border border-amber-500/30 flex items-center justify-between gap-2 text-xs font-mono-code shadow-sm">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-slate-400 text-[11px] flex items-center gap-1 shrink-0">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">AI Hardness:</span>
                </span>
                <button
                  onClick={() => setAiDifficultyModalOpen(true)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1 text-[11px] font-semibold transition-all group shrink-0"
                  title="Open AI Hardness Chooser (Levels 1 to 8, 800-2850+ ELO)"
                >
                  <span className={`font-bold ${currentDiffInfo.colorClass}`}>
                    Lv. {stockfishSettings.difficulty} {currentDiffInfo.name}
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">(~{currentDiffInfo.elo} ELO)</span>
                  <ChevronDown className="w-3 h-3 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>

              {/* Quick 1 to 8 Level Pills */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500 hidden md:inline mr-0.5">Quick:</span>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => {
                  const isCur = stockfishSettings.difficulty === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => handleSetDifficulty(lvl, true)}
                      className={`w-6 h-6 rounded text-[11px] font-bold flex items-center justify-center transition-all ${
                        isCur
                          ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30 scale-105 ring-1 ring-amber-400'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                      }`}
                      title={`Set Level ${lvl}: ${DIFFICULTY_LEVELS[lvl - 1].name} (~${DIFFICULTY_LEVELS[lvl - 1].elo} ELO)`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chessboard with Evaluation Bar */}
          <div className="w-full flex items-center justify-center gap-2 sm:gap-3">
            {/* Real-Time Stockfish Evaluation Bar */}
            <div className="h-full py-1">
              <EvaluationBar
                evaluation={engineResult?.evaluation || 0}
                mateIn={engineResult?.mateIn}
                depth={engineResult?.depth || stockfishSettings.depth}
                isCalculating={isCalculating}
              />
            </div>

            {/* 8x8 Electronic Chessboard with WS2812B LEDs */}
            <div className="flex-1 max-w-[500px]">
              <ChessboardView
                chess={chess}
                boardLeds={boardLeds}
                hallSensors={hallSensors}
                orientation={orientation}
                selectedSquare={selectedSquare}
                validDestinations={validDestinations}
                lastMove={lastMove}
                onSquareClick={handleSquareClick}
                isPhysicalBoardSyncing={isPhysicalBoardSyncing}
              />
            </div>
          </div>

          {/* Tournament Chess Clocks */}
          <div className="w-full max-w-[520px]">
            <ChessClock
              whiteTimeSec={whiteTimeSec}
              blackTimeSec={blackTimeSec}
              activeSide={chess.turn()}
              isRunning={clockRunning}
              formatName={clockFormat}
              onTogglePlayPause={() => setClockRunning((prev) => !prev)}
              onResetClock={() => {
                setWhiteTimeSec(600);
                setBlackTimeSec(600);
                setClockRunning(false);
              }}
              onSelectPreset={(mins, inc, name) => {
                setWhiteTimeSec(mins * 60);
                setBlackTimeSec(mins * 60);
                setClockIncrement(inc);
                setClockFormat(name);
                setClockRunning(false);
              }}
            />
          </div>

          {/* Physical & App Game Controls Bar */}
          <div className="w-full max-w-[520px] bg-slate-900/90 rounded-xl p-2 border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono-code">
            <button
              onClick={handleNewGame}
              className="flex-1 py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              title="Reset Board and Start New Game (TTP224 BTN1)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>New Game</span>
            </button>

            <button
              onClick={handleUndo}
              disabled={moves.length === 0}
              className="flex-1 py-2 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              title="Undo Last Move (TTP224 BTN2)"
            >
              <span>Undo</span>
            </button>

            <button
              onClick={() => {
                if (engineResult?.from && engineResult?.to) {
                  esp32.sendHintsToBoard([engineResult.from, engineResult.to]);
                }
              }}
              className="flex-1 py-2 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              title="Light up best move on physical board (TTP224 BTN3)"
            >
              <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
              <span>LED Hint</span>
            </button>

            {/* AI Hardness Button during AI Mode */}
            {gameMode === 'vs-stockfish' && (
              <button
                onClick={() => setAiDifficultyModalOpen(true)}
                className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-amber-500/20"
                title="Choose level of playing hardness during AI mode"
              >
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">AI Level:</span>
                <span className="font-bold text-amber-300">Lv.{stockfishSettings.difficulty}</span>
              </button>
            )}

            {/* Export PGN to Clipboard */}
            <button
              onClick={handleExportPgnToClipboard}
              className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                pgnCopiedDirectly
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700/60'
              }`}
              title="Export current game's move history as PGN string to clipboard"
            >
              {pgnCopiedDirectly ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy PGN</span>
                </>
              )}
            </button>

            {/* Personal Records Room Button */}
            <button
              onClick={() => setRecordsModalOpen(true)}
              className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-amber-500/20"
              title="Open Personal Records Room & Match Vault"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Records Room</span>
              <span className="sm:hidden">Records</span>
            </button>

            <button
              onClick={handleDraw}
              disabled={chess.isGameOver()}
              className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center gap-1 transition-colors"
              title="Offer Draw"
            >
              <Handshake className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResign}
              disabled={chess.isGameOver()}
              className="py-2 px-2.5 bg-red-950/50 hover:bg-red-900/50 text-red-300 border border-red-800/40 rounded-lg flex items-center justify-center gap-1 transition-colors"
              title="Resign Game"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Analysis, Stockfish, Coach & Hardware Telemetry (Col 8 to 12) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Analysis & Move History Panel */}
          <div className="h-[440px]">
            <AnalysisPanel
              moves={moves}
              currentMoveIndex={currentMoveIndex}
              engineResult={engineResult}
              onJumpToMove={handleJumpToMove}
              onSendHintToBoard={(squares) => esp32.sendHintsToBoard(squares)}
              isEngineActive={isCalculating}
              onOpenPgnModal={() => setPgnModalOpen(true)}
              onOpenRecordsModal={() => setRecordsModalOpen(true)}
              onOpenTrainingArena={() => setGameMode('training')}
              onShowToast={showToast}
            />
          </div>

          {/* Quick Hardware & Online Launchers */}
          <div className="grid grid-cols-2 gap-3">
            {/* Grandmaster Training Arena Launcher Card */}
            <div
              onClick={() => setGameMode('training')}
              className="p-3 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 hover:to-amber-950/50 rounded-xl border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer shadow-md group col-span-2"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-tech text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  GRANDMASTER TRAINING ARENA &amp; ACADEMY
                </span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  OPENINGS • TACTICS • ENDGAMES
                </span>
              </div>
              <p className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">
                Learn and practice every essential opening, lethal opening traps, middlegame tactics (Greek Gift, Smothered Mate, Pins &amp; Forks), and theoretical endgame blueprints (Lucena Bridge, Philidor, Opposition).
              </p>
            </div>

            {/* Open Hardware Lab Card */}
            <div
              onClick={() => setHardwareModalOpen(true)}
              className="p-3 bg-gradient-to-br from-slate-900 to-slate-950 hover:to-slate-900/90 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer shadow-md group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-tech text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  BOARD LAB
                </span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  ESP32
                </span>
              </div>
              <p className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">
                Inspect 0.96" OLED screen, test 64 Hall-effect sensors &amp; WS2812B LEDs.
              </p>
            </div>

            {/* Online Multiplayer Card */}
            <div
              onClick={() => setOnlineModalOpen(true)}
              className="p-3 bg-gradient-to-br from-slate-900 to-slate-950 hover:to-slate-900/90 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer shadow-md group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-tech text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  MULTIPLAYER
                </span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">
                Play friends or matchmaking using physical chessboard move detection.
              </p>
            </div>

            {/* Personal Records Room Card */}
            <div
              onClick={() => setRecordsModalOpen(true)}
              className="p-3 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 hover:to-amber-950/60 rounded-xl border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer shadow-md group col-span-2"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-tech text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  PERSONAL RECORDS ROOM &amp; GAME VAULT
                </span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  HALL OF FAME
                </span>
              </div>
              <p className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">
                View career win streaks, AI defeat records (up to Grandmaster Lv.8), accuracy history, and reload past games into board.
              </p>
            </div>
          </div>
        </div>
      </div>
    )}
  </main>

      {/* Floating Hardware Diagnostics & Modals */}
      <BoardHardwareModal
        isOpen={hardwareModalOpen}
        onClose={() => setHardwareModalOpen(false)}
        boardLeds={boardLeds}
        hallSensors={hallSensors}
        oledState={oledState}
        connectionMode={connectionMode}
        onToggleHall={(sq) => esp32.toggleHallSensor(sq)}
        onSimulateMove={(from, to) => executeMove(from, to)}
        onTouchBtn={(btn) => handlePhysicalTouchButton(btn)}
      />

      <OnlineMultiplayerModal
        isOpen={onlineModalOpen}
        onClose={() => setOnlineModalOpen(false)}
        onlineRoom={onlineRoom}
        onStartMatchmaking={handleStartMatchmaking}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onResign={handleResign}
        onOfferDraw={handleDraw}
        onRematch={handleNewGame}
        isMatchmaking={isMatchmaking}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        stockfishSettings={stockfishSettings}
        onUpdateStockfish={(st) => setStockfishSettings((prev) => ({ ...prev, ...st }))}
        ledBrightness={ledBrightness}
        onUpdateBrightness={(b) => setLedBrightness(b)}
        boardOrientation={orientation}
        onToggleOrientation={() => setOrientation((prev) => (prev === 'w' ? 'b' : 'w'))}
      />

      {/* PGN Export & Clipboard Modal */}
      <ExportPgnModal
        isOpen={pgnModalOpen}
        onClose={() => setPgnModalOpen(false)}
        chess={chess}
        moves={moves}
        gameMode={gameMode}
        stockfishSettings={stockfishSettings}
        onlineRoom={onlineRoom}
        clockFormat={clockFormat}
        onShowToast={showToast}
      />

      {/* AI Playing Hardness Level Chooser Modal */}
      <AiDifficultyModal
        isOpen={aiDifficultyModalOpen}
        onClose={() => setAiDifficultyModalOpen(false)}
        stockfishSettings={stockfishSettings}
        onSelectDifficulty={(lvl, autoDepth) => {
          handleSetDifficulty(lvl, autoDepth);
          setAiDifficultyModalOpen(false);
        }}
        onUpdateSettings={(st) => {
          setStockfishSettings((prev) => ({ ...prev, ...st }));
        }}
      />

      {/* Personal Records Room & Match Vault Modal */}
      <PersonalRecordsRoomModal
        isOpen={recordsModalOpen}
        onClose={() => setRecordsModalOpen(false)}
        onLoadGameForReview={handleLoadGameForReview}
        onSaveCurrentGamePrompt={handleManualSaveCurrentGame}
        onShowToast={showToast}
        hasActiveGameMoves={moves.length > 0}
      />

      {/* Floating Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 border border-amber-500/40 text-amber-300 text-xs font-mono-code font-semibold rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
