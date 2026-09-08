import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Wallet, Users, Flame, AlertCircle, ArrowUpRight, CheckCircle2, Clock, Zap, ArrowLeft } from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import { useTournament } from '../../contexts/TournamentContext';
import { formatINR, formatCompactINR } from '../../lib/currency';
import { calculateMaxLegalBid } from '../../lib/maxBid';
import { Badge } from '../../components/common/Badge';

export const TeamBiddingPortal: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { currentAuction, currentPlayer, currentCategory, highestTeam, timerSeconds, isTimerRunning, status, placeQuickBid } = useAuction();
  const { teams, players, settings } = useTournament();

  const [bidError, setBidError] = useState<string | null>(null);

  // Selected team or default to first team if not specified in URL
  const activeTeam = teams.find(t => t.id === teamId || String(t.team_number) === teamId) || teams[0];
  const squad = players.filter(p => p.sold_team_id === activeTeam?.id);

  if (!activeTeam) {
    return (
      <div className="min-h-screen bg-gbl-navy-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-white font-sports">TEAM PORTAL NOT FOUND</h2>
        <p className="text-xs text-slate-400 mt-2">Please select an official team to access the console.</p>
        <Link to="/teams" className="mt-4 px-5 py-2.5 rounded-xl bg-gbl-orange-600 text-white text-xs font-bold uppercase tracking-wider">
          Return to Teams
        </Link>
      </div>
    );
  }

  // Calculate maximum legal bid
  const maxBidResult = calculateMaxLegalBid(activeTeam, squad.length, settings, currentCategory || undefined);
  const isHighestBidder = highestTeam?.id === activeTeam.id;
  const isUrgent = timerSeconds <= 5 && isTimerRunning;

  const handleBidClick = (increment: number) => {
    setBidError(null);
    const result = placeQuickBid(activeTeam.id, increment);
    if (!result.success) {
      setBidError(result.error || 'Bid rejected');
    }
  };

  return (
    <div className="min-h-screen bg-gbl-navy-950 text-white p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4 sm:space-y-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div 
        className="absolute top-0 right-1/2 translate-x-1/2 w-[350px] sm:w-[600px] h-[200px] sm:h-[300px] blur-[120px] pointer-events-none -z-0 opacity-20"
        style={{ backgroundColor: activeTeam.team_color }}
      />

      {/* Team Header Strip */}
      <div className="bg-gradient-to-r from-gbl-navy-900 via-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-700/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3 sm:gap-4 text-left w-full sm:w-auto">
          {activeTeam.logo_url ? (
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gbl-navy-950 border border-white/20 p-1 flex items-center justify-center overflow-hidden shadow-xl shrink-0">
              <img src={activeTeam.logo_url} alt={activeTeam.name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div 
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-white text-base sm:text-xl shadow-xl shrink-0 border border-white/20"
              style={{ backgroundColor: activeTeam.team_color }}
            >
              {activeTeam.short_name}
            </div>
          )}
          <div className="overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gbl-orange-500/10 border border-gbl-orange-500/30 text-gbl-orange-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
              <span>TEAM CONSOLE</span>
            </div>
            <h1 className="text-lg sm:text-3xl font-black font-sports tracking-tight uppercase truncate mt-0.5">
              {activeTeam.name}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">Owner: {activeTeam.owner_name}</p>
          </div>
        </div>

        {/* Team Selector Dropdown */}
        <div className="flex items-center gap-2 bg-gbl-navy-950/80 border border-gbl-navy-800 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-xs text-slate-400 pl-2 font-semibold shrink-0">Switch:</span>
          <select
            value={activeTeam.id}
            onChange={(e) => window.location.href = `/team-bid/${e.target.value}`}
            className="bg-gbl-navy-900 border border-gbl-navy-700 text-xs rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 text-white focus:outline-none focus:border-gbl-orange-500 font-bold w-full sm:w-auto"
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TEAM FINANCIAL & SQUAD METRICS ROW (2x2 on Mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 relative z-10">
        <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg">
          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-wider block">Wallet Balance</span>
          <span className="text-lg sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block truncate">
            {formatINR(activeTeam.current_balance)}
          </span>
        </div>

        <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg">
          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-wider block">Max Legal Bid</span>
          <span className="text-lg sm:text-2xl font-black text-amber-400 font-mono mt-0.5 block truncate">
            {formatINR(maxBidResult.maxLegalBid)}
          </span>
        </div>

        <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg">
          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-wider block">Squad Slots</span>
          <span className="text-lg sm:text-2xl font-black text-white font-mono mt-0.5 block">
            {squad.length} / {maxBidResult.requiredSlots}
          </span>
        </div>

        <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg">
          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-wider block">Remaining</span>
          <span className="text-lg sm:text-2xl font-black text-sky-400 font-mono mt-0.5 block">
            {maxBidResult.remainingSlots} Slots
          </span>
        </div>
      </div>

      {/* LIVE AUCTION STAGE */}
      {status === 'LIVE' || status === 'PAUSED' ? (
        currentPlayer ? (
          <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-700/70 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl relative z-10">
            
            {/* Player Info Row with Clock */}
            <div className="flex flex-row items-center gap-3 sm:gap-6">
              <div className="relative shrink-0">
                <img
                  src={currentPlayer.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={currentPlayer.name}
                  className="w-16 h-16 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl object-cover border-2 border-gbl-orange-500 shadow-xl"
                />
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-black/80 border border-white/20 text-[9px] font-mono font-bold text-white">
                  {currentPlayer.player_code}
                </span>
              </div>

              <div className="flex-1 text-left space-y-0.5 sm:space-y-1 overflow-hidden">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="orange" size="sm">{currentCategory?.name || 'OPEN'}</Badge>
                  <span className="text-[11px] text-slate-400">Age: {currentPlayer.age}</span>
                </div>
                <h2 className="text-lg sm:text-3xl font-black text-white font-sports uppercase tracking-tight truncate">
                  {currentPlayer.name}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1">
                  {currentPlayer.achievements || 'National Badminton Tournament Player'}
                </p>
              </div>

              {/* Urgency Clock */}
              <div className={`text-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border shrink-0 transition-all ${
                isUrgent
                  ? 'bg-rose-950/60 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-gbl-navy-950 border-gbl-navy-800 text-gbl-orange-400'
              }`}>
                <span className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest block text-slate-400">Timer</span>
                <span className="text-2xl sm:text-4xl font-black font-mono leading-none mt-0.5 block">{timerSeconds}s</span>
              </div>
            </div>

            {/* Current Highest Bid Banner */}
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-gbl-navy-950 border border-gbl-navy-800 flex justify-between items-center shadow-inner">
              <div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                  Current Highest Bid
                </span>
                <p className="text-xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight mt-0.5">
                  {formatINR(currentAuction?.current_bid || currentAuction?.starting_bid || 30000)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-wider block">Leader</span>
                <p className="text-sm sm:text-lg font-black text-white font-sports truncate max-w-[140px] sm:max-w-none">
                  {highestTeam ? highestTeam.name : 'Waiting for Bid'}
                </p>
                {isHighestBidder && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-emerald-400 font-black uppercase mt-0.5 animate-pulse">
                    <CheckCircle2 className="w-3 h-3" /> Leading!
                  </span>
                )}
              </div>
            </div>

            {bidError && (
              <div className="p-3 sm:p-4 bg-rose-950/40 border border-rose-500/50 rounded-xl sm:rounded-2xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="font-semibold">{bidError}</span>
              </div>
            )}

            {/* QUICK BID BUTTONS - Tactile & Mobile Touch-Friendly */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-gbl-orange-500" />
                  <span>Quick Bid</span>
                </span>
                <span className="text-[10px] sm:text-[11px] text-amber-400 font-semibold font-mono">
                  Limit: {formatINR(maxBidResult.maxLegalBid)}
                </span>
              </div>

              {!maxBidResult.isEligibleToBid && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{maxBidResult.ineligibilityReason}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
                <button
                  onClick={() => handleBidClick(10000)}
                  disabled={status !== 'LIVE' || isHighestBidder || !maxBidResult.isEligibleToBid}
                  className="py-4 sm:py-5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-xs sm:text-lg font-mono shadow-xl transition-all active:scale-95 border border-sky-400/30 min-h-[50px] flex items-center justify-center"
                >
                  +₹10,000
                </button>

                <button
                  onClick={() => handleBidClick(20000)}
                  disabled={status !== 'LIVE' || isHighestBidder || !maxBidResult.isEligibleToBid}
                  className="py-4 sm:py-5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-xs sm:text-lg font-mono shadow-xl transition-all active:scale-95 border border-amber-400/30 min-h-[50px] flex items-center justify-center"
                >
                  +₹20,000
                </button>

                <button
                  onClick={() => handleBidClick(50000)}
                  disabled={status !== 'LIVE' || isHighestBidder || !maxBidResult.isEligibleToBid}
                  className="py-4 sm:py-5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-gbl-orange-500 to-gbl-orange-700 hover:from-gbl-orange-400 hover:to-gbl-orange-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-xs sm:text-lg font-mono shadow-xl transition-all active:scale-95 border border-gbl-orange-400/30 min-h-[50px] flex items-center justify-center"
                >
                  +₹50,000
                </button>
              </div>
            </div>

          </div>
        ) : null
      ) : (
        /* AUCTION NOT LIVE */
        <div className="text-center py-14 sm:py-20 bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-800 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4 shadow-xl relative z-10 p-4">
          <Flame className="w-10 h-10 sm:w-14 sm:h-14 text-slate-600 mx-auto" />
          <h3 className="text-xl sm:text-2xl font-black text-white font-sports uppercase">AWAITING NEXT ATHLETE</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Bid pads will activate automatically when the chief auctioneer opens bidding for the next player.
          </p>
        </div>
      )}

      {/* TEAM SQUAD LIST */}
      <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3 sm:space-y-4 relative z-10 shadow-xl">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
          <Users className="w-4 h-4 text-gbl-orange-500" />
          <span>ROSTER ({squad.length} / {activeTeam.total_squad_slots || settings.required_squad_slots || 6})</span>
        </h3>

        {squad.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 sm:py-6 text-center">No players acquired yet by this team.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {squad.map(p => {
              const isOwner = activeTeam.owner_name && p.name.toLowerCase().includes(activeTeam.owner_name.toLowerCase());
              return (
                <div key={p.id} className="p-3 rounded-xl bg-gbl-navy-950 border border-gbl-navy-800 flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs sm:text-sm">{p.name}</span>
                      {isOwner && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px] font-black uppercase border border-amber-500/30">
                          Owner
                        </span>
                      )}
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase border border-emerald-500/30">
                        SOLD
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-400">{p.eligible_category_names.join(', ')}</p>
                  </div>
                  <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm">{formatINR(p.sold_price)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
