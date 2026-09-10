import React, { useState, useMemo } from 'react';
import { Trophy, CheckCircle, XCircle, Layers, Sparkles } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';

export const StandingsPage: React.FC = () => {
  const { standings, teams, settings } = useTournament();
  const [activeTab, setActiveTab] = useState<string>('Pool A');

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
      .map(t => t.pool)
      .filter((p): p is string => Boolean(p && p !== 'Unassigned' && !defaultPools.includes(p)));
    const uniqueCustom = Array.from(new Set(customPools));
    return [...defaultPools, ...uniqueCustom];
  }, [teams]);

  // Filter and sort standings based on active tab
  const getDisplayedStandings = () => {
    if (activeTab === 'OVERALL') {
      return fullStandings.map((s, idx) => ({
        ...s,
        displayRank: idx + 1,
        poolLabel: teamMap.get(s.team_id)?.pool || 'Unassigned',
        isTopInPool: idx < qualifyingCount
      }));
    }

    const poolTeamIds = new Set(
      teams.filter(t => (t.pool || '').toLowerCase() === activeTab.toLowerCase()).map(t => t.id)
    );
    const poolStandings = fullStandings.filter(s => poolTeamIds.has(s.team_id));
    return poolStandings.map((s, idx) => ({
      ...s,
      displayRank: idx + 1,
      poolLabel: activeTab,
      isTopInPool: idx < 2 // Top 2 in pool qualify
    }));
  };

  const displayedList = getDisplayedStandings();

  // Helper for pool theme colors
  const getPoolColorClasses = (poolName: string, isActive: boolean) => {
    if (!isActive) return 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50';
    if (poolName === 'Pool A') return 'bg-sky-600 text-white shadow-lg shadow-sky-600/30';
    if (poolName === 'Pool B') return 'bg-amber-600 text-white shadow-lg shadow-amber-600/30';
    if (poolName === 'Pool C') return 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30';
    return 'bg-purple-600 text-white shadow-lg shadow-purple-600/30';
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-6 text-slate-950">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-[#122023] px-6 py-6 sm:px-8 sm:py-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
        <div className="text-left max-w-2xl">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.23em] text-lime-300">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
            Tournament Table &amp; Standings
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-[-0.05em]">
            Points Table &amp; Pool Standings
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            Gulf Oil Badminton Premier League tournament standings. {teams.length} teams compete across tournament pools for qualification into knockout stages.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-300 flex items-center gap-2 shrink-0">
          <Trophy className="w-4 h-4 text-lime-300" />
          <span>Season 04 Championship</span>
        </div>
      </div>

      {/* Dynamic Pool Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {availablePools.map(poolName => {
          const count = teams.filter(t => (t.pool || '').toLowerCase() === poolName.toLowerCase()).length;
          const isActive = activeTab === poolName;

          return (
            <button
              key={poolName}
              onClick={() => setActiveTab(poolName)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${getPoolColorClasses(poolName, isActive)}`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{poolName} ({count} Teams)</span>
            </button>
          );
        })}

        <button
          onClick={() => setActiveTab('OVERALL')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'OVERALL'
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-lime-400" />
          <span>Overall Standings (All {teams.length} Teams)</span>
        </button>
      </div>

      {/* Standings Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
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
                <th className="py-3.5 px-3 text-center hidden md:table-cell">Score Diff</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">No teams assigned to this pool yet.</p>
                    <p className="text-xs mt-1">Pool allocations will be assigned by tournament organizers following the live auction.</p>
                  </td>
                </tr>
              ) : (
                displayedList.map((standing, index) => {
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
                            ? 'bg-lime-300 text-lime-950 shadow-sm'
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          standing.poolLabel === 'Pool A'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : standing.poolLabel === 'Pool B'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : standing.poolLabel === 'Pool C'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
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
                      <td className="py-3.5 px-3 text-center font-mono text-slate-600 hidden md:table-cell">
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Points Rules Explainer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3 text-xs text-slate-600">
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              Points System: Normal Match Wins (1 win → 1 pt, 2 wins → 2 pts, 3 wins → 3 pts, 4 wins → 5 pts bonus).
            </p>
            <p className="text-slate-500 text-[11px]">
              Trump Card Match: Winning a Trump Card match awards <strong>2 points</strong> to the victor. Tie-breakers determined by Set &amp; Point Differential.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Qualifying Zone</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Elimination Zone</span>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
