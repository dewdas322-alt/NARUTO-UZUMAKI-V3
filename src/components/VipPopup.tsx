import React from 'react';
import { Crown, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

interface VipPopupProps {
  isOpen: boolean;
  onClose: () => void;
  winCount: number;
}

export const VipPopup: React.FC<VipPopupProps> = ({ isOpen, onClose, winCount }) => {
  if (!isOpen) return null;

  return (
    <div
      id="vip-popup"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-[#0c1220] border-2 border-[#10b981] rounded-2xl p-6 shadow-2xl shadow-emerald-500/30 text-center overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#10b981]/25 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-gray-800/80 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Crown & Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#10b981] via-[#0ea5e9] to-[#fbbf24] p-0.5 shadow-xl shadow-emerald-500/40 flex items-center justify-center mb-4 animate-bounce">
          <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex items-center justify-center">
            <Crown className="w-8 h-8 text-[#ffd700]" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[#4ade80] text-xs font-mono-code font-bold mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          5-WIN STREAK UNLOCKED
        </div>

        <h3 className="font-orbitron font-black text-xl sm:text-2xl text-white tracking-wider mb-2">
          TARGET ACHIEVED!
        </h3>

        <p className="text-gray-300 text-xs sm:text-sm font-rajdhani mb-5 leading-relaxed">
          Outstanding performance! You hit <span className="text-[#38bdf8] font-bold">{winCount} consecutive wins</span> using the NARUTO UZUMAKI V2 5-Engine AI Fusion system. Keep playing to maximize your profit run!
        </p>

        {/* Action Button */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundManager.playWin();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] text-black font-orbitron font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>CONTINUE WINNING STREAK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
