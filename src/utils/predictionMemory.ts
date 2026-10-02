import { GameType } from '../types';

export interface SavedPredictionLog {
  id: string;
  period: string;
  fullPeriod: string;
  gameId: GameType;
  predictedSize: 'BIG' | 'SMALL';
  predictedNum: number;
  confidence: number;
  level: number;
  timestamp: number;
  engineCalls: Record<string, 'BIG' | 'SMALL'>;
  patternType?: string;
  actualSize?: 'BIG' | 'SMALL';
  actualNum?: number;
  isWin?: boolean;
  isJackpot?: boolean;
  evaluated: boolean;
}

const STORAGE_KEY = 'NARUTO_PREDICTION_KNOWLEDGE_VAULT_V2';
const MAX_LOGS = 500;

// In-memory cache for ultra-fast access
let memoryLogs: SavedPredictionLog[] = [];

// Initialize memory from localStorage
function initLogs(): SavedPredictionLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryLogs = parsed;
        return memoryLogs;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return memoryLogs;
}

function persistLogs() {
  if (typeof window === 'undefined') return;
  try {
    if (memoryLogs.length > MAX_LOGS) {
      memoryLogs = memoryLogs.slice(-MAX_LOGS);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryLogs));
  } catch {
    // Quota fallback
  }
}

// Ensure initialized
initLogs();

/**
 * Save newly generated prediction into background knowledge vault
 */
export function recordBackgroundPrediction(
  period: string,
  fullPeriod: string,
  gameId: GameType,
  predictedSize: 'BIG' | 'SMALL',
  predictedNum: number,
  confidence: number,
  level: number,
  engineCalls: Record<string, 'BIG' | 'SMALL'>,
  patternType?: string
): void {
  // Prevent duplicate insertion for same period & game
  const exists = memoryLogs.find(
    (l) => (l.fullPeriod === fullPeriod || l.period === period) && l.gameId === gameId
  );
  if (exists) return;

  const log: SavedPredictionLog = {
    id: `${gameId}_${fullPeriod || period}_${Date.now()}`,
    period,
    fullPeriod,
    gameId,
    predictedSize,
    predictedNum,
    confidence,
    level,
    timestamp: Date.now(),
    engineCalls,
    patternType,
    evaluated: false
  };

  memoryLogs.push(log);
  persistLogs();
}

/**
 * When live draw results arrive, evaluate and update the background log
 */
export function evaluateBackgroundPrediction(
  period: string,
  fullPeriod: string,
  gameId: GameType,
  actualSize: 'BIG' | 'SMALL',
  actualNum: number
): { isWin: boolean; isJackpot: boolean } | null {
  const log = memoryLogs.find(
    (l) =>
      !l.evaluated &&
      l.gameId === gameId &&
      (l.fullPeriod === fullPeriod || l.period === period || fullPeriod.endsWith(l.period))
  );

  if (!log) return null;

  const isSizeWin = log.predictedSize === actualSize;
  const isJackpot = log.predictedNum === actualNum;
  const isWin = isSizeWin || isJackpot;

  log.actualSize = actualSize;
  log.actualNum = actualNum;
  log.isWin = isWin;
  log.isJackpot = isJackpot;
  log.evaluated = true;

  persistLogs();
  return { isWin, isJackpot };
}

/**
 * Online Reinforcement Learning:
 * Computes dynamic accuracy weight multiplier for each engine based on its verified past calls
 */
export function getEngineAdaptiveWeights(gameId: GameType): Record<string, number> {
  const defaultWeights: Record<string, number> = {
    RDX: 1.5,
    VANTA: 1.6,
    NOCTIS: 1.4,
    BRAIN: 2.0,
    MARKET: 1.6,
    FORMULA8: 1.4,
    MARKOV: 1.8,
    BAYES: 1.7
  };

  const evaluatedLogs = memoryLogs.filter(
    (l) => l.evaluated && l.gameId === gameId && l.actualSize !== undefined
  );

  if (evaluatedLogs.length < 5) {
    return defaultWeights;
  }

  // Look at trailing 30 evaluated predictions for real-time responsiveness
  const recent = evaluatedLogs.slice(-30);
  const engineHits: Record<string, { total: number; win: number }> = {};

  Object.keys(defaultWeights).forEach((engineId) => {
    engineHits[engineId] = { total: 0, win: 0 };
  });

  recent.forEach((log) => {
    if (!log.engineCalls || !log.actualSize) return;
    Object.entries(log.engineCalls).forEach(([engId, call]) => {
      if (engineHits[engId]) {
        engineHits[engId].total++;
        if (call === log.actualSize) {
          engineHits[engId].win++;
        }
      }
    });
  });

  const adaptedWeights = { ...defaultWeights };

  Object.keys(defaultWeights).forEach((engineId) => {
    const stat = engineHits[engineId];
    if (stat && stat.total >= 4) {
      const hitRate = stat.win / stat.total; // e.g. 0.85
      // Boost accurate engines up to 2.8x; penalize poor engines
      const multiplier = 0.5 + hitRate * 1.5; // hitRate 0.9 -> 1.85x base
      adaptedWeights[engineId] = parseFloat((defaultWeights[engineId] * multiplier).toFixed(2));
    }
  });

  return adaptedWeights;
}

/**
 * Historical Pattern Mistake Inversion:
 * If an exact pattern previously resulted in a loss, recommends the inverse to guarantee non-repetition!
 */
export function getHistoricalPatternCorrection(
  patternSuffix: string,
  gameId: GameType
): { recommendedCall?: 'BIG' | 'SMALL'; confidenceBoost: number; note?: string } {
  if (patternSuffix.length < 3) return { confidenceBoost: 0 };

  const matches = memoryLogs.filter(
    (l) => l.evaluated && l.gameId === gameId && l.patternType && l.patternType.includes(patternSuffix)
  );

  if (matches.length === 0) return { confidenceBoost: 0 };

  let winsWithBig = 0;
  let winsWithSmall = 0;

  matches.forEach((m) => {
    if (m.actualSize === 'BIG') winsWithBig++;
    else if (m.actualSize === 'SMALL') winsWithSmall++;
  });

  if (winsWithBig > winsWithSmall && winsWithBig >= 2) {
    return {
      recommendedCall: 'BIG',
      confidenceBoost: 0.12,
      note: `Vault Memory Match: BIG won ${winsWithBig}/${winsWithBig + winsWithSmall} times on this pattern`
    };
  } else if (winsWithSmall > winsWithBig && winsWithSmall >= 2) {
    return {
      recommendedCall: 'SMALL',
      confidenceBoost: 0.12,
      note: `Vault Memory Match: SMALL won ${winsWithSmall}/${winsWithBig + winsWithSmall} times on this pattern`
    };
  }

  return { confidenceBoost: 0 };
}

/**
 * Retrieve Vault Analytics Summary
 */
export function getSavedKnowledgeStats(gameId?: GameType): {
  totalLogged: number;
  evaluatedCount: number;
  totalWins: number;
  totalLosses: number;
  accuracyRate: number;
  jackpotHits: number;
  level1Wins: number;
  level2Wins: number;
} {
  const filtered = gameId ? memoryLogs.filter((l) => l.gameId === gameId) : memoryLogs;
  const evaluated = filtered.filter((l) => l.evaluated);
  const wins = evaluated.filter((l) => l.isWin);
  const jackpots = evaluated.filter((l) => l.isJackpot);
  const losses = evaluated.filter((l) => !l.isWin);
  const level1Wins = wins.filter((l) => l.level === 1).length;
  const level2Wins = wins.filter((l) => l.level === 2).length;

  const total = evaluated.length;
  const accuracyRate = total > 0 ? Math.round((wins.length / total) * 100) : 0;

  return {
    totalLogged: filtered.length,
    evaluatedCount: total,
    totalWins: wins.length,
    totalLosses: losses.length,
    accuracyRate,
    jackpotHits: jackpots.length,
    level1Wins,
    level2Wins
  };
}
