import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Plus, 
  CheckCircle2, 
  Edit2, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Shield, 
  Users,
  AlertTriangle
} from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { TournamentMatch, TournamentTie, TieCategoryMatch, MATCH_CATEGORIES, MatchCategory } from '../../types/database';
import { Modal } from '../../components/common/Modal';
import { resolveTeamPool } from '../../lib/teamPools';

const DEFAULT_CATEGORIES: { name: MatchCategory; desc: string }[] = [
  { name: 'Veterans Doubles', desc: 'Experienced senior masters clash' },
  { name: '80+ Combined Doubles', desc: 'Combined player age total 80+ years' },
  { name: 'Super Doubles', desc: 'Premier doubles power clash' },
  { name: 'Futures Doubles', desc: 'Rising future stars category' },
  { name: 'Challengers Doubles', desc: 'High-intensity challengers battle' },
  { name: '35+ Doubles', desc: 'Veteran players aged 35 and above' }
];

function calculateBaseWinPoints(wins: number): number {
  if (wins === 1) return 1;
  if (wins === 2) return 2;
  if (wins === 3) return 3;
  if (wins === 4) return 5;
  if (wins === 5) return 6;
  if (wins >= 6) return 7;
  return 0;
}

export const AdminResults: React.FC = () => {
  const { matches, teams, players, saveTieResult, deleteTie } = useTournament();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmTieId, setDeleteConfirmTieId] = useState<string | null>(null);
  const [editingTieId, setEditingTieId] = useState<string | null>(null);
  const [expandedTieIds, setExpandedTieIds] = useState<Set<string>>(new Set());

  // Tie metadata form state
  const [round, setRound] = useState('Group Stage');
  const [matchNumber, setMatchNumber] = useState(1);
  const [court, setCourt] = useState('Court 1');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [matchTime, setMatchTime] = useState('06:00 PM');
  const [team1Id, setTeam1Id] = useState(teams[0]?.id || '');
  const [team2Id, setTeam2Id] = useState(teams[1]?.id || '');

  // 6 Match Categories state
  const [categoryMatches, setCategoryMatches] = useState<TieCategoryMatch[]>(() => {
    return DEFAULT_CATEGORIES.map((cat, idx) => ({
      id: `cm_${idx}_${Date.now()}`,
      category_name: cat.name,
      match_index: idx + 1,
      player1_names: '',
      player2_names: '',
      set1_team1: 21,
      set1_team2: 18,
      set2_team1: 21,
      set2_team2: 19,
      set3_team1: 0,
      set3_team2: 0,
      winner_team_id: teams[0]?.id || '',
      team1_trump: false,
      team2_trump: false
    }));
  });

  const [formError, setFormError] = useState<string | null>(null);

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams]);

  // Squad players for selected teams
  const team1Squad = useMemo(() => {
    return players.filter(p => p.sold_team_id === team1Id);
  }, [players, team1Id]);

  const team2Squad = useMemo(() => {
    return players.filter(p => p.sold_team_id === team2Id);
  }, [players, team2Id]);

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

      // Sort matches by index or category
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
        set2_team1: m.set2_team1,
        set2_team2: m.set2_team2,
        set3_team1: m.set3_team1,
        set3_team2: m.set3_team2,
        winner_team_id: m.winner_team_id,
        team1_trump: Boolean(m.team1_trump || (m.is_trump_match && m.trump_team_id === t1)),
        team2_trump: Boolean(m.team2_trump || (m.is_trump_match && m.trump_team_id === t2)),
        is_trump_match: m.is_trump_match,
        trump_team_id: m.trump_team_id
      }));

      // Calculate score and points
      const t1Wins = catMatches.filter(cm => cm.winner_team_id === t1).length;
      const t2Wins = catMatches.filter(cm => cm.winner_team_id === t2).length;

      const t1Base = calculateBaseWinPoints(t1Wins);
      const t2Base = calculateBaseWinPoints(t2Wins);

      let t1Trump = 0;
      let t2Trump = 0;

      catMatches.forEach(cm => {
        const isDual = (cm.team1_trump && cm.team2_trump) || cm.trump_team_id === 'BOTH';
        if (isDual) {
          if (cm.winner_team_id === t1) t1Trump += 4;
          else if (cm.winner_team_id === t2) t2Trump += 4;
        } else {
          if (cm.team1_trump && cm.winner_team_id === t1) t1Trump += 2;
          if (cm.team2_trump && cm.winner_team_id === t2) t2Trump += 2;
        }
      });

      const team1Points = t1Base + t1Trump;
      const team2Points = t2Base + t2Trump;

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

  // Compute player participation counts for validation in current form
  const playerMatchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categoryMatches.forEach(cm => {
      const t1Players = cm.player1_names ? cm.player1_names.split('&').map(s => s.trim()).filter(Boolean) : [];
      const t2Players = cm.player2_names ? cm.player2_names.split('&').map(s => s.trim()).filter(Boolean) : [];

      t1Players.forEach(p => {
        counts[`t1_${p}`] = (counts[`t1_${p}`] || 0) + 1;
      });
      t2Players.forEach(p => {
        counts[`t2_${p}`] = (counts[`t2_${p}`] || 0) + 1;
      });
    });
    return counts;
  }, [categoryMatches]);

  // Live tie calculations for current modal form
  const currentTieSummary = useMemo(() => {
    const t1Wins = categoryMatches.filter(cm => cm.winner_team_id === team1Id).length;
    const t2Wins = categoryMatches.filter(cm => cm.winner_team_id === team2Id).length;

    const t1Base = calculateBaseWinPoints(t1Wins);
    const t2Base = calculateBaseWinPoints(t2Wins);

    let t1Trump = 0;
    let t2Trump = 0;

    categoryMatches.forEach(cm => {
      const isDual = cm.team1_trump && cm.team2_trump;
      if (isDual) {
        if (cm.winner_team_id === team1Id) t1Trump += 4;
        else if (cm.winner_team_id === team2Id) t2Trump += 4;
      } else {
        if (cm.team1_trump && cm.winner_team_id === team1Id) t1Trump += 2;
        if (cm.team2_trump && cm.winner_team_id === team2Id) t2Trump += 2;
      }
    });

    return {
      t1Wins,
      t2Wins,
      t1Base,
      t2Base,
      t1Trump,
      t2Trump,
      t1Total: t1Base + t1Trump,
      t2Total: t2Base + t2Trump
    };
  }, [categoryMatches, team1Id, team2Id]);

  // Open Create Modal
  const openAdd = () => {
    setEditingTieId(null);
    setMatchNumber(recordedTies.length + 1);
    setRound('Group Stage');
    setCourt('Court 1');
    setMatchDate(new Date().toISOString().slice(0, 10));
    setMatchTime('06:00 PM');
    const t1 = teams[0]?.id || '';
    const t2 = teams[1]?.id || '';
    setTeam1Id(t1);
    setTeam2Id(t2);
    setFormError(null);

    setCategoryMatches(
      DEFAULT_CATEGORIES.map((cat, idx) => ({
        id: `cm_${idx}_${Date.now()}`,
        category_name: cat.name,
        match_index: idx + 1,
        player1_names: '',
        player2_names: '',
        set1_team1: 21,
        set1_team2: 18,
        set2_team1: 21,
        set2_team2: 19,
        set3_team1: 0,
        set3_team2: 0,
        winner_team_id: t1,
        team1_trump: false,
        team2_trump: false
      }))
    );

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEdit = (tie: TournamentTie) => {
    setEditingTieId(tie.tie_id);
    setMatchNumber(tie.match_number);
    setRound(tie.round);
    setCourt(tie.court);
    setMatchDate(tie.match_date);
    setMatchTime(tie.match_time);
    setTeam1Id(tie.team1_id);
    setTeam2Id(tie.team2_id);
    setFormError(null);

    // Map existing or default 6 categories
    const filledMatches: TieCategoryMatch[] = DEFAULT_CATEGORIES.map((cat, idx) => {
      const existing = tie.matches.find(m => m.category_name === cat.name) || tie.matches[idx];
      if (existing) {
        return {
          ...existing,
          category_name: cat.name,
          match_index: idx + 1
        };
      }
      return {
        id: `cm_${idx}_${Date.now()}`,
        category_name: cat.name,
        match_index: idx + 1,
        player1_names: '',
        player2_names: '',
        set1_team1: 21,
        set1_team2: 18,
        set2_team1: 21,
        set2_team2: 19,
        set3_team1: 0,
        set3_team2: 0,
        winner_team_id: tie.team1_id,
        team1_trump: false,
        team2_trump: false
      };
    });

    setCategoryMatches(filledMatches);
    setIsModalOpen(true);
  };

  // Handle match category changes
  const updateMatchField = <K extends keyof TieCategoryMatch>(
    idx: number,
    field: K,
    val: TieCategoryMatch[K]
  ) => {
    setCategoryMatches(prev => {
      const next = [...prev];
      const match = { ...next[idx], [field]: val };

      // Auto compute winner if set scores changed
      if (field === 'set1_team1' || field === 'set1_team2' || field === 'set2_team1' || field === 'set2_team2' || field === 'set3_team1' || field === 'set3_team2') {
        let t1Sets = 0;
        let t2Sets = 0;

        const s1_t1 = field === 'set1_team1' ? Number(val) : match.set1_team1;
        const s1_t2 = field === 'set1_team2' ? Number(val) : match.set1_team2;
        if (s1_t1 > s1_t2) t1Sets++;
        else if (s1_t2 > s1_t1) t2Sets++;

        const s2_t1 = field === 'set2_team1' ? Number(val) : match.set2_team1;
        const s2_t2 = field === 'set2_team2' ? Number(val) : match.set2_team2;
        if (s2_t1 > s2_t2) t1Sets++;
        else if (s2_t2 > s2_t1) t2Sets++;

        const s3_t1 = field === 'set3_team1' ? Number(val) : match.set3_team1;
        const s3_t2 = field === 'set3_team2' ? Number(val) : match.set3_team2;
        if (s3_t1 > 0 || s3_t2 > 0) {
          if (s3_t1 > s3_t2) t1Sets++;
          else if (s3_t2 > s3_t1) t2Sets++;
        }

        if (t1Sets > t2Sets) match.winner_team_id = team1Id;
        else if (t2Sets > t1Sets) match.winner_team_id = team2Id;
      }

      next[idx] = match;
      return next;
    });
  };

  // Toggle Trump selection for a team (enforces at most 1 trump per team in tie)
  const toggleTeamTrump = (idx: number, team: 'team1' | 'team2') => {
    setCategoryMatches(prev => {
      const currentVal = team === 'team1' ? prev[idx].team1_trump : prev[idx].team2_trump;
      const newVal = !currentVal;

      return prev.map((m, i) => {
        if (team === 'team1') {
          return { ...m, team1_trump: i === idx ? newVal : false };
        } else {
          return { ...m, team2_trump: i === idx ? newVal : false };
        }
      });
    });
  };

  // Helper for selecting doubles player pair from squad
  const handlePlayerSelect = (matchIdx: number, team: 'team1' | 'team2', slot: 'p1' | 'p2', playerName: string) => {
    setCategoryMatches(prev => {
      const next = [...prev];
      const match = { ...next[matchIdx] };
      const currentNames = (team === 'team1' ? match.player1_names : match.player2_names) || '';
      const parts = currentNames.split('&').map(s => s.trim()).filter(Boolean);

      let p1 = parts[0] || '';
      let p2 = parts[1] || '';

      if (slot === 'p1') p1 = playerName;
      if (slot === 'p2') p2 = playerName;

      const combined = [p1, p2].filter(Boolean).join(' & ');

      if (team === 'team1') {
        match.player1_names = combined;
      } else {
        match.player2_names = combined;
      }

      next[matchIdx] = match;
      return next;
    });
  };

  // Validate and Save Tie Result
  const handleSaveTie = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (team1Id === team2Id) {
      setFormError('Team 1 and Team 2 cannot be the same team.');
      return;
    }

    // Check player match counts (max 2 matches per player in a tie)
    for (const [key, count] of Object.entries(playerMatchCounts)) {
      if (count > 2) {
        const playerName = key.replace('t1_', '').replace('t2_', '');
        const teamLabel = key.startsWith('t1_') ? teamMap.get(team1Id)?.name : teamMap.get(team2Id)?.name;
        setFormError(`Player Rule Violation: "${playerName}" (${teamLabel}) is selected for ${count} matches. Maximum allowed per player in a tie is 2 matches.`);
        return;
      }
    }

    const tieId = editingTieId || `tie_${Date.now()}_${team1Id.slice(0, 4)}_${team2Id.slice(0, 4)}`;

    const tieObj: TournamentTie = {
      tie_id: tieId,
      tournament_id: '00000000-0000-0000-0000-000000000001',
      match_number: Number(matchNumber),
      round,
      team1_id: team1Id,
      team2_id: team2Id,
      court,
      match_date: matchDate,
      match_time: matchTime,
      status: 'COMPLETED',
      matches: categoryMatches,
      team1_score: currentTieSummary.t1Wins,
      team2_score: currentTieSummary.t2Wins,
      team1_points: currentTieSummary.t1Total,
      team2_points: currentTieSummary.t2Total,
      winner_team_id: currentTieSummary.t1Wins > currentTieSummary.t2Wins ? team1Id : (currentTieSummary.t2Wins > currentTieSummary.t1Wins ? team2Id : null),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await saveTieResult(tieObj);
    setIsModalOpen(false);
  };

  // Confirm and execute delete
  const executeDeleteTie = async () => {
    if (!deleteConfirmTieId) return;
    await deleteTie(deleteConfirmTieId);
    setDeleteConfirmTieId(null);
  };

  const toggleExpand = (tieId: string) => {
    setExpandedTieIds(prev => {
      const next = new Set(prev);
      if (next.has(tieId)) next.delete(tieId);
      else next.add(tieId);
      return next;
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
      
      {/* Header Banner */}
      <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gbl-orange-400 uppercase tracking-widest mb-1">
            <Trophy className="w-4 h-4" />
            <span>Official Clashes &amp; Scoring Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white font-sports uppercase tracking-tight">
            MATCH RESULTS &amp; FIXTURES
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Record complete 6-match tie clashes with doubles player pairs, 3 set scores, Trump Card multipliers, and automatic tournament points calculations.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-gbl-orange-600 to-amber-500 hover:from-gbl-orange-500 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl shadow-gbl-orange-600/30 hover:scale-105 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Tie (6 Matches)</span>
        </button>
      </div>

      {/* Rules Notice */}
      <div className="bg-gbl-navy-950/80 border border-gbl-navy-800 rounded-2xl p-4 flex flex-wrap gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          <span><strong>Point Table:</strong> 1W=1pt • 2W=2pt • 3W=3pt • 4W=5pt • 5W=6pt • 6W=7pt</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span><strong>Trump Rules:</strong> +2 Pts for Trump win • +4 Pts if both teams call Trump on same match</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-400" />
          <span><strong>Player Rule:</strong> Max 2 matches per player per tie</span>
        </div>
      </div>

      {/* Recorded Ties List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white font-sports uppercase tracking-wider flex items-center gap-2">
          <span>Official Recorded Clashes</span>
          <span className="px-2.5 py-0.5 rounded-full bg-gbl-navy-800 text-slate-300 text-xs font-mono font-bold">
            {recordedTies.length}
          </span>
        </h2>

        {recordedTies.length === 0 ? (
          <div className="text-center py-16 bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl space-y-3">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No clash results recorded yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click "Record New Tie (6 Matches)" above to enter the first full 6-category fixture scores.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recordedTies.map((tie) => {
              const t1 = teamMap.get(tie.team1_id);
              const t2 = teamMap.get(tie.team2_id);
              const isExpanded = expandedTieIds.has(tie.tie_id);
              const isT1Winner = tie.team1_score > tie.team2_score;
              const isT2Winner = tie.team2_score > tie.team1_score;

              return (
                <div 
                  key={tie.tie_id}
                  className="bg-gbl-navy-900 border border-gbl-navy-800 hover:border-gbl-navy-700 rounded-3xl overflow-hidden shadow-xl transition-all"
                >
                  {/* Tie Summary Header */}
                  <div className="p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-gbl-navy-900 via-gbl-navy-950/40 to-gbl-navy-900">
                    
                    {/* Left: Round & Clash Info */}
                    <div className="space-y-1 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gbl-orange-600/20 text-gbl-orange-400 border border-gbl-orange-500/30">
                          Tie #{tie.match_number} • {tie.round}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {tie.match_time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{tie.court} • {tie.match_date}</span>
                      </p>
                    </div>

                    {/* Middle: Teams vs Teams Clash Score */}
                    <div className="flex items-center gap-4 sm:gap-8 flex-1 justify-center w-full lg:w-auto">
                      {/* Team 1 */}
                      <div className="flex items-center gap-3 text-right flex-1 justify-end min-w-0">
                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-black text-white uppercase truncate">{t1?.name || 'Team 1'}</p>
                          <p className="text-[11px] text-emerald-400 font-mono font-bold">+{tie.team1_points} Pts</p>
                        </div>
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md"
                          style={{ backgroundColor: t1?.team_color || '#333' }}
                        >
                          {t1?.short_name || 'T1'}
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="px-4 py-2 rounded-2xl bg-gbl-navy-950 border border-gbl-navy-800 text-center shrink-0">
                        <div className="text-lg sm:text-2xl font-black font-mono tracking-tight text-white">
                          <span className={isT1Winner ? 'text-emerald-400' : ''}>{tie.team1_score}</span>
                          <span className="text-slate-500 mx-2">-</span>
                          <span className={isT2Winner ? 'text-emerald-400' : ''}>{tie.team2_score}</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                          6 Matches
                        </span>
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center gap-3 text-left flex-1 justify-start min-w-0">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md"
                          style={{ backgroundColor: t2?.team_color || '#333' }}
                        >
                          {t2?.short_name || 'T2'}
                        </div>
                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-black text-white uppercase truncate">{t2?.name || 'Team 2'}</p>
                          <p className="text-[11px] text-emerald-400 font-mono font-bold">+{tie.team2_points} Pts</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                      <button
                        onClick={() => toggleExpand(tie.tie_id)}
                        className="px-3 py-1.5 rounded-xl bg-gbl-navy-800 hover:bg-gbl-navy-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>{isExpanded ? 'Hide Matches' : 'View 6 Matches'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => openEdit(tie)}
                        className="p-2 rounded-xl bg-gbl-navy-800 hover:bg-gbl-navy-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit Clash"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmTieId(tie.tie_id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
                        title="Delete Clash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                  {/* Expandable 6-Match Breakdown Table */}
                  {isExpanded && (
                    <div className="border-t border-gbl-navy-800 bg-gbl-navy-950/60 p-4 sm:p-6 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-gbl-orange-400" />
                        <span>Individual Match Category Breakdown (6 Matches)</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tie.matches.map((m, idx) => {
                          const isW1 = m.winner_team_id === tie.team1_id;
                          const isW2 = m.winner_team_id === tie.team2_id;
                          const isTrump1 = m.team1_trump;
                          const isTrump2 = m.team2_trump;

                          return (
                            <div 
                              key={m.id || idx}
                              className={`p-3.5 rounded-2xl border transition-all space-y-2 text-xs ${
                                (isTrump1 || isTrump2)
                                  ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                                  : 'bg-gbl-navy-900 border-gbl-navy-800'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <div>
                                  <span className="font-bold text-white block">
                                    {idx + 1}. {m.category_name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Set 1: {m.set1_team1}-{m.set1_team2} • Set 2: {m.set2_team1}-{m.set2_team2}
                                    {m.set3_team1 > 0 ? ` • Set 3: ${m.set3_team1}-${m.set3_team2}` : ''}
                                  </span>
                                </div>

                                {(isTrump1 || isTrump2) && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                                    ★ TRUMP
                                  </span>
                                )}
                              </div>

                              {/* Players */}
                              <div className="space-y-1 pt-1 border-t border-gbl-navy-800/80">
                                <div className={`flex justify-between items-center ${isW1 ? 'font-bold text-emerald-400' : 'text-slate-300'}`}>
                                  <span className="truncate">{t1?.short_name}: {m.player1_names || 'T1 Pair'}</span>
                                  {isW1 && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                                </div>
                                <div className={`flex justify-between items-center ${isW2 ? 'font-bold text-emerald-400' : 'text-slate-300'}`}>
                                  <span className="truncate">{t2?.short_name}: {m.player2_names || 'T2 Pair'}</span>
                                  {isW2 && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
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

      {/* RECORD / EDIT 6-MATCH TIE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTieId ? "EDIT CLASH RESULT (6 MATCHES)" : "RECORD TOURNAMENT CLASH (6 MATCHES)"}
        subtitle="Enter doubles pairs, 3 set scores, and Trump Card nominations for all 6 categories"
      >
        <form onSubmit={handleSaveTie} className="space-y-6 text-xs max-h-[80vh] overflow-y-auto pr-1">
          
          {/* Error Message */}
          {formError && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/50 flex items-start gap-3 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Validation Error</p>
                <p className="text-[11px] mt-0.5 leading-relaxed">{formError}</p>
              </div>
            </div>
          )}

          {/* Tie Basic Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gbl-navy-950 p-4 rounded-2xl border border-gbl-navy-800">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Clash / Tie #</label>
              <input
                type="number"
                required
                min={1}
                value={matchNumber}
                onChange={(e) => setMatchNumber(Number(e.target.value))}
                className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-gbl-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Round Stage</label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="Group Stage">Group Stage (Pool Match)</option>
                <option value="Quarter Final">Quarter Final</option>
                <option value="Semi Final">Semi Final</option>
                <option value="Grand Final">Grand Final</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Court</label>
              <input
                type="text"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gbl-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Match Time</label>
              <input
                type="text"
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gbl-orange-500"
              />
            </div>
          </div>

          {/* Teams Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gbl-navy-950 border border-gbl-navy-800 space-y-2">
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Team 1 (First Squad)</span>
                {teamMap.get(team1Id) && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">
                    {resolveTeamPool(teamMap.get(team1Id))}
                  </span>
                )}
              </label>
              <select
                value={team1Id}
                onChange={(e) => {
                  const newT1 = e.target.value;
                  setTeam1Id(newT1);
                  // Update default winners if needed
                  setCategoryMatches(prev => prev.map(m => ({ ...m, winner_team_id: newT1 })));
                }}
                className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-gbl-orange-500"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({resolveTeamPool(t)})</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                Squad available: <strong>{team1Squad.length} members</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gbl-navy-950 border border-gbl-navy-800 space-y-2">
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Team 2 (Opponent Squad)</span>
                {teamMap.get(team2Id) && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                    {resolveTeamPool(teamMap.get(team2Id))}
                  </span>
                )}
              </label>
              <select
                value={team2Id}
                onChange={(e) => setTeam2Id(e.target.value)}
                className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-gbl-orange-500"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({resolveTeamPool(t)})</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                Squad available: <strong>{team2Squad.length} members</strong>
              </p>
            </div>
          </div>

          {/* 6 MATCH CATEGORIES SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white font-sports uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gbl-orange-400" />
                <span>Six Match Categories &amp; Doubles Lineups</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Each match has independent players, 3 sets &amp; Trump option
              </span>
            </div>

            <div className="space-y-4">
              {categoryMatches.map((m, idx) => {
                const isT1Trump = m.team1_trump;
                const isT2Trump = m.team2_trump;
                const t1Name = teamMap.get(team1Id)?.name || 'Team 1';
                const t2Name = teamMap.get(team2Id)?.name || 'Team 2';

                // Parse current player selections
                const t1Players = m.player1_names ? m.player1_names.split('&').map(s => s.trim()).filter(Boolean) : [];
                const t2Players = m.player2_names ? m.player2_names.split('&').map(s => s.trim()).filter(Boolean) : [];

                return (
                  <div
                    key={m.id || idx}
                    className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all ${
                      (isT1Trump || isT2Trump)
                        ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-500/5'
                        : 'bg-gbl-navy-950 border-gbl-navy-800'
                    }`}
                  >
                    {/* Category Title & Trump Toggles */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gbl-navy-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-gbl-orange-600/20 text-gbl-orange-400 border border-gbl-orange-500/30 flex items-center justify-center font-bold font-mono text-xs">
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight font-sports">
                            {m.category_name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {DEFAULT_CATEGORIES[idx]?.desc || 'Official tournament category'}
                        </p>
                      </div>

                      {/* Trump Card Options */}
                      <div className="flex items-center gap-3 bg-gbl-navy-900/80 p-2 rounded-xl border border-gbl-navy-800">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isT1Trump}
                            onChange={() => toggleTeamTrump(idx, 'team1')}
                            className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                          />
                          <span className={`text-[11px] font-bold ${isT1Trump ? 'text-amber-300' : 'text-slate-400'}`}>
                            {teamMap.get(team1Id)?.short_name || 'T1'} Trump
                          </span>
                        </label>

                        <span className="text-slate-600">|</span>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isT2Trump}
                            onChange={() => toggleTeamTrump(idx, 'team2')}
                            className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                          />
                          <span className={`text-[11px] font-bold ${isT2Trump ? 'text-amber-300' : 'text-slate-400'}`}>
                            {teamMap.get(team2Id)?.short_name || 'T2'} Trump
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Players Selection for Match */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Team 1 Doubles Pair */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-300 uppercase">
                          {t1Name} Players (2 Players)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {team1Squad.length > 0 ? (
                            <>
                              <select
                                value={t1Players[0] || ''}
                                onChange={(e) => handlePlayerSelect(idx, 'team1', 'p1', e.target.value)}
                                className="bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                              >
                                <option value="">Select Player 1</option>
                                {team1Squad.map(p => {
                                  const count = playerMatchCounts[`t1_${p.name}`] || 0;
                                  return (
                                    <option key={p.id} value={p.name}>
                                      {p.name} ({count}/2 matches)
                                    </option>
                                  );
                                })}
                              </select>

                              <select
                                value={t1Players[1] || ''}
                                onChange={(e) => handlePlayerSelect(idx, 'team1', 'p2', e.target.value)}
                                className="bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                              >
                                <option value="">Select Player 2</option>
                                {team1Squad.map(p => {
                                  const count = playerMatchCounts[`t1_${p.name}`] || 0;
                                  return (
                                    <option key={p.id} value={p.name}>
                                      {p.name} ({count}/2 matches)
                                    </option>
                                  );
                                })}
                              </select>
                            </>
                          ) : (
                            <input
                              type="text"
                              placeholder="Player 1 & Player 2"
                              value={m.player1_names}
                              onChange={(e) => updateMatchField(idx, 'player1_names', e.target.value)}
                              className="col-span-2 bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-1.5 text-white text-xs"
                            />
                          )}
                        </div>
                      </div>

                      {/* Team 2 Doubles Pair */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-300 uppercase">
                          {t2Name} Players (2 Players)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {team2Squad.length > 0 ? (
                            <>
                              <select
                                value={t2Players[0] || ''}
                                onChange={(e) => handlePlayerSelect(idx, 'team2', 'p1', e.target.value)}
                                className="bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                              >
                                <option value="">Select Player 1</option>
                                {team2Squad.map(p => {
                                  const count = playerMatchCounts[`t2_${p.name}`] || 0;
                                  return (
                                    <option key={p.id} value={p.name}>
                                      {p.name} ({count}/2 matches)
                                    </option>
                                  );
                                })}
                              </select>

                              <select
                                value={t2Players[1] || ''}
                                onChange={(e) => handlePlayerSelect(idx, 'team2', 'p2', e.target.value)}
                                className="bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                              >
                                <option value="">Select Player 2</option>
                                {team2Squad.map(p => {
                                  const count = playerMatchCounts[`t2_${p.name}`] || 0;
                                  return (
                                    <option key={p.id} value={p.name}>
                                      {p.name} ({count}/2 matches)
                                    </option>
                                  );
                                })}
                              </select>
                            </>
                          ) : (
                            <input
                              type="text"
                              placeholder="Player 1 & Player 2"
                              value={m.player2_names}
                              onChange={(e) => updateMatchField(idx, 'player2_names', e.target.value)}
                              className="col-span-2 bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-1.5 text-white text-xs"
                            />
                          )}
                        </div>
                      </div>

                    </div>

                    {/* 3 Sets Scores per match & Winner */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gbl-navy-900/60 p-3 rounded-xl border border-gbl-navy-800">
                      
                      {/* Set 1 */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Set 1 ({teamMap.get(team1Id)?.short_name} - {teamMap.get(team2Id)?.short_name})
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={m.set1_team1}
                            onChange={(e) => updateMatchField(idx, 'set1_team1', Number(e.target.value))}
                            className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-lg p-1 text-center font-mono text-white text-xs font-bold"
                          />
                          <input
                            type="number"
                            value={m.set1_team2}
                            onChange={(e) => updateMatchField(idx, 'set1_team2', Number(e.target.value))}
                            className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-lg p-1 text-center font-mono text-white text-xs font-bold"
                          />
                        </div>
                      </div>

                      {/* Set 2 */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Set 2 ({teamMap.get(team1Id)?.short_name} - {teamMap.get(team2Id)?.short_name})
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={m.set2_team1}
                            onChange={(e) => updateMatchField(idx, 'set2_team1', Number(e.target.value))}
                            className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-lg p-1 text-center font-mono text-white text-xs font-bold"
                          />
                          <input
                            type="number"
                            value={m.set2_team2}
                            onChange={(e) => updateMatchField(idx, 'set2_team2', Number(e.target.value))}
                            className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-lg p-1 text-center font-mono text-white text-xs font-bold"
                          />
                        </div>
                      </div>

                      {/* Set 3 */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Set 3 (Optional)
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={m.set3_team1}
                            onChange={(e) => updateMatchField(idx, 'set3_team1', Number(e.target.value))}
                            className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-lg p-1 text-center font-mono text-white text-xs font-bold"
                          />
                          <input
                            type="number"
                            value={m.set3_team2}
                            onChange={(e) => updateMatchField(idx, 'set3_team2', Number(e.target.value))}
                            className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-lg p-1 text-center font-mono text-white text-xs font-bold"
                          />
                        </div>
                      </div>

                      {/* Match Winner */}
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-400 mb-1">
                          Match Winner
                        </label>
                        <select
                          value={m.winner_team_id || team1Id}
                          onChange={(e) => updateMatchField(idx, 'winner_team_id', e.target.value)}
                          className="w-full bg-gbl-navy-950 border border-emerald-500/40 text-emerald-400 font-bold rounded-lg p-1.5 text-xs focus:outline-none"
                        >
                          <option value={team1Id}>{teamMap.get(team1Id)?.name} (Team 1)</option>
                          <option value={team2Id}>{teamMap.get(team2Id)?.name} (Team 2)</option>
                        </select>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* LIVE SUMMARY / POINTS PREVIEW CARD */}
          <div className="bg-gradient-to-r from-gbl-navy-900 via-gbl-navy-950 to-gbl-navy-900 p-4 sm:p-5 rounded-2xl border border-emerald-500/40 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Live Tournament Points &amp; Tie Outcome Preview</span>
            </h4>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-gbl-navy-900 border border-gbl-navy-800 space-y-1">
                <p className="font-bold text-white truncate">{teamMap.get(team1Id)?.name || 'Team 1'}</p>
                <p className="text-slate-400 text-[11px]">
                  Matches Won: <strong>{currentTieSummary.t1Wins} / 6</strong>
                </p>
                <p className="text-slate-400 text-[11px]">
                  Base Win Points: <strong>+{currentTieSummary.t1Base} Pts</strong>
                </p>
                {currentTieSummary.t1Trump > 0 && (
                  <p className="text-amber-400 text-[11px] font-bold">
                    Trump Bonus: +{currentTieSummary.t1Trump} Pts
                  </p>
                )}
                <p className="text-sm font-black font-mono text-emerald-400 pt-1 border-t border-gbl-navy-800">
                  Total Awarded: {currentTieSummary.t1Total} Pts
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gbl-navy-900 border border-gbl-navy-800 space-y-1">
                <p className="font-bold text-white truncate">{teamMap.get(team2Id)?.name || 'Team 2'}</p>
                <p className="text-slate-400 text-[11px]">
                  Matches Won: <strong>{currentTieSummary.t2Wins} / 6</strong>
                </p>
                <p className="text-slate-400 text-[11px]">
                  Base Win Points: <strong>+{currentTieSummary.t2Base} Pts</strong>
                </p>
                {currentTieSummary.t2Trump > 0 && (
                  <p className="text-amber-400 text-[11px] font-bold">
                    Trump Bonus: +{currentTieSummary.t2Trump} Pts
                  </p>
                )}
                <p className="text-sm font-black font-mono text-emerald-400 pt-1 border-t border-gbl-navy-800">
                  Total Awarded: {currentTieSummary.t2Total} Pts
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gbl-orange-600 to-amber-500 hover:from-gbl-orange-500 hover:to-amber-400 text-white font-bold uppercase tracking-wider shadow-lg shadow-gbl-orange-600/30"
            >
              Save &amp; Recalculate Standings
            </button>
          </div>

        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(deleteConfirmTieId)}
        onClose={() => setDeleteConfirmTieId(null)}
        title="CONFIRM DELETE CLASH RESULT"
        subtitle="This action will permanently delete all 6 match category scores from the database"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-200">
              <p className="font-bold text-red-400 text-sm">Are you sure you want to delete this tie?</p>
              <p className="leading-relaxed">
                All 6 match records and set scores will be permanently deleted from Supabase. Tournament standings and points tables will automatically be recalculated.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              type="button"
              onClick={() => setDeleteConfirmTieId(null)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeDeleteTie}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider shadow-lg shadow-red-600/30"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
