/**
 * SHP REMOTE - Protocol & Types
 * Synchronized communication specification across ESP32 (Station Mode),
 * Python Companion (WebRTC/MJPEG), and Browser UI.
 */

export interface RemoteConfig {
  ssid: string;              // Home Wi-Fi Router SSID
  wifiPassword: string;      // Home Wi-Fi Router Password
  esp32Ip: string;           // ESP32 IP on Home Wi-Fi (assigned by DHCP)
  apIp?: string;             // Backward-compatibility alias for esp32Ip
  httpPort: number;
  wsPort: number;
  authToken: string;
  streamToken?: string;      // Optional dedicated token for PC streaming (defaults to authToken)
  mouseSensitivity: number;
  scrollSensitivity: number;
  invertScroll: boolean;
  hapticFeedback: boolean;
  // Remote Desktop streaming configuration
  streamHost: string;        // Windows Laptop IP on Home Wi-Fi
  streamPort: number;
  streamQuality: 'low' | 'med' | 'high' | 'ultra';
  streamFps: number;
  // WebRTC configuration
  webrtcEnabled: boolean;
  webrtcStunServer: string;
  useHttpsStream?: boolean;
}

export const DEFAULT_CONFIG: RemoteConfig = {
  ssid: 'H202',
  wifiPassword: 'floor@202',
  esp32Ip: '172.16.27.92',
  apIp: '172.16.27.92',
  httpPort: 80,
  wsPort: 81,
  authToken: 'SHP_SECRET_TOKEN_2026',
  streamToken: 'SHP_SECRET_TOKEN_2026',
  mouseSensitivity: 1.5,
  scrollSensitivity: 1.0,
  invertScroll: false,
  hapticFeedback: true,
  // Direct PC streaming settings (Windows laptop IP on home network)
  streamHost: '172.16.22.123',
  streamPort: 8082,
  streamQuality: 'med',
  streamFps: 30,
  webrtcEnabled: true,
  webrtcStunServer: 'stun:stun.l.google.com:19302',
  useHttpsStream: false,
};

// Protocol message types
export type MessageType =
  | 'auth'
  | 'auth_response'
  | 'status'
  | 'ping'
  | 'pong'
  | 'mouse_move'
  | 'mouse_abs'
  | 'mouse_click'
  | 'mouse_down'
  | 'mouse_up'
  | 'mouse_scroll'
  | 'key'
  | 'key_down'
  | 'key_up'
  | 'text'
  | 'media'
  | 'shortcut'
  | 'launch_app'
  | 'power'
  | 'emergency_release'
  | 'stream_request'
  | 'stream_status'
  | 'webrtc_offer'
  | 'webrtc_answer'
  | 'webrtc_ice'
  | 'webrtc_status';

export interface BaseMessage {
  type: MessageType;
  timestamp?: number;
}

export interface AuthMessage extends BaseMessage {
  type: 'auth';
  role: 'ui' | 'companion';
  token: string;
  clientInfo?: string;
}

export interface AuthResponseMessage extends BaseMessage {
  type: 'auth_response';
  success: boolean;
  message: string;
  role: 'ui' | 'companion';
}

export interface StatusMessage extends BaseMessage {
  type: 'status';
  uiConnected: boolean;
  companionConnected: boolean;
  companionAuthenticated: boolean;
  uiAuthenticated: boolean;
  uptimeSeconds?: number;
  freeHeap?: number;
  ssid?: string;
  esp32Ip?: string;
  apIp?: string;
  desktopWidth?: number;
  desktopHeight?: number;
  streamingActive?: boolean;
}

export interface MouseMoveMessage extends BaseMessage {
  type: 'mouse_move';
  dx: number;
  dy: number;
}

export interface MouseAbsMessage extends BaseMessage {
  type: 'mouse_abs';
  x: number;
  y: number;
  screenWidth?: number;
  screenHeight?: number;
}

export interface MouseClickMessage extends BaseMessage {
  type: 'mouse_click';
  button: 'left' | 'right' | 'middle';
  double?: boolean;
  x?: number;
  y?: number;
}

export interface MouseDownMessage extends BaseMessage {
  type: 'mouse_down';
  button: 'left' | 'right' | 'middle';
  x?: number;
  y?: number;
}

export interface MouseUpMessage extends BaseMessage {
  type: 'mouse_up';
  button: 'left' | 'right' | 'middle';
  x?: number;
  y?: number;
}

export interface MouseScrollMessage extends BaseMessage {
  type: 'mouse_scroll';
  dx?: number;
  dy: number;
}

export interface KeyMessage extends BaseMessage {
  type: 'key';
  key: string;
}

export interface KeyDownMessage extends BaseMessage {
  type: 'key_down';
  key: string;
}

export interface KeyUpMessage extends BaseMessage {
  type: 'key_up';
  key: string;
}

export interface TextMessage extends BaseMessage {
  type: 'text';
  text: string;
}

export interface MediaMessage extends BaseMessage {
  type: 'media';
  action: 'playpause' | 'next' | 'prev' | 'volumeup' | 'volumedown' | 'mute' | 'stop';
  value?: number;
}

export interface ShortcutMessage extends BaseMessage {
  type: 'shortcut';
  combination:
    | 'alt_tab'
    | 'win_d'
    | 'win_e'
    | 'win_r'
    | 'ctrl_c'
    | 'ctrl_v'
    | 'ctrl_z'
    | 'ctrl_shift_esc'
    | 'win_l';
}

export interface LaunchAppMessage extends BaseMessage {
  type: 'launch_app';
  appId: 'browser' | 'explorer' | 'vscode' | 'notepad' | 'calc' | 'settings' | 'terminal';
}

export interface PowerMessage extends BaseMessage {
  type: 'power';
  action: 'lock' | 'sleep' | 'restart' | 'shutdown';
  confirmed: boolean;
}

export interface EmergencyReleaseMessage extends BaseMessage {
  type: 'emergency_release';
}

export interface StreamRequestMessage extends BaseMessage {
  type: 'stream_request';
  action: 'start' | 'stop' | 'quality';
  quality?: 'low' | 'med' | 'high' | 'ultra';
  fps?: number;
  scale?: number;
  protocol?: 'webrtc' | 'mjpeg';
}

export interface WebRtcOfferMessage extends BaseMessage {
  type: 'webrtc_offer';
  sdp: string;
}

export interface WebRtcAnswerMessage extends BaseMessage {
  type: 'webrtc_answer';
  sdp: string;
}

export interface WebRtcIceMessage extends BaseMessage {
  type: 'webrtc_ice';
  candidate: any;
}

export interface WebRtcStatusMessage extends BaseMessage {
  type: 'webrtc_status';
  state: 'connecting' | 'connected' | 'disconnected' | 'failed';
  error?: string;
}

export type OutgoingMessage =
  | AuthMessage
  | MouseMoveMessage
  | MouseAbsMessage
  | MouseClickMessage
  | MouseDownMessage
  | MouseUpMessage
  | MouseScrollMessage
  | KeyMessage
  | KeyDownMessage
  | KeyUpMessage
  | TextMessage
  | MediaMessage
  | ShortcutMessage
  | LaunchAppMessage
  | PowerMessage
  | EmergencyReleaseMessage
  | StreamRequestMessage
  | WebRtcOfferMessage
  | WebRtcAnswerMessage
  | WebRtcIceMessage
  | { type: 'ping' };

export interface LogEntry {
  id: string;
  time: string;
  direction: 'out' | 'in';
  type: MessageType;
  payload: Record<string, unknown>;
  status?: 'ok' | 'warn' | 'error';
}
