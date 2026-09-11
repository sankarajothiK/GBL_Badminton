import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Undo2, 
  Edit3, 
  SkipForward, 
  AlertTriangle, 
  Tv, 
  Shield, 
  Users, 
  AlertCircle,
  ExternalLink,
  Volume2,
  Zap,
  Sparkles,
  Search,
  X,
  Check,
  Lock
} from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import { useTournament } from '../../contexts/TournamentContext';
import { formatINR, formatCompactINR } from '../../lib/currency';
import { calculateMaxLegalBid } from '../../lib/maxBid';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { TeamAllocationSummaryTable } from '../../components/admin/TeamAllocationSummaryTable';
import { Player, Category, Team, AuctionBid } from '../../types/database';

export const AdminAuction: React.FC = () => {
  const { 
    currentAuction, 
    currentPlayer, 
    currentCategory, 
    status, 
    timerSeconds, 
    isTimerRunning, 
    highestTeam, 
    bidHistory, 
    startAuction, 
    pauseAuction, 
    resumeAuction, 
    resetTimer, 
    placeBid, 
    placeQuickBid, 
    undoLastBid, 
    editCurrentBid, 
    markSoldManually, 
    markUnsoldManually, 
    cancelSold, 
    reAuctionPlayer, 
    selectNextPlayer,
    stagePlayer,
    lastActionMessage 
  } = useAuction();

  const { players, teams, categories, settings, releaseSoldPlayer } = useTournament();

  // Selection states
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [activeTeamId, setActiveTeamId] = useState<string>(teams[0]?.id || '');
  const [customBidAmount, setCustomBidAmount] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals for critical confirmations
  const [showCancelSoldModal, setShowCancelSoldModal] = useState(false);
  const [showEditBidModal, setShowEditBidModal] = useState(false);
  const [showRevertPlayerModal, setShowRevertPlayerModal] = useState(false);
  const [revertingPlayer, setRevertingPlayer] = useState(false);
  const [editBidAmount, setEditBidAmount] = useState<string>('');
  const [editBidTeamId, setEditBidTeamId] = useState<string>('');

  // Selected player object
  const chosenPlayer = players.find(p => p.id === selectedPlayerId) || currentPlayer || players.find(p => p.auction_status === 'UNSOLD');
  const soldTeam = chosenPlayer?.sold_team_id ? teams.find(t => t.id === chosenPlayer.sold_team_id) : null;
  const isPlayerAlreadySold = chosenPlayer?.auction_status === 'SOLD';

  // Normalizer for player codes (e.g. 'GBL 00025', 'gbl25', '25', '025' -> '25')
  const normalizePlayerCode = (val: string) => {
    return val.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^gbl0*/, '').replace(/^0+/, '');
  };

  // Instant player search results supporting ID formats & names
  const searchResults = useMemo(() => {
    if (!playerSearchQuery.trim()) {
      return players.filter(p => p.auction_status === 'UNSOLD').slice(0, 15);
    }
    const q = playerSearchQuery.trim().toLowerCase();
    const normQ = normalizePlayerCode(q);

    return players.filter(p => {
      if (p.name.toLowerCase().includes(q)) return true;
      if (p.player_code.toLowerCase().includes(q)) return true;
      const normP = normalizePlayerCode(p.player_code);
      if (normQ && (normP === normQ || normP.includes(normQ))) return true;
      if (p.academy && p.academy.toLowerCase().includes(q)) return true;
      return false;
    }).slice(0, 15);
  }, [playerSearchQuery, players]);

  const handleSelectSearchedPlayer = (player: Player) => {
    setSelectedPlayerId(player.id);
    const catName = (player.auction_category || 'NON-MEDALIST').replace('NON-MEDALLIST', 'NON-MEDALIST');
    setSelectedCategoryName(catName);
    setPlayerSearchQuery(`${player.player_code} - ${player.name}`);
    setIsSearchOpen(false);
    const cat = categories.find(c => c.name.toUpperCase() === catName.toUpperCase()) || categories[0];
    stagePlayer(player, cat);
  };
  
  // Category resolution: Auction Category determines default opening bid
  const playerAuctionCat = (chosenPlayer?.auction_category || 'NON-MEDALIST').replace('NON-MEDALLIST', 'NON-MEDALIST');
  const currentActiveCategory = categories.find(c => c.name.toUpperCase() === (selectedCategoryName || playerAuctionCat).toUpperCase()) 
    || categories.find(c => c.name.toUpperCase() === playerAuctionCat.toUpperCase())
    || categories[0];

  // Active Team object & Max Legal Bid Calculation (Section 10)
  const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0];
  const activeTeamSquad = players.filter(p => p.sold_team_id === activeTeam?.id);
  const maxBidInfo = activeTeam 
    ? calculateMaxLegalBid(activeTeam, activeTeamSquad.length, settings, currentCategory || currentActiveCategory)
    : null;

  // Round Bid History Sorting (default 'asc' for strict chronological order: 1st bid -> last) and Team Filter
  const [historySortOrder, setHistorySortOrder] = useState<'asc' | 'desc'>('asc');
  const [historyTeamFilter, setHistoryTeamFilter] = useState<string>('ALL');

  // Defensive deduplication of bids to strictly guarantee zero duplicate records in UI
  const deduplicatedBids = useMemo(() => {
    const seenIds = new Set<string>();
    const seenTuples = new Set<string>();
    const list: AuctionBid[] = [];
    for (const b of bidHistory) {
      if (!b || !b.id) continue;
      const tupleKey = `${b.auction_id || ''}_${b.team_id}_${b.amount}`;
      if (seenIds.has(b.id) || seenTuples.has(tupleKey)) continue;
      seenIds.add(b.id);
      seenTuples.add(tupleKey);
      list.push(b);
    }
    return list;
  }, [bidHistory]);

  // Chronologically sorted bids
  const sortedBids = useMemo(() => {
    return [...deduplicatedBids].sort((a, b) => {
      const tA = new Date(a.created_at).getTime() || 0;
      const tB = new Date(b.created_at).getTime() || 0;
      return historySortOrder === 'asc' ? tA - tB : tB - tA;
    });
  }, [deduplicatedBids, historySortOrder]);

  // Filtered bids (by active team or ALL)
  const displayedBids = useMemo(() => {
    if (historyTeamFilter === 'ALL') return sortedBids;
    return sortedBids.filter(b => b.team_id === historyTeamFilter);
  }, [sortedBids, historyTeamFilter]);

  // Find the highest active bid to highlight
  const highestActiveBidId = useMemo(() => {
    const active = deduplicatedBids.filter(b => !b.is_reverted);
    if (active.length === 0) return null;
    return [...active].sort((a, b) => b.amount - a.amount)[0]?.id || null;
  }, [deduplicatedBids]);

  // Handle Starting Auction
  const handleStartAuction = () => {
    setErrorMessage(null);
    if (!chosenPlayer) {
      setErrorMessage('Please select a player to auction.');
      return;
    }
    if (chosenPlayer.auction_status === 'SOLD') {
      setErrorMessage(`Cannot auction: ${chosenPlayer.name} is already SOLD to ${soldTeam?.name || 'another team'}. Please revert to Unsold first.`);
      return;
    }
    startAuction(chosenPlayer, currentActiveCategory);
  };

  // Handle Placing Quick Bids
  const handleQuickBid = (increment: number) => {
    setErrorMessage(null);
    if (!activeTeam) return;
    const res = placeQuickBid(activeTeam.id, increment);
    if (!res.success) {
      setErrorMessage(res.error || 'Bid rejected');
    }
  };

  // Handle Custom Bid Placement
  const handleCustomBid = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!activeTeam) return;
    const amt = parseFloat(customBidAmount.replace(/,/g, ''));
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid bid amount.');
      return;
    }
    const res = placeBid(activeTeam.id, amt, 'NORMAL');
    if (!res.success) {
      setErrorMessage(res.error || 'Bid rejected');
    } else {
      setCustomBidAmount('');
    }
  };

  // Handle Undo Last Bid
  const handleUndo = () => {
    setErrorMessage(null);
    const res = undoLastBid();
    if (!res.success) {
      setErrorMessage(res.error || 'Undo failed');
    }
  };

  // Handle Confirm Edit Bid
  const handleSaveEditBid = () => {
    setErrorMessage(null);
    const amt = parseFloat(editBidAmount.replace(/,/g, ''));
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Enter valid numeric amount.');
      return;
    }
    const targetTeamId = editBidTeamId || highestTeam?.id || teams[0]?.id;
    const res = editCurrentBid(amt, targetTeamId);
    setShowEditBidModal(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Edit bid failed');
    }
  };

  // Handle Confirm Cancel Sold
  const handleConfirmCancelSold = async () => {
    const res = await cancelSold();
    setShowCancelSoldModal(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Cancel SOLD failed');
    }
  };

  const isUrgent = timerSeconds <= 5 && isTimerRunning;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* TOP COMMAND BAR */}
      <div className="bg-gradient-to-r from-gbl-navy-900 via-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-700/60 p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gbl-orange-500/15 border border-gbl-orange-500/30 text-gbl-orange-400 flex items-center justify-center font-bold shadow-lg">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-sports tracking-wide uppercase">
                AUCTION MASTER CONSOLE
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gbl-orange-500/20 text-gbl-orange-400 border border-gbl-orange-500/40">
                ADMIN PRIVILEGES
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Synchronized 20s server timer engine • Projectors & team terminals updated in realtime
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Projector Launch Link */}
          <a
            href="/projector"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-sky-600/20 border border-sky-500/40 text-sky-400 hover:text-white hover:bg-sky-600 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
          >
            <Tv className="w-4 h-4" />
            <span>Launch Projector (1080p)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>

          {/* Realtime Status Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>SYNCED REALTIME</span>
          </div>
        </div>
      </div>

      {/* ACTION MESSAGE / ERROR ALERT BANNER */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/80 rounded-2xl flex items-center justify-between text-xs text-rose-200 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white font-black text-sm px-2">✕</button>
        </div>
      )}

      {lastActionMessage && !errorMessage && (
        <div className="p-3.5 bg-gbl-navy-900 border border-gbl-orange-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-gbl-orange-300 shadow-md">
          <Flame className="w-4 h-4 text-gbl-orange-400 shrink-0 animate-pulse" />
          <span className="font-semibold">{lastActionMessage}</span>
        </div>
      )}

      {/* 3-COLUMN MAIN STAGE (LEFT: PLAYER, CENTER: TIMER/BID, RIGHT: CONTROLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================================================================= */}
        {/* 1. LEFT COLUMN: PLAYER DETAILS & CATEGORY SELECTOR */}
        {/* ================================================================= */}
        <div className="lg:col-span-4 bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-700/60 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gbl-navy-800">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-gbl-orange-500" />
              <span>CURRENT LOT CANDIDATE</span>
            </h2>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              status === 'LIVE' ? 'bg-red-500 text-white animate-pulse' :
              status === 'SOLD' ? 'bg-emerald-500 text-white' :
              'bg-slate-800 text-slate-300'
            }`}>
              {status}
            </span>
          </div>

          {/* Instant Player ID / Name Search (No Forced Sequence!) */}
          {status !== 'LIVE' && (
            <div className="relative space-y-1.5">
              <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Search Player ID / Name:</span>
                <span className="text-[10px] text-amber-400 font-semibold">Instant Staging</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search Player ID (e.g. GBL 00025, 25) or Name..."
                  value={playerSearchQuery}
                  onChange={(e) => {
                    setPlayerSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full bg-gbl-navy-950 border border-gbl-navy-700 text-xs rounded-xl pl-10 pr-8 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-gbl-orange-500 font-medium"
                />
                {playerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlayerSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Search Dropdown */}
              {isSearchOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-gbl-navy-900 border border-gbl-navy-700 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-gbl-navy-800">
                  {searchResults.length === 0 ? (
                    <div className="p-3 text-center text-slate-500 text-xs">
                      {playerSearchQuery.trim() ? 'No matching player found.' : 'Type player ID or name.'}
                    </div>
                  ) : (
                    searchResults.map(p => {
                      const pSoldTeam = p.sold_team_id ? teams.find(t => t.id === p.sold_team_id) : null;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectSearchedPlayer(p)}
                          className="w-full p-2.5 text-left hover:bg-gbl-navy-800 flex items-center justify-between gap-2.5 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={p.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gbl-navy-700"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-white text-xs block truncate">{p.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">{p.player_code} • Age {p.age}</span>
                            </div>
                          </div>
                          {p.auction_status === 'SOLD' ? (
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 shrink-0">
                              SOLD {pSoldTeam ? `(${pSoldTeam.short_name})` : ''} • ₹{(p.sold_price || 0).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-500/20 text-yellow-300 border border-yellow-500/40 shrink-0">
                              {(p.auction_category || 'NON-MEDALIST').replace('NON-MEDALLIST', 'NON-MEDALIST')}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Player Photo & Information */}
          {chosenPlayer ? (
            <div className="space-y-4 pt-1">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gbl-navy-950 border border-gbl-navy-800 shadow-lg">
                <img
                  src={chosenPlayer.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                  alt={chosenPlayer.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md text-xs font-mono font-bold text-white border border-white/20">
                    {chosenPlayer.player_code}
                  </span>
                </div>
                {isPlayerAlreadySold && (
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-xl bg-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg">
                      SOLD
                    </span>
                  </div>
                )}
              </div>

              {/* Already Sold Warning Alert & Quick Revert Button */}
              {isPlayerAlreadySold && (
                <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/80 text-rose-200 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                      <span className="font-black uppercase tracking-wider text-xs text-white">PLAYER ALREADY SOLD</span>
                    </div>
                    <span className="text-xs font-black text-rose-300 font-mono">
                      {formatINR(chosenPlayer.sold_price || 0)}
                    </span>
                  </div>
                  <p className="text-xs text-rose-300">
                    Sold to <strong className="text-white">{soldTeam?.name || 'Assigned Team'}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRevertPlayerModal(true)}
                    className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-rose-600/30"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revert to Unsold &amp; Refund Team</span>
                  </button>
                </div>
              )}

              <div>
                <h3 className="text-2xl font-black text-white font-sports uppercase leading-tight">
                  {chosenPlayer.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  Age: {chosenPlayer.age} Yrs | Gender: {chosenPlayer.gender}
                  {chosenPlayer.academy && ` • ${chosenPlayer.academy}`}
                </p>
              </div>

              {/* Prominent Golden Auction Category Badge */}
              <div>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/25 via-yellow-400/35 to-amber-500/25 text-yellow-300 border border-yellow-500/60 shadow-lg shadow-yellow-500/15">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span>AUCTION CATEGORY: {chosenPlayer.auction_category || currentActiveCategory.name}</span>
                </span>
              </div>

              {/* Separate Eligible Categories Section */}
              <div className="space-y-1.5 bg-gbl-navy-950/80 p-3.5 rounded-2xl border border-gbl-navy-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Eligible Categories (Match Qualifications):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {chosenPlayer.eligible_category_names?.map(ec => (
                    <span key={ec} className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-950/80 text-sky-300 border border-sky-800/50">
                      {ec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Opening Bid Category Tier Selector */}
              <div className="space-y-2 bg-gbl-navy-950/80 p-3.5 rounded-2xl border border-gbl-navy-800">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Opening Bid Tier:
                  </label>
                  <span className="text-xs font-black text-emerald-400 font-mono">
                    {formatINR((currentActiveCategory.starting_bid && currentActiveCategory.starting_bid > 0) ? currentActiveCategory.starting_bid : 30000)}
                  </span>
                </div>
                <select
                  disabled={status === 'LIVE'}
                  value={selectedCategoryName || chosenPlayer.auction_category || currentCategory?.name || 'OPEN'}
                  onChange={(e) => setSelectedCategoryName(e.target.value)}
                  className="w-full bg-gbl-navy-900 border border-gbl-navy-700 text-xs font-bold rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gbl-orange-500 disabled:opacity-60"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name} (Starts at {formatINR((cat.starting_bid && cat.starting_bid > 0) ? cat.starting_bid : 30000)})
                    </option>
                  ))}
                </select>
              </div>

              {chosenPlayer.achievements && (
                <div className="text-xs text-slate-300 bg-gbl-navy-950/80 p-3.5 rounded-2xl border border-gbl-navy-800 leading-relaxed">
                  <span className="text-[10px] font-black text-amber-400 uppercase block mb-1">Career Achievements:</span>
                  {chosenPlayer.achievements}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No player selected.</p>
          )}
        </div>

        {/* ================================================================= */}
        {/* 2. CENTER COLUMN: 20-SECOND TIMER, CURRENT BID & LEADER */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Stage Display Card */}
          <div className={`p-6 sm:p-8 rounded-3xl border-2 shadow-2xl transition-all duration-300 ${
            isUrgent 
              ? 'bg-rose-950/50 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.3)] animate-pulse' 
              : 'bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border-gbl-navy-700/70'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-black tracking-widest text-slate-400 block">
                  CURRENT HIGHEST BID
                </span>
                <p className="text-4xl sm:text-5xl xl:text-6xl font-black text-emerald-400 font-mono tracking-tight mt-1 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  {formatINR(currentAuction?.current_bid || currentAuction?.starting_bid || currentActiveCategory?.starting_bid || 30000)}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Starting Bid: <strong className="text-white font-mono">{formatINR((currentAuction?.starting_bid && currentAuction.starting_bid > 0) ? currentAuction.starting_bid : ((currentActiveCategory?.starting_bid && currentActiveCategory.starting_bid > 0) ? currentActiveCategory.starting_bid : 30000))}</strong>
                </p>
              </div>

              {/* Synchronized 20s Timer Circle */}
              <div className="flex flex-col items-center">
                <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                  isUrgent
                    ? 'border-rose-500 bg-rose-500/25 text-rose-400 scale-110 shadow-lg shadow-rose-500/40'
                    : timerSeconds <= 10
                    ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-amber-500/20'
                    : 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-emerald-500/20'
                }`}>
                  <span className="text-4xl sm:text-5xl font-black font-mono leading-none">{timerSeconds}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest mt-1">SECONDS</span>
                </div>
              </div>
            </div>

            {/* Leading Team Banner */}
            <div className="mt-7 pt-6 border-t border-gbl-navy-800 flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                {highestTeam ? (
                  <>
                    {highestTeam.logo_url ? (
                      <div className="w-16 h-16 rounded-2xl bg-gbl-navy-950 border-2 border-gbl-orange-500/60 p-1.5 shadow-2xl shrink-0 flex items-center justify-center overflow-hidden">
                        <img src={highestTeam.logo_url} alt={highestTeam.name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-2xl shrink-0 border-2 border-white/20"
                        style={{ backgroundColor: highestTeam.team_color }}
                      >
                        {highestTeam.short_name}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-black tracking-widest text-gbl-orange-400 block">
                        CURRENT HIGHEST BIDDER
                      </span>
                      <h4 className="text-xl sm:text-2xl font-black text-white font-sports leading-tight truncate">{highestTeam.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Owner: <strong className="text-slate-200">{highestTeam.owner_name}</strong> • Wallet: <span className="font-mono text-emerald-400 font-bold">{formatINR(highestTeam.current_balance)}</span></p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gbl-navy-950 border border-gbl-navy-800 flex items-center justify-center text-slate-500">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Stage Status</span>
                      <h4 className="text-sm font-bold text-slate-300">Awaiting opening bid from team</h4>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Team Max Legal Bid Helper */}
          {maxBidInfo && (
            <div className="bg-gradient-to-r from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-700/60 p-4 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                {activeTeam.logo_url ? (
                  <div className="w-11 h-11 rounded-xl bg-gbl-navy-950 border border-gbl-navy-700 p-1 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={activeTeam.logo_url} alt={activeTeam.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-md shrink-0"
                    style={{ backgroundColor: activeTeam.team_color }}
                  >
                    {activeTeam.short_name}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Target Team: {activeTeam.name}</span>
                  <p className="text-xs font-bold text-white">
                    Wallet: <span className="font-mono text-emerald-400 font-bold">{formatINR(activeTeam.current_balance)}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-amber-400 uppercase font-black tracking-widest block">MAX LEGAL BID</span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {formatINR(maxBidInfo.maxLegalBid)}
                </span>
              </div>
            </div>
          )}

          {/* LIVE BID HISTORY STREAM */}
          <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-700/60 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gbl-orange-500" />
                <span>Round Bid History ({displayedBids.length}{historyTeamFilter !== 'ALL' ? `/${deduplicatedBids.length}` : ''})</span>
              </h3>
              
              <div className="flex items-center gap-2">
                {/* Team Quick Filter */}
                {activeTeam && (
                  <button
                    type="button"
                    onClick={() => setHistoryTeamFilter(prev => prev === 'ALL' ? activeTeam.id : 'ALL')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      historyTeamFilter === activeTeam.id
                        ? 'bg-gbl-orange-500/20 text-gbl-orange-400 border-gbl-orange-500/50'
                        : 'bg-gbl-navy-950 text-slate-400 border-gbl-navy-800 hover:text-white'
                    }`}
                    title={historyTeamFilter === activeTeam.id ? 'Showing only this team. Click to show all' : 'Click to filter bids for selected team'}
                  >
                    {historyTeamFilter === activeTeam.id ? `Filter: ${activeTeam.short_name}` : 'All Teams'}
                  </button>
                )}

                {/* Sort Order Toggle */}
                <button
                  type="button"
                  onClick={() => setHistorySortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white bg-gbl-navy-950 border border-gbl-navy-800 transition-colors"
                  title="Toggle Chronological (Oldest First) vs Newest First"
                >
                  {historySortOrder === 'asc' ? '⏱ Oldest First' : '⚡ Newest First'}
                </button>
              </div>
            </div>

            {displayedBids.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                {historyTeamFilter !== 'ALL' ? `No bids recorded yet for ${activeTeam?.name}.` : 'No bids recorded yet in this round.'}
              </p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {displayedBids.map((bid, i) => {
                  const isHighest = bid.id === highestActiveBidId;
                  const timeFormatted = bid.created_at
                    ? new Date(bid.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
                    : '';

                  // Compute genuine increment amount
                  const displayIncrement = bid.increment_amount !== undefined && bid.increment_amount > 0
                    ? bid.increment_amount
                    : (bid.bid_type === 'QUICK_10K' ? 10000 : bid.bid_type === 'QUICK_20K' ? 20000 : bid.bid_type === 'QUICK_50K' ? 50000 : 0);

                  return (
                    <div
                      key={bid.id}
                      className={`p-2.5 rounded-xl flex justify-between items-center text-xs border transition-all ${
                        bid.is_reverted
                          ? 'bg-rose-950/20 text-slate-500 line-through border-rose-900/30'
                          : isHighest
                          ? 'bg-gbl-orange-500/15 border-gbl-orange-500/50 text-white font-bold shadow-md shadow-gbl-orange-500/10'
                          : 'bg-gbl-navy-950 border-gbl-navy-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: bid.team_color || '#FF5E00' }} />
                        <span className="font-bold truncate max-w-[120px] sm:max-w-[150px]">{bid.team_name}</span>
                        
                        {/* Genuine Increment Amount Display */}
                        {displayIncrement > 0 && !bid.is_reverted && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-950/80 text-sky-400 border border-sky-800/40 shrink-0">
                            +{formatCompactINR(displayIncrement)}
                          </span>
                        )}

                        {bid.bid_type && bid.bid_type !== 'NORMAL' && !displayIncrement && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-gbl-navy-900 text-slate-400 uppercase shrink-0">
                            {bid.bid_type}
                          </span>
                        )}

                        {isHighest && !bid.is_reverted && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black uppercase shrink-0">
                            Highest
                          </span>
                        )}

                        {bid.is_reverted && (
                          <span className="text-[9px] text-rose-400 uppercase font-bold shrink-0">(Reverted)</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {timeFormatted && (
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
                            {timeFormatted}
                          </span>
                        )}
                        <span className="font-mono font-bold text-emerald-400">{formatINR(bid.amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ================================================================= */}
        {/* 3. RIGHT COLUMN: AUCTION ENGINE CONTROLS */}
        {/* ================================================================= */}
        <div className="lg:col-span-3 bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-700/60 rounded-3xl p-6 shadow-2xl space-y-5">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-300 pb-3 border-b border-gbl-navy-800">
            ENGINE CONTROLS
          </h2>

          {/* Primary Action: START / PAUSE / RESUME */}
          {status !== 'LIVE' && status !== 'PAUSED' ? (
            isPlayerAlreadySold ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full py-4 rounded-2xl bg-slate-800 text-slate-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-not-allowed opacity-80"
                  title="Player is already SOLD. Please revert first to auction again."
                >
                  <Lock className="w-4 h-4" />
                  <span>CANNOT AUCTION (ALREADY SOLD)</span>
                </button>
                <p className="text-[11px] text-amber-400 text-center font-semibold">
                  Player belongs to {soldTeam?.name || 'a team'}. Use "Revert to Unsold" to release.
                </p>
              </div>
            ) : (
              <button
                onClick={handleStartAuction}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START AUCTION</span>
              </button>
            )
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {isTimerRunning ? (
                <button
                  onClick={pauseAuction}
                  className="py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <Pause className="w-4 h-4" />
                  <span>PAUSE</span>
                </button>
              ) : (
                <button
                  onClick={resumeAuction}
                  className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>RESUME</span>
                </button>
              )}

              <button
                onClick={resetTimer}
                className="py-3 rounded-xl bg-gbl-navy-950 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RESET 20s</span>
              </button>
            </div>
          )}

          {/* MANUAL SOLD & UNSOLD BUTTONS */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-gbl-navy-800">
            <button
              onClick={markSoldManually}
              disabled={!currentAuction || !highestTeam || currentAuction.current_bid <= 0 || status !== 'LIVE'}
              className="py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>HAMMER SOLD</span>
            </button>

            <button
              onClick={markUnsoldManually}
              disabled={!currentAuction || status !== 'LIVE'}
              className="py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/20"
            >
              <XCircle className="w-4 h-4" />
              <span>PASS UNSOLD</span>
            </button>
          </div>

          {/* DANGEROUS / CORRECTION CONTROLS */}
          <div className="space-y-2 pt-2 border-t border-gbl-navy-800">
            {/* Undo Last Bid */}
            <button
              onClick={handleUndo}
              disabled={bidHistory.filter(b => !b.is_reverted).length === 0}
              className="w-full py-2.5 rounded-xl bg-gbl-navy-950 hover:bg-gbl-navy-800 disabled:opacity-30 border border-gbl-navy-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              <span>Undo Last Bid</span>
            </button>

            {/* Edit Current Bid */}
            <button
              onClick={() => {
                setEditBidAmount(String(currentAuction?.current_bid || ''));
                setShowEditBidModal(true);
              }}
              disabled={!currentAuction || currentAuction.current_bid <= 0}
              className="w-full py-2.5 rounded-xl bg-gbl-navy-950 hover:bg-gbl-navy-800 disabled:opacity-30 border border-gbl-navy-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Current Bid</span>
            </button>

            {/* Cancel SOLD */}
            {status === 'SOLD' && (
              <button
                onClick={() => setShowCancelSoldModal(true)}
                className="w-full py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Cancel SOLD Transaction</span>
              </button>
            )}

            {/* Re-Auction Player */}
            {(status === 'UNSOLD' || status === 'CANCELLED') && (
              <button
                onClick={reAuctionPlayer}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Re-Auction Player</span>
              </button>
            )}

            {/* Call Next Player */}
            <button
              onClick={selectNextPlayer}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <SkipForward className="w-4 h-4" />
              <span>Call Next Lot</span>
            </button>
          </div>

        </div>

      </div>

      {/* ================================================================= */}
      {/* 4. BOTTOM BAR: DYNAMIC OPERATOR TEAM CONSOLE */}
      {/* ================================================================= */}
      <div className="bg-gradient-to-b from-gbl-navy-900 via-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-700/70 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gbl-navy-800">
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white flex items-center gap-2 font-sports">
              <Shield className="w-4 h-4 text-gbl-orange-500" />
              <span>AUCTION OPERATOR BIDDING CONSOLE ({teams.length} TEAMS)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click any team card to place their next legal bid instantly or select as the active quick-bid target
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="text-slate-400">Target Team:</span>
            <span className="px-3 py-1 rounded-xl bg-gbl-orange-500/20 border border-gbl-orange-500/50 text-gbl-orange-300 font-black text-xs uppercase tracking-wider">
              {activeTeam?.name || 'Select Team'}
            </span>
          </div>
        </div>

        {/* Dynamic & Spacious Team Grid (Responsive for 12+ teams) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3.5 sm:gap-4">
          {teams.map((t) => {
            const isSelected = t.id === activeTeamId;
            const isLeader = t.id === highestTeam?.id;
            const squadCount = players.filter(p => p.sold_team_id === t.id).length;
            const totalSlots = t.total_squad_slots || 6;
            const isLocked = squadCount >= totalSlots;

            // Calculate next bid for this team
            const currentBid = currentAuction?.current_bid || 0;
            const minInc = currentCategory?.min_bid_increment || 10000;
            const startBid = (currentAuction?.starting_bid && currentAuction.starting_bid > 0) ? currentAuction.starting_bid : 30000;
            const nextBidAmount = currentBid > 0 ? currentBid + minInc : startBid;

            const maxLegalCalc = calculateMaxLegalBid(t, squadCount, settings, currentCategory || currentActiveCategory);
            const canAffordNextBid = maxLegalCalc.isEligibleToBid && nextBidAmount <= maxLegalCalc.maxLegalBid && nextBidAmount <= t.current_balance;

            return (
              <div
                key={t.id}
                onClick={() => {
                  if (!isLocked) {
                    setActiveTeamId(t.id);
                    setErrorMessage(null);
                  }
                }}
                className={`relative rounded-2xl border-2 transition-all p-4 flex flex-col justify-between cursor-pointer select-none min-h-[195px] ${
                  isLeader
                    ? 'bg-gradient-to-b from-emerald-950/90 via-gbl-navy-950 to-emerald-950/60 border-emerald-400 ring-4 ring-emerald-500/30 shadow-2xl shadow-emerald-500/20 scale-[1.02]'
                    : isSelected
                    ? 'bg-gradient-to-b from-amber-950/60 via-gbl-navy-950 to-gbl-navy-900 border-amber-400 ring-4 ring-amber-500/30 shadow-xl'
                    : isLocked
                    ? 'bg-slate-950/70 border-slate-800 opacity-40 cursor-not-allowed'
                    : 'bg-gradient-to-b from-gbl-navy-900/90 to-gbl-navy-950 border-gbl-navy-700/80 hover:border-slate-400 hover:shadow-lg'
                }`}
              >
                {/* Top Badge Indicators */}
                {isLocked ? (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider shadow">
                    FULL (6/6)
                  </span>
                ) : isLeader ? (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow animate-pulse flex items-center gap-1">
                    <span>👑 LEADER</span>
                  </span>
                ) : (
                  <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded text-slate-400 text-[9px] font-mono font-bold">
                    #{t.team_number}
                  </span>
                )}

                {/* Team Info Header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    {t.logo_url ? (
                      <div className="w-11 h-11 rounded-xl bg-gbl-navy-950 border border-gbl-navy-700 p-0.5 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
                        <img src={t.logo_url} alt={t.name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div 
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-md shrink-0 border border-white/20"
                        style={{ backgroundColor: t.team_color }}
                      >
                        {t.short_name}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 pr-12">
                      <h3 className="text-sm sm:text-base font-black text-white leading-tight tracking-tight line-clamp-2">
                        {t.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 truncate">Owner: {t.owner_name || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Team Financial & Squad Metrics */}
                  <div className="pt-2 border-t border-gbl-navy-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Available:</span>
                      <strong className="font-mono text-emerald-400 font-black text-xs sm:text-sm">
                        {formatINR(t.current_balance)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Squad Slots:</span>
                      <span className="font-mono text-slate-200 font-bold">{squadCount} / {totalSlots} Filled</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bidding Action Controls */}
                <div className="pt-3 mt-1">
                  {status === 'LIVE' ? (
                    isLeader ? (
                      <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1 shadow-inner">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>CURRENT HIGHEST</span>
                      </div>
                    ) : canAffordNextBid ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTeamId(t.id);
                          setErrorMessage(null);
                          const res = placeBid(t.id, nextBidAmount);
                          if (!res.success) {
                            setErrorMessage(res.error || 'Bid rejected');
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>BID {formatINR(nextBidAmount)}</span>
                      </button>
                    ) : (
                      <div className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 font-bold text-[10px] uppercase text-center">
                        <span>{isLocked ? 'Squad Full' : nextBidAmount > t.current_balance ? 'Insufficient Points' : 'Max Bid Limit'}</span>
                      </div>
                    )
                  ) : (
                    <div className={`w-full py-2 rounded-xl border text-[10px] font-black uppercase text-center transition-colors ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-gbl-navy-950/80 border-gbl-navy-800 text-slate-400'
                    }`}>
                      <span>{isSelected ? '✓ Selected Target' : 'Select Team'}</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Quick Bid Increment Buttons (+10k, +20k, +50k) & Custom Bid Form */}
        <div className="pt-4 border-t border-gbl-navy-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-300 shrink-0">
              Quick Increments for {activeTeam?.short_name || 'Active Team'}:
            </span>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => handleQuickBid(10000)}
                disabled={status !== 'LIVE'}
                className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-b from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-mono font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95 border border-sky-400/30"
              >
                +₹10,000
              </button>
              <button
                onClick={() => handleQuickBid(20000)}
                disabled={status !== 'LIVE'}
                className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-mono font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95 border border-amber-400/30"
              >
                +₹20,000
              </button>
              <button
                onClick={() => handleQuickBid(50000)}
                disabled={status !== 'LIVE'}
                className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-b from-gbl-orange-500 to-gbl-orange-700 hover:from-gbl-orange-400 hover:to-gbl-orange-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-mono font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95 border border-gbl-orange-400/30"
              >
                +₹50,000
              </button>
            </div>
          </div>

          {/* Custom Bid Input */}
          <form onSubmit={handleCustomBid} className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-52">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-bold">₹</span>
              <input
                type="number"
                placeholder="Custom Amount"
                value={customBidAmount}
                onChange={(e) => setCustomBidAmount(e.target.value)}
                disabled={status !== 'LIVE'}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl pl-8 pr-3 py-2.5 text-xs sm:text-sm text-white font-mono focus:border-gbl-orange-500 focus:outline-none disabled:opacity-40"
              />
            </div>
            <button
              type="submit"
              disabled={status !== 'LIVE'}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-md shrink-0"
            >
              Place Bid
            </button>
          </form>
        </div>

      </div>

      {/* 5. TEAM POINTS & OWNER ALLOCATION SUMMARY */}
      <TeamAllocationSummaryTable
        highlightTeamId={activeTeamId}
        onSelectTeam={setActiveTeamId}
      />
      <Modal
        isOpen={showCancelSoldModal}
        onClose={() => setShowCancelSoldModal(false)}
        title="CONFIRM CANCEL SOLD TRANSACTION"
        subtitle="Dangerous Action: Reverts points to team and resets player status"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <p>
            Are you sure you want to cancel the sold status for <strong className="text-white">{currentPlayer?.name}</strong>?
          </p>
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-1 text-rose-300">
            <p>• <strong>{formatINR(currentAuction?.current_bid)}</strong> will be refunded to <strong>{highestTeam?.name}</strong>.</p>
            <p>• Player will be removed from team squad and marked UNSOLD.</p>
            <p>• Cancellation action will be recorded in immutable audit logs.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              onClick={() => setShowCancelSoldModal(false)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmCancelSold}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider"
            >
              Yes, Cancel SOLD
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: EDIT CURRENT BID */}
      <Modal
        isOpen={showEditBidModal}
        onClose={() => setShowEditBidModal(false)}
        title="EDIT CURRENT AUCTION BID"
        subtitle="Admin correction for mistaken bid amounts"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">New Bid Amount (₹)</label>
            <input
              type="number"
              value={editBidAmount}
              onChange={(e) => setEditBidAmount(e.target.value)}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Winning Team</label>
            <select
              value={editBidTeamId || highestTeam?.id || teams[0]?.id}
              onChange={(e) => setEditBidTeamId(e.target.value)}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <p className="text-slate-400">
            Action will be logged with timestamp: "Bid edited by Admin".
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              onClick={() => setShowEditBidModal(false)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEditBid}
              className="px-5 py-2 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white font-bold uppercase tracking-wider"
            >
              Apply Correction
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: REVERT SOLD PLAYER TO UNSOLD */}
      <Modal
        isOpen={showRevertPlayerModal}
        onClose={() => setShowRevertPlayerModal(false)}
        title="REVERT PLAYER TO UNSOLD"
        subtitle="Release player back into auction pool and refund purchasing team"
      >
        {chosenPlayer && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl text-rose-200 space-y-2">
              <p className="font-bold text-sm">
                Release <span className="text-white underline font-black">{chosenPlayer.name}</span>?
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-rose-300">
                <li>Player auction status will be set back to <strong className="text-white">UNSOLD</strong>.</li>
                <li><strong className="text-white font-mono">{formatINR(chosenPlayer.sold_price || 0)}</strong> will be refunded to <strong className="text-white">{soldTeam?.name || 'purchasing team'}</strong>.</li>
                <li>Team's total spent will decrease accordingly.</li>
                <li>Player will be ready to auction again immediately.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
              <button
                type="button"
                disabled={revertingPlayer}
                onClick={() => setShowRevertPlayerModal(false)}
                className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 font-bold hover:bg-gbl-navy-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revertingPlayer}
                onClick={async () => {
                  setRevertingPlayer(true);
                  const res = await releaseSoldPlayer(chosenPlayer.id);
                  setRevertingPlayer(false);
                  setShowRevertPlayerModal(false);
                  if (!res.success) {
                    setErrorMessage(res.message);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black uppercase tracking-wider transition-colors shadow-lg shadow-rose-600/30"
              >
                {revertingPlayer ? 'Reverting...' : 'Confirm Revert & Refund'}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

