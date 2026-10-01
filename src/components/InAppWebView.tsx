import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { PredictionData, HistoryRecord } from '../types';
import { soundManager } from '../utils/soundEffects';

interface InAppWebViewProps {
  onBackToPredict: () => void;
  defaultUrl?: string;
  prediction: PredictionData | null;
  history: HistoryRecord[];
  isVerified?: boolean;
}

export const InAppWebView: React.FC<InAppWebViewProps> = ({
  onBackToPredict,
  defaultUrl = 'https://bdgwin78.com/#/register?invitationCode=4148715921265',
  prediction,
  history,
  isVerified = true
}) => {
  const [url, setUrl] = useState<string>(defaultUrl);
  const [inputUrl, setInputUrl] = useState<string>(defaultUrl);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // SPECIFICATION: Only show the single LAST (most recent) history record!
  const lastRecord = history.length > 0 ? history[0] : null;

  const handleRefresh = () => {
    soundManager.playTick();
    setIsLoading(true);
    const iframe = document.getElementById('persistent-game-frame') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = url;
    }
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
    const iframe = document.getElementById('persistent-game-frame') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = finalUrl;
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col rounded-xl bg-[#080d18] border border-[#1e293b] shadow-2xl overflow-hidden min-h-[82vh] h-[calc(100vh-100px)]">
      {/* 1. Slim & Compact Address / Control Bar (Thoda chhota kiya gaya) */}
      <div className="bg-[#0b1222] border-b border-[#1e293b] px-2 py-1 flex items-center justify-between gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            soundManager.playTick();
            onBackToPredict();
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#142036] border border-[#1e293b] text-gray-200 hover:text-white text-[10px] font-mono-code font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3 h-3 text-[#38bdf8]" />
          <span>HACK</span>
        </button>

        {/* Address Bar Form */}
        <form onSubmit={handleNavigate} className="flex-1 max-w-sm flex items-center gap-1 bg-[#050912] border border-[#1e293b] rounded-lg px-2 py-0.5">
          <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Game URL..."
            className="w-full bg-transparent text-[10px] font-mono-code text-gray-300 focus:outline-none truncate"
          />
          <button
            type="submit"
            className="text-[9px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-[#15233e] text-[#38bdf8] hover:bg-[#1e3a6a] cursor-pointer"
          >
            GO
          </button>
        </form>

        <button
          type="button"
          onClick={handleRefresh}
          title="Reload Webpage"
          className="p-1 rounded-lg bg-[#142036] border border-[#1e293b] text-gray-300 hover:text-white transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-[#38bdf8]' : ''}`} />
        </button>
      </div>

      {/* 2. SPECIFICATION: Ultra-Compact Ticker Line: Live Prediction + ONLY LAST History Record */}
      {isVerified && (
        <div className="bg-[#070b14] border-b border-[#10b981]/30 px-2 py-1 flex items-center justify-between gap-1 text-[11px] font-mono-code shadow-sm shrink-0">
          {/* Active Live Prediction */}
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5 text-[#facc15] font-bold text-[10px]">
              <Sparkles className="w-3 h-3 text-[#facc15]" />
              <span>#{prediction ? prediction.period : '...'}:</span>
            </span>
            <span
              className={`font-orbitron font-black text-[11px] px-1.5 py-0.2 rounded border ${
                prediction
                  ? 'text-[#4ade80] border-[#10b981]/50 bg-[#064e3b]/30 text-glow-green'
                  : 'text-gray-400 border-gray-700 bg-gray-900'
              }`}
            >
              {prediction ? `${prediction.predictedSize} [${prediction.predictedNum}]` : '...'}
            </span>
          </div>

          {/* SPECIFICATION: ONLY LAST SINGLE RECORD DISPLAYED */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9px] text-gray-400 font-bold uppercase">LAST:</span>
            {lastRecord ? (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border whitespace-nowrap ${
                  lastRecord.isJackpot
                    ? 'border-pink-500/60 bg-pink-950/60 text-pink-300'
                    : lastRecord.isWin
                    ? 'border-emerald-600/60 bg-emerald-950/60 text-emerald-400'
                    : 'border-rose-600/60 bg-rose-950/60 text-rose-400'
                }`}
              >
                <span>#{lastRecord.period}</span>
                <span className="font-orbitron">{lastRecord.predictedSize[0]}[{lastRecord.predictedNum}]</span>
                <span className="text-[9px] font-black">{lastRecord.isJackpot ? '🔥JP' : lastRecord.isWin ? '✓WIN' : '✗LOSS'}</span>
              </span>
            ) : (
              <span className="text-[9px] text-gray-500 italic">Waiting draw</span>
            )}
          </div>
        </div>
      )}

      {/* 3. Maximized & Enlarged Embedded Game Web View (Screen ko bada kiya gaya) */}
      <div className="relative w-full flex-1 bg-[#050811] flex flex-col overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#050811]/90 backdrop-blur-xs">
            <RefreshCw className="w-6 h-6 text-[#38bdf8] animate-spin mb-2" />
            <span className="font-orbitron text-[11px] font-bold text-white tracking-wider">
              LOADING GAME VIEW...
            </span>
          </div>
        )}

        <iframe
          id="persistent-game-frame"
          src={url}
          onLoad={() => setIsLoading(false)}
          className="w-full flex-1 h-full border-0"
          title="In-App Game Web View"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />

        {/* Minimalist Micro Bottom Indicator */}
        <div className="px-2 py-0.5 bg-[#070b14] border-t border-[#1e293b]/70 flex items-center justify-between text-[9px] font-mono-code text-gray-500 shrink-0">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
            <span>Persistent Game Sync Active</span>
          </div>
          <span>Maximized View</span>
        </div>
      </div>
    </div>
  );
};
