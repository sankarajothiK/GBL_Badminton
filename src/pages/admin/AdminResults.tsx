import React, { useState } from 'react';
import { Trophy, Plus, CheckCircle2, Edit2, Calendar, Clock, MapPin } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { TournamentMatch } from '../../types/database';
import { Modal } from '../../components/common/Modal';

export const AdminResults: React.FC = () => {
  const { matches, teams, categories, saveMatchResult } = useTournament();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<TournamentMatch | null>(null);

  // Form states
  const [round, setRound] = useState('Group Stage');
  const [matchNumber, setMatchNumber] = useState(matches.length + 1);
  const [team1Id, setTeam1Id] = useState(teams[0]?.id || '');
  const [team2Id, setTeam2Id] = useState(teams[1]?.id || '');
  const [court, setCourt] = useState('Court 1');
  const [matchTime, setMatchTime] = useState('10:00 AM');
  const [status, setStatus] = useState<'SCHEDULED' | 'LIVE' | 'COMPLETED'>('COMPLETED');
  const [player1Names, setPlayer1Names] = useState('');
  const [player2Names, setPlayer2Names] = useState('');
  const [isTrumpMatch, setIsTrumpMatch] = useState(false);
  const [trumpTeamId, setTrumpTeamId] = useState('');
  const [set1T1, setSet1T1] = useState(21);
  const [set1T2, setSet1T2] = useState(18);
  const [set2T1, setSet2T1] = useState(19);
  const [set2T2, setSet2T2] = useState(21);
  const [set3T1, setSet3T1] = useState(21);
  const [set3T2, setSet3T2] = useState(15);
  const [winnerTeamId, setWinnerTeamId] = useState(teams[0]?.id || '');

  const teamMap = new Map(teams.map(t => [t.id, t]));

  const openAdd = () => {
    setEditingMatch(null);
    setMatchNumber(matches.length + 1);
    setRound('Group Stage');
    setTeam1Id(teams[0]?.id || '');
    setTeam2Id(teams[1]?.id || '');
    setPlayer1Names('');
    setPlayer2Names('');
    setIsTrumpMatch(false);
    setTrumpTeamId(teams[0]?.id || '');
    setStatus('COMPLETED');
    setIsModalOpen(true);
  };

  const openEdit = (m: TournamentMatch) => {
    setEditingMatch(m);
    setMatchNumber(m.match_number);
    setRound(m.round);
    setTeam1Id(m.team1_id);
    setTeam2Id(m.team2_id);
    setPlayer1Names(m.player1_names || '');
    setPlayer2Names(m.player2_names || '');
    setIsTrumpMatch(!!m.is_trump_match);
    setTrumpTeamId(m.trump_team_id || m.team1_id);
    setCourt(m.court);
    setMatchTime(m.match_time);
    setStatus(m.status);
    setSet1T1(m.set1_team1);
    setSet1T2(m.set1_team2);
    setSet2T1(m.set2_team1);
    setSet2T2(m.set2_team2);
    setSet3T1(m.set3_team1);
    setSet3T2(m.set3_team2);
    setWinnerTeamId(m.winner_team_id || m.team1_id);
    setIsModalOpen(true);
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();

    const t1Name = teamMap.get(team1Id)?.short_name || 'T1';
    const t2Name = teamMap.get(team2Id)?.short_name || 'T2';
    const scoreSumm = `${set1T1}-${set1T2}, ${set2T1}-${set2T2}${set3T1 > 0 ? `, ${set3T1}-${set3T2}` : ''}`;

    const matchObj: TournamentMatch = {
      id: editingMatch?.id || 'match_' + Date.now(),
      tournament_id: '00000000-0000-0000-0000-000000000001',
      category_id: null,
      round,
      match_number: Number(matchNumber),
      team1_id: team1Id,
      team2_id: team2Id,
      court,
      match_date: new Date().toISOString().slice(0, 10),
      match_time: matchTime,
      status,
      winner_team_id: status === 'COMPLETED' ? winnerTeamId : null,
      score_summary: scoreSumm,
      set1_team1: Number(set1T1),
      set1_team2: Number(set1T2),
      set2_team1: Number(set2T1),
      set2_team2: Number(set2T2),
      set3_team1: Number(set3T1),
      set3_team2: Number(set3T2),
      player1_names: player1Names.trim() || undefined,
      player2_names: player2Names.trim() || undefined,
      is_trump_match: isTrumpMatch,
      trump_team_id: isTrumpMatch ? (trumpTeamId || winnerTeamId) : null,
      match_points_awarded: isTrumpMatch ? 2 : 1,
      notes: null,
      created_at: editingMatch?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await saveMatchResult(matchObj);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-sports tracking-wide">
            MATCH RESULTS MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400">
            Enter match scores and winners — standings and qualification tables update automatically
          </p>
        </div>

        <button
          onClick={openAdd}
          className="px-4 py-2.5 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Enter Match Result</span>
        </button>
      </div>

      {/* Matches List Table */}
      <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gbl-navy-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-gbl-navy-800">
              <tr>
                <th className="p-4">Match #</th>
                <th className="p-4">Round &amp; Type</th>
                <th className="p-4">Team 1</th>
                <th className="p-4 text-center">Score Summary</th>
                <th className="p-4">Team 2</th>
                <th className="p-4">Winner &amp; Points</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gbl-navy-800 font-medium">
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No match results recorded yet. Click "Enter Match Result" above to add the first fixture.
                  </td>
                </tr>
              ) : (
                matches.map((m) => {
                  const t1 = teamMap.get(m.team1_id);
                  const t2 = teamMap.get(m.team2_id);
                  const winner = teamMap.get(m.winner_team_id || '');
                  const isTrump = !!m.is_trump_match;
                  const ptsAwarded = m.match_points_awarded ?? (isTrump ? 2 : 1);

                  return (
                    <tr key={m.id} className="hover:bg-gbl-navy-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-white">#{m.match_number}</td>
                      <td className="p-4">
                        <span className="text-slate-300 block">{m.round}</span>
                        {isTrump ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            ★ TRUMP (2 PTS)
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 mt-1 rounded text-[9px] font-semibold bg-slate-800 text-slate-400">
                            Normal Match
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-white">{t1?.name}</p>
                        {m.player1_names && (
                          <p className="text-[11px] text-slate-400 font-normal mt-0.5">Players: {m.player1_names}</p>
                        )}
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-emerald-400">
                        {m.score_summary || `${m.set1_team1}-${m.set1_team2}, ${m.set2_team1}-${m.set2_team2}`}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-white">{t2?.name}</p>
                        {m.player2_names && (
                          <p className="text-[11px] text-slate-400 font-normal mt-0.5">Players: {m.player2_names}</p>
                        )}
                      </td>
                      <td className="p-4">
                        {winner ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{winner.name}</span>
                            </span>
                            <span className={`block text-[10px] font-mono font-bold ${isTrump ? 'text-amber-400' : 'text-slate-400'}`}>
                              +{ptsAwarded} {ptsAwarded === 1 ? 'Win Point' : 'Points (Trump Win)'}
                            </span>
                          </div>
                        ) : 'Pending'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openEdit(m)}
                          className="p-1.5 rounded-lg bg-gbl-navy-950 hover:bg-gbl-navy-800 text-slate-300 hover:text-white"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MATCH MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMatch ? "EDIT MATCH RESULT" : "RECORD MATCH RESULT"}
        subtitle="Automatic calculation of points table and differential upon saving"
      >
        <form onSubmit={handleSaveMatch} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Match Number</label>
              <input
                type="number"
                required
                value={matchNumber}
                onChange={(e) => setMatchNumber(Number(e.target.value))}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Round</label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="Group Stage">Group Stage</option>
                <option value="Quarter Final">Quarter Final</option>
                <option value="Semi Final">Semi Final</option>
                <option value="Grand Final">Grand Final</option>
              </select>
            </div>
          </div>

          {/* Trump Card Match Toggle */}
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTrumpMatch}
                  onChange={(e) => setIsTrumpMatch(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 focus:outline-none accent-amber-500"
                />
                <span className="font-bold text-amber-300 text-xs">TRUMP CARD MATCH</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-amber-400">
                {isTrumpMatch ? '+2 Win / -1 Loss Rule' : 'Normal Points Rule'}
              </span>
            </div>
            {isTrumpMatch && (
              <div className="space-y-2 pt-1 border-t border-amber-500/20">
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  ★ <strong>Trump Rules:</strong> Winning team receives <strong>+2 points</strong>. If the team that called Trump loses, they receive a <strong>-1 point penalty</strong>.
                </p>
                <div>
                  <label className="block text-[11px] text-amber-300 font-semibold mb-1">
                    Which Team Nominated Trump?
                  </label>
                  <select
                    value={trumpTeamId || team1Id}
                    onChange={(e) => setTrumpTeamId(e.target.value)}
                    className="w-full bg-gbl-navy-950 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value={team1Id}>{teamMap.get(team1Id)?.name || 'Team 1'} (Team 1)</option>
                    <option value={team2Id}>{teamMap.get(team2Id)?.name || 'Team 2'} (Team 2)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Team 1</label>
              <select
                value={team1Id}
                onChange={(e) => setTeam1Id(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Team 2</label>
              <select
                value={team2Id}
                onChange={(e) => setTeam2Id(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Players Who Played */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Team 1 Players</label>
              <input
                type="text"
                placeholder="e.g. S. Karthik & R. Kumar"
                value={player1Names}
                onChange={(e) => setPlayer1Names(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-gbl-orange-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Team 2 Players</label>
              <input
                type="text"
                placeholder="e.g. M. Vignesh & K. Anand"
                value={player2Names}
                onChange={(e) => setPlayer2Names(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-gbl-orange-500"
              />
            </div>
          </div>

          {/* Scores per set */}
          <div className="bg-gbl-navy-950 p-4 rounded-2xl border border-gbl-navy-800 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Set Scores</span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Set 1 (T1 - T2)</label>
                <div className="flex gap-1">
                  <input type="number" value={set1T1} onChange={(e) => setSet1T1(Number(e.target.value))} className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-lg p-1.5 text-center text-white font-mono" />
                  <input type="number" value={set1T2} onChange={(e) => setSet1T2(Number(e.target.value))} className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-lg p-1.5 text-center text-white font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Set 2 (T1 - T2)</label>
                <div className="flex gap-1">
                  <input type="number" value={set2T1} onChange={(e) => setSet2T1(Number(e.target.value))} className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-lg p-1.5 text-center text-white font-mono" />
                  <input type="number" value={set2T2} onChange={(e) => setSet2T2(Number(e.target.value))} className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-lg p-1.5 text-center text-white font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Set 3 (Optional)</label>
                <div className="flex gap-1">
                  <input type="number" value={set3T1} onChange={(e) => setSet3T1(Number(e.target.value))} className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-lg p-1.5 text-center text-white font-mono" />
                  <input type="number" value={set3T2} onChange={(e) => setSet3T2(Number(e.target.value))} className="w-full bg-gbl-navy-900 border border-gbl-navy-700 rounded-lg p-1.5 text-center text-white font-mono" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Match Winner</label>
            <select
              value={winnerTeamId}
              onChange={(e) => setWinnerTeamId(e.target.value)}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white font-bold text-emerald-400 focus:outline-none"
            >
              <option value={team1Id}>{teamMap.get(team1Id)?.name} (Team 1)</option>
              <option value={team2Id}>{teamMap.get(team2Id)?.name} (Team 2)</option>
            </select>
          </div>

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
              className="px-5 py-2 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white font-bold uppercase tracking-wider"
            >
              Save &amp; Recalculate Standings
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
