import React from 'react';
import { Volume2, VolumeX, Terminal, Crown } from 'lucide-react';
import { AuthUser, ADMIN_MOBILE } from '../utils/authDatabase';

interface HeaderProps {
  latencyMs: number;
  isOnline: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenInspector: () => void;
  authUser?: AuthUser | null;
}

export const Header: React.FC<HeaderProps> = ({
  latencyMs,
  isOnline,
  soundEnabled,
  onToggleSound,
  onOpenInspector,
  authUser
}) => {
  return (
    <header className="w-full bg-[#080d1a]/95 border-b border-[#1e293b] backdrop-blur-md sticky top-0 z-40 px-3 py-1.5 sm:px-5">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
        {/* Compact Logo & Title (Thoda Chhota kiya gaya) */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b00] via-[#38bdf8] to-[#fbbf24] p-0.5 shadow-md shadow-orange-500/20 shrink-0">
            <div className="w-full h-full bg-[#080d1a] rounded-[6px] flex items-center justify-center">
              <span className="font-orbitron text-sm font-black text-[#ff8c00]">渦</span>
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-orbitron font-extrabold text-xs sm:text-sm tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#ff8c00] via-[#38bdf8] to-[#fbbf24]">
                NARUTO UZUMAKI V2
              </h1>
              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5 text-amber-400" />
                <span>ADMIN</span>
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono-code flex items-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className={isOnline ? 'text-emerald-400 font-medium' : 'text-rose-400'}>
                {isOnline ? 'LIVE API TUNNEL' : 'CONNECTING...'}
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-cyan-400">{latencyMs}ms</span>
            </p>
          </div>
        </div>

        {/* Compact Right Actions */}
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono-code bg-[#101726] border border-amber-500/40 px-1.5 py-0.5 rounded-md text-amber-300 shadow-xs">
            <Crown className="w-3 h-3 text-amber-400" />
            <span className="font-bold">{ADMIN_MOBILE}</span>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
            className="p-1.5 rounded-lg bg-[#142036] border border-[#1e293b] text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#38bdf8]" /> : <VolumeX className="w-3.5 h-3.5 text-gray-500" />}
          </button>

          {/* Live Data Inspector */}
          <button
            type="button"
            onClick={onOpenInspector}
            title="Open Data Tunnel Inspector"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#142036] border border-[#1e293b] text-gray-300 hover:text-[#4ade80] transition-colors text-[10px] font-semibold cursor-pointer"
          >
            <Terminal className="w-3 h-3 text-[#4ade80]" />
            <span className="hidden sm:inline">DATA</span>
          </button>
        </div>
      </div>
    </header>
  );
};
