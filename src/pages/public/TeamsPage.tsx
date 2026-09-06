import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Wallet, ChevronRight, Award, UserCheck, ArrowUpDown } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { formatINR, formatCompactINR } from '../../lib/currency';

export const TeamsPage: React.FC = () => {
  const { teams, players } = useTournament();
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
            10 premier teams initialized with ₹5,00,000 budgets (₹30,000 owner reserve + ₹4,70,000 available player purse) competing in the auction.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {sortedTeams.map((team) => {
          const squad = players.filter(p => p.sold_team_id === team.id);
          const totalUsable = 470000;
          const currentBal = team.current_balance ?? totalUsable;
          const spentPercent = Math.min(100, Math.round(((team.total_spent || 0) / totalUsable) * 100));

          return (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="group relative bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 text-left overflow-hidden"
            >
              {/* Top Accent Stripe */}
              <div 
                className="absolute top-0 left-0 right-0 h-1" 
                style={{ backgroundColor: team.team_color }}
              />

              <div>
                {/* Crest & Count */}
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: team.team_color }}
                  >
                    {team.short_name}
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{squad.length} / 5 Players</span>
                  </span>
                </div>

                {/* Team Name */}
                <h3 className="text-base font-black text-slate-950 mt-4 group-hover:text-slate-700 transition-colors">
                  {team.name}
                </h3>

                {/* Owner & Captain */}
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5 truncate">
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Owner: <strong className="text-slate-800">{team.owner_name || 'Unassigned'}</strong></span>
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <UserCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Captain: <strong className="text-slate-800">{team.captain_name || 'Unassigned'}</strong></span>
                  </p>
                </div>
              </div>

              {/* Balance & Progress */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Available:</span>
                  <span className="font-black text-slate-950 font-mono text-sm">
                    {formatINR(currentBal)}
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-slate-900 rounded-full transition-all duration-500"
                    style={{ width: `${100 - spentPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Spent: <span className="font-mono text-slate-700 font-bold">{formatCompactINR(team.total_spent)}</span></span>
                  <span>{100 - spentPercent}% Purse Left</span>
                </div>
              </div>

            </Link>
          );
        })}
      </div>

    </div>
  );
};
