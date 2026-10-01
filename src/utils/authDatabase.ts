/**
 * NARUTO ACCESS CONTROL & AUTOMATIC BACKGROUND VERIFICATION MODULE
 * Default Instant Auto-Verification for Admin ID (655675576694)
 * Runs seamlessly in background with zero blocking pop-ups!
 */

export interface AuthUser {
  mobile: string;
  uid?: string;
  registered: boolean;
  deposit: number;
  vipTier: string;
  name?: string;
  role: 'ADMIN' | 'VIP_USER';
  loginTime: number;
}

export const ADMIN_MOBILE = '655675576694';
export const REFERRAL_URL = 'https://bdgwincf.com/#/register?invitationCode=4148715921265';
export const INVITATION_CODE = '4148715921265';

export const DEFAULT_ADMIN_USER: AuthUser = {
  mobile: ADMIN_MOBILE,
  uid: 'ADMIN-ROOT-001',
  registered: true,
  deposit: 999999,
  vipTier: 'MASTER ADMIN',
  name: 'System Administrator',
  role: 'ADMIN',
  loginTime: Date.now()
};

/* =========================================================================
   DEVELOPER INTEGRATION POINT: REPLACE WITH FIREBASE / BACKEND SERVER API
   ========================================================================= */
export const VERIFIED_DATABASE: Record<string, { uid: string; registered: boolean; deposit: number; name: string }> = {
  '9876543210': { uid: '839201', registered: true, deposit: 1500, name: 'VIP Trader 01' },
  '8888888888': { uid: '449102', registered: true, deposit: 800, name: 'Pro Member' },
  '9999999999': { uid: '110294', registered: true, deposit: 2500, name: 'Naruto VIP' },
  '7000000000': { uid: '782910', registered: true, deposit: 500, name: 'Standard Member' },
  '9123456780': { uid: '992018', registered: true, deposit: 5000, name: 'Elite Member' },
  '9000000000': { uid: '334910', registered: true, deposit: 200, name: 'Low Deposit User' }
};

const AUTH_STORAGE_KEY = 'NARUTO_AUTH_SESSION_USER';

/**
 * Validates 10-digit Indian mobile number format
 */
export function isValidIndianMobile(mobile: string): boolean {
  const cleaned = mobile.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Background verification function
 */
export async function verifyUserLogin(
  mobileInput: string,
  uidInput?: string
): Promise<{
  success: boolean;
  message: string;
  user?: AuthUser;
}> {
  const cleanedMobile = mobileInput.replace(/\D/g, '');
  const cleanedUid = uidInput?.trim() || '';

  // 1. ADMIN BYPASS: Default master login without any requirements
  if (cleanedMobile === ADMIN_MOBILE) {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_USER));
    } catch {
      // Safe
    }

    return {
      success: true,
      message: 'Admin Root Access Granted. All modules unlocked without restrictions.',
      user: DEFAULT_ADMIN_USER
    };
  }

  // 2. Regular User Verification Flow
  if (!isValidIndianMobile(cleanedMobile)) {
    return {
      success: false,
      message: 'Kripya valid 10-digit Indian Mobile Number enter karein (e.g. 9876543210).'
    };
  }

  if (!cleanedUid || cleanedUid.length < 4) {
    return {
      success: false,
      message: 'Kripya apna official Game UID enter karein (minimum 4 digits).'
    };
  }

  const record = VERIFIED_DATABASE[cleanedMobile];

  if (!record || !record.registered || record.deposit < 500) {
    const reason = !record
      ? 'Access Denied! Pehle official referral link se register karke minimum ₹500 deposit karein.'
      : record.deposit < 500
      ? `Access Denied! Aapka deposit sirf ₹${record.deposit} hai. Minimum ₹500 deposit verification zaroori hai.`
      : 'Access Denied! Pehle official link se register karke minimum ₹500 deposit karein.';

    return {
      success: false,
      message: reason
    };
  }

  if (record.uid && record.uid !== cleanedUid) {
    return {
      success: false,
      message: `UID Mismatch! Registered mobile number ke sath UID match nahi hui.`
    };
  }

  const verifiedUser: AuthUser = {
    mobile: cleanedMobile,
    uid: cleanedUid || record.uid,
    registered: true,
    deposit: record.deposit,
    vipTier: record.deposit >= 2000 ? 'GOLD VIP' : 'VERIFIED VIP',
    name: record.name,
    role: 'VIP_USER',
    loginTime: Date.now()
  };

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(verifiedUser));
  } catch {
    // Safe
  }

  return {
    success: true,
    message: 'Verification Complete! All VIP tabs and features unlocked.',
    user: verifiedUser
  };
}

/**
 * Gets currently logged in user session OR auto-verifies Admin ID (655675576694) in the background!
 * Ensures NO pop-ups interrupt the user and all features are immediately ON!
 */
export function getStoredOrAutoAdminUser(): AuthUser {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.mobile === ADMIN_MOBILE || (parsed.registered && parsed.deposit >= 500))) {
        return parsed as AuthUser;
      }
    }
  } catch {
    // Fallback
  }

  // Automatic seamless background verification for Admin ID 655675576694
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_USER));
  } catch {}
  return DEFAULT_ADMIN_USER;
}

/**
 * Logs out user and resets to default verified admin
 */
export function logoutUser(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Safe
  }
}

/**
 * Audio warning alert function
 */
export function playWarningAlarm(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const startT = now + i * 0.35;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, startT);
      osc.frequency.exponentialRampToValueAtTime(440, startT + 0.16);
      osc.frequency.exponentialRampToValueAtTime(880, startT + 0.32);

      gain.gain.setValueAtTime(0.35, startT);
      gain.gain.exponentialRampToValueAtTime(0.01, startT + 0.34);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startT);
      osc.stop(startT + 0.35);
    }
  } catch {
    // Graceful fallback
  }
}
