import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock, Shield, Users, Trophy, Tv, Radio, ArrowRight, Sparkles, AlertCircle, Activity, Wifi, MonitorPlay } from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import { useTournament } from '../../contexts/TournamentContext';
import { formatINR, formatCompactINR } from '../../lib/currency';

export const PublicAuctionPage: React.FC = () => {
  const { currentAuction, currentPlayer, currentCategory, highestTeam, timerSeconds, isTimerRunning, bidHistory, status } = useAuction();
  const { teams, players, tournament } = useTournament();

  const isUrgent = timerSeconds <= 5 && isTimerRunning;

  // Defensive deduplication of bids to eliminate any dual-transport or re-render duplicates
  const deduplicatedBids = useMemo(() => {
    const seenIds = new Set<string>();
    const seenTuples = new Set<string>();
    const list = [];
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

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-6 text-slate-950">
      
      {/* Top Header & Broadcast Controls */}
      <div className="relative overflow-hidden rounded-[24px] bg-[#122023] px-6 py-5 sm:px-8 sm:py-6 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black tracking-[-0.04em] text-white">
                Live Auction Arena
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-lime-300 text-lime-950">
                OFFICIAL
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Synchronized real-time spectator broadcast for {tournament.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Link
            to="/projector"
            target="_blank"
            className="flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-2.5 text-xs font-black text-lime-950 transition hover:bg-lime-200 shadow-sm"
          >
            <MonitorPlay className="w-4 h-4" />
            <span>Projector (1080p)</span>
          </Link>
        </div>
      </div>

      {status === 'LIVE' || status === 'PAUSED' || status === 'SOLD' || status === 'UNSOLD' ? (
        currentPlayer ? (
          /* ACTIVE AUCTION SPOTLIGHT */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Player Display Card */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-left">
              
              {/* Photo Header with Overlays */}
              <div className="relative aspect-[3/4] min-h-[400px] sm:min-h-[460px] bg-slate-100 overflow-hidden">
                <img
                  src={currentPlayer.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'}
                  alt={currentPlayer.name}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-xs sm:text-sm font-mono font-bold text-white shadow-md">
                    {currentPlayer.player_code}
                  </span>
                </div>

                <div className="absolute top-4 right-4">
                  {status === 'SOLD' ? (
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg">
                      SOLD!
                    </span>
                  ) : status === 'UNSOLD' ? (
                    <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg">
                      UNSOLD
                    </span>
                  ) : status === 'PAUSED' ? (
                    <span className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg">
                      PAUSED
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      LIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Player Information Body */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
                    {currentPlayer.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-semibold flex-wrap">
                    <span>Age: <strong className="text-slate-800">{currentPlayer.age}</strong></span>
                    <span>•</span>
                    <span>Gender: <strong className="text-slate-800">{currentPlayer.gender}</strong></span>
                    {currentPlayer.academy && (
                      <>
                        <span>•</span>
                        <span className="text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                          {currentPlayer.academy}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Golden Auction Category Badge */}
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 text-yellow-800 border border-yellow-500/50 shadow-sm">
                    <span>AUCTION CATEGORY: {currentPlayer.auction_category || currentCategory?.name || 'OPEN'}</span>
                  </span>
                </div>

                {/* Separate Eligible Categories */}
                {currentPlayer.eligible_category_names && currentPlayer.eligible_category_names.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                      Eligible Categories (Matches):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPlayer.eligible_category_names.map(ec => (
                        <span key={ec} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                          {ec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Starting Bid Tier
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {currentCategory?.name || 'OPEN'} ({formatINR((currentAuction?.starting_bid && currentAuction.starting_bid > 0) ? currentAuction.starting_bid : ((currentCategory?.starting_bid && currentCategory.starting_bid > 0) ? currentCategory.starting_bid : 30000))})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Min Increment
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      +{formatCompactINR(currentCategory?.min_bid_increment || 10000)}
                    </span>
                  </div>
                </div>

                {currentPlayer.achievements && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-900 font-bold block mb-1">Career &amp; Highlights:</strong>
                    {currentPlayer.achievements}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Broadcast Scoreboard & Live Bid Feed */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Scoreboard Card */}
              <div className={`rounded-2xl border p-6 shadow-sm transition-all duration-300 text-left ${
                isUrgent 
                  ? 'bg-rose-50 border-rose-400 animate-pulse' 
                  : 'bg-[#122023] border-white/10 text-white'
              }`}>
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest block ${
                      isUrgent ? 'text-rose-700' : 'text-slate-400'
                    }`}>
                      CURRENT HIGHEST BID
                    </span>
                    <p className={`text-3xl sm:text-5xl font-black font-mono tracking-tight mt-1 ${
                      isUrgent ? 'text-rose-700' : 'text-lime-300'
                    }`}>
                      {formatINR(currentAuction?.current_bid || currentAuction?.starting_bid || currentCategory?.starting_bid || 30000)}
                    </p>
                    <div className="text-xs text-slate-400 mt-1">
                      <span>Opening Bid: <strong className={isUrgent ? 'text-slate-800' : 'text-white'}>{formatINR((currentAuction?.starting_bid && currentAuction.starting_bid > 0) ? currentAuction.starting_bid : ((currentCategory?.starting_bid && currentCategory.starting_bid > 0) ? currentCategory.starting_bid : 30000))}</strong></span>
                    </div>
                  </div>

                  {/* Circular Neon Countdown Clock */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                      isUrgent
                        ? 'border-rose-600 bg-rose-200 text-rose-900 scale-105 shadow-lg'
                        : timerSeconds <= 10
                        ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                        : 'border-lime-300 bg-lime-300/20 text-lime-300'
                    }`}>
                      <span className="text-3xl sm:text-4xl font-black font-mono leading-none">{timerSeconds}</span>
                      <span className="text-[9px] uppercase font-black tracking-widest mt-0.5">SEC</span>
                    </div>
                  </div>
                </div>

                {/* Leading Team Display */}
                <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    {highestTeam ? (
                      <>
                        {highestTeam.logo_url ? (
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 p-1 shadow-lg shrink-0 flex items-center justify-center overflow-hidden">
                            <img src={highestTeam.logo_url} alt={highestTeam.name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-lg shrink-0 border border-white/20"
                            style={{ backgroundColor: highestTeam.team_color }}
                          >
                            {highestTeam.short_name}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <span className="text-[10px] text-lime-400 uppercase font-black tracking-widest block">
                            LEADING HIGHEST BIDDER
                          </span>
                          <h4 className="text-base sm:text-xl font-black truncate">{highestTeam.name}</h4>
                          <p className="text-xs text-slate-400 truncate">Owner: {highestTeam.owner_name}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-slate-400 shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block">STATUS</span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-300">Awaiting Opening Bid</h4>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Bid History Stream */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Live Bid Log ({deduplicatedBids.length})</span>
                  </h3>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <Wifi className="w-3 h-3" /> Realtime
                  </span>
                </div>

                {deduplicatedBids.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500">No bids placed yet for this lot.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Opening bid: {formatINR(currentAuction?.starting_bid)}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {deduplicatedBids.map((bid, index) => {
                      const timeStr = bid.created_at
                        ? new Date(bid.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
                        : '';
                      const displayInc = bid.increment_amount !== undefined && bid.increment_amount > 0
                        ? bid.increment_amount
                        : (bid.bid_type === 'QUICK_10K' ? 10000 : bid.bid_type === 'QUICK_20K' ? 20000 : bid.bid_type === 'QUICK_50K' ? 50000 : 0);

                      return (
                        <div
                          key={bid.id}
                          className={`p-3 rounded-xl flex justify-between items-center text-xs border transition-all ${
                            index === 0
                              ? 'bg-lime-50 border-lime-300 text-slate-950 font-bold shadow-sm'
                              : 'bg-slate-50 border-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                              style={{ backgroundColor: bid.team_color || '#bef264' }} 
                            />
                            <span className="font-bold truncate max-w-[120px] sm:max-w-none">{bid.team_name || 'Team'}</span>
                            
                            {displayInc > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[9px] font-mono font-bold shrink-0">
                                +{formatCompactINR(displayInc)}
                              </span>
                            )}

                            {index === 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-lime-300 text-lime-950 text-[9px] font-black uppercase tracking-wider shrink-0">
                                Highest
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {timeStr && (
                              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
                                {timeStr}
                              </span>
                            )}
                            <span className="font-mono font-black text-xs sm:text-sm text-slate-950">{formatINR(bid.amount)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : null
      ) : (
        /* NO LIVE AUCTION SCREEN */
        <div className="text-center py-16 sm:py-24 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm max-w-2xl mx-auto p-8">
          <div className="w-14 h-14 rounded-2xl bg-lime-100 text-lime-800 flex items-center justify-center mx-auto shadow-sm">
            <Flame className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tight uppercase">
            Auction Arena Standby
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            The tournament auctioneer has not yet called the next player lot to the center floor. This screen will automatically sync once the bidding bell strikes.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/players"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Browse Player Pool
            </Link>
            <Link
              to="/teams"
              className="px-4 py-2.5 rounded-xl bg-lime-300 hover:bg-lime-200 text-lime-950 text-xs font-black uppercase tracking-wider shadow-sm transition-colors"
            >
              View 10 Teams
            </Link>
          </div>
        </div>
      )}

      {/* 10 TEAMS PURSE STRIP */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm text-left">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-700" />
            <span>10 Team Purses</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">₹50L Total</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {teams.map((t) => (
            <div 
              key={t.id} 
              className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] text-white shadow-sm shrink-0" 
                  style={{ backgroundColor: t.team_color }}
                >
                  {t.short_name}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-slate-900 truncate max-w-[80px]">{t.name}</p>
                  <p className="text-[10px] text-slate-400">Purse:</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-black text-slate-950 font-mono block">
                  {formatCompactINR(t.current_balance)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
