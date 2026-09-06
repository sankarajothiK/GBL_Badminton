import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import { useTournament } from '../../contexts/TournamentContext';
import { formatINR, formatCompactINR } from '../../lib/currency';
import { calculateMaxLegalBid } from '../../lib/maxBid';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { TeamAllocationSummaryTable } from '../../components/admin/TeamAllocationSummaryTable';
import { Player, Category, Team } from '../../types/database';

export const AdminAuction: React.FC = () => {
  const { 
    currentAuction, 
    currentPlayer, 
    currentCategory, 
    highestTeam, 
    timerSeconds, 
    isTimerRunning, 
    status, 
    bidHistory,
    lastActionMessage,
    startAuction, 
    placeBid, 
    placeQuickBid, 
    pauseAuction, 
    resumeAuction, 
    resetTimer, 
    markSoldManually, 
    markUnsoldManually, 
    undoLastBid, 
    editCurrentBid, 
    cancelSold, 
    reAuctionPlayer, 
    selectNextPlayer 
  } = useAuction();

  const { players, teams, categories, settings } = useTournament();

  // Selection states
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [activeTeamId, setActiveTeamId] = useState<string>(teams[0]?.id || '');
  const [customBidAmount, setCustomBidAmount] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals for critical confirmations
  const [showCancelSoldModal, setShowCancelSoldModal] = useState(false);
  const [showEditBidModal, setShowEditBidModal] = useState(false);
  const [editBidAmount, setEditBidAmount] = useState<string>('');
  const [editBidTeamId, setEditBidTeamId] = useState<string>('');

  // Selected player object
  const chosenPlayer = players.find(p => p.id === selectedPlayerId) || currentPlayer || players.find(p => p.auction_status === 'UNSOLD');
  
  // Section 50: Only allow categories for which the player is eligible!
  const eligibleCategories = chosenPlayer
    ? categories.filter(c => chosenPlayer.eligible_category_names.some(ec => ec.toLowerCase() === c.name.toLowerCase()))
    : categories;

  const currentActiveCategory = categories.find(c => c.name.toLowerCase() === selectedCategoryName.toLowerCase()) || eligibleCategories[0] || categories[0];

  // Active Team object & Max Legal Bid Calculation (Section 10)
  const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0];
  const activeTeamSquad = players.filter(p => p.sold_team_id === activeTeam?.id);
  const maxBidInfo = activeTeam 
    ? calculateMaxLegalBid(activeTeam, activeTeamSquad.length, settings, currentCategory || currentActiveCategory)
    : null;

  // Handle Starting Auction
  const handleStartAuction = () => {
    setErrorMessage(null);
    if (!chosenPlayer) {
      setErrorMessage('Please select a player to auction.');
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
  const handleConfirmCancelSold = () => {
    const res = cancelSold();
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

          {/* Quick Player Switcher if not Live */}
          {status !== 'LIVE' && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Player for Auction:</label>
              <select
                value={selectedPlayerId || (chosenPlayer?.id || '')}
                onChange={(e) => {
                  setSelectedPlayerId(e.target.value);
                  const p = players.find(x => x.id === e.target.value);
                  if (p && p.eligible_category_names.length > 0) {
                    setSelectedCategoryName(p.eligible_category_names[0]);
                  }
                }}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 text-xs rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-gbl-orange-500 font-medium"
              >
                {players.filter(p => p.auction_status === 'UNSOLD').map(p => (
                  <option key={p.id} value={p.id}>{p.player_code} - {p.name} ({p.eligible_category_names.join(', ')})</option>
                ))}
              </select>
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
              </div>

              <div>
                <h3 className="text-2xl font-black text-white font-sports uppercase leading-tight">
                  {chosenPlayer.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  Age: {chosenPlayer.age} Yrs | Gender: {chosenPlayer.gender}
                </p>
              </div>

              {/* Category selection */}
              <div className="space-y-2 bg-gbl-navy-950/80 p-4 rounded-2xl border border-gbl-navy-800">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Auction Category (Eligible Tiers Only):
                </label>
                <select
                  disabled={status === 'LIVE'}
                  value={selectedCategoryName || currentCategory?.name || eligibleCategories[0]?.name || ''}
                  onChange={(e) => setSelectedCategoryName(e.target.value)}
                  className="w-full bg-gbl-navy-900 border border-gbl-navy-700 text-xs font-bold rounded-xl px-3.5 py-2 text-gbl-orange-400 focus:outline-none focus:border-gbl-orange-500 disabled:opacity-60"
                >
                  {eligibleCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name} (Starts at {formatINR(cat.starting_bid)})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Opening Bid: <strong className="text-white font-mono">{formatINR(currentActiveCategory.starting_bid)}</strong>
                </p>
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
                  {formatINR(currentAuction?.current_bid || currentAuction?.starting_bid || currentActiveCategory.starting_bid)}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Starting Bid: <strong className="text-white font-mono">{formatINR(currentAuction?.starting_bid || currentActiveCategory.starting_bid)}</strong>
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
              <div className="flex items-center gap-4">
                {highestTeam ? (
                  <>
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-xl"
                      style={{ backgroundColor: highestTeam.team_color }}
                    >
                      {highestTeam.short_name}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Leading Team</span>
                      <h4 className="text-lg font-black text-white font-sports leading-tight">{highestTeam.name}</h4>
                      <p className="text-xs text-slate-400">Remaining Wallet: <span className="font-mono text-emerald-400 font-bold">{formatINR(highestTeam.current_balance)}</span></p>
                    </div>
                  </>
                ) : (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Status</span>
                    <h4 className="text-sm font-bold text-slate-300">Awaiting opening bid from team</h4>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Team Max Legal Bid Helper */}
          {maxBidInfo && (
            <div className="bg-gradient-to-r from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-700/60 p-4 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-md"
                  style={{ backgroundColor: activeTeam.team_color }}
                >
                  {activeTeam.short_name}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Target Team: {activeTeam.name}</span>
                  <p className="text-xs font-bold text-white">
                    Wallet: <span className="font-mono text-emerald-400 font-bold">{formatINR(activeTeam.current_balance)}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-amber-400 uppercase font-black tracking-widest block">MAX LEGAL BID</span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {formatINR(maxBidInfo.maxLegalBid)}
                </span>
              </div>
            </div>
          )}

          {/* LIVE BID HISTORY STREAM */}
          <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-700/60 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gbl-orange-500" />
                <span>Round Bid History ({bidHistory.length})</span>
              </h3>
              <span className="text-[10px] text-slate-400">Chronological</span>
            </div>

            {bidHistory.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No bids recorded yet in this round.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {bidHistory.map((bid, i) => (
                  <div
                    key={bid.id}
                    className={`p-2.5 rounded-xl flex justify-between items-center text-xs border ${
                      bid.is_reverted
                        ? 'bg-rose-950/20 text-slate-500 line-through border-rose-900/30'
                        : i === 0
                        ? 'bg-gbl-orange-500/15 border-gbl-orange-500/40 text-white font-bold'
                        : 'bg-gbl-navy-950 border-gbl-navy-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: bid.team_color || '#FF5E00' }} />
                      <span>{bid.team_name}</span>
                      {bid.bid_type && bid.bid_type !== 'NORMAL' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-gbl-navy-900 text-slate-400 uppercase">
                          {bid.bid_type}
                        </span>
                      )}
                      {bid.is_reverted && (
                        <span className="text-[9px] text-rose-400 uppercase font-bold">(Reverted)</span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-emerald-400">{formatINR(bid.amount)}</span>
                  </div>
                ))}
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
            <button
              onClick={handleStartAuction}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START AUCTION</span>
            </button>
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
              disabled={!currentAuction || !highestTeam || currentAuction.current_bid <= 0}
              className="py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>HAMMER SOLD</span>
            </button>

            <button
              onClick={markUnsoldManually}
              disabled={!currentAuction}
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
      {/* 4. BOTTOM BAR: 10 QUICK TEAM BIDDING BUTTONS */}
      {/* ================================================================= */}
      <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-700/60 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gbl-navy-800">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gbl-orange-500" />
              <span>TEAM QUICK-BID SELECTOR (10 TEAMS)</span>
            </h2>
            <p className="text-[11px] text-slate-400">Click a team tile below to target live quick bids</p>
          </div>
          <div className="text-xs">
            <span className="text-slate-400">Active Team: </span>
            <strong className="text-gbl-orange-400 font-bold">{activeTeam?.name}</strong>
          </div>
        </div>

        {/* 10 Quick Team Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
          {teams.map((t) => {
            const isSelected = t.id === activeTeamId;
            const isLeader = t.id === highestTeam?.id;
            const squadCount = players.filter(p => p.sold_team_id === t.id).length;
            const maxSlots = t.max_auction_slots || (t.owner_is_player !== false ? 5 : 6);
            const isLocked = squadCount >= maxSlots;

            return (
              <button
                key={t.id}
                onClick={() => !isLocked && setActiveTeamId(t.id)}
                disabled={isLocked}
                className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between relative ${
                  isLocked
                    ? 'opacity-40 bg-slate-900 border-slate-800 cursor-not-allowed'
                    : isSelected
                    ? 'ring-2 ring-gbl-orange-500 border-gbl-orange-500 bg-gbl-orange-500/20 scale-[1.03] shadow-lg shadow-gbl-orange-500/20'
                    : isLeader
                    ? 'bg-emerald-950/40 border-emerald-500/60'
                    : 'bg-gbl-navy-950 border-gbl-navy-800 hover:border-gbl-navy-700'
                }`}
              >
                {isLocked && (
                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[8px] font-black uppercase shadow">
                    FULL
                  </span>
                )}
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-md mb-1.5 shrink-0"
                  style={{ backgroundColor: t.team_color }}
                >
                  {t.short_name}
                </div>
                <span className="text-[11px] font-bold text-white truncate w-full">{t.name}</span>
                <div className="w-full flex items-center justify-between mt-1 text-[9px]">
                  <span className="font-mono text-emerald-400 font-bold">{formatCompactINR(t.current_balance)}</span>
                  <span className="font-mono text-slate-300 font-semibold">{squadCount}/{maxSlots}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Bid Increment Buttons (+10k, +20k, +50k) & Custom Bid Form */}
        <div className="pt-4 border-t border-gbl-navy-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-400 shrink-0">
              Quick Bids for {activeTeam?.short_name}:
            </span>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => handleQuickBid(10000)}
                disabled={status !== 'LIVE'}
                className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-b from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-mono font-black text-xs shadow-lg transition-all active:scale-95 border border-sky-400/30"
              >
                +₹10k
              </button>
              <button
                onClick={() => handleQuickBid(20000)}
                disabled={status !== 'LIVE'}
                className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-mono font-black text-xs shadow-lg transition-all active:scale-95 border border-amber-400/30"
              >
                +₹20k
              </button>
              <button
                onClick={() => handleQuickBid(50000)}
                disabled={status !== 'LIVE'}
                className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-b from-gbl-orange-500 to-gbl-orange-700 hover:from-gbl-orange-400 hover:to-gbl-orange-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-mono font-black text-xs shadow-lg transition-all active:scale-95 border border-gbl-orange-400/30"
              >
                +₹50k
              </button>
            </div>
          </div>

          {/* Custom Bid Input */}
          <form onSubmit={handleCustomBid} className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-48">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-bold">₹</span>
              <input
                type="number"
                placeholder="Custom Amount"
                value={customBidAmount}
                onChange={(e) => setCustomBidAmount(e.target.value)}
                disabled={status !== 'LIVE'}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white font-mono focus:border-gbl-orange-500 focus:outline-none disabled:opacity-40"
              />
            </div>
            <button
              type="submit"
              disabled={status !== 'LIVE'}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shrink-0"
            >
              Bid
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

    </div>
  );
};
