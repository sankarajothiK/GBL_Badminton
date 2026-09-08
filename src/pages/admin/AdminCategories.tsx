import React, { useState } from 'react';
import { Layers, Edit2, Plus, Check, Trash2, Shield, AlertCircle } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { Category } from '../../types/database';
import { formatINR } from '../../lib/currency';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const AdminCategories: React.FC = () => {
  const { categories, createCategory, updateCategory, deleteCategory } = useTournament();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startingBid, setStartingBid] = useState(0);
  const [baseReservePoints, setBaseReservePoints] = useState(0);
  const [minBidIncrement, setMinBidIncrement] = useState(10000);
  const [ownerDeduction, setOwnerDeduction] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');

  const openEdit = (cat: Category) => {
    setIsNew(false);
    setEditingCategory(cat);
    setName(cat.name);
    setCode(cat.code);
    setStartingBid(cat.starting_bid);
    setBaseReservePoints(cat.base_reserve_points);
    setMinBidIncrement(cat.min_bid_increment);
    setOwnerDeduction(cat.owner_deduction || 0);
    setIsActive(cat.is_active);
    setDescription(cat.description || '');
  };

  const openAdd = () => {
    setIsNew(true);
    setEditingCategory({} as Category);
    setName('');
    setCode('');
    setStartingBid(0);
    setBaseReservePoints(0);
    setMinBidIncrement(5000);
    setOwnerDeduction(0);
    setIsActive(true);
    setDescription('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    if (isNew) {
      await createCategory({
        tournament_id: '00000000-0000-0000-0000-000000000001',
        name: name.trim(),
        code: code.trim().toUpperCase(),
        starting_bid: Number(startingBid),
        base_reserve_points: Number(baseReservePoints),
        min_bid_increment: Number(minBidIncrement),
        owner_deduction: Number(ownerDeduction),
        is_active: isActive,
        sort_order: categories.length + 1,
        description: description.trim()
      });
    } else if (editingCategory?.id) {
      await updateCategory(editingCategory.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        starting_bid: Number(startingBid),
        base_reserve_points: Number(baseReservePoints),
        min_bid_increment: Number(minBidIncrement),
        owner_deduction: Number(ownerDeduction),
        is_active: isActive,
        description: description.trim()
      });
    }

    setEditingCategory(null);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-sports tracking-wide">
            CATEGORY BIDDING SETTINGS
          </h1>
          <p className="text-xs text-slate-400">
            Configure starting bids, base/reserve points, and bid increments for auction bidding categories (Open, 35+, and Non-Medalist)
          </p>
        </div>

        <button
          onClick={openAdd}
          className="px-4 py-2.5 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start">
                <Badge variant="orange" size="md">{cat.code}</Badge>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    cat.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {cat.is_active ? 'Active' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg bg-gbl-navy-950 hover:bg-gbl-navy-800 text-slate-300 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mt-3">{cat.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cat.description || 'Competition category'}</p>
            </div>

            {/* Bidding Settings Grid */}
            <div className="space-y-2 pt-3 border-t border-gbl-navy-800 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Starting Bid:</span>
                <span className="font-mono font-bold text-gbl-orange-400">{formatINR(cat.starting_bid)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Base / Reserve:</span>
                <span className="font-mono font-bold text-white">{formatINR(cat.base_reserve_points)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Min Bid Increment:</span>
                <span className="font-mono font-bold text-emerald-400">+{formatINR(cat.min_bid_increment)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Owner Deduction:</span>
                <span className="font-mono font-bold text-amber-400">{formatINR(cat.owner_deduction)}</span>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* EDIT / CREATE CATEGORY MODAL */}
      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title={isNew ? "CREATE CATEGORY" : `EDIT ${editingCategory?.name || 'CATEGORY'}`}
        subtitle="Configure starting bids, base reserve, and minimum increment"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Code / Short Tag</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Starting Bid (₹)</label>
              <input
                type="number"
                min={0}
                required
                value={startingBid}
                onChange={(e) => setStartingBid(Number(e.target.value))}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Base / Reserve Points (₹)</label>
              <input
                type="number"
                min={0}
                required
                value={baseReservePoints}
                onChange={(e) => setBaseReservePoints(Number(e.target.value))}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Minimum Bid Increment (₹)</label>
              <input
                type="number"
                min={1000}
                required
                value={minBidIncrement}
                onChange={(e) => setMinBidIncrement(Number(e.target.value))}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Owner Deduction Allowance (₹)</label>
              <input
                type="number"
                min={0}
                value={ownerDeduction}
                onChange={(e) => setOwnerDeduction(Number(e.target.value))}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-gbl-orange-600 focus:ring-0 bg-gbl-navy-950 border-gbl-navy-700"
            />
            <label htmlFor="isActiveCheck" className="text-slate-300 font-semibold">
              Category Active for Auction & Eligibility
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white font-bold uppercase tracking-wider"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
