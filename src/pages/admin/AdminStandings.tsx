import React, { useState } from 'react';
import { ListOrdered, CheckCircle, XCircle, Save, Award, Download } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { exportStandingsCSV } from '../../lib/csv';

export const AdminStandings: React.FC = () => {
  const { standings, teams, settings, toggleManualQualifier, setQualifyingTeamsCount } = useTournament();

  const [qualifyingCount, setLocalQualifyingCount] = useState<number>(settings.qualifying_teams_count || 8);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const teamMap = new Map(teams.map(t => [t.id, t]));
  const manuallySelectedCount = standings.filter(s => s.manual_qualifier).length;

  const handleSaveQualifierSettings = async () => {
    await setQualifyingTeamsCount(qualifyingCount);
    setSaveMessage('Qualification settings and qualifier slots updated successfully.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleExportCSV = () => {
    const enriched = standings.map(s => ({
      ...s,
      teamName: teamMap.get(s.team_id)?.name
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
            Control ranking rules, qualification thresholds, and manual overrides
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

      {/* SECTION 33: QUALIFICATION THRESHOLD & CONTROLS */}
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
              max={10}
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
