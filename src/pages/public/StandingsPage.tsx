import React from 'react';
import { Trophy, CheckCircle, XCircle } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';

export const StandingsPage: React.FC = () => {
  const { standings, teams, settings } = useTournament();

  const teamMap = new Map(teams.map(t => [t.id, t]));
  const qualifyingCount = settings.qualifying_teams_count || 8;

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
            Points Table &amp; Qualification
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            Top <strong className="text-lime-300">{qualifyingCount} teams</strong> qualify for the knockout quarter-finals stage based on points and set differentials.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-300 flex items-center gap-2 shrink-0">
          <Trophy className="w-4 h-4 text-lime-300" />
          <span>Season 04 Championship</span>
        </div>
      </div>

      {/* Standings Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm min-w-[600px]">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Team</th>
                <th className="py-3.5 px-3 text-center">Played</th>
                <th className="py-3.5 px-3 text-center">Won</th>
                <th className="py-3.5 px-3 text-center">Lost</th>
                <th className="py-3.5 px-3 text-center font-black text-slate-900">Points</th>
                <th className="py-3.5 px-3 text-center hidden md:table-cell">Score Diff</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {standings.map((standing, index) => {
                const team = teamMap.get(standing.team_id);
                const isTopZone = index < qualifyingCount;

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
                        {index + 1}
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
                          <p className="text-[11px] text-slate-400">Owner: {team?.owner_name}</p>
                        </div>
                      </div>
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
                      {standing.is_qualified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>Qualified</span>
                        </span>
                      ) : standing.played > 0 && !isTopZone ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          <span>Eliminated</span>
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

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Top {qualifyingCount} Teams Qualify</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Elimination Zone</span>
            </span>
          </div>
          <p>2 Points awarded per match victory. Tie-breakers determined by Set &amp; Point Differential.</p>
        </div>
      </div>

    </div>
  );
};
