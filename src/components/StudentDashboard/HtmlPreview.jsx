import React, { useRef, useEffect, useState } from 'react';
import { Monitor, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';

/**
 * HtmlPreview — Sandboxed iframe renderer for student HTML code.
 * Uses srcdoc for safe, isolated rendering.
 */
const HtmlPreview = ({ htmlCode, autoRefresh = false }) => {
  const iframeRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastRendered, setLastRendered] = useState(null);

  // Render HTML into the iframe
  const renderHTML = (code) => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = code || '';
      setLastRendered(new Date());
    }
  };

  // Auto-refresh on code change (debounced)
  useEffect(() => {
    if (!autoRefresh || !htmlCode) return;
    const timer = setTimeout(() => renderHTML(htmlCode), 600);
    return () => clearTimeout(timer);
  }, [htmlCode, autoRefresh]);

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0F172A]' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <Monitor size={14} className="text-emerald-400" />
          Live Preview
        </div>
        <div className="flex items-center gap-2">
          {lastRendered && (
            <span className="text-[9px] text-slate-600">
              {lastRendered.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => renderHTML(htmlCode)}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-emerald-400"
            title="Refresh preview"
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => setIsFullscreen(f => !f)}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-indigo-400"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Iframe */}
      <div className="flex-1 bg-white relative">
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts"
          title="HTML Preview"
          className="w-full h-full border-0"
          srcDoc={htmlCode || '<html><body style="font-family: sans-serif; color: #666; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;"><p>Click <b>Run</b> to preview your HTML</p></body></html>'}
        />
      </div>
    </div>
  );
};

export default HtmlPreview;
