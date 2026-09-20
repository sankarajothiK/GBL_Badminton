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

const DEFAULT_CATEGORIES: { name: MatchCategory; label: string; desc: string; index: number }[] = [
  { name: 'Veterans Doubles', label: 'Match 1 — Veterans Doubles', desc: 'Veterans Doubles (40+ & 45+)', index: 1 },
  { name: 'Super Doubles', label: 'Match 2 — Super Doubles', desc: 'Super Doubles (Open + Non-Medalist)', index: 2 },
  { name: 'Tariff/Tarifits', label: 'Match 3 — Tariff/Tarifits', desc: 'Tariff / 35+ Jumbled Doubles', index: 3 },
  { name: '80+ Competition', label: 'Match 4 — 80+ Competition', desc: '80+ Combined (Both Age Cal)', index: 4 },
  { name: 'Orange Doubles', label: 'Match 5 — Orange Doubles', desc: 'Orange Doubles / Challengers (40+ & Non-Medalist)', index: 5 },
  { name: 'Future Star Doubles', label: 'Match 6 — Future Star Doubles', desc: 'Future Star Doubles (Non-Medalist & Non-Medalist)', index: 6 }
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

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const AdminResults: React.FC = () => {
  const { matches, teams, players, saveTieResult, deleteTie, saveMatchResult, deleteMatch } = useTournament();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmTieId, setDeleteConfirmTieId] = useState<string | null>(null);
  const [editingTieId, setEditingTieId] = useState<string | null>(null);
  const [expandedTieIds, setExpandedTieIds] = useState<Set<string>>(new Set());

  // Saving / Loading State and Toast
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // View Mode: 'TIES' or 'ALL_MATCHES'
  const [viewMode, setViewMode] = useState<'TIES' | 'ALL_MATCHES'>('TIES');
  const [searchMatchQuery, setSearchMatchQuery] = useState('');
  const [matchRoundFilter, setMatchRoundFilter] = useState('ALL');
  const [matchCategoryFilter, setMatchCategoryFilter] = useState('ALL');

  // Single Match Edit / Delete State
  const [isSingleMatchModalOpen, setIsSingleMatchModalOpen] = useState(false);
  const [editingSingleMatch, setEditingSingleMatch] = useState<TournamentMatch | null>(null);
  const [deleteConfirmMatchId, setDeleteConfirmMatchId] = useState<string | null>(null);
  const [singleMatchFormError, setSingleMatchFormError] = useState<string | null>(null);

  // Tie metadata form state
  const [round, setRound] = useState('Group Stage');
  const [matchNumber, setMatchNumber] = useState(1);
  const [court, setCourt] = useState('Court 1');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [matchTime, setMatchTime] = useState('06:00 PM');
  const [team1Id, setTeam1Id] = useState(teams[0]?.id || '');
  const [team2Id, setTeam2Id] = useState(teams[1]?.id || '');

  // 6 Match Categories state (Single Set 15-Point Match Format)
  const [categoryMatches, setCategoryMatches] = useState<TieCategoryMatch[]>(() => {
    return DEFAULT_CATEGORIES.map((cat, idx) => ({
      id: generateUUID(),
      category_name: cat.name,
      match_index: idx + 1,
      player1_names: '',
      player2_names: '',
      set1_team1: 15,
      set1_team2: 10,
      set2_team1: 0,
      set2_team2: 0,
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

      const catMatches: TieCategoryMatch[] = sortedMatches.map((m, idx) => {
        const isT1Trump = Boolean(m.team1_trump || (m.is_trump_match && m.trump_team_id === t1));
        const isT2Trump = Boolean(m.team2_trump || (m.is_trump_match && m.trump_team_id === t2));
        const isDual = (isT1Trump && isT2Trump) || (m.is_trump_match && m.trump_team_id === 'BOTH');
        return {
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
          team1_trump: isDual ? true : isT1Trump,
          team2_trump: isDual ? true : isT2Trump,
          is_trump_match: m.is_trump_match || isT1Trump || isT2Trump,
          trump_team_id: m.trump_team_id
        };
      });

      // Calculate score and points (Base Table + Trump Bonus)
      const t1Wins = catMatches.filter(cm => cm.winner_team_id === t1).length;
      const t2Wins = catMatches.filter(cm => cm.winner_team_id === t2).length;

      const t1Base = calculateBaseWinPoints(t1Wins);
      const t2Base = calculateBaseWinPoints(t2Wins);

      let t1TrumpBonus = 0;
      let t2TrumpBonus = 0;
      catMatches.forEach(cm => {
        const isDual = (cm.team1_trump && cm.team2_trump) || cm.trump_team_id === 'BOTH';
        if (isDual) {
          if (cm.winner_team_id === t1) t1TrumpBonus += 4;
          else if (cm.winner_team_id === t2) t2TrumpBonus += 4;
        } else {
          if (cm.team1_trump && cm.winner_team_id === t1) t1TrumpBonus += 2;
          if (cm.team2_trump && cm.winner_team_id === t2) t2TrumpBonus += 2;
        }
      });

      const team1Points = t1Base + t1TrumpBonus;
      const team2Points = t2Base + t2TrumpBonus;

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

  // Live tie calculations for current modal form (Base Points + Trump Card Bonus)
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

  // Toggle Trump nomination for a team on a match (Enforces max 1 trump match per team per tie)
  const toggleTeamTrump = (matchIdx: number, team: 'team1' | 'team2') => {
    setCategoryMatches(prev => {
      const isCurrentlyActive = team === 'team1' ? prev[matchIdx].team1_trump : prev[matchIdx].team2_trump;
      return prev.map((m, idx) => {
        if (team === 'team1') {
          if (idx === matchIdx) {
            return { ...m, team1_trump: !isCurrentlyActive };
          } else if (!isCurrentlyActive) {
            // Deselect other matches for team1 to enforce 1 trump limit per tie
            return { ...m, team1_trump: false };
          }
        } else {
          if (idx === matchIdx) {
            return { ...m, team2_trump: !isCurrentlyActive };
          } else if (!isCurrentlyActive) {
            // Deselect other matches for team2 to enforce 1 trump limit per tie
            return { ...m, team2_trump: false };
          }
        }
        return m;
      });
    });
  };

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
        id: generateUUID(),
        category_name: cat.name,
        match_index: idx + 1,
        player1_names: '',
        player2_names: '',
        set1_team1: 15,
        set1_team2: 10,
        set2_team1: 0,
        set2_team2: 0,
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
          id: existing.id || generateUUID(),
          category_name: cat.name,
          match_index: idx + 1,
          set2_team1: 0,
          set2_team2: 0,
          set3_team1: 0,
          set3_team2: 0,
          team1_trump: Boolean(existing.team1_trump || (existing.is_trump_match && existing.trump_team_id === tie.team1_id)),
          team2_trump: Boolean(existing.team2_trump || (existing.is_trump_match && existing.trump_team_id === tie.team2_id))
        };
      }
      return {
        id: generateUUID(),
        category_name: cat.name,
        match_index: idx + 1,
        player1_names: '',
        player2_names: '',
        set1_team1: 15,
        set1_team2: 10,
        set2_team1: 0,
        set2_team2: 0,
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

  // Handle match category changes (Single Set 15-Point Format)
  const updateMatchField = <K extends keyof TieCategoryMatch>(
    idx: number,
    field: K,
    val: TieCategoryMatch[K]
  ) => {
    setCategoryMatches(prev => {
      const next = [...prev];
      const match = { ...next[idx], [field]: val };

      // Auto compute winner when Set 1 score changes
      if (field === 'set1_team1' || field === 'set1_team2') {
        const s1_t1 = field === 'set1_team1' ? Number(val) : match.set1_team1;
        const s1_t2 = field === 'set1_team2' ? Number(val) : match.set1_team2;

        if (s1_t1 > s1_t2) {
          match.winner_team_id = team1Id;
        } else if (s1_t2 > s1_t1) {
          match.winner_team_id = team2Id;
        }
      }

      next[idx] = match;
      return next;
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

    try {
      setIsSaving(true);
      await saveTieResult(tieObj);
      setIsModalOpen(false);
      setSaveSuccessMessage(`Clash #${matchNumber} result saved successfully! Points & Standings updated.`);
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save clash result. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm and execute tie delete
  const executeDeleteTie = async () => {
    if (!deleteConfirmTieId) return;
    try {
      setIsSaving(true);
      await deleteTie(deleteConfirmTieId);
      setDeleteConfirmTieId(null);
      setSaveSuccessMessage('Clash deleted successfully.');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      alert('Failed to delete tie: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Open Single Match Edit Modal
  const openEditSingleMatch = (m: TieCategoryMatch | TournamentMatch, tieParent?: TournamentTie) => {
    setSingleMatchFormError(null);
    if (tieParent) {
      const isT1Trump = Boolean(m.team1_trump);
      const isT2Trump = Boolean(m.team2_trump);
      const isDual = isT1Trump && isT2Trump;
      setEditingSingleMatch({
        id: m.id || generateUUID(),
        tournament_id: tieParent.tournament_id,
        category_id: null,
        round: tieParent.round,
        match_number: tieParent.match_number,
        team1_id: tieParent.team1_id,
        team2_id: tieParent.team2_id,
        court: tieParent.court,
        match_date: tieParent.match_date,
        match_time: tieParent.match_time,
        status: 'COMPLETED',
        winner_team_id: m.winner_team_id || tieParent.team1_id,
        score_summary: `${m.set1_team1} - ${m.set1_team2}`,
        set1_team1: m.set1_team1,
        set1_team2: m.set1_team2,
        set2_team1: 0,
        set2_team2: 0,
        set3_team1: 0,
        set3_team2: 0,
        player1_names: m.player1_names || '',
        player2_names: m.player2_names || '',
        is_trump_match: isT1Trump || isT2Trump,
        trump_team_id: isDual ? 'BOTH' : (isT1Trump ? tieParent.team1_id : (isT2Trump ? tieParent.team2_id : null)),
        category_name: m.category_name,
        notes: (m as any).notes || '',
        tie_id: tieParent.tie_id,
        team1_trump: isT1Trump,
        team2_trump: isT2Trump,
        match_points_awarded: isDual ? 4 : (isT1Trump || isT2Trump ? 2 : 1),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else {
      const tm = m as TournamentMatch;
      setEditingSingleMatch({
        ...tm,
        id: tm.id || generateUUID(),
        notes: tm.notes || '',
        team1_trump: Boolean(tm.team1_trump || (tm.is_trump_match && tm.trump_team_id === tm.team1_id)),
        team2_trump: Boolean(tm.team2_trump || (tm.is_trump_match && tm.trump_team_id === tm.team2_id))
      });
    }
    setIsSingleMatchModalOpen(true);
  };

  // Open Single Match Create Modal
  const openAddSingleMatch = () => {
    setSingleMatchFormError(null);
    const t1 = teams[0]?.id || '';
    const t2 = teams[1]?.id || '';
    setEditingSingleMatch({
      id: generateUUID(),
      tournament_id: '00000000-0000-0000-0000-000000000001',
      category_id: null,
      round: 'Group Stage',
      match_number: matches.length + 1,
      team1_id: t1,
      team2_id: t2,
      court: 'Court 1',
      match_date: new Date().toISOString().slice(0, 10),
      match_time: '06:00 PM',
      status: 'COMPLETED',
      winner_team_id: t1,
      score_summary: '15 - 10',
      set1_team1: 15,
      set1_team2: 10,
      set2_team1: 0,
      set2_team2: 0,
      set3_team1: 0,
      set3_team2: 0,
      notes: '',
      player1_names: '',
      player2_names: '',
      is_trump_match: false,
      trump_team_id: null,
      category_name: 'Veterans Doubles',
      team1_trump: false,
      team2_trump: false,
      match_points_awarded: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setIsSingleMatchModalOpen(true);
  };

  // Save Single Match Result
  const handleSaveSingleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSingleMatch) return;
    setSingleMatchFormError(null);

    if (editingSingleMatch.team1_id === editingSingleMatch.team2_id) {
      setSingleMatchFormError('Team 1 and Team 2 cannot be the same team.');
      return;
    }

    const s1 = Number(editingSingleMatch.set1_team1 || 0);
    const s2 = Number(editingSingleMatch.set1_team2 || 0);
    let winId = editingSingleMatch.winner_team_id;
    if (s1 > s2) winId = editingSingleMatch.team1_id;
    else if (s2 > s1) winId = editingSingleMatch.team2_id;

    const isT1 = Boolean(editingSingleMatch.team1_trump);
    const isT2 = Boolean(editingSingleMatch.team2_trump);
    const isDual = isT1 && isT2;

    const matchToSave: TournamentMatch = {
      ...editingSingleMatch,
      winner_team_id: winId,
      score_summary: `${s1} - ${s2}`,
      is_trump_match: isT1 || isT2,
      trump_team_id: isDual ? 'BOTH' : (isT1 ? editingSingleMatch.team1_id : (isT2 ? editingSingleMatch.team2_id : null)),
      match_points_awarded: isDual ? 4 : (isT1 || isT2 ? 2 : 1),
      status: 'COMPLETED',
      updated_at: new Date().toISOString()
    };

    try {
      setIsSaving(true);
      await saveMatchResult(matchToSave);
      setIsSingleMatchModalOpen(false);
      setEditingSingleMatch(null);
      setSaveSuccessMessage(`Match result saved successfully! Points & Standings updated.`);
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    } catch (err: any) {
      setSingleMatchFormError(err.message || 'Failed to save match result. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm and Execute Single Match Delete
  const executeDeleteSingleMatch = async () => {
    if (!deleteConfirmMatchId) return;
    try {
      setIsSaving(true);
      await deleteMatch(deleteConfirmMatchId);
      setDeleteConfirmMatchId(null);
      setSaveSuccessMessage('Match deleted successfully.');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      alert('Failed to delete match: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered individual matches for the All Matches View
  const filteredIndividualMatches = useMemo(() => {
    return matches.filter(m => {
      if (matchRoundFilter !== 'ALL' && m.round !== matchRoundFilter) return false;
      if (matchCategoryFilter !== 'ALL' && m.category_name !== matchCategoryFilter) return false;
      if (searchMatchQuery) {
        const q = searchMatchQuery.toLowerCase();
        const t1 = teamMap.get(m.team1_id)?.name?.toLowerCase() || '';
        const t2 = teamMap.get(m.team2_id)?.name?.toLowerCase() || '';
        const p1 = (m.player1_names || '').toLowerCase();
        const p2 = (m.player2_names || '').toLowerCase();
        const cat = (m.category_name || '').toLowerCase();
        if (!t1.includes(q) && !t2.includes(q) && !p1.includes(q) && !p2.includes(q) && !cat.includes(q)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => (b.match_number || 0) - (a.match_number || 0));
  }, [matches, matchRoundFilter, matchCategoryFilter, searchMatchQuery, teamMap]);

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
            <span>Official Clashes &amp; Match Management (15-Pt Single Set)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white font-sports uppercase tracking-tight">
            MATCH RESULTS &amp; FIXTURES
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Record, edit, or delete 6-match tie clashes and individual category matches with live score calculations and standings sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={openAddSingleMatch}
            className="px-4 py-2.5 rounded-2xl bg-gbl-navy-800 hover:bg-gbl-navy-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all border border-gbl-navy-700 shadow-md"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Single Match</span>
          </button>

          <button
            onClick={openAdd}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-gbl-orange-600 to-amber-500 hover:from-gbl-orange-500 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl shadow-gbl-orange-600/30 hover:scale-105 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Tie (6 Matches)</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between gap-3 text-emerald-300 text-xs shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-sm">{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-emerald-900/40"
          >
            ✕
          </button>
        </div>
      )}

      {/* View Switcher Tabs & Rules Notice */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Switcher */}
        <div className="flex items-center gap-1.5 bg-gbl-navy-900 p-1.5 rounded-2xl border border-gbl-navy-800 self-start">
          <button
            onClick={() => setViewMode('TIES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              viewMode === 'TIES'
                ? 'bg-gbl-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Clashes / Ties View ({recordedTies.length})</span>
          </button>

          <button
            onClick={() => setViewMode('ALL_MATCHES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              viewMode === 'ALL_MATCHES'
                ? 'bg-gbl-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Matches List ({matches.length})</span>
          </button>
        </div>

        {/* Scoring summary pill */}
        <div className="bg-gbl-navy-950/80 border border-gbl-navy-800 rounded-2xl px-4 py-2 flex items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Star className="w-4 h-4" />
            <span>1W=1 • 2W=2 • 3W=3 • 4W=5 • 5W=6 • 6W=7</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-amber-300">
            <Sparkles className="w-4 h-4" />
            <span>+2 Trump Bonus</span>
          </div>
        </div>

      </div>

      {/* VIEW MODE 1: CLASHES / TIES VIEW */}
      {viewMode === 'TIES' && (
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
                          <span>{isExpanded ? 'Hide Matches' : 'View / Edit 6 Matches'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => openEdit(tie)}
                          className="px-3 py-1.5 rounded-xl bg-gbl-navy-800 hover:bg-gbl-navy-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                          title="Edit Full Clash"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>Edit Clash</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmTieId(tie.tie_id)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
                          title="Delete Full Clash"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* Expandable 6-Match Breakdown with per-match Edit & Delete */}
                    {isExpanded && (
                      <div className="border-t border-gbl-navy-800 bg-gbl-navy-950/60 p-4 sm:p-6 space-y-3">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Trophy className="w-3.5 h-3.5 text-gbl-orange-400" />
                            <span>Individual Match Category Breakdown (6 Matches — 15 Points Format)</span>
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Click 'Edit Match' on any card to modify players or score
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {tie.matches.map((m, idx) => {
                            const isW1 = m.winner_team_id === tie.team1_id;
                            const isW2 = m.winner_team_id === tie.team2_id;
                            const isDual = (m.team1_trump && m.team2_trump) || m.trump_team_id === 'BOTH';
                            const isT1Trump = isDual || m.team1_trump;
                            const isT2Trump = isDual || m.team2_trump;

                            return (
                              <div 
                                key={m.id || idx}
                                className={`p-3.5 rounded-2xl border transition-all space-y-2 text-xs flex flex-col justify-between ${
                                  isDual
                                    ? 'bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-500/30'
                                    : isT1Trump || isT2Trump
                                    ? 'bg-gbl-navy-900 border-amber-500/30'
                                    : 'bg-gbl-navy-900 border-gbl-navy-800'
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start gap-1">
                                    <div>
                                      <span className="font-bold text-white block">
                                        {DEFAULT_CATEGORIES[idx]?.label || `${idx + 1}. ${m.category_name}`}
                                      </span>
                                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                        Set 1: {m.set1_team1} - {m.set1_team2} (15 Pts)
                                      </span>
                                    </div>

                                    {isDual ? (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        <span>DUAL TRUMP (4 PTS)</span>
                                      </span>
                                    ) : isT1Trump ? (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 flex items-center gap-1">
                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                        <span>{t1?.short_name} TRUMP</span>
                                      </span>
                                    ) : isT2Trump ? (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 flex items-center gap-1">
                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                        <span>{t2?.short_name} TRUMP</span>
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                                        REGULAR
                                      </span>
                                    )}
                                  </div>

                                  {/* Players */}
                                  <div className="space-y-1 pt-1 border-t border-gbl-navy-800/80">
                                    <div className={`flex justify-between items-center ${isW1 ? 'font-bold text-emerald-400' : 'text-slate-300'}`}>
                                      <span className="truncate">{t1?.short_name}: {m.player1_names || 'T1 Pair'}</span>
                                      {isW1 && (
                                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Won {isDual ? '(+4 Trump)' : isT1Trump ? '(+2 Trump)' : '(+1 Win)'}</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className={`flex justify-between items-center ${isW2 ? 'font-bold text-emerald-400' : 'text-slate-300'}`}>
                                      <span className="truncate">{t2?.short_name}: {m.player2_names || 'T2 Pair'}</span>
                                      {isW2 && (
                                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Won {isDual ? '(+4 Trump)' : isT2Trump ? '(+2 Trump)' : '(+1 Win)'}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Match Action Buttons */}
                                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gbl-navy-800/60 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => openEditSingleMatch(m, tie)}
                                    className="px-2.5 py-1 rounded-lg bg-gbl-navy-800 hover:bg-gbl-navy-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors border border-gbl-navy-700"
                                    title="Edit This Match"
                                  >
                                    <Edit2 className="w-3 h-3 text-sky-400" />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmMatchId(m.id)}
                                    className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
                                    title="Delete This Match"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
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
      )}

      {/* VIEW MODE 2: ALL INDIVIDUAL MATCHES VIEW */}
      {viewMode === 'ALL_MATCHES' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-gbl-navy-900 border border-gbl-navy-800 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                placeholder="Search matches by team name, player or category..."
                value={searchMatchQuery}
                onChange={(e) => setSearchMatchQuery(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gbl-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={matchRoundFilter}
                onChange={(e) => setMatchRoundFilter(e.target.value)}
                className="bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Rounds</option>
                <option value="Group Stage">Group Stage</option>
                <option value="Quarter Final">Quarter Final</option>
                <option value="Semi Final">Semi Final</option>
                <option value="Grand Final">Grand Final</option>
              </select>

              <select
                value={matchCategoryFilter}
                onChange={(e) => setMatchCategoryFilter(e.target.value)}
                className="bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {DEFAULT_CATEGORIES.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Individual Matches List */}
          {filteredIndividualMatches.length === 0 ? (
            <div className="text-center py-16 bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl space-y-3">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No individual matches found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try adjusting your search query or record a new match using the buttons above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIndividualMatches.map((m) => {
                const t1 = teamMap.get(m.team1_id);
                const t2 = teamMap.get(m.team2_id);
                const isW1 = m.winner_team_id === m.team1_id;
                const isW2 = m.winner_team_id === m.team2_id;
                const isDual = (m.team1_trump && m.team2_trump) || m.trump_team_id === 'BOTH';
                const isT1Trump = isDual || m.team1_trump || (m.is_trump_match && m.trump_team_id === m.team1_id);
                const isT2Trump = isDual || m.team2_trump || (m.is_trump_match && m.trump_team_id === m.team2_id);

                return (
                  <div
                    key={m.id}
                    className="p-4 sm:p-5 rounded-3xl bg-gbl-navy-900 border border-gbl-navy-800 hover:border-gbl-navy-700 space-y-3 shadow-xl transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-gbl-orange-600/20 text-gbl-orange-400 border border-gbl-orange-500/30">
                            #{m.match_number} • {m.round}
                          </span>
                          <h4 className="font-bold text-white text-sm mt-1">
                            {m.category_name || 'Doubles Match'}
                          </h4>
                        </div>

                        {isDual ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>DUAL TRUMP (4 PTS)</span>
                          </span>
                        ) : isT1Trump ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>{t1?.short_name} TRUMP</span>
                          </span>
                        ) : isT2Trump ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>{t2?.short_name} TRUMP</span>
                          </span>
                        ) : null}
                      </div>

                      {/* Match Score Row */}
                      <div className="p-3 rounded-2xl bg-gbl-navy-950 border border-gbl-navy-800/80 flex items-center justify-between gap-2">
                        <div className={`text-left flex-1 min-w-0 ${isW1 ? 'font-black text-emerald-400' : 'text-slate-300'}`}>
                          <p className="text-xs truncate">{t1?.name || 'Team 1'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{m.player1_names || 'Pair 1'}</p>
                        </div>

                        <div className="px-3 py-1 rounded-xl bg-gbl-navy-900 border border-gbl-navy-700 font-mono font-black text-white text-sm text-center shrink-0">
                          {m.set1_team1} - {m.set1_team2}
                        </div>

                        <div className={`text-right flex-1 min-w-0 ${isW2 ? 'font-black text-emerald-400' : 'text-slate-300'}`}>
                          <p className="text-xs truncate">{t2?.name || 'Team 2'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{m.player2_names || 'Pair 2'}</p>
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{m.court} • {m.match_time}</span>
                        <span>{m.match_date}</span>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gbl-navy-800/80">
                      <button
                        type="button"
                        onClick={() => openEditSingleMatch(m)}
                        className="px-3 py-1.5 rounded-xl bg-gbl-navy-800 hover:bg-gbl-navy-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-gbl-navy-700"
                        title="Edit Match"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>Edit Match</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmMatchId(m.id)}
                        className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
                        title="Delete Match"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* RECORD / EDIT 6-MATCH TIE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTieId ? "EDIT CLASH RESULT (6 MATCHES)" : "RECORD TOURNAMENT CLASH (6 MATCHES)"}
        subtitle="Enter doubles pairs, Set 1 score (15 Points Match), and select Trump Card for each team"
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
                <span>Six Match Categories, Lineups &amp; Trump Selection</span>
              </h3>
              <span className="text-[11px] text-amber-400 font-bold">
                1 Trump Card per team per tie (+2 Bonus Pts)
              </span>
            </div>

            <div className="space-y-4">
              {categoryMatches.map((m, idx) => {
                const t1Name = teamMap.get(team1Id)?.name || 'Team 1';
                const t2Name = teamMap.get(team2Id)?.name || 'Team 2';
                const t1Short = teamMap.get(team1Id)?.short_name || 'T1';
                const t2Short = teamMap.get(team2Id)?.short_name || 'T2';

                // Parse current player selections
                const t1Players = m.player1_names ? m.player1_names.split('&').map(s => s.trim()).filter(Boolean) : [];
                const t2Players = m.player2_names ? m.player2_names.split('&').map(s => s.trim()).filter(Boolean) : [];

                const isWinnerT1 = m.winner_team_id === team1Id;
                const isWinnerT2 = m.winner_team_id === team2Id;

                const isT1Trump = Boolean(m.team1_trump);
                const isT2Trump = Boolean(m.team2_trump);
                const isDualTrump = isT1Trump && isT2Trump;

                return (
                  <div
                    key={m.id || idx}
                    className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all ${
                      isDualTrump
                        ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/40'
                        : isT1Trump || isT2Trump
                        ? 'bg-gbl-navy-950 border-amber-500/40'
                        : 'bg-gbl-navy-950 border-gbl-navy-800'
                    }`}
                  >
                    {/* Category Title & Live Winner Status */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gbl-navy-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-gbl-orange-600/20 text-gbl-orange-400 border border-gbl-orange-500/30 flex items-center justify-center font-bold font-mono text-xs">
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight font-sports">
                            {DEFAULT_CATEGORIES[idx]?.label || m.category_name}
                          </h4>
                          {isDualTrump ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              <span>DUAL TRUMP (4 PTS)</span>
                            </span>
                          ) : (isT1Trump || isT2Trump) ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span>TRUMP ACTIVE (+2 PTS)</span>
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {DEFAULT_CATEGORIES[idx]?.desc || 'Official tournament category'}
                        </p>
                      </div>

                      {/* Live Outcome Badge */}
                      <div className="flex items-center gap-2 bg-gbl-navy-900/90 px-3 py-1.5 rounded-xl border border-gbl-navy-800">
                        {isWinnerT1 ? (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Winner: <strong>{t1Short}</strong> {isDualTrump ? '(+4 Trump Pts)' : isT1Trump ? '(+2 Trump Pts)' : '(+1 Win)'}</span>
                          </span>
                        ) : isWinnerT2 ? (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Winner: <strong>{t2Short}</strong> {isDualTrump ? '(+4 Trump Pts)' : isT2Trump ? '(+2 Trump Pts)' : '(+1 Win)'}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400">
                            Score tied or pending
                          </span>
                        )}
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

                    {/* Single Set 15-Point Match Score & Winner */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gbl-navy-900/80 p-3.5 rounded-xl border border-gbl-navy-800 items-center">
                      
                      {/* Set 1 Score (15 Points Format) */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">
                          Set 1 Score — 15 Points ({t1Short} vs {t2Short})
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <span className="text-[10px] text-slate-400 block mb-0.5">{t1Short} Score</span>
                            <input
                              type="number"
                              min={0}
                              value={m.set1_team1}
                              onChange={(e) => updateMatchField(idx, 'set1_team1', Number(e.target.value))}
                              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-lg p-2 text-center font-mono text-white text-sm font-black focus:outline-none focus:border-gbl-orange-500"
                            />
                          </div>
                          <span className="text-slate-500 font-bold text-sm pt-4">-</span>
                          <div className="flex-1">
                            <span className="text-[10px] text-slate-400 block mb-0.5">{t2Short} Score</span>
                            <input
                              type="number"
                              min={0}
                              value={m.set1_team2}
                              onChange={(e) => updateMatchField(idx, 'set1_team2', Number(e.target.value))}
                              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-lg p-2 text-center font-mono text-white text-sm font-black focus:outline-none focus:border-gbl-orange-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Match Winner Selector */}
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-400 mb-1">
                          Match Winner
                        </label>
                        <select
                          value={m.winner_team_id || team1Id}
                          onChange={(e) => updateMatchField(idx, 'winner_team_id', e.target.value)}
                          className="w-full bg-gbl-navy-950 border border-emerald-500/40 text-emerald-400 font-bold rounded-lg p-2 text-xs focus:outline-none"
                        >
                          <option value={team1Id}>{teamMap.get(team1Id)?.name}</option>
                          <option value={team2Id}>{teamMap.get(team2Id)?.name}</option>
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Auto-selected based on higher Set 1 score.
                        </p>
                      </div>

                    </div>

                    {/* Trump Card Nomination Buttons (Max 1 Trump per team per tie) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gbl-navy-800/80">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Trump Card Nomination:</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Team 1 Trump Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleTeamTrump(idx, 'team1')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            isT1Trump
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 font-black'
                              : 'bg-gbl-navy-900 hover:bg-gbl-navy-800 text-slate-400 border-gbl-navy-700'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isT1Trump ? 'fill-slate-950 text-slate-950' : 'text-slate-500'}`} />
                          <span>{t1Short} Trump</span>
                          {isT1Trump && <span className="text-[9px] bg-slate-950/20 px-1 rounded font-mono">+2</span>}
                        </button>

                        {/* Team 2 Trump Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleTeamTrump(idx, 'team2')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            isT2Trump
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 font-black'
                              : 'bg-gbl-navy-900 hover:bg-gbl-navy-800 text-slate-400 border-gbl-navy-700'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isT2Trump ? 'fill-slate-950 text-slate-950' : 'text-slate-500'}`} />
                          <span>{t2Short} Trump</span>
                          {isT2Trump && <span className="text-[9px] bg-slate-950/20 px-1 rounded font-mono">+2</span>}
                        </button>
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
              <span>Live Tournament Points Breakdown (Base Wins + Trump Bonus)</span>
            </h4>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-gbl-navy-900 border border-gbl-navy-800 space-y-1.5">
                <p className="font-bold text-white truncate text-sm">{teamMap.get(team1Id)?.name || 'Team 1'}</p>
                <div className="text-slate-400 text-xs space-y-0.5">
                  <p>Matches Won: <strong>{currentTieSummary.t1Wins} / 6</strong></p>
                  <p>Base Win Points: <strong className="text-slate-200">+{currentTieSummary.t1Base} Pts</strong></p>
                  <p>Trump Bonus: <strong className="text-amber-400">+{currentTieSummary.t1Trump} Pts</strong></p>
                </div>
                <p className="text-sm font-black font-mono text-emerald-400 pt-1.5 border-t border-gbl-navy-800">
                  Total Points: {currentTieSummary.t1Total} Pts ({currentTieSummary.t1Base} + {currentTieSummary.t1Trump})
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gbl-navy-900 border border-gbl-navy-800 space-y-1.5">
                <p className="font-bold text-white truncate text-sm">{teamMap.get(team2Id)?.name || 'Team 2'}</p>
                <div className="text-slate-400 text-xs space-y-0.5">
                  <p>Matches Won: <strong>{currentTieSummary.t2Wins} / 6</strong></p>
                  <p>Base Win Points: <strong className="text-slate-200">+{currentTieSummary.t2Base} Pts</strong></p>
                  <p>Trump Bonus: <strong className="text-amber-400">+{currentTieSummary.t2Trump} Pts</strong></p>
                </div>
                <p className="text-sm font-black font-mono text-emerald-400 pt-1.5 border-t border-gbl-navy-800">
                  Total Points: {currentTieSummary.t2Total} Pts ({currentTieSummary.t2Base} + {currentTieSummary.t2Trump})
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gbl-orange-600 to-amber-500 hover:from-gbl-orange-500 hover:to-amber-400 text-white font-bold uppercase tracking-wider shadow-lg shadow-gbl-orange-600/30 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Clash...</span>
                </>
              ) : (
                <span>Save &amp; Recalculate Standings</span>
              )}
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

      {/* SINGLE MATCH EDIT / RECORD MODAL */}
      <Modal
        isOpen={isSingleMatchModalOpen && Boolean(editingSingleMatch)}
        onClose={() => {
          setIsSingleMatchModalOpen(false);
          setEditingSingleMatch(null);
        }}
        title={editingSingleMatch?.id && matches.some(m => m.id === editingSingleMatch.id) ? "EDIT INDIVIDUAL MATCH" : "RECORD INDIVIDUAL MATCH"}
        subtitle="Update category, doubles players, Set 1 score (15 points match), and Trump Card nomination"
      >
        {editingSingleMatch && (
          <form onSubmit={handleSaveSingleMatch} className="space-y-5 text-xs max-h-[80vh] overflow-y-auto pr-1">
            {singleMatchFormError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 flex items-start gap-2.5 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Validation Error</p>
                  <p className="text-[11px] mt-0.5">{singleMatchFormError}</p>
                </div>
              </div>
            )}

            {/* Match Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gbl-navy-950 p-4 rounded-2xl border border-gbl-navy-800">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Match #</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editingSingleMatch.match_number || 1}
                  onChange={(e) => setEditingSingleMatch(prev => prev ? { ...prev, match_number: Number(e.target.value) } : null)}
                  className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-gbl-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Round Stage</label>
                <select
                  value={editingSingleMatch.round || 'Group Stage'}
                  onChange={(e) => setEditingSingleMatch(prev => prev ? { ...prev, round: e.target.value } : null)}
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
                  value={editingSingleMatch.court || 'Court 1'}
                  onChange={(e) => setEditingSingleMatch(prev => prev ? { ...prev, court: e.target.value } : null)}
                  className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gbl-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Match Time</label>
                <input
                  type="text"
                  value={editingSingleMatch.match_time || '06:00 PM'}
                  onChange={(e) => setEditingSingleMatch(prev => prev ? { ...prev, match_time: e.target.value } : null)}
                  className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gbl-orange-500"
                />
              </div>
            </div>

            {/* Category Selector */}
            <div className="bg-gbl-navy-950 p-4 rounded-2xl border border-gbl-navy-800 space-y-2">
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                Match Category (1 of 6 Official Categories)
              </label>
              <select
                value={editingSingleMatch.category_name || 'Veterans Doubles'}
                onChange={(e) => setEditingSingleMatch(prev => prev ? { ...prev, category_name: e.target.value as MatchCategory } : null)}
                className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-gbl-orange-500"
              >
                {DEFAULT_CATEGORIES.map(c => (
                  <option key={c.name} value={c.name}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Teams & Players */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Team 1 */}
              <div className="p-4 rounded-2xl bg-gbl-navy-950 border border-gbl-navy-800 space-y-3">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  Team 1
                </label>
                <select
                  value={editingSingleMatch.team1_id}
                  onChange={(e) => setEditingSingleMatch(prev => prev ? { ...prev, team1_id: e.target.value } : null)}
                  className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-gbl-orange-500"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({resolveTeamPool(t)})</option>
                  ))}
                </select>

                <div>
                  <label className="block text-slate-400 font-medium mb-1 text-[11px]">Team 1 Doubles Players</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe & Mike Smith"
                    value={editingSingleMatch.player1_names || ''}
                    onChange={(e) => setEditingSingleMatch(prev => prev ? { ...prev, player1_names: e.target.value } : null)}
                    className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gbl-orange-500 text-xs"
                  />
                </div>
              </div>

              {/* Team 2 */}
              <div className="p-4 rounded-2xl bg-gbl-navy-950 border border-gbl-navy-800 space-y-3">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  Team 2
                </label>
                <select
                  value={editingSingleMatch.team2_id}
                  onChange={(e) => setEditingSingleMatch(prev => prev ? { ...prev, team2_id: e.target.value } : null)}
                  className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-gbl-orange-500"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({resolveTeamPool(t)})</option>
                  ))}
                </select>

                <div>
                  <label className="block text-slate-400 font-medium mb-1 text-[11px]">Team 2 Doubles Players</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Ray & Steve Fox"
                    value={editingSingleMatch.player2_names || ''}
                    onChange={(e) => setEditingSingleMatch(prev => prev ? { ...prev, player2_names: e.target.value } : null)}
                    className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gbl-orange-500 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Score & Winner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gbl-navy-950 p-4 rounded-2xl border border-gbl-navy-800">
              {/* Set 1 Score */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Set 1 Score (15 Points Single Set)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 block mb-0.5">T1 Score</span>
                    <input
                      type="number"
                      min={0}
                      value={editingSingleMatch.set1_team1 ?? 15}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditingSingleMatch(prev => {
                          if (!prev) return null;
                          const s2 = prev.set1_team2 ?? 0;
                          return {
                            ...prev,
                            set1_team1: val,
                            winner_team_id: val > s2 ? prev.team1_id : (s2 > val ? prev.team2_id : prev.winner_team_id)
                          };
                        });
                      }}
                      className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-lg p-2 text-center font-mono text-white text-sm font-black focus:outline-none focus:border-gbl-orange-500"
                    />
                  </div>
                  <span className="text-slate-500 font-bold text-sm pt-4">-</span>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 block mb-0.5">T2 Score</span>
                    <input
                      type="number"
                      min={0}
                      value={editingSingleMatch.set1_team2 ?? 10}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditingSingleMatch(prev => {
                          if (!prev) return null;
                          const s1 = prev.set1_team1 ?? 0;
                          return {
                            ...prev,
                            set1_team2: val,
                            winner_team_id: s1 > val ? prev.team1_id : (val > s1 ? prev.team2_id : prev.winner_team_id)
                          };
                        });
                      }}
                      className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-lg p-2 text-center font-mono text-white text-sm font-black focus:outline-none focus:border-gbl-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Match Winner */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                  Match Winner
                </label>
                <select
                  value={editingSingleMatch.winner_team_id || editingSingleMatch.team1_id}
                  onChange={(e) => setEditingSingleMatch(prev => prev ? { ...prev, winner_team_id: e.target.value } : null)}
                  className="w-full bg-gbl-navy-900 border border-emerald-500/40 text-emerald-400 font-bold rounded-lg p-2 text-xs focus:outline-none mt-4"
                >
                  <option value={editingSingleMatch.team1_id}>
                    {teamMap.get(editingSingleMatch.team1_id)?.name || 'Team 1'}
                  </option>
                  <option value={editingSingleMatch.team2_id}>
                    {teamMap.get(editingSingleMatch.team2_id)?.name || 'Team 2'}
                  </option>
                </select>
              </div>
            </div>

            {/* Trump Card Nominations */}
            <div className="p-4 bg-gbl-navy-950 rounded-2xl border border-gbl-navy-800 space-y-2">
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Trump Card Nomination (+2 Pts Bonus / +4 Pts Dual Trump)</span>
              </label>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer bg-gbl-navy-900 px-3 py-2 rounded-xl border border-gbl-navy-700 hover:border-amber-500/50">
                  <input
                    type="checkbox"
                    checked={Boolean(editingSingleMatch.team1_trump)}
                    onChange={(e) => setEditingSingleMatch(prev => prev ? { ...prev, team1_trump: e.target.checked } : null)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-0"
                  />
                  <span className="text-white font-semibold">
                    {teamMap.get(editingSingleMatch.team1_id)?.name || 'Team 1'} Trump
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-gbl-navy-900 px-3 py-2 rounded-xl border border-gbl-navy-700 hover:border-amber-500/50">
                  <input
                    type="checkbox"
                    checked={Boolean(editingSingleMatch.team2_trump)}
                    onChange={(e) => setEditingSingleMatch(prev => prev ? { ...prev, team2_trump: e.target.checked } : null)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-0"
                  />
                  <span className="text-white font-semibold">
                    {teamMap.get(editingSingleMatch.team2_id)?.name || 'Team 2'} Trump
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setIsSingleMatchModalOpen(false);
                  setEditingSingleMatch(null);
                }}
                className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gbl-orange-600 to-amber-500 hover:from-gbl-orange-500 hover:to-amber-400 text-white font-bold uppercase tracking-wider shadow-lg shadow-gbl-orange-600/30 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Match...</span>
                  </>
                ) : (
                  <span>Save Match Result</span>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* SINGLE MATCH DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(deleteConfirmMatchId)}
        onClose={() => setDeleteConfirmMatchId(null)}
        title="CONFIRM DELETE MATCH RESULT"
        subtitle="This action will delete this individual match record and recalculate standings"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-200">
              <p className="font-bold text-red-400 text-sm">Are you sure you want to delete this match?</p>
              <p className="leading-relaxed">
                The match record and set score will be removed from the database and persistent storage. Tournament standings and points tables will automatically be recalculated.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              type="button"
              onClick={() => setDeleteConfirmMatchId(null)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeDeleteSingleMatch}
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
