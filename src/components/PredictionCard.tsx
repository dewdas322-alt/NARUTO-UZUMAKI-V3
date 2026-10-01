import React, { useEffect, useState, useRef } from 'react';
import { PredictionData, GameConfig } from '../types';
import { RefreshCw, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react';
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

  // Trigger 3D flip entry animation AND navigator.vibrate() whenever a new prediction is generated
  useEffect(() => {
    if (prediction && prediction.fullPeriod !== prevPeriodRef.current) {
      prevPeriodRef.current = prediction.fullPeriod;
      setAnimKey(`${prediction.fullPeriod}-${prediction.timestamp}`);
      setIsNewEntry(true);
      soundManager.playChakraTone(580, 0.15);

      // Mobile Device Physical Vibration Feedback (navigator.vibrate)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          if (prediction.confidence >= 88) {
            // Ultra high-confidence / potential jackpot pattern: subtle rhythmic pulse
            navigator.vibrate([70, 45, 70, 45, 120]);
          } else if (prediction.confidence >= 80) {
            // High-confidence double pulse
            navigator.vibrate([60, 40, 60]);
          } else {
            // Standard subtle single pulse
            navigator.vibrate(50);
          }
        } catch {
          // Ignore if vibration is restricted by user agent
        }
      }

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

  // Visual Market Trend Indicator logic
  const getMarketTrend = () => {
    if (!prediction) {
      return {
        type: 'INITIALIZING',
        text: 'ANALYZING LIVE STREAM...',
        style: 'text-gray-400 bg-gray-900 border-gray-700/60'
      };
    }

    const pt = prediction.patternType || (
      prediction.patternName.includes('DRAGON')
        ? 'Dragon'
        : prediction.patternName.includes('MIRROR')
        ? 'Mirror'
        : prediction.patternName.includes('ZIGZAG') || prediction.patternName.includes('PING-PONG')
        ? 'Zigzag'
        : 'Random'
    );

    if (pt === 'Dragon') {
      const isExhaustion = prediction.patternName.includes('BREAK') || prediction.patternName.includes('Exhaustion');
      return {
        type: 'DRAGON',
        text: isExhaustion ? '🐉 DRAGON (EXHAUSTION BREAK)' : '🐉 DRAGON (TREND FOLLOWING)',
        style: 'text-[#facc15] bg-[#713f12]/40 border-[#eab308]/60 shadow-[0_0_10px_rgba(234,179,8,0.25)]'
      };
    }

    if (pt === 'Mirror') {
      return {
        type: 'MIRROR',
        text: '🪞 MIRROR SYMMETRY TREND',
        style: 'text-[#38bdf8] bg-[#0c4a6e]/40 border-[#0284c7]/60 shadow-[0_0_10px_rgba(2,132,199,0.25)]'
      };
    }

    if (pt === 'Zigzag') {
      return {
        type: 'ZIGZAG',
        text: '⚡ ZIGZAG (PING-PONG ALTERNATION)',
        style: 'text-[#4ade80] bg-[#052e16]/50 border-[#16a34a]/60 shadow-[0_0_10px_rgba(34,197,94,0.25)]'
      };
    }

    return {
      type: 'RANDOM',
      text: '📊 STATISTICAL MEAN-REVERSION',
      style: 'text-[#c084fc] bg-[#3b0764]/40 border-[#9333ea]/60 shadow-[0_0_10px_rgba(147,51,234,0.25)]'
    };
  };

  const marketTrend = getMarketTrend();

  return (
    <div className="w-full relative">
      {/* Outer Glow Gradient Border Container (Exact Screenshot Match: Yellow -> Pink -> Blue) */}
      <div
        className={`p-[1.5px] rounded-[24px] bg-gradient-to-tr from-[#f59e0b] via-[#ec4899] to-[#06b6d4] transition-shadow duration-700 ${
          isNewEntry ? 'animate-signal-flash' : 'shadow-[0_0_35px_rgba(236,72,153,0.3)]'
        }`}
      >
        <div className="bg-[#0b101d] rounded-[23px] p-3.5 sm:p-5 flex flex-col gap-3">
          
          {/* Top Bar inside Card: Period & Next Countdown */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-baseline gap-1.5 font-mono-code">
              <span className="text-[#facc15] font-bold text-sm sm:text-base">
                Period:
              </span>
              <span className="text-[#facc15] font-extrabold text-sm sm:text-base tracking-wide">
                {prediction ? prediction.fullPeriod : '...'}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 font-mono-code">
              <span className="text-[#4ade80] font-bold text-sm sm:text-base">
                Next:
              </span>
              <span
                className={`font-black text-sm sm:text-base tracking-wider ${
                  isLowTime ? 'text-rose-400 animate-pulse' : 'text-[#4ade80]'
                }`}
              >
                {timerStr}
              </span>
            </div>
          </div>

          {/* Visual Market Trend Indicator (Displays Dragon, Mirror, or Zigzag pattern) */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#071321] border border-[#1e293b] text-xs font-mono-code">
            <span className="text-gray-400 font-bold flex items-center gap-1.5 text-[11px]">
              <TrendingUp className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>MARKET TREND:</span>
            </span>
            <span className={`font-orbitron font-extrabold text-[10px] px-2.5 py-0.5 rounded-md border ${marketTrend.style}`}>
              {marketTrend.text}
            </span>
          </div>

          {/* Center Main Glowing Prediction Box with 3D Flip & Slide-Down Animation */}
          <div
            key={animKey}
            className="animate-prediction-flip relative rounded-2xl border border-[#10b981]/50 bg-gradient-to-b from-[#064e3b]/50 via-[#032e24]/70 to-[#021f18]/90 p-5 sm:p-6 text-center shadow-lg shadow-emerald-950/60 overflow-hidden"
          >
            {/* Subtle light sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <span className="text-[#94a3b8] font-orbitron font-extrabold tracking-widest text-xs sm:text-sm uppercase mb-1">
                NEXT ISSUE PREDICTION:
              </span>

              {/* Main Call: BIG [6] or SMALL [0] (Exact Screenshot Style) */}
              <div
                className={`font-orbitron font-black text-3xl sm:text-5xl tracking-widest my-1 ${
                  prediction
                    ? isBig
                      ? 'text-[#4ade80] text-glow-green animate-pulse-glow'
                      : 'text-[#4ade80] text-glow-green animate-pulse-glow'
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
