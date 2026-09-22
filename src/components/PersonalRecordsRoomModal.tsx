import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Award, 
  Flame, 
  Zap, 
  Clock, 
  Target, 
  Swords, 
  Globe, 
  Bot, 
  Download, 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Search, 
  Play, 
  Sparkles, 
  X,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { StoredGameRecord, PersonalRecords } from '../types';
import { recordsStorage } from '../services/recordsStorageService';
import { copyPgnToClipboard } from '../utils/pgnExporter';

interface PersonalRecordsRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadGameForReview: (game: StoredGameRecord) => void;
  onShowToast: (msg: string) => void;
  onSaveCurrentGamePrompt?: () => void;
  hasActiveGameMoves?: boolean;
}

export const PersonalRecordsRoomModal: React.FC<PersonalRecordsRoomModalProps> = ({
  isOpen,
  onClose,
  onLoadGameForReview,
  onShowToast,
  onSaveCurrentGamePrompt,
  hasActiveGameMoves = false,
}) => {
  const [games, setGames] = useState<StoredGameRecord[]>(() => recordsStorage.getGames());
  const [records, setRecords] = useState<PersonalRecords>(() => recordsStorage.getPersonalRecords());
  const [activeFilter, setActiveFilter] = useState<'all' | 'win' | 'loss' | 'draw' | 'vs-stockfish' | 'online-multiplayer'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPgnId, setCopiedPgnId] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [selectedGameForDetails, setSelectedGameForDetails] = useState<StoredGameRecord | null>(null);

  // Refresh records and games
  const refreshData = () => {
    const loadedGames = recordsStorage.getGames();
    setGames(loadedGames);
    setRecords(recordsStorage.getPersonalRecords());
  };

  // Filtered games list
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      // Filter by category
      if (activeFilter === 'win' && g.result !== 'win') return false;
      if (activeFilter === 'loss' && g.result !== 'loss') return false;
      if (activeFilter === 'draw' && g.result !== 'draw') return false;
      if (activeFilter === 'vs-stockfish' && g.gameMode !== 'vs-stockfish') return false;
      if (activeFilter === 'online-multiplayer' && g.gameMode !== 'online-multiplayer') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const opponent = g.opponentName.toLowerCase();
        const mode = g.gameMode.toLowerCase();
        const diff = (g.difficultyName || '').toLowerCase();
        const notes = (g.notes || '').toLowerCase();
        return opponent.includes(query) || mode.includes(query) || diff.includes(query) || notes.includes(query);
      }
      return true;
    });
  }, [games, activeFilter, searchQuery]);

  if (!isOpen) return null;

  // Copy PGN for a specific game
  const handleCopyGamePgn = async (game: StoredGameRecord) => {
    const res = await copyPgnToClipboard(game.pgn);
    if (res.success) {
      setCopiedPgnId(game.id);
      onShowToast(`PGN copied: ${game.opponentName}`);
      setTimeout(() => setCopiedPgnId(null), 2000);
    } else {
      onShowToast('Failed to copy PGN.');
    }
  };

  // Download PGN file
  const handleDownloadPgn = (game: StoredGameRecord) => {
    const blob = new Blob([game.pgn], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chess_record_${game.id}.pgn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast(`Downloaded ${link.download}`);
  };

  // Delete a game
  const handleDeleteGame = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    recordsStorage.deleteGame(id);
    refreshData();
    onShowToast('Match record deleted.');
    if (selectedGameForDetails?.id === id) {
      setSelectedGameForDetails(null);
    }
  };

  // Clear all history
  const handleClearAll = () => {
    recordsStorage.clearAllRecords();
    refreshData();
    setConfirmClearOpen(false);
    setSelectedGameForDetails(null);
    onShowToast('All match records & history cleared.');
  };

  // Export JSON backup
  const handleExportJson = () => {
    const jsonStr = recordsStorage.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grandmaster_os_records_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('Personal records backup exported!');
  };

  // Import JSON backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = recordsStorage.importBackupJson(content);
        if (res.success) {
          refreshData();
          onShowToast(res.message);
        } else {
          onShowToast(res.message);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Format seconds to mm:ss
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const winRate = records.totalGames > 0 ? Math.round((records.wins / records.totalGames) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-5xl max-h-[92vh] bg-[#0c1220] border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* Modal Top Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-tech font-bold text-white tracking-wide">
                  PERSONAL RECORDS <span className="text-amber-400">ROOM</span>
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono-code bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                  HALL OF FAME & ARCHIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Persistent game history, milestone trophies, accuracy telemetry, and PGN vault.
              </p>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono-code flex items-center gap-1.5 transition-colors"
              title="Export all records as JSON backup"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Export Backup</span>
            </button>

            <label className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono-code flex items-center gap-1.5 transition-colors cursor-pointer" title="Import JSON backup">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Import</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Top Trophy Showcase & Career Records */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Highest AI Beaten */}
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-amber-500/10 to-slate-900/90 border border-amber-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono-code mb-1">
                <span>Peak AI Defeated</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-1">
                <div className="text-lg sm:text-xl font-bold font-tech text-amber-300">
                  {records.highestAiLevelBeaten > 0 ? `Level ${records.highestAiLevelBeaten}` : 'None'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {records.highestAiEloBeaten > 0 ? `~${records.highestAiEloBeaten} ELO Master` : 'Play AI mode to unlock'}
                </div>
              </div>
            </div>

            {/* 2. Win Streak */}
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-orange-500/10 to-slate-900/90 border border-orange-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono-code mb-1">
                <span>Win Streak</span>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <div className="mt-1">
                <div className="text-lg sm:text-xl font-bold font-tech text-orange-300 flex items-center gap-1">
                  <span>{records.bestWinStreak}</span>
                  <span className="text-xs text-orange-400/80 font-normal">best</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Current: <span className="text-orange-300 font-semibold">{records.currentWinStreak} wins</span>
                </div>
              </div>
            </div>

            {/* 3. Win Rate % */}
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-emerald-500/10 to-slate-900/90 border border-emerald-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono-code mb-1">
                <span>Career Win Rate</span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-1">
                <div className="text-lg sm:text-xl font-bold font-tech text-emerald-300">
                  {winRate}%
                </div>
                <div className="text-[11px] text-slate-400">
                  {records.wins}W &bull; {records.losses}L &bull; {records.draws}D
                </div>
              </div>
            </div>

            {/* 4. Fastest Checkmate */}
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-blue-500/10 to-slate-900/90 border border-blue-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono-code mb-1">
                <span>Fastest Mate</span>
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-1">
                <div className="text-lg sm:text-xl font-bold font-tech text-blue-300">
                  {records.fastestCheckmateMoves ? `${records.fastestCheckmateMoves} Moves` : 'N/A'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {records.totalCheckmates} total checkmates
                </div>
              </div>
            </div>

            {/* 5. Highest Accuracy */}
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-purple-500/10 to-slate-900/90 border border-purple-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono-code mb-1">
                <span>Peak Accuracy</span>
                <Target className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-1">
                <div className="text-lg sm:text-xl font-bold font-tech text-purple-300">
                  {records.highestAccuracy > 0 ? `${records.highestAccuracy}%` : 'N/A'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {records.totalBrilliantMoves} brilliant moves (!!)
                </div>
              </div>
            </div>

            {/* 6. Total Play Time */}
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-cyan-500/10 to-slate-900/90 border border-cyan-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono-code mb-1">
                <span>Total Matches</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-1">
                <div className="text-lg sm:text-xl font-bold font-tech text-cyan-300">
                  {records.totalGames} Games
                </div>
                <div className="text-[11px] text-slate-400">
                  {formatDuration(records.totalPlayTimeSec)} on board
                </div>
              </div>
            </div>
          </div>

          {/* Career Progress Breakdown Bar */}
          {records.totalGames > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-400">Record Distribution ({records.totalGames} Games):</span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">{records.wins} Wins</span>
                  <span className="text-rose-400 font-bold">{records.losses} Losses</span>
                  <span className="text-slate-400 font-bold">{records.draws} Draws</span>
                </div>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${(records.wins / records.totalGames) * 100}%` }}
                  title={`Wins: ${records.wins}`}
                />
                <div 
                  className="h-full bg-rose-500 transition-all duration-500" 
                  style={{ width: `${(records.losses / records.totalGames) * 100}%` }}
                  title={`Losses: ${records.losses}`}
                />
                <div 
                  className="h-full bg-slate-600 transition-all duration-500" 
                  style={{ width: `${(records.draws / records.totalGames) * 100}%` }}
                  title={`Draws: ${records.draws}`}
                />
              </div>
            </div>
          )}

          {/* Active Game Bookmark Bar (if ongoing game has moves) */}
          {hasActiveGameMoves && onSaveCurrentGamePrompt && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-amber-200">
                  You have an active game in progress on the board. Would you like to save it to your records vault right now?
                </span>
              </div>
              <button
                onClick={() => {
                  onSaveCurrentGamePrompt();
                  refreshData();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
              >
                <span>Save Active Game</span>
              </button>
            </div>
          )}

          {/* Match Vault Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-tech font-bold tracking-wider text-slate-200 uppercase">
                  Stored Match History ({filteredGames.length})
                </h3>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search opponent or mode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 w-44"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono-code">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-2 py-0.5 rounded ${activeFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFilter('win')}
                    className={`px-2 py-0.5 rounded ${activeFilter === 'win' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Wins
                  </button>
                  <button
                    onClick={() => setActiveFilter('loss')}
                    className={`px-2 py-0.5 rounded ${activeFilter === 'loss' ? 'bg-rose-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Losses
                  </button>
                  <button
                    onClick={() => setActiveFilter('vs-stockfish')}
                    className={`px-2 py-0.5 rounded ${activeFilter === 'vs-stockfish' ? 'bg-blue-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    vs AI
                  </button>
                  <button
                    onClick={() => setActiveFilter('online-multiplayer')}
                    className={`px-2 py-0.5 rounded ${activeFilter === 'online-multiplayer' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Online
                  </button>
                </div>
              </div>
            </div>

            {/* Games List or Empty State */}
            {filteredGames.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-400">No match records found</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchQuery ? 'Try clearing your search query or filter.' : 'Play and complete matches against Stockfish AI or online opponents to build your grandmaster legacy!'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredGames.map((game) => {
                  const isWin = game.result === 'win';
                  const isLoss = game.result === 'loss';
                  const isCopied = copiedPgnId === game.id;

                  return (
                    <div
                      key={game.id}
                      onClick={() => setSelectedGameForDetails(selectedGameForDetails?.id === game.id ? null : game)}
                      className="p-3 sm:p-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-2.5 group"
                    >
                      {/* Top Row: Result, Opponent, Mode, Date */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Outcome badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                              isWin
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : isLoss
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                            }`}
                          >
                            {isWin ? 'VICTORY' : isLoss ? 'DEFEAT' : 'DRAW'}
                          </span>

                          {/* Opponent & Mode */}
                          <div className="min-w-0 truncate">
                            <span className="font-semibold text-slate-200 text-sm group-hover:text-amber-300 transition-colors">
                              {game.opponentName}
                            </span>
                            <span className="text-slate-500 text-xs ml-2">
                              as {game.playerColor === 'w' ? 'White' : 'Black'}
                            </span>
                          </div>
                        </div>

                        {/* Mode & Date Badge */}
                        <div className="flex items-center gap-2 shrink-0 text-xs font-mono-code text-slate-400">
                          <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 border border-slate-700 uppercase">
                            {game.gameMode === 'vs-stockfish' 
                              ? `AI LV.${game.difficultyLevel || 1}` 
                              : game.gameMode === 'online-multiplayer' 
                              ? 'ONLINE' 
                              : 'LOCAL 2P'}
                          </span>
                          <span className="text-[11px] text-slate-400">{game.dateFormatted}</span>
                        </div>
                      </div>

                      {/* Middle Row: Telemetry Stats */}
                      <div className="flex items-center justify-between text-xs font-mono-code text-slate-400 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800/60">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{formatDuration(game.durationSec)}</span>
                          </span>
                          <span>&bull;</span>
                          <span>{game.fullMoves} moves ({game.movesCount} plies)</span>
                          <span>&bull;</span>
                          <span className="capitalize">{game.termination.replace('_', ' ')}</span>
                        </div>

                        {/* Accuracy badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          {game.accuracyPercentage > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50 text-[10px] font-semibold">
                              {game.accuracyPercentage}% Accuracy
                            </span>
                          )}
                          {game.brilliantCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 text-[10px] font-semibold">
                              {game.brilliantCount} !!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Action Buttons */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500 italic truncate max-w-sm">
                          {game.notes || `FEN: ${game.finalFen.substring(0, 24)}...`}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Load & Review on Board */}
                          <button
                            onClick={() => {
                              onLoadGameForReview(game);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                            title="Load this game onto the board for move-by-move analysis"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Review Game</span>
                          </button>

                          {/* Copy PGN */}
                          <button
                            onClick={() => handleCopyGamePgn(game)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                            title="Copy PGN string to clipboard"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>PGN</span>
                              </>
                            )}
                          </button>

                          {/* Download PGN */}
                          <button
                            onClick={() => handleDownloadPgn(game)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="Download .pgn file"
                          >
                            <Download className="w-3 h-3" />
                          </button>

                          {/* Delete Game */}
                          <button
                            onClick={(e) => handleDeleteGame(game.id, e)}
                            className="p-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                            title="Delete this match record"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Game PGN Preview Drawer */}
                      {selectedGameForDetails?.id === game.id && (
                        <div className="mt-2 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono-code text-slate-300 space-y-2 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1">
                            <span className="font-semibold text-amber-300">PGN Notation & Moves:</span>
                            <span>{game.movesCount} total plies</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed max-h-32 overflow-y-auto select-text break-words">
                            {game.pgn}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-[#080d1a] border-t border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400 font-mono-code">
          <div className="flex items-center gap-2">
            <span>Vault: {games.length} stored games</span>
            <span>&bull;</span>
            <span>Hardware: ESP32 Grandmaster Board</span>
          </div>

          <div className="flex items-center gap-2">
            {confirmClearOpen ? (
              <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-600/50 p-1 px-2 rounded-lg">
                <span className="text-rose-300 text-xs">Clear all records?</span>
                <button
                  onClick={handleClearAll}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  Yes, Clear
                </button>
                <button
                  onClick={() => setConfirmClearOpen(false)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClearOpen(true)}
                className="hover:text-rose-400 flex items-center gap-1 transition-colors text-slate-500"
                title="Reset all match history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Vault</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
