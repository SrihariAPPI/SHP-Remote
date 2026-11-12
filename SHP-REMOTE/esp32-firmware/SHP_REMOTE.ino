/*
 * ==============================================================================
 * PROJECT: SHP REMOTE - ESP32 DevKit V1 (ESP-WROOM-32)
 * Wireless Windows Controller - Production Firmware (Wi-Fi Station Mode)
 *
 * Architecture (Home Wi-Fi Router):
 *   All devices connect to your home Wi-Fi network:
 *     1. Android Phone        --> Home Wi-Fi Router (DHCP e.g. 172.16.27.x)
 *     2. Windows 11 Laptop    --> Home Wi-Fi Router (DHCP e.g. 172.16.22.123)
 *     3. ESP32 DevKit V1      --> Home Wi-Fi Router (DHCP e.g. 172.16.27.92)
 *
 *   Communication:
 *     - Android Phone connects to ESP32 WebSocket (ws://<ESP32_IP>:81)
 *     - Windows Companion connects to ESP32 WebSocket (ws://<ESP32_IP>:81)
 *     - ESP32 acts as real-time low-latency command and WebRTC signaling relay
 *     - WebRTC Desktop Video streams peer-to-peer over Home Wi-Fi
 *
 * Required Arduino Libraries:
 *   1. WebSockets by Markus Sattler (v2.4.1+)
 *   2. ArduinoJson by Benoit Blanchon (v6.21+ or v7.x)
 *   3. Built-in ESP32 core (WiFi.h, WebServer.h, ESPmDNS.h)
 * ==============================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <ESPmDNS.h>

// ==============================================================================
// CONFIGURATION PARAMETERS (Customizable for your Home Wi-Fi Router)
// ==============================================================================
const char* WIFI_SSID         = "H202";               // Home Wi-Fi SSID
const char* WIFI_PASSWORD     = "floor@202";          // Home Wi-Fi Password

const uint16_t HTTP_PORT      = 80;
const uint16_t WS_PORT        = 81;
const char* AUTH_TOKEN        = "SHP_SECRET_TOKEN_2026";

#define SERIAL_BAUD_RATE          115200
#define AUTH_TIMEOUT_MS           10000    // 10s grace period to authenticate
#define HEARTBEAT_INTERVAL_MS     5000     // 5s status broadcast
#define WIFI_RECONNECT_INTERVAL   5000     // 5s Wi-Fi reconnection check
#define MAX_WS_CLIENTS            8

// ==============================================================================
// EMBEDDED WEB DASHBOARD (HTML / CSS / JS)
// Stored in Flash Memory (PROGMEM) to serve directly without external storage
// ==============================================================================
const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>SHP Remote</title>
  <style>
    :root {
      --bg: #09090b;
      --card: #121215;
      --card-border: rgba(255, 255, 255, 0.08);
      --accent: #38bdf8;
      --text: #fafafa;
      --text-muted: #a1a1aa;
      --danger: #ef4444;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      touch-action: pan-y;
    }
    header {
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(18, 18, 21, 0.95);
      border-bottom: 1px solid var(--card-border);
    }
    .brand { font-weight: 700; font-size: 1rem; letter-spacing: 0.05em; color: #fff; font-family: monospace; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
    .status-dot.online { background: var(--success); }
    .status-dot.offline { background: var(--danger); }
    .nav-tabs { display: flex; background: #121215; padding: 4px; gap: 4px; border-bottom: 1px solid var(--card-border); overflow-x: auto; }
    .nav-tabs button {
      flex: 1; min-width: 70px; padding: 8px 12px; background: transparent; border: none; color: var(--text-muted);
      font-size: 0.8rem; font-weight: 600; border-radius: 6px; cursor: pointer; white-space: nowrap;
    }
    .nav-tabs button.active { background: #18181c; color: #fff; border: 1px solid var(--card-border); }
    .view { display: none; padding: 16px; flex: 1; flex-direction: column; gap: 16px; }
    .view.active { display: flex; }
    .touchpad {
      flex: 1; min-height: 360px; background: #121215;
      border: 1px solid var(--card-border); border-radius: 8px; position: relative; touch-action: none;
      display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.85rem;
    }
    .click-bar { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; height: 56px; }
    .btn {
      background: #18181c; border: 1px solid var(--card-border); color: var(--text); border-radius: 6px;
      font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; cursor: pointer;
    }
    .btn:active { background: var(--accent); color: #000; }
    .grid-shortcuts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .shortcut-btn { padding: 12px 6px; font-size: 0.8rem; text-align: center; }
    .input-row { display: flex; gap: 8px; }
    .input-row input {
      flex: 1; background: #18181c; border: 1px solid var(--card-border); border-radius: 6px;
      color: #fff; padding: 10px; font-size: 0.9rem; outline: none;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">SHP REMOTE</div>
    <div id="statusIndicator" style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">
      <span class="status-dot offline" id="dotCompanion"></span>
      <span id="statusText">Connecting...</span>
    </div>
  </header>
  <div class="nav-tabs">
    <button class="active" onclick="switchTab('touch')">Touchpad</button>
    <button onclick="switchTab('keys')">Keyboard</button>
    <button onclick="switchTab('media')">Media</button>
    <button onclick="switchTab('shortcuts')">Hotkeys</button>
    <button onclick="switchTab('power')">Power</button>
  </div>

  <div id="view-touch" class="view active">
    <div class="touchpad" id="touchArea"><span>Touch & drag cursor</span></div>
    <div class="click-bar">
      <button class="btn" id="btnLeftClick">LEFT CLICK</button>
      <button class="btn" id="btnRightClick">RIGHT CLICK</button>
    </div>
  </div>

  <div id="view-keys" class="view">
    <div class="input-row">
      <input type="text" id="typeInput" placeholder="Type text to send..." autocomplete="off">
      <button class="btn" style="padding: 0 16px;" onclick="sendText()">SEND</button>
    </div>
    <div class="grid-shortcuts" style="margin-top: 10px;">
      <button class="btn shortcut-btn" onclick="sendKey('ENTER')">Enter</button>
      <button class="btn shortcut-btn" onclick="sendKey('BACKSPACE')">Backspace</button>
      <button class="btn shortcut-btn" onclick="sendKey('TAB')">Tab</button>
      <button class="btn shortcut-btn" onclick="sendKey('ESCAPE')">Esc</button>
      <button class="btn shortcut-btn" onclick="sendKey('UP')">▲</button>
      <button class="btn shortcut-btn" onclick="sendKey('SPACE')">Space</button>
      <button class="btn shortcut-btn" onclick="sendKey('LEFT')">◄</button>
      <button class="btn shortcut-btn" onclick="sendKey('DOWN')">▼</button>
      <button class="btn shortcut-btn" onclick="sendKey('RIGHT')">►</button>
    </div>
  </div>

  <div id="view-media" class="view">
    <div class="grid-shortcuts" style="grid-template-columns: repeat(2, 1fr);">
      <button class="btn shortcut-btn" onclick="sendMedia('volumeup')">VOL ▲</button>
      <button class="btn shortcut-btn" onclick="sendMedia('volumedown')">VOL ▼</button>
      <button class="btn shortcut-btn" onclick="sendMedia('mute')">MUTE</button>
      <button class="btn shortcut-btn" onclick="sendMedia('playpause')">PLAY / PAUSE</button>
      <button class="btn shortcut-btn" onclick="sendMedia('prev')">PREV TRACK</button>
      <button class="btn shortcut-btn" onclick="sendMedia('next')">NEXT TRACK</button>
    </div>
  </div>

  <div id="view-shortcuts" class="view">
    <div class="grid-shortcuts">
      <button class="btn shortcut-btn" onclick="sendShortcut('alt_tab')">Alt + Tab</button>
      <button class="btn shortcut-btn" onclick="sendShortcut('win_d')">Desktop</button>
      <button class="btn shortcut-btn" onclick="sendShortcut('win_e')">Explorer</button>
      <button class="btn shortcut-btn" onclick="sendShortcut('ctrl_shift_esc')">Task Mgr</button>
      <button class="btn shortcut-btn" onclick="sendShortcut('ctrl_c')">Copy</button>
      <button class="btn shortcut-btn" onclick="sendShortcut('ctrl_v')">Paste</button>
      <button class="btn shortcut-btn" onclick="sendShortcut('ctrl_z')">Undo</button>
      <button class="btn shortcut-btn" onclick="sendShortcut('win_l')">Lock PC</button>
      <button class="btn shortcut-btn" onclick="sendShortcut('win_r')">Run</button>
    </div>
  </div>

  <div id="view-power" class="view">
    <div class="grid-shortcuts" style="grid-template-columns: 1fr;">
      <button class="btn shortcut-btn" onclick="sendPower('lock', false)">Lock Workstation</button>
      <button class="btn shortcut-btn" onclick="sendPower('sleep', false)">Sleep Computer</button>
      <button class="btn shortcut-btn" style="border-color: rgba(239, 68, 68, 0.4); color: #f87171;" onclick="sendPower('restart', true)">Restart Computer</button>
      <button class="btn shortcut-btn" style="border-color: rgba(239, 68, 68, 0.4); color: #f87171;" onclick="sendPower('shutdown', true)">Shutdown Computer</button>
    </div>
  </div>

  <script>
    let ws = null;
    let isConnected = false;
    let lastX = 0, lastY = 0;
    const AUTH_TOKEN = "SHP_SECRET_TOKEN_2026";

    function connectWS() {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = proto + '//' + location.hostname + ':81/';
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "auth", role: "ui", token: AUTH_TOKEN, clientInfo: "ESP32 Embedded UI" }));
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "auth_response" && msg.success) {
            isConnected = true;
            updateStatus(true, "Gateway Linked");
          } else if (msg.type === "status") {
            const ok = msg.companionConnected && msg.companionAuthenticated;
            updateStatus(ok, ok ? "Windows 11 Linked" : "Waiting Companion");
          }
        } catch(err){}
      };

      ws.onclose = () => {
        isConnected = false;
        updateStatus(false, "Offline. Reconnecting...");
        setTimeout(connectWS, 2000);
      };
    }

    function updateStatus(online, text) {
      document.getElementById('dotCompanion').className = 'status-dot ' + (online ? 'online' : 'offline');
      document.getElementById('statusText').innerText = text;
    }

    function send(obj) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(obj));
        if (navigator.vibrate) navigator.vibrate(8);
      }
    }

    function switchTab(name) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.nav-tabs button').forEach(b => b.classList.remove('active'));
      document.getElementById('view-' + name).classList.add('active');
      event.target.classList.add('active');
    }

    const touchArea = document.getElementById('touchArea');
    touchArea.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    }, { passive: false });

    touchArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const dx = Math.round((e.touches[0].clientX - lastX) * 1.5);
        const dy = Math.round((e.touches[0].clientY - lastY) * 1.5);
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        if (dx !== 0 || dy !== 0) send({ type: 'mouse_move', dx, dy });
      }
    }, { passive: false });

    document.getElementById('btnLeftClick').addEventListener('click', () => send({ type: 'mouse_click', button: 'left' }));
    document.getElementById('btnRightClick').addEventListener('click', () => send({ type: 'mouse_click', button: 'right' }));

    function sendText() {
      const input = document.getElementById('typeInput');
      if (input.value) {
        send({ type: 'text', text: input.value });
        input.value = '';
      }
    }
    function sendKey(key) { send({ type: 'key', key }); }
    function sendMedia(action) { send({ type: 'media', action }); }
    function sendShortcut(combination) { send({ type: 'shortcut', combination }); }
    function sendPower(action, confirmed) { send({ type: 'power', action, confirmed }); }

    connectWS();
  </script>
</body>
</html>
)rawliteral";

// ==============================================================================
// RUNTIME DATA STRUCTURES
// ==============================================================================
struct ClientSession {
  bool active;
  bool authenticated;
  String role;                // "ui" or "companion"
  unsigned long connectTime;
  unsigned long lastPingTime;
  IPAddress ip;
};

WebServer server(HTTP_PORT);
WebSocketsServer webSocket = WebSocketsServer(WS_PORT);

ClientSession clients[MAX_WS_CLIENTS];
int uiClientNum = -1;
int companionClientNum = -1;
unsigned long lastHeartbeat = 0;
unsigned long lastWifiCheck = 0;

void handleRoot();
void handleStatusHttp();
void handleNotFound();
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);
void broadcastSystemStatus();
void checkClientTimeouts();
void setupWiFiStation();

// ==============================================================================
// SETUP FUNCTION
// ==============================================================================
void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  delay(1000);
  Serial.println();
  Serial.println("==================================================");
  Serial.println("  SHP REMOTE - ESP32 WI-FI STATION CONTROLLER     ");
  Serial.println("==================================================");

  // Initialize client sessions
  for (int i = 0; i < MAX_WS_CLIENTS; i++) {
    clients[i].active = false;
    clients[i].authenticated = false;
    clients[i].role = "";
    clients[i].connectTime = 0;
    clients[i].lastPingTime = 0;
  }

  // Connect to Home Wi-Fi Router (Station Mode)
  setupWiFiStation();

  // Setup mDNS responder (http://shp-remote.local)
  if (MDNS.begin("shp-remote")) {
    Serial.println("[mDNS] Responder started at http://shp-remote.local");
    MDNS.addService("http", "tcp", HTTP_PORT);
    MDNS.addService("ws", "tcp", WS_PORT);
  }

  // Setup Web Server endpoints
  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatusHttp);
  server.onNotFound(handleNotFound);
  server.begin();
  Serial.printf("[HTTP] Web server listening on port %d\n", HTTP_PORT);

  // Setup WebSocket Server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.printf("[WebSocket] Server listening on port %d\n", WS_PORT);
  Serial.println("[System] Ready for Phone & Windows 11 connections.");
}

// ==============================================================================
// WI-FI STATION SETUP & RECONNECTION
// ==============================================================================
void setupWiFiStation() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  Serial.printf("[WiFi] Connecting to Home Wi-Fi: %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("--------------------------------------------------");
    Serial.println("[WiFi] CONNECTED TO HOME ROUTER SUCCESSFULLY!");
    Serial.printf("[WiFi] Assigned IP address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WiFi] Gateway IP:          %s\n", WiFi.gatewayIP().toString().c_str());
    Serial.printf("[WiFi] Subnet Mask:         %s\n", WiFi.subnetMask().toString().c_str());
    Serial.printf("[WiFi] MAC Address:         %s\n", WiFi.macAddress().c_str());
    Serial.printf("[WiFi] Web Dashboard URL:   http://%s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WiFi] WebSocket Endpoint:  ws://%s:%d\n", WiFi.localIP().toString().c_str(), WS_PORT);
    Serial.println("--------------------------------------------------");
    Serial.println("[TIP] For stable operation, configure a DHCP reservation");
    Serial.println("      in your home router for this ESP32 MAC address.");
    Serial.println("--------------------------------------------------");
  } else {
    Serial.println();
    Serial.println("[WiFi] WARNING: Could not connect to Home Wi-Fi!");
    Serial.println("[WiFi] Check SSID/Password. Background reconnect active.");
  }
}

// ==============================================================================
// MAIN LOOP
// ==============================================================================
void loop() {
  server.handleClient();
  webSocket.loop();

  unsigned long now = millis();

  // Periodic Wi-Fi connection check & automatic reconnect
  if (now - lastWifiCheck >= WIFI_RECONNECT_INTERVAL) {
    lastWifiCheck = now;
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Connection lost. Attempting reconnection...");
      WiFi.reconnect();
    }
  }

  // Periodic status heartbeat & client cleanup
  if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = now;
    broadcastSystemStatus();
    checkClientTimeouts();
  }
}

// ==============================================================================
// HTTP HANDLERS
// ==============================================================================
void handleRoot() {
  server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server.send(200, "text/html", INDEX_HTML);
}

void handleStatusHttp() {
  StaticJsonDocument<300> doc;
  doc["system"] = "SHP-Remote";
  doc["mode"] = "Station";
  doc["ip"] = WiFi.localIP().toString();
  doc["ssid"] = WIFI_SSID;
  doc["mac"] = WiFi.macAddress();
  doc["uptime_ms"] = millis();
  doc["free_heap"] = ESP.getFreeHeap();
  doc["ui_connected"] = (uiClientNum >= 0 && clients[uiClientNum].authenticated);
  doc["companion_connected"] = (companionClientNum >= 0 && clients[companionClientNum].authenticated);
  String response;
  serializeJson(doc, response);
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", response);
}

void handleNotFound() {
  server.send(404, "text/plain", "404 Not Found - SHP Remote");
}

// ==============================================================================
// WEBSOCKET EVENT HANDLER & RELAY ENGINE
// ==============================================================================
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (num >= MAX_WS_CLIENTS) return;

  switch (type) {
    case WStype_DISCONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[WS][%u] Disconnected from %s (Role: %s)\n", num, ip.toString().c_str(), clients[num].role.c_str());

      if (num == uiClientNum) {
        uiClientNum = -1;
        Serial.println("[WS] UI Client disconnected.");
        // Emergency release of any held keys/buttons on Windows companion
        if (companionClientNum >= 0 && clients[companionClientNum].authenticated) {
          webSocket.sendTXT(companionClientNum, "{\"type\":\"emergency_release\"}");
        }
      } else if (num == companionClientNum) {
        companionClientNum = -1;
        Serial.println("[WS] Companion Client (Windows 11) disconnected!");
      }

      clients[num].active = false;
      clients[num].authenticated = false;
      clients[num].role = "";
      broadcastSystemStatus();
      break;
    }

    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[WS][%u] New connection from %s\n", num, ip.toString().c_str());
      clients[num].active = true;
      clients[num].authenticated = false;
      clients[num].role = "";
      clients[num].connectTime = millis();
      clients[num].lastPingTime = millis();
      clients[num].ip = ip;
      break;
    }

    case WStype_TEXT: {
      clients[num].lastPingTime = millis();
      DynamicJsonDocument doc(2048); // Capacity for WebRTC SDP offers/answers
      DeserializationError error = deserializeJson(doc, payload, length);

      if (error) {
        Serial.printf("[WS][%u] JSON parse failed: %s\n", num, error.c_str());
        return;
      }

      const char* msgType = doc["type"];
      if (!msgType) return;

      // Ping / Pong
      if (strcmp(msgType, "ping") == 0) {
        webSocket.sendTXT(num, "{\"type\":\"pong\"}");
        return;
      }

      // Authentication
      if (strcmp(msgType, "auth") == 0) {
        const char* token = doc["token"];
        const char* role = doc["role"];

        if (token && strcmp(token, AUTH_TOKEN) == 0 && role) {
          clients[num].authenticated = true;
          clients[num].role = String(role);

          if (strcmp(role, "ui") == 0) {
            uiClientNum = num;
            Serial.printf("[Auth] UI Client authenticated on socket #%u\n", num);
          } else if (strcmp(role, "companion") == 0) {
            companionClientNum = num;
            Serial.printf("[Auth] Windows 11 Companion authenticated on socket #%u\n", num);
          }

          StaticJsonDocument<128> reply;
          reply["type"] = "auth_response";
          reply["success"] = true;
          reply["role"] = role;
          reply["message"] = "Authentication successful";
          String replyStr;
          serializeJson(reply, replyStr);
          webSocket.sendTXT(num, replyStr);
          broadcastSystemStatus();
        } else {
          Serial.printf("[Auth][%u] Failed auth attempt (invalid token or role)\n", num);
          webSocket.sendTXT(num, "{\"type\":\"auth_response\",\"success\":false,\"message\":\"Invalid token\"}");
          webSocket.disconnect(num);
        }
        return;
      }

      // Security check: Drop unauthenticated messages
      if (!clients[num].authenticated) {
        Serial.printf("[Security][%u] Blocked unauthenticated message '%s'\n", num, msgType);
        return;
      }

      // Bidirectional routing & WebRTC signaling relay between UI and Windows Companion
      if (num == uiClientNum) {
        if (companionClientNum >= 0 && clients[companionClientNum].authenticated) {
          String forwardData;
          serializeJson(doc, forwardData);
          webSocket.sendTXT(companionClientNum, forwardData);
        }
      } else if (num == companionClientNum) {
        if (uiClientNum >= 0 && clients[uiClientNum].authenticated) {
          String forwardData;
          serializeJson(doc, forwardData);
          webSocket.sendTXT(uiClientNum, forwardData);
        }
      }
      break;
    }

    default:
      break;
  }
}

// ==============================================================================
// STATUS BROADCAST & TIMEOUT MANAGEMENT
// ==============================================================================
void broadcastSystemStatus() {
  StaticJsonDocument<300> doc;
  doc["type"] = "status";
  doc["mode"] = "Station";
  doc["ssid"] = WIFI_SSID;
  doc["esp32Ip"] = WiFi.localIP().toString();
  doc["uiConnected"] = (uiClientNum >= 0 && clients[uiClientNum].active);
  doc["uiAuthenticated"] = (uiClientNum >= 0 && clients[uiClientNum].authenticated);
  doc["companionConnected"] = (companionClientNum >= 0 && clients[companionClientNum].active);
  doc["companionAuthenticated"] = (companionClientNum >= 0 && clients[companionClientNum].authenticated);
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["uptimeSeconds"] = millis() / 1000;

  String out;
  serializeJson(doc, out);

  for (int i = 0; i < MAX_WS_CLIENTS; i++) {
    if (clients[i].active && clients[i].authenticated) {
      webSocket.sendTXT(i, out);
    }
  }
}

void checkClientTimeouts() {
  unsigned long now = millis();
  for (int i = 0; i < MAX_WS_CLIENTS; i++) {
    if (clients[i].active && !clients[i].authenticated) {
      if (now - clients[i].connectTime > AUTH_TIMEOUT_MS) {
        Serial.printf("[Security][%u] Auth timeout expired. Disconnecting.\n", i);
        webSocket.disconnect(i);
      }
    }
  }
}
