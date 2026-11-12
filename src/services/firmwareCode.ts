import { RemoteConfig } from '../types/remote';

export function getEsp32FirmwareCode(config: RemoteConfig): string {
  const targetIp = config.esp32Ip || config.apIp || '172.16.27.92';

  return `/*
 * ==============================================================================
 * PROJECT: SHP REMOTE - ESP32 DevKit V1 (ESP-WROOM-32)
 * Wireless Windows Controller - Production Firmware (Wi-Fi Station Mode)
 *
 * Architecture (Home Wi-Fi Router):
 *   All devices connect to your home Wi-Fi network:
 *     1. Android Phone        --> Home Wi-Fi Router (DHCP e.g. 172.16.27.x)
 *     2. Windows 11 Laptop    --> Home Wi-Fi Router (DHCP e.g. ${config.streamHost || '172.16.22.123'})
 *     3. ESP32 DevKit V1      --> Home Wi-Fi Router (DHCP e.g. ${targetIp})
 *
 *   Communication:
 *     - Android Phone connects to ESP32 WebSocket (ws://<ESP32_IP>:${config.wsPort})
 *     - Windows Companion connects to ESP32 WebSocket (ws://<ESP32_IP>:${config.wsPort})
 *     - ESP32 acts as real-time low-latency command and WebRTC signaling relay
 *     - WebRTC Desktop Video streams peer-to-peer over Home Wi-Fi
 *
 * Required Arduino Libraries:
 *   1. WebSockets by Markus Sattler (v2.4.1+)
 *   2. ArduinoJson by Benoit Blanchon (v6.21+ or v7.x)
 *   3. Built-in ESP32 core (WiFi.h, WebServer.h, ESPmDNS.h)
 *
 * Board Settings:
 *   Board: "ESP32 Dev Module" (or "DOIT ESP32 DEVKIT V1")
 *   Upload Speed: 921600 (or 115200)
 *   Flash Frequency: 80MHz
 *   Partition Scheme: Default 4MB with spiffs
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
const char* WIFI_SSID         = "${config.ssid}";         // Your home Wi-Fi SSID
const char* WIFI_PASSWORD     = "${config.wifiPassword}"; // Your home Wi-Fi Password

const uint16_t HTTP_PORT      = ${config.httpPort};
const uint16_t WS_PORT        = ${config.wsPort};
const char* AUTH_TOKEN        = "${config.authToken}";

#define SERIAL_BAUD_RATE          115200
#define AUTH_TIMEOUT_MS           10000    // 10s grace period to authenticate
#define HEARTBEAT_INTERVAL_MS     5000     // 5s status broadcast
#define WIFI_RECONNECT_INTERVAL   5000     // 5s Wi-Fi reconnection check
#define MAX_WS_CLIENTS            8

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
  Serial.printf("[HTTP] Web server listening on port %d\\n", HTTP_PORT);

  // Setup WebSocket Server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.printf("[WebSocket] Server listening on port %d\\n", WS_PORT);
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
    Serial.printf("[WiFi] Assigned IP address: %s\\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WiFi] Gateway IP:          %s\\n", WiFi.gatewayIP().toString().c_str());
    Serial.printf("[WiFi] Subnet Mask:         %s\\n", WiFi.subnetMask().toString().c_str());
    Serial.printf("[WiFi] MAC Address:         %s\\n", WiFi.macAddress().c_str());
    Serial.printf("[WiFi] Web Dashboard URL:   http://%s\\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WiFi] WebSocket Endpoint:  ws://%s:%d\\n", WiFi.localIP().toString().c_str(), WS_PORT);
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
  server.send(200, "text/html", "<html><body style='background:#09090b;color:#fff;font-family:sans-serif;padding:20px;'><h2>SHP Remote Gateway Active</h2><p>Connect phone to WebSocket at port " + String(WS_PORT) + "</p></body></html>");
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
      Serial.printf("[WS][%u] Disconnected from %s (Role: %s)\\n", num, ip.toString().c_str(), clients[num].role.c_str());

      if (num == uiClientNum) {
        uiClientNum = -1;
        Serial.println("[WS] UI Client disconnected.");
        if (companionClientNum >= 0 && clients[companionClientNum].authenticated) {
          webSocket.sendTXT(companionClientNum, "{\\"type\\":\\"emergency_release\\"}");
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
      Serial.printf("[WS][%u] New connection from %s\\n", num, ip.toString().c_str());
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
        Serial.printf("[WS][%u] JSON parse failed: %s\\n", num, error.c_str());
        return;
      }

      const char* msgType = doc["type"];
      if (!msgType) return;

      if (strcmp(msgType, "ping") == 0) {
        webSocket.sendTXT(num, "{\\"type\\":\\"pong\\"}");
        return;
      }

      if (strcmp(msgType, "auth") == 0) {
        const char* token = doc["token"];
        const char* role = doc["role"];

        if (token && strcmp(token, AUTH_TOKEN) == 0 && role) {
          clients[num].authenticated = true;
          clients[num].role = String(role);

          if (strcmp(role, "ui") == 0) {
            uiClientNum = num;
            Serial.printf("[Auth] UI Client authenticated on socket #%u\\n", num);
          } else if (strcmp(role, "companion") == 0) {
            companionClientNum = num;
            Serial.printf("[Auth] Windows 11 Companion authenticated on socket #%u\\n", num);
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
          Serial.printf("[Auth][%u] Failed auth attempt (invalid token or role)\\n", num);
          webSocket.sendTXT(num, "{\\"type\\":\\"auth_response\\",\\"success\\":false,\\"message\\":\\"Invalid token\\"}");
          webSocket.disconnect(num);
        }
        return;
      }

      if (!clients[num].authenticated) {
        Serial.printf("[Security][%u] Blocked unauthenticated message '%s'\\n", num, msgType);
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
        Serial.printf("[Security][%u] Auth timeout expired. Disconnecting.\\n", i);
        webSocket.disconnect(i);
      }
    }
  }
}
`;
}
