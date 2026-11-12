import JSZip from 'jszip';
import { RemoteConfig } from '../types/remote';
import { getEsp32FirmwareCode } from './firmwareCode';
import {
  getPythonCompanionCode,
  getPythonConfigFile,
  getPythonRequirements,
  getPythonReadme,
} from './pythonCompanionCode';
import {
  getStandaloneDashboardHtml,
  getStandaloneDashboardCss,
  getStandaloneDashboardJs,
} from './dashboardCode';
import {
  getSystemArchitectureDoc,
  getWiringGuideDoc,
  getInstallationGuideDoc,
  getRootReadmeDoc,
} from './docsContent';

export async function generateProjectZip(config: RemoteConfig): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder('SHP-REMOTE') || zip;

  // 1. ESP32 Firmware
  const espFolder = root.folder('esp32-firmware');
  espFolder?.file('SHP_REMOTE.ino', getEsp32FirmwareCode(config));

  // 2. Windows Companion
  const winFolder = root.folder('windows-companion');
  winFolder?.file('remote_companion.py', getPythonCompanionCode(config));
  winFolder?.file('requirements.txt', getPythonRequirements());
  winFolder?.file('config.json', getPythonConfigFile(config));
  winFolder?.file('README.md', getPythonReadme(config));

  // 3. Standalone Dashboard
  const dashFolder = root.folder('dashboard');
  dashFolder?.file('index.html', getStandaloneDashboardHtml(config));
  dashFolder?.file('style.css', getStandaloneDashboardCss());
  dashFolder?.file('app.js', getStandaloneDashboardJs(config));

  // 4. Docs
  const docsFolder = root.folder('docs');
  docsFolder?.file('system-architecture.md', getSystemArchitectureDoc(config));
  docsFolder?.file('wiring-guide.md', getWiringGuideDoc());
  docsFolder?.file('installation-guide.md', getInstallationGuideDoc(config));

  // 5. Root README
  root.file('README.md', getRootReadmeDoc(config));

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
