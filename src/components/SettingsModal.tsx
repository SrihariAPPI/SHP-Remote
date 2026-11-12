import React, { useState } from 'react';
import { X, Sliders, RotateCcw, Check, Radio, Wifi, ShieldAlert, Info, Eye, EyeOff, Lock } from 'lucide-react';
import { RemoteConfig, DEFAULT_CONFIG } from '../types/remote';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RemoteConfig;
  onSaveConfig: (cfg: RemoteConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const [formData, setFormData] = useState<RemoteConfig>({
    ...config,
    esp32Ip: config.esp32Ip || config.apIp || '172.16.27.92',
    apIp: config.esp32Ip || config.apIp || '172.16.27.92',
    streamToken: config.streamToken || config.authToken || 'SHP_SECRET_TOKEN_2026',
  });

  if (!isOpen) return null;

  const handleChange = (field: keyof RemoteConfig, value: unknown) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'esp32Ip') updated.apIp = value as string;
      if (field === 'apIp') updated.esp32Ip = value as string;
      return updated;
    });
  };

  const handleSave = () => {
    // Persist in localStorage
    try {
      localStorage.setItem('shp_remote_config', JSON.stringify(formData));
    } catch (e) {
      // Ignore storage errors
    }
    onSaveConfig(formData);
    onClose();
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_CONFIG });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl bg-[#121215] border border-white/12 p-5 flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Network &amp; Hardware Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 text-xs font-mono">
          {/* Section 1: Home Wi-Fi Router Settings */}
          <div className="p-3 rounded-lg bg-[#18181c] border border-white/8 space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">
              <Wifi className="w-3.5 h-3.5 text-sky-400" />
              <span>Home Wi-Fi Network (Router)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-zinc-400 block mb-1">Wi-Fi SSID</label>
                <input
                  type="text"
                  value={formData.ssid}
                  onChange={(e) => handleChange('ssid', e.target.value)}
                  placeholder="e.g. Home-WiFi-5G"
                  className="w-full bg-[#121215] border border-white/10 focus:border-sky-500 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Wi-Fi Password</label>
                <input
                  type="text"
                  value={formData.wifiPassword}
                  onChange={(e) => handleChange('wifiPassword', e.target.value)}
                  placeholder="Router Password"
                  className="w-full bg-[#121215] border border-white/10 focus:border-sky-500 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 font-sans">
              Enter credentials your ESP32 and Windows 11 laptop connect to.
            </p>
          </div>

          {/* Section 2: IP Addresses on Home Network */}
          <div className="p-3 rounded-lg bg-[#18181c] border border-white/8 space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Assigned IP Addresses</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-zinc-400 block mb-1">ESP32 IP</label>
                <input
                  type="text"
                  value={formData.esp32Ip}
                  onChange={(e) => handleChange('esp32Ip', e.target.value)}
                  placeholder="e.g. 172.16.27.92"
                  className="w-full bg-[#121215] border border-white/10 focus:border-sky-500 rounded px-2.5 py-1.5 text-white outline-none font-semibold text-sky-400"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Laptop IP (Stream)</label>
                <input
                  type="text"
                  value={formData.streamHost}
                  onChange={(e) => handleChange('streamHost', e.target.value)}
                  placeholder="e.g. 172.16.22.123"
                  className="w-full bg-[#121215] border border-white/10 focus:border-sky-500 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Stream Port</label>
                <input
                  type="number"
                  value={formData.streamPort}
                  onChange={(e) => handleChange('streamPort', parseInt(e.target.value) || 8082)}
                  className="w-full bg-[#121215] border border-white/10 focus:border-sky-500 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-white/6">
              <div>
                <label className="text-zinc-400 block mb-1">Control WS Port</label>
                <input
                  type="number"
                  value={formData.wsPort}
                  onChange={(e) => handleChange('wsPort', parseInt(e.target.value) || 81)}
                  className="w-full bg-[#121215] border border-white/10 focus:border-sky-500 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400">ESP32 Auth Token</label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5"
                  >
                    {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showSecret ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={formData.authToken}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('authToken', val);
                    if (!formData.streamToken || formData.streamToken === formData.authToken) {
                      handleChange('streamToken', val);
                    }
                  }}
                  placeholder="SHP_SECRET_TOKEN_2026"
                  className="w-full bg-[#121215] border border-white/10 focus:border-sky-500 rounded px-2.5 py-1.5 text-sky-300 outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Streaming Token (PC)</label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={formData.streamToken || ''}
                  onChange={(e) => handleChange('streamToken', e.target.value)}
                  placeholder="Defaults to ESP32 Token"
                  className="w-full bg-[#121215] border border-white/10 focus:border-sky-500 rounded px-2.5 py-1.5 text-sky-300 outline-none font-mono placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Router DHCP Reservation Tip */}
            <div className="p-2 rounded bg-black/30 border border-white/6 text-[10px] text-zinc-400 font-sans leading-relaxed">
              <strong className="text-zinc-300 font-mono">Router DHCP Static Lease Tip:</strong> To keep your ESP32 IP permanent, open your home router admin page (e.g. <code className="text-zinc-200">172.16.0.1</code>), find <em>DHCP Static Leases</em>, and bind the ESP32 MAC address to <code className="text-sky-300">{formData.esp32Ip}</code>.
            </div>
          </div>

          {/* Section 3: WebRTC & Video Settings */}
          <div className="p-3 rounded-lg bg-[#18181c] border border-white/8 space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">
              <span>WebRTC &amp; Input Controls</span>
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">STUN Discovery Server</label>
              <input
                type="text"
                value={formData.webrtcStunServer}
                onChange={(e) => handleChange('webrtcStunServer', e.target.value)}
                placeholder="stun:stun.l.google.com:19302"
                className="w-full bg-[#121215] border border-white/10 focus:border-sky-500 rounded px-2.5 py-1.5 text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
              <label className="flex items-center gap-2 p-2 rounded bg-[#121215] border border-white/8 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.invertScroll}
                  onChange={(e) => handleChange('invertScroll', e.target.checked)}
                  className="accent-sky-500 rounded"
                />
                <span className="text-xs text-zinc-300">Invert Scroll</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-[#121215] border border-white/8 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hapticFeedback}
                  onChange={(e) => handleChange('hapticFeedback', e.target.checked)}
                  className="accent-sky-500 rounded"
                />
                <span className="text-xs text-zinc-300">Haptics (Vibrate)</span>
              </label>
            </div>
          </div>

          {/* Section 4: Secure Network Architecture Guidance */}
          <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-500/20 text-xs font-sans text-zinc-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-sky-400">
              <Info className="w-4 h-4 shrink-0" />
              <span>Secure LAN &amp; HTTPS Architecture</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              When accessing via <code className="text-sky-300">https://shpremote.vercel.app</code>, modern browsers restrict unencrypted WebSocket/HTTP to private LAN IPs.
            </p>
            <ul className="text-[11px] text-zinc-300 list-disc list-inside space-y-1">
              <li><strong>WebRTC DataChannel (Recommended):</strong> WebRTC DTLS encryption operates natively on HTTPS without mixed-content restrictions.</li>
              <li><strong>Direct Local Dashboard:</strong> Browse directly to <a href={`http://${formData.esp32Ip}`} target="_blank" rel="noreferrer" className="underline text-sky-400 font-mono">http://{formData.esp32Ip}</a> or <code className="text-sky-300 font-mono">http://{formData.streamHost}:8082</code> (HTTP origin with zero mixed-content blocking).</li>
              <li><strong>Secure Tunnel / TLS:</strong> Configure Cloudflare Tunnel or local TLS proxy for seamless HTTPS-to-HTTPS access.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/8 font-mono text-xs shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-zinc-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply &amp; Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
