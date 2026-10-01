import { GameType, LotteryIssue } from '../types';
import { GAMES } from '../utils/lotteryEngine';

export interface FetchResult {
  list: LotteryIssue[];
  latencyMs: number;
  rawJson?: unknown;
  sourceUrl: string;
  isLive: boolean;
}

export async function fetchLotteryIssues(
  gameId: GameType,
  customUrl?: string
): Promise<FetchResult> {
  const game = GAMES.find((g) => g.id === gameId);
  const baseTargetUrl = customUrl || game?.apiUrl || 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

  const startTime = performance.now();

  // Prepare URL with cache busting timestamp and pagination
  let finalUrl = baseTargetUrl;
  const separator = finalUrl.includes('?') ? '&' : '?';
  if (!finalUrl.includes('page=')) {
    finalUrl += `${separator}page=1&size=20&t=${Date.now()}`;
  }

  // Multi-tier Proxy Failover: Ensures uninterrupted live syncing 24/7
  const attempts = [
    { name: 'direct', url: finalUrl },
    { name: 'allorigins', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(finalUrl)}` },
    { name: 'corsproxy', url: `https://corsproxy.io/?${encodeURIComponent(finalUrl)}` },
    { name: 'codetabs', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(finalUrl)}` }
  ];

  let lastError: Error | null = null;

  for (const attempt of attempts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(attempt.url, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const raw = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);

      // Parse list from various standard payload formats
      let items: LotteryIssue[] = [];
      if (raw && typeof raw === 'object') {
        const payload = raw as Record<string, unknown>;
        if (payload.data && typeof payload.data === 'object') {
          const d = payload.data as Record<string, unknown>;
          if (Array.isArray(d.list)) {
            items = d.list as LotteryIssue[];
          } else if (Array.isArray(d.gameslist)) {
            items = d.gameslist as LotteryIssue[];
          }
        } else if (Array.isArray(payload.list)) {
          items = payload.list as LotteryIssue[];
        } else if (Array.isArray(raw)) {
          items = raw as LotteryIssue[];
        }
      }

      if (items.length > 0) {
        // Sanitize and ensure proper fields
        const sanitized: LotteryIssue[] = [];
        for (const item of items) {
          const raw = item as unknown as Record<string, unknown>;
          const rawIssue = item.issueNumber || raw.issue || raw.periodNumber;
          const rawNum = item.number ?? raw.openCode ?? raw.winNumber ?? item.premium;
          if (rawIssue) {
            sanitized.push({
              issueNumber: String(rawIssue),
              number: String(rawNum ?? (gameId === 'K3_1M' ? '10' : '5')),
              colour: item.colour || (parseInt(String(rawNum), 10) % 2 === 0 ? 'red' : 'green'),
              premium: item.premium ? String(item.premium) : undefined,
              openTime: item.openTime
            });
          }
        }

        if (sanitized.length > 0) {
          return {
            list: sanitized,
            latencyMs,
            rawJson: raw,
            sourceUrl: finalUrl,
            isLive: true
          };
        }
      }
    } catch (err) {
      lastError = err as Error;
      // Continue to next failover proxy immediately
    }
  }

  const latencyMs = Math.round(performance.now() - startTime);
  throw lastError || new Error(`Failed to connect to live API tunnel at ${baseTargetUrl}`);
}
