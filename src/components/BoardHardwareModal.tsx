import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Bluetooth, 
  Wifi, 
  Terminal, 
  Sliders, 
  Radio, 
  Lightbulb, 
  Sparkles, 
  Layers, 
  Play, 
  RotateCcw, 
  Send, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Square, ConnectionMode, BoardLeds, HallSensors, OledScreenState, SerialPacket } from '../types';
import { esp32 } from '../services/esp32Service';
import { sound } from '../services/soundService';

interface BoardHardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardLeds: BoardLeds;
  hallSensors: HallSensors;
  oledState: OledScreenState;
  connectionMode: ConnectionMode;
  onToggleHall: (sq: Square) => void;
  onSimulateMove: (from: Square, to: Square) => void;
  onTouchBtn: (btn: 1 | 2 | 3 | 4) => void;
}

export const BoardHardwareModal: React.FC<BoardHardwareModalProps> = ({
  isOpen,
  onClose,
  boardLeds,
  hallSensors,
  oledState,
  connectionMode,
  onToggleHall,
  onSimulateMove,
  onTouchBtn,
}) => {
  const [activeTab, setActiveTab] = useState<'oled-led' | 'hall' | 'terminal' | 'connection'>('oled-led');
  const [ipInput, setIpInput] = useState(esp32.ipAddress);
  const [manualCmd, setManualCmd] = useState('');
  const [simFrom, setSimFrom] = useState<Square>('e2');
  const [simTo, setSimTo] = useState<Square>('e4');
  const [packets, setPackets] = useState<SerialPacket[]>(esp32.packets);
  const [isBleConnecting, setIsBleConnecting] = useState(false);
  const [bleStatusMsg, setBleStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = esp32.subscribePackets(() => {
      setPackets([...esp32.packets]);
    });
    return () => {
      unsub();
    };
  }, []);

  if (!isOpen) return null;

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const handleBleConnect = async () => {
    setIsBleConnecting(true);
    setBleStatusMsg('Opening Bluetooth scan for GRANDMASTER OS...');
    const res = await esp32.connectBle();
    setIsBleConnecting(false);
    if (!res.success) {
      setBleStatusMsg(res.error || 'Failed to connect. Using Hardware Simulator.');
    } else {
      setBleStatusMsg('Connected successfully to ESP32!');
    }
  };

  const handleWifiConnect = async () => {
    const ok = await esp32.connectWifi(ipInput);
    if (ok) {
      setBleStatusMsg(`Connected to ESP32 at ${ipInput}`);
    } else {
      setBleStatusMsg(`Wi-Fi bridge to ${ipInput} timed out. Active on Simulator.`);
    }
  };

  const handleSendManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCmd.trim()) return;
    esp32.handleIncomingString(manualCmd.trim());
    setManualCmd('');
  };

  const handleLedTestPattern = () => {
    const testLeds: BoardLeds = {};
    const testSquares: Square[] = ['e4', 'd4', 'e5', 'd5', 'c3', 'f3', 'c6', 'f6'];
    testSquares.forEach(sq => {
      testLeds[sq] = { r: 34, g: 197, b: 94, mode: 'pulse' };
    });
    esp32.leds = testLeds;
    esp32.writeUart('LEDS_TEST_CENTER', 'LED', 'Testing center square WS2812B LEDs');
    sound.playEsp32Beep();
  };

  const handleClearAllLeds = () => {
    esp32.clearLeds();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-[#0b111e] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#080d1a] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-tech text-base sm:text-lg font-bold text-white flex items-center gap-2">
                ESP32 HARDWARE LAB &bull; DIAGNOSTICS
                <span className="text-xs px-2 py-0.5 rounded font-mono-code bg-blue-950 text-blue-300 border border-blue-500/30">
                  {esp32.firmwareVersion}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live 64 Hall-effect sensors, 64 WS2812B LEDs, SSD1306 OLED display &amp; TTP224 touch bar
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

        {/* Tab Navigation */}
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('oled-led')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'oled-led' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>OLED &amp; 64-LED Array</span>
          </button>
          <button
            onClick={() => setActiveTab('hall')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'hall' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>64 Hall Sensors &amp; Touch</span>
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'terminal' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live UART Packet Sniffer</span>
          </button>
          <button
            onClick={() => setActiveTab('connection')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'connection' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>BLE &amp; Wi-Fi Sync</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-[#0b111e]">
          {/* TAB 1: OLED & 64-LED ARRAY */}
          {activeTab === 'oled-led' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SSD1306 0.96" OLED SCREEN EMULATOR */}
              <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-tech text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      SSD1306 0.96" OLED DISPLAY (128x64)
                    </span>
                    <span className="text-[10px] font-mono-code text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                      I2C 0x3C
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Mirrors real-time display rendered on the physical chessboard's monochrome OLED screen.
                  </p>

                  {/* Physical Screen Visualizer */}
                  <div className="oled-screen rounded-lg p-4 font-mono-code border-2 border-slate-700 aspect-[2/1] flex flex-col justify-between select-none">
                    <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 text-xs">
                      <span className="font-bold tracking-wider">{oledState.line1}</span>
                      <span className="text-[10px] px-1 bg-cyan-900/50 rounded">{oledState.connectionIcon}</span>
                    </div>

                    <div className="my-auto py-1">
                      <div className="text-sm font-bold text-cyan-300 tracking-wide">{oledState.line2}</div>
                      <div className="text-xs text-cyan-400">{oledState.line3}</div>
                      <div className="text-[10px] text-cyan-500 tracking-tighter">{oledState.line4}</div>
                    </div>

                    <div className="flex items-center justify-between border-t border-cyan-500/30 pt-1 text-[11px]">
                      <span>W: {oledState.clockWhite}</span>
                      <span className="text-amber-300 font-bold">{oledState.turn}</span>
                      <span>B: {oledState.clockBlack}</span>
                    </div>
                  </div>
                </div>

                {/* TTP224 Capacitive Touch Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>TTP224 4-KEY TOUCH BUTTONS:</span>
                    <span className="text-[10px] font-mono-code text-slate-500">GPIO 13, 12, 14, 27</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => onTouchBtn(1)}
                      className="p-2 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-mono-code text-xs text-slate-200 border border-slate-700 transition-all text-center flex flex-col items-center"
                    >
                      <span className="font-bold text-amber-400">BTN 1</span>
                      <span className="text-[9px]">New Game</span>
                    </button>
                    <button
                      onClick={() => onTouchBtn(2)}
                      className="p-2 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-mono-code text-xs text-slate-200 border border-slate-700 transition-all text-center flex flex-col items-center"
                    >
                      <span className="font-bold text-amber-400">BTN 2</span>
                      <span className="text-[9px]">Undo</span>
                    </button>
                    <button
                      onClick={() => onTouchBtn(3)}
                      className="p-2 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-mono-code text-xs text-slate-200 border border-slate-700 transition-all text-center flex flex-col items-center"
                    >
                      <span className="font-bold text-amber-400">BTN 3</span>
                      <span className="text-[9px]">Hint LED</span>
                    </button>
                    <button
                      onClick={() => onTouchBtn(4)}
                      className="p-2 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-mono-code text-xs text-slate-200 border border-slate-700 transition-all text-center flex flex-col items-center"
                    >
                      <span className="font-bold text-amber-400">BTN 4</span>
                      <span className="text-[9px]">Confirm</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 64 WS2812B RGB LED MATRIX MONITOR */}
              <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-tech text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-emerald-400" />
                      64 WS2812B RGB ADDRESSABLE LEDS
                    </span>
                    <span className="text-[10px] font-mono-code text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      DIN: GPIO 4
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    One high-brightness RGB LED per square underneath the acrylic surface.
                  </p>

                  {/* 8x8 LED Grid View */}
                  <div className="aspect-square w-full max-w-[280px] mx-auto bg-slate-950 p-2 rounded-xl border border-slate-800 grid grid-cols-8 grid-rows-8 gap-1.5">
                    {ranks.map(r =>
                      files.map(f => {
                        const sq = `${f}${r}` as Square;
                        const led = boardLeds[sq];
                        return (
                          <div
                            key={sq}
                            title={`LED ${sq}: ${led ? `RGB(${led.r}, ${led.g}, ${led.b})` : 'OFF'}`}
                            className={`rounded flex items-center justify-center text-[8px] font-mono-code transition-all ${
                              led
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/50 scale-105'
                                : 'bg-slate-900 text-slate-600 border border-slate-800'
                            }`}
                          >
                            {f}{r}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* LED Diagnostics Controls */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={handleLedTestPattern}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-xs font-mono-code transition-colors flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Test Pattern</span>
                  </button>
                  <button
                    onClick={handleClearAllLeds}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono-code transition-colors flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All LEDs</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 64 HALL SENSORS & TOUCH */}
          {activeTab === 'hall' && (
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-tech text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    64 HALL-EFFECT MAGNETIC SENSOR MATRIX
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click any square to simulate lifting a piece (LIFT) or placing a piece (PLACE).
                  </p>
                </div>
                <span className="text-xs font-mono-code px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  74HC165 / Multiplexed Matrix
                </span>
              </div>

              {/* 8x8 Hall Sensor Grid */}
              <div className="w-full max-w-[360px] mx-auto aspect-square bg-slate-950 p-2 rounded-xl border border-slate-800 grid grid-cols-8 grid-rows-8 gap-1.5 my-3">
                {ranks.map(r =>
                  files.map(f => {
                    const sq = `${f}${r}` as Square;
                    const isOccupied = hallSensors[sq];
                    return (
                      <button
                        key={sq}
                        onClick={() => onToggleHall(sq)}
                        className={`rounded flex flex-col items-center justify-center transition-all ${
                          isOccupied
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/40 font-bold'
                            : 'bg-slate-900 text-slate-600 hover:bg-slate-800'
                        }`}
                        title={`Square ${sq}: ${isOccupied ? 'Magnetic Piece Present' : 'Empty'}`}
                      >
                        <span className="text-[9px] font-mono-code">{sq}</span>
                        <span className="text-[8px] opacity-80">{isOccupied ? 'ON' : 'OFF'}</span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Quick Physical Move Simulator */}
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-code">
                <span className="text-slate-300 font-semibold">Simulate Physical Move:</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">From:</span>
                  <input
                    type="text"
                    maxLength={2}
                    value={simFrom}
                    onChange={(e) => setSimFrom(e.target.value as Square)}
                    className="w-12 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-center uppercase"
                  />
                  <span className="text-slate-400">To:</span>
                  <input
                    type="text"
                    maxLength={2}
                    value={simTo}
                    onChange={(e) => setSimTo(e.target.value as Square)}
                    className="w-12 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-center uppercase"
                  />
                  <button
                    onClick={() => onSimulateMove(simFrom, simTo)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    <span>Send Move</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE UART PACKET SNIFFER */}
          {activeTab === 'terminal' && (
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col h-[420px]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span className="font-tech text-xs font-bold text-white">
                    UART / BLE PACKET TELEMETRY MONITOR (115200 BAUD)
                  </span>
                </div>
                <button
                  onClick={() => {
                    esp32.packets = [];
                    setPackets([]);
                  }}
                  className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 bg-slate-800 rounded transition-colors"
                >
                  Clear Console
                </button>
              </div>

              {/* Packet Stream */}
              <div className="flex-1 bg-slate-950 rounded-lg p-3 overflow-y-auto font-mono-code text-[11px] border border-slate-800 space-y-1">
                {packets.length === 0 ? (
                  <div className="text-slate-600 italic">Awaiting ESP32 UART packet stream...</div>
                ) : (
                  packets.map((p) => (
                    <div key={p.id} className="flex items-start gap-2 hover:bg-slate-900/50 py-0.5 px-1 rounded">
                      <span className="text-slate-500 text-[10px] shrink-0">{p.timestamp}</span>
                      <span
                        className={`font-bold px-1 rounded text-[9px] shrink-0 ${
                          p.direction === 'RX' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}
                      >
                        {p.direction}
                      </span>
                      <span className="text-amber-400 font-semibold shrink-0">{p.raw}</span>
                      <span className="text-slate-400 text-[10px] truncate">&bull; {p.description}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Manual UART Injector */}
              <form onSubmit={handleSendManual} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Inject raw command (e.g. MOVE:e2e4, TOUCH:BTN1, BATTERY:98)..."
                  value={manualCmd}
                  onChange={(e) => setManualCmd(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono-code text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-mono-code flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: BLE & WI-FI CONNECTION */}
          {activeTab === 'connection' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bluetooth Low Energy (BLE) */}
              <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center gap-2 mb-2 text-blue-400 font-tech font-bold text-sm">
                  <Bluetooth className="w-5 h-5" />
                  <span>BLUETOOTH LOW ENERGY (BLE)</span>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Direct pairing with ESP32 GATT Nordic UART Service. Works natively on Chrome Android and Desktop.
                </p>

                <div className="space-y-2 mb-4 text-xs font-mono-code">
                  <div className="flex justify-between text-slate-400">
                    <span>Service UUID:</span>
                    <span className="text-slate-300">6E400001-...</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Status:</span>
                    <span className={connectionMode === 'ble' ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                      {connectionMode === 'ble' ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleBleConnect}
                  disabled={isBleConnecting}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs font-mono-code flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                >
                  <Bluetooth className="w-4 h-4" />
                  <span>{isBleConnecting ? 'Scanning...' : 'Scan for ESP32 BLE'}</span>
                </button>
              </div>

              {/* Wi-Fi & Internet Bridge */}
              <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-tech font-bold text-sm">
                  <Wifi className="w-5 h-5" />
                  <span>WI-FI / WEBSOCKET BRIDGE</span>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Connect over local Wi-Fi or ESP32 SoftAP hotspot (Default: 192.168.4.1:81).
                </p>

                <div className="space-y-2 mb-4">
                  <label className="text-xs text-slate-400 font-mono-code block">ESP32 Board IP Address:</label>
                  <input
                    type="text"
                    value={ipInput}
                    onChange={(e) => setIpInput(e.target.value)}
                    placeholder="192.168.4.1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono-code text-white"
                  />
                </div>

                <button
                  onClick={handleWifiConnect}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs font-mono-code flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  <Wifi className="w-4 h-4" />
                  <span>Connect Wi-Fi Bridge</span>
                </button>
              </div>

              {bleStatusMsg && (
                <div className="md:col-span-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono-code text-slate-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{bleStatusMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[#080d1a] border-t border-slate-800 flex items-center justify-between text-xs font-mono-code text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>PAM8403 Speaker: Active &bull; SD Card: Mounted &bull; 64 Hall: OK</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-colors"
          >
            Close Lab
          </button>
        </div>
      </div>
    </div>
  );
};
