import React from 'react';
import { HistoryRecord, GameConfig } from '../types';

interface HistoryTableProps {
  records: HistoryRecord[];
  currentGame: GameConfig;
  isOnline?: boolean;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  records,
  currentGame,
  isOnline = true
}) => {
  const wins = records.filter((r) => r.isWin).length;
  const jackpots = records.filter((r) => r.isJackpot).length;
  const losses = records.filter((r) => !r.isWin).length;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <div className="w-full rounded-2xl bg-[#0c1220] border border-[#1e293b]/80 shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col gap-4">
      {/* Top Header: Game Name & Live Sync Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-orbitron font-extrabold text-sm sm:text-base text-white tracking-wider">
            {currentGame.shortName}
          </span>
          <span className="text-[10px] font-mono-code text-gray-400 bg-[#162238] px-2 py-0.5 rounded border border-gray-700/40">
            {currentGame.isK3 ? 'Dice 3-18' : 'Digits 0-9'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono-code font-bold text-[#22c55e]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e]"></span>
          </span>
          <span>{isOnline ? 'Live Sync' : 'Reconnecting...'}</span>
        </div>
      </div>

      {/* 4 Stat Badges Row (Exact Match from Screenshot) */}
      <div className="grid grid-cols-4 gap-2 text-center font-mono-code text-xs">
        {/* Wins Badge */}
        <div className="bg-[#052e16] border border-[#166534] text-[#4ade80] py-1.5 px-2 rounded-lg font-bold">
          Wins: {wins}
        </div>

        {/* Jackpot Badge */}
        <div className="bg-[#1e1b4b] border border-[#4338ca] text-[#c084fc] py-1.5 px-2 rounded-lg font-bold">
          Jackpot: {jackpots}
        </div>

        {/* Loss Badge */}
        <div className="bg-[#450a0a] border border-[#991b1b] text-[#f87171] py-1.5 px-2 rounded-lg font-bold">
          Loss: {losses}
        </div>

        {/* Winrate Badge */}
        <div className="bg-[#082f49] border border-[#075985] text-[#38bdf8] py-1.5 px-2 rounded-lg font-bold">
          Winrate: {winRate}%
        </div>
      </div>

      {/* 3-Column Table (Period | Prediction | Status) */}
      <div className="w-full overflow-hidden rounded-xl border border-[#1e293b] bg-[#080d17]">
        <table className="w-full text-left font-mono-code text-xs">
          <thead className="bg-[#131c2e] text-gray-400 uppercase text-[11px] font-bold tracking-wider border-b border-[#1e293b]">
            <tr>
              <th className="py-2.5 px-4 text-left">Period</th>
              <th className="py-2.5 px-4 text-center">Prediction</th>
              <th className="py-2.5 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/60 text-gray-300">
            {records.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500 font-rajdhani text-sm">
                  Waiting for initial draw cycle to complete verification...
                </td>
              </tr>
            ) : (
              records.slice(0, 20).map((rec, idx) => {
                return (
                  <tr
                    key={`${rec.period}-${idx}`}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Period (e.g. 10240) */}
                    <td className="py-2.5 px-4 text-gray-200 font-bold">
                      {rec.period}
                    </td>

                    {/* Prediction (Pill with gold/yellow border: SMALL [2]) */}
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-block border border-[#f59e0b]/70 bg-[#78350f]/20 text-[#fbbf24] px-2.5 py-0.5 rounded font-bold font-mono-code text-xs">
                        {rec.predictedSize} [{rec.predictedNum}]
                      </span>
                    </td>

                    {/* Status Result (LOSS or WIN or JACKPOT) */}
                    <td className="py-2.5 px-4 text-right">
                      {rec.isJackpot ? (
                        <span className="inline-block px-3 py-0.5 rounded border border-amber-500/70 bg-amber-500/20 text-[#fcd34d] font-orbitron text-[10px] font-bold shadow-sm shadow-amber-900/30">
                          JACKPOT
                        </span>
                      ) : rec.isWin ? (
                        <span className="inline-block px-3 py-0.5 rounded border border-emerald-500/60 bg-emerald-950/60 text-[#4ade80] font-orbitron text-[10px] font-bold shadow-sm shadow-emerald-900/30">
                          WIN
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-0.5 rounded border border-rose-500/60 bg-rose-950/60 text-[#f87171] font-orbitron text-[10px] font-bold">
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
      </div>
    </div>
  );
};
