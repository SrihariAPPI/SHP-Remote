import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Laptop,
  Terminal,
  ShieldAlert,
  CheckCircle2,
  Monitor,
} from 'lucide-react';
import { RemoteConfig } from '../types/remote';

interface SetupGuidesViewProps {
  config: RemoteConfig;
}

export const SetupGuidesView: React.FC<SetupGuidesViewProps> = ({ config }) => {
  const [activeSection, setActiveSection] = useState<'architecture' | 'streaming' | 'wiring' | 'arduino' | 'python'>('architecture');

  return (
    <div className="flex flex-col lg:flex-row h-full gap-3">
      {/* Sidebar navigation */}
      <div className="w-full lg:w-60 rounded-lg bg-[#121215] border border-white/8 p-2.5 flex flex-col gap-1 shrink-0 font-mono text-xs">
        <div className="px-2 py-1 text-[10px] text-zinc-500 uppercase tracking-wider">
          Documentation
        </div>

        <button
          onClick={() => setActiveSection('architecture')}
          className={`px-2.5 py-2 rounded text-left transition-colors flex items-center gap-2 ${
            activeSection === 'architecture'
              ? 'bg-[#18181c] text-sky-400 font-semibold border border-sky-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Architecture</span>
        </button>

        <button
          onClick={() => setActiveSection('streaming')}
          className={`px-2.5 py-2 rounded text-left transition-colors flex items-center gap-2 ${
            activeSection === 'streaming'
              ? 'bg-[#18181c] text-sky-400 font-semibold border border-sky-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Remote Desktop</span>
        </button>

        <button
          onClick={() => setActiveSection('wiring')}
          className={`px-2.5 py-2 rounded text-left transition-colors flex items-center gap-2 ${
            activeSection === 'wiring'
              ? 'bg-[#18181c] text-sky-400 font-semibold border border-sky-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>ESP32 Hardware</span>
        </button>

        <button
          onClick={() => setActiveSection('arduino')}
          className={`px-2.5 py-2 rounded text-left transition-colors flex items-center gap-2 ${
            activeSection === 'arduino'
              ? 'bg-[#18181c] text-sky-400 font-semibold border border-sky-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Arduino IDE</span>
        </button>

        <button
          onClick={() => setActiveSection('python')}
          className={`px-2.5 py-2 rounded text-left transition-colors flex items-center gap-2 ${
            activeSection === 'python'
              ? 'bg-[#18181c] text-sky-400 font-semibold border border-sky-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Windows Companion</span>
        </button>
      </div>

      {/* Main documentation content */}
      <div className="flex-1 rounded-lg bg-[#121215] border border-white/8 p-5 overflow-y-auto text-zinc-300 text-xs sm:text-sm leading-relaxed space-y-5">
        {activeSection === 'architecture' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">System Architecture & Protocol</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Low-latency input control through ESP32 with direct peer-to-peer screen streaming.
              </p>
            </div>

            <div className="p-3.5 rounded bg-[#09090b] border border-white/8 font-mono text-xs overflow-x-auto text-zinc-300">
              <pre>{`
  [ ANDROID PHONE (BROWSER) ]
         │                        │
         │ Wi-Fi Control          │ Wi-Fi Direct Stream
         │ (HTTP:80, WS:81)       │ (HTTP MJPEG: ${config.streamPort})
         ▼                        ▼
  [ ESP32 DEVKIT V1 ]      [ WINDOWS 11 LAPTOP ]
  (Relay & SoftAP)         (Screen Capture & Win32 APIs)
         │                        ▲
         └────── WebSocket Relay ─┘
              `}</pre>
            </div>

            <div className="space-y-2 text-xs text-zinc-400">
              <p>• <strong>Control Channel:</strong> Routed via the ESP32 Wi-Fi SoftAP on port 81 with token verification.</p>
              <p>• <strong>Desktop Stream Channel:</strong> Streamed directly from the Windows Python companion on port {config.streamPort} to eliminate microcontroller throughput bottlenecks.</p>
            </div>
          </div>
        )}

        {activeSection === 'streaming' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Remote Desktop Streaming Setup</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time screen capture using Python <code className="text-sky-300">mss</code> and direct browser streaming.
              </p>
            </div>

            <div className="p-3.5 bg-[#09090b] rounded border border-white/8 font-mono text-xs space-y-1.5">
              <div className="text-zinc-400">Stream Endpoint:</div>
              <div className="text-sky-400">
                http://{config.streamHost}:{config.streamPort}/stream?token=
                <span className="text-zinc-400">
                  {(config.streamToken || config.authToken).length > 8
                    ? `${(config.streamToken || config.authToken).slice(0, 4)}••••${(config.streamToken || config.authToken).slice(-4)}`
                    : '••••••••'}
                </span>
              </div>
              <div className="text-zinc-500 text-[11px] pt-1">
                Resolution: 1920×1080 (downscaled dynamically based on quality preset).
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-400">
              <p>• <strong>Low Latency:</strong> Frame grab takes ~8ms with hardware-accelerated memory copy.</p>
              <p>• <strong>Coordinate Mapping:</strong> Touch positions map to absolute Windows display coordinates for exact icon clicks and window dragging.</p>
            </div>
          </div>
        )}

        {activeSection === 'wiring' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">ESP32 DevKit V1 Hardware</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Powered directly from the laptop USB port. No external breadboard circuits required.
              </p>
            </div>

            <div className="p-3.5 bg-[#09090b] rounded border border-white/8 font-mono text-xs space-y-2">
              <div className="text-zinc-200 font-semibold">• Power Requirements:</div>
              <div className="text-zinc-400">5V DC via Micro-USB / USB-C port (~160mA average, 240mA burst).</div>
              <div className="text-zinc-200 font-semibold pt-1">• Optional Status LEDs:</div>
              <div className="text-zinc-400">GPIO 2: Built-in SoftAP active LED</div>
              <div className="text-zinc-400">GPIO 4: Companion link established LED (220Ω resistor)</div>
            </div>
          </div>
        )}

        {activeSection === 'arduino' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Arduino IDE Compilation</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Flash <code className="text-sky-300 font-mono">SHP_REMOTE.ino</code> to ESP32 DevKit V1.
              </p>
            </div>

            <div className="space-y-2 text-xs text-zinc-400">
              <p>1. Open Arduino IDE 2.3+.</p>
              <p>2. Install libraries: <strong>WebSockets</strong> by Markus Sattler & <strong>ArduinoJson</strong> by Benoit Blanchon.</p>
              <p>3. Select board <strong>DOIT ESP32 DEVKIT V1</strong> and click <strong>Upload</strong>.</p>
            </div>
          </div>
        )}

        {activeSection === 'python' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Windows 11 Companion Setup</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Run the Python service to handle mouse, keyboard, media, and screen streaming.
              </p>
            </div>

            <div className="p-3 bg-[#09090b] rounded border border-white/8 font-mono text-xs space-y-2">
              <div className="text-zinc-400">pip install -r requirements.txt</div>
              <div className="text-sky-300">python remote_companion.py</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
