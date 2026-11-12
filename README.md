# 🚀 SHP REMOTE
### Turn Your Smartphone into a Wireless Windows PC Controller.

**SHP REMOTE** is an ESP32-powered IoT remote desktop and laptop control system that allows users to control their Windows 11 computer directly from an Android smartphone through a web-based dashboard.

Combining embedded systems, Python automation, WebRTC, WebSockets and modern web technologies, SHP REMOTE transforms a smartphone into a wireless touchpad, keyboard, media controller and remote desktop viewer.

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2011-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Hardware-ESP32-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Streaming-WebRTC-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Working-success?style=for-the-badge" />
</p>

<p align="center">
  <a href="https://shpremote.vercel.app/"><strong>🌐 LIVE DEMO</strong></a>
  &nbsp; • &nbsp;
  <a href="https://github.com/SrihariAPPI/SHP-Remote"><strong>💻 SOURCE CODE</strong></a>
</p>

---

## 📌 Project Overview

Imagine controlling your laptop without physically touching it.

With SHP REMOTE, you can:

- Move your Windows cursor using your smartphone.
- Type on your laptop using a mobile keyboard.
- Execute Windows keyboard shortcuts.
- Control media playback and system volume.
- View your actual Windows desktop in real time.
- Interact with your computer remotely over Wi-Fi.

The system uses an ESP32 as a communication gateway and a Python companion application running on Windows to execute commands and capture the desktop.

The mobile-friendly React dashboard provides the user interface.

---

## ✨ Key Features

### 🖱️ 1. Wireless Touchpad

Turn your smartphone into a laptop touchpad.

- Relative mouse movement.
- Left-click and right-click.
- Double-click.
- Drag and drop.
- Mouse scrolling.
- Touch-based cursor control.

### ⌨️ 2. Virtual Keyboard

Control your Windows keyboard through your smartphone.

- Text input.
- Keyboard shortcuts.
- Modifier keys.
- Ctrl, Alt, Shift and Windows keys.
- Common productivity shortcuts.

### 🖥️ 3. Remote Desktop Streaming

View your actual Windows desktop directly on your smartphone.

- Live desktop screen capture.
- WebRTC-based video streaming.
- MJPEG streaming fallback.
- Fullscreen viewing.
- Zoom controls.
- Desktop coordinate mapping.
- Mobile-friendly remote desktop interface.

### 🎵 4. Media Controls

Control your laptop's media functions.

- Volume up.
- Volume down.
- Mute and unmute.
- Play and pause.
- Next track.
- Previous track.

### ⚡ 5. Windows System Shortcuts

Execute useful Windows operations directly from your phone.

| Shortcut | Function |
|---|---|
| Win + D | Show desktop |
| Win + E | Open File Explorer |
| Win + R | Open Run |
| Alt + Tab | Switch applications |
| Ctrl + Shift + Esc | Open Task Manager |
| Win + L | Lock Windows |

### 📱 6. Mobile-First Dashboard

- Responsive React interface.
- Android smartphone support.
- Touch-friendly controls.
- Remote desktop viewer.
- Device connection status.
- Browser-based access without a separate desktop dashboard installation.

---

## 🏗️ System Architecture

SHP REMOTE consists of three primary components:

1. Android smartphone — User interface and remote control.
2. ESP32 DevKit V1 — Wireless communication gateway.
3. Windows 11 laptop — Python companion, desktop capture and input execution.

### Architecture Diagram

```text
                  ANDROID SMARTPHONE
             ┌──────────────────────────┐
             │                          │
             │      SHP REMOTE          │
             │      WEB DASHBOARD       │
             │                          │
             │  • Virtual Touchpad      │
             │  • Virtual Keyboard      │
             │  • Media Controls        │
             │  • Remote Desktop        │
             │                          │
             └────────────┬─────────────┘
                          │
                          │
                    HOME WI-FI
                          │
             ┌────────────┴─────────────┐
             │                          │
       ┌─────▼──────┐          ┌────────▼─────────┐
       │            │          │                  │
       │   ESP32    │◄────────►│  WINDOWS LAPTOP  │
       │  DEVKIT V1 │          │                  │
       │            │          │ Python Companion │
       │ WebSocket  │          │                  │
       │ Gateway    │          │ Screen Capture   │
       │            │          │ WebRTC Streaming │
       │            │          │ Mouse & Keyboard │
       └────────────┘          └──────────────────┘
```

### Communication Flow

**1. Dashboard → ESP32**

The smartphone dashboard communicates with the ESP32 through WebSocket commands.

**2. ESP32 → Windows Companion**

The ESP32 authenticates the Python companion and relays supported control and signaling messages.

**3. Windows Companion → Laptop**

The Python application executes mouse, keyboard and media operations on Windows.

**4. Windows → Smartphone**

The Python companion captures the Windows desktop and delivers the video stream through WebRTC or MJPEG.

**5. Remote Input**

The dashboard sends user interactions through the available control channel to the Windows companion.

---

## 🧰 Technology Stack

| Category | Technologies |
|---|---|
| Microcontroller | ESP32 DevKit V1 |
| Firmware | Arduino C++ |
| Frontend | React.js, TypeScript |
| Styling | CSS |
| Build Tool | Vite |
| Backend Companion | Python |
| Real-Time Communication | WebSockets |
| Video Streaming | WebRTC |
| WebRTC Engine | aiortc |
| Screen Capture | MSS |
| Desktop Automation | PyAutoGUI, Win32 API |
| Video Processing | PyAV, Pillow |
| Deployment | Vercel |
| Operating System | Windows 11 |
| Client Device | Android Smartphone |

---

## 🔌 Hardware Requirements

| Component | Purpose |
|---|---|
| ESP32 DevKit V1 | Wi-Fi communication gateway |
| Windows 11 Laptop | Target computer |
| Android Smartphone | Remote controller |
| Wi-Fi Router | Local network connectivity |
| USB Cable | ESP32 programming and power |

**Note:** The ESP32 does not perform desktop screen capture or video encoding. These operations are handled by the Windows Python companion.

---

## 💻 Software Requirements

Install the following software:

- Windows 11
- Python 3
- Arduino IDE
- ESP32 Board Support Package
- Git
- Node.js (only if developing or building the frontend locally)

---

# ⚙️ Installation and Setup

## Step 1: Clone the Repository

```bash
git clone https://github.com/SrihariAPPI/Esp32-Remote.git
```

Navigate to the project:

```bash
cd Esp32-Remote
```

## Step 2: Configure the ESP32

Navigate to the firmware directory:

```text
esp32-firmware/
    └── SHP_REMOTE.ino
```

Open the firmware in Arduino IDE.

Configure your Wi-Fi credentials:

```cpp
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
```

Use the actual configuration variable names present in your firmware.

Configure the authentication token to match the Windows companion.

### Arduino IDE Configuration

1. Install ESP32 board support.
2. Select ESP32 Dev Module.
3. Select the appropriate COM port.
4. Verify the firmware.
5. Upload the firmware.
6. Open Serial Monitor.
7. Check the assigned IP address.

The ESP32 should connect to your home router in Station Mode.

Example:

```text
[WiFi] CONNECTED TO HOME ROUTER SUCCESSFULLY!
[WiFi] Assigned IP address: 172.16.27.92

[HTTP] Web server listening on port 80
[WebSocket] Server listening on port 81

[System] Ready for Phone & Windows 11 connections.
```

## Step 3: Configure Windows Companion

Navigate to:

```text
SHP-REMOTE/windows-companion/
```

Create a Python virtual environment:

```powershell
py -m venv venv
```

Activate it:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

## Step 4: Configure config.json

Open:

```text
windows-companion/config.json
```

Example configuration:

```json
{
  "esp32_ip": "YOUR_ESP32_IP",
  "ws_port": 81,
  "auth_token": "YOUR_AUTH_TOKEN",
  "stream_port": 8082,
  "stream_fps": 30,
  "stream_quality": 70,
  "webrtc_enabled": true,
  "reconnect_interval_sec": 3,
  "mouse_speed_multiplier": 1.0,
  "allow_destructive_power": false,
  "max_mouse_step": 300
}
```

Replace the ESP32 IP address and authentication token with your actual configuration.

**Important:** The authentication token must match the firmware configuration.

## Step 5: Start the Windows Companion

Run:

```powershell
py remote_companion.py
```

Expected startup output:

```text
SHP REMOTE — WINDOWS 11 COMPANION & WEBRTC DESKTOP STREAMER

[Network] Detected Local LAN IP(s): YOUR_LAPTOP_IP

[Web Server] http://YOUR_LAPTOP_IP:8082

[WebRTC Engine] ACTIVE

[INFO] Websocket connected

[AUTH] Authentication approved by ESP32 Gateway.
```

Keep the companion running while using SHP REMOTE.

## Step 6: Configure Windows Firewall

If another device cannot access the Python companion, open PowerShell as Administrator:

```powershell
netsh advfirewall firewall add rule name="SHP Remote Stream" dir=in action=allow protocol=TCP localport=8082
```

Only allow the necessary network access. Prefer restricting the rule to your private network.

## Step 7: Open the Dashboard

Visit:

**https://shpremote.vercel.app/**

Open the dashboard on your Android smartphone.

Configure the ESP32 connection using its current LAN IP address and matching authentication details.

Connect and start using SHP REMOTE.

---

## 🌐 Network Configuration

All three devices should initially be connected to the same home Wi-Fi network.

Example network:

| Device | Example IP |
|---|---|
| Android Smartphone | 172.16.XX.XXX |
| ESP32 | 172.16.27.92 |
| Windows Laptop | 172.16.21.123 |

### Network Ports

| Port | Protocol | Purpose |
|---|---|---|
| 80 | HTTP | ESP32 HTTP server |
| 81 | WebSocket | ESP32 communication |
| 8082 | HTTP | Python companion and MJPEG endpoint |
| Dynamic | UDP | WebRTC media and data transport |

**Important networking notes:**

- IP addresses are assigned by the router and may change.
- DHCP reservations are recommended for stable device addresses.
- WebRTC may require STUN/TURN configuration depending on the network.
- HTTPS browser security restrictions must be considered when connecting to local HTTP and WebSocket services.
- Vercel hosts the frontend; it does not host the local Windows companion.

---

## 📸 Project Demonstration

Add your own project photographs and demonstration videos here.

Recommended repository structure:

```text
assets/
    ├── dashboard.png
    ├── mobile-controller.png
    ├── remote-desktop.png
    ├── esp32-hardware.jpg
    └── architecture.png
```

Example:

```markdown
![SHP REMOTE Dashboard](assets/dashboard.png)
```

---

## 🔐 Security Considerations

SHP REMOTE provides access to a Windows computer, so security is important.

- Use authentication for ESP32 and companion connections.
- Do not publish authentication tokens.
- Do not commit personal Wi-Fi passwords.
- Avoid exposing the Python companion directly to the public internet.
- Use trusted networks.
- Restrict Windows Firewall access.
- Keep destructive power operations disabled unless explicitly required.
- Use secure signaling and transport configurations for production deployments.

**SHP REMOTE is designed primarily for trusted local-network use.**

---

## 🛠️ Troubleshooting

| Problem | Possible Solution |
|---|---|
| ESP32 not connecting | Verify Wi-Fi SSID and password |
| WebSocket connection failed | Verify ESP32 IP and port 81 |
| Authentication rejected | Check matching tokens |
| Python server unavailable | Check whether port 8082 is running |
| MJPEG unauthorized | Verify streaming token configuration |
| Black remote desktop screen | Check screen capture and stream connection |
| WebRTC connection failed | Inspect SDP, ICE candidates and STUN/TURN configuration |
| Android cannot connect | Check network isolation and browser security restrictions |
| Mouse not responding | Verify companion authentication and Windows input permissions |

---

## 🚀 Future Development Roadmap

Planned improvements for SHP REMOTE:

- [ ] Installable Android Progressive Web App (PWA).
- [ ] Automatic Windows companion startup.
- [ ] Background companion management.
- [ ] Improved connection recovery.
- [ ] Enhanced authentication and device pairing.
- [ ] Remote connection diagnostics.
- [ ] Improved video quality and adaptive bitrate.
- [ ] Multiple monitor support.
- [ ] Customizable control layouts.
- [ ] Native Android application.
- [ ] Secure remote access beyond the local network.

---

## 🎯 Project Objectives

SHP REMOTE explores the integration of:

- Internet of Things (IoT).
- Embedded systems programming.
- Wireless communication.
- Real-time networking.
- Remote desktop technologies.
- Cross-platform web development.
- Windows automation.
- Video streaming.

The goal is to demonstrate how a low-cost microcontroller, a local computer service and a modern web interface can work together to create a practical remote-control ecosystem.

---

## 👨‍💻 Developer

**Srihariprasad K.V.**

Electronics and Communication Engineering Student | IoT | Embedded Systems | Full-Stack Development

- GitHub: https://github.com/SrihariAPPI/
- LinkedIn: https://www.linkedin.com/in/srihariprasad-k-v-03a394397/
- Portfolio: https://porrtfolio-shp.vercel.app/

---

## ⭐ Support the Project

If you find SHP REMOTE interesting:

- Give this repository a ⭐ Star.
- Share your feedback.
- Suggest new features.
- Contribute improvements.

**Built with curiosity, electronics and code.**

### SHP REMOTE — Your Laptop. Your Phone. One Wireless Connection. 🚀
