import React from 'react';
import { PredictionData, GameConfig } from '../types';
import { Cpu, CheckCircle2, TrendingUp, AlertCircle, Sparkles, BrainCircuit } from 'lucide-react';

interface EngineAnalysisViewProps {
  prediction: PredictionData | null;
  currentGame: GameConfig;
  onBackToPredict: () => void;
}

export const EngineAnalysisView: React.FC<EngineAnalysisViewProps> = ({
  prediction,
  currentGame,
  onBackToPredict
}) => {
  if (!prediction) {
    return (
      <div className="w-full rounded-2xl bg-[#0c1220] border border-[#1e293b] p-6 text-center text-gray-400">
        <Cpu className="w-12 h-12 text-[#10b981] mx-auto mb-3 animate-pulse" />
        <h3 className="font-orbitron font-bold text-white text-base">NO ENGINE ANALYSIS YET</h3>
        <p className="text-xs mt-1">Please select WINGO game to start live AI multi-engine calculations.</p>
        <button
          type="button"
          onClick={onBackToPredict}
          className="mt-4 px-4 py-2 rounded-xl bg-[#10b981] text-black font-orbitron font-bold text-xs cursor-pointer"
        >
          GO TO PREDICTOR
        </button>
      </div>
    );
  }

  const { engines, marketMetrics, humanCall, humanConf, aiCall, aiConf, verdict, patternName } = prediction;

  const engineList = [
    { key: 'RDX', eng: engines.RDX, role: 'Matrix & Streak Breaker' },
    { key: 'VANTA', eng: engines.VANTA, role: 'Suffix & Markov Vision' },
    { key: 'NOCTIS', eng: engines.NOCTIS, role: 'Novix Wilson Reference DB' },
    { key: 'BRAIN', eng: engines.BRAIN, role: 'Human Pattern & Cycle Reader' },
    { key: 'MARKET', eng: engines.MARKET, role: 'Regime & Exhaustion Detector' },
    { key: 'FORMULA8', eng: engines.FORMULA8, role: '8-Chakra Mathematical System' }
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Fusion Master Summary Card */}
      <div className="rounded-2xl bg-[#0c1220] border border-[#10b981]/50 p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-[#4ade80]" />
            <h3 className="font-orbitron font-bold text-sm sm:text-base text-white">
              5-ENGINE + 8-MATH FUSION INTEL
            </h3>
          </div>
          <span className="text-xs font-mono-code font-bold px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4ade80] border border-[#10b981]/40">
            AGREE: {prediction.agreeCount}/6
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 font-mono-code text-xs">
          <div className="bg-[#11192b] border border-[#1e293b] p-2.5 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 block uppercase">FINAL CALL</span>
            <span className={`font-orbitron font-extrabold text-lg ${prediction.predictedSize === 'BIG' ? 'text-[#fb923c]' : 'text-[#4ade80]'}`}>
              {prediction.predictedSize} [{prediction.predictedNum}]
            </span>
          </div>

          <div className="bg-[#11192b] border border-[#1e293b] p-2.5 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 block uppercase">CONFIDENCE</span>
            <span className="font-orbitron font-extrabold text-lg text-[#38bdf8]">
              {prediction.confidence}%
            </span>
          </div>

          <div className="bg-[#11192b] border border-[#1e293b] p-2.5 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 block uppercase">MARKET STATE</span>
            <span className="font-orbitron font-extrabold text-sm text-[#fbbf24] mt-1 block">
              {prediction.marketState}
            </span>
          </div>

          <div className="bg-[#11192b] border border-[#1e293b] p-2.5 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 block uppercase">RISK LEVEL</span>
            <span className={`font-orbitron font-extrabold text-sm mt-1 block ${prediction.risk === 'LOW' ? 'text-emerald-400' : prediction.risk === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`}>
              {prediction.risk} RISK
            </span>
          </div>
        </div>

        {/* Human vs AI Read Box */}
        <div className="p-3 rounded-xl bg-[#080d17] border border-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono-code">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-gray-400 font-bold">PATTERN: </span>
              <span className="text-white font-semibold">{patternName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-300">
              HUMAN: <b className={humanCall === 'BIG' ? 'text-orange-400' : 'text-emerald-400'}>{humanCall} ({humanConf}%)</b>
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-300">
              AI READ: <b className={aiCall === 'BIG' ? 'text-orange-400' : 'text-emerald-400'}>{aiCall} ({aiConf}%)</b>
            </span>
          </div>
        </div>
      </div>

      {/* Individual Engine Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {engineList.map(({ key, eng, role }) => {
          const isEngBig = eng.call === 'BIG';
          const isWinningCall = eng.call === prediction.predictedSize;

          return (
            <div
              key={key}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isWinningCall
                  ? 'bg-[#0f172a] border-[#10b981]/40'
                  : 'bg-[#0c1220] border-[#1e293b]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-orbitron font-extrabold text-xs text-white">
                    {eng.name}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono-code">
                    {role}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded font-orbitron font-bold text-xs ${
                      isEngBig
                        ? 'bg-orange-950/80 text-orange-400 border border-orange-500/40'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {eng.call}
                  </span>
                  <span className="text-[11px] font-mono-code text-gray-400">
                    {eng.conf}%
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-gray-400 font-mono-code pt-2 border-t border-[#1e293b]/70 flex items-center justify-between">
                <span>{eng.detail || 'Active AI model inference'}</span>
                {isWinningCall && (
                  <span className="text-[10px] text-[#4ade80] font-bold">✓ CONSENSUS</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pattern Classification Reference Card */}
      <div className="rounded-2xl bg-[#0c1220] border border-[#1e293b] p-4 text-xs font-mono-code">
        <div className="font-orbitron font-bold text-white mb-2 flex items-center gap-1.5 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
          <span>ACTIVE PATTERN INTELLIGENCE RECOGNITION</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-gray-400">
          <div className="p-2 rounded-lg bg-[#080d17] border border-[#1e293b]">
            <b className="text-amber-400 block font-orbitron text-[11px]">🐉 DRAGON</b>
            <span>4x+ streak trend following & exhaustion breaks</span>
          </div>
          <div className="p-2 rounded-lg bg-[#080d17] border border-[#1e293b]">
            <b className="text-cyan-400 block font-orbitron text-[11px]">🪞 MIRROR</b>
            <span>Symmetric palindromes (BSSB, BBSSBB, etc.)</span>
          </div>
          <div className="p-2 rounded-lg bg-[#080d17] border border-[#1e293b]">
            <b className="text-emerald-400 block font-orbitron text-[11px]">⚡ ZIGZAG</b>
            <span>Ping-pong alternating turns (B-S-B-S)</span>
          </div>
          <div className="p-2 rounded-lg bg-[#080d17] border border-[#1e293b]">
            <b className="text-purple-400 block font-orbitron text-[11px]">📊 RANDOM</b>
            <span>Runs-Z test & 20-period statistical mean reversion</span>
          </div>
        </div>
      </div>
    </div>
  );
};
