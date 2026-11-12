import { RemoteConfig } from '../types/remote';

export function getSystemArchitectureDoc(config: RemoteConfig): string {
  const targetIp = config.esp32Ip || config.apIp || '172.16.27.92';

  return `# SHP REMOTE — SYSTEM ARCHITECTURE & WEBRTC SPECIFICATION

\`\`\`
                     +----------------------------------+
                     |       HOME WI-FI ROUTER          |
                     |  (SSID: ${config.ssid})  |
                     |    DHCP Server Subnet 192.168.x  |
                     +----------------------------------+
                       /              |               \\
       Home Wi-Fi LAN /               | Home Wi-Fi LAN \\ Home Wi-Fi LAN
                     v                v                 v
          +------------------+  +-------------+  +----------------------+
          | ANDROID PHONE    |  | ESP32 DEVKIT|  | WINDOWS 11 LAPTOP    |
          | Web Dashboard    |  | Station Mode|  | Python Companion     |
          | WebRTC Client    |  | IP: ${targetIp} |  | IP: ${config.streamHost}     |
          +------------------+  +-------------+  +----------------------+
                   |                  ^                   ^
                   | Control & Signal | WS Relay Port 81  |
                   +=================>+==================>+
                   |
                   | P2P WebRTC Video Stream (Port ${config.streamPort})
                   +======================================+
\`\`\`

---

## 1. Network Topology (Home Wi-Fi Station Mode)

All three components join your existing home Wi-Fi network:
1. **ESP32 DevKit V1**: Operates in **Station Mode (WIFI_STA)**. Requests an IP via DHCP from your router. Hosts a WebSocket server on port ${config.wsPort}.
2. **Android Phone**: Connects to the web dashboard and communicates with the ESP32 WebSocket for control commands and WebRTC signaling.
3. **Windows 11 Laptop**: Runs the Python Companion which connects to the ESP32 WebSocket and hosts the WebRTC desktop video stream on port ${config.streamPort}.

---

## 2. WebRTC Video Mirroring Architecture

- **Capture Engine:** Screen frames are captured using high-performance \`mss\` directly from Windows display output.
- **Video Track:** Converted to an \`aiortc.VideoStreamTrack\` and encoded to H.264/VP8.
- **Signaling:** SDP Offer/Answer and ICE candidates are exchanged either:
  1. Via the ESP32 WebSocket relay broker (\`{"type":"webrtc_offer"}\` -> \`{"type":"webrtc_answer"}\`).
  2. Directly via HTTP POST to \`http://${config.streamHost}:${config.streamPort}/offer\`.
- **Peer-to-Peer:** Once signaling completes, video flows directly between the laptop and Android smartphone over your local Wi-Fi with ~12ms latency.
- **Fallback:** If WebRTC is blocked or \`aiortc\` is unavailable, the companion serves a high-speed HTTP MJPEG stream at \`http://${config.streamHost}:${config.streamPort}/stream\`.

---

## 3. Router DHCP Reservation (Static Lease)

To prevent your router from reassigning a different IP to the ESP32:
1. Open your router's admin panel (typically \`http://192.168.1.1\` or \`http://192.168.0.1\`).
2. Navigate to **DHCP Server** $\\rightarrow$ **Address Reservation** / **Static Leases**.
3. Locate the ESP32 MAC address (printed on Serial Monitor at boot).
4. Assign a fixed IP address (e.g. \`${targetIp}\`) to this MAC address.
`;
}

export function getWiringGuideDoc(): string {
  return `# SHP REMOTE — ESP32 DEVKIT V1 HARDWARE GUIDE

## 1. Hardware Requirements

- **ESP32 DevKit V1 (ESP-WROOM-32)**
- **USB Cable:** Standard Micro-USB or USB-C cable connected to your laptop or a 5V USB wall charger.
- **Power:** 5V DC via USB (draws ~160mA average, 240mA peak).
- **Status LEDs:**
  - GPIO 2: Built-in Blue LED (indicates Wi-Fi connection).
  - GPIO 4: Optional Green LED with 220Ω resistor (indicates companion connected).

---

## 2. Hardware Tips

- In Wi-Fi Station Mode, the ESP32 connects directly to your router, meaning power consumption and heat are minimal.
- You can power the ESP32 directly from a spare laptop USB port or any 5V phone charger in your room.
`;
}

export function getInstallationGuideDoc(config: RemoteConfig): string {
  const targetIp = config.esp32Ip || config.apIp || '172.16.27.92';

  return `# SHP REMOTE — COMPLETE INSTALLATION & SETUP GUIDE

## Step 1: ESP32 Firmware Upload

1. Open **Arduino IDE 2.3+**.
2. Install **WebSockets** by Markus Sattler and **ArduinoJson** by Benoit Blanchon in the Library Manager.
3. In \`SHP_REMOTE.ino\`, update:
   \`\`\`cpp
   const char* WIFI_SSID     = "${config.ssid}";
   const char* WIFI_PASSWORD = "${config.wifiPassword}";
   \`\`\`
4. Select board **DOIT ESP32 DEVKIT V1**, select your COM Port, and click **Upload**.
5. Open Serial Monitor at **115200 baud** to see the assigned DHCP IP:
   \`\`\`
   [WiFi] CONNECTED TO HOME ROUTER SUCCESSFULLY!
   [WiFi] Assigned IP address: ${targetIp}
   \`\`\`

---

## Step 2: Windows 11 Companion Setup

1. Install Python 3.10+ (check "Add python.exe to PATH").
2. Open terminal in \`windows-companion/\`:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`
3. In \`config.json\`, confirm \`esp32_ip\` matches your ESP32's assigned IP (\`${targetIp}\`).
4. Run the companion:
   \`\`\`bash
   python remote_companion.py
   \`\`\`

---

## Step 3: Phone Connection & Control

1. Ensure your Android phone is connected to the same home Wi-Fi network (\`${config.ssid}\`).
2. Open Chrome on Android and browse to:
   - \`http://${targetIp}\` (Embedded dashboard served directly from ESP32).
   - Or open \`https://shpremote.vercel.app\` (Hosted on Vercel).

---

## Step 4: Secure HTTPS & LAN Network Architecture

When accessing the frontend from Vercel (\`https://shpremote.vercel.app\`), modern browsers enforce strict origin security policies against unencrypted private LAN endpoints.

### Recommended Secure Solutions:
1. **WebRTC DataChannel (Recommended):** The Remote Desktop view uses DTLS-SRTP encrypted peer connections and WebRTC DataChannels (\`shp-control\`), allowing seamless video streaming and input controls natively on HTTPS without mixed-content restrictions.
2. **Direct Local LAN Origin:** Browse directly to \`http://${targetIp}\` (ESP32 web server) or \`http://${config.streamHost}:8082\` (Python Companion web server) on your phone. Because the origin is HTTP, all local WebSocket and MJPEG streams connect without restrictions.
3. **Secure Tunnel / TLS:** Run Cloudflare Tunnel (\`cloudflared tunnel --url http://localhost:8082\`) or install a local self-signed TLS cert for HTTPS-to-HTTPS companion communication.
`;
}

export function getRootReadmeDoc(config: RemoteConfig): string {
  const targetIp = config.esp32Ip || config.apIp || '172.16.27.92';

  return `# SHP REMOTE — WIRELESS WINDOWS 11 CONTROLLER & WEBRTC DESKTOP

> Production-grade wireless laptop remote controller and WebRTC remote desktop system.

---

## Features

- **Home Wi-Fi Station Mode:** ESP32 and Windows 11 laptop both connect to your home Wi-Fi router.
- **WebRTC Desktop Mirroring:** Low-latency P2P screen streaming with touch coordinate mapping.
- **Fallback MJPEG Stream:** HTTP MJPEG video stream on port ${config.streamPort}.
- **Precision Trackpad:** Multi-touch gestures, tap-to-click, double-click, drag-and-drop, and two-finger scrolling.
- **Full QWERTY Keyboard:** Virtual keyboard with latching modifiers (Ctrl, Alt, Shift, Win), Esc, Tab, Enter.
- **Media Controller:** Volume up/down/mute and playback controls using native Win32 hardware keys.
- **Windows Hotkeys:** Instant launch for Alt+Tab, Win+D, Win+E, Win+R, Task Manager, Lock PC.
- **Safe App Launcher:** Fast launching for Chrome, VS Code, Explorer, Terminal, Notepad, Calculator.

---

## Configuration

- **Router SSID:** \`${config.ssid}\`
- **ESP32 IP:** \`${targetIp}\`
- **Control WS Port:** \`${config.wsPort}\`
- **Stream Host:** \`${config.streamHost}\`
- **Stream Port:** \`${config.streamPort}\`
- **Auth Token:** \`${config.authToken}\`
`;
}
