import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, CheckCircle2, CircleDashed, Sparkles, Filter } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { AUCTION_CATEGORIES, ELIGIBLE_CATEGORIES } from '../../types/database';
import { formatINR } from '../../lib/currency';

export const PlayersPage: React.FC = () => {
  const { players, teams } = useTournament();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuctionCat, setSelectedAuctionCat] = useState<string>('ALL');
  const [selectedEligibleCat, setSelectedEligibleCat] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const teamMap = new Map(teams.map(t => [t.id, t]));

  // Normalizer for player codes (e.g. GBL 00025, gbl-25, 25)
  const normalizeCode = (val: string) => val.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^gbl0*/, '').replace(/^0+/, '');

  // Filtering by Name, Code, Academy, Auction Category, Eligible Category, and Status
  const filteredPlayers = players.filter(player => {
    const rawTerm = searchTerm.toLowerCase().trim();
    const cleanTerm = normalizeCode(searchTerm);
    const cleanPlayerCode = normalizeCode(player.player_code);

    const matchesSearch = !rawTerm ||
                          player.name.toLowerCase().includes(rawTerm) ||
                          player.player_code.toLowerCase().includes(rawTerm) ||
                          cleanPlayerCode.includes(cleanTerm) ||
                          (player.academy && player.academy.toLowerCase().includes(rawTerm));

    const playerAuctionCat = (player.auction_category || 'NON-MEDALIST').replace('NON-MEDALLIST', 'NON-MEDALIST');
    const matchesAuctionCategory = selectedAuctionCat === 'ALL' ||
                                   playerAuctionCat === selectedAuctionCat ||
                                   (selectedAuctionCat === 'NON-MEDALIST' && (player.auction_category === 'NON-MEDALLIST' || playerAuctionCat === 'NON-MEDALIST'));

    const matchesEligibleCategory = selectedEligibleCat === 'ALL' ||
                                    player.eligible_category_names?.some(c => c.toLowerCase() === selectedEligibleCat.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' ||
                          player.auction_status === selectedStatus;

    return matchesSearch && matchesAuctionCategory && matchesEligibleCategory && matchesStatus;
  });

  const soldCount = players.filter(p => p.auction_status === 'SOLD').length;
  const unsoldCount = players.filter(p => p.auction_status === 'UNSOLD').length;

  const openCount = players.filter(p => (p.auction_category || 'NON-MEDALIST') === 'OPEN').length;
  const nonMedalCount = players.filter(p => {
    const cat = p.auction_category || 'NON-MEDALIST';
    return cat === 'NON-MEDALIST' || cat === 'NON-MEDALLIST';
  }).length;
  const age35Count = players.filter(p => (p.auction_category || 'NON-MEDALIST') === '35+ AGE').length;

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-6 text-slate-950">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-[#122023] px-6 py-6 sm:px-8 sm:py-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
        <div className="text-left max-w-2xl">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.23em] text-lime-300">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
            Tournament Roster Pool
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-[-0.05em]">
            Registered Players Pool
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            Explore shuttlers registered for the Gulf Oil Badminton Premier League 2026 auction. Filter by Auction Category (OPEN, NON-MEDALIST, 35+ AGE) or player eligibility.
          </p>
        </div>

        {/* Quick Counter Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-lime-300" />
            <span className="text-slate-400">Total:</span>
            <strong className="text-white font-mono">{players.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Sold:</span>
            <strong className="text-emerald-400 font-mono">{soldCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-1.5">
            <CircleDashed className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Available:</span>
            <strong className="text-amber-400 font-mono">{unsoldCount}</strong>
          </div>
        </div>
      </div>

      {/* Auction Category Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Auction Category:
        </span>
        <button
          onClick={() => setSelectedAuctionCat('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedAuctionCat === 'ALL'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({players.length})
        </button>
        <button
          onClick={() => setSelectedAuctionCat('OPEN')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedAuctionCat === 'OPEN'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black shadow-md border border-amber-400'
              : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          ★ OPEN ({openCount})
        </button>
        <button
          onClick={() => setSelectedAuctionCat('NON-MEDALIST')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedAuctionCat === 'NON-MEDALIST'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black shadow-md border border-amber-400'
              : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          ★ NON-MEDALIST ({nonMedalCount})
        </button>
        <button
          onClick={() => setSelectedAuctionCat('35+ AGE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedAuctionCat === '35+ AGE'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black shadow-md border border-amber-400'
              : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          ★ 35+ AGE ({age35Count})
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, academy, or ID (e.g. 25, GBL 00025)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-950 placeholder-slate-400 focus:border-slate-900 focus:outline-none transition-colors"
          />
        </div>

        {/* Category & Status Selectors */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
          {/* Eligible Categories Filter */}
          <select
            value={selectedEligibleCat}
            onChange={(e) => setSelectedEligibleCat(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-slate-900 focus:outline-none font-medium"
          >
            <option value="ALL">All Eligible Categories</option>
            {ELIGIBLE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>Eligible: {cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-slate-900 focus:outline-none font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="UNSOLD">Available</option>
            <option value="LIVE">Live Auction</option>
            <option value="SOLD">Sold</option>
          </select>
        </div>
      </div>

      {/* Players Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No players matching criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search query or adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredPlayers.map((player) => {
            const soldTeam = player.sold_team_id ? teamMap.get(player.sold_team_id) : null;
            const playerAuctionCategory = (player.auction_category || 'NON-MEDALIST').replace('NON-MEDALLIST', 'NON-MEDALIST');

            return (
              <Link
                key={player.id}
                to={`/players/${player.id}`}
                className="group relative bg-white border border-slate-200 hover:border-slate-400 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between text-left"
              >
                <div>
                  {/* Photo Container */}
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={player.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                      alt={player.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Status Pill */}
                    <div className="absolute top-2.5 right-2.5">
                      {player.auction_status === 'SOLD' ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
                          SOLD
                        </span>
                      ) : player.auction_status === 'LIVE' ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-sm animate-pulse">
                          LIVE
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-white">
                          AVAILABLE
                        </span>
                      )}
                    </div>

                    {/* Player Code Badge */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[11px] font-mono font-bold text-white border border-white/20">
                        {player.player_code}
                      </span>
                    </div>
                  </div>

                  {/* Player Content Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-base font-black text-slate-950 group-hover:text-slate-700 transition-colors leading-snug">
                        {player.name}
                      </h3>
                      
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-semibold">
                          Age: {player.age} yrs • {player.gender}
                        </span>
                        {player.academy && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-200 truncate max-w-[130px]">
                            {player.academy}
                          </span>
                        )}
                      </div>

                      {/* Golden Highlight Auction Category Badge */}
                      <div className="mt-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 text-yellow-900 border border-yellow-500/60 shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
                          <span>[ {playerAuctionCategory} ]</span>
                        </span>
                      </div>

                      {/* Separate Line for Eligible Categories */}
                      <div className="mt-3 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Eligible Categories:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {player.eligible_category_names && player.eligible_category_names.length > 0 ? (
                            player.eligible_category_names.map((catName) => (
                              <span 
                                key={catName}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200"
                              >
                                {catName}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">None specified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Row: Sold Price or Base Details */}
                <div className="p-4 pt-3 border-t border-slate-100 mt-2">
                  {player.auction_status === 'SOLD' ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {soldTeam?.logo_url ? (
                          <img src={soldTeam.logo_url} alt={soldTeam.name} className="w-5 h-5 rounded-full object-contain bg-slate-100 p-0.5 shrink-0" />
                        ) : (
                          <span 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                            style={{ backgroundColor: soldTeam?.team_color || '#10B981' }}
                          >
                            {soldTeam?.short_name || 'SOLD'}
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[110px]">
                          {soldTeam?.name || 'Sold in Auction'}
                        </span>
                      </div>
                      <span className="font-mono font-black text-emerald-600 text-xs">
                        {formatINR(player.sold_price || 0)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Pool:</span>
                      <span className="font-bold text-slate-900">Available</span>
                    </div>
                  )}
                </div>

              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
};
