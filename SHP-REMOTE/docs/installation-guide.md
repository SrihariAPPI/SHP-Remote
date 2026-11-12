# SHP REMOTE — INSTALLATION & SETUP MANUAL

## Step 1: ESP32 Firmware (Home Wi-Fi Station Mode)
1. Open **Arduino IDE 2.3+**.
2. Install **WebSockets** by Markus Sattler and **ArduinoJson** by Benoit Blanchon in the Library Manager.
3. In `SHP_REMOTE.ino`, configure your Home Wi-Fi credentials:
   ```cpp
   const char* WIFI_SSID     = "H202";
   const char* WIFI_PASSWORD = "floor@202";
   ```
4. Select board **DOIT ESP32 DEVKIT V1**, pick COM Port, and click **Upload**.
5. Check Serial Monitor at **115200 baud** to see the assigned IP address (e.g. `172.16.27.92`).

## Step 2: Windows 11 Companion Setup
1. Install Python 3.10+ (ensure "Add python.exe to PATH" is checked).
2. Open terminal in `windows-companion/`:
   ```bash
   pip install -r requirements.txt
   ```
3. In `config.json`, verify `esp32_ip` matches your ESP32 IP.
4. Run:
   ```bash
   python remote_companion.py
   ```

## Step 3: Phone Connection
1. Connect Android phone to your Home Wi-Fi.
2. Open Chrome/Firefox and browse to `http://<ESP32_IP>` or `https://shpremote.vercel.app`.
3. Use the Touchpad, Keyboard, Media, Shortcuts, and WebRTC Remote Desktop!

## Step 4: Secure HTTPS & LAN Network Architecture
When accessing from `https://shpremote.vercel.app`, browsers enforce HTTPS origin boundaries.
Use one of the standard secure configurations:
1. **WebRTC Remote Desktop (Recommended):** Uses DTLS encrypted peer-to-peer WebRTC video and DataChannels (`shp-control`), functioning natively on HTTPS with no mixed-content issues.
2. **Direct Local LAN Origin:** Browse directly to `http://<ESP32_IP>` or `http://<PC_IP>:8082` on your Android phone (pure HTTP with zero mixed-content restrictions).
3. **Secure Tunnel / TLS:** Run Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:8082`) for end-to-end HTTPS.
