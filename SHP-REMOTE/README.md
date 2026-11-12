# SHP REMOTE — ESP32 WIRELESS WINDOWS 11 CONTROLLER & WEBRTC DESKTOP

> Production-grade DIY wireless remote controller and WebRTC remote desktop system.

---

## Architecture

- **Home Wi-Fi Station Mode:** All 3 devices (ESP32, Windows 11 Laptop, Android phone) connect to your home Wi-Fi router.
- **ESP32 DevKit V1:** Acts as a real-time WebSocket command relay and WebRTC signaling broker on port 81.
- **Windows 11 Companion:** Executes inputs via PyAutoGUI and streams the desktop in real time via WebRTC on port 8082 (with MJPEG fallback).
- **Web Dashboard:** Mobile-first, Unslop-inspired dark interface hosted on Vercel or directly on the ESP32.

---

## Directory Structure

```
SHP-REMOTE/
├── esp32-firmware/
│   └── SHP_REMOTE.ino          # Arduino firmware for ESP32 (Station Mode)
├── windows-companion/
│   ├── remote_companion.py     # Windows 11 Python companion with WebRTC
│   ├── requirements.txt        # Python dependencies
│   ├── config.json             # Network & streaming configuration
│   └── README.md
├── dashboard/
│   ├── index.html              # Standalone embedded web dashboard
│   ├── style.css
│   └── app.js
├── docs/
│   ├── system-architecture.md  # Detailed architecture & WebRTC specs
│   ├── wiring-guide.md         # ESP32 pinout & hardware manual
│   └── installation-guide.md   # Setup, DHCP reservation & Vercel steps
└── README.md
```
