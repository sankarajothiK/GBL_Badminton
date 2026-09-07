import React from 'react';
import { Shield, Users, Wallet, Lock, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { formatINR, formatCompactINR } from '../../lib/currency';
import { getTeamAuctionMetrics } from '../../lib/maxBid';

interface TeamAllocationSummaryTableProps {
  title?: string;
  subtitle?: string;
  highlightTeamId?: string | null;
  onSelectTeam?: (teamId: string) => void;
  compact?: boolean;
}

export const TeamAllocationSummaryTable: React.FC<TeamAllocationSummaryTableProps> = ({
  title = 'OFFICIAL TEAM POINTS & AUCTION ALLOCATION SUMMARY',
  subtitle = 'Strict tracking of Owner Player points isolation, usable bidding balances, and squad slots',
  highlightTeamId,
  onSelectTeam,
  compact = false
}) => {
  const { teams, players, settings } = useTournament();

  // Compute metrics for each of the 10 teams
  const teamMetrics = teams.map((team) => {
    const boughtCount = players.filter((p) => p.sold_team_id === team.id).length;
    return getTeamAuctionMetrics(team, boughtCount, settings);
  });

  const aggregateTotalBudget = teamMetrics.reduce((sum, m) => sum + m.totalPoints, 0);
  const aggregateOwnerAlloc = teamMetrics.reduce((sum, m) => sum + m.ownerAllocation, 0);
  const aggregateAuctionBudget = teamMetrics.reduce((sum, m) => sum + m.auctionBudget, 0);
  const aggregateBought = teamMetrics.reduce((sum, m) => sum + m.playersBought, 0);
  const aggregateSlots = teamMetrics.reduce((sum, m) => sum + m.maxAuctionSlots, 0);
  const aggregateSpent = teamMetrics.reduce((sum, m) => sum + m.totalSpent, 0);
  const aggregateBalance = teamMetrics.reduce((sum, m) => sum + m.remainingBalance, 0);

  return (
    <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-700/70 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gbl-navy-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gbl-orange-500 shrink-0" />
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white font-sports">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gbl-navy-950 border border-gbl-navy-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>OPEN Owner (₹1L + 5 Slots)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gbl-navy-950 border border-gbl-navy-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Normal Owner (₹30k + 5 Slots)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gbl-navy-950 border border-gbl-navy-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>Non-Playing (₹0 + 6 Slots)</span>
          </div>
        </div>
      </div>

      {/* Desktop Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 min-w-[760px]">
          <thead>
            <tr className="border-b border-gbl-navy-800 text-[10px] uppercase font-black tracking-widest text-slate-400 bg-gbl-navy-950/60">
              <th className="py-3 px-3">Team & Owner</th>
              <th className="py-3 px-2 text-right">Total Points</th>
              <th className="py-3 px-2 text-right">Owner Alloc.</th>
              <th className="py-3 px-2 text-right">Available Auction</th>
              <th className="py-3 px-2 text-center">Total Squad</th>
              <th className="py-3 px-2 text-center">Remaining Slots</th>
              <th className="py-3 px-2 text-right">Total Spent</th>
              <th className="py-3 px-2 text-right">Remaining Balance</th>
              <th className="py-3 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gbl-navy-800/60">
            {teamMetrics.map((m) => {
              const team = teams.find((t) => t.id === m.teamId);
              const isSelected = highlightTeamId === m.teamId;

              return (
                <tr
                  key={m.teamId}
                  onClick={() => onSelectTeam && onSelectTeam(m.teamId)}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-gbl-orange-500/15 ring-1 ring-gbl-orange-500'
                      : 'hover:bg-gbl-navy-800/40'
                  } ${onSelectTeam ? 'cursor-pointer' : ''}`}
                >
                  {/* Team & Owner */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow"
                        style={{ backgroundColor: team?.team_color || '#FF5E00' }}
                      >
                        {team?.short_name || 'TM'}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-white truncate">{m.teamName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span>Owner: {m.ownerName || 'None'}</span>
                          {m.ownerIsPlayer ? (
                            m.ownerAllocation === 100000 ? (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold border border-emerald-500/30">
                                OPEN (₹1L)
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-semibold border border-amber-500/30">
                                Normal (₹30k)
                              </span>
                            )
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-semibold border border-sky-500/30">
                              No-Play (₹0)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Total Points (5,00,000) */}
                  <td className="py-3 px-2 text-right font-mono font-bold text-slate-200">
                    {formatINR(m.totalPoints)}
                  </td>

                  {/* Owner Allocation (1,00,000 / 30,000 / 0) */}
                  <td className="py-3 px-2 text-right font-mono font-bold">
                    {m.ownerAllocation > 0 ? (
                      <span className={m.ownerAllocation === 100000 ? 'text-emerald-400' : 'text-amber-400'}>
                        {formatINR(m.ownerAllocation)}
                      </span>
                    ) : (
                      <span className="text-slate-500">₹0</span>
                    )}
                  </td>

                  {/* Available Auction Points (4,00,000 / 4,70,000 / 5,00,000) */}
                  <td className="py-3 px-2 text-right font-mono font-black text-sky-400">
                    {formatINR(m.auctionBudget)}
                  </td>

                  {/* Total Squad (e.g. 1 / 6 or 0 / 6) */}
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${
                        m.isLocked
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                          : 'bg-gbl-navy-950 text-white border border-gbl-navy-800'
                      }`}
                    >
                      {m.playersBought} / {m.totalSquadSlots}
                    </span>
                  </td>

                  {/* Remaining Slots */}
                  <td className="py-3 px-2 text-center font-mono font-bold">
                    {m.remainingSlots > 0 ? (
                      <span className="text-slate-200">{m.remainingSlots}</span>
                    ) : (
                      <span className="text-rose-400 font-black">0</span>
                    )}
                  </td>

                  {/* Total Spent */}
                  <td className="py-3 px-2 text-right font-mono text-slate-300 font-semibold">
                    {formatINR(m.totalSpent)}
                  </td>

                  {/* Remaining Balance */}
                  <td className="py-3 px-2 text-right font-mono font-black text-emerald-400">
                    {formatINR(m.remainingBalance)}
                  </td>

                  {/* Status: Active or LOCKED */}
                  <td className="py-3 px-3 text-center">
                    {m.isLocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Totals Summary Footer */}
          <tfoot>
            <tr className="border-t-2 border-gbl-navy-700 bg-gbl-navy-950/80 font-black text-white text-[11px]">
              <td className="py-3 px-3 uppercase tracking-wider">TOTAL (10 TEAMS)</td>
              <td className="py-3 px-2 text-right font-mono">{formatINR(aggregateTotalBudget)}</td>
              <td className="py-3 px-2 text-right font-mono text-amber-400">{formatINR(aggregateOwnerAlloc)}</td>
              <td className="py-3 px-2 text-right font-mono text-sky-400">{formatINR(aggregateAuctionBudget)}</td>
              <td className="py-3 px-2 text-center font-mono">{aggregateBought} / {aggregateSlots}</td>
              <td className="py-3 px-2 text-center font-mono">{aggregateSlots - aggregateBought}</td>
              <td className="py-3 px-2 text-right font-mono text-slate-300">{formatINR(aggregateSpent)}</td>
              <td className="py-3 px-2 text-right font-mono text-emerald-400">{formatINR(aggregateBalance)}</td>
              <td className="py-3 px-3 text-center text-[10px] text-slate-400">
                {teamMetrics.filter((m) => m.isLocked).length} Locked
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Informational Note at Bottom */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-gbl-navy-950/80 border border-gbl-navy-800 text-[11px] text-slate-400">
        <Info className="w-4 h-4 text-sky-400 shrink-0" />
        <span>
          <strong>Solvency Rule:</strong> Owner allocation points (₹1,00,000 for playing owners, ₹0 for non-playing owner) are strictly preserved and never deducted during player bidding. Max legal bid guarantees enough points remain to fill all remaining roster slots at base price.
        </span>
      </div>
    </div>
  );
};
