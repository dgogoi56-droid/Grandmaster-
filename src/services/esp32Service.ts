import { Square, ConnectionMode, BoardLeds, HallSensors, OledScreenState, SerialPacket, LedColor } from '../types';
import { sound } from './soundService';

// Standard Nordic UART Service UUIDs for ESP32 BLE
export const NORDIC_UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const NORDIC_UART_RX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Phone writes to ESP32
export const NORDIC_UART_TX_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // ESP32 notifies Phone

interface BleDevice {
  name?: string;
  gatt?: {
    connected?: boolean;
    connect: () => Promise<BleGattServer>;
    disconnect: () => void;
  };
}

interface BleGattServer {
  getPrimaryService: (service: string) => Promise<BleGattService>;
}

interface BleGattService {
  getCharacteristic: (characteristic: string) => Promise<BleGattChar>;
}

interface BleGattChar {
  value?: DataView;
  writeValue: (data: BufferSource) => Promise<void>;
  startNotifications: () => Promise<BleGattChar>;
  addEventListener: (type: string, listener: (event: Event) => void) => void;
}

export type PacketCallback = (packet: SerialPacket) => void;
export type MoveCallback = (moveUci: string) => void;
export type TouchButtonCallback = (btn: 1 | 2 | 3 | 4) => void;
export type HallSensorCallback = (sensors: HallSensors) => void;

class Esp32Service {
  public connectionMode: ConnectionMode = 'simulated';
  public isConnected: boolean = true;
  public deviceName: string = 'ESP32 GRANDMASTER OS (Simulated)';
  public ipAddress: string = '192.168.4.1';
  public bleRssi: number = -62;
  public batteryLevel: number = 96;
  public firmwareVersion: string = 'GRANDMASTER OS v2.4-ESP32';

  // State caches
  public hallSensors: HallSensors = {} as HallSensors;
  public leds: BoardLeds = {};
  public oled: OledScreenState = {
    line1: 'GRANDMASTER OS',
    line2: 'READY TO PLAY',
    line3: 'WHITE TO MOVE',
    line4: 'BLE CONNECTED',
    clockWhite: '10:00',
    clockBlack: '10:00',
    turn: 'WHITE',
    mode: 'STANDBY',
    connectionIcon: 'BLE',
  };

  private bleDevice: BleDevice | null = null;
  private bleRxChar: BleGattChar | null = null;
  private bleTxChar: BleGattChar | null = null;
  private webSocket: WebSocket | null = null;

  // Listeners
  private packetListeners: Set<PacketCallback> = new Set();
  private moveListeners: Set<MoveCallback> = new Set();
  private touchListeners: Set<TouchButtonCallback> = new Set();
  private hallListeners: Set<HallSensorCallback> = new Set();
  private stateChangeListeners: Set<() => void> = new Set();

  public packets: SerialPacket[] = [];

  constructor() {
    this.initDefaultHallSensors();
  }

  private initDefaultHallSensors() {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const sensors: Partial<HallSensors> = {};
    for (const r of ranks) {
      for (const f of files) {
        const sq = `${f}${r}` as Square;
        // initial standard setup has pieces on ranks 1, 2, 7, 8
        sensors[sq] = r === '1' || r === '2' || r === '7' || r === '8';
      }
    }
    this.hallSensors = sensors as HallSensors;
  }

  public subscribePackets(cb: PacketCallback): () => void {
    this.packetListeners.add(cb);
    return () => {
      this.packetListeners.delete(cb);
    };
  }

  public subscribeMoves(cb: MoveCallback): () => void {
    this.moveListeners.add(cb);
    return () => {
      this.moveListeners.delete(cb);
    };
  }

  public subscribeTouch(cb: TouchButtonCallback): () => void {
    this.touchListeners.add(cb);
    return () => {
      this.touchListeners.delete(cb);
    };
  }

  public subscribeHall(cb: HallSensorCallback): () => void {
    this.hallListeners.add(cb);
    return () => {
      this.hallListeners.delete(cb);
    };
  }

  public subscribeStateChange(cb: () => void): () => void {
    this.stateChangeListeners.add(cb);
    return () => {
      this.stateChangeListeners.delete(cb);
    };
  }

  private notifyState() {
    this.stateChangeListeners.forEach(cb => cb());
  }

  private logPacket(direction: 'RX' | 'TX', raw: string, type: SerialPacket['type'], description: string) {
    const packet: SerialPacket = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
      direction,
      raw,
      type,
      description,
    };
    this.packets.unshift(packet);
    if (this.packets.length > 80) this.packets.pop();
    this.packetListeners.forEach(cb => cb(packet));
    this.notifyState();
  }

  // Connect via Web Bluetooth API (Chrome / Android)
  public async connectBle(): Promise<{ success: boolean; error?: string }> {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as { bluetooth?: { requestDevice: (options: unknown) => Promise<BleDevice> } }) : null;
    if (!nav || !nav.bluetooth) {
      this.connectionMode = 'simulated';
      this.deviceName = 'ESP32 GRANDMASTER (Simulated)';
      this.isConnected = true;
      this.logPacket('RX', 'INFO:WEB_BLE_UNAVAILABLE_FALLBACK_SIMULATOR', 'INFO', 'Web Bluetooth unavailable in iframe - Using integrated hardware simulator');
      this.notifyState();
      return { success: false, error: 'Web Bluetooth API is not supported in this browser or iframe context. Using Hardware Simulator.' };
    }

    try {
      this.logPacket('TX', 'SCAN:BLE_REQUEST_DEVICE', 'INFO', 'Opening Android BLE device picker for ESP32...');
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'GRANDMASTER' },
          { namePrefix: 'ESP32' },
          { services: [NORDIC_UART_SERVICE_UUID] },
        ],
        optionalServices: [NORDIC_UART_SERVICE_UUID, 'battery_service'],
      });

      this.bleDevice = device;
      this.deviceName = device.name || 'ESP32 GRANDMASTER OS';

      const server = await device.gatt?.connect();
      if (!server) throw new Error('GATT server connection failed');

      const service = await server.getPrimaryService(NORDIC_UART_SERVICE_UUID);
      this.bleRxChar = await service.getCharacteristic(NORDIC_UART_RX_CHAR_UUID);
      this.bleTxChar = await service.getCharacteristic(NORDIC_UART_TX_CHAR_UUID);

      await this.bleTxChar.startNotifications();
      this.bleTxChar.addEventListener('characteristicvaluechanged', (e: Event) => {
        const target = e.target as unknown as BleGattChar;
        if (target && target.value) {
          const decoder = new TextDecoder('utf-8');
          const str = decoder.decode(target.value);
          this.handleIncomingString(str);
        }
      });

      this.connectionMode = 'ble';
      this.isConnected = true;
      this.oled.connectionIcon = 'BLE';
      this.logPacket('RX', 'BLE:CONNECTED_OK', 'INFO', `Connected to ${this.deviceName} via Bluetooth LE`);
      sound.playEsp32Beep();
      this.notifyState();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.connectionMode = 'simulated';
      this.isConnected = true;
      this.logPacket('RX', `BLE_ERR:${msg}`, 'INFO', `BLE pair cancelled or failed: ${msg}. Active on Hardware Simulator.`);
      this.notifyState();
      return { success: false, error: msg };
    }
  }

  // Connect via Wi-Fi WebSocket
  public connectWifi(ip: string = '192.168.4.1'): Promise<boolean> {
    return new Promise((resolve) => {
      this.ipAddress = ip;
      this.logPacket('TX', `WIFI:CONNECT_REQ:${ip}:81`, 'INFO', `Attempting Wi-Fi WebSocket bridge to ${ip}:81...`);
      try {
        if (this.webSocket) {
          this.webSocket.close();
        }
        const ws = new WebSocket(`ws://${ip}:81`);
        this.webSocket = ws;

        ws.onopen = () => {
          this.connectionMode = 'wifi';
          this.isConnected = true;
          this.oled.connectionIcon = 'WIFI';
          this.logPacket('RX', 'WIFI:CONNECTED_OK', 'INFO', `Connected to ESP32 at ${ip} via Wi-Fi`);
          sound.playEsp32Beep();
          this.notifyState();
          resolve(true);
        };

        ws.onmessage = (event) => {
          this.handleIncomingString(event.data);
        };

        ws.onerror = () => {
          this.logPacket('RX', 'WIFI:ERR_OFFLINE_FALLBACK', 'INFO', `Wi-Fi connection to ${ip} failed. Using Hardware Simulator.`);
          this.connectionMode = 'simulated';
          this.isConnected = true;
          this.notifyState();
          resolve(false);
        };

        ws.onclose = () => {
          if (this.connectionMode === 'wifi') {
            this.connectionMode = 'simulated';
            this.notifyState();
          }
        };
      } catch {
        this.connectionMode = 'simulated';
        this.isConnected = true;
        this.notifyState();
        resolve(false);
      }
    });
  }

  public disconnect() {
    if (this.bleDevice && this.bleDevice.gatt?.connected) {
      this.bleDevice.gatt.disconnect();
    }
    if (this.webSocket) {
      this.webSocket.close();
    }
    this.connectionMode = 'disconnected';
    this.isConnected = false;
    this.oled.connectionIcon = 'NONE';
    this.logPacket('TX', 'DISCONNECT', 'INFO', 'Disconnected from physical ESP32 board');
    this.notifyState();
  }

  // Incoming UART string from physical ESP32
  public handleIncomingString(raw: string) {
    const lines = raw.trim().split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('MOVE:')) {
        const moveUci = trimmed.replace('MOVE:', '').trim();
        this.logPacket('RX', trimmed, 'MOVE', `Physical move detected: ${moveUci}`);
        sound.playMove();
        this.moveListeners.forEach(cb => cb(moveUci));
      } else if (trimmed.startsWith('LIFT:')) {
        const sq = trimmed.replace('LIFT:', '').trim() as Square;
        this.hallSensors[sq] = false;
        this.logPacket('RX', trimmed, 'LIFT', `Piece lifted from square ${sq}`);
        this.hallListeners.forEach(cb => cb(this.hallSensors));
      } else if (trimmed.startsWith('PLACE:')) {
        const sq = trimmed.replace('PLACE:', '').trim() as Square;
        this.hallSensors[sq] = true;
        this.logPacket('RX', trimmed, 'PLACE', `Piece placed on square ${sq}`);
        this.hallListeners.forEach(cb => cb(this.hallSensors));
      } else if (trimmed.startsWith('TOUCH:')) {
        const btnNum = parseInt(trimmed.replace('TOUCH:BTN', '').trim(), 10) as 1 | 2 | 3 | 4;
        this.logPacket('RX', trimmed, 'TOUCH', `TTP224 touch button BTN${btnNum} tapped`);
        sound.playEsp32Beep();
        this.touchListeners.forEach(cb => cb(btnNum));
      } else if (trimmed.startsWith('BATTERY:')) {
        this.batteryLevel = parseInt(trimmed.replace('BATTERY:', '').trim(), 10) || 90;
        this.logPacket('RX', trimmed, 'INFO', `Battery telemetry: ${this.batteryLevel}%`);
      } else {
        this.logPacket('RX', trimmed, 'INFO', `Received: ${trimmed}`);
      }
    }
    this.notifyState();
  }

  // Send move to ESP32 physical board (illuminates LEDs on board)
  public sendMoveToBoard(from: Square, to: Square, color: 'GREEN' | 'CYAN' | 'RED' | 'AMBER' = 'GREEN') {
    const cmd = `MOVE:${from}${to}`;
    const ledCmd = `LED_PATH:${from}:${to}:${color}`;
    this.writeUart(cmd, 'MOVE', `Transmitted move to physical board: ${from} -> ${to}`);
    this.writeUart(ledCmd, 'LED', `Illuminating WS2812B LEDs on ${from} and ${to}`);
    
    // Update local simulated LEDs
    const rgb = color === 'GREEN' ? { r: 34, g: 197, b: 94 }
              : color === 'CYAN' ? { r: 6, g: 182, b: 212 }
              : color === 'AMBER' ? { r: 245, g: 158, b: 11 }
              : { r: 239, g: 68, b: 68 };
              
    this.leds = {
      ...this.leds,
      [from]: { ...rgb, mode: 'pulse' },
      [to]: { ...rgb, mode: 'solid' },
    };
    this.notifyState();
  }

  // Illuminate legal move hints on physical board
  public sendHintsToBoard(squares: Square[]) {
    this.clearLeds();
    const cmd = `LEDS_HINT:${squares.join(',')}`;
    this.writeUart(cmd, 'LED', `Illuminating hint squares on physical board`);
    const newLeds: BoardLeds = {};
    squares.forEach(sq => {
      newLeds[sq] = { r: 6, g: 182, b: 212, mode: 'pulse' }; // Cyan hint dots
    });
    this.leds = newLeds;
    this.notifyState();
  }

  // Clear all 64 WS2812B LEDs
  public clearLeds() {
    this.leds = {};
    this.writeUart('LED_CLEAR', 'LED', 'Cleared all 64 WS2812B LEDs');
    this.notifyState();
  }

  // Set single square LED
  public setSquareLed(sq: Square, color: LedColor) {
    this.leds = {
      ...this.leds,
      [sq]: color,
    };
    this.writeUart(`LED:${sq}:${color.r},${color.g},${color.b}`, 'LED', `Setting LED on ${sq}`);
    this.notifyState();
  }

  // Send check warning LED to King square
  public sendCheckAlert(kingSquare: Square) {
    this.leds = {
      ...this.leds,
      [kingSquare]: { r: 239, g: 68, b: 68, mode: 'blink' },
    };
    this.writeUart(`LED_CHECK:${kingSquare}`, 'LED', `Check warning! Red LED flashing on ${kingSquare}`);
    this.writeUart('SOUND:CHECK', 'SOUND', 'Playing check chime on PAM8403');
    sound.playCheck();
    this.notifyState();
  }

  // Update physical 0.96" SSD1306 OLED screen
  public updateOled(state: Partial<OledScreenState>) {
    this.oled = { ...this.oled, ...state };
    const cmd = `OLED:${this.oled.line1}|${this.oled.line2}|${this.oled.line3}|${this.oled.line4}`;
    this.writeUart(cmd, 'OLED', `Updated 0.96" SSD1306 OLED display`);
    this.notifyState();
  }

  // Write UART data to BLE or Wi-Fi or Simulator
  public writeUart(text: string, type: SerialPacket['type'], description: string) {
    this.logPacket('TX', text, type, description);

    // If BLE connected
    if (this.connectionMode === 'ble' && this.bleRxChar) {
      try {
        const encoder = new TextEncoder();
        this.bleRxChar.writeValue(encoder.encode(text + '\n')).catch(() => {});
      } catch (err) {
        console.warn('BLE write failed', err);
      }
    }

    // If Wi-Fi connected
    if (this.connectionMode === 'wifi' && this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      try {
        this.webSocket.send(text + '\n');
      } catch (err) {
        console.warn('WebSocket send failed', err);
      }
    }
  }

  // Hardware Simulator interactions (allows testing the app without needing physical hardware attached right now)
  public simulatePhysicalMove(from: Square, to: Square) {
    this.hallSensors[from] = false;
    this.hallSensors[to] = true;
    this.handleIncomingString(`MOVE:${from}${to}`);
  }

  public simulateTouchButton(btn: 1 | 2 | 3 | 4) {
    this.handleIncomingString(`TOUCH:BTN${btn}`);
  }

  public toggleHallSensor(sq: Square) {
    const nextVal = !this.hallSensors[sq];
    this.hallSensors[sq] = nextVal;
    if (nextVal) {
      this.handleIncomingString(`PLACE:${sq}`);
    } else {
      this.handleIncomingString(`LIFT:${sq}`);
    }
    this.notifyState();
  }
}

export const esp32 = new Esp32Service();
