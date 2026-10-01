import React from 'react';
import { GameType } from '../types';
import { GAMES } from '../utils/lotteryEngine';
import { Flame, Clock, Radio, Dices } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

interface GameSelectorProps {
  selectedGame: GameType;
  onSelectGame: (game: GameType) => void;
}

export const GameSelector: React.FC<GameSelectorProps> = ({
  selectedGame,
  onSelectGame
}) => {
  const getIcon = (id: GameType) => {
    switch (id) {
      case 'WINGO_30S':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'WINGO_1M':
        return <Flame className="w-3.5 h-3.5 text-[#10b981]" />;
      case 'WINGO_3M':
        return <Clock className="w-3.5 h-3.5 text-emerald-400" />;
      case 'WINGO_5M':
        return <Clock className="w-3.5 h-3.5 text-purple-400" />;
      case 'TRX_1M':
        return <Radio className="w-3.5 h-3.5 text-cyan-400" />;
      case 'K3_1M':
        return <Dices className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  return (
    <div className="w-full bg-[#0b1220] p-1.5 rounded-2xl border border-[#1e293b]/90 shadow-inner">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {GAMES.map((game) => {
          const isActive = game.id === selectedGame;
          return (
            <button
              key={game.id}
              type="button"
              onClick={() => {
                if (!isActive) {
                  soundManager.playTick();
                  onSelectGame(game.id);
                }
              }}
              className={`relative flex flex-col justify-between p-2 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-b from-[#064e3b]/80 to-[#0c1f24] border border-[#10b981] shadow-lg shadow-emerald-950/60'
                  : 'bg-[#0f172a]/60 border border-transparent hover:bg-[#162238] hover:border-gray-700/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div
                  className={`p-1 rounded-md ${
                    isActive ? 'bg-[#10b981]/20 text-[#4ade80]' : 'bg-gray-800/60 text-gray-400'
                  }`}
                >
                  {getIcon(game.id)}
                </div>
                <span
                  className={`text-[8px] font-bold px-1 py-0.2 rounded font-mono-code ${
                    isActive ? 'bg-[#10b981] text-black font-extrabold' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {game.durationSec}s
                </span>
              </div>

              <div>
                <div
                  className={`font-orbitron text-[11px] font-bold leading-tight truncate ${
                    isActive ? 'text-white' : 'text-gray-300'
                  }`}
                >
                  {game.shortName}
                </div>
                <div className="text-[9px] text-gray-400 font-mono-code truncate">
                  {game.isK3 ? 'Sum 3-18' : '0-9 Digits'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
