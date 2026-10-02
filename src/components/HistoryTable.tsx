import React, { useRef } from 'react';
import { HistoryRecord, GameConfig } from '../types';
import { Trash2, RotateCcw } from 'lucide-react';

interface HistoryTableProps {
  records: HistoryRecord[];
  currentGame: GameConfig;
  isOnline?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onClearHistory?: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  records,
  currentGame,
  isOnline = true,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  onClearHistory
}) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Compute stats strictly from current session records (Starts from 0)
  const wins = records.filter((r) => r.isWin && !r.isJackpot).length;
  const jackpots = records.filter((r) => r.isJackpot).length;
  const losses = records.filter((r) => !r.isWin).length;
  const totalEvaluated = wins + jackpots + losses;
  const winRate = totalEvaluated > 0 ? Math.round(((wins + jackpots) / totalEvaluated) * 100) : 0;

  // Infinite scroll listener for live history
  const handleScroll = () => {
    if (!tableContainerRef.current || !onLoadMore || isLoadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 80) {
      onLoadMore();
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#0b101d] border border-[#1e293b]/90 shadow-2xl overflow-hidden p-3.5 sm:p-5 flex flex-col gap-3.5">
      {/* Top Header: Game Name & Live Sync Indicator (Exact Match to Screenshot) */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-orbitron font-extrabold text-sm sm:text-base text-white tracking-wider">
            {currentGame.shortName}
          </span>
          <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            AUTO-WIPE ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && onClearHistory && (
            <button
              type="button"
              onClick={onClearHistory}
              title="Clear all session history"
              className="flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-rose-400 px-2 py-0.5 rounded bg-[#162238] border border-[#1e293b] cursor-pointer transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>CLEAR</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#22c55e]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e]"></span>
            </span>
            <span>{isOnline ? 'Live Sync' : 'Connecting...'}</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Badges in a Horizontal Row (Starts strictly from 0 on open/restart) */}
      <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
        {/* Wins Badge */}
        <div className="bg-[#062c20] border border-[#065f46] text-[#4ade80] py-1.5 px-2 rounded-lg font-bold truncate">
          Wins: {wins}
        </div>

        {/* Jackpot Badge */}
        <div className="bg-[#1e1b4b] border border-[#4338ca] text-[#f472b6] py-1.5 px-2 rounded-lg font-bold truncate">
          Jackpot: {jackpots}
        </div>

        {/* Loss Badge */}
        <div className="bg-[#450a0a] border border-[#991b1b] text-[#f87171] py-1.5 px-2 rounded-lg font-bold truncate">
          Loss: {losses}
        </div>

        {/* Winrate Badge */}
        <div className="bg-[#0c2438] border border-[#075985] text-[#38bdf8] py-1.5 px-2 rounded-lg font-bold truncate">
          Winrate: {winRate}%
        </div>
      </div>

      {/* Unlimited Scrolling Table Container */}
      <div
        ref={tableContainerRef}
        onScroll={handleScroll}
        className="w-full max-h-[460px] overflow-y-auto overflow-x-hidden rounded-xl border border-[#1e293b] bg-[#070b14] divide-y divide-[#1e293b]/70"
      >
        <table className="w-full text-left font-mono text-xs">
          {/* Sticky Table Header */}
          <thead className="bg-[#101726] text-gray-400 uppercase text-[11px] font-bold tracking-wider border-b border-[#1e293b] sticky top-0 z-20">
            <tr>
              <th className="py-2.5 px-4 text-left">Period</th>
              <th className="py-2.5 px-4 text-center">Prediction</th>
              <th className="py-2.5 px-4 text-right">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#1e293b]/50 text-gray-200">
            {records.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-12 text-center text-gray-500 font-rajdhani text-sm">
                  <div className="flex flex-col items-center gap-1.5">
                    <RotateCcw className="w-5 h-5 text-gray-600 animate-spin" style={{ animationDuration: '4s' }} />
                    <span className="font-semibold text-gray-400">Fresh Clean Session Initialized</span>
                    <span className="text-xs text-gray-600">Waiting for current round draw to verify... (Auto-wiped on back)</span>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((rec, idx) => {
                const isSmall = rec.predictedSize === 'SMALL';
                const actualDisplayNum = rec.jackpotNum !== undefined ? rec.jackpotNum : rec.actualNum;

                return (
                  <tr
                    key={`${rec.fullPeriod || rec.period}-${idx}`}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Period (e.g. 10219) */}
                    <td className="py-2.5 px-4 text-gray-200 font-bold whitespace-nowrap">
                      {rec.period}
                    </td>

                    {/* Prediction Pill: Yellow border for SMALL, Blue border for BIG (Exact Match) */}
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-md font-bold font-mono text-xs whitespace-nowrap border ${
                          isSmall
                            ? 'border-[#eab308] text-[#facc15] bg-[#713f12]/20'
                            : 'border-[#0284c7] text-[#38bdf8] bg-[#0c4a6e]/20'
                        }`}
                      >
                        {rec.predictedSize} [{rec.predictedNum}]
                      </span>
                    </td>

                    {/* Status Pill: Glowing Pink/Purple JACKPOT, Green WIN, or Red LOSS (Exact Match) */}
                    <td className="py-2.5 px-4 text-right">
                      {rec.isJackpot ? (
                        <span className="inline-flex items-center gap-1 border border-[#ec4899] bg-gradient-to-r from-[#9d174d]/90 to-[#701a75]/90 text-[#fce7f3] font-bold text-xs px-2.5 py-0.5 rounded-md shadow-[0_0_12px_rgba(236,72,153,0.5)] font-orbitron whitespace-nowrap">
                          <span>🔥</span>
                          <span>JACKPOT ({actualDisplayNum})</span>
                        </span>
                      ) : rec.isWin ? (
                        <span className="inline-block border border-[#16a34a] text-[#4ade80] bg-[#052e16]/40 font-bold text-xs px-3.5 py-0.5 rounded-md font-orbitron whitespace-nowrap">
                          WIN
                        </span>
                      ) : (
                        <span className="inline-block border border-[#dc2626] text-[#f87171] bg-[#450a0a]/40 font-bold text-xs px-3 py-0.5 rounded-md font-orbitron whitespace-nowrap">
                          LOSS
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Infinite Scroll Loader at bottom */}
        {isLoadingMore && (
          <div className="py-3 text-center text-xs font-mono text-[#38bdf8] bg-[#080d17]/80">
            Loading more live issues from API...
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 px-1">
        <span>History auto-deletes on exit/back</span>
        <span>{records.length} records in active session</span>
      </div>
    </div>
  );
};
