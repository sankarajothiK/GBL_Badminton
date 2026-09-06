import React, { useState } from 'react';
import { Trophy, Calendar, MapPin, Award, CheckCircle2 } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';

export const ResultsPage: React.FC = () => {
  const { matches, teams, categories } = useTournament();
  const [selectedRound, setSelectedRound] = useState<string>('ALL');

  const teamMap = new Map(teams.map(t => [t.id, t]));

  const filteredMatches = matches.filter(m => {
    if (selectedRound === 'ALL') return true;
    return m.round === selectedRound;
  });

  const rounds = Array.from(new Set(matches.map(m => m.round)));

  return (
    <div className="min-h-screen bg-gbl-navy-950 py-8 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-[11px] sm:text-xs font-bold text-gbl-orange-400 uppercase tracking-wider">Tournament Clashes</span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white font-sports uppercase tracking-tight">
            MATCH RESULTS & FIXTURES
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 px-2">
            Real-time match scores and set outcomes for the Gulf Oil Badminton Premier League.
          </p>
        </div>

        {/* Round Filter */}
        {rounds.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedRound('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                selectedRound === 'ALL'
                  ? 'bg-gbl-orange-600 text-white shadow-lg'
                  : 'bg-gbl-navy-900 text-slate-400 hover:text-white border border-gbl-navy-800'
              }`}
            >
              All Rounds
            </button>
            {rounds.map(r => (
              <button
                key={r}
                onClick={() => setSelectedRound(r)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  selectedRound === r
                    ? 'bg-gbl-orange-600 text-white shadow-lg'
                    : 'bg-gbl-navy-900 text-slate-400 hover:text-white border border-gbl-navy-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {/* Matches List */}
        {filteredMatches.length === 0 ? (
          <div className="text-center py-20 bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl space-y-3">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No matches scheduled or recorded yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Match schedules and results will be recorded by tournament directors after completion of the live player auction.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMatches.map((match) => {
              const team1 = teamMap.get(match.team1_id);
              const team2 = teamMap.get(match.team2_id);
              const isWinner1 = match.winner_team_id === match.team1_id;
              const isWinner2 = match.winner_team_id === match.team2_id;

              return (
                <div
                  key={match.id}
                  className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-2xl p-6 shadow-xl space-y-4"
                >
                  <div className="flex justify-between items-center text-xs pb-3 border-b border-gbl-navy-800">
                    <span className="font-bold text-gbl-orange-400 uppercase tracking-wider">{match.round} • Match #{match.match_number}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      match.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : match.status === 'LIVE'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {match.status}
                    </span>
                  </div>

                  {/* Teams and Scores comparison */}
                  <div className="space-y-3">
                    {/* Team 1 */}
                    <div className={`p-3 rounded-xl flex items-center justify-between gap-2 border ${
                      isWinner1 ? 'bg-emerald-950/20 border-emerald-500/40 text-white' : 'bg-gbl-navy-950 border-gbl-navy-800/80 text-slate-300'
                    }`}>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {team1?.logo_url ? (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 border border-slate-700 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={team1.logo_url} alt={team1.name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow" style={{ backgroundColor: team1?.team_color || '#333' }}>
                            {team1?.short_name || 'T1'}
                          </div>
                        )}
                        <span className="text-xs sm:text-sm font-bold truncate">{team1?.name || 'Team 1'}</span>
                        {isWinner1 && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs font-bold shrink-0">
                        <span className="px-1.5 sm:px-2 py-1 bg-gbl-navy-900 rounded">{match.set1_team1}</span>
                        <span className="px-1.5 sm:px-2 py-1 bg-gbl-navy-900 rounded">{match.set2_team1}</span>
                        {match.set3_team1 > 0 && <span className="px-1.5 sm:px-2 py-1 bg-gbl-navy-900 rounded">{match.set3_team1}</span>}
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div className={`p-3 rounded-xl flex items-center justify-between gap-2 border ${
                      isWinner2 ? 'bg-emerald-950/20 border-emerald-500/40 text-white' : 'bg-gbl-navy-950 border-gbl-navy-800/80 text-slate-300'
                    }`}>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {team2?.logo_url ? (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 border border-slate-700 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={team2.logo_url} alt={team2.name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow" style={{ backgroundColor: team2?.team_color || '#333' }}>
                            {team2?.short_name || 'T2'}
                          </div>
                        )}
                        <span className="text-xs sm:text-sm font-bold truncate">{team2?.name || 'Team 2'}</span>
                        {isWinner2 && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs font-bold shrink-0">
                        <span className="px-1.5 sm:px-2 py-1 bg-gbl-navy-900 rounded">{match.set1_team2}</span>
                        <span className="px-1.5 sm:px-2 py-1 bg-gbl-navy-900 rounded">{match.set2_team2}</span>
                        {match.set3_team2 > 0 && <span className="px-1.5 sm:px-2 py-1 bg-gbl-navy-900 rounded">{match.set3_team2}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Footer date & court */}
                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                    <span>{match.court} • {match.match_time}</span>
                    {match.score_summary && <span className="font-semibold text-white">{match.score_summary}</span>}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
