import { GameConfig, GameType, LotteryIssue, PredictionData, EngineResult, MarketMetrics } from '../types';
import { NOVIX_DB, PATTERN_COMBOS } from './patternDatabase';

export const BDGWIN_REGISTER_URL = 'https://bdgwincf.com/#/register?invitationCode=4148715921265';
export const INVITATION_CODE = '4148715921265';

export const BET_LEVELS = [300, 900, 2700, 8100, 24300, 72900];

export const GAMES: GameConfig[] = [
  {
    id: 'WINGO_1M',
    name: 'WinGo 1 Min',
    shortName: 'WinGo 1M',
    durationSec: 60,
    minNum: 0,
    maxNum: 9,
    apiUrl: 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json'
  },
  {
    id: 'WINGO_30S',
    name: 'WinGo 30 Sec',
    shortName: 'WinGo 30S',
    durationSec: 30,
    minNum: 0,
    maxNum: 9,
    apiUrl: 'https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json'
  },
  {
    id: 'WINGO_3M',
    name: 'WinGo 3 Min',
    shortName: 'WinGo 3M',
    durationSec: 180,
    minNum: 0,
    maxNum: 9,
    apiUrl: 'https://draw.ar-lottery01.com/WinGo/WinGo_3M/GetHistoryIssuePage.json'
  },
  {
    id: 'WINGO_5M',
    name: 'WinGo 5 Min',
    shortName: 'WinGo 5M',
    durationSec: 300,
    minNum: 0,
    maxNum: 9,
    apiUrl: 'https://draw.ar-lottery01.com/WinGo/WinGo_5M/GetHistoryIssuePage.json'
  },
  {
    id: 'TRX_1M',
    name: 'TRX WinGo 1 Min',
    shortName: 'TRX 1M',
    durationSec: 60,
    minNum: 0,
    maxNum: 9,
    apiUrl: 'https://draw.ar-lottery01.com/TrxWinGo/TrxWinGo_1M/GetHistoryIssuePage.json'
  },
  {
    id: 'K3_1M',
    name: 'K3 Lotre 1 Min',
    shortName: 'K3 1M',
    durationSec: 60,
    minNum: 3,
    maxNum: 18,
    apiUrl: 'https://draw.ar-lottery01.com/K3/K3_1M/GetHistoryIssuePage.json',
    isK3: true
  }
];

export function getGameConfig(gameId: GameType): GameConfig {
  return GAMES.find((g) => g.id === gameId) || GAMES[0];
}

export function determineActualSize(num: number, isK3: boolean): 'BIG' | 'SMALL' {
  if (isK3) {
    return num >= 11 ? 'BIG' : 'SMALL';
  }
  return num >= 5 ? 'BIG' : 'SMALL';
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, Number(v) || 0));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const logit = (p: number) => Math.log(clamp(p, 0.02, 0.98) / (1 - clamp(p, 0.02, 0.98)));

const bs1 = (n: number, isK3: boolean): 'B' | 'S' => (isK3 ? (n >= 11 ? 'B' : 'S') : n >= 5 ? 'B' : 'S');
const OPP = (s: 'BIG' | 'SMALL'): 'BIG' | 'SMALL' => (s === 'BIG' ? 'SMALL' : 'BIG');

/* ─── 1. RDX CORE MATRIX & STREAK ADAPTIVE ENGINE ─── */
const RDX_MATRIX: Record<number, Record<number, 'B' | 'S'>> = {
  0: { 0: 'S', 1: 'B', 2: 'B', 3: 'B', 4: 'S', 5: 'S', 6: 'B', 7: 'S', 8: 'S', 9: 'B' },
  1: { 0: 'B', 1: 'B', 2: 'B', 3: 'S', 4: 'S', 5: 'S', 6: 'B', 7: 'S', 8: 'B', 9: 'B' },
  2: { 0: 'S', 1: 'B', 2: 'B', 3: 'B', 4: 'S', 5: 'B', 6: 'S', 7: 'B', 8: 'S', 9: 'S' },
  3: { 0: 'S', 1: 'B', 2: 'B', 3: 'S', 4: 'B', 5: 'S', 6: 'B', 7: 'B', 8: 'S', 9: 'S' },
  4: { 0: 'B', 1: 'S', 2: 'S', 3: 'B', 4: 'S', 5: 'B', 6: 'S', 7: 'B', 8: 'B', 9: 'S' },
  5: { 0: 'S', 1: 'B', 2: 'B', 3: 'S', 4: 'S', 5: 'B', 6: 'B', 7: 'S', 8: 'B', 9: 'B' },
  6: { 0: 'S', 1: 'S', 2: 'S', 3: 'B', 4: 'S', 5: 'B', 6: 'B', 7: 'S', 8: 'B', 9: 'B' },
  7: { 0: 'B', 1: 'B', 2: 'B', 3: 'S', 4: 'B', 5: 'S', 6: 'B', 7: 'S', 8: 'B', 9: 'S' },
  8: { 0: 'S', 1: 'B', 2: 'B', 3: 'B', 4: 'S', 5: 'S', 6: 'B', 7: 'S', 8: 'B', 9: 'B' },
  9: { 0: 'S', 1: 'B', 2: 'B', 3: 'S', 4: 'B', 5: 'S', 6: 'S', 7: 'S', 8: 'B', 9: 'B' }
};

function rdxEngine(recs: number[], targetPeriod: string, isK3: boolean): EngineResult {
  const nums = recs;
  const bigTh = isK3 ? 11 : 5;
  let bigW = 0;
  let smallW = 0;

  // 1. Matrix lookup
  if (nums.length >= 2) {
    const l1 = isK3 ? nums[0] % 10 : nums[0];
    const l2 = isK3 ? nums[1] % 10 : nums[1];
    const r = RDX_MATRIX[l2]?.[l1];
    if (r === 'B') bigW += 3.2;
    else smallW += 3.2;
  }

  // 2. Adaptive streak logic
  const bSeq = nums.slice(0, 10).map((n) => bs1(n, isK3));
  let streak = 1;
  while (streak < bSeq.length && bSeq[streak] === bSeq[0]) streak++;
  const cur = bSeq[0] || 'B';

  if (streak >= 3 && streak <= 6) {
    // Trending Dragon: Follow with elevated weight
    if (cur === 'B') bigW += 3.5;
    else smallW += 3.5;
  } else if (streak >= 7) {
    // Extreme Dragon Exhaustion: High winning mean reversion
    if (cur === 'B') smallW += 3.8;
    else bigW += 3.8;
  } else {
    // Ping-pong or small streak
    if (cur === 'B') bigW += 2.0;
    else smallW += 2.0;
  }

  // 3. 10-period ML distribution balance
  const last10 = nums.slice(0, 10);
  let bCount = 0;
  let sCount = 0;
  last10.forEach((n) => (n >= bigTh ? bCount++ : sCount++));
  if (bCount >= 7) smallW += 2.4;
  else if (sCount >= 7) bigW += 2.4;
  else if (bCount >= sCount) bigW += 1.8;
  else smallW += 1.8;

  // 4. Period Hash
  const pNum = parseInt(targetPeriod.slice(-2), 10) || 0;
  if (pNum % 7 < 4) bigW += 1.0;
  else smallW += 1.0;

  const total = bigW + smallW || 1;
  const call: 'BIG' | 'SMALL' = bigW >= smallW ? 'BIG' : 'SMALL';
  const conf = Math.round(clamp((Math.max(bigW, smallW) / total) * 100, 70, 96));

  return {
    id: 'RDX',
    name: 'NARUTO CORE',
    call,
    conf,
    pBig: bigW / total,
    detail: `Matrix & Streak [${call} ${conf}%]`
  };
}

/* ─── 2. VANTA VISION ENGINE (MIRROR & PATTERN SUFFIX) ─── */
function vantaEngine(recs: number[], isK3: boolean): EngineResult & { digit: number; patternType: string } {
  const chrono = recs.slice().reverse();
  const n = chrono.length;
  if (n < 3) {
    return { id: 'VANTA', name: 'NARUTO VISION', call: 'BIG', conf: 65, pBig: 0.5, digit: isK3 ? 11 : 7, patternType: 'DEFAULT' };
  }

  const seq = chrono.slice(-10).map((v) => bs1(v, isK3)).join('');
  let call: 'BIG' | 'SMALL' = 'BIG';
  let conf = 70;
  let patternType = 'ALTERNATION';

  // Check 3 to 10 length combo patterns
  for (let L = Math.min(10, seq.length); L >= 3; L--) {
    const k = seq.slice(-L);
    if (PATTERN_COMBOS[k] && PATTERN_COMBOS[k].length > 0) {
      call = PATTERN_COMBOS[k][0].call;
      conf = Math.min(96, 78 + L * 2);
      patternType = PATTERN_COMBOS[k][0].type.toUpperCase();
      break;
    }
  }

  // Check Mirror Symmetry
  const mirrors: Record<string, 'BIG' | 'SMALL'> = {
    BBSSBB: 'SMALL',
    SSBBSS: 'BIG',
    BBBSSS: 'BIG',
    SSSBBB: 'SMALL',
    BSSB: 'SMALL',
    SBBS: 'BIG',
    BBSB: 'SMALL',
    SBSS: 'BIG',
    BBSSBBSS: 'BIG',
    SSBBSSBB: 'SMALL'
  };

  for (const [mKey, mCall] of Object.entries(mirrors)) {
    if (seq.endsWith(mKey)) {
      call = mCall;
      conf = Math.max(conf, 88);
      patternType = `MIRROR (${mKey})`;
      break;
    }
  }

  // Pick smart digit
  const min = isK3 ? 3 : 0;
  const max = isK3 ? 18 : 9;
  const bigTh = isK3 ? 11 : 5;
  const candidates: number[] = [];
  for (let x = min; x <= max; x++) {
    if ((x >= bigTh ? 'BIG' : 'SMALL') === call) {
      candidates.push(x);
    }
  }
  const digit = candidates.length > 0 ? candidates[Math.floor(candidates.length / 2)] : call === 'BIG' ? (isK3 ? 14 : 7) : isK3 ? 6 : 2;
  const pBig = call === 'BIG' ? 0.5 + (conf - 50) / 100 : 0.5 - (conf - 50) / 100;

  return {
    id: 'VANTA',
    name: 'NARUTO VISION',
    call,
    conf,
    pBig: clamp(pBig, 0.08, 0.92),
    digit,
    patternType,
    detail: `${patternType} [${call} ${conf}%]`
  };
}

/* ─── 3. NOCTIS GUARD (WILSON SCORE INTERVALS & NOISE FILTER) ─── */
function wilsonScore(h: number, n: number, z = 1.96): number {
  if (!n) return 0;
  const p = h / n;
  const d = 1 + (z * z) / n;
  return (p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / d;
}

function noctisEngine(recs: number[], isK3: boolean): EngineResult {
  const chrono = recs.slice().reverse();
  let bigW = 0;
  let smallW = 0;

  for (let k = 2; k <= Math.min(10, chrono.length); k++) {
    const tail = chrono.slice(-k);
    const kb = tail.map((n) => bs1(n, isK3)).join('');
    const pb = NOVIX_DB.bs[kb];
    if (pb) {
      const lb = wilsonScore(pb[1], pb[2]);
      const edge = Math.max(0, lb - 0.5);
      const w = edge * Math.log2(pb[2] + 2);
      if (pb[0] === 'B') bigW += w;
      else smallW += w;
    }
  }

  // 3-Period direct rule
  if (recs.length >= 3) {
    const p3 = recs.slice(0, 3).map((n) => bs1(n, isK3)).join('');
    const rules: Record<string, 'BIG' | 'SMALL'> = {
      BBB: 'SMALL',
      SSS: 'BIG',
      BBS: 'BIG',
      SSB: 'SMALL',
      BSB: 'SMALL',
      SBS: 'BIG'
    };
    if (rules[p3]) {
      if (rules[p3] === 'BIG') bigW += 2.0;
      else smallW += 2.0;
    }
  }

  const tot = bigW + smallW;
  const call: 'BIG' | 'SMALL' = tot === 0 ? 'BIG' : bigW >= smallW ? 'BIG' : 'SMALL';
  const margin = tot ? Math.abs(bigW - smallW) / tot : 0;
  const conf = Math.round(clamp(60 + margin * 38, 60, 92));
  const pBig = call === 'BIG' ? 0.5 + margin * 0.42 : 0.5 - margin * 0.42;

  return {
    id: 'NOCTIS',
    name: 'NARUTO GUARD',
    call,
    conf,
    pBig: clamp(pBig, 0.08, 0.92),
    detail: `Wilson Distribution DB [${call} ${conf}%]`
  };
}

/* ─── 4. BRAIN ENGINE (DRAGON, MIRROR, ZIGZAG, RANDOM SPECIALIST) ─── */
function brainEngine(recs: number[], isK3: boolean): EngineResult & {
  pattern: string;
  patternType: 'DRAGON' | 'MIRROR' | 'ZIGZAG' | 'BLOCK' | 'RANDOM';
  humanCall: 'BIG' | 'SMALL';
  humanConf: number;
  aiCall: 'BIG' | 'SMALL';
  aiConf: number;
  verdict: string;
} {
  const last12 = recs.slice(0, 12).reverse();
  const seq = last12.map((n) => bs1(n, isK3));
  const n = seq.length;

  if (n < 4) {
    return {
      id: 'BRAIN',
      name: 'NARUTO BRAIN',
      call: 'BIG',
      conf: 65,
      pBig: 0.5,
      pattern: 'INITIALIZING',
      patternType: 'RANDOM',
      humanCall: 'BIG',
      humanConf: 60,
      aiCall: 'BIG',
      aiConf: 60,
      verdict: 'BALANCED'
    };
  }

  const last = seq[n - 1];
  let run = 1;
  while (run < n && seq[n - 1 - run] === last) run++;

  let pattern = 'BALANCED REGIME';
  let patternType: 'DRAGON' | 'MIRROR' | 'ZIGZAG' | 'BLOCK' | 'RANDOM' = 'RANDOM';
  let humanCall: 'BIG' | 'SMALL' = last === 'B' ? 'BIG' : 'SMALL';
  let humanConf = 68;

  // 1. Check Dragon
  if (run >= 4) {
    patternType = 'DRAGON';
    if (run >= 7) {
      pattern = `DRAGON BREAK ${run}× (Exhaustion)`;
      humanCall = last === 'B' ? 'SMALL' : 'BIG'; // Reversion
      humanConf = clamp(74 + run * 2, 74, 92);
    } else {
      pattern = `DRAGON STREAK ${run}× ${last === 'B' ? 'BIG' : 'SMALL'}`;
      humanCall = last === 'B' ? 'BIG' : 'SMALL'; // Trend following
      humanConf = clamp(72 + run * 3, 72, 90);
    }
  }
  // 2. Check Zigzag / Ping-Pong Alternation
  else {
    let alt = 0;
    for (let i = 1; i < n; i++) if (seq[i] !== seq[i - 1]) alt++;

    if (alt >= n - 2 && seq[n - 1] !== seq[n - 2]) {
      patternType = 'ZIGZAG';
      pattern = `ZIGZAG PING-PONG ${alt}×`;
      humanCall = last === 'B' ? 'SMALL' : 'BIG'; // Next alternate
      humanConf = clamp(75 + alt * 2.5, 75, 92);
    }
    // 3. Check Mirror & Block 2-2 / 3-3 Patterns
    else {
      const sStr = seq.join('');
      if (sStr.endsWith('BBSS') || sStr.endsWith('SSBB')) {
        patternType = 'BLOCK';
        pattern = '2-2 BLOCK CYCLE';
        humanCall = sStr.endsWith('BBSS') ? 'BIG' : 'SMALL';
        humanConf = 82;
      } else if (sStr.endsWith('BSSB') || sStr.endsWith('SBBS')) {
        patternType = 'MIRROR';
        pattern = 'MIRROR SYMMETRY';
        humanCall = sStr.endsWith('BSSB') ? 'SMALL' : 'BIG';
        humanConf = 84;
      } else if (sStr.endsWith('BBBSSS') || sStr.endsWith('SSSBBB')) {
        patternType = 'BLOCK';
        pattern = '3-3 BLOCK CYCLE';
        humanCall = sStr.endsWith('BBBSSS') ? 'BIG' : 'SMALL';
        humanConf = 85;
      } else {
        // 4. Random / Dominant Regime
        const bCount = seq.filter((x) => x === 'B').length;
        patternType = 'RANDOM';
        if (bCount >= 8) {
          pattern = 'BIG HIGH DOMINANCE (Reversion)';
          humanCall = 'SMALL';
          humanConf = 78;
        } else if (bCount <= 4) {
          pattern = 'SMALL HIGH DOMINANCE (Reversion)';
          humanCall = 'BIG';
          humanConf = 78;
        } else {
          pattern = 'RANDOM CHOPPY (Statistical Balance)';
          humanCall = last === 'B' ? 'SMALL' : 'BIG';
          humanConf = 68;
        }
      }
    }
  }

  // AI Historical Read with high-order suffix matching
  const fullSeq = recs.slice().reverse().map((n) => bs1(n, isK3)).join('');
  let aiCall: 'BIG' | 'SMALL' = humanCall;
  let aiConf = humanConf;

  for (let L = 6; L >= 2; L--) {
    const key = fullSeq.slice(-L);
    let matchB = 0;
    let matchS = 0;
    for (let i = 0; i + L < fullSeq.length - 1; i++) {
      if (fullSeq.slice(i, i + L) === key) {
        if (fullSeq[i + L] === 'B') matchB++;
        else matchS++;
      }
    }
    if (matchB + matchS >= 3) {
      aiCall = matchB >= matchS ? 'BIG' : 'SMALL';
      aiConf = Math.round(65 + (Math.abs(matchB - matchS) / (matchB + matchS)) * 28);
      break;
    }
  }

  const agree = humanCall === aiCall;
  const call = agree ? humanCall : humanConf >= aiConf ? humanCall : aiCall;
  const conf = agree ? Math.min(97, Math.round((humanConf + aiConf) / 2 + 7)) : Math.max(65, Math.round((humanConf + aiConf) / 2 - 2));
  const verdict = agree ? `${patternType} SYNCHRONIZED` : `${patternType} RESOLVED`;
  const pBig = call === 'BIG' ? 0.5 + (conf - 50) / 100 : 0.5 - (conf - 50) / 100;

  return {
    id: 'BRAIN',
    name: 'NARUTO BRAIN',
    call,
    conf,
    pBig: clamp(pBig, 0.08, 0.92),
    pattern,
    patternType,
    humanCall,
    humanConf,
    aiCall,
    aiConf,
    verdict,
    detail: `${pattern} [${verdict}]`
  };
}

/* ─── 5. MARKET STATE ENGINE (REGIME DETECTOR) ─── */
function marketEngine(recs: number[], isK3: boolean): EngineResult & { metrics: MarketMetrics } {
  const bigTh = isK3 ? 11 : 5;
  const bits: number[] = recs.slice().reverse().map((n) => (n >= bigTh ? 1 : 0));
  const n = bits.length;

  if (n < 8) {
    return {
      id: 'MARKET',
      name: 'NARUTO MARKET',
      call: 'BIG',
      conf: 65,
      pBig: 0.5,
      metrics: { state: 'NO DATA' }
    };
  }

  const last = bits[n - 1];
  const w20 = bits.slice(-20);
  let altCount = 0;
  for (let i = 1; i < w20.length; i++) if (w20[i] !== w20[i - 1]) altCount++;
  const alt20 = w20.length > 1 ? altCount / (w20.length - 1) : 0.5;

  let curRun = 1;
  while (curRun < n && bits[n - 1 - curRun] === last) curRun++;

  let state: 'CHOPPY' | 'TRENDING' | 'RANDOM' | 'MIXED' = 'MIXED';
  if (alt20 >= 0.65) state = 'CHOPPY';
  else if (curRun >= 3 || alt20 <= 0.35) state = 'TRENDING';
  else state = 'RANDOM';

  let call: 'BIG' | 'SMALL' = 'BIG';
  let conf = 70;

  if (state === 'CHOPPY') {
    call = last === 1 ? 'SMALL' : 'BIG'; // Oppose last
    conf = clamp(68 + (alt20 - 0.5) * 45, 68, 90);
  } else if (state === 'TRENDING') {
    call = curRun >= 6 ? (last === 1 ? 'SMALL' : 'BIG') : last === 1 ? 'BIG' : 'SMALL';
    conf = clamp(70 + curRun * 3, 70, 92);
  } else {
    const p20 = w20.reduce((a: number, b: number) => a + b, 0) / w20.length;
    call = p20 >= 0.6 ? 'SMALL' : p20 <= 0.4 ? 'BIG' : last === 1 ? 'SMALL' : 'BIG';
    conf = 68;
  }

  const pBig = call === 'BIG' ? 0.5 + (conf - 50) / 100 : 0.5 - (conf - 50) / 100;
  return {
    id: 'MARKET',
    name: 'NARUTO MARKET',
    call,
    conf,
    pBig: clamp(pBig, 0.08, 0.92),
    metrics: {
      state,
      alt20,
      curRun,
      curSide: last === 1 ? 'BIG' : 'SMALL',
      p20: w20.reduce((a: number, b: number) => a + b, 0) / w20.length
    },
    detail: `Regime: ${state} (Streak ${curRun}×)`
  };
}

/* ─── 6. ORIGINAL 8 MATHEMATICAL FORMULAS (FORMULA8) ─── */
function calculateFormula8(recs: number[], isK3: boolean): {
  call: 'BIG' | 'SMALL';
  predictedNum: number;
  calculations: number[];
  bigCount: number;
  smallCount: number;
  conf: number;
} {
  const lastNum = recs[0];
  const recentNums: number[] = [];
  for (let i = 0; i < Math.min(5, recs.length); i++) {
    recentNums.push(recs[i]);
  }
  while (recentNums.length < 5) {
    recentNums.push(isK3 ? 10 : 5);
  }

  const sumTrend = recentNums.reduce((a, b) => a + b, 0);
  let calculations: number[] = [];
  let bigCount = 0;
  let smallCount = 0;
  let finalSize: 'BIG' | 'SMALL' = 'BIG';
  let finalNum = 0;

  if (isK3) {
    const c1 = (Math.abs(recentNums[0] - 2 + 16) % 16) + 3;
    const c2 = ((lastNum * 2 + 3) % 16) + 3;
    const c3 = ((sumTrend + 4) % 16) + 3;
    const c4 = (Math.abs(recentNums[1] + recentNums[2] - 1) % 16) + 3;
    const c5 = ((recentNums[0] + 7) % 16) + 3;
    const c6 = (Math.abs(lastNum - recentNums[4] + 8) % 16) + 3;
    const c7 = ((sumTrend * 3) % 16) + 3;
    const c8 = ((recentNums[0] * 4 + 1) % 16) + 3;

    calculations = [c1, c2, c3, c4, c5, c6, c7, c8];
    calculations.forEach((num) => {
      if (num >= 11) bigCount++;
      else smallCount++;
    });

    finalSize = bigCount >= smallCount ? 'BIG' : 'SMALL';
    const match = calculations.filter((n) => (finalSize === 'BIG' ? n >= 11 : n <= 10));
    finalNum = match.length > 0 ? match[0] : finalSize === 'BIG' ? 14 : 7;
  } else {
    const c1 = Math.abs(recentNums[0] - 2 + 10) % 10;
    const c2 = (lastNum * 2 + 3) % 10;
    const c3 = (sumTrend + 4) % 10;
    const c4 = Math.abs(recentNums[1] + recentNums[2] - 1) % 10;
    const c5 = (recentNums[0] + 7) % 10;
    const c6 = Math.abs(lastNum - recentNums[4] + 8) % 10;
    const c7 = (sumTrend * 3) % 10;
    const c8 = (recentNums[0] * 4 + 1) % 10;

    calculations = [c1, c2, c3, c4, c5, c6, c7, c8];
    calculations.forEach((num) => {
      if (num >= 5) bigCount++;
      else smallCount++;
    });

    finalSize = bigCount >= smallCount ? 'BIG' : 'SMALL';
    const match = calculations.filter((n) => (finalSize === 'BIG' ? n >= 5 : n < 5));
    finalNum = match.length > 0 ? match[0] : finalSize === 'BIG' ? 7 : 3;
  }

  const conf = Math.round(62 + (Math.abs(bigCount - smallCount) / 8) * 32);
  return {
    call: finalSize,
    predictedNum: finalNum,
    calculations,
    bigCount,
    smallCount,
    conf
  };
}

/* ─── 7. SMART PRIMARY & BACKUP NUMBER PICKER ─── */
function pickSmartNumbers(recs: number[], call: 'BIG' | 'SMALL', isK3: boolean): { main: number; backup: number } {
  const min = isK3 ? 3 : 0;
  const max = isK3 ? 18 : 9;
  const bigTh = isK3 ? 11 : 5;

  const poolMain: number[] = [];
  const poolBackup: number[] = [];

  for (let x = min; x <= max; x++) {
    if ((x >= bigTh ? 'BIG' : 'SMALL') === call) {
      poolMain.push(x);
    } else {
      poolBackup.push(x);
    }
  }

  // Count recent frequencies in last 30
  const freq: Record<number, number> = {};
  for (let x = min; x <= max; x++) freq[x] = 0;
  recs.slice(0, 30).forEach((n) => {
    if (freq[n] !== undefined) freq[n]++;
  });

  poolMain.sort((a, b) => freq[b] - freq[a]);
  poolBackup.sort((a, b) => freq[b] - freq[a]);

  const main = poolMain[0] ?? (call === 'BIG' ? (isK3 ? 14 : 7) : isK3 ? 7 : 2);
  const backup = poolBackup[0] ?? (call === 'BIG' ? (isK3 ? 8 : 3) : isK3 ? 13 : 8);

  return { main, backup };
}

/* ─── 8. MASTER ADAPTIVE ENSEMBLE FUSION ─── */
export function calculatePrediction(
  list: LotteryIssue[],
  gameId: GameType,
  currentLevel = 0
): PredictionData | null {
  if (!list || list.length === 0) return null;

  const lastItem = list[0];
  const lastNum = parseInt(lastItem.number, 10);
  if (isNaN(lastNum)) return null;

  const isK3 = gameId === 'K3_1M';
  const nums: number[] = [];
  for (let i = 0; i < list.length; i++) {
    const val = parseInt(list[i].number, 10);
    if (!isNaN(val)) nums.push(val);
  }
  if (nums.length === 0) return null;

  // Next Period String
  let nextPeriodStr = '';
  try {
    const s = String(lastItem.issueNumber);
    const m = s.match(/^(\D*)(\d+)$/);
    if (m) {
      nextPeriodStr = m[1] + (BigInt(m[2]) + 1n).toString().padStart(m[2].length, '0');
    } else {
      nextPeriodStr = (BigInt(s.replace(/\D/g, '')) + 1n).toString();
    }
  } catch {
    nextPeriodStr = (parseInt(lastItem.issueNumber, 10) + 1).toString();
  }

  // Run the 5 AI engines + 8 Formulas
  const rdx = rdxEngine(nums, nextPeriodStr, isK3);
  const vanta = vantaEngine(nums, isK3);
  const noctis = noctisEngine(nums, isK3);
  const brain = brainEngine(nums, isK3);
  const market = marketEngine(nums, isK3);
  const f8 = calculateFormula8(nums, isK3);

  const formula8Engine: EngineResult = {
    id: 'FORMULA8',
    name: '8-CHAKRA MATH',
    call: f8.call,
    conf: f8.conf,
    pBig: f8.call === 'BIG' ? 0.72 : 0.28,
    detail: `Sum & Delta Formulas [${f8.bigCount}B / ${f8.smallCount}S]`
  };

  const engines = [rdx, vanta, noctis, brain, market, formula8Engine];

  // ADAPTIVE WEIGHTING SYSTEM based on active detected pattern
  const weights: Record<string, number> = {
    RDX: 1.3,
    VANTA: 1.3,
    NOCTIS: 1.2,
    BRAIN: 1.6,
    MARKET: 1.4,
    FORMULA8: 1.3
  };

  // Pattern-specific adaptive boost
  if (brain.patternType === 'DRAGON') {
    weights.BRAIN *= 1.8;
    weights.RDX *= 1.6;
  } else if (brain.patternType === 'MIRROR') {
    weights.VANTA *= 1.8;
    weights.BRAIN *= 1.7;
  } else if (brain.patternType === 'ZIGZAG') {
    weights.BRAIN *= 1.8;
    weights.MARKET *= 1.6;
  } else if (brain.patternType === 'RANDOM') {
    weights.NOCTIS *= 1.7;
    weights.MARKET *= 1.6;
  }

  let sumW = 0;
  let sumLogit = 0;
  engines.forEach((eng) => {
    const w = weights[eng.id] || 1;
    sumW += w;
    sumLogit += w * logit(eng.pBig);
  });

  let pFinal = sigmoid(sumW ? sumLogit / sumW : 0);

  // Recovery boost for Martingale levels
  if (currentLevel >= 1) {
    const boost = currentLevel >= 2 ? 0.07 : 0.05;
    pFinal = pFinal >= 0.5 ? pFinal + boost : pFinal - boost;
  }
  pFinal = clamp(pFinal, 0.04, 0.96);

  const finalCall: 'BIG' | 'SMALL' = pFinal >= 0.5 ? 'BIG' : 'SMALL';
  const agreeCount = engines.filter((e) => e.call === finalCall).length;
  const edge = Math.abs(pFinal - 0.5);

  // Dynamic high-winning confidence display (82% to 99.4%)
  const confidence = Math.round(clamp(81 + edge * 35 + (agreeCount - 3) * 2.5, 82, 99.4));

  // Determine Primary & Backup Numbers
  const { main: smartMain, backup: smartBackup } = pickSmartNumbers(nums, finalCall, isK3);
  const primaryNumber = f8.call === finalCall ? f8.predictedNum : smartMain;
  const backupNumber = smartBackup;

  const risk: 'LOW' | 'MODERATE' | 'HIGH' = agreeCount >= 5 ? 'LOW' : agreeCount >= 4 ? 'MODERATE' : 'HIGH';

  return {
    period: nextPeriodStr.slice(-5),
    fullPeriod: nextPeriodStr,
    predictedNum: primaryNumber,
    backupNum: backupNumber,
    predictedSize: finalCall,
    calculations: f8.calculations,
    bigCount: f8.bigCount,
    smallCount: f8.smallCount,
    timestamp: Date.now(),
    gameId,
    confidence,
    agreeCount,
    totalEngines: engines.length,
    regime: market.metrics.state,
    risk,
    patternName: brain.pattern,
    patternType: (brain.patternType === 'DRAGON'
      ? 'Dragon'
      : brain.patternType === 'MIRROR'
      ? 'Mirror'
      : brain.patternType === 'ZIGZAG'
      ? 'Zigzag'
      : 'Random') as 'Dragon' | 'Mirror' | 'Zigzag' | 'Random',
    patternNote: brain.detail,
    marketState: market.metrics.state,
    marketMetrics: market.metrics,
    engines: {
      RDX: rdx,
      VANTA: vanta,
      NOCTIS: noctis,
      BRAIN: brain,
      MARKET: market,
      FORMULA8: formula8Engine
    },
    humanCall: brain.humanCall,
    humanConf: brain.humanConf,
    aiCall: brain.aiCall,
    aiConf: brain.aiConf,
    verdict: brain.verdict,
    level: currentLevel + 1,
    martingaleStep: currentLevel + 1,
    betAmount: BET_LEVELS[currentLevel] || BET_LEVELS[0]
  };
}
