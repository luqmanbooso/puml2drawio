import React, { useState } from 'react';
import { ThemeName } from '../core';
import { DIAGRAM_PRESETS } from '../presets';
import { 
  Layers, 
  Palette, 
  Copy, 
  Check, 
  Download, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  currentTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  xmlOutput: string;
  onSelectPreset: (code: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentTheme, 
  onThemeChange, 
  xmlOutput,
  onSelectPreset 
}) => {
  const [copied, setCopied] = useState(false);

  const themes: { id: ThemeName; label: string }[] = [
    { id: 'classic', label: 'Classic Light' },
    { id: 'dracula', label: 'Dracula Dark' },
    { id: 'aws', label: 'AWS Cloud' },
    { id: 'nord', label: 'Nord Ice' },
    { id: 'monochrome', label: 'Monochrome Blueprint' },
  ];

  const handleDownload = () => {
    if (!xmlOutput) return;
    const blob = new Blob([xmlOutput], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.drawio';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!xmlOutput) return;
    navigator.clipboard.writeText(xmlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDrawIo = () => {
    if (!xmlOutput) return;
    window.open('https://app.diagrams.net/#R' + encodeURIComponent(xmlOutput), '_blank');
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between z-20">
      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-100 via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              PlantUML ➔ Draw.io
            </span>
            <span className="text-[10px] uppercase font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full">
              Studio
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Native PlantUML to mxGraph Layout Engine</p>
        </div>
      </div>

      {/* Control Bar Actions */}
      <div className="flex items-center space-x-4">
        {/* Presets Picker */}
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-400 font-medium hidden md:inline">Presets:</span>
          <select
            onChange={(e) => {
              const selected = DIAGRAM_PRESETS.find((p) => p.id === e.target.value);
              if (selected) {
                onSelectPreset(selected.code);
              }
            }}
            defaultValue="sequence"
            className="bg-slate-800/90 text-slate-200 text-xs rounded-lg px-3 py-1.5 border border-slate-700/80 focus:outline-none focus:border-cyan-500/80 cursor-pointer"
          >
            {DIAGRAM_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Selector */}
        <div className="flex items-center space-x-2">
          <Palette className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-400 font-medium hidden md:inline">Theme:</span>
          <select
            id="theme-select"
            value={currentTheme}
            onChange={(e) => onThemeChange(e.target.value as ThemeName)}
            className="bg-slate-800/90 text-slate-200 text-xs rounded-lg px-3 py-1.5 border border-slate-700/80 focus:outline-none focus:border-cyan-500/80 cursor-pointer"
          >
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="h-5 w-px bg-slate-800" />

        {/* Action Buttons */}
        <button
          onClick={handleCopy}
          disabled={!xmlOutput}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700/80 disabled:opacity-50 transition flex items-center space-x-1.5 cursor-pointer"
          title="Copy mxGraph XML"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          <span>{copied ? 'Copied!' : 'Copy XML'}</span>
        </button>

        <button
          onClick={handleDownload}
          disabled={!xmlOutput}
          className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-500/10 disabled:opacity-50 transition flex items-center space-x-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export .drawio</span>
        </button>

        <button
          onClick={handleOpenDrawIo}
          disabled={!xmlOutput}
          className="p-1.5 text-slate-400 hover:text-cyan-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 disabled:opacity-55 disabled:cursor-not-allowed transition cursor-pointer"
          title="Open diagrams.net"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
