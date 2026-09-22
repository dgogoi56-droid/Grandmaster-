import React, { useState } from 'react';
import { 
  Bluetooth, 
  Wifi, 
  Cpu, 
  Volume2, 
  VolumeX, 
  Battery, 
  Radio, 
  Smartphone,
  Layers,
  Settings,
  Swords,
  Globe,
  LineChart,
  RefreshCw,
  Trophy,
  GraduationCap
} from 'lucide-react';
import { GameMode, ConnectionMode } from '../types';
import { esp32 } from '../services/esp32Service';
import { sound } from '../services/soundService';

interface HeaderBarProps {
  activeTab: GameMode | 'hardware';
  setActiveTab: (tab: GameMode | 'hardware') => void;
  connectionMode: ConnectionMode;
  onOpenHardwareModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenRecordsModal: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  setActiveTab,
  connectionMode,
  onOpenHardwareModal,
  onOpenSettingsModal,
  onOpenRecordsModal,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [isConnecting, setIsConnecting] = useState(false);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
    if (sound.enabled) {
      sound.playEsp32Beep();
    }
  };

  const handleQuickBle = async () => {
    setIsConnecting(true);
    try {
      await esp32.connectBle();
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <header className="w-full bg-[#0d1322] border-b border-slate-800/80 sticky top-0 z-30 shadow-lg select-none">
      {/* Top Android Status / Device Telemetry Bar */}
      <div className="px-3 sm:px-6 py-1.5 bg-[#080d1a] border-b border-slate-800/40 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono-code font-semibold tracking-wider text-amber-400">
            <Cpu className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            GRANDMASTER OS
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline font-mono-code text-[11px] text-slate-400">
            ESP32 DEV-BOARD v2.4
          </span>
        </div>

        {/* Right Status Indicators */}
        <div className="flex items-center gap-3 font-mono-code text-[11px]">
          {/* Connection status pill */}
          <button
            onClick={onOpenHardwareModal}
            className={`px-2 py-0.5 rounded-full flex items-center gap-1.5 transition-all text-[10px] font-semibold tracking-wide uppercase border ${
              connectionMode === 'ble'
                ? 'bg-blue-950/80 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-500/20'
                : connectionMode === 'wifi'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                : connectionMode === 'simulated'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}
          >
            {connectionMode === 'ble' && <Bluetooth className="w-3 h-3 text-blue-400" />}
            {connectionMode === 'wifi' && <Wifi className="w-3 h-3 text-emerald-400" />}
            {connectionMode === 'simulated' && <Smartphone className="w-3 h-3 text-amber-400" />}
            {connectionMode === 'disconnected' && <Radio className="w-3 h-3 text-slate-500" />}
            <span>
              {connectionMode === 'ble' ? 'ESP32 BLE' : connectionMode === 'wifi' ? 'ESP32 WI-FI' : connectionMode === 'simulated' ? 'BOARD SIM' : 'OFFLINE'}
            </span>
          </button>

          {/* ESP32 Battery */}
          <div className="flex items-center gap-1 text-slate-300">
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            <span>{esp32.batteryLevel}%</span>
          </div>

          {/* Quick BLE Connect button if disconnected or simulated */}
          <button
            onClick={handleQuickBle}
            disabled={isConnecting}
            title="Scan for ESP32 Bluetooth"
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isConnecting ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Audio toggle */}
          <button
            onClick={toggleSound}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title={soundEnabled ? 'Board Audio (PAM8403) Active' : 'Board Audio Muted'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {/* Personal Records Room Trophy Button */}
          <button
            onClick={onOpenRecordsModal}
            className="p-1 hover:bg-slate-800 rounded text-amber-400 hover:text-amber-300 transition-colors"
            title="Personal Records Room & Hall of Fame"
          >
            <Trophy className="w-3.5 h-3.5" />
          </button>

          {/* Settings modal button */}
          <button
            onClick={onOpenSettingsModal}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3">
        {/* App Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent border border-amber-500/30 flex items-center justify-center shadow-inner">
            <span className="font-tech text-xl font-bold text-amber-400 tracking-tighter">
              ♞
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-tech font-bold text-base sm:text-lg tracking-wide text-white">
                GRANDMASTER <span className="text-amber-400">OS</span>
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] uppercase font-mono-code bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded">
                Smart Chessboard
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Hardware Companion &bull; 64-LED &bull; Hall Matrix &bull; Stockfish
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('vs-stockfish')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'vs-stockfish'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Play</span>
          </button>

          <button
            onClick={() => setActiveTab('online-multiplayer')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'online-multiplayer'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Online</span>
          </button>

          <button
            onClick={() => setActiveTab('training')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'training'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-amber-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Open Grandmaster Training Arena (Openings, Tactics, Endgame Practice)"
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Training Arena</span>
            <span className="sm:hidden">Train</span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'analysis'
                ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analysis</span>
            <span className="sm:hidden">Review</span>
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'hardware'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hardware Lab</span>
            <span className="sm:hidden">Board</span>
          </button>

          <button
            onClick={onOpenRecordsModal}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all text-amber-300 hover:text-white hover:bg-amber-500/10 border border-amber-500/20"
            title="Personal Records Room & Match History"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Records Room</span>
            <span className="sm:hidden">Records</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
