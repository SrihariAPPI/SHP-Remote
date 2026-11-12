# SHP REMOTE — SYSTEM ARCHITECTURE & WEBRTC SPECIFICATION

```
                     +----------------------------------+
                     |       HOME WI-FI ROUTER          |
                     |  (SSID: H202)                    |
                     |    DHCP Server Subnet 172.16.x   |
                     +----------------------------------+
                       /              |               \
       Home Wi-Fi LAN /               | Home Wi-Fi LAN \ Home Wi-Fi LAN
                     v                v                 v
          +------------------+  +-------------+  +----------------------+
          | ANDROID PHONE    |  | ESP32 DEVKIT|  | WINDOWS 11 LAPTOP    |
          | Web Dashboard    |  | Station Mode|  | Python Companion     |
          | WebRTC Client    |  | IP: Assigned|  | IP: Assigned         |
          +------------------+  +-------------+  +----------------------+
                   |                  ^                   ^
                   | Control & Signal | WS Relay Port 81  |
                   +=================>+==================>+
                   |
                   | P2P WebRTC Video Stream (Port 8082)
                   +======================================+
```

---

## 1. Network Topology (Home Wi-Fi Station Mode)

All three components join your existing home Wi-Fi network:
1. **ESP32 DevKit V1**: Operates in **Station Mode (WIFI_STA)**. Requests an IP via DHCP from your router. Hosts a WebSocket server on port 81.
2. **Android Phone**: Connects to the web dashboard and communicates with the ESP32 WebSocket for control commands and WebRTC signaling.
3. **Windows 11 Laptop**: Runs the Python Companion which connects to the ESP32 WebSocket and hosts the WebRTC desktop video stream on port 8082.

---

## 2. WebRTC Video Mirroring Architecture

- **Capture Engine:** Screen frames are captured using high-performance `mss` directly from Windows display output.
- **Video Track:** Converted to an `aiortc.VideoStreamTrack` and encoded to H.264/VP8.
- **Signaling:** SDP Offer/Answer and ICE candidates are exchanged either:
  1. Via the ESP32 WebSocket relay broker (`{"type":"webrtc_offer"}` -> `{"type":"webrtc_answer"}`).
  2. Directly via HTTP POST to `http://<LAPTOP_IP>:8082/offer`.
- **Peer-to-Peer:** Once signaling completes, video flows directly between the laptop and Android smartphone over your local Wi-Fi with ~12ms latency.
- **Fallback:** If WebRTC is blocked or `aiortc` is unavailable, the companion serves a high-speed HTTP MJPEG stream at `http://<LAPTOP_IP>:8082/stream`.

---

## 3. Router DHCP Reservation (Static Lease)

To prevent your router from reassigning a different IP to the ESP32:
1. Open your router's admin panel (typically `http://172.16.0.1` or `http://192.168.1.1`).
2. Navigate to **DHCP Server** $\rightarrow$ **Address Reservation** / **Static Leases**.
3. Locate the ESP32 MAC address (printed on Serial Monitor at boot).
4. Assign a fixed IP address (e.g. `172.16.27.92`) to this MAC address.
