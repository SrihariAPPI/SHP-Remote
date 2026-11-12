# SHP REMOTE — Windows 11 Companion Application

The Python companion connects your Windows 11 laptop to the ESP32 DevKit V1 access point over WebSocket, validates commands with a shared authentication token, and controls mouse, keyboard, media, and shortcuts.

## Quick Start

1. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
2. Connect your Windows 11 laptop Wi-Fi to `SHP-Remote` (Password: `shp-remote-password`).
3. Run companion:
   ```bash
   python remote_companion.py
   ```
