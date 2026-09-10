import React, { useState, useEffect } from 'react';
import { ListOrdered, CheckCircle, XCircle, Save, Award, Download, Layers, Shuffle } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { exportStandingsCSV } from '../../lib/csv';

export const AdminStandings: React.FC = () => {
  const { standings, teams, settings, toggleManualQualifier, setQualifyingTeamsCount, setTeamsPools } = useTournament();

  const [qualifyingCount, setLocalQualifyingCount] = useState<number>(settings.qualifying_teams_count || 8);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Editable pool state
  const [poolAssignments, setPoolAssignments] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    teams.forEach(t => {
      init[t.id] = t.pool || 'Unassigned';
    });
    return init;
  });

  useEffect(() => {
    setPoolAssignments(prev => {
      const next = { ...prev };
      teams.forEach(t => {
        if (!next[t.id]) next[t.id] = t.pool || 'Unassigned';
      });
      return next;
    });
  }, [teams]);

  const teamMap = new Map(teams.map(t => [t.id, t]));
  const manuallySelectedCount = standings.filter(s => s.manual_qualifier).length;

  const handleSaveQualifierSettings = async () => {
    await setQualifyingTeamsCount(qualifyingCount);
    setSaveMessage('Qualification settings and qualifier slots updated successfully.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handlePoolSelect = (teamId: string, pool: string) => {
    setPoolAssignments(prev => ({ ...prev, [teamId]: pool }));
  };

  const handleAutoSplit3Pools = () => {
    const next: Record<string, string> = {};
    const count = teams.length;
    const perPool = Math.ceil(count / 3);
    teams.forEach((t, idx) => {
      if (idx < perPool) next[t.id] = 'Pool A';
      else if (idx < perPool * 2) next[t.id] = 'Pool B';
      else next[t.id] = 'Pool C';
    });
    setPoolAssignments(next);
  };

  const handleAutoSplit2Pools = () => {
    const next: Record<string, string> = {};
    const perPool = Math.ceil(teams.length / 2);
    teams.forEach((t, idx) => {
      next[t.id] = idx < perPool ? 'Pool A' : 'Pool B';
    });
    setPoolAssignments(next);
  };

  const handleSavePools = async () => {
    await setTeamsPools(poolAssignments);
    setSaveMessage('Pool allocations (Pool A, Pool B & Pool C) saved successfully! Changes are live on public standings.');
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const poolACount = Object.values(poolAssignments).filter(p => p === 'Pool A').length;
  const poolBCount = Object.values(poolAssignments).filter(p => p === 'Pool B').length;
  const poolCCount = Object.values(poolAssignments).filter(p => p === 'Pool C').length;

  const handleExportCSV = () => {
    const enriched = standings.map(s => ({
      ...s,
      teamName: teamMap.get(s.team_id)?.name,
      pool: teamMap.get(s.team_id)?.pool || 'Unassigned'
    }));
    exportStandingsCSV(enriched);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-sports tracking-wide">
            STANDINGS & QUALIFICATION MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400">
            Configure Pool A, Pool B & Pool C allocations for all {teams.length} teams, qualification thresholds, and manual overrides
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl bg-gbl-navy-900 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-md"
        >
          <Download className="w-4 h-4 text-gbl-orange-400" />
          <span>Export Standings CSV</span>
        </button>
      </div>

      {saveMessage && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/50 rounded-2xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* SECTION: POST-AUCTION POOL ALLOCATION (POOL A, POOL B, POOL C) */}
      <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gbl-navy-800">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-gbl-orange-500" />
              <span>Tournament Pools Allocation (Post-Auction)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Assign all {teams.length} teams into tournament pools (Pool A, Pool B, Pool C) after auction completion.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs mr-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg font-bold ${poolACount > 0 ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'bg-slate-800 text-slate-400'}`}>
                Pool A: {poolACount}
              </span>
              <span className={`px-2.5 py-1 rounded-lg font-bold ${poolBCount > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-400'}`}>
                Pool B: {poolBCount}
              </span>
              <span className={`px-2.5 py-1 rounded-lg font-bold ${poolCCount > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                Pool C: {poolCCount}
              </span>
            </div>

            <button
              onClick={handleAutoSplit3Pools}
              className="px-3 py-1.5 rounded-xl bg-gbl-navy-950 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Split 3 Pools (A, B, C)</span>
            </button>

            <button
              onClick={handleAutoSplit2Pools}
              className="px-3 py-1.5 rounded-xl bg-gbl-navy-950 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5 text-sky-400" />
              <span>Split 2 Pools (A, B)</span>
            </button>

            <button
              onClick={handleSavePools}
              className="px-4 py-1.5 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Pools</span>
            </button>
          </div>
        </div>

        {/* Teams Pool Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {teams.map((t) => {
            const currentPool = poolAssignments[t.id] || 'Unassigned';
            return (
              <div 
                key={t.id}
                className={`p-3 rounded-2xl border transition-all ${
                  currentPool === 'Pool A'
                    ? 'bg-sky-950/30 border-sky-500/40'
                    : currentPool === 'Pool B'
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : currentPool === 'Pool C'
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-gbl-navy-950 border-gbl-navy-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {t.logo_url ? (
                    <img src={t.logo_url} alt={t.name} className="w-7 h-7 rounded-lg object-contain bg-slate-900 p-0.5 border border-slate-700 shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0" style={{ backgroundColor: t.team_color }}>
                      {t.short_name}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{t.name}</p>
                    <span className="text-[10px] text-slate-400">Team #{t.team_number}</span>
                  </div>
                </div>

                <select
                  value={currentPool}
                  onChange={(e) => handlePoolSelect(t.id, e.target.value)}
                  className={`w-full text-xs font-bold rounded-xl px-2.5 py-1.5 border focus:outline-none ${
                    currentPool === 'Pool A'
                      ? 'bg-sky-950 border-sky-500/60 text-sky-300'
                      : currentPool === 'Pool B'
                      ? 'bg-amber-950 border-amber-500/60 text-amber-300'
                      : currentPool === 'Pool C'
                      ? 'bg-emerald-950 border-emerald-500/60 text-emerald-300'
                      : 'bg-gbl-navy-900 border-gbl-navy-700 text-slate-400'
                  }`}
                >
                  <option value="Unassigned">Unassigned</option>
                  <option value="Pool A">Pool A</option>
                  <option value="Pool B">Pool B</option>
                  <option value="Pool C">Pool C</option>
                  <option value="Pool D">Pool D</option>
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: QUALIFICATION THRESHOLD & CONTROLS */}
      <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-gbl-navy-800 flex items-center gap-2">
          <Award className="w-4 h-4 text-gbl-orange-500" />
          <span>Knockout Qualification Rules</span>
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 font-semibold">Number of Qualifying Teams:</span>
            <input
              type="number"
              min={2}
              max={teams.length || 12}
              value={qualifyingCount}
              onChange={(e) => setLocalQualifyingCount(Number(e.target.value))}
              className="w-20 bg-gbl-navy-950 border border-gbl-navy-700 text-sm font-bold font-mono text-center rounded-xl p-2 text-white focus:outline-none focus:border-gbl-orange-500"
            />
            <button
              onClick={handleSaveQualifierSettings}
              className="px-4 py-2 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Qualifiers</span>
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Manual Override Count: <strong className="text-emerald-400 font-mono">{manuallySelectedCount} / {qualifyingCount}</strong> selected
          </div>
        </div>
      </div>

      {/* Standings Table with Manual Qualifier Toggles */}
      <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gbl-navy-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-gbl-navy-800">
              <tr>
                <th className="p-4 text-center">Rank</th>
                <th className="p-4">Team</th>
                <th className="p-4 text-center">Pool</th>
                <th className="p-4 text-center">Played</th>
                <th className="p-4 text-center">Won</th>
                <th className="p-4 text-center">Lost</th>
                <th className="p-4 text-center">Points</th>
                <th className="p-4 text-center">Score Diff</th>
                <th className="p-4 text-center">Auto Status</th>
                <th className="p-4 text-center">Manual Qualifier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gbl-navy-800 font-medium">
              {standings.map((s, index) => {
                const team = teamMap.get(s.team_id);
                const isAutoQual = index < qualifyingCount;
                const pool = team?.pool || 'Unassigned';

                return (
                  <tr key={s.id} className="hover:bg-gbl-navy-800/40 transition-colors">
                    <td className="p-4 text-center font-bold font-mono text-white">#{index + 1}</td>
                    
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                          style={{ backgroundColor: team?.team_color || '#333' }}
                        >
                          {team?.short_name || 'GBL'}
                        </div>
                        <span className="font-bold text-white text-sm">{team?.name}</span>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pool === 'Pool A'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : pool === 'Pool B'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {pool}
                      </span>
                    </td>

                    <td className="p-4 text-center font-mono text-slate-300">{s.played}</td>
                    <td className="p-4 text-center font-mono text-emerald-400 font-bold">{s.won}</td>
                    <td className="p-4 text-center font-mono text-rose-400">{s.lost}</td>
                    <td className="p-4 text-center font-mono font-black text-white text-base">{s.points}</td>
                    <td className="p-4 text-center font-mono text-slate-300">{s.score_diff > 0 ? `+${s.score_diff}` : s.score_diff}</td>

                    <td className="p-4 text-center">
                      {isAutoQual ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Top {qualifyingCount} Zone
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                          Eliminated
                        </span>
                      )}
                    </td>

                    {/* Section 33: Manual Override Toggle */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleManualQualifier(s.team_id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-all ${
                          s.manual_qualifier
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-gbl-navy-950 text-slate-400 hover:text-white border border-gbl-navy-700'
                        }`}
                      >
                        {s.manual_qualifier ? 'QUALIFIED ✓' : 'SELECT'}
                      </button>
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
