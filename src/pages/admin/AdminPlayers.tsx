import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Upload, 
  Download, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  X
} from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { Player, OFFICIAL_PLAYER_CATEGORIES } from '../../types/database';
import { formatINR } from '../../lib/currency';
import { exportPlayersCSV, validatePlayerImportCSV, ImportValidationRow } from '../../lib/csv';
import { uploadImage } from '../../lib/supabase';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { PhoneInput, parsePhoneNumber } from '../../components/common/PhoneInput';

export const AdminPlayers: React.FC = () => {
  const { players, teams, categories, createPlayer, updatePlayer, deletePlayer, importPlayersList } = useTournament();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState('Male');
  const [academy, setAcademy] = useState('');
  const [tshirtSize, setTshirtSize] = useState('');
  const [mobile, setMobile] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Open']);
  const [achievements, setAchievements] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvPreviewRows, setCsvPreviewRows] = useState<ImportValidationRow[]>([]);
  const [importStats, setImportStats] = useState({ validCount: 0, errorCount: 0 });
  const [importing, setImporting] = useState(false);

  // Delete Confirmation Modal
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null);

  // Success Feedback Toast
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const teamMap = new Map(teams.map(t => [t.id, t]));

  // Open Add Modal
  const openAddModal = () => {
    setEditingPlayerId(null);
    setName('');
    setAge(25);
    setGender('Male');
    setAcademy('');
    setTshirtSize('');
    setMobile('');
    setSelectedCategories(['Open']);
    setAchievements('');
    setNotes('');
    setPhotoUrl(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: Player) => {
    setEditingPlayerId(p.id);
    setName(p.name);
    setAge(p.age);
    setGender(p.gender);
    setAcademy(p.academy || '');
    setTshirtSize(p.tshirt_size || '');
    const cleanPhone = p.mobile && p.mobile !== '+91 98840 00000' && p.mobile !== '98840 00000' ? p.mobile : '';
    setMobile(cleanPhone);
    setSelectedCategories(p.eligible_category_names?.length ? p.eligible_category_names : ['Open']);
    setAchievements(p.achievements || '');
    setNotes(p.notes || '');
    setPhotoUrl(p.photo_url || null);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Toggle Category selection
  const toggleCategory = (catName: string) => {
    if (selectedCategories.includes(catName)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== catName));
      }
    } else {
      setSelectedCategories([...selectedCategories, catName]);
    }
  };

  // 10 MB Image upload handler (Fixing 2 MB bug! Section 7 & 63)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFormError(null);

    const res = await uploadImage(file, 'players');
    setUploading(false);

    if (res.error) {
      setFormError(res.error);
    } else {
      setPhotoUrl(res.url);
    }
  };

  // Save Player form
  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Player name is required.');
      return;
    }

    if (mobile.trim()) {
      const parsedMobile = parsePhoneNumber(mobile);
      if (parsedMobile.digits.length > 0 && parsedMobile.digits.length < 10) {
        setFormError(`Mobile number must be exactly 10 digits (${parsedMobile.digits.length}/10 entered).`);
        return;
      }
    }

    if (editingPlayerId) {
      await updatePlayer(editingPlayerId, {
        name: name.trim(),
        age: Number(age),
        gender,
        academy: academy.trim() || undefined,
        tshirt_size: tshirtSize.trim() || undefined,
        mobile: mobile.trim(),
        eligible_category_names: selectedCategories,
        achievements: achievements.trim(),
        notes: notes.trim(),
        photo_url: photoUrl
      });
    } else {
      const code = `GBL-${String(players.length + 1).padStart(3, '0')}`;
      await createPlayer({
        tournament_id: '00000000-0000-0000-0000-000000000001',
        player_code: code,
        name: name.trim(),
        age: Number(age),
        gender,
        academy: academy.trim() || undefined,
        tshirt_size: tshirtSize.trim() || undefined,
        mobile: mobile.trim(),
        eligible_category_ids: [],
        eligible_category_names: selectedCategories,
        achievements: achievements.trim(),
        notes: notes.trim(),
        photo_url: photoUrl,
        registration_status: 'APPROVED',
        auction_status: 'UNSOLD',
        sold_price: null,
        sold_team_id: null,
        auction_order: players.length + 1
      });
    }

    setIsModalOpen(false);
    setSaveToast(`Player "${name.trim()}" successfully ${editingPlayerId ? 'updated' : 'created'}! Changes are live across all public pages.`);
    setTimeout(() => setSaveToast(null), 5000);
  };

  // Handle CSV file selection for import
  const handleCsvFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const validCatNames = categories.map(c => c.name);
    const result = await validatePlayerImportCSV(text, players, validCatNames);

    setCsvPreviewRows(result.rows);
    setImportStats({ validCount: result.validCount, errorCount: result.errorCount });
    setIsImportModalOpen(true);
  };

  // Confirm CSV Import
  const handleConfirmImport = async () => {
    setImporting(true);
    const validPlayers = csvPreviewRows
      .filter(r => r.isValid && r.parsedPlayer)
      .map(r => r.parsedPlayer!);

    await importPlayersList(validPlayers);
    setImporting(false);
    setIsImportModalOpen(false);
    setCsvPreviewRows([]);
  };

  // Confirm Player Deletion
  const handleConfirmDelete = async () => {
    if (deletingPlayerId) {
      await deletePlayer(deletingPlayerId);
      setDeletingPlayerId(null);
    }
  };

  // Filtering
  const filteredPlayers = players.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
                          p.name.toLowerCase().includes(term) ||
                          p.player_code.toLowerCase().includes(term) ||
                          (p.academy && p.academy.toLowerCase().includes(term));
    const matchesCat = selectedCategoryFilter === 'ALL' ||
                       p.eligible_category_names?.some(c => c.toLowerCase() === selectedCategoryFilter.toLowerCase());
    const matchesStatus = selectedStatusFilter === 'ALL' ||
                          p.auction_status === selectedStatusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-sports tracking-wide">PLAYER ROSTER & ELIGIBILITY</h1>
          <p className="text-xs text-slate-400">Manage registered athletes, multiple category assignments, and 10 MB photo uploads</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* CSV Import input */}
          <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-gbl-navy-900 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md">
            <Upload className="w-4 h-4 text-sky-400" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleCsvFileSelect} className="hidden" />
          </label>

          {/* CSV Export */}
          <button
            onClick={() => exportPlayersCSV(players, teams)}
            className="px-3.5 py-2 rounded-xl bg-gbl-navy-900 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Add Player */}
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg shadow-gbl-orange-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Player</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveToast && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-xs text-emerald-300 shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{saveToast}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-gbl-navy-900 border border-gbl-navy-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by player name, academy, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-gbl-orange-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-gbl-navy-950 border border-gbl-navy-700 text-xs rounded-xl px-3 py-2 text-white focus:outline-none"
          >
            <option value="ALL">All Official Categories</option>
            {OFFICIAL_PLAYER_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-gbl-navy-950 border border-gbl-navy-700 text-xs rounded-xl px-3 py-2 text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNSOLD">Unsold</option>
            <option value="LIVE">Live Now</option>
            <option value="SOLD">Sold</option>
          </select>

          <span className="text-xs text-slate-400 font-semibold">
            {filteredPlayers.length} Players
          </span>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gbl-navy-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-gbl-navy-800">
              <tr>
                <th className="p-4">Player & Academy</th>
                <th className="p-4 text-center">Age / Gender</th>
                <th className="p-4">Eligible Categories</th>
                <th className="p-4 text-center">Auction Status</th>
                <th className="p-4 text-right">Sold Details</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gbl-navy-800 font-medium">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No players found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => {
                  const soldTeam = player.sold_team_id ? teamMap.get(player.sold_team_id) : null;

                  return (
                    <tr key={player.id} className="hover:bg-gbl-navy-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={player.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                            alt={player.name}
                            className="w-10 h-10 rounded-xl object-cover border border-gbl-navy-700 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-white block text-sm">{player.name}</span>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[10px] font-mono text-slate-400">{player.player_code}</span>
                              {player.mobile && parsePhoneNumber(player.mobile).digits && (
                                <span className="text-[10px] font-mono text-slate-400 bg-gbl-navy-900/80 px-1.5 py-0.5 rounded border border-gbl-navy-700/60">
                                  {parsePhoneNumber(player.mobile).countryCode} {parsePhoneNumber(player.mobile).digits}
                                </span>
                              )}
                              {player.academy && (
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/30">
                                  {player.academy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center text-slate-300">
                        {player.age} yrs • {player.gender}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {player.eligible_category_names.map((c) => (
                            <Badge key={c} variant="orange" size="sm">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          player.auction_status === 'SOLD' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          player.auction_status === 'LIVE' ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {player.auction_status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        {player.auction_status === 'SOLD' && soldTeam ? (
                          <div>
                            <span className="font-mono font-bold text-emerald-400 block text-xs">
                              {formatINR(player.sold_price)}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">
                              {soldTeam.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(player)}
                            className="p-1.5 rounded-lg bg-gbl-navy-950 hover:bg-gbl-navy-800 text-slate-300 hover:text-white transition-colors"
                            title="Edit player"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingPlayerId(player.id)}
                            className="p-1.5 rounded-lg bg-gbl-navy-950 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete player"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PLAYER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlayerId ? "EDIT PLAYER PROFILE" : "ADD NEW PLAYER"}
        subtitle="Configure athlete eligibility, categories, achievements, and 10 MB photo"
      >
        <form onSubmit={handleSavePlayer} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Age</label>
              <input
                type="number"
                min={10}
                max={85}
                required
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <PhoneInput
                value={mobile}
                onChange={(fullVal) => setMobile(fullVal)}
                label="Mobile Number (Private - 10 Digits)"
                variant="dark"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Academy / Club / Organization</label>
              <input
                type="text"
                value={academy}
                onChange={(e) => setAcademy(e.target.value)}
                placeholder="e.g. Sharavanas, Turbo, Captains..."
                list="academy-suggestions"
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
              <datalist id="academy-suggestions">
                <option value="Sharavanas" />
                <option value="Turbo" />
                <option value="Captains" />
                <option value="Union Club" />
                <option value="Jolly Friends" />
                <option value="Literary Association" />
                <option value="Sakthi" />
              </datalist>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">T-Shirt Size</label>
              <select
                value={tshirtSize}
                onChange={(e) => setTshirtSize(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="">Select Size (Optional)</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="3XL">3XL</option>
              </select>
            </div>
          </div>

          {/* Eligible Categories (Multi-select) */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Eligible Categories (Select all categories this player is qualified for):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {OFFICIAL_PLAYER_CATEGORIES.map((catName) => {
                const isSelected = selectedCategories.some(
                  c => c.toLowerCase().trim() === catName.toLowerCase().trim()
                );
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => toggleCategory(catName)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-gbl-orange-500/20 border-gbl-orange-500 text-white shadow-sm'
                        : 'bg-gbl-navy-950 border-gbl-navy-800 text-slate-400 hover:text-white hover:border-gbl-navy-700'
                    }`}
                  >
                    <span className="block truncate">{catName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Achievements / Bio</label>
            <textarea
              rows={2}
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              placeholder="e.g. State Ranking Gold Medalist 2024..."
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
            />
          </div>

          {/* Photo Upload with 10 MB Limit and Direct URL support */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold">
              Profile Photo (JPG, PNG, WEBP — up to 10 MB or Image URL)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gbl-navy-800 file:text-white hover:file:bg-gbl-navy-700 cursor-pointer"
                />
              </div>
              <div>
                <input
                  type="url"
                  placeholder="Or paste image URL (https://...)"
                  value={photoUrl || ''}
                  onChange={(e) => setPhotoUrl(e.target.value.trim() || null)}
                  className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-gbl-orange-500 focus:outline-none"
                />
              </div>
            </div>
            {uploading && <p className="text-[10px] text-gbl-orange-400">Compressing & uploading image...</p>}
            {photoUrl && (
              <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-gbl-navy-950 border border-gbl-navy-800">
                <div className="flex items-center gap-2.5">
                  <img src={photoUrl} alt="Preview" className="w-11 h-11 rounded-lg object-cover border border-gbl-navy-700" />
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold block">Photo Ready</span>
                    <span className="text-[9px] text-slate-400 font-mono truncate max-w-[200px] block">
                      {photoUrl.startsWith('data:') ? 'Custom Uploaded Image' : photoUrl}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 font-semibold"
                >
                  Remove Photo
                </button>
              </div>
            )}
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
              {editingPlayerId ? 'Save Changes' : 'Create Player'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV IMPORT PREVIEW MODAL (Section 60) */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="CSV PLAYER IMPORT PREVIEW"
        subtitle={`Previewing ${csvPreviewRows.length} rows (${importStats.validCount} Valid, ${importStats.errorCount} Errors)`}
        maxWidth="4xl"
      >
        <div className="space-y-4 text-xs">
          <div className="max-h-72 overflow-y-auto border border-gbl-navy-800 rounded-2xl divide-y divide-gbl-navy-800">
            {csvPreviewRows.map((row) => (
              <div
                key={row.rowNumber}
                className={`p-3 flex items-center justify-between gap-4 ${
                  row.isValid ? 'bg-gbl-navy-950' : 'bg-rose-950/20'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">Row #{row.rowNumber}</span>
                  <span className="font-bold text-white text-sm">
                    {row.parsedPlayer?.name || row.raw['Player Name'] || 'Unknown'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Age: {row.parsedPlayer?.age || row.raw['Age']} | Categories: {row.parsedPlayer?.eligible_category_names?.join(', ') || row.raw['Category']}
                  </p>
                </div>

                <div>
                  {row.isValid ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      Ready to Import
                    </span>
                  ) : (
                    <div className="text-right space-y-0.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                        Error
                      </span>
                      {row.errors.map((err, i) => (
                        <p key={i} className="text-[10px] text-rose-400">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gbl-navy-800">
            <span className="text-slate-400">
              {importStats.validCount} of {csvPreviewRows.length} records will be imported.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importStats.validCount === 0 || importing}
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white font-bold uppercase tracking-wider disabled:opacity-40"
              >
                {importing ? 'Importing...' : `Import ${importStats.validCount} Players`}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deletingPlayerId}
        onClose={() => setDeletingPlayerId(null)}
        title="CONFIRM PLAYER DELETION"
        subtitle="Are you sure you want to permanently remove this player from the roster?"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <p>
            This action will delete the player record and their auction statistics. This cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              onClick={() => setDeletingPlayerId(null)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider"
            >
              Delete Player
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
