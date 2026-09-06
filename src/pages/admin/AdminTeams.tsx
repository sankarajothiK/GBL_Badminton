import React, { useState } from 'react';
import { Shield, Edit2, Download, Upload, Users, Wallet, Plus, Check, Trash2 } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { Team } from '../../types/database';
import { formatINR, formatCompactINR } from '../../lib/currency';
import { exportTeamsCSV, exportSquadsCSV } from '../../lib/csv';
import { uploadImage } from '../../lib/supabase';
import { calculateMaxBid } from '../../lib/maxBid';
import { Modal } from '../../components/common/Modal';

export const AdminTeams: React.FC = () => {
  const { teams, players, settings, updateTeam, createTeam, deleteTeam } = useTournament();
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form states for adding / editing
  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [teamColor, setTeamColor] = useState('#FF5E00');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [ownerPhotoUrl, setOwnerPhotoUrl] = useState<string | null>(null);

  const openAddModal = () => {
    setTeamName('');
    setShortName('');
    setOwnerName('');
    setCaptainName('');
    setTeamColor('#FF5E00');
    setDescription('');
    setLogoUrl(null);
    setOwnerPhotoUrl(null);
    setUploadError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setShortName(team.short_name);
    setOwnerName(team.owner_name || '');
    setCaptainName(team.captain_name || '');
    setTeamColor(team.team_color || '#FF5E00');
    setDescription(team.description || '');
    setLogoUrl(team.logo_url || null);
    setOwnerPhotoUrl(team.owner_photo_url || null);
    setUploadError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'owner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const res = await uploadImage(file, 'teams');
    setUploading(false);

    if (res.error) {
      setUploadError(res.error);
    } else {
      if (target === 'logo') setLogoUrl(res.url);
      if (target === 'owner') setOwnerPhotoUrl(res.url);
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    await updateTeam(editingTeam.id, {
      name: teamName.trim(),
      short_name: shortName.trim().toUpperCase(),
      owner_name: ownerName.trim(),
      captain_name: captainName.trim(),
      team_color: teamColor,
      description: description.trim(),
      logo_url: logoUrl,
      owner_photo_url: ownerPhotoUrl
    });

    setEditingTeam(null);
    setSaveToast(`Team "${teamName.trim()}" successfully updated! Changes are live across all pages.`);
    setTimeout(() => setSaveToast(null), 5000);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !shortName.trim()) return;

    const nextTeamNum = teams.length > 0 ? Math.max(...teams.map(t => t.team_number)) + 1 : 1;

    await createTeam({
      tournament_id: '00000000-0000-0000-0000-000000000001',
      team_number: nextTeamNum,
      name: teamName.trim(),
      short_name: shortName.trim().toUpperCase(),
      owner_name: ownerName.trim(),
      owner_photo_url: ownerPhotoUrl,
      captain_name: captainName.trim(),
      captain_photo_url: null,
      team_color: teamColor,
      accent_color: '#FFFFFF',
      description: description.trim(),
      initial_budget: 500000,
      owner_reserved_points: 30000,
      current_balance: 470000,
      total_spent: 0,
      is_active: true,
      logo_url: logoUrl
    });

    setIsAddModalOpen(false);
    setSaveToast(`Team "${teamName.trim()}" successfully created!`);
    setTimeout(() => setSaveToast(null), 5000);
  };

  const handleConfirmDelete = async () => {
    if (deletingTeamId) {
      await deleteTeam(deletingTeamId);
      setDeletingTeamId(null);
      setSaveToast('Team deleted successfully.');
      setTimeout(() => setSaveToast(null), 5000);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <Check className="w-5 h-5" />
          <span className="font-bold text-sm">{saveToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-sports tracking-wide">TEAM MANAGEMENT</h1>
          <p className="text-xs text-slate-400">
            Manage tournament teams, budgets (₹5,00,000 total, ₹30,000 owner reserve, ₹4,70,000 player purse), logos, and owners
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportTeamsCSV(teams)}
            className="px-3.5 py-2 rounded-xl bg-gbl-navy-900 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-gbl-orange-400" />
            <span>Export Teams CSV</span>
          </button>
          <button
            onClick={() => exportSquadsCSV(teams, players)}
            className="px-3.5 py-2 rounded-xl bg-gbl-navy-900 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export Squads CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg shadow-gbl-orange-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team</span>
          </button>
        </div>
      </div>

      {/* Teams Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team) => {
          const squad = players.filter(p => p.sold_team_id === team.id);
          const maxBidInfo = calculateMaxBid({
            balance: team.current_balance,
            squadCount: squad.length,
            totalAuctionSlots: 5,
            reservePerSlot: 30000
          });

          return (
            <div
              key={team.id}
              className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Header: Logo, Name & Actions */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  {team.logo_url ? (
                    <img
                      src={team.logo_url}
                      alt={team.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-gbl-navy-700 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg shrink-0"
                      style={{ backgroundColor: team.team_color }}
                    >
                      {team.short_name}
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gbl-orange-400 tracking-wider">
                      Team #{team.team_number}
                    </span>
                    <h3 className="text-xl font-bold text-white">{team.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Team Owner: <strong className="text-slate-200">{team.owner_name || 'Not assigned'}</strong>
                    </p>
                    <p className="text-xs text-slate-400">
                      Captain: <strong className="text-slate-200">{team.captain_name || 'Not assigned'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(team)}
                    className="p-2.5 rounded-xl bg-gbl-navy-950 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-slate-300 hover:text-white transition-colors"
                    title="Edit Team Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingTeamId(team.id)}
                    className="p-2.5 rounded-xl bg-gbl-navy-950 hover:bg-rose-950/40 border border-gbl-navy-700 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete Team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Financial & Squad Stats Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gbl-navy-800 text-center">
                <div className="bg-gbl-navy-950 p-2.5 rounded-xl border border-gbl-navy-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Available Points</span>
                  <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 block">
                    {formatINR(team.current_balance)}
                  </span>
                </div>
                <div className="bg-gbl-navy-950 p-2.5 rounded-xl border border-gbl-navy-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Spent</span>
                  <span className="text-sm font-black text-slate-300 font-mono mt-0.5 block">
                    {formatINR(team.total_spent)}
                  </span>
                </div>
                <div className="bg-gbl-navy-950 p-2.5 rounded-xl border border-gbl-navy-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max Next Bid</span>
                  <span className="text-sm font-black text-amber-400 font-mono mt-0.5 block">
                    {formatINR(maxBidInfo.maxBid)}
                  </span>
                </div>
              </div>

              {/* Budget Allocation Explainer */}
              <div className="p-3 bg-gbl-navy-950 rounded-xl border border-gbl-navy-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Total Budget:</span>
                  <span className="font-mono text-white font-bold">{formatINR(team.initial_budget || 500000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Owner Reserved Points:</span>
                  <span className="font-mono text-amber-400 font-bold">{formatINR(team.owner_reserved_points || 30000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Reserved for Remaining ({Math.max(0, maxBidInfo.remainingAuctionSlots - 1)} slots):</span>
                  <span className="font-mono text-sky-400 font-bold">{formatINR(maxBidInfo.reservedPoints)}</span>
                </div>
              </div>

              {/* Squad Count & Slots Bar */}
              <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    <strong>{squad.length}</strong> / 5 Auctioned Players Acquired
                  </span>
                </div>
                <div>
                  <span className="text-slate-300 font-semibold">
                    Squad: <strong>{squad.length + 1}</strong> / 6 total (Owner + 5 Players)
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* EDIT TEAM MODAL */}
      <Modal
        isOpen={!!editingTeam}
        onClose={() => setEditingTeam(null)}
        title={`EDIT ${editingTeam?.name || 'TEAM'}`}
        subtitle="Configure team identity, brand colors, owner details and photos"
      >
        <form onSubmit={handleSaveTeam} className="space-y-4 text-xs">
          {uploadError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300">
              {uploadError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Team Name</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Short Code (2-4 letters)</label>
              <input
                type="text"
                required
                maxLength={4}
                value={shortName}
                onChange={(e) => setShortName(e.target.value.toUpperCase())}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Team Owner</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Team owner full name"
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Captain Name</label>
              <input
                type="text"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                placeholder="Captain full name"
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Team Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={teamColor}
                onChange={(e) => setTeamColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
              />
              <span className="font-mono text-white text-xs">{teamColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Team Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Team motto or background"
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Upload Team Logo (up to 10 MB)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => handleImageUpload(e, 'logo')}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gbl-navy-800 file:text-white hover:file:bg-gbl-navy-700"
            />
            {uploading && <p className="text-[10px] text-gbl-orange-400 mt-1">Processing image...</p>}
            {logoUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-gbl-navy-700" />
                <span className="text-[10px] text-emerald-400 font-semibold">Logo uploaded</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              type="button"
              onClick={() => setEditingTeam(null)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white font-bold uppercase tracking-wider"
            >
              Save Team
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD TEAM MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="ADD NEW TOURNAMENT TEAM"
        subtitle="Create a new team with standard 5,00,000 points budget and 30,000 owner reserve"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
          {uploadError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300">
              {uploadError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Team Name *</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Smashers United"
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Short Code (2-4 letters) *</label>
              <input
                type="text"
                required
                maxLength={4}
                value={shortName}
                onChange={(e) => setShortName(e.target.value.toUpperCase())}
                placeholder="e.g. SU"
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Team Owner</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Team owner full name"
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Captain Name</label>
              <input
                type="text"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                placeholder="Captain full name"
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Team Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={teamColor}
                onChange={(e) => setTeamColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
              />
              <span className="font-mono text-white text-xs">{teamColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Team Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Team motto or background"
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white font-bold uppercase tracking-wider"
            >
              Create Team
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE TEAM CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deletingTeamId}
        onClose={() => setDeletingTeamId(null)}
        title="CONFIRM TEAM DELETION"
        subtitle="Are you sure you want to delete this team?"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <p>
            This action will permanently delete this team from the tournament roster.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              onClick={() => setDeletingTeamId(null)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider"
            >
              Delete Team
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
