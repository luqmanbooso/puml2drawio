import React, { useState, useEffect, useRef } from 'react';
import { Eye, Code2, Loader2, CheckCircle2, AlertCircle, FileCode2 } from 'lucide-react';

interface PreviewCanvasProps {
  xmlOutput: string;
  diagramType: 'general' | 'sequence';
  error?: string;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ xmlOutput, diagramType, error }) => {
  const [viewMode, setViewMode] = useState<'visual' | 'xml'>('visual');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isViewerReady, setIsViewerReady] = useState(false);

  // Listen for the 'init' or 'configure' event from embedded Draw.io viewer
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin.includes('diagrams.net') ||
        event.origin.includes('draw.io')
      ) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.event === 'init' || data.event === 'configure') {
            setIsViewerReady(true);
          }
        } catch (e) {
          // Ignore non-JSON postMessages
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Post XML payload whenever xmlOutput updates or when viewer becomes ready
  useEffect(() => {
    if (iframeRef.current && xmlOutput && viewMode === 'visual') {
      const msg = JSON.stringify({
        action: 'load',
        xml: xmlOutput,
        autosave: 0,
      });
      iframeRef.current.contentWindow?.postMessage(msg, '*');
    }
  }, [xmlOutput, isViewerReady, viewMode]);

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden border-l border-slate-800/80">
      {/* Panel Navigation & Mode Status Header */}
      <div className="h-10 px-4 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        {/* Toggle Mode Buttons */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
          <button
            onClick={() => setViewMode('visual')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'visual'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm border border-slate-700/50'
                : 'hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visual Canvas</span>
          </button>
          <button
            onClick={() => setViewMode('xml')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'xml'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm border border-slate-700/50'
                : 'hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>XML Source</span>
          </button>
        </div>

        {/* Indicator badges */}
        <div className="flex items-center space-x-3">
          {error ? (
            <span className="flex items-center space-x-1 text-rose-400 text-[11px] font-mono bg-rose-950/40 border border-rose-800/50 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              <span>Parse Error</span>
            </span>
          ) : xmlOutput ? (
            <span className="flex items-center space-x-1 text-emerald-400 text-[11px] font-mono bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              <span>Compiled OK</span>
            </span>
          ) : null}

          <span className="text-cyan-400 font-mono text-[11px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
            Engine: {diagramType}
          </span>
        </div>
      </div>

      {/* Main Viewport Content */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden">
        {viewMode === 'visual' ? (
          xmlOutput ? (
            <iframe
              ref={iframeRef}
              title="Draw.io Viewer"
              src="https://viewer.diagrams.net/?embed=1&ui=min&spin=1&proto=json"
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm space-y-2">
              <FileCode2 className="w-8 h-8 text-slate-600" />
              <span>Enter PlantUML code to render visual canvas...</span>
            </div>
          )
        ) : (
          <div className="h-full p-4 overflow-auto font-mono text-xs text-slate-300 select-text bg-slate-950">
            {xmlOutput ? (
              <pre className="whitespace-pre-wrap break-all text-cyan-200/90 leading-relaxed">{xmlOutput}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm space-y-2">
                <Code2 className="w-8 h-8 text-slate-600" />
                <span>No XML output available...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
