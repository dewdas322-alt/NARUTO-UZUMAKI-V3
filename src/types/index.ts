export type GameType = 'WINGO_1M' | 'WINGO_30S' | 'WINGO_3M' | 'WINGO_5M' | 'TRX_1M' | 'K3_1M';

export interface GameConfig {
  id: GameType;
  name: string;
  shortName: string;
  durationSec: number;
  minNum: number;
  maxNum: number;
  apiUrl: string;
  isK3?: boolean;
}

export interface LotteryIssue {
  issueNumber: string;
  number: string;
  colour?: string;
  premium?: string;
  openTime?: string;
}

export interface EngineResult {
  id: string;
  name: string;
  call: 'BIG' | 'SMALL' | 'HOLD';
  conf: number;
  detail?: string;
  pBig: number;
}

export interface MarketMetrics {
  state: 'CHOPPY' | 'TRENDING' | 'RANDOM' | 'MIXED' | 'NO DATA';
  alt10?: number;
  alt20?: number;
  avgRun?: number;
  curRun?: number;
  curSide?: string;
  runsZ?: number;
  pCont?: number | null;
  missB?: { cur: number; avg: number };
  missS?: { cur: number; avg: number };
  p20?: number;
}

export interface PredictionData {
  period: string;
  fullPeriod: string;
  predictedNum: number;
  backupNum: number;
  predictedSize: 'BIG' | 'SMALL';
  calculations: number[];
  bigCount: number;
  smallCount: number;
  timestamp: number;
  gameId: GameType;
  // Enhanced AI Fusion Fields from HTML
  confidence: number;
  agreeCount: number;
  totalEngines: number;
  regime: string;
  risk: 'LOW' | 'MODERATE' | 'HIGH';
  patternName: string;
  patternType?: 'Dragon' | 'Mirror' | 'Zigzag' | 'Random';
  patternNote?: string;
  marketState: 'CHOPPY' | 'TRENDING' | 'RANDOM' | 'MIXED' | 'NO DATA';
  marketMetrics?: MarketMetrics;
  engines: {
    RDX: EngineResult;
    VANTA: EngineResult;
    NOCTIS: EngineResult;
    BRAIN: EngineResult;
    MARKET: EngineResult;
    FORMULA8: EngineResult;
  };
  humanCall?: 'BIG' | 'SMALL';
  humanConf?: number;
  aiCall?: 'BIG' | 'SMALL';
  aiConf?: number;
  verdict?: string;
  level: number;
  martingaleStep: number;
  betAmount: number;
}

export interface HistoryRecord {
  period: string;
  fullPeriod: string;
  actualNum: number;
  actualSize: 'BIG' | 'SMALL';
  predictedSize: 'BIG' | 'SMALL';
  predictedNum: number;
  backupNum?: number;
  isWin: boolean;
  isJackpot?: boolean;
  jackpotNum?: number;
  betAmount: number;
  timestamp: number;
  game: string;
  conf?: number;
  step?: number;
}

export interface TargetStats {
  current: number;
  target: number;
  wins: number;
  losses: number;
  active: boolean;
  totalCompleted: number;
}

export interface LevelStats {
  num: number;
  losses: number;
  max: number;
  wins: number;
}
