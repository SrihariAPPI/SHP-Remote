import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  FileText,
  Copy,
  Check,
  Download,
  Terminal,
  Cpu,
  Laptop,
  BookOpen,
} from 'lucide-react';
import { RemoteConfig } from '../types/remote';
import { getEsp32FirmwareCode } from '../services/firmwareCode';
import {
  getPythonCompanionCode,
  getPythonConfigFile,
  getPythonRequirements,
  getPythonReadme,
} from '../services/pythonCompanionCode';
import {
  getStandaloneDashboardHtml,
  getStandaloneDashboardCss,
  getStandaloneDashboardJs,
} from '../services/dashboardCode';
import {
  getSystemArchitectureDoc,
  getWiringGuideDoc,
  getInstallationGuideDoc,
  getRootReadmeDoc,
} from '../services/docsContent';
import { downloadBlob } from '../services/zipExport';

interface SourceCodeExplorerProps {
  config: RemoteConfig;
  onDownloadZip: () => void;
}

export const SourceCodeExplorer: React.FC<SourceCodeExplorerProps> = ({
  config,
  onDownloadZip,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('esp32-firmware/SHP_REMOTE.ino');
  const [copied, setCopied] = useState<boolean>(false);

  const files: Record<string, { content: string; language: string }> = {
    'esp32-firmware/SHP_REMOTE.ino': {
      content: getEsp32FirmwareCode(config),
      language: 'cpp',
    },
    'windows-companion/remote_companion.py': {
      content: getPythonCompanionCode(config),
      language: 'python',
    },
    'windows-companion/requirements.txt': {
      content: getPythonRequirements(),
      language: 'text',
    },
    'windows-companion/config.json': {
      content: getPythonConfigFile(config),
      language: 'json',
    },
    'windows-companion/README.md': {
      content: getPythonReadme(config),
      language: 'markdown',
    },
    'dashboard/index.html': {
      content: getStandaloneDashboardHtml(config),
      language: 'html',
    },
    'dashboard/style.css': {
      content: getStandaloneDashboardCss(),
      language: 'css',
    },
    'dashboard/app.js': {
      content: getStandaloneDashboardJs(config),
      language: 'javascript',
    },
    'docs/system-architecture.md': {
      content: getSystemArchitectureDoc(config),
      language: 'markdown',
    },
    'docs/wiring-guide.md': {
      content: getWiringGuideDoc(),
      language: 'markdown',
    },
    'docs/installation-guide.md': {
      content: getInstallationGuideDoc(config),
      language: 'markdown',
    },
    'README.md': {
      content: getRootReadmeDoc(config),
      language: 'markdown',
    },
  };

  const currentFileData = files[selectedFile] || files['README.md'];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFileData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    const filename = selectedFile.split('/').pop() || 'file.txt';
    const blob = new Blob([currentFileData.content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, filename);
  };

  const fileGroups = [
    {
      name: 'esp32-firmware',
      items: ['esp32-firmware/SHP_REMOTE.ino'],
    },
    {
      name: 'windows-companion',
      items: [
        'windows-companion/remote_companion.py',
        'windows-companion/requirements.txt',
        'windows-companion/config.json',
        'windows-companion/README.md',
      ],
    },
    {
      name: 'dashboard',
      items: [
        'dashboard/index.html',
        'dashboard/style.css',
        'dashboard/app.js',
      ],
    },
    {
      name: 'docs',
      items: [
        'docs/system-architecture.md',
        'docs/wiring-guide.md',
        'docs/installation-guide.md',
      ],
    },
    {
      name: 'root',
      items: ['README.md'],
    },
  ];

  const lineCount = currentFileData.content.split('\n').length;
  const byteSize = new Blob([currentFileData.content]).size;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-3">
      {/* File Tree Sidebar */}
      <div className="w-full lg:w-68 rounded-lg bg-[#121215] border border-white/8 p-3 flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between px-1 pb-2 border-b border-white/8">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-zinc-300">
            <Folder className="w-3.5 h-3.5 text-sky-400" />
            <span>Filesystem</span>
          </div>
          <button
            onClick={onDownloadZip}
            className="text-[11px] text-sky-400 hover:text-sky-300 font-mono font-semibold"
          >
            Export ZIP
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 text-xs font-mono">
          {fileGroups.map((group) => (
            <div key={group.name} className="flex flex-col gap-0.5">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider px-1.5 py-0.5">
                {group.name}
              </div>
              {group.items.map((item) => {
                const isSelected = selectedFile === item;
                const fileName = item.split('/').pop();
                return (
                  <button
                    key={item}
                    onClick={() => setSelectedFile(item)}
                    className={`px-2 py-1.5 rounded text-left transition-colors truncate ${
                      isSelected
                        ? 'bg-[#18181c] text-sky-300 font-semibold border border-sky-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]/50'
                    }`}
                  >
                    {fileName}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <button
          onClick={onDownloadZip}
          className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 font-mono"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download SHP-REMOTE.zip</span>
        </button>
      </div>

      {/* Code Viewer Panel */}
      <div className="flex-1 rounded-lg bg-[#09090b] border border-white/8 flex flex-col overflow-hidden min-h-[440px]">
        {/* Code Titlebar */}
        <div className="h-10 bg-[#121215] border-b border-white/8 px-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 font-mono">
            <span className="text-xs font-medium text-zinc-200 truncate">
              {selectedFile}
            </span>
            <span className="text-[11px] text-zinc-500 hidden sm:inline tabular-nums">
              · {lineCount} lines · {(byteSize / 1024).toFixed(1)} KB
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 font-mono">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-[#18181c] hover:bg-[#202025] text-zinc-300 text-xs transition-colors flex items-center gap-1.5 border border-white/8"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadSingleFile}
              className="px-2.5 py-1 rounded bg-[#18181c] hover:bg-[#202025] text-zinc-300 text-xs transition-colors flex items-center gap-1.5 border border-white/8"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-zinc-300">
          <pre className="selection:bg-sky-500/20">
            <code>{currentFileData.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
