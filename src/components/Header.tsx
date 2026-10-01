import React from 'react';
import { Volume2, VolumeX, Terminal } from 'lucide-react';

interface HeaderProps {
  latencyMs: number;
  isOnline: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenInspector: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  latencyMs,
  isOnline,
  soundEnabled,
  onToggleSound,
  onOpenInspector
}) => {
  return (
    <header className="w-full bg-[#0a0f1d]/95 border-b border-[#1e293b] backdrop-blur-md sticky top-0 z-40 px-3 py-2.5 sm:px-6">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] via-[#0ea5e9] to-[#fbbf24] p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center">
              <span className="font-orbitron text-lg font-black text-[#4ade80]">渦</span>
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22c55e]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-orbitron font-black text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#4ade80] via-[#38bdf8] to-[#fbbf24]">
                NARUTO UZUMAKI V2
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#4ade80] border border-[#10b981]/40 uppercase tracking-wider">
                V2 INTEL
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono-code flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className={isOnline ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                {isOnline ? 'LIVE API TUNNEL' : 'CONNECTING...'}
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-cyan-400">{latencyMs}ms</span>
            </p>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
            className="p-2 rounded-xl bg-[#162238] border border-[#1e293b] text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#38bdf8]" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>

          {/* Live Data Inspector */}
          <button
            type="button"
            onClick={onOpenInspector}
            title="Open Data Tunnel Inspector"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#162238] border border-[#1e293b] text-gray-300 hover:text-[#4ade80] transition-colors text-xs font-semibold cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-[#4ade80]" />
            <span className="hidden sm:inline">DATA TUNNEL</span>
          </button>
        </div>
      </div>
    </header>
  );
};
