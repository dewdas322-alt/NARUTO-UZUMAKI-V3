import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, ShieldCheck, Lock, Globe, ExternalLink } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

interface InAppWebViewProps {
  onBackToPredict: () => void;
  defaultUrl?: string;
}

export const InAppWebView: React.FC<InAppWebViewProps> = ({
  onBackToPredict,
  defaultUrl = 'https://bdgwin53.com'
}) => {
  const [url, setUrl] = useState<string>(defaultUrl);
  const [inputUrl, setInputUrl] = useState<string>(defaultUrl);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleRefresh = () => {
    soundManager.playTick();
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = inputUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setUrl(finalUrl);
    setInputUrl(finalUrl);
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="w-full flex-1 flex flex-col rounded-2xl bg-[#0c1220] border border-[#1e293b] shadow-2xl overflow-hidden min-h-[75vh]">
      {/* In-App Browser Control Bar */}
      <div className="bg-[#0f172a] border-b border-[#1e293b] p-2.5 sm:p-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            soundManager.playTick();
            onBackToPredict();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#162238] border border-[#1e293b] text-gray-200 hover:text-white text-xs font-mono-code font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#38bdf8]" />
          <span>PREDICTOR</span>
        </button>

        {/* Address Bar Form */}
        <form onSubmit={handleNavigate} className="flex-1 max-w-lg flex items-center gap-1.5 bg-[#080d17] border border-[#1e293b] rounded-xl px-2.5 py-1">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter game URL..."
            className="w-full bg-transparent text-xs font-mono-code text-gray-200 focus:outline-none truncate"
          />
          <button
            type="submit"
            className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded bg-[#15233e] text-[#38bdf8] hover:bg-[#1e3a6a] cursor-pointer"
          >
            GO
          </button>
        </form>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            title="Reload Webpage"
            className="p-1.5 rounded-lg bg-[#162238] border border-[#1e293b] text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#38bdf8]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Embedded In-App Viewport */}
      <div className="relative w-full flex-1 min-h-[68vh] bg-[#070b14] flex flex-col">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#070b14]/90 backdrop-blur-sm">
            <RefreshCw className="w-8 h-8 text-[#38bdf8] animate-spin mb-3" />
            <span className="font-orbitron text-xs font-bold text-white tracking-wider">
              LOADING GAME WEBPAGE IN-APP...
            </span>
            <span className="text-[11px] font-mono-code text-gray-400 mt-1">
              Direct In-App Web View Active
            </span>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={url}
          onLoad={() => setIsLoading(false)}
          className="w-full flex-1 min-h-[68vh] border-0"
          title="In-App Game Web View"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />

        {/* Bottom Safety & Direct Sync Note */}
        <div className="p-2 bg-[#0a0f1d] border-t border-[#1e293b] flex items-center justify-between text-[11px] font-mono-code text-gray-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Direct In-App View Active</span>
          </div>
          <span className="text-gray-500">No external browser redirect</span>
        </div>
      </div>
    </div>
  );
};
