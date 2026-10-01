import React, { useState, useRef } from 'react';
import {
  Lock,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  Volume2,
  X,
  KeyRound,
  Crown,
  BadgeCheck,
  Sparkles
} from 'lucide-react';
import {
  AuthUser,
  REFERRAL_URL,
  INVITATION_CODE,
  ADMIN_MOBILE,
  verifyUserLogin,
  playWarningAlarm
} from '../utils/authDatabase';

interface LoginGateModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  targetFeatureName?: string;
}

export const LoginGateModal: React.FC<LoginGateModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  targetFeatureName = 'PRO TABS & TOOLS'
}) => {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [gameUid, setGameUid] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 15);
    setMobileNumber(val);
    if (errorMessage) setErrorMessage(null);

    // Auto-detect Admin Master Number
    if (val === ADMIN_MOBILE) {
      setIsAdminMode(true);
    }
  };

  const handleUidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 12);
    setGameUid(val);
    if (errorMessage) setErrorMessage(null);
  };

  // Quick 1-click Admin Master Login
  const handleQuickAdminLogin = async () => {
    setIsVerifying(true);
    setErrorMessage(null);
    const result = await verifyUserLogin(ADMIN_MOBILE);
    setIsVerifying(false);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying) return;

    setIsVerifying(true);
    setErrorMessage(null);

    // If Admin mode or number matches Admin Mobile, bypass all requirements
    const isTargetAdmin = isAdminMode || mobileNumber.trim() === ADMIN_MOBILE;

    const result = await verifyUserLogin(
      isTargetAdmin ? ADMIN_MOBILE : mobileNumber,
      isTargetAdmin ? 'ADMIN-ROOT' : gameUid
    );

    setIsVerifying(false);

    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setErrorMessage(result.message);

      // Trigger Audio Warning Siren
      playWarningAlarm();
      if (audioRef.current) {
        try {
          audioRef.current.currentTime = 0;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } catch {
          // Graceful audio handling
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Hidden Audio Track for warning */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YV4GAACBhYqFbF1fdJivrJBhNjVgodDbqWE2Mmih2+WzZDlAbaDT3qpnOTNpotzksGM7QW2g09+sZzg0aaLd5bFkO0BtoNPfqmc5NGmi3eWxZDtAbaDT36pnOTRpot3lsWQ7QG2g09+qZzk0aaLd5bFkOw=="
        preload="auto"
      />

      <div className="relative w-full max-w-md rounded-2xl bg-[#0a0f1d] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden p-5 sm:p-6 text-white flex flex-col gap-4">
        {/* Close Button (Allows user to return to Hack View freely) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#141d30] border border-gray-700/60 text-gray-400 hover:text-white transition-all cursor-pointer z-20"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Top Header & Mode Toggle */}
        <div className="text-center relative z-10 pt-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0ea5e9] to-[#10b981] text-black shadow-lg shadow-sky-950/60 mb-2">
            {isAdminMode ? <Crown className="w-6 h-6 text-amber-950" /> : <Lock className="w-6 h-6" />}
          </div>

          <h2 className="font-orbitron font-extrabold text-base sm:text-lg text-white tracking-wide">
            {isAdminMode ? 'ADMIN ROOT ACCESS' : 'VIP ACCESS VERIFICATION'}
          </h2>
          <p className="text-xs font-rajdhani text-gray-400 mt-0.5">
            {isAdminMode
              ? 'Default Master Account Authentication'
              : `Unlock ${targetFeatureName} (Registration, UID & Deposit Verified)`}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="mt-3 grid grid-cols-2 p-1 rounded-xl bg-[#060a14] border border-gray-800 text-xs font-mono-code">
            <button
              type="button"
              onClick={() => {
                setIsAdminMode(false);
                setErrorMessage(null);
              }}
              className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                !isAdminMode
                  ? 'bg-[#15233e] text-[#38bdf8] shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              VIP USER VERIFY
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdminMode(true);
                setMobileNumber(ADMIN_MOBILE);
                setErrorMessage(null);
              }}
              className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isAdminMode
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-sm'
                  : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>ADMIN LOGIN</span>
            </button>
          </div>
        </div>

        {/* Error Alert Box with Audio Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-mono-code flex items-start gap-2.5 shadow-lg shadow-red-950/50 animate-shake">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-red-400">ACCESS DENIED</span>
                <span className="flex items-center gap-1 text-[10px] text-red-300">
                  <Volume2 className="w-3 h-3 text-red-400 animate-pulse" />
                  <span>ALERT PLAYED</span>
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-200">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Form Body */}
        {isAdminMode ? (
          /* ================= ADMIN MASTER ACCESS ================= */
          <div className="flex flex-col gap-3 relative z-10">
            <div className="p-3.5 rounded-xl bg-[#091424] border border-amber-500/40 text-xs font-mono-code flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>DEFAULT ADMIN MOBILE:</span>
                </span>
                <span className="text-emerald-400 text-[10px] font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  ZERO REQUIREMENT
                </span>
              </div>

              <div className="bg-[#050811] border border-amber-500/30 rounded-lg p-2.5 text-center font-mono-code font-bold text-base text-amber-300 tracking-widest">
                {ADMIN_MOBILE}
              </div>

              <p className="text-[11px] text-gray-300 leading-normal">
                Yeh master admin number hai. Isme kisi registration ya deposit verification ki zaroorat nahi hai. Direct 100% full suite unlock hota hai.
              </p>
            </div>

            <button
              type="button"
              onClick={handleQuickAdminLogin}
              disabled={isVerifying}
              className="w-full py-3 px-4 rounded-xl font-orbitron font-extrabold text-sm tracking-wider uppercase transition-all shadow-lg cursor-pointer bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black hover:brightness-110 shadow-amber-950/60 active:scale-98 flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              <span>{isVerifying ? 'AUTHENTICATING ADMIN...' : 'LOGIN AS MASTER ADMIN'}</span>
            </button>
          </div>
        ) : (
          /* ================= 3-STEP USER VERIFICATION ================= */
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 relative z-10">
            {/* 3-Step Verification Checklist Indicator */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono-code">
              <div className="p-1.5 rounded-lg bg-[#0d1627] border border-cyan-800/50 text-cyan-300">
                <span className="font-bold block">1. REFERRAL</span>
                <span className="text-gray-400 text-[9px]">Code: {INVITATION_CODE.slice(0, 5)}..</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#0d1627] border border-cyan-800/50 text-cyan-300">
                <span className="font-bold block">2. GAME UID</span>
                <span className="text-gray-400 text-[9px]">Account Match</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#0d1627] border border-cyan-800/50 text-cyan-300">
                <span className="font-bold block">3. DEPOSIT</span>
                <span className="text-gray-400 text-[9px]">Min ₹500</span>
              </div>
            </div>

            {/* Input 1: Mobile Number */}
            <div>
              <label className="block text-xs font-mono-code text-gray-300 font-bold mb-1 flex items-center justify-between">
                <span>1. REGISTERED MOBILE NUMBER</span>
                <span className="text-[10px] text-cyan-400">INDIAN (+91)</span>
              </label>
              <div className="flex items-center bg-[#070c17] border border-gray-800 focus-within:border-cyan-400 rounded-xl px-3 py-2 transition-all">
                <Smartphone className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
                <span className="text-xs font-mono-code font-bold text-gray-400 mr-2 shrink-0">+91</span>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  required
                  className="w-full bg-transparent text-sm font-mono-code text-white focus:outline-none placeholder:text-gray-600 tracking-wider"
                />
              </div>
            </div>

            {/* Input 2: Game UID */}
            <div>
              <label className="block text-xs font-mono-code text-gray-300 font-bold mb-1 flex items-center justify-between">
                <span>2. OFFICIAL GAME UID NUMBER</span>
                <span className="text-[10px] text-emerald-400">BDG WIN UID</span>
              </label>
              <div className="flex items-center bg-[#070c17] border border-gray-800 focus-within:border-emerald-400 rounded-xl px-3 py-2 transition-all">
                <KeyRound className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={gameUid}
                  onChange={handleUidChange}
                  placeholder="Enter your Game UID (e.g. 839201)"
                  maxLength={10}
                  required
                  className="w-full bg-transparent text-sm font-mono-code text-white focus:outline-none placeholder:text-gray-600 tracking-wider"
                />
              </div>
            </div>

            {/* Submit Verification Button */}
            <button
              type="submit"
              disabled={isVerifying || mobileNumber.length !== 10 || gameUid.length < 4}
              className={`w-full py-2.5 px-4 rounded-xl font-orbitron font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg cursor-pointer ${
                mobileNumber.length === 10 && gameUid.length >= 4 && !isVerifying
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-black hover:brightness-110 shadow-cyan-950/60 active:scale-98'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              {isVerifying ? 'VERIFYING CREDENTIALS...' : 'VERIFY & UNLOCK PRO TABS'}
            </button>

            {/* Registration Link Button */}
            <div className="pt-2 border-t border-gray-800/80 flex flex-col gap-1.5">
              <a
                href={REFERRAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#0f192b] border border-cyan-500/50 hover:bg-cyan-950/40 text-cyan-300 hover:text-white text-xs font-orbitron font-bold transition-all text-center"
              >
                <span>REGISTER WITH OFFICIAL CODE</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="text-center text-[10px] font-mono-code text-gray-500">
                Official Invitation Code: <span className="text-gray-200 font-bold">{INVITATION_CODE}</span>
              </div>
            </div>

            {/* Demo Verification Helper */}
            <div className="p-2 rounded-lg bg-[#060a14] border border-gray-800 text-[10px] font-mono-code text-gray-400 text-center">
              <span>Demo Verified: </span>
              <button
                type="button"
                onClick={() => {
                  setMobileNumber('9876543210');
                  setGameUid('839201');
                }}
                className="text-cyan-400 underline font-bold cursor-pointer"
              >
                Mobile: 9876543210 | UID: 839201
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
