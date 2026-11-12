# SHP REMOTE — ESP32 WIRELESS WINDOWS 11 CONTROLLER

> High-performance DIY wireless laptop controller using ESP32 DevKit V1, mobile web dashboard, and Windows 11 Python companion.

---

## 1. System Overview

SHP REMOTE turns any Android smartphone into an ultra-low latency wireless trackpad, keyboard, media remote, application launcher, and Windows session controller for your laptop.

No native Android app installation required — simply connect to the ESP32 Wi-Fi access point and control your PC from your mobile browser at `http://192.168.4.1`!

```
[ Android Phone (Browser) ]
            │
            ▼ (Wi-Fi SoftAP)
[ ESP32 DevKit V1 (Gateway & WS Relay) ]
            │
            ▼ (WebSocket Relay)
[ Windows 11 Laptop (Python Companion / Win32) ]
```

---

## 2. Directory Tree

```
SHP-REMOTE/
├── esp32-firmware/
│   └── SHP_REMOTE.ino          # Arduino C++ sketch for ESP32
├── windows-companion/
│   ├── remote_companion.py     # Windows 11 companion service
│   ├── requirements.txt        # Python dependencies
│   ├── config.json             # Configuration parameters
│   └── README.md               # Companion setup notes
├── dashboard/
│   ├── index.html              # Standalone web dashboard
│   ├── style.css               # Dark futuristic stylesheet
│   └── app.js                  # WebSocket client logic
├── docs/
│   ├── system-architecture.md  # Protocol, flowcharts & security
│   ├── wiring-guide.md         # Hardware pinouts & power
│   └── installation-guide.md   # Step-by-step setup manual
└── README.md                   # This project guide
```

---

## 3. Quick Start

1. **Flash ESP32:** Open `esp32-firmware/SHP_REMOTE.ino` in Arduino IDE and flash to ESP32 DevKit V1.
2. **Start Companion:** In `windows-companion/`, run `pip install -r requirements.txt` followed by `python remote_companion.py`.
3. **Connect Phone:** Connect your Android phone to Wi-Fi SSID `SHP-Remote` (password: `shp-remote-password`) and open `http://192.168.4.1` in your browser.
