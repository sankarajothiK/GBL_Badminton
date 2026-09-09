import React, { useState } from 'react';
import { Shield, Edit2, Download, Upload, Users, Wallet, Plus, Check, Trash2, Lock, RotateCcw } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { Team, Player } from '../../types/database';
import { formatINR, formatCompactINR } from '../../lib/currency';
import { exportTeamsCSV, exportSquadsCSV } from '../../lib/csv';
import { uploadImage } from '../../lib/supabase';
import { calculateMaxBid, getTeamAuctionMetrics } from '../../lib/maxBid';
import { Modal } from '../../components/common/Modal';
import { TeamCategoryBreakdown } from '../../components/common/TeamCategoryBreakdown';

export const AdminTeams: React.FC = () => {
  const { teams, players, settings, updateTeam, createTeam, deleteTeam, releaseSoldPlayer } = useTournament();
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [playerToRevert, setPlayerToRevert] = useState<{ player: Player; team: Team } | null>(null);
  const [reverting, setReverting] = useState(false);
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
  const [ownerIsPlayer, setOwnerIsPlayer] = useState<boolean>(true);
  const [ownerTier, setOwnerTier] = useState<'OPEN' | 'NORMAL' | 'NONE'>('NORMAL');

  const openAddModal = () => {
    setTeamName('');
    setShortName('');
    setOwnerName('');
    setCaptainName('');
    setTeamColor('#FF5E00');
    setDescription('');
    setLogoUrl(null);
    setOwnerPhotoUrl(null);
    setOwnerIsPlayer(true);
    setOwnerTier('NORMAL');
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
    
    const isPlaying = team.owner_is_player !== false && team.team_number !== 4;
    const tier = !isPlaying ? 'NONE' : ((team.owner_points_allocation === 100000 || team.owner_reserved_points === 100000) ? 'OPEN' : 'NORMAL');
    setOwnerIsPlayer(isPlaying);
    setOwnerTier(tier);
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

    const isPlaying = ownerTier !== 'NONE';
    const ownerPoints = ownerTier === 'OPEN' ? 100000 : (ownerTier === 'NORMAL' ? 30000 : 0);
    const auctionBudget = 500000 - ownerPoints;
    const maxSlots = isPlaying ? 5 : 6;
    
    // Calculate genuine spent from non-owner squad picks
    const squad = players.filter(p => p.sold_team_id === editingTeam.id && p.auction_status === 'SOLD');
    const nonOwnerSquad = squad.filter(p => !ownerName.trim() || !p.name.trim().toLowerCase().includes(ownerName.trim().toLowerCase()));
    const actualSpent = nonOwnerSquad.reduce((sum, p) => sum + (p.sold_price || 0), 0);
    const newBalance = Math.max(0, auctionBudget - actualSpent);

    await updateTeam(editingTeam.id, {
      name: teamName.trim(),
      short_name: shortName.trim().toUpperCase(),
      owner_name: ownerName.trim(),
      captain_name: captainName.trim(),
      team_color: teamColor,
      description: description.trim(),
      logo_url: logoUrl,
      owner_photo_url: ownerPhotoUrl,
      owner_is_player: isPlaying,
      owner_points_allocation: ownerPoints,
      owner_reserved_points: ownerPoints,
      auction_budget: auctionBudget,
      max_auction_slots: maxSlots,
      total_squad_slots: 6,
      total_spent: actualSpent,
      current_balance: newBalance
    });

    setEditingTeam(null);
    setSaveToast(`Team "${teamName.trim()}" successfully updated! Changes are live across all pages.`);
    setTimeout(() => setSaveToast(null), 5000);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !shortName.trim()) return;

    const nextTeamNum = teams.length > 0 ? Math.max(...teams.map(t => t.team_number)) + 1 : 1;
    const isPlaying = ownerTier !== 'NONE';
    const ownerPoints = ownerTier === 'OPEN' ? 100000 : (ownerTier === 'NORMAL' ? 30000 : 0);
    const auctionBudget = 500000 - ownerPoints;
    const maxSlots = isPlaying ? 5 : 6;

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
      owner_reserved_points: ownerPoints,
      owner_points_allocation: ownerPoints,
      current_balance: auctionBudget,
      auction_budget: auctionBudget,
      total_spent: 0,
      is_active: true,
      logo_url: logoUrl,
      owner_is_player: isPlaying,
      max_auction_slots: maxSlots,
      total_squad_slots: 6
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
          const metrics = getTeamAuctionMetrics(team, squad.length, settings);

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
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-gbl-orange-400 tracking-wider">
                        Team #{team.team_number}
                      </span>
                      {metrics.ownerIsPlayer ? (
                        <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase">
                          Playing Owner
                        </span>
                      ) : (
                        <span className="px-2 py-0.2 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[9px] font-bold uppercase">
                          Non-Playing Owner
                        </span>
                      )}
                    </div>
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
                    {formatINR(metrics.remainingBalance)}
                  </span>
                </div>
                <div className="bg-gbl-navy-950 p-2.5 rounded-xl border border-gbl-navy-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Spent</span>
                  <span className="text-sm font-black text-slate-300 font-mono mt-0.5 block">
                    {formatINR(metrics.totalSpent)}
                  </span>
                </div>
                <div className="bg-gbl-navy-950 p-2.5 rounded-xl border border-gbl-navy-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max Next Bid</span>
                  <span className="text-sm font-black text-amber-400 font-mono mt-0.5 block">
                    {formatINR(metrics.maxLegalBid)}
                  </span>
                </div>
              </div>

              {/* Budget Allocation Explainer */}
              <div className="p-3 bg-gbl-navy-950 rounded-xl border border-gbl-navy-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Total Budget:</span>
                  <span className="font-mono text-white font-bold">{formatINR(metrics.totalPoints)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Owner Allocation (Isolated):</span>
                  <span className="font-mono text-amber-400 font-bold">{formatINR(metrics.ownerAllocation)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Auction Budget:</span>
                  <span className="font-mono text-sky-400 font-bold">{formatINR(metrics.auctionBudget)}</span>
                </div>
              </div>

              {/* Squad Count & Slots Bar */}
              <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    Squad: <strong>{squad.length}</strong> / {team.total_squad_slots || 6} Members
                  </span>
                </div>
                <div>
                  <span className="text-slate-300 font-semibold">
                    {metrics.ownerIsPlayer ? (
                      <span className="text-emerald-400 font-bold">Playing Owner</span>
                    ) : (
                      <span className="text-sky-400 font-bold">Non-Playing Owner</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Category Breakdown */}
              <TeamCategoryBreakdown squad={squad} maxSlots={team.total_squad_slots || 6} variant="compact" />

              {/* Purchased Squad Players List with Unsell Option */}
              <div className="pt-3 border-t border-gbl-navy-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-gbl-orange-400" />
                    Purchased Players ({squad.length})
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {6 - squad.length > 0 ? `${6 - squad.length} slots left` : 'Full roster'}
                  </span>
                </div>

                {squad.length === 0 ? (
                  <div className="py-3 px-3 bg-gbl-navy-950/60 rounded-xl border border-dashed border-gbl-navy-800 text-center text-slate-500 text-xs font-medium">
                    No players purchased yet
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {squad.map((p) => {
                      const pCat = (p.auction_category || 'NON-MEDALIST').replace('NON-MEDALLIST', 'NON-MEDALIST');
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-gbl-navy-950 border border-gbl-navy-800/80 text-xs hover:border-gbl-navy-700 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={p.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover border border-gbl-navy-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white block truncate leading-tight">{p.name}</span>
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px] font-black uppercase border border-amber-500/40">
                                  {pCat}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {p.player_code} • {p.eligible_category_names?.slice(0, 2).join(', ')}
                              </span>
                            </div>
                          </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-black text-xs text-emerald-400">
                            {formatINR(p.sold_price || 0)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPlayerToRevert({ player: p, team })}
                            title="Remove from squad & refund budget"
                            className="px-2 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Unsell</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
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

          {/* Owner Player Status Toggle (3-Tier) */}
          <div className="p-3.5 bg-gbl-navy-950 border border-gbl-navy-700 rounded-2xl space-y-2.5">
            <label className="text-slate-200 font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gbl-orange-400" />
                <span>Owner Allocation Tier</span>
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setOwnerTier('OPEN'); setOwnerIsPlayer(true); }}
                className={`p-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center text-center transition-all ${
                  ownerTier === 'OPEN'
                    ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400'
                    : 'bg-gbl-navy-900 text-slate-400 hover:text-white border border-gbl-navy-800'
                }`}
              >
                <span>OPEN Owner</span>
                <span className="text-[10px] font-mono opacity-80">₹1,00,000</span>
              </button>
              <button
                type="button"
                onClick={() => { setOwnerTier('NORMAL'); setOwnerIsPlayer(true); }}
                className={`p-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center text-center transition-all ${
                  ownerTier === 'NORMAL'
                    ? 'bg-amber-600 text-white shadow ring-2 ring-amber-400'
                    : 'bg-gbl-navy-900 text-slate-400 hover:text-white border border-gbl-navy-800'
                }`}
              >
                <span>Normal Owner</span>
                <span className="text-[10px] font-mono opacity-80">₹30,000</span>
              </button>
              <button
                type="button"
                onClick={() => { setOwnerTier('NONE'); setOwnerIsPlayer(false); }}
                className={`p-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center text-center transition-all ${
                  ownerTier === 'NONE'
                    ? 'bg-sky-600 text-white shadow ring-2 ring-sky-400'
                    : 'bg-gbl-navy-900 text-slate-400 hover:text-white border border-gbl-navy-800'
                }`}
              >
                <span>No-Play Owner</span>
                <span className="text-[10px] font-mono opacity-80">₹0 Ded.</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              {ownerTier === 'OPEN' && 'Fixed ₹1,00,000 points allocated to Owner (1 roster slot). Remaining ₹4,00,000 available for 5 auction picks.'}
              {ownerTier === 'NORMAL' && 'Fixed ₹30,000 points allocated to Owner (1 roster slot). Remaining ₹4,70,000 available for 5 auction picks.'}
              {ownerTier === 'NONE' && 'Non-Playing Owner (e.g. Tamilaga Asiriyar kootani warriors). ₹0 deducted. Full ₹5,00,000 available for 6 auction picks.'}
            </p>
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

          {/* Team Logo Upload & Direct URL */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold">
              Team Logo (JPG, PNG, WEBP, SVG — up to 10 MB or Image URL)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gbl-navy-800 file:text-white hover:file:bg-gbl-navy-700 cursor-pointer"
                />
              </div>
              <div>
                <input
                  type="url"
                  placeholder="Or paste image URL (https://... or /gbl-logo.png)"
                  value={logoUrl || ''}
                  onChange={(e) => setLogoUrl(e.target.value.trim() || null)}
                  className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-gbl-orange-500 focus:outline-none"
                />
              </div>
            </div>
            {uploading && <p className="text-[10px] text-gbl-orange-400">Processing & compressing image...</p>}
            
            {logoUrl && (
              <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-gbl-navy-950 border border-gbl-navy-800">
                <div className="flex items-center gap-3">
                  <img src={logoUrl} alt="Logo preview" className="w-12 h-12 rounded-xl object-contain bg-slate-900 border border-gbl-navy-700 p-0.5" />
                  <div>
                    <span className="text-xs text-emerald-400 font-bold block">Logo Active &amp; Ready</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[220px] block">
                      {logoUrl.startsWith('data:') ? 'Custom Uploaded Image' : logoUrl}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 text-xs font-semibold"
                >
                  Remove
                </button>
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

          {/* Owner Player Status Toggle (3-Tier) */}
          <div className="p-3.5 bg-gbl-navy-950 border border-gbl-navy-700 rounded-2xl space-y-2.5">
            <label className="text-slate-200 font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gbl-orange-400" />
                <span>Owner Allocation Tier</span>
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setOwnerTier('OPEN'); setOwnerIsPlayer(true); }}
                className={`p-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center text-center transition-all ${
                  ownerTier === 'OPEN'
                    ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400'
                    : 'bg-gbl-navy-900 text-slate-400 hover:text-white border border-gbl-navy-800'
                }`}
              >
                <span>OPEN Owner</span>
                <span className="text-[10px] font-mono opacity-80">₹1,00,000</span>
              </button>
              <button
                type="button"
                onClick={() => { setOwnerTier('NORMAL'); setOwnerIsPlayer(true); }}
                className={`p-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center text-center transition-all ${
                  ownerTier === 'NORMAL'
                    ? 'bg-amber-600 text-white shadow ring-2 ring-amber-400'
                    : 'bg-gbl-navy-900 text-slate-400 hover:text-white border border-gbl-navy-800'
                }`}
              >
                <span>Normal Owner</span>
                <span className="text-[10px] font-mono opacity-80">₹30,000</span>
              </button>
              <button
                type="button"
                onClick={() => { setOwnerTier('NONE'); setOwnerIsPlayer(false); }}
                className={`p-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center text-center transition-all ${
                  ownerTier === 'NONE'
                    ? 'bg-sky-600 text-white shadow ring-2 ring-sky-400'
                    : 'bg-gbl-navy-900 text-slate-400 hover:text-white border border-gbl-navy-800'
                }`}
              >
                <span>No-Play Owner</span>
                <span className="text-[10px] font-mono opacity-80">₹0 Ded.</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              {ownerTier === 'OPEN' && 'Fixed ₹1,00,000 points allocated to Owner (1 roster slot). Remaining ₹4,00,000 available for 5 auction picks.'}
              {ownerTier === 'NORMAL' && 'Fixed ₹30,000 points allocated to Owner (1 roster slot). Remaining ₹4,70,000 available for 5 auction picks.'}
              {ownerTier === 'NONE' && 'Non-Playing Owner (e.g. Tamilaga Asiriyar kootani warriors). ₹0 deducted. Full ₹5,00,000 available for 6 auction picks.'}
            </p>
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

          {/* Team Logo Upload & Direct URL */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold">
              Team Logo (JPG, PNG, WEBP, SVG — up to 10 MB or Image URL)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gbl-navy-800 file:text-white hover:file:bg-gbl-navy-700 cursor-pointer"
                />
              </div>
              <div>
                <input
                  type="url"
                  placeholder="Or paste image URL (https://... or /gbl-logo.png)"
                  value={logoUrl || ''}
                  onChange={(e) => setLogoUrl(e.target.value.trim() || null)}
                  className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-gbl-orange-500 focus:outline-none"
                />
              </div>
            </div>
            {uploading && <p className="text-[10px] text-gbl-orange-400">Processing & compressing image...</p>}
            
            {logoUrl && (
              <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-gbl-navy-950 border border-gbl-navy-800">
                <div className="flex items-center gap-3">
                  <img src={logoUrl} alt="Logo preview" className="w-12 h-12 rounded-xl object-contain bg-slate-900 border border-gbl-navy-700 p-0.5" />
                  <div>
                    <span className="text-xs text-emerald-400 font-bold block">Logo Active &amp; Ready</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[220px] block">
                      {logoUrl.startsWith('data:') ? 'Custom Uploaded Image' : logoUrl}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            )}
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

      {/* CONFIRM REVERT / UNSELL SQUAD PLAYER MODAL */}
      <Modal
        isOpen={!!playerToRevert}
        onClose={() => setPlayerToRevert(null)}
        title="REMOVE SQUAD PLAYER"
        subtitle="Revert player to Unsold status and refund team budget"
      >
        {playerToRevert && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl text-amber-200 space-y-2">
              <p className="font-bold text-sm">
                Are you sure you want to remove <span className="text-white underline font-black">{playerToRevert.player.name}</span> from <span className="text-white underline font-black">{playerToRevert.team.name}</span>?
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-300/90">
                <li>Player status will be set back to <strong className="text-white">UNSOLD</strong>.</li>
                <li><strong className="text-white font-mono">{formatINR(playerToRevert.player.sold_price || 0)}</strong> will be refunded to {playerToRevert.team.name}'s balance.</li>
                <li>Total spent for {playerToRevert.team.name} will be deducted.</li>
                <li>The player will immediately be available again in the auction engine.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gbl-navy-800">
              <button
                type="button"
                disabled={reverting}
                onClick={() => setPlayerToRevert(null)}
                className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 font-bold hover:bg-gbl-navy-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reverting}
                onClick={async () => {
                  setReverting(true);
                  const res = await releaseSoldPlayer(playerToRevert.player.id);
                  setReverting(false);
                  setPlayerToRevert(null);
                  if (res.success) {
                    setSaveToast(`Player "${playerToRevert.player.name}" removed from squad and refunded!`);
                    setTimeout(() => setSaveToast(null), 5000);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black uppercase tracking-wider transition-colors shadow-lg shadow-rose-600/30"
              >
                {reverting ? 'Refunding...' : 'Confirm Remove & Refund'}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

