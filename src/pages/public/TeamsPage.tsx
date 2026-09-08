import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Wallet, ChevronRight, Award, UserCheck, ArrowUpDown, TrendingUp } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { formatINR, formatCompactINR } from '../../lib/currency';
import { calculateMaxLegalBid } from '../../lib/maxBid';

export const TeamsPage: React.FC = () => {
  const { teams, players, settings } = useTournament();
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'squad'>('name');

  const sortedTeams = [...teams].sort((a, b) => {
    if (sortBy === 'balance') {
      return (b.current_balance ?? 0) - (a.current_balance ?? 0);
    }
    if (sortBy === 'squad') {
      const aSquad = players.filter(p => p.sold_team_id === a.id).length;
      const bSquad = players.filter(p => p.sold_team_id === b.id).length;
      return bSquad - aSquad;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-6 text-slate-950">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-[#122023] px-6 py-6 sm:px-8 sm:py-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
        <div className="text-left max-w-2xl">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.23em] text-lime-300">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
            Official Tournament Teams • 10 Teams
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-[-0.05em]">
            Teams &amp; Squad Rosters
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            10 premier teams initialized with ₹5,00,000 budgets. Track purchased squad players, total expenditure, available purse, and maximum legal bids.
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 p-1.5 rounded-xl text-xs shrink-0">
          <span className="text-[11px] text-slate-400 pl-2 font-semibold flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-lime-300" />
            <span>Sort:</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === 'name' ? 'bg-lime-300 text-lime-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Name
            </button>
            <button
              onClick={() => setSortBy('balance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === 'balance' ? 'bg-lime-300 text-lime-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Purse
            </button>
            <button
              onClick={() => setSortBy('squad')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === 'squad' ? 'bg-lime-300 text-lime-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Squad
            </button>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {sortedTeams.map((team) => {
          const squad = players.filter(p => p.sold_team_id === team.id);
          const maxBidInfo = calculateMaxLegalBid(team, squad.length, settings);
          const totalBudget = team.initial_budget || 500000;
          const currentBal = team.current_balance ?? maxBidInfo.currentBalance;
          const spentPercent = Math.min(100, Math.round(((team.total_spent || 0) / totalBudget) * 100));

          return (
            <div
              key={team.id}
              className="group relative bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-200 text-left overflow-hidden"
            >
              {/* Top Accent Stripe */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5" 
                style={{ backgroundColor: team.team_color }}
              />

              <div className="space-y-4">
                {/* Crest & Squad Count */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {team.logo_url ? (
                      <div className="w-14 h-14 rounded-2xl p-1 bg-slate-900 border border-slate-200 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                        <img 
                          src={team.logo_url} 
                          alt={team.name} 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-md shrink-0"
                        style={{ backgroundColor: team.team_color }}
                      >
                        {team.short_name}
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">
                        Team #{team.team_number}
                      </span>
                      <h3 className="text-lg font-black text-slate-950 leading-tight">
                        {team.name}
                      </h3>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1 shrink-0">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{squad.length} / {team.total_squad_slots || 6}</span>
                  </span>
                </div>

                {/* Owner & Captain */}
                <div className="space-y-1 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="flex items-center justify-between gap-2 truncate">
                    <span className="flex items-center gap-1.5 text-slate-500 shrink-0">
                      <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      Owner:
                    </span>
                    <strong className="text-slate-800 truncate">{team.owner_name || 'Unassigned'}</strong>
                  </p>
                  <p className="flex items-center justify-between gap-2 truncate">
                    <span className="flex items-center gap-1.5 text-slate-500 shrink-0">
                      <UserCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      Captain:
                    </span>
                    <strong className="text-slate-800 truncate">{team.captain_name || 'Unassigned'}</strong>
                  </p>
                </div>

                {/* 3-Column Financial Metrics Bar: Remaining Budget, Total Spent, Max Next Legal Bid */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5">
                    <span className="text-[9px] uppercase font-black text-emerald-800 block tracking-wider">
                      Purse Left
                    </span>
                    <span className="font-mono font-black text-xs sm:text-sm text-emerald-950 mt-0.5 block truncate">
                      {formatINR(currentBal)}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                    <span className="text-[9px] uppercase font-black text-slate-500 block tracking-wider">
                      Total Spent
                    </span>
                    <span className="font-mono font-black text-xs sm:text-sm text-slate-800 mt-0.5 block truncate">
                      {formatINR(team.total_spent || 0)}
                    </span>
                  </div>

                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5">
                    <span className="text-[9px] uppercase font-black text-amber-800 block tracking-wider">
                      Max Next Bid
                    </span>
                    <span className="font-mono font-black text-xs sm:text-sm text-amber-950 mt-0.5 block truncate">
                      {formatINR(maxBidInfo.maxLegalBid)}
                    </span>
                  </div>
                </div>

                {/* Purchased Players Roster List */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black uppercase tracking-wider text-slate-700 text-[11px] flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      Purchased Squad ({squad.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {6 - squad.length > 0 ? `${6 - squad.length} slots remaining` : 'Roster complete'}
                    </span>
                  </div>

                  {squad.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 font-medium">
                      No players purchased yet
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {squad.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={player.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                              alt={player.name}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 truncate leading-tight">
                                {player.name}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {player.player_code} • {player.eligible_category_names?.slice(0, 2).join(', ')}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-2">
                            <span className="font-mono font-black text-xs text-emerald-800 block">
                              {formatINR(player.sold_price || 0)}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">
                              Sold Price
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* View Full Squad Link */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">
                <span>View Full Team Squad</span>
                <Link
                  to={`/teams/${team.id}`}
                  className="flex items-center gap-1 text-sky-700 hover:text-sky-900 font-black text-xs uppercase tracking-wider"
                >
                  <span>Details</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

