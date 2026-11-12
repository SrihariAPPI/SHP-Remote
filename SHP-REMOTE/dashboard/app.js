const AUTH_TOKEN = "SHP_SECRET_TOKEN_2026";
let ws = null;
let isAuthed = false;

function vibrate(ms) {
  if ("vibrate" in navigator) {
    try { navigator.vibrate(ms); } catch (e) {}
  }
}

function init() {
  setupTabs();
  setupTouchpad();
  setupButtons();
  connectWebSocket();
}

function connectWebSocket() {
  const host = window.location.hostname || "192.168.4.1";
  const url = "ws://" + host + ":81/";
  const statusText = document.getElementById("companionStatusText");
  const companionDot = document.getElementById("companionDot");

  try {
    ws = new WebSocket(url);
    ws.onopen = () => {
      statusText.textContent = "Authenticating...";
      send({ type: "auth", role: "ui", token: AUTH_TOKEN });
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "auth_response" && data.success) {
          isAuthed = true;
          statusText.textContent = "ESP32 Online";
        } else if (data.type === "status") {
          if (data.companionConnected && data.companionAuthenticated) {
            companionDot.className = "indicator-dot online";
            statusText.textContent = "Windows 11 Online";
          } else {
            companionDot.className = "indicator-dot offline";
            statusText.textContent = "Companion Offline";
          }
        }
      } catch (err) {}
    };
    ws.onclose = () => {
      isAuthed = false;
      companionDot.className = "indicator-dot offline";
      statusText.textContent = "Reconnecting...";
      setTimeout(connectWebSocket, 2000);
    };
  } catch (e) {
    setTimeout(connectWebSocket, 3000);
  }
}

function send(packet) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(packet));
  }
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".view-module").forEach(m => m.classList.remove("active"));
      tab.classList.add("active");
      const target = document.getElementById("module-" + tab.dataset.tab);
      if (target) target.classList.add("active");
      vibrate(10);
    });
  });
}

function setupTouchpad() {
  const pad = document.getElementById("touchpad");
  let lastX = 0, lastY = 0, isTouching = false, startTime = 0;

  pad.addEventListener("touchstart", (e) => {
    startTime = Date.now();
    if (e.touches.length === 1) {
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      isTouching = true;
    }
    e.preventDefault();
  }, { passive: false });

  pad.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1 && isTouching) {
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const dx = Math.round((curX - lastX) * 1.5);
      const dy = Math.round((curY - lastY) * 1.5);
      if (dx !== 0 || dy !== 0) {
        send({ type: "mouse_move", dx, dy });
        lastX = curX;
        lastY = curY;
      }
    }
    e.preventDefault();
  }, { passive: false });

  pad.addEventListener("touchend", (e) => {
    if (e.touches.length === 0) {
      isTouching = false;
      if (Date.now() - startTime < 180) {
        send({ type: "mouse_click", button: "left" });
        vibrate(12);
      }
    }
  });
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

  document.getElementById("btnSendText")?.addEventListener("click", () => {
    const input = document.getElementById("keyboardTextInput");
    if (input && input.value) {
      send({ type: "text", text: input.value });
      vibrate(15);
      input.value = "";
    }
  });

  document.querySelectorAll(".key-btn[data-key]").forEach(btn => {
    btn.addEventListener("click", () => {
      send({ type: "key", key: btn.dataset.key });
      vibrate(8);
    });
  });

  document.getElementById("btnVolUp")?.addEventListener("click", () => { send({ type: "media", action: "volumeup" }); vibrate(8); });
  document.getElementById("btnVolDown")?.addEventListener("click", () => { send({ type: "media", action: "volumedown" }); vibrate(8); });
  document.getElementById("btnMute")?.addEventListener("click", () => { send({ type: "media", action: "mute" }); vibrate(12); });
  document.getElementById("btnPlayPause")?.addEventListener("click", () => { send({ type: "media", action: "playpause" }); vibrate(14); });
  document.getElementById("btnPrev")?.addEventListener("click", () => { send({ type: "media", action: "prev" }); vibrate(14); });
  document.getElementById("btnNext")?.addEventListener("click", () => { send({ type: "media", action: "next" }); vibrate(14); });

  document.querySelectorAll(".shortcut-btn[data-shortcut]").forEach(btn => {
    btn.addEventListener("click", () => {
      send({ type: "shortcut", combination: btn.dataset.shortcut });
      vibrate(12);
    });
  });

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
