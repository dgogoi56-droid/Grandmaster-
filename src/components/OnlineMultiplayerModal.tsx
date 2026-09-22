import React, { useState } from 'react';
import { 
  Globe, 
  Users, 
  Copy, 
  Check, 
  Wifi, 
  Layers, 
  Lightbulb, 
  ShieldCheck, 
  Play, 
  RefreshCw,
  Award,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react';
import { OnlinePlayer, OnlineRoom } from '../types';

interface OnlineMultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineRoom: OnlineRoom | null;
  onStartMatchmaking: (timeControl: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onResign: () => void;
  onOfferDraw: () => void;
  onRematch: () => void;
  isMatchmaking: boolean;
}

export const OnlineMultiplayerModal: React.FC<OnlineMultiplayerModalProps> = ({
  isOpen,
  onClose,
  onlineRoom,
  onStartMatchmaking,
  onCreateRoom,
  onJoinRoom,
  onResign,
  onOfferDraw,
  onRematch,
  isMatchmaking,
}) => {
  const [roomInput, setRoomInput] = useState('');
  const [selectedTime, setSelectedTime] = useState('10+0');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (onlineRoom?.code) {
      navigator.clipboard.writeText(onlineRoom.code);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-[#0c1220] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-[#080d1a] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-tech text-base sm:text-lg font-bold text-white flex items-center gap-2">
                ONLINE MULTIPLAYER &bull; PHYSICAL BOARD BRIDGE
              </h2>
              <p className="text-xs text-slate-400">
                Play online opponents through your ESP32 electronic chessboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {/* Physical Board Protocol Explanation */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2 font-mono-code">
              <Zap className="w-3.5 h-3.5" />
              <span>HOW THE PHYSICAL BOARD COMMUNICATES ONLINE:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 font-mono-code">
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-amber-400 font-bold block mb-0.5">1. You Move</span>
                <span>ESP32 Hall sensor detects piece lift &amp; sends <code className="text-emerald-400">MOVE:e2e4</code> to online server.</span>
              </div>
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-blue-400 font-bold block mb-0.5">2. Server Sync</span>
                <span>Opponent receives move and responds with <code className="text-blue-400">MOVE:e7e5</code>.</span>
              </div>
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-emerald-400 font-bold block mb-0.5">3. 64-LED Illumination</span>
                <span>ESP32 lights up squares <code className="text-cyan-400">e7</code> &amp; <code className="text-cyan-400">e5</code> so you replicate it on the physical board!</span>
              </div>
            </div>
          </div>

          {/* Active Game Room or Matchmaking Lobby */}
          {onlineRoom?.status === 'playing' ? (
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="font-tech text-sm font-bold text-white">LIVE MATCH IN PROGRESS</span>
                </div>
                <span className="text-xs font-mono-code text-slate-400">
                  Room: {onlineRoom.code}
                </span>
              </div>

              {/* Opponent Card */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg">
                    {onlineRoom.playerBlack?.avatar || '♟'}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">
                      {onlineRoom.playerBlack?.name || 'Online Opponent'}
                    </div>
                    <div className="text-xs font-mono-code text-slate-400">
                      Rating: {onlineRoom.playerBlack?.rating || 1850} &bull; Ping: {onlineRoom.playerBlack?.pingMs || 28}ms
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono-code bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Physical Board Synced</span>
                </div>
              </div>

              {/* In-Game Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={onOfferDraw}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold font-mono-code transition-colors"
                >
                  Offer Draw
                </button>
                <button
                  onClick={onResign}
                  className="flex-1 py-2 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-lg text-xs font-semibold font-mono-code transition-colors"
                >
                  Resign
                </button>
                <button
                  onClick={onRematch}
                  className="flex-1 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 rounded-lg text-xs font-semibold font-mono-code transition-colors"
                >
                  Rematch
                </button>
              </div>
            </div>
          ) : (
            /* Matchmaking and Room Creation */
            <div className="space-y-4">
              {/* Option 1: Quick Matchmaking */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-tech text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    QUICK MATCHMAKING
                  </span>
                  <span className="text-xs text-slate-400 font-mono-code">Any Rated Player</span>
                </div>

                {/* Time control selector */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {['3+2 Blitz', '5+0 Blitz', '10+0 Rapid', '15+10 Classical'].map((tc) => (
                    <button
                      key={tc}
                      onClick={() => setSelectedTime(tc)}
                      className={`p-2 rounded-lg text-xs font-mono-code transition-all text-center border ${
                        selectedTime === tc
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {tc}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => onStartMatchmaking(selectedTime)}
                  disabled={isMatchmaking}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-lg text-xs font-mono-code flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  {isMatchmaking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Searching for Opponent...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Find Opponent &amp; Connect Board</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option 2: Private Room with Friend */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-tech text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  PLAY WITH A FRIEND VIA ROOM CODE
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Create Room */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-200 mb-1">Create Private Game</div>
                      <p className="text-[11px] text-slate-400 mb-3">
                        Generates a unique 6-character room code to share with your friend.
                      </p>
                    </div>
                    <button
                      onClick={onCreateRoom}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs font-mono-code transition-colors"
                    >
                      Create Game Room
                    </button>
                  </div>

                  {/* Join Room */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-200 mb-1">Join Friend's Room</div>
                      <p className="text-[11px] text-slate-400 mb-2">
                        Enter their room code (e.g. GM-4819).
                      </p>
                      <input
                        type="text"
                        placeholder="GM-XXXX"
                        value={roomInput}
                        onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono-code text-white mb-2 uppercase"
                      />
                    </div>
                    <button
                      onClick={() => onJoinRoom(roomInput)}
                      disabled={!roomInput.trim()}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs font-mono-code transition-colors"
                    >
                      Join Room
                    </button>
                  </div>
                </div>

                {onlineRoom?.code && (
                  <div className="mt-3 p-2.5 rounded-lg bg-blue-950/60 border border-blue-800 flex items-center justify-between text-xs font-mono-code">
                    <span className="text-blue-300">Your Active Room Code: <strong className="text-white">{onlineRoom.code}</strong></span>
                    <button
                      onClick={handleCopyCode}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1 transition-colors"
                    >
                      {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#080d1a] border-t border-slate-800 flex items-center justify-between text-xs font-mono-code text-slate-400">
          <span>ESP32 Physical Board Synchronization: Ready</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
