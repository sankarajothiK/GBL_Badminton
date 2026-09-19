import React, { useState, useMemo } from 'react';
import { Trophy, CheckCircle, XCircle, Layers, Sparkles, Shield, ChevronRight, Users } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { resolveTeamPool } from '../../lib/teamPools';

export const StandingsPage: React.FC = () => {
  const { standings, teams, settings } = useTournament();
  const [activeTab, setActiveTab] = useState<string>('Pool A');
  const [viewMode, setViewMode] = useState<'TABBED' | 'STACKED'>('TABBED');

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams]);
  const qualifyingCount = settings.qualifying_teams_count || 8;

  // Complete standings guaranteed for all active teams in database
  const fullStandings = useMemo(() => {
    const existingMap = new Map(standings.map(s => [s.team_id, s]));
    const list = teams.map((team, idx) => {
      const existing = existingMap.get(team.id);
      if (existing) return existing;
      return {
        id: `standing_${team.id}`,
        tournament_id: team.tournament_id,
        team_id: team.id,
        rank: idx + 1,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        score_for: 0,
        score_against: 0,
        score_diff: 0,
        is_qualified: false,
        is_eliminated: false,
        manual_qualifier: false,
        created_at: team.created_at,
        updated_at: team.updated_at
      };
    });

    return list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.score_diff - a.score_diff;
    });
  }, [standings, teams]);

  // Dynamically find all unique pools from actual teams
  const availablePools = useMemo(() => {
    const defaultPools = ['Pool A', 'Pool B', 'Pool C'];
    const customPools = teams
      .map(t => resolveTeamPool(t))
      .filter((p): p is string => Boolean(p && p !== 'Unassigned' && !defaultPools.includes(p)));
    const uniqueCustom = Array.from(new Set(customPools));
    return [...defaultPools, ...uniqueCustom];
  }, [teams]);

  // Compute standings for a specific pool
  const getPoolStandings = (poolName: string) => {
    if (poolName === 'OVERALL') {
      return fullStandings.map((s, idx) => ({
        ...s,
        displayRank: idx + 1,
        poolLabel: resolveTeamPool(teamMap.get(s.team_id)),
        isTopInPool: idx < qualifyingCount
      }));
    }

    const poolTeamIds = new Set(
      teams.filter(t => resolveTeamPool(t).toLowerCase() === poolName.toLowerCase()).map(t => t.id)
    );
    const poolStandings = fullStandings.filter(s => poolTeamIds.has(s.team_id));
    return poolStandings.map((s, idx) => ({
      ...s,
      displayRank: idx + 1,
      poolLabel: poolName,
      isTopInPool: idx < 2 // Top 2 in pool qualify
    }));
  };

  const displayedList = getPoolStandings(activeTab);

  // Helper for pool theme colors
  const getPoolBadgeClasses = (poolName?: string) => {
    if (poolName === 'Pool A') return 'bg-sky-500/15 text-sky-700 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30';
    if (poolName === 'Pool B') return 'bg-amber-500/15 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
    if (poolName === 'Pool C') return 'bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getPoolTabClasses = (poolName: string, isActive: boolean) => {
    if (!isActive) return 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm';
    if (poolName === 'Pool A') return 'bg-sky-600 text-white shadow-md shadow-sky-600/30 border-sky-600';
    if (poolName === 'Pool B') return 'bg-amber-600 text-white shadow-md shadow-amber-600/30 border-amber-600';
    if (poolName === 'Pool C') return 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border-emerald-600';
    return 'bg-slate-900 text-white shadow-md border-slate-900';
  };

  return (
    <div className="mx-auto max-w-[1500px] px-3 sm:px-8 lg:px-10 py-5 sm:py-8 space-y-5 sm:space-y-6 text-slate-950">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] bg-[#122023] px-4 py-5 sm:px-8 sm:py-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-5">
        <div className="text-left max-w-2xl space-y-1">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-lime-300">
            <span className="h-2 w-2 rounded-full bg-lime-300 animate-pulse" />
            Official Points Table • {teams.length} Teams
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Pool Standings &amp; Points Table
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Live rankings for 12 tournament teams across <strong>Pool A</strong>, <strong>Pool B</strong>, and <strong>Pool C</strong>. Top 2 teams from each pool advance to the knockouts.
          </p>
        </div>

        {/* View Mode Toggle for Mobile / Desktop */}
        <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl border border-white/15 text-xs self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setViewMode('TABBED')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex-1 sm:flex-initial text-center ${
              viewMode === 'TABBED' ? 'bg-lime-300 text-lime-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Tabbed View
          </button>
          <button
            onClick={() => setViewMode('STACKED')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex-1 sm:flex-initial text-center ${
              viewMode === 'STACKED' ? 'bg-lime-300 text-lime-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            All Pools Stacked
          </button>
        </div>
      </div>

      {/* POOL NAVIGATION TABS (Touch-friendly horizontal bar on mobile) */}
      {viewMode === 'TABBED' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar sm:flex-wrap -mx-1 px-1 touch-pan-x">
          {availablePools.map(poolName => {
            const count = teams.filter(t => resolveTeamPool(t).toLowerCase() === poolName.toLowerCase()).length;
            const isActive = activeTab === poolName;

            return (
              <button
                key={poolName}
                onClick={() => setActiveTab(poolName)}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 border min-h-[38px] ${getPoolTabClasses(poolName, isActive)}`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{poolName}</span>
                <span className={`ml-0.5 sm:ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setActiveTab('OVERALL')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 border min-h-[38px] ${
              activeTab === 'OVERALL'
                ? 'bg-slate-900 text-white shadow-md border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-lime-400" />
            <span>Overall Table</span>
            <span className={`ml-0.5 sm:ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-mono ${activeTab === 'OVERALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {teams.length}
            </span>
          </button>
        </div>
      )}

      {/* RENDER POOL STANDINGS */}
      {viewMode === 'STACKED' ? (
        // STACKED VIEW: Renders Pool A, Pool B, and Pool C one below another
        <div className="space-y-6">
          {availablePools.map(poolName => {
            const poolList = getPoolStandings(poolName);
            const poolColor = poolName === 'Pool A' ? 'text-sky-700 bg-sky-50 border-sky-200' : poolName === 'Pool B' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200';

            return (
              <div key={poolName} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${poolColor}`}>
                      {poolName}
                    </span>
                    <span>Standings</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    Top 2 Qualify
                  </span>
                </div>

                <PoolStandingsTable 
                  standingsList={poolList} 
                  teamMap={teamMap} 
                  getPoolBadgeClasses={getPoolBadgeClasses} 
                />
              </div>
            );
          })}
        </div>
      ) : (
        // TABBED VIEW: Renders active pool
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span>Displaying:</span>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                activeTab === 'Pool A' ? 'bg-sky-50 text-sky-700 border-sky-200' : activeTab === 'Pool B' ? 'bg-amber-50 text-amber-700 border-amber-200' : activeTab === 'Pool C' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}>
                {activeTab === 'OVERALL' ? 'Overall Tournament Standings' : activeTab}
              </span>
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {activeTab === 'OVERALL' ? `Top ${qualifyingCount} Qualify` : 'Top 2 Teams Qualify'}
            </span>
          </div>

          <PoolStandingsTable 
            standingsList={displayedList} 
            teamMap={teamMap} 
            getPoolBadgeClasses={getPoolBadgeClasses} 
          />
        </div>
      )}

      {/* Rules Explainer Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap justify-between items-center gap-3 text-xs text-slate-600 shadow-sm">
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">
            Points System: 1 Match Win = <strong>+2 Points</strong> • Loser = <strong>0 Points</strong> (Single 15-Point Set Match).
          </p>
          <p className="text-slate-500 text-[11px]">
            6 Official Match Categories: Veterans • Super • Tariff/Tarifits • 80+ Competition • Orange • Future Star Doubles.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Top 2 Qualifying Zone</span>
          </span>
        </div>
      </div>

    </div>
  );
};

// Reusable responsive Table + Mobile Cards Component
interface PoolStandingsTableProps {
  standingsList: any[];
  teamMap: Map<string, any>;
  getPoolBadgeClasses: (pool?: string) => string;
}

const PoolStandingsTable: React.FC<PoolStandingsTableProps> = ({
  standingsList,
  teamMap,
  getPoolBadgeClasses
}) => {
  if (standingsList.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs font-medium">
        No teams found in this pool.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      
      {/* 1. MOBILE CARDS VIEW (Visible strictly on screens < 640px) */}
      <div className="block sm:hidden space-y-2.5">
        {standingsList.map((standing, index) => {
          const team = teamMap.get(standing.team_id);
          const isTopZone = standing.isTopInPool;

          return (
            <div
              key={standing.id}
              className={`p-3.5 rounded-2xl bg-white border shadow-sm transition-all ${
                isTopZone ? 'border-emerald-300 ring-1 ring-emerald-200/60' : 'border-slate-200'
              }`}
            >
              {/* Header: Rank + Team + Pool Badge */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Rank */}
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black font-mono text-xs shrink-0 ${
                    index === 0
                      ? 'bg-amber-400 text-amber-950 font-black'
                      : index === 1
                      ? 'bg-slate-300 text-slate-800'
                      : index === 2
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    #{standing.displayRank}
                  </span>

                  {/* Team Logo & Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    {team?.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-7 h-7 rounded-lg object-contain bg-slate-900 p-0.5 shrink-0" />
                    ) : (
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] text-white shrink-0"
                        style={{ backgroundColor: team?.team_color || '#333' }}
                      >
                        {team?.short_name || 'T'}
                      </div>
                    )}
                    <span className="font-black text-slate-950 text-xs truncate">
                      {team?.name || 'Team'}
                    </span>
                  </div>
                </div>

                {/* Pool Badge */}
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ${getPoolBadgeClasses(standing.poolLabel)}`}>
                  {standing.poolLabel}
                </span>
              </div>

              {/* Stats Grid: Played, Won, Lost, Diff, Points */}
              <div className="grid grid-cols-5 gap-1.5 pt-2.5 text-center text-xs">
                <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">P</span>
                  <span className="font-mono font-bold text-slate-700">{standing.played}</span>
                </div>
                <div className="bg-emerald-50/60 p-1.5 rounded-xl border border-emerald-100">
                  <span className="text-[9px] uppercase font-bold text-emerald-600 block">W</span>
                  <span className="font-mono font-black text-emerald-700">{standing.won}</span>
                </div>
                <div className="bg-rose-50/60 p-1.5 rounded-xl border border-rose-100">
                  <span className="text-[9px] uppercase font-bold text-rose-500 block">L</span>
                  <span className="font-mono font-bold text-rose-600">{standing.lost}</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">+/-</span>
                  <span className="font-mono font-bold text-slate-700">
                    {standing.score_diff > 0 ? `+${standing.score_diff}` : standing.score_diff}
                  </span>
                </div>
                <div className="bg-slate-900 text-white p-1.5 rounded-xl shadow-sm">
                  <span className="text-[9px] uppercase font-bold text-lime-300 block">PTS</span>
                  <span className="font-mono font-black text-sm text-lime-300">{standing.points}</span>
                </div>
              </div>

              {/* Bottom Qualification Tag */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Owner: {team?.owner_name || 'N/A'}</span>
                {isTopZone ? (
                  <span className="inline-flex items-center gap-1 font-black text-emerald-700 uppercase">
                    <CheckCircle className="w-3 h-3" />
                    <span>Top 2 Qualify</span>
                  </span>
                ) : (
                  <span className="text-slate-400 font-semibold uppercase">
                    In Contention
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. DESKTOP TABLE VIEW (Visible on screens >= 640px) */}
      <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm min-w-[650px]">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Team</th>
                <th className="py-3.5 px-3 text-center">Pool</th>
                <th className="py-3.5 px-3 text-center">Played</th>
                <th className="py-3.5 px-3 text-center">Won</th>
                <th className="py-3.5 px-3 text-center">Lost</th>
                <th className="py-3.5 px-3 text-center font-black text-slate-900">Points</th>
                <th className="py-3.5 px-3 text-center">Score Diff</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {standingsList.map((standing, index) => {
                const team = teamMap.get(standing.team_id);
                const isTopZone = standing.isTopInPool;

                return (
                  <tr 
                    key={standing.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isTopZone ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold font-mono text-xs ${
                        index === 0
                          ? 'bg-amber-400 text-amber-950 font-black shadow-sm'
                          : index === 1
                          ? 'bg-slate-200 text-slate-800'
                          : index === 2
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {standing.displayRank}
                      </span>
                    </td>

                    {/* Team */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {team?.logo_url ? (
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={team.logo_url} alt={team.name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                            style={{ backgroundColor: team?.team_color || '#333' }}
                          >
                            {team?.short_name || 'GBL'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-950 text-sm">{team?.name || 'Team'}</p>
                          <p className="text-[11px] text-slate-400">Owner: {team?.owner_name || 'N/A'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Pool Badge */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${getPoolBadgeClasses(standing.poolLabel)}`}>
                        {standing.poolLabel}
                      </span>
                    </td>

                    {/* Played, Won, Lost */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-600">{standing.played}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-emerald-600 font-bold">{standing.won}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-rose-500">{standing.lost}</td>

                    {/* Points */}
                    <td className="py-3.5 px-3 text-center font-mono font-black text-slate-950 text-base">
                      {standing.points}
                    </td>

                    {/* Score Diff */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-600">
                      {standing.score_diff > 0 ? `+${standing.score_diff}` : standing.score_diff}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {standing.is_qualified || isTopZone ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>Qualifying Zone</span>
                        </span>
                      ) : standing.played > 0 && !isTopZone ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          <span>Elimination Zone</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold uppercase">
                          In Contention
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

