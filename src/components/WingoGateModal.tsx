import React, { useState } from 'react';
import { GameType } from '../types';
import { GAMES } from '../utils/lotteryEngine';
import { Flame, Clock, Radio, Dices, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

interface WingoGateModalProps {
  isOpen: boolean;
  selectedGame: GameType;
  onConfirmSelection: (gameId: GameType) => void;
}

export const WingoGateModal: React.FC<WingoGateModalProps> = ({
  isOpen,
  selectedGame,
  onConfirmSelection
}) => {
  const [chosen, setChosen] = useState<GameType>(selectedGame);

  if (!isOpen) return null;

  const getIcon = (id: GameType) => {
    switch (id) {
      case 'WINGO_30S':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'WINGO_1M':
        return <Flame className="w-5 h-5 text-[#ff6b00]" />;
      case 'WINGO_3M':
        return <Clock className="w-5 h-5 text-emerald-400" />;
      case 'WINGO_5M':
        return <Clock className="w-5 h-5 text-purple-400" />;
      case 'TRX_1M':
        return <Radio className="w-5 h-5 text-cyan-400" />;
      case 'K3_1M':
        return <Dices className="w-5 h-5 text-rose-400" />;
    }
  };

  const handleStart = () => {
    soundManager.playChakraTone(600, 0.25);
    onConfirmSelection(chosen);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0c1220] border border-[#10b981]/50 shadow-[0_0_50px_rgba(16,185,129,0.25)] overflow-hidden p-5 sm:p-7 text-center">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-gradient-to-b from-[#10b981]/20 to-transparent blur-2xl pointer-events-none" />

        {/* Top Logo & Title */}
        <div className="relative z-10 flex flex-col items-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10b981] via-[#0ea5e9] to-[#ff6b00] p-0.5 shadow-lg shadow-emerald-500/30 mb-3 flex items-center justify-center">
            <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#4ade80]" />
            </div>
          </div>

          <h2 className="font-orbitron font-black text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#4ade80] via-[#38bdf8] to-[#fbbf24] tracking-wider">
            NARUTO UZUMAKI V2
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#132034] border border-[#10b981]/40 text-[#4ade80] text-xs font-mono-code font-bold mt-2">
            <span>BYPASS GATE ACTIVE</span>
            <span>&bull;</span>
            <span>CHOOSE WINGO FIRST</span>
          </div>

          <p className="text-xs text-gray-300 font-rajdhani font-semibold mt-2.5 max-w-md leading-relaxed">
            Predicton background me run nahi ho rahi hai. Pehle apna WINGO game select karein, uske baad hi live AI engines prediction generate karna shuru karenge.
          </p>
        </div>

        {/* Game Mode Grid */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6 text-left">
          {GAMES.map((game) => {
            const isSelected = chosen === game.id;
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => {
                  soundManager.playTick();
                  setChosen(game.id);
                }}
                className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#064e3b]/80 to-[#0c1f24] border-[#10b981] shadow-lg shadow-emerald-950/60 ring-2 ring-[#10b981]/50'
                    : 'bg-[#11192b] border-[#1e293b] hover:bg-[#162238] hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#10b981]/30' : 'bg-gray-800/80'}`}>
                    {getIcon(game.id)}
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                  )}
                </div>

                <div>
                  <div className="font-orbitron font-bold text-xs text-white">
                    {game.shortName}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono-code">
                    {game.isK3 ? 'Sum: 3-18' : 'Digits: 0-9'}
                  </div>
                </div>

                <div className="mt-2 text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-black/40 text-gray-300 w-fit">
                  {game.durationSec}s cycle
                </div>
              </button>
            );
          })}
        </div>

        {/* Big Start / Confirm Button */}
        <div className="relative z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleStart}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] hover:from-[#34d399] hover:to-[#059669] text-black font-orbitron font-black text-sm tracking-wider shadow-lg shadow-emerald-600/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>START PREDICTION &bull; {GAMES.find((g) => g.id === chosen)?.shortName}</span>
          </button>

          <span className="text-[10px] text-gray-400 font-mono-code">
            100% Real Live Sync &bull; 5-Engine Fusion &bull; High Winning Mode
          </span>
        </div>
      </div>
    </div>
  );
};
