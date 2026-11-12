"""
==============================================================================
PROJECT: SHP REMOTE - WINDOWS 11 COMPANION & WEBRTC DESKTOP STREAMER
File: remote_companion.py
Author: SHP Remote Engineering
Description:
  Production-grade Windows 11 companion application connecting to the
  ESP32 DevKit V1 WebSocket relay on your Home Wi-Fi network.

  Capabilities:
  1. Persistent WebRTC Desktop Video Streaming (aiortc) with background event loop
  2. WebRTC DataChannel ('shp-control') for sub-5ms input transport
  3. Bidirectional ICE candidate exchange & host candidate gathering
  4. Fallback High-speed HTTP MJPEG Screen Streaming on port 8082
  5. Built-in Local HTTP Web Server serving the dashboard on port 8082
  6. Absolute & relative mouse control, click, drag, scroll via PyAutoGUI
  7. Full keyboard input, modifier keys, and text transmission
  8. Native Win32 multimedia hardware key emulation (ctypes)
  9. Windows 11 shortcut launcher & power session controls
  10. Local IP detection, Firewall diagnostic hints, and token security
==============================================================================
"""

import os
import sys
import json
import time
import io
import ctypes
import socket
import logging
import threading
import asyncio
import hmac
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
from typing import Set, Dict, Any, Optional

# Core third-party dependencies
try:
    import pyautogui
    import websocket
except ImportError as e:
    print(f"[FATAL] Missing required dependency: {e}")
    print("Please install requirements using: pip install -r requirements.txt")
    sys.exit(1)

# High-speed screen capture library
try:
    import mss
    HAS_MSS = True
except ImportError:
    HAS_MSS = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# WebRTC streaming via aiortc
try:
    import av
    from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack, RTCIceCandidate
    HAS_WEBRTC = True
except ImportError:
    HAS_WEBRTC = False

# Safety settings for PyAutoGUI
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.001

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("SHP-Companion")

# Win32 Virtual-Key Codes for Multimedia
VK_VOLUME_MUTE = 0xAD
VK_VOLUME_DOWN = 0xAE
VK_VOLUME_UP = 0xAF
VK_MEDIA_NEXT_TRACK = 0xB0
VK_MEDIA_PREV_TRACK = 0xB1
VK_MEDIA_STOP = 0xB2
VK_MEDIA_PLAY_PAUSE = 0xB3
KEYEVENTF_EXTENDEDKEY = 0x0001
KEYEVENTF_KEYUP = 0x0002

def press_win32_media_key(vk_code: int):
    """Simulate native Windows multimedia hardware keypress using Win32 API."""
    if sys.platform != "win32":
        logger.warning("Win32 multimedia keys are only available on Windows.")
        return
    try:
        user32 = ctypes.windll.user32
        user32.keybd_event(vk_code, 0, KEYEVENTF_EXTENDEDKEY, 0)
        time.sleep(0.02)
        user32.keybd_event(vk_code, 0, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, 0)
    except Exception as ex:
        logger.error(f"Failed to press Win32 key {hex(vk_code)}: {ex}")

def get_local_ip_addresses() -> list:
    """Retrieve all local LAN IP addresses for network guidance."""
    ips = []
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127."):
                ips.append(ip)
    except Exception:
        pass
    if not ips:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ips.append(s.getsockname()[0])
            s.close()
        except Exception:
            ips.append("127.0.0.1")
    return ips

# ==============================================================================
# WEBRTC VIDEO STREAM TRACK (aiortc)
# ==============================================================================
if HAS_WEBRTC:
    class DesktopVideoStreamTrack(VideoStreamTrack):
        """WebRTC Video Stream Track streaming live Windows 11 desktop frames."""
        def __init__(self, fps: int = 30, scale: float = 0.75):
            super().__init__()
            self.fps = fps
            self.scale = scale
            self.sct = mss.mss() if HAS_MSS else None
            self.monitor = self.sct.monitors[1] if self.sct else None
            self.last_capture_time = 0

        async def recv(self):
            pts, time_base = await self.next_timestamp()

            # Enforce target FPS
            now = time.time()
            elapsed = now - self.last_capture_time
            target_period = 1.0 / self.fps
            if elapsed < target_period:
                await asyncio.sleep(target_period - elapsed)
            self.last_capture_time = time.time()

            try:
                if self.sct and self.monitor:
                    sct_img = self.sct.grab(self.monitor)
                    img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
                else:
                    img = pyautogui.screenshot()

                if self.scale != 1.0:
                    new_w = int(img.width * self.scale)
                    new_h = int(img.height * self.scale)
                    img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)

                frame = av.VideoFrame.from_image(img)
                frame.pts = pts
                frame.time_base = time_base
                return frame
            except Exception as e:
                logger.error(f"Frame capture error in WebRTC track: {e}")
                blank = Image.new("RGB", (640, 360), color=(18, 18, 21))
                frame = av.VideoFrame.from_image(blank)
                frame.pts = pts
                frame.time_base = time_base
                return frame

# ==============================================================================
# ASYNC WEBRTC MANAGER (Dedicated Background Event Loop)
# ==============================================================================
class AsyncWebRTCManager:
    """Manages WebRTC PeerConnections on a dedicated, persistent asyncio loop."""
    def __init__(self, companion_ref):
        self.companion = companion_ref
        self.loop = asyncio.new_event_loop()
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        self.pcs: Set[Any] = set()
        self.active_channel: Optional[Any] = None
        self.fps = 30
        self.scale = 0.75

    def _run_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_forever()

    def create_answer(self, sdp: str, sdp_type: str = "offer") -> Dict[str, Any]:
        """Synchronously schedule create_answer on the persistent loop."""
        future = asyncio.run_coroutine_threadsafe(
            self._async_create_answer(sdp, sdp_type),
            self.loop
        )
        return future.result(timeout=15)

    async def _async_create_answer(self, sdp: str, sdp_type: str) -> Dict[str, Any]:
        if not HAS_WEBRTC:
            return {"error": "aiortc not installed"}

        pc = RTCPeerConnection()
        self.pcs.add(pc)

        # 1. Add Desktop Video Track
        track = DesktopVideoStreamTrack(fps=self.fps, scale=self.scale)
        pc.addTrack(track)

        # 2. Setup DataChannel listener for ultra-low latency inputs
        @pc.on("datachannel")
        def on_datachannel(channel):
            logger.info(f"[WebRTC] DataChannel '{channel.label}' established with Android client.")
            self.active_channel = channel

            @channel.on("message")
            def on_message(message):
                try:
                    data = json.loads(message)
                    self.companion.handle_command(data)
                except Exception as ex:
                    logger.error(f"Error handling DataChannel message: {ex}")

        # 3. Connection state monitoring
        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            logger.info(f"[WebRTC] Connection state: {pc.connectionState}")
            if pc.connectionState == "connected":
                print()
                print("=" * 65)
                print(" [SCREEN SHARING ACTIVE] Mirroring Windows Desktop via WebRTC P2P")
                print(f" Target Display: {self.companion.screen_width}x{self.companion.screen_height} @ {self.fps} FPS")
                print("=" * 65)
            elif pc.connectionState in ["failed", "closed"]:
                logger.info("[WebRTC] Peer connection terminated.")
                await pc.close()
                self.pcs.discard(pc)

        # 4. Set remote offer & create answer
        offer = RTCSessionDescription(sdp=sdp, type=sdp_type)
        await pc.setRemoteDescription(offer)
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        # 5. Vanilla ICE: Gather local LAN host candidates directly into SDP
        for _ in range(15):
            if pc.iceGatheringState == "complete":
                break
            await asyncio.sleep(0.1)

        logger.info("[WebRTC] SDP Answer generated with local LAN host ICE candidates.")
        return {
            "type": "webrtc_answer",
            "sdp": pc.localDescription.sdp
        }

    def add_ice_candidate(self, candidate_dict: dict):
        """Schedule adding an incoming ICE candidate."""
        if not HAS_WEBRTC:
            return
        asyncio.run_coroutine_threadsafe(
            self._async_add_ice(candidate_dict),
            self.loop
        )

    async def _async_add_ice(self, candidate_dict: dict):
        for pc in list(self.pcs):
            try:
                candidate = candidate_dict.get("candidate", "")
                sdp_mid = candidate_dict.get("sdpMid")
                sdp_mline_index = candidate_dict.get("sdpMLineIndex")
                if candidate:
                    parts = candidate.split()
                    if len(parts) >= 8:
                        c = RTCIceCandidate(
                            component=int(parts[1]),
                            foundation=parts[0],
                            ip=parts[4],
                            port=int(parts[5]),
                            priority=int(parts[3]),
                            protocol=parts[2],
                            type=parts[7],
                            sdpMid=sdp_mid,
                            sdpMLineIndex=sdp_mline_index
                        )
                        await pc.addIceCandidate(c)
            except Exception as e:
                logger.warning(f"Failed to add ICE candidate: {e}")

# ==============================================================================
# DUAL STREAM SERVER (WebRTC Signaling, HTTP MJPEG, and Static Dashboard)
# ==============================================================================
class DualStreamServer:
    """Provides WebRTC signaling, MJPEG video streaming, and local web serving."""
    def __init__(self, host: str, port: int, auth_token: str, companion_ref, stream_token: Optional[str] = None):
        self.host = host
        self.port = port
        self.auth_token = auth_token.strip()
        self.stream_token = (stream_token or auth_token).strip()
        self.companion = companion_ref
        self.is_streaming = False
        self.quality = 65
        self.scale = 0.75
        self.target_fps = 30
        self.server: Optional[HTTPServer] = None
        self.thread: Optional[threading.Thread] = None
        self.screen_width, self.screen_height = pyautogui.size()
        self.webrtc_mgr = AsyncWebRTCManager(companion_ref)

    def verify_token(self, candidate: Optional[str]) -> bool:
        """Verify token in constant time, accepting either auth_token or stream_token."""
        if not candidate:
            return False
        cand = unquote(str(candidate)).strip()
        for expected in (self.stream_token, self.auth_token):
            if expected and hmac.compare_digest(cand, expected):
                return True
        return False

    def start(self):
        parent = self

        class StreamHandler(BaseHTTPRequestHandler):
            def log_message(self, format, *args):
                pass  # Suppress noisy HTTP logs

            def send_cors_headers(self):
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Auth-Token")

            def do_OPTIONS(self):
                self.send_response(204)
                self.send_cors_headers()
                self.end_headers()

            def extract_token(self) -> str:
                """Extract token from query parameters (?token= or ?auth_token=) or headers."""
                parsed = urlparse(self.path)
                params = parse_qs(parsed.query)
                token = params.get("token", [""])[0] or params.get("auth_token", [""])[0]
                if token:
                    return unquote(token).strip()

                auth_hdr = self.headers.get("Authorization", "").strip()
                if auth_hdr.lower().startswith("bearer "):
                    return auth_hdr[7:].strip()
                elif auth_hdr:
                    return auth_hdr

                x_token = self.headers.get("X-Auth-Token", "").strip()
                if x_token:
                    return x_token
                return ""

            def do_GET(self):
                parsed = urlparse(self.path)
                token = self.extract_token()

                # 1. Status diagnostic endpoint
                if parsed.path == "/status":
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_cors_headers()
                    self.end_headers()
                    status = {
                        "streaming": parent.is_streaming,
                        "webrtc_available": HAS_WEBRTC,
                        "authenticated": parent.verify_token(token),
                        "width": parent.screen_width,
                        "height": parent.screen_height,
                        "fps": parent.target_fps,
                        "quality": parent.quality,
                        "local_ips": get_local_ip_addresses()
                    }
                    self.wfile.write(json.dumps(status).encode("utf-8"))
                    return

                # 2. Local Web Player / Landing Page
                if parsed.path in ("/", "/index.html"):
                    is_authed = parent.verify_token(token)
                    self.send_response(200)
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                    self.send_cors_headers()
                    self.end_headers()
                    auth_badge = '<span style="color:#34d399;font-weight:600;">Authenticated</span>' if is_authed else '<span style="color:#fbbf24;font-weight:600;">Authentication Required</span>'
                    stream_section = f'''
                    <div style="margin-top:16px;background:#000;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);text-align:center;">
                        <img src="/stream?token={token}" alt="Desktop Stream" style="max-width:100%;height:auto;display:block;" />
                    </div>
                    ''' if is_authed else f'''
                    <form method="GET" action="/" style="margin-top:16px;">
                        <p style="font-size:12px;color:#a1a1aa;margin-bottom:8px;">Enter token from config.json to preview desktop stream:</p>
                        <div style="display:flex;gap:8px;">
                            <input type="password" name="token" placeholder="Enter auth_token" required style="flex:1;background:#18181c;border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:8px 12px;color:#fff;font-family:monospace;font-size:13px;" />
                            <button type="submit" style="background:#0284c7;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">View Stream</button>
                        </div>
                    </form>
                    '''
                    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>SHP Remote — Companion Stream Console</title>
</head>
<body style="background:#09090b;color:#fafafa;font-family:-apple-system,system-ui,sans-serif;margin:0;padding:24px;display:flex;align-items:center;justify-content:center;min-height:100vh;box-sizing:border-box;">
    <div style="background:#121215;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;max-width:640px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
        <h1 style="font-size:18px;margin:0 0 10px 0;color:#38bdf8;">SHP Remote Stream Server</h1>
        <p style="font-size:13px;color:#a1a1aa;line-height:1.5;margin:0 0 12px 0;">Windows 11 Companion Stream Server on port {parent.port}. Resolution: <strong>{parent.screen_width}x{parent.screen_height}</strong>.</p>
        <p style="font-size:12px;color:#71717a;margin:0;">Status: {auth_badge}</p>
        {stream_section}
    </div>
</body>
</html>"""
                    self.wfile.write(html.encode("utf-8"))
                    return

                # 3. Stream verification and delivery
                if parsed.path == "/stream":
                    if not parent.verify_token(token):
                        self.send_response(401)
                        self.send_header("Content-Type", "application/json")
                        self.send_cors_headers()
                        self.end_headers()
                        err_resp = {
                            "error": "Unauthorized. Invalid streaming token.",
                            "hint": "Pass ?token=<your_token> in the URL or Authorization: Bearer <token> header. Ensure it matches 'auth_token' in config.json.",
                            "token_received": bool(token)
                        }
                        self.wfile.write(json.dumps(err_resp).encode("utf-8"))
                        return

                    parent.is_streaming = True
                    print()
                    print("=" * 65)
                    print(" [SCREEN SHARING ACTIVE] Mirroring Windows Desktop via MJPEG")
                    print(f" Resolution: {parent.screen_width}x{parent.screen_height} @ {parent.target_fps} FPS")
                    print("=" * 65)

                    self.send_response(200)
                    self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
                    self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                    self.send_header("Pragma", "no-cache")
                    self.send_header("Expires", "0")
                    self.send_cors_headers()
                    self.end_headers()

                    sct = mss.mss() if HAS_MSS else None
                    monitor = sct.monitors[1] if sct else None

                    try:
                        while parent.is_streaming:
                            t_start = time.time()
                            if sct and monitor:
                                sct_img = sct.grab(monitor)
                                img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
                            else:
                                img = pyautogui.screenshot()

                            if parent.scale != 1.0:
                                new_w = int(img.width * parent.scale)
                                new_h = int(img.height * parent.scale)
                                img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)

                            buf = io.BytesIO()
                            img.save(buf, format="JPEG", quality=parent.quality, optimize=True)
                            frame_data = buf.getvalue()

                            header = (
                                b"--frame\r\n"
                                b"Content-Type: image/jpeg\r\n"
                                b"Content-Length: " + str(len(frame_data)).encode() + b"\r\n\r\n"
                            )
                            self.wfile.write(header + frame_data + b"\r\n")
                            self.wfile.flush()

                            elapsed = time.time() - t_start
                            sleep_time = max(0.001, (1.0 / parent.target_fps) - elapsed)
                            time.sleep(sleep_time)

                    except (BrokenPipeError, ConnectionResetError):
                        pass
                    finally:
                        parent.is_streaming = False
                        logger.info("Screen stream client disconnected.")
                    return

                self.send_response(404)
                self.end_headers()

            def do_POST(self):
                parsed = urlparse(self.path)
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"

                try:
                    data = json.loads(body)
                except Exception:
                    data = {}

                token = data.get("token") or self.extract_token()

                # 1. Direct WebRTC Offer
                if parsed.path == "/offer" and HAS_WEBRTC:
                    if not parent.verify_token(token):
                        self.send_response(401)
                        self.send_header("Content-Type", "application/json")
                        self.send_cors_headers()
                        self.end_headers()
                        self.wfile.write(b'{"error":"Unauthorized. Invalid streaming token."}')
                        return

                    sdp = data.get("sdp")
                    sdp_type = data.get("type", "offer")
                    if not sdp:
                        self.send_response(400)
                        self.send_cors_headers()
                        self.end_headers()
                        return

                    try:
                        answer_data = parent.webrtc_mgr.create_answer(sdp, sdp_type)
                        self.send_response(200)
                        self.send_header("Content-Type", "application/json")
                        self.send_cors_headers()
                        self.end_headers()
                        self.wfile.write(json.dumps(answer_data).encode("utf-8"))
                    except Exception as e:
                        logger.error(f"Error handling WebRTC offer: {e}")
                        self.send_response(500)
                        self.send_cors_headers()
                        self.end_headers()
                        self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
                    return

                # 2. Direct WebRTC ICE Candidate
                if parsed.path == "/ice" and HAS_WEBRTC:
                    candidate = data.get("candidate")
                    if candidate:
                        parent.webrtc_mgr.add_ice_candidate(candidate)
                    self.send_response(200)
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(b'{"status":"ok"}')
                    return

                # 3. Stop Stream
                if parsed.path == "/stop":
                    parent.is_streaming = False
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(b'{"status":"stopped"}')
                    return

                self.send_response(404)
                self.end_headers()

        try:
            self.server = HTTPServer((self.host, self.port), StreamHandler)
            self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
            self.thread.start()
            logger.info(f"Screen Stream Server listening on http://{self.host}:{self.port}")
            if HAS_WEBRTC:
                logger.info("WebRTC Engine: ACTIVE (aiortc with background event loop)")
            else:
                logger.info("WebRTC Engine: INACTIVE (aiortc not detected; MJPEG streaming active)")
        except Exception as e:
            logger.error(f"Failed to start Stream Server on port {self.port}: {e}")

    def stop(self):
        self.is_streaming = False
        if self.server:
            self.server.shutdown()

# ==============================================================================
# MAIN WINDOWS 11 COMPANION CLIENT
# ==============================================================================
class SHPCompanion:
    def __init__(self, config_path: str = "config.json"):
        self.config = self.load_config(config_path)
        self.esp32_ip = self.config.get("esp32_ip", "172.16.27.92")
        self.ws_port = self.config.get("ws_port", 81)
        # Resolve tokens cleanly from config.json with key fallbacks
        self.auth_token = str(
            self.config.get("auth_token")
            or self.config.get("authToken")
            or self.config.get("token")
            or "SHP_SECRET_TOKEN_2026"
        ).strip()
        self.stream_token = str(
            self.config.get("stream_token")
            or self.config.get("streamToken")
            or self.auth_token
        ).strip()
        self.stream_port = int(self.config.get("stream_port", 8082))
        self.reconnect_interval = self.config.get("reconnect_interval_sec", 3)
        self.mouse_speed_multiplier = self.config.get("mouse_speed_multiplier", 1.0)
        self.allow_destructive_power = self.config.get("allow_destructive_power", False)

        self.ws: Optional[websocket.WebSocketApp] = None
        self.is_authenticated = False
        self.running = True
        self.held_keys: Set[str] = set()
        self.held_mouse_buttons: Set[str] = set()

        self.screen_width, self.screen_height = pyautogui.size()
        logger.info(f"Detected Windows 11 Primary Display: {self.screen_width}x{self.screen_height}")

        # Start dual stream server with both auth and stream tokens supported
        self.stream_server = DualStreamServer("0.0.0.0", self.stream_port, self.auth_token, self, self.stream_token)
        self.stream_server.start()

        # Application Launch Allowlist
        self.app_allowlist: Dict[str, list] = {
            "browser": ["start", "chrome"],
            "explorer": ["explorer"],
            "vscode": ["code"],
            "notepad": ["notepad"],
            "calc": ["calc"],
            "settings": ["start", "ms-settings:"],
            "terminal": ["wt"],
        }

    def load_config(self, path: str) -> dict:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error reading {path}: {e}")
        return {}

    def run(self):
        url = f"ws://{self.esp32_ip}:{self.ws_port}/"
        logger.info(f"Initiating connection to ESP32 Gateway: {url}")

        while self.running:
            try:
                self.ws = websocket.WebSocketApp(
                    url,
                    on_open=self.on_open,
                    on_message=self.on_message,
                    on_error=self.on_error,
                    on_close=self.on_close,
                )
                self.ws.run_forever(ping_interval=10, ping_timeout=5)
            except Exception as ex:
                logger.error(f"WebSocket execution error: {ex}")

            if self.running:
                logger.info(f"Retrying connection to ESP32 in {self.reconnect_interval}s...")
                time.sleep(self.reconnect_interval)

    def on_open(self, ws):
        logger.info("[WS] Connected to ESP32 Gateway. Sending authentication...")
        auth_payload = {
            "type": "auth",
            "role": "companion",
            "token": self.auth_token,
            "clientInfo": "Windows 11 Companion v2.6 (WebRTC & DataChannel)",
            "desktopWidth": self.screen_width,
            "desktopHeight": self.screen_height,
        }
        ws.send(json.dumps(auth_payload))

    def on_message(self, ws, message):
        try:
            data = json.loads(message)
        except Exception as e:
            logger.warning(f"Malformed JSON packet: {e}")
            return

        msg_type = data.get("type")
        if not msg_type:
            return

        if msg_type == "auth_response":
            if data.get("success"):
                self.is_authenticated = True
                logger.info("[AUTH] Authentication approved by ESP32 Gateway.")
            else:
                logger.error(f"[AUTH] Authentication rejected: {data.get('message')}")
                self.ws.close()
            return

        if not self.is_authenticated:
            logger.warning("Dropped command received before authentication.")
            return

        self.handle_command(data)

    def handle_command(self, data: dict):
        cmd = data.get("type")

        # 1. Absolute Mouse Positioning (Direct Touch Mapping)
        if cmd == "mouse_abs":
            x = data.get("x", 0)
            y = data.get("y", 0)
            in_w = data.get("screenWidth", self.screen_width)
            in_h = data.get("screenHeight", self.screen_height)

            target_x = int((x / in_w) * self.screen_width)
            target_y = int((y / in_h) * self.screen_height)
            target_x = max(0, min(self.screen_width - 1, target_x))
            target_y = max(0, min(self.screen_height - 1, target_y))
            pyautogui.moveTo(target_x, target_y)

        # 2. Relative Mouse Movement
        elif cmd == "mouse_move":
            dx = int(data.get("dx", 0) * self.mouse_speed_multiplier)
            dy = int(data.get("dy", 0) * self.mouse_speed_multiplier)
            if dx != 0 or dy != 0:
                pyautogui.moveRel(dx, dy)

        # 3. Mouse Click
        elif cmd == "mouse_click":
            btn = data.get("button", "left")
            double = data.get("double", False)
            x = data.get("x")
            y = data.get("y")
            if x is not None and y is not None:
                pyautogui.moveTo(int(x), int(y))
            clicks = 2 if double else 1
            pyautogui.click(button=btn, clicks=clicks)

        # 4. Mouse Down (Drag Start)
        elif cmd == "mouse_down":
            btn = data.get("button", "left")
            x = data.get("x")
            y = data.get("y")
            if x is not None and y is not None:
                pyautogui.moveTo(int(x), int(y))
            pyautogui.mouseDown(button=btn)
            self.held_mouse_buttons.add(btn)

        # 5. Mouse Up (Drag End)
        elif cmd == "mouse_up":
            btn = data.get("button", "left")
            pyautogui.mouseUp(button=btn)
            self.held_mouse_buttons.discard(btn)

        # 6. Mouse Scroll
        elif cmd == "mouse_scroll":
            dy = data.get("dy", 0)
            pyautogui.scroll(int(dy * 120))

        # 7. Keyboard Key Click
        elif cmd == "key":
            key_name = data.get("key", "").lower()
            key_map = {
                "enter": "enter",
                "backspace": "backspace",
                "tab": "tab",
                "escape": "esc",
                "space": "space",
                "up": "up",
                "down": "down",
                "left": "left",
                "right": "right",
            }
            target = key_map.get(key_name, key_name)
            try:
                pyautogui.press(target)
            except Exception as e:
                logger.error(f"Error pressing key {target}: {e}")

        # 8. Key Down / Up (Latch Modifiers)
        elif cmd == "key_down":
            key_name = data.get("key", "").lower()
            pyautogui.keyDown(key_name)
            self.held_keys.add(key_name)

        elif cmd == "key_up":
            key_name = data.get("key", "").lower()
            pyautogui.keyUp(key_name)
            self.held_keys.discard(key_name)

        # 9. Unicode Text Stream
        elif cmd == "text":
            text_str = data.get("text", "")
            if text_str:
                pyautogui.write(text_str)

        # 10. Multimedia Win32 Keys
        elif cmd == "media":
            action = data.get("action")
            action_map = {
                "volumeup": VK_VOLUME_UP,
                "volumedown": VK_VOLUME_DOWN,
                "mute": VK_VOLUME_MUTE,
                "playpause": VK_MEDIA_PLAY_PAUSE,
                "next": VK_MEDIA_NEXT_TRACK,
                "prev": VK_MEDIA_PREV_TRACK,
                "stop": VK_MEDIA_STOP,
            }
            if action in action_map:
                press_win32_media_key(action_map[action])

        # 11. Windows Hotkeys
        elif cmd == "shortcut":
            combo = data.get("combination")
            if combo == "alt_tab":
                pyautogui.hotkey("alt", "tab")
            elif combo == "win_d":
                pyautogui.hotkey("win", "d")
            elif combo == "win_e":
                pyautogui.hotkey("win", "e")
            elif combo == "win_r":
                pyautogui.hotkey("win", "r")
            elif combo == "ctrl_shift_esc":
                pyautogui.hotkey("ctrl", "shift", "esc")
            elif combo == "ctrl_c":
                pyautogui.hotkey("ctrl", "c")
            elif combo == "ctrl_v":
                pyautogui.hotkey("ctrl", "v")
            elif combo == "ctrl_z":
                pyautogui.hotkey("ctrl", "z")
            elif combo == "win_l":
                ctypes.windll.user32.LockWorkStation()

        # 12. Application Launcher
        elif cmd == "launch_app":
            app_id = data.get("appId")
            if app_id in self.app_allowlist:
                os.system(" ".join(self.app_allowlist[app_id]))

        # 13. Power Actions
        elif cmd == "power":
            action = data.get("action")
            confirmed = data.get("confirmed", False)
            if action == "lock":
                ctypes.windll.user32.LockWorkStation()
            elif action == "sleep":
                os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
            elif action == "restart" and confirmed and self.allow_destructive_power:
                os.system("shutdown /r /t 0")
            elif action == "shutdown" and confirmed and self.allow_destructive_power:
                os.system("shutdown /s /t 0")

        # 14. Emergency Release of Held Keys/Buttons
        elif cmd == "emergency_release":
            self.emergency_release()

        # 15. WebRTC SDP Offer Relayed via ESP32 WebSocket
        elif cmd == "webrtc_offer" and HAS_WEBRTC:
            sdp = data.get("sdp")
            try:
                answer = self.stream_server.webrtc_mgr.create_answer(sdp)
                self.ws.send(json.dumps(answer))
                logger.info("[WebRTC] Sent SDP Answer via ESP32 WebSocket relay.")
            except Exception as e:
                logger.error(f"Error handling WebRTC offer via WS: {e}")

        # 16. WebRTC ICE Candidate Relayed via ESP32 WebSocket
        elif cmd == "webrtc_ice" and HAS_WEBRTC:
            candidate = data.get("candidate")
            if candidate:
                self.stream_server.webrtc_mgr.add_ice_candidate(candidate)

        # 17. Stream Configuration Request
        elif cmd == "stream_request":
            action = data.get("action")
            if action == "quality":
                q_map = {"low": 40, "med": 65, "high": 80, "ultra": 92}
                s_map = {"low": 0.5, "med": 0.7, "high": 0.85, "ultra": 1.0}
                q_key = data.get("quality", "med")
                self.stream_server.quality = q_map.get(q_key, 65)
                self.stream_server.scale = s_map.get(q_key, 0.7)
                self.stream_server.target_fps = int(data.get("fps", 30))
                self.stream_server.webrtc_mgr.fps = self.stream_server.target_fps
                self.stream_server.webrtc_mgr.scale = self.stream_server.scale
                logger.info(f"Stream parameters updated: Quality={self.stream_server.quality}, Scale={self.stream_server.scale}, FPS={self.stream_server.target_fps}")
            elif action == "stop":
                self.stream_server.is_streaming = False
                logger.info("Screen sharing stopped via remote request.")

    def emergency_release(self):
        """Release all latched keys and mouse buttons."""
        for key in list(self.held_keys):
            try:
                pyautogui.keyUp(key)
            except Exception:
                pass
        self.held_keys.clear()

        for btn in list(self.held_mouse_buttons):
            try:
                pyautogui.mouseUp(button=btn)
            except Exception:
                pass
        self.held_mouse_buttons.clear()
        logger.info("Emergency release completed.")

    def on_error(self, ws, error):
        logger.error(f"[WS] Error: {error}")

    def on_close(self, ws, close_status_code, close_msg):
        self.is_authenticated = False
        logger.warning(f"[WS] Disconnected from ESP32 (Code: {close_status_code}, Msg: {close_msg})")
        self.emergency_release()

if __name__ == "__main__":
    companion = SHPCompanion()
    local_ips = get_local_ip_addresses()
    primary_ip = local_ips[0] if local_ips else "127.0.0.1"
    port = companion.stream_port
    token = companion.stream_token

    print()
    print("==================================================================")
    print("  SHP REMOTE — WINDOWS 11 COMPANION & WEBRTC DESKTOP STREAMER     ")
    print("==================================================================")
    print(f" [Network] Detected Local LAN IP(s): {', '.join(local_ips)}")
    print(f" [Web Server] http://{primary_ip}:{port}/?token={token}")
    print(f" [Stream MJPEG] http://{primary_ip}:{port}/stream?token={token}")
    print(f" [WebRTC P2P] aiortc VideoTrack & DataChannel Active: {HAS_WEBRTC}")
    print("------------------------------------------------------------------")
    print(" [Windows Firewall Notice]")
    print(f" If mobile devices cannot connect, allow port {port} in PowerShell:")
    print(f'   netsh advfirewall firewall add rule name="SHP Remote Stream" dir=in action=allow protocol=TCP localport={port}')
    print("==================================================================")
    print()

    try:
        companion.run()
    except KeyboardInterrupt:
        print("\nTerminating SHP Companion...")
        companion.emergency_release()
        companion.stream_server.stop()
        sys.exit(0)
