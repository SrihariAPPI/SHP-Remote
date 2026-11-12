import { RemoteConfig } from '../types/remote';

export function getStandaloneDashboardHtml(config: RemoteConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>SHP Remote — Wireless Laptop Controller</title>
  <link rel="stylesheet" href="style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Top Bar Contract -->
  <header class="app-header">
    <div class="header-brand">
      <span class="brand-text">SHP REMOTE</span>
    </div>
    <div class="header-status">
      <span class="status-indicator" id="statusPill">
        <span class="indicator-dot offline" id="companionDot"></span>
        <span id="companionStatusText">Connecting to ESP32...</span>
      </span>
    </div>
  </header>

  <!-- Module Navigation Tabs -->
  <nav class="module-tabs">
    <button class="tab-btn active" data-tab="mouse">Mouse</button>
    <button class="tab-btn" data-tab="keyboard">Keyboard</button>
    <button class="tab-btn" data-tab="media">Media</button>
    <button class="tab-btn" data-tab="shortcuts">Shortcuts</button>
    <button class="tab-btn" data-tab="apps">Apps</button>
    <button class="tab-btn" data-tab="power">Power</button>
  </nav>

  <!-- Main Viewports -->
  <main class="view-container">
    <!-- Mouse & Touchpad Module -->
    <section id="module-mouse" class="view-module active">
      <div class="touchpad-frame" id="touchpad">
        <div class="touchpad-crosshair"></div>
        <div class="touchpad-hint">Touchpad · Single finger move · Tap to click · Two fingers scroll</div>
      </div>
      
      <div class="mouse-actions-bar">
        <button class="btn btn-click" id="btnLeft">LEFT CLICK</button>
        <button class="btn btn-click btn-secondary" id="btnMiddle">MIDDLE</button>
        <button class="btn btn-click" id="btnRight">RIGHT CLICK</button>
      </div>

      <div class="sensitivity-slider-box">
        <label for="sensRange">Mouse Sensitivity: <span id="sensValue">${config.mouseSensitivity}x</span></label>
        <input type="range" id="sensRange" min="0.5" max="3.5" step="0.1" value="${config.mouseSensitivity}">
      </div>
    </section>

    <!-- Keyboard Module -->
    <section id="module-keyboard" class="view-module">
      <div class="text-send-form">
        <input type="text" id="keyboardTextInput" placeholder="Type text to send to Windows 11..." autocomplete="off">
        <button class="btn btn-primary" id="btnSendText">Send</button>
      </div>

      <div class="virtual-key-grid">
        <button class="key-btn" data-key="ESCAPE">Esc</button>
        <button class="key-btn" data-key="TAB">Tab</button>
        <button class="key-btn" data-key="BACKSPACE">Bksp</button>
        <button class="key-btn" data-key="ENTER">Enter</button>

        <button class="key-btn modifier-btn" data-mod="ctrl" id="modCtrl">Ctrl</button>
        <button class="key-btn modifier-btn" data-mod="alt" id="modAlt">Alt</button>
        <button class="key-btn modifier-btn" data-mod="shift" id="modShift">Shift</button>
        <button class="key-btn modifier-btn" data-mod="win" id="modWin">Win</button>

        <button class="key-btn" data-key="UP">▲</button>
        <button class="key-btn" data-key="DOWN">▼</button>
        <button class="key-btn" data-key="LEFT">◄</button>
        <button class="key-btn" data-key="RIGHT">►</button>

        <button class="key-btn key-wide" data-key="SPACE">Spacebar</button>
      </div>
    </section>

    <!-- Media Controls Module -->
    <section id="module-media" class="view-module">
      <div class="volume-control-card">
        <div class="volume-title">Master Volume</div>
        <div class="volume-buttons">
          <button class="btn btn-media" id="btnVolDown">VOL −</button>
          <button class="btn btn-media btn-danger" id="btnMute">MUTE</button>
          <button class="btn btn-media" id="btnVolUp">VOL +</button>
        </div>
      </div>

      <div class="playback-controls-card">
        <div class="volume-title">Media Playback</div>
        <div class="playback-buttons">
          <button class="btn btn-media" id="btnPrev">|◀ Prev</button>
          <button class="btn btn-media btn-primary" id="btnPlayPause">▶/❚❚ Play/Pause</button>
          <button class="btn btn-media" id="btnNext">Next ▶|</button>
        </div>
      </div>
    </section>

    <!-- Windows Shortcuts Module -->
    <section id="module-shortcuts" class="view-module">
      <div class="shortcuts-grid">
        <button class="shortcut-btn" data-shortcut="alt_tab">
          <span class="sc-name">Alt + Tab</span>
          <span class="sc-desc">Switch App</span>
        </button>
        <button class="shortcut-btn" data-shortcut="win_d">
          <span class="sc-name">Win + D</span>
          <span class="sc-desc">Show Desktop</span>
        </button>
        <button class="shortcut-btn" data-shortcut="win_e">
          <span class="sc-name">Win + E</span>
          <span class="sc-desc">File Explorer</span>
        </button>
        <button class="shortcut-btn" data-shortcut="win_r">
          <span class="sc-name">Win + R</span>
          <span class="sc-desc">Run Dialog</span>
        </button>
        <button class="shortcut-btn" data-shortcut="ctrl_shift_esc">
          <span class="sc-name">Ctrl+Shift+Esc</span>
          <span class="sc-desc">Task Manager</span>
        </button>
        <button class="shortcut-btn" data-shortcut="ctrl_c">
          <span class="sc-name">Ctrl + C</span>
          <span class="sc-desc">Copy</span>
        </button>
        <button class="shortcut-btn" data-shortcut="ctrl_v">
          <span class="sc-name">Ctrl + V</span>
          <span class="sc-desc">Paste</span>
        </button>
        <button class="shortcut-btn" data-shortcut="ctrl_z">
          <span class="sc-name">Ctrl + Z</span>
          <span class="sc-desc">Undo</span>
        </button>
        <button class="shortcut-btn" data-shortcut="win_l">
          <span class="sc-name">Win + L</span>
          <span class="sc-desc">Lock Screen</span>
        </button>
      </div>
    </section>

    <!-- App Launcher Module -->
    <section id="module-apps" class="view-module">
      <div class="shortcuts-grid">
        <button class="app-btn" data-app="browser">
          <span class="app-title">Web Browser</span>
          <span class="app-subtitle">Chrome / Edge</span>
        </button>
        <button class="app-btn" data-app="explorer">
          <span class="app-title">Explorer</span>
          <span class="app-subtitle">File Manager</span>
        </button>
        <button class="app-btn" data-app="vscode">
          <span class="app-title">VS Code</span>
          <span class="app-subtitle">Code Editor</span>
        </button>
        <button class="app-btn" data-app="notepad">
          <span class="app-title">Notepad</span>
          <span class="app-subtitle">Text Editor</span>
        </button>
        <button class="app-btn" data-app="calc">
          <span class="app-title">Calculator</span>
          <span class="app-subtitle">Math Utility</span>
        </button>
        <button class="app-btn" data-app="settings">
          <span class="app-title">Settings</span>
          <span class="app-subtitle">Windows Settings</span>
        </button>
      </div>
    </section>

    <!-- Power Management Module -->
    <section id="module-power" class="view-module">
      <div class="power-buttons-list">
        <button class="btn btn-power" id="btnPowerLock">Lock Workstation</button>
        <button class="btn btn-power" id="btnPowerSleep">Sleep Laptop</button>
        <button class="btn btn-power btn-warning" id="btnPowerRestart">Restart Laptop...</button>
        <button class="btn btn-power btn-danger" id="btnPowerShutdown">Shut Down Laptop...</button>
      </div>
    </section>
  </main>

  <script src="app.js"></script>
</body>
</html>
`;
}

export function getStandaloneDashboardCss(): string {
  return `/* SHP Remote — Standalone Dashboard Styling */
:root {
  --bg-main: #0b0f19;
  --bg-card: #131b2e;
  --border-subtle: rgba(56, 189, 248, 0.2);
  --accent-cyan: #38bdf8;
  --accent-glow: rgba(56, 189, 248, 0.4);
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --danger: #ef4444;
  --warning: #f59e0b;
  --success: #10b981;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
  -webkit-user-select: none;
}

body {
  background-color: var(--bg-main);
  color: var(--text-main);
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  touch-action: manipulation;
}

.app-header {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: rgba(19, 27, 46, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border-subtle);
}

.brand-text {
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.05em;
  color: var(--accent-cyan);
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
}
.indicator-dot.online {
  background: var(--success);
  box-shadow: 0 0 10px var(--success);
}
.indicator-dot.offline {
  background: var(--danger);
}

.status-indicator {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.module-tabs {
  display: flex;
  background: #090e17;
  padding: 6px 8px;
  gap: 6px;
  overflow-x: auto;
  border-bottom: 1px solid #1e293b;
}

.tab-btn {
  flex: 1;
  min-width: 68px;
  padding: 9px 8px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
}

.tab-btn.active {
  background: var(--bg-card);
  color: var(--accent-cyan);
  border: 1px solid var(--border-subtle);
}

.view-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.view-module {
  display: none;
  flex-direction: column;
  gap: 14px;
  flex: 1;
}

.view-module.active {
  display: flex;
}

.touchpad-frame {
  flex: 1;
  min-height: 360px;
  background: radial-gradient(circle at center, #1b253b 0%, #0d1424 100%);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  touch-action: none;
}

.touchpad-hint {
  color: var(--text-muted);
  font-size: 0.85rem;
  pointer-events: none;
  text-align: center;
  padding: 0 20px;
}

.mouse-actions-bar {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr;
  gap: 8px;
  height: 56px;
}

.btn {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.05s ease, background 0.1s ease;
}

.btn:active {
  transform: scale(0.97);
  background: var(--accent-cyan);
  color: #000;
}

.btn-primary {
  background: #0284c7;
  border-color: #38bdf8;
}

.btn-danger {
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.btn-warning {
  border-color: rgba(245, 158, 11, 0.4);
  color: #fde68a;
}

.sensitivity-slider-box {
  background: var(--bg-card);
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.text-send-form {
  display: flex;
  gap: 8px;
}

.text-send-form input {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 14px;
  color: #fff;
  font-size: 0.95rem;
  outline: none;
}

.virtual-key-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.key-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  padding: 14px 6px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.key-btn.active-modifier {
  background: #0284c7;
  color: #fff;
  border-color: #38bdf8;
}

.key-wide {
  grid-column: span 4;
  padding: 16px;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.shortcut-btn, .app-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  padding: 14px 8px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.sc-name, .app-title {
  font-weight: 600;
  font-size: 0.85rem;
}

.sc-desc, .app-subtitle {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.volume-control-card, .playback-controls-card {
  background: var(--bg-card);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
}

.volume-title {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.volume-buttons, .playback-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.power-buttons-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-power {
  padding: 18px;
  font-size: 1rem;
}
`;
}

export function getStandaloneDashboardJs(config: RemoteConfig): string {
  return `/**
 * SHP Remote — Client JavaScript
 * Communicates with ESP32 WebSocket server on port ${config.wsPort}
 */

const CONFIG = {
  authToken: "${config.authToken}",
  wsPort: ${config.wsPort},
  sensitivity: ${config.mouseSensitivity}
};

let ws = null;
let isAuthed = false;
let activeModifiers = new Set();

function init() {
  setupTabs();
  setupTouchpad();
  setupButtons();
  connectWebSocket();
}

function connectWebSocket() {
  const host = window.location.hostname || "${config.apIp}";
  const url = "ws://" + host + ":" + CONFIG.wsPort + "/";

  const statusText = document.getElementById("companionStatusText");
  const companionDot = document.getElementById("companionDot");

  statusText.textContent = "Connecting to ESP32...";
  companionDot.className = "indicator-dot offline";

  try {
    ws = new WebSocket(url);

    ws.onopen = () => {
      statusText.textContent = "Authenticating...";
      send({
        type: "auth",
        role: "ui",
        token: CONFIG.authToken,
        clientInfo: "SHP Remote Standalone Dashboard"
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "auth_response") {
          if (data.success) {
            isAuthed = true;
            statusText.textContent = "ESP32 Online";
          }
        } else if (data.type === "status") {
          if (data.companionConnected && data.companionAuthenticated) {
            companionDot.className = "indicator-dot online";
            statusText.textContent = "Windows 11 Online";
          } else {
            companionDot.className = "indicator-dot offline";
            statusText.textContent = "Windows Companion Offline";
          }
        }
      } catch (err) {
        console.error("Message error:", err);
      }
    };

    ws.onclose = () => {
      isAuthed = false;
      companionDot.className = "indicator-dot offline";
      statusText.textContent = "Disconnected. Reconnecting...";
      setTimeout(connectWebSocket, 2500);
    };

    ws.onerror = (err) => {
      console.warn("WebSocket error:", err);
    };
  } catch (e) {
    statusText.textContent = "Connection error";
    setTimeout(connectWebSocket, 3000);
  }
}

function send(packet) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(packet));
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".view-module").forEach(m => m.classList.remove("active"));
      tab.classList.add("active");
      const targetId = "module-" + tab.dataset.tab;
      const targetView = document.getElementById(targetId);
      if (targetView) targetView.classList.add("active");
    });
  });
}

function vibrate(ms) {
  if ("vibrate" in navigator) {
    try { navigator.vibrate(ms); } catch (e) {}
  }
}

function setupTouchpad() {
  const pad = document.getElementById("touchpad");
  let lastX = 0, lastY = 0;
  let isTouching = false;
  let startTime = 0;
  let lastScrollY = 0;

  pad.addEventListener("touchstart", (e) => {
    startTime = Date.now();
    if (e.touches.length === 1) {
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      isTouching = true;
    } else if (e.touches.length === 2) {
      isTouching = false;
      lastScrollY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
    e.preventDefault();
  }, { passive: false });

  pad.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1 && isTouching) {
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const dx = Math.round((curX - lastX) * CONFIG.sensitivity);
      const dy = Math.round((curY - lastY) * CONFIG.sensitivity);
      if (dx !== 0 || dy !== 0) {
        send({ type: "mouse_move", dx, dy });
        lastX = curX;
        lastY = curY;
      }
    } else if (e.touches.length === 2) {
      const curY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const delta = Math.round(curY - lastScrollY);
      if (Math.abs(delta) > 5) {
        send({ type: "mouse_scroll", dy: delta > 0 ? 1 : -1 });
        lastScrollY = curY;
        vibrate(6);
      }
    }
    e.preventDefault();
  }, { passive: false });

  pad.addEventListener("touchend", (e) => {
    if (e.touches.length === 0) {
      isTouching = false;
      const elapsed = Date.now() - startTime;
      if (elapsed < 200) {
        // Quick tap triggers left click
        send({ type: "mouse_click", button: "left" });
        vibrate(12);
      }
    }
  });

  const sensRange = document.getElementById("sensRange");
  const sensValue = document.getElementById("sensValue");
  if (sensRange) {
    sensRange.addEventListener("input", (e) => {
      CONFIG.sensitivity = parseFloat(e.target.value);
      sensValue.textContent = CONFIG.sensitivity.toFixed(1) + "x";
    });
  }
}

function setupButtons() {
  document.getElementById("btnLeft")?.addEventListener("click", () => {
    send({ type: "mouse_click", button: "left" });
    vibrate(12);
  });
  document.getElementById("btnMiddle")?.addEventListener("click", () => {
    send({ type: "mouse_click", button: "middle" });
    vibrate(12);
  });
  document.getElementById("btnRight")?.addEventListener("click", () => {
    send({ type: "mouse_click", button: "right" });
    vibrate(20);
  });

  // Text Send
  const sendTextAction = () => {
    const input = document.getElementById("keyboardTextInput");
    if (input && input.value) {
      send({ type: "text", text: input.value });
      vibrate(15);
      input.value = "";
    }
  };
  document.getElementById("btnSendText")?.addEventListener("click", sendTextAction);
  document.getElementById("keyboardTextInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendTextAction();
  });

  // Keys
  document.querySelectorAll(".key-btn[data-key]").forEach(btn => {
    btn.addEventListener("click", () => {
      send({ type: "key", key: btn.dataset.key });
      vibrate(8);
    });
  });

  // Modifiers
  document.querySelectorAll(".modifier-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const mod = btn.dataset.mod;
      if (activeModifiers.has(mod)) {
        activeModifiers.delete(mod);
        btn.classList.remove("active-modifier");
        send({ type: "key_up", key: mod });
        vibrate(8);
      } else {
        activeModifiers.add(mod);
        btn.classList.add("active-modifier");
        send({ type: "key_down", key: mod });
        vibrate(16);
      }
    });
  });

  // Media
  document.getElementById("btnVolUp")?.addEventListener("click", () => { send({ type: "media", action: "volumeup" }); vibrate(8); });
  document.getElementById("btnVolDown")?.addEventListener("click", () => { send({ type: "media", action: "volumedown" }); vibrate(8); });
  document.getElementById("btnMute")?.addEventListener("click", () => { send({ type: "media", action: "mute" }); vibrate(12); });
  document.getElementById("btnPlayPause")?.addEventListener("click", () => { send({ type: "media", action: "playpause" }); vibrate(14); });
  document.getElementById("btnPrev")?.addEventListener("click", () => { send({ type: "media", action: "prev" }); vibrate(14); });
  document.getElementById("btnNext")?.addEventListener("click", () => { send({ type: "media", action: "next" }); vibrate(14); });

  // Shortcuts
  document.querySelectorAll(".shortcut-btn[data-shortcut]").forEach(btn => {
    btn.addEventListener("click", () => {
      send({ type: "shortcut", combination: btn.dataset.shortcut });
      vibrate(12);
    });
  });

  // App Launcher
  document.querySelectorAll(".app-btn[data-app]").forEach(btn => {
    btn.addEventListener("click", () => {
      send({ type: "launch_app", appId: btn.dataset.app });
      vibrate(14);
    });
  });

  // Power
  document.getElementById("btnPowerLock")?.addEventListener("click", () => { send({ type: "power", action: "lock", confirmed: true }); vibrate(20); });
  document.getElementById("btnPowerSleep")?.addEventListener("click", () => { send({ type: "power", action: "sleep", confirmed: true }); vibrate(20); });
  document.getElementById("btnPowerRestart")?.addEventListener("click", () => {
    if (confirm("Restart Windows 11 laptop?")) {
      send({ type: "power", action: "restart", confirmed: true });
      vibrate(25);
    }
  });
  document.getElementById("btnPowerShutdown")?.addEventListener("click", () => {
    if (confirm("Shut Down Windows 11 laptop?")) {
      send({ type: "power", action: "shutdown", confirmed: true });
      vibrate(25);
    }
  });
}

window.addEventListener("DOMContentLoaded", init);
`;
}

