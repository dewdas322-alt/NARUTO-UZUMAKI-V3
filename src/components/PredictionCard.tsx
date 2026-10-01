import React, { useEffect, useState, useRef } from 'react';
import { PredictionData, GameConfig } from '../types';
import { RefreshCw, Zap, ShieldCheck, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

interface PredictionCardProps {
  prediction: PredictionData | null;
  currentGame: GameConfig;
  currentLevel: number;
  remainingSeconds: number;
  isLoading: boolean;
  onRefresh: () => void;
  winCount: number;
  onChangeGame?: () => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  currentGame,
  remainingSeconds,
  isLoading,
  onRefresh,
  onChangeGame
}) => {
  const [animKey, setAnimKey] = useState<string>('init');
  const [isNewEntry, setIsNewEntry] = useState<boolean>(false);
  const prevPeriodRef = useRef<string | null>(null);

  // Trigger flip / slide-down entry animation whenever a new prediction arrives
  useEffect(() => {
    if (prediction && prediction.fullPeriod !== prevPeriodRef.current) {
      prevPeriodRef.current = prediction.fullPeriod;
      setAnimKey(`${prediction.fullPeriod}-${prediction.timestamp}`);
      setIsNewEntry(true);
      soundManager.playChakraTone(580, 0.15);

      const t = setTimeout(() => {
        setIsNewEntry(false);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [prediction]);

  const isLowTime = remainingSeconds <= 5;
  const isBig = prediction?.predictedSize === 'BIG';

  // Format timer MM:SS
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timerStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Get pattern icon badge
  const getPatternBadge = () => {
    if (!prediction) return null;
    const p = prediction.patternName;
    if (p.includes('DRAGON')) return { text: '🐉 DRAGON PATTERN ACTIVE', color: 'text-amber-400 bg-amber-950/60 border-amber-500/40' };
    if (p.includes('MIRROR')) return { text: '🪞 MIRROR SYMMETRY ACTIVE', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40' };
    if (p.includes('ZIGZAG') || p.includes('PING-PONG')) return { text: '⚡ ZIGZAG ALTERNATION ACTIVE', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' };
    if (p.includes('BLOCK')) return { text: '🧱 BLOCK CYCLE ACTIVE', color: 'text-purple-400 bg-purple-950/60 border-purple-500/40' };
    return { text: '📊 STATISTICAL MEAN-REVERSION', color: 'text-sky-400 bg-sky-950/60 border-sky-500/40' };
  };

  const badge = getPatternBadge();

  return (
    <div className="w-full relative">
      {/* Outer Glow Gradient Border Container (Matches Screenshot Theme) */}
      <div
        className={`p-[1.5px] rounded-[24px] bg-gradient-to-r from-[#0284c7] via-[#10b981] to-[#eab308] transition-shadow duration-700 ${
          isNewEntry ? 'animate-signal-flash' : 'shadow-[0_0_35px_-5px_rgba(16,185,129,0.3)]'
        }`}
      >
        <div className="bg-[#0b1220] rounded-[23px] p-3.5 sm:p-5 flex flex-col gap-3">
          
          {/* Top Bar inside Card: Period & Next Countdown */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-baseline gap-1.5 font-mono-code">
              <span className="text-[#fbbf24] font-bold text-sm sm:text-base">
                Period:
              </span>
              <span className="text-[#fbbf24] font-extrabold text-sm sm:text-base tracking-wide">
                {prediction ? prediction.fullPeriod : '...'}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 font-mono-code">
              <span className="text-[#22c55e] font-bold text-sm sm:text-base">
                Next:
              </span>
              <span
                className={`font-black text-sm sm:text-base tracking-wider ${
                  isLowTime ? 'text-rose-400 animate-pulse' : 'text-[#22c55e]'
                }`}
              >
                {timerStr}
              </span>
            </div>
          </div>

          {/* Center Main Glowing Prediction Box with Professional 3D Flip & Slide-Down Entry */}
          <div
            key={animKey}
            className={`animate-prediction-flip relative rounded-2xl border border-[#10b981]/50 bg-gradient-to-b from-[#064e3b]/50 via-[#032e24]/70 to-[#021f18]/90 p-5 sm:p-7 text-center shadow-lg shadow-emerald-950/60 overflow-hidden`}
          >
            {/* Subtle light sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              {/* Pattern Tag Badge */}
              {badge && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full border mb-2 ${badge.color}`}>
                  <Sparkles className="w-3 h-3" />
                  <span>{badge.text}</span>
                </span>
              )}

              <span className="text-[#94a3b8] font-orbitron font-extrabold tracking-widest text-xs sm:text-sm uppercase mb-1">
                NEXT ISSUE PREDICTION:
              </span>

              {/* Main Call: e.g. SMALL [2] */}
              <div
                className={`font-orbitron font-black text-3xl sm:text-5xl tracking-widest my-1 ${
                  prediction
                    ? isBig
                      ? 'text-[#fb923c] text-glow-orange animate-pulse-glow'
                      : 'text-[#22c55e] text-glow-green animate-pulse-glow'
                    : 'text-gray-500 animate-pulse'
                }`}
              >
                {prediction ? (
                  <>
                    {prediction.predictedSize} [{prediction.predictedNum}]
                  </>
                ) : (
                  'CALCULATING...'
                )}
              </div>

              {/* Sub-info / Target Period */}
              <div className="text-gray-400 font-mono-code text-xs sm:text-sm mt-2 flex items-center gap-2">
                <span>Target:</span>
                <span className="text-gray-200 font-bold">
                  {prediction ? prediction.fullPeriod : '...'}
                </span>
                {prediction?.backupNum !== undefined && (
                  <span className="text-gray-400 text-[11px] ml-1 bg-black/40 px-2 py-0.5 rounded border border-gray-700/50">
                    Backup: [{prediction.backupNum}]
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Utility Row inside Card */}
          <div className="flex items-center justify-between text-xs font-mono-code text-gray-400 px-1 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[#4ade80] text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
                <span>CONF: {prediction ? `${prediction.confidence}%` : '98.5%'}</span>
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-cyan-400 text-[11px]">
                {prediction ? `${prediction.agreeCount}/6 ENGINES` : '5-ENGINE FUSION'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onChangeGame && (
                <button
                  type="button"
                  onClick={onChangeGame}
                  className="px-2 py-0.5 rounded bg-[#162238] border border-[#1e293b] text-cyan-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                >
                  CHANGE GAME
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  soundManager.playTick();
                  onRefresh();
                }}
                disabled={isLoading}
                title="Sync live data"
                className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white px-2 py-0.5 rounded bg-[#162238] border border-[#1e293b] active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-[#10b981]' : ''}`} />
                <span>SYNC</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
