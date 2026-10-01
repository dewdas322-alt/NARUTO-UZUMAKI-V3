import React from 'react';
import { Globe, Shield, Cpu } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

export type TabType = 'predict' | 'engines' | 'webpage';

interface BottomNavBarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isVerified?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  isVerified = true
}) => {
  const handleTabClick = (tab: TabType) => {
    soundManager.playTick();
    onSelectTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d18]/95 border-t border-[#1e293b] backdrop-blur-xl px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-around gap-2">
        {/* 1. Webpage Tab: Direct In-App Game View with Top Live Prediction Stream */}
        <button
          type="button"
          onClick={() => handleTabClick('webpage')}
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all cursor-pointer ${
            currentTab === 'webpage'
              ? 'bg-[#14233d] text-[#38bdf8] border border-[#0284c7]/50 shadow-md shadow-sky-950/60'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Globe className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-mono-code font-bold tracking-tight">Webpage</span>
        </button>

        {/* 2. Hack / Predict Tab: Live Signals & Martingale Level Calculation */}
        <button
          type="button"
          onClick={() => handleTabClick('predict')}
          className={`flex flex-col items-center justify-center py-1 px-5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'predict'
              ? 'bg-[#14233d] text-[#38bdf8] border border-[#0284c7]/50 shadow-md shadow-sky-950/60'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Shield className="w-5 h-5 mb-1 fill-current/20" />
          <span className="text-[11px] font-mono-code font-bold tracking-tight">Hack / Predict</span>
        </button>

        {/* 3. AI Engines Tab: 5-Engine Deep Intelligence Analysis */}
        <button
          type="button"
          onClick={() => handleTabClick('engines')}
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
