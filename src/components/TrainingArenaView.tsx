import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess, Square as ChessSquare } from 'chess.js';
import confetti from 'canvas-confetti';
import { 
  Square, 
  BoardLeds, 
  HallSensors 
} from '../types';
import { 
  TRAINING_LESSONS, 
  TrainingLesson, 
  LessonCategory, 
  LessonDifficulty, 
  CATEGORY_INFO 
} from '../data/trainingLessons';
import { trainingService } from '../services/trainingService';
import { sound } from '../services/soundService';
import { esp32 } from '../services/esp32Service';
import { ChessboardView } from './ChessboardView';
import { 
  GraduationCap, 
  BookOpen, 
  Zap, 
  Swords, 
  Trophy, 
  CheckCircle2, 
  RotateCcw, 
  Lightbulb, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  ArrowRight, 
  SlidersHorizontal,
  Bot,
  LineChart,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Target,
  Flame,
  Award,
  AlertCircle
} from 'lucide-react';

interface TrainingArenaViewProps {
  onLoadPositionToAnalysis: (fen: string, pgnOrMoves?: string) => void;
  onPracticeWithAi: (fen: string, playerColor: 'w' | 'b') => void;
  onShowToast: (msg: string) => void;
  hallSensors: HallSensors;
}

export const TrainingArenaView: React.FC<TrainingArenaViewProps> = ({
  onLoadPositionToAnalysis,
  onPracticeWithAi,
  onShowToast,
  hallSensors,
}) => {
  // Curriculum Filter States
  const [selectedCategory, setSelectedCategory] = useState<LessonCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<LessonDifficulty | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLessonId, setCurrentLessonId] = useState<string>(TRAINING_LESSONS[0].id);

  // Active Lesson State
  const currentLesson = useMemo(() => {
    return TRAINING_LESSONS.find((l) => l.id === currentLessonId) || TRAINING_LESSONS[0];
  }, [currentLessonId]);

  // Chessboard Engine for Active Drill
  const [chess] = useState<Chess>(() => new Chess(currentLesson.fen));
  const [, setForceUpdate] = useState({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validDestinations, setValidDestinations] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [boardLeds, setBoardLeds] = useState<BoardLeds>({});

  // Coaching & Feedback states
  const [feedbackState, setFeedbackState] = useState<'waiting' | 'correct' | 'wrong' | 'completed'>('waiting');
  const [wrongMoveReason, setWrongMoveReason] = useState<string>('');
  const [hintLevel, setHintLevel] = useState<number>(0); // 0 = none, 1 = concept, 2 = from sq, 3 = full move
  const [activeTab, setActiveTab] = useState<'practice' | 'theory' | 'curriculum'>('practice');

  // Overall statistics from training service
  const [stats, setStats] = useState(() => trainingService.getOverallStats());
  const [isCompleted, setIsCompleted] = useState(() => trainingService.isLessonCompleted(currentLesson.id));

  // Reset drill whenever current lesson changes
  const resetDrill = useCallback((lesson: TrainingLesson) => {
    chess.load(lesson.fen);
    setCurrentStepIndex(0);
    setSelectedSquare(null);
    setValidDestinations([]);
    setLastMove(null);
    setBoardLeds({});
    setFeedbackState('waiting');
    setWrongMoveReason('');
    setHintLevel(0);
    setIsCompleted(trainingService.isLessonCompleted(lesson.id));
    setForceUpdate({});

    // Sync ESP32 OLED screen
    esp32.updateOled({
      line1: 'TRAINING ARENA',
      line2: lesson.title.slice(0, 16),
      line3: `Turn: ${lesson.playerColor === 'w' ? 'WHITE' : 'BLACK'}`,
      line4: `Step 1/${lesson.steps.length}`,
      turn: lesson.playerColor === 'w' ? 'WHITE' : 'BLACK',
      mode: 'TRAIN',
      connectionIcon: 'BLE',
      clockWhite: '--:--',
      clockBlack: '--:--',
    });
    esp32.clearLeds();
  }, [chess]);

  useEffect(() => {
    resetDrill(currentLesson);
  }, [currentLesson, resetDrill]);

  // Handle Square Clicks on the practice board
  const handleSquareClick = useCallback((sq: Square) => {
    if (feedbackState === 'completed') return;

    const currentStep = currentLesson.steps[currentStepIndex];
    if (!currentStep) return;

    // Check if player clicked their own piece to select
    const piece = chess.get(sq as ChessSquare);
    const isPlayerTurn = chess.turn() === currentLesson.playerColor;

    if (piece && piece.color === currentLesson.playerColor && isPlayerTurn) {
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        setValidDestinations([]);
        return;
      }
      setSelectedSquare(sq);
      const moves = chess.moves({ square: sq as ChessSquare, verbose: true });
      const dests = moves.map((m) => m.to as Square);
      setValidDestinations(dests);
      sound.playEsp32Beep();
      return;
    }

    // Attempting a move from selectedSquare to sq
    if (selectedSquare && validDestinations.includes(sq)) {
      try {
        const moveRes = chess.move({
          from: selectedSquare as ChessSquare,
          to: sq as ChessSquare,
          promotion: 'q',
        });

        if (!moveRes) return;

        sound.playMove();
        setLastMove({ from: selectedSquare, to: sq });
        setSelectedSquare(null);
        setValidDestinations([]);

        // Validate against expected drill move
        const expectedSan = currentStep.playerMove.replace(/[+#]/g, '');
        const actualSan = moveRes.san.replace(/[+#]/g, '');
        const expectedUci = currentStep.playerMoveUci?.toLowerCase();
        const actualUci = `${moveRes.from}${moveRes.to}`.toLowerCase();

        const isCorrectMove = actualSan === expectedSan || (expectedUci && actualUci === expectedUci);

        if (isCorrectMove) {
          // Correct move played!
          setFeedbackState('correct');
          setWrongMoveReason('');
          setHintLevel(0);

          // LED celebration on physical board & screen
          esp32.setSquareLed(sq, { r: 16, g: 185, b: 129, mode: 'pulse' });
          setBoardLeds({ [sq]: { r: 16, g: 185, b: 129, mode: 'pulse' } });

          const nextStepIdx = currentStepIndex + 1;
          const isFinalStep = nextStepIdx >= currentLesson.steps.length;

          if (isFinalStep) {
            // Lesson completed!
            sound.playVictory();
            confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
            trainingService.markLessonCompleted(currentLesson.id);
            setStats(trainingService.getOverallStats());
            setIsCompleted(true);
            setFeedbackState('completed');
            onShowToast(`Lesson Complete: ${currentLesson.title}!`);
          } else {
            // Opponent response
            if (currentStep.opponentReply) {
              const oppReply = currentStep.opponentReply;
              setTimeout(() => {
                try {
                  const oppRes = chess.move(oppReply.san);
                  if (oppRes) {
                    sound.playCapture();
                    setLastMove({ from: oppRes.from as Square, to: oppRes.to as Square });
                    setCurrentStepIndex(nextStepIdx);
                    setFeedbackState('waiting');
                    setBoardLeds({});
                    setForceUpdate({});
                  }
                } catch {
                  setCurrentStepIndex(nextStepIdx);
                  setFeedbackState('waiting');
                  setBoardLeds({});
                  setForceUpdate({});
                }
              }, 600);
            } else {
              setCurrentStepIndex(nextStepIdx);
              setFeedbackState('waiting');
              setBoardLeds({});
            }
          }
        } else {
          // Wrong move played!
          sound.playIllegal();
          setFeedbackState('wrong');
          setWrongMoveReason(`"${moveRes.san}" was played. While legal, it allows the opponent counterplay. Try looking for the critical tactical theme!`);
          
          // Flash red LED on square
          esp32.setSquareLed(sq, { r: 239, g: 68, b: 68, mode: 'blink' });
          setBoardLeds({ [sq]: { r: 239, g: 68, b: 68, mode: 'blink' } });

          // Revert move back so player can try again
          setTimeout(() => {
            chess.undo();
            setLastMove(null);
            setBoardLeds({});
            setForceUpdate({});
          }, 700);
        }
      } catch {
        // illegal move
      }
      setForceUpdate({});
    }
  }, [
    chess, 
    currentLesson, 
    currentStepIndex, 
    feedbackState, 
    onShowToast, 
    selectedSquare, 
    validDestinations
  ]);

  // Give Hint Handler
  const handleRequestHint = useCallback(() => {
    const currentStep = currentLesson.steps[currentStepIndex];
    if (!currentStep) return;

    const nextHintLevel = Math.min(hintLevel + 1, 3);
    setHintLevel(nextHintLevel);
    sound.playEsp32Beep();

    // If level 2 or 3, highlight squares on board and ESP32
    if (nextHintLevel >= 2) {
      // Find source square from UCI or SAN
      let fromSq: Square | null = null;
      let toSq: Square | null = null;

      if (currentStep.playerMoveUci && currentStep.playerMoveUci.length >= 4) {
        fromSq = currentStep.playerMoveUci.slice(0, 2) as Square;
        toSq = currentStep.playerMoveUci.slice(2, 4) as Square;
      } else {
        // deduce from legal moves matching SAN
        const moves = chess.moves({ verbose: true });
        const match = moves.find((m) => m.san.replace(/[+#]/g, '') === currentStep.playerMove.replace(/[+#]/g, ''));
        if (match) {
          fromSq = match.from as Square;
          toSq = match.to as Square;
        }
      }

      if (fromSq) {
        const leds: BoardLeds = {
          [fromSq]: { r: 245, g: 158, b: 11, mode: 'pulse' }, // Amber
        };
        if (nextHintLevel === 3 && toSq) {
          leds[toSq] = { r: 16, g: 185, b: 129, mode: 'pulse' }; // Emerald
        }
        setBoardLeds(leds);
        esp32.sendHintsToBoard([fromSq, ...(toSq ? [toSq] : [])]);
      }
    }
  }, [chess, currentLesson, currentStepIndex, hintLevel]);

  // Filtered Lessons
  const filteredLessons = useMemo(() => {
    return TRAINING_LESSONS.filter((lesson) => {
      if (selectedCategory !== 'all' && lesson.category !== selectedCategory) return false;
      if (selectedDifficulty !== 'all' && lesson.difficulty !== selectedDifficulty) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = lesson.title.toLowerCase().includes(query);
        const matchSub = lesson.subtitle.toLowerCase().includes(query);
        const matchEco = lesson.eco?.toLowerCase().includes(query);
        const matchTags = lesson.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchSub && !matchEco && !matchTags) return false;
      }
      return true;
    });
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  // Navigation handlers
  const handleSelectNextLesson = () => {
    const idx = TRAINING_LESSONS.findIndex((l) => l.id === currentLesson.id);
    if (idx < TRAINING_LESSONS.length - 1) {
      setCurrentLessonId(TRAINING_LESSONS[idx + 1].id);
    }
  };

  const handleSelectPrevLesson = () => {
    const idx = TRAINING_LESSONS.findIndex((l) => l.id === currentLesson.id);
    if (idx > 0) {
      setCurrentLessonId(TRAINING_LESSONS[idx - 1].id);
    }
  };

  const currentStep = currentLesson.steps[currentStepIndex];

  return (
    <div className="w-full flex flex-col space-y-4 animate-in fade-in duration-300">
      {/* Top Training Arena Mastery Banner */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-slate-900 via-[#10172a] to-slate-900 border border-slate-800 p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <GraduationCap className="w-5 h-5" />
              </span>
              <h1 className="text-lg sm:text-xl font-bold font-tech text-white tracking-wide flex items-center gap-2">
                GRANDMASTER TRAINING ARENA
                <span className="text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Interactive Academy
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Master grandmaster openings, sharp opening traps, middlegame tactics (pins, forks, smothered mates, sacrifices), and theoretical endgame blueprints (Lucena Bridge, Philidor, Opposition). Practice right on the board with instant coaching feedback!
            </p>
          </div>

          {/* Mastery Stats Bar */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 shrink-0">
            <div className="text-center px-2 border-r border-slate-800">
              <div className="text-lg font-bold font-mono-code text-amber-400">
                {stats.completionPercentage}%
              </div>
              <div className="text-[10px] uppercase font-mono-code text-slate-500">Mastery</div>
            </div>
            <div className="text-center px-2 border-r border-slate-800">
              <div className="text-lg font-bold font-mono-code text-emerald-400">
                {stats.completedLessons}/{stats.totalLessons}
              </div>
              <div className="text-[10px] uppercase font-mono-code text-slate-500">Completed</div>
            </div>
            <div className="flex flex-col gap-1 text-[11px] font-mono-code text-slate-400 px-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-blue-400">Openings:</span>
                <span className="font-bold text-slate-200">{stats.openingsMastery}%</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-amber-400">Tactics:</span>
                <span className="font-bold text-slate-200">{stats.openingTacticsMastery}%</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-rose-400">Middlegame:</span>
                <span className="font-bold text-slate-200">{stats.middlegameMastery}%</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-emerald-400">Endgame:</span>
                <span className="font-bold text-slate-200">{stats.endgameMastery}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>All Curricula ({TRAINING_LESSONS.length})</span>
          </button>

          {(['openings', 'opening-tactics', 'middlegame-tactics', 'endgame-tactics'] as LessonCategory[]).map((cat) => {
            const info = CATEGORY_INFO[cat];
            const isCur = selectedCategory === cat;
            const count = TRAINING_LESSONS.filter((l) => l.category === cat).length;
            const mastery = trainingService.getCategoryMastery(cat);

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCur
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat === 'openings' && <BookOpen className="w-3.5 h-3.5" />}
                {cat === 'opening-tactics' && <Zap className="w-3.5 h-3.5" />}
                {cat === 'middlegame-tactics' && <Swords className="w-3.5 h-3.5" />}
                {cat === 'endgame-tactics' && <Trophy className="w-3.5 h-3.5" />}
                <span>{info.name}</span>
                <span className={`text-[10px] font-mono-code px-1.5 py-0.2 rounded-full font-bold ${
                  isCur ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}>
                  {mastery.completed}/{count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Workspace: Board on Left, Lesson Details & Catalog on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Interactive Practice Board & Coach's Corner (Col 1-7) */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-3">
          {/* Active Lesson Header Strip */}
          <div className="w-full max-w-[520px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono-code shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                currentLesson.playerColor === 'w' ? 'bg-white ring-2 ring-slate-400' : 'bg-slate-950 ring-2 ring-amber-400'
              }`} />
              <div className="truncate">
                <span className="text-amber-400 font-bold mr-1.5">
                  {currentLesson.playerColor === 'w' ? 'WHITE' : 'BLACK'} TO PLAY:
                </span>
                <span className="text-slate-200 font-semibold">{currentLesson.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {currentLesson.eco && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                  {currentLesson.eco}
                </span>
              )}
              {isCompleted ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>MASTERED</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  STEP {currentStepIndex + 1}/{currentLesson.steps.length}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Chessboard View */}
          <div className="w-full max-w-[520px] aspect-square relative shadow-2xl rounded-xl overflow-hidden border-2 border-slate-800 bg-slate-950">
            <ChessboardView
              chess={chess}
              boardLeds={boardLeds}
              hallSensors={hallSensors}
              orientation={currentLesson.playerColor}
              selectedSquare={selectedSquare}
              validDestinations={validDestinations}
              lastMove={lastMove}
              onSquareClick={handleSquareClick}
              isPhysicalBoardSyncing={false}
            />
          </div>

          {/* Coach's Objective & Step Guidance Card */}
          <div className="w-full max-w-[520px] rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5 shadow-md">
            {feedbackState === 'completed' ? (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>LESSON COMPLETED &amp; CONCEPT MASTERED!</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentLesson.successMessage}
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => resetDrill(currentLesson)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Practice Again</span>
                  </button>
                  <button
                    onClick={handleSelectNextLesson}
                    className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <span>Next Lesson</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : feedbackState === 'wrong' ? (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 space-y-1 animate-in shake">
                <div className="flex items-center gap-2 text-red-300 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>NOT THE CRITICAL MOVE!</span>
                </div>
                <p className="text-xs text-slate-300">{wrongMoveReason}</p>
                <div className="pt-1.5 flex items-center gap-2">
                  <button
                    onClick={handleRequestHint}
                    className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-amber-500/30 cursor-pointer"
                  >
                    <Lightbulb className="w-3 h-3" />
                    <span>Get Hint</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-tech font-bold text-amber-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    TACTICAL OBJECTIVE:
                  </span>
                  <span className="text-[11px] font-mono-code text-slate-400">
                    Step {currentStepIndex + 1} of {currentLesson.steps.length}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  {currentLesson.objective}
                </p>
                {currentStepIndex > 0 && currentLesson.steps[currentStepIndex - 1]?.coachNote && (
                  <p className="text-[11px] text-emerald-400 italic bg-emerald-950/20 p-2 rounded border border-emerald-500/20">
                    ✓ {currentLesson.steps[currentStepIndex - 1].coachNote}
                  </p>
                )}
              </div>
            )}

            {/* Hint Box (if revealed) */}
            {hintLevel > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 space-y-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Coach Hint (Level {hintLevel}/3):</span>
                </div>
                {hintLevel === 1 && (
                  <p className="text-slate-300 text-[11px]">{currentStep?.hint}</p>
                )}
                {hintLevel === 2 && (
                  <p className="text-slate-300 text-[11px]">
                    {currentStep?.hint} <br />
                    <span className="text-amber-300 font-semibold">
                      Board indicator: Look at the highlighted gold square for the key piece to move!
                    </span>
                  </p>
                )}
                {hintLevel === 3 && (
                  <p className="text-slate-200 text-[11px]">
                    Expected critical move: <strong className="text-amber-400 font-mono-code text-xs">{currentStep?.playerMove}</strong>.
                    <br />
                    {currentStep?.coachNote}
                  </p>
                )}
              </div>
            )}

            {/* Bottom Interactive Board Controls */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => resetDrill(currentLesson)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset this drill back to step 1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={handleRequestHint}
                  disabled={feedbackState === 'completed'}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    hintLevel > 0 
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40' 
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300'
                  }`}
                  title="Request progressive coaching hints"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{hintLevel === 0 ? 'Hint' : `Hint (${hintLevel}/3)`}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onPracticeWithAi(currentLesson.fen, currentLesson.playerColor)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Test position against Stockfish AI"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Play AI</span>
                </button>

                <button
                  onClick={() => onLoadPositionToAnalysis(chess.fen())}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-blue-200 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Load current position into Main Analysis Board with Stockfish evaluation"
                >
                  <LineChart className="w-3.5 h-3.5 text-blue-400" />
                  <span>Analyze</span>
                </button>

                <div className="flex items-center gap-1 ml-1 border-l border-slate-800 pl-1.5">
                  <button
                    onClick={handleSelectPrevLesson}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Previous Lesson"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSelectNextLesson}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Next Lesson"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Deep Theory & Curriculum Explorer (Col 8-12) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {/* Subtabs: Theory & Strategy vs Curriculum Library */}
          <div className="flex items-center justify-between bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'practice'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Deep Theory</span>
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'curriculum'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Curriculum Catalog ({filteredLessons.length})</span>
            </button>
          </div>

          {activeTab === 'practice' ? (
            /* Deep Theory & Strategic Blueprint for Selected Lesson */
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-4 shadow-md max-h-[620px] overflow-y-auto">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                    {CATEGORY_INFO[currentLesson.category].name}
                  </span>
                  <span className={`text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded ${
                    currentLesson.difficulty === 'Novice'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : currentLesson.difficulty === 'Intermediate'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : currentLesson.difficulty === 'Advanced'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}>
                    {currentLesson.difficulty}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white font-tech">{currentLesson.title}</h2>
                <p className="text-xs text-slate-400">{currentLesson.subtitle}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {currentLesson.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* In-depth Conceptual Master Explanation */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-tech">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  GRANDMASTER CONCEPT &amp; STRATEGY:
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  {currentLesson.explanation}
                </p>
              </div>

              {/* Key Ideas & Rules of Thumb */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-tech">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  CORE PRINCIPLES TO REMEMBER:
                </h3>
                <ul className="space-y-1.5">
                  {currentLesson.keyIdeas.map((idea, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 p-2 rounded border border-slate-800/50"
                    >
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 font-mono-code text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common Pitfalls / Mistakes */}
              {currentLesson.commonMistakes && currentLesson.commonMistakes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h3 className="text-xs font-bold text-red-300 flex items-center gap-1.5 font-tech">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    COMMON PITFALLS TO AVOID:
                  </h3>
                  <ul className="space-y-1">
                    {currentLesson.commonMistakes.map((mistake, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span className="text-red-400 font-bold shrink-0">✕</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Curriculum Library Explorer */
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-3 shadow-md max-h-[620px] flex flex-col">
              {/* Search & Filter Controls */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search openings, traps, Lucena, Greek Gift, ECO..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono-code">
                  <span className="text-slate-500 text-[10px] uppercase">Level:</span>
                  {(['all', 'Novice', 'Intermediate', 'Advanced'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        selectedDifficulty === diff
                          ? 'bg-slate-700 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lesson Items Scroll List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredLessons.map((lesson) => {
                  const isCurrent = lesson.id === currentLesson.id;
                  const isDone = trainingService.isLessonCompleted(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        setCurrentLessonId(lesson.id);
                        setActiveTab('practice');
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-amber-950/30 border-amber-500/60 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono-code font-bold px-1.5 py-0.2 rounded ${
                            lesson.category === 'openings'
                              ? 'bg-blue-500/20 text-blue-300'
                              : lesson.category === 'opening-tactics'
                              ? 'bg-amber-500/20 text-amber-300'
                              : lesson.category === 'middlegame-tactics'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {CATEGORY_INFO[lesson.category].name.split(' ')[0]}
                          </span>
                          <span className="text-[10px] font-mono-code text-slate-500">
                            {lesson.difficulty}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 truncate">{lesson.title}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{lesson.subtitle}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {lesson.steps.length} moves
                          </span>
                        )}
                        <ChevronRight className={`w-4 h-4 ${isCurrent ? 'text-amber-400' : 'text-slate-600'}`} />
                      </div>
                    </div>
                  );
                })}

                {filteredLessons.length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No lessons found matching &quot;{searchQuery}&quot;.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
