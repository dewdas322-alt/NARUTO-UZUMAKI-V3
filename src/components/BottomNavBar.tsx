import React from 'react';
import { Globe, Shield, Cpu } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

export type TabType = 'predict' | 'engines' | 'webpage';

interface BottomNavBarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d18]/95 border-t border-[#1e293b] backdrop-blur-xl px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-around gap-2">
        {/* Webpage Tab (Opens directly inside the web app) */}
        <button
          type="button"
          onClick={() => {
            soundManager.playTick();
            onSelectTab('webpage');
          }}
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all cursor-pointer ${
            currentTab === 'webpage'
              ? 'bg-[#14233d] text-[#38bdf8] border border-[#0284c7]/50 shadow-md shadow-sky-950/60'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Globe className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-mono-code font-bold tracking-tight">Webpage</span>
        </button>

        {/* Hack / Predict Tab (Exact Screenshot Style: Shield Icon + Pill) */}
        <button
          type="button"
          onClick={() => {
            soundManager.playTick();
            onSelectTab('predict');
          }}
          className={`flex flex-col items-center justify-center py-1 px-5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'predict'
              ? 'bg-[#14233d] text-[#38bdf8] border border-[#0284c7]/50 shadow-md shadow-sky-950/60'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Shield className="w-5 h-5 mb-1 fill-current/20" />
          <span className="text-[11px] font-mono-code font-bold tracking-tight">Hack / Predict</span>
        </button>

        {/* AI Engines Tab (Preserving all 5 AI engines view) */}
        <button
          type="button"
          onClick={() => {
            soundManager.playTick();
            onSelectTab('engines');
          }}
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all cursor-pointer ${
            currentTab === 'engines'
              ? 'bg-[#14233d] text-[#4ade80] border border-[#10b981]/50 shadow-md shadow-emerald-950/60'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Cpu className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-mono-code font-bold tracking-tight">AI Engines</span>
        </button>
      </div>
    </nav>
  );
};
