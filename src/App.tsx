import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { PreviewCanvas } from './components/PreviewCanvas';
import { convertPumlToDrawIo, ThemeName } from './core';
import { DIAGRAM_PRESETS } from './presets';
import Editor from '@monaco-editor/react';
import { FileCode, AlertTriangle, Terminal } from 'lucide-react';

export default function App() {
  const [pumlCode, setPumlCode] = useState(DIAGRAM_PRESETS[0].code);
  const [theme, setTheme] = useState<ThemeName>('classic');

  // Live conversion memo
  const conversion = useMemo(() => {
    return convertPumlToDrawIo(pumlCode, theme);
  }, [pumlCode, theme]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation Header */}
      <Header
        currentTheme={theme}
        onThemeChange={setTheme}
        xmlOutput={conversion.xml}
        onSelectPreset={(code) => setPumlCode(code)}
      />

      {/* Main Split Workbench Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 bg-slate-900 overflow-hidden">
        {/* Left Pane: Monaco Code Editor */}
        <div className="flex flex-col bg-slate-900 overflow-hidden border-r border-slate-800/80">
          {/* Editor Header Bar */}
          <div className="h-10 px-4 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span className="font-medium text-slate-200">PlantUML Definition</span>
            </div>
            
            {conversion.error && (
              <div className="flex items-center space-x-1.5 text-rose-400 bg-rose-950/50 border border-rose-800/60 px-2.5 py-0.5 rounded-md text-[11px] font-mono truncate max-w-sm">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{conversion.error}</span>
              </div>
            )}
          </div>

          {/* Monaco Editor Canvas */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage="text"
              theme="vs-dark"
              value={pumlCode}
              onChange={(value) => setPumlCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                padding: { top: 12, bottom: 12 },
              }}
              loading={
                <div className="h-full flex items-center justify-center text-slate-500 text-sm space-x-2">
                  <Terminal className="w-5 h-5 animate-pulse text-cyan-400" />
                  <span>Initializing Monaco Code Editor...</span>
                </div>
              }
            />
          </div>
        </div>

        {/* Right Pane: Visual Canvas & XML Preview Panel */}
        <PreviewCanvas
          xmlOutput={conversion.xml}
          diagramType={conversion.diagramType}
          error={conversion.error}
        />
      </main>
    </div>
  );
}
