import React, { useState, useMemo } from 'react';
import { Trophy, Clock, MapPin, CheckCircle2, ChevronDown, ChevronUp, Star, Sparkles, Users, Layers, Shield } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { TournamentMatch, TournamentTie, TieCategoryMatch, MatchCategory } from '../../types/database';
import { resolveTeamPool } from '../../lib/teamPools';

const DEFAULT_CATEGORIES: { name: MatchCategory; label: string; desc: string; index: number }[] = [
  { name: 'Veterans Doubles', label: 'Match 1 — Veterans Doubles', desc: 'Veterans Doubles (40+ & 45+)', index: 1 },
  { name: 'Super Doubles', label: 'Match 2 — Super Doubles', desc: 'Super Doubles (Open + Non-Medalist)', index: 2 },
  { name: 'Tariff/Tarifits', label: 'Match 3 — Tariff/Tarifits', desc: 'Tariff / 35+ Jumbled Doubles', index: 3 },
  { name: '80+ Competition', label: 'Match 4 — 80+ Competition', desc: '80+ Combined (Both Age Cal)', index: 4 },
  { name: 'Orange Doubles', label: 'Match 5 — Orange Doubles', desc: 'Orange Doubles / Challengers (40+ & Non-Medalist)', index: 5 },
  { name: 'Future Star Doubles', label: 'Match 6 — Future Star Doubles', desc: 'Future Star Doubles (Non-Medalist & Non-Medalist)', index: 6 }
];

export const ResultsPage: React.FC = () => {
  const { matches, teams } = useTournament();
  const [selectedRound, setSelectedRound] = useState<string>('ALL');
  const [selectedPool, setSelectedPool] = useState<string>('ALL');
  const [expandedTieIds, setExpandedTieIds] = useState<Set<string>>(new Set());

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams]);

  // Group all recorded matches into Ties
  const recordedTies = useMemo<TournamentTie[]>(() => {
    const tieGroups: Record<string, TournamentMatch[]> = {};
    
    matches.forEach(m => {
      const tieKey = m.tie_id || `${m.round}_${[m.team1_id, m.team2_id].sort().join('_')}_${m.match_date || ''}`;
      if (!tieGroups[tieKey]) tieGroups[tieKey] = [];
      tieGroups[tieKey].push(m);
    });

    const tiesList: TournamentTie[] = Object.entries(tieGroups).map(([tieKey, matchGroup]) => {
      const first = matchGroup[0];
      const t1 = first.team1_id;
      const t2 = first.team2_id;

      // Sort matches by category order
      const sortedMatches = [...matchGroup].sort((a, b) => {
        const catIdxA = DEFAULT_CATEGORIES.findIndex(c => c.name === a.category_name);
        const catIdxB = DEFAULT_CATEGORIES.findIndex(c => c.name === b.category_name);
        return (catIdxA >= 0 ? catIdxA : 0) - (catIdxB >= 0 ? catIdxB : 0);
      });

      const catMatches: TieCategoryMatch[] = sortedMatches.map((m, idx) => ({
        id: m.id,
        category_name: m.category_name || DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length].name,
        match_index: idx + 1,
        player1_names: m.player1_names || '',
        player2_names: m.player2_names || '',
        set1_team1: m.set1_team1,
        set1_team2: m.set1_team2,
        set2_team1: 0,
        set2_team2: 0,
        set3_team1: 0,
        set3_team2: 0,
        winner_team_id: m.winner_team_id,
        team1_trump: false,
        team2_trump: false
      }));

      // Calculate score and points (Strictly +2 points per match win, 0 for loss)
      const t1Wins = catMatches.filter(cm => cm.winner_team_id === t1).length;
      const t2Wins = catMatches.filter(cm => cm.winner_team_id === t2).length;

      const team1Points = t1Wins * 2;
      const team2Points = t2Wins * 2;

      return {
        tie_id: tieKey,
        tournament_id: first.tournament_id,
        match_number: first.match_number,
        round: first.round,
        team1_id: t1,
        team2_id: t2,
        court: first.court,
        match_date: first.match_date,
        match_time: first.match_time,
        status: first.status,
        matches: catMatches,
        team1_score: t1Wins,
        team2_score: t2Wins,
        team1_points: team1Points,
        team2_points: team2Points,
        winner_team_id: t1Wins > t2Wins ? t1 : (t2Wins > t1Wins ? t2 : null),
        created_at: first.created_at,
        updated_at: first.updated_at
      };
    });

    return tiesList.sort((a, b) => b.match_number - a.match_number);
  }, [matches]);

  const rounds = useMemo(() => Array.from(new Set(recordedTies.map(t => t.round))), [recordedTies]);

  const filteredTies = useMemo(() => {
    return recordedTies.filter(tie => {
      if (selectedRound !== 'ALL' && tie.round !== selectedRound) return false;
      if (selectedPool !== 'ALL') {
        const t1Pool = resolveTeamPool(teamMap.get(tie.team1_id));
        const t2Pool = resolveTeamPool(teamMap.get(tie.team2_id));
        if (t1Pool !== selectedPool && t2Pool !== selectedPool) return false;
      }
      return true;
    });
  }, [recordedTies, selectedRound, selectedPool, teamMap]);

  const toggleExpand = (tieId: string) => {
    setExpandedTieIds(prev => {
      const next = new Set(prev);
      if (next.has(tieId)) next.delete(tieId);
      else next.add(tieId);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedTieIds(new Set(filteredTies.map(t => t.tie_id)));
  };

  const collapseAll = () => {
    setExpandedTieIds(new Set());
  };

  return (
    <div className="min-h-screen bg-gbl-navy-950 py-8 sm:py-12 px-3 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-[11px] sm:text-xs font-bold text-gbl-orange-400 uppercase tracking-wider">Tournament Clashes &amp; Scores</span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white font-sports uppercase tracking-tight">
            MATCH RESULTS &amp; FIXTURES
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
            Real-time match scores, 6-match category breakdown, Trump Card results, and set outcomes for the Gulf Oil Badminton Premier League.
          </p>
        </div>

        {/* Scoring Rules Ribbon */}
        <div className="bg-gbl-navy-900/80 border border-gbl-navy-800 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Points System:</strong> 1 Match Win = +2 Points | Loser = 0 Points (Single 15-Point Match)</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400 shrink-0" />
            <span><strong>Squad Rule:</strong> Max 2 matches per player per tie</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>6 Categories:</strong> Veterans • Super • Tariff • 80+ • Orange • Future Star</span>
          </div>
        </div>

        {/* Filters Bar (Swipeable on mobile) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gbl-navy-900 p-3 sm:p-4 rounded-2xl border border-gbl-navy-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:pb-0">
            {/* Pool Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 pl-1 flex items-center gap-1 shrink-0">
                <Layers className="w-3.5 h-3.5 text-gbl-orange-400" />
                <span>Pool:</span>
              </span>
              {['ALL', 'Pool A', 'Pool B', 'Pool C'].map(pool => (
                <button
                  key={pool}
                  onClick={() => setSelectedPool(pool)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all shrink-0 ${
                    selectedPool === pool
                      ? pool === 'Pool A'
                        ? 'bg-sky-600 text-white shadow-md'
                        : pool === 'Pool B'
                        ? 'bg-amber-600 text-white shadow-md'
                        : pool === 'Pool C'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-gbl-orange-600 text-white shadow-md'
                      : 'bg-gbl-navy-950 text-slate-400 hover:text-white border border-gbl-navy-800'
                  }`}
                >
                  {pool === 'ALL' ? 'All Pools' : pool}
                </button>
              ))}
            </div>

            {/* Round Filter */}
            {rounds.length > 0 && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-gbl-navy-800 shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 pl-1 shrink-0">Round:</span>
                <button
                  onClick={() => setSelectedRound('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all shrink-0 ${
                    selectedRound === 'ALL'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-gbl-navy-950 text-slate-400 hover:text-white border border-gbl-navy-800'
                  }`}
                >
                  All
                </button>
                {rounds.map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRound(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all shrink-0 ${
                      selectedRound === r
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'bg-gbl-navy-950 text-slate-400 hover:text-white border border-gbl-navy-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Toggle All */}
          {filteredTies.length > 0 && (
            <div className="flex items-center justify-end gap-2 text-xs shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-gbl-navy-800">
              <button
                onClick={expandAll}
                className="px-2.5 py-1 rounded-lg bg-gbl-navy-950 hover:bg-gbl-navy-800 text-slate-300 hover:text-white border border-gbl-navy-800 text-[11px]"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 rounded-lg bg-gbl-navy-950 hover:bg-gbl-navy-800 text-slate-300 hover:text-white border border-gbl-navy-800 text-[11px]"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* Ties List */}
        {filteredTies.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl space-y-3 px-4">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No clash results found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Match schedules and clash results will appear here as ties are played and recorded by tournament directors.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTies.map((tie) => {
              const team1 = teamMap.get(tie.team1_id);
              const team2 = teamMap.get(tie.team2_id);
              const isExpanded = expandedTieIds.has(tie.tie_id);
              const isT1Winner = tie.team1_score > tie.team2_score;
              const isT2Winner = tie.team2_score > tie.team1_score;

              const t1Pool = resolveTeamPool(team1);
              const t2Pool = resolveTeamPool(team2);
              const tiePool = t1Pool || t2Pool;

              return (
                <div
                  key={tie.tie_id}
                  className="bg-gbl-navy-900 border border-gbl-navy-800 hover:border-gbl-navy-700 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl transition-all"
                >
                  {/* Tie Summary Header */}
                  <div className="p-4 sm:p-6 flex flex-col gap-4 bg-gradient-to-r from-gbl-navy-900 via-gbl-navy-950/40 to-gbl-navy-900">
                    
                    {/* Top Row: Clash Info + Pool Badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-gbl-navy-800/80">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gbl-orange-600/20 text-gbl-orange-400 border border-gbl-orange-500/30">
                          Tie #{tie.match_number} • {tie.round}
                        </span>
                        {tiePool && (
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                            tiePool === 'Pool A'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : tiePool === 'Pool B'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}>
                            {tiePool}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {tie.match_time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{tie.court} • {tie.match_date}</span>
                      </p>
                    </div>

                    {/* Middle: Teams vs Teams Clash Score (Mobile & Desktop Optimized) */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      
                      {/* Team 1 vs Team 2 Container */}
                      <div className="flex items-center justify-between sm:justify-center gap-3 sm:gap-6 flex-1 w-full">
                        {/* Team 1 */}
                        <div className="flex items-center gap-2 sm:gap-3 text-left sm:text-right flex-1 sm:justify-end min-w-0">
                          <div className="truncate">
                            <div className="flex items-center sm:justify-end gap-1.5 flex-wrap">
                              {t1Pool && (
                                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                                  t1Pool === 'Pool A' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : t1Pool === 'Pool B' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                }}`}>
                                  {t1Pool}
                                </span>
                              )}
                              <p className="text-xs sm:text-sm font-black text-white uppercase truncate">{team1?.name || 'Team 1'}</p>
                            </div>
                            <p className="text-[11px] text-emerald-400 font-mono font-bold">+{tie.team1_points} Pts</p>
                          </div>
                          {team1?.logo_url ? (
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-slate-700 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                              <img src={team1.logo_url} alt={team1.name} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div 
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md"
                              style={{ backgroundColor: team1?.team_color || '#333' }}
                            >
                              {team1?.short_name || 'T1'}
                            </div>
                          )}
                        </div>

                        {/* Score Badge in Center */}
                        <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-gbl-navy-950 border border-gbl-navy-800 text-center shrink-0 shadow-inner">
                          <div className="text-lg sm:text-2xl font-black font-mono tracking-tight text-white">
                            <span className={isT1Winner ? 'text-emerald-400 font-bold' : ''}>{tie.team1_score}</span>
                            <span className="text-slate-500 mx-1.5 sm:mx-2">-</span>
                            <span className={isT2Winner ? 'text-emerald-400 font-bold' : ''}>{tie.team2_score}</span>
                          </div>
                          <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                            6 Matches
                          </span>
                        </div>

                        {/* Team 2 */}
                        <div className="flex items-center gap-2 sm:gap-3 text-right sm:text-left flex-1 sm:justify-start min-w-0 flex-row-reverse sm:flex-row">
                          {team2?.logo_url ? (
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-slate-700 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                              <img src={team2.logo_url} alt={team2.name} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div 
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md"
                              style={{ backgroundColor: team2?.team_color || '#333' }}
                            >
                              {team2?.short_name || 'T2'}
                            </div>
                          )}
                          <div className="truncate">
                            <div className="flex items-center sm:justify-start gap-1.5 flex-wrap justify-end">
                              <p className="text-xs sm:text-sm font-black text-white uppercase truncate">{team2?.name || 'Team 2'}</p>
                              {t2Pool && (
                                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                                  t2Pool === 'Pool A' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : t2Pool === 'Pool B' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                }}`}>
                                  {t2Pool}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-emerald-400 font-mono font-bold">+{tie.team2_points} Pts</p>
                          </div>
                        </div>
                      </div>

                      {/* Expand Button */}
                      <button
                        onClick={() => toggleExpand(tie.tie_id)}
                        className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gbl-navy-800 hover:bg-gbl-navy-700 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-gbl-navy-700 shrink-0"
                      >
                        <span>{isExpanded ? 'Hide Category Matches' : 'View 6 Matches'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                    </div>

                  </div>

                  {/* Expandable 6-Match Breakdown */}
                  {isExpanded && (
                    <div className="border-t border-gbl-navy-800 bg-gbl-navy-950/60 p-4 sm:p-6 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-gbl-orange-400" />
                        <span>Individual Match Category Breakdown (6 Matches — 15 Points Format)</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tie.matches.map((m, idx) => {
                          const isW1 = m.winner_team_id === tie.team1_id;
                          const isW2 = m.winner_team_id === tie.team2_id;

                          return (
                            <div 
                              key={m.id || idx}
                              className="p-3.5 rounded-2xl border transition-all space-y-2 text-xs bg-gbl-navy-900 border-gbl-navy-800"
                            >
                              <div className="flex justify-between items-start gap-1">
                                <div>
                                  <span className="font-bold text-white block">
                                    {DEFAULT_CATEGORIES[idx]?.label || `${idx + 1}. ${m.category_name}`}
                                  </span>
                                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                    Set 1: {m.set1_team1} - {m.set1_team2} (15 Pts)
                                  </span>
                                </div>

                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                                  +2 PTS WIN
                                </span>
                              </div>

                              {/* Players & Outcome */}
                              <div className="space-y-1 pt-1 border-t border-gbl-navy-800/80">
                                <div className={`flex justify-between items-center ${isW1 ? 'font-bold text-emerald-400' : 'text-slate-300'}`}>
                                  <span className="truncate">{team1?.short_name}: {m.player1_names || 'Pair 1'}</span>
                                  {isW1 && <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> +2 Pts</span>}
                                </div>
                                <div className={`flex justify-between items-center ${isW2 ? 'font-bold text-emerald-400' : 'text-slate-300'}`}>
                                  <span className="truncate">{team2?.short_name}: {m.player2_names || 'Pair 2'}</span>
                                  {isW2 && <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> +2 Pts</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

