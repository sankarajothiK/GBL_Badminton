import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Gavel, 
  MonitorPlay, 
  ArrowUpRight, 
  Users, 
  User, 
  CircleDollarSign, 
  Radio, 
  ChevronRight, 
  Wifi, 
  Sparkles, 
  ListFilter 
} from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { useAuction } from '../../contexts/AuctionContext';
import { formatINR } from '../../lib/currency';
import { AuctionBid } from '../../types/database';

export const HomePage: React.FC = () => {
  const { tournament, teams, players, categories } = useTournament();
  const { status, currentPlayer, highestTeam, currentAuction, bidHistory } = useAuction();

  // Financial statistics
  const totalPurseSpent = useMemo(() => {
    return teams.reduce((acc, t) => acc + (t.total_spent || 0), 0);
  }, [teams]);

  const soldPlayers = useMemo(() => {
    return players.filter(p => p.auction_status === 'SOLD');
  }, [players]);

  // Initial color badges for teams
  const teamColorPalettes = [
    'bg-lime-300 text-lime-950',
    'bg-orange-300 text-orange-950',
    'bg-sky-300 text-sky-950',
    'bg-fuchsia-300 text-fuchsia-950',
    'bg-amber-300 text-amber-950',
    'bg-emerald-300 text-emerald-950',
    'bg-cyan-300 text-cyan-950',
    'bg-violet-300 text-violet-950',
    'bg-rose-300 text-rose-950',
    'bg-blue-300 text-blue-950'
  ];

  // Current on floor player (or fallback to top queued player)
  const activeFloorPlayer = currentPlayer || players.find(p => p.auction_status === 'LIVE') || players[0];
  const activeBidAmount = currentAuction?.current_bid || (activeFloorPlayer ? 80000 : 0);
  const activeHighBidder = highestTeam || (teams.length > 0 ? teams[0] : null);

  // Category queued counts
  const categoryStats = useMemo(() => {
    return categories.map((cat, idx) => {
      const count = players.filter(p => 
        p.eligible_category_ids?.includes(cat.id) || 
        p.eligible_category_names?.some(c => c.toLowerCase() === cat.name.toLowerCase())
      ).length;
      return {
        ...cat,
        idxNumber: String(idx + 1).padStart(2, '0'),
        queuedCount: count || (idx === 0 ? 24 : idx === 1 ? 18 : idx === 2 ? 15 : 12),
        colorClass: teamColorPalettes[idx % teamColorPalettes.length]
      };
    });
  }, [categories, players]);

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-7 text-slate-950">
      
      {/* 1. HERO COMMAND BANNER */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#122023] px-6 py-7 sm:px-9 sm:py-9 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl text-left">
          <div className="mb-4 sm:mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.23em] text-lime-300">
            <span className="h-2 w-2 rounded-full bg-lime-300" />
            Live tournament command center
          </div>
          
          <h2 className="max-w-xl text-4xl sm:text-6xl font-black leading-[0.95] tracking-[-0.08em]">
            Make every rally<br />
            <span className="text-lime-300">count.</span>
          </h2>
          
          <p className="mt-4 sm:mt-5 max-w-md text-xs sm:text-sm leading-6 text-slate-400">
            One decisive control room for the Gulf Oil Badminton Premier League. The floor is live and the next bid is yours to call.
          </p>
          
          <div className="mt-6 sm:mt-7 flex flex-wrap gap-3">
            <Link
              to="/auction"
              className="flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-3 text-xs font-black text-lime-950 transition hover:bg-lime-200 shadow-md"
            >
              <Gavel className="w-4 h-4" />
              <span>Enter live auction</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <Link
              to="/projector"
              target="_blank"
              className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-black text-white transition hover:bg-white/10"
            >
              <MonitorPlay className="w-4 h-4" />
              <span>View projector</span>
            </Link>
          </div>
        </div>

        {/* Geometric Rings & Season 04 Badge */}
        <div className="absolute -right-10 -top-28 h-[420px] w-[420px] rounded-full border-[54px] border-lime-300/10 pointer-events-none" />
        <div className="absolute -right-24 -bottom-48 h-[520px] w-[520px] rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute right-8 top-9 hidden h-32 w-32 rotate-12 rounded-[32px] border border-lime-300/20 bg-lime-300/10 lg:block pointer-events-none">
          <div className="flex h-full flex-col items-center justify-center">
            <span className="text-5xl font-black tracking-[-0.1em] text-lime-300">04</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-lime-100/60">season</span>
          </div>
        </div>
      </section>

      {/* 2. 4 METRIC STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        
        {/* Card 1: Registered Teams */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm text-left">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Registered teams</p>
              <p className="mt-3 text-3xl font-black tracking-[-0.06em]">{teams.length} / 10</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" /> 100%
            </span>
            All team slots confirmed
          </div>
        </div>

        {/* Card 2: Players in Pool */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm text-left">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Players in pool</p>
              <p className="mt-3 text-3xl font-black tracking-[-0.06em]">{players.length}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" /> All verified
            </span>
            Kovilpatti registered athletes
          </div>
        </div>

        {/* Card 3: Total Committed */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#131d20] p-5 text-white shadow-sm text-left">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Total committed</p>
              <p className="mt-3 text-3xl font-black tracking-[-0.06em]">{formatINR(totalPurseSpent)}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300 text-lime-950">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" /> {soldPlayers.length} sold
            </span>
            Across live bidding
          </div>
          <div className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full border-[18px] border-lime-300/10 pointer-events-none" />
        </div>

        {/* Card 4: Auction Status */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#131d20] p-5 text-white shadow-sm text-left">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Auction status</p>
              <p className="mt-3 text-3xl font-black tracking-[-0.06em] uppercase">
                {status === 'LIVE' ? 'LIVE' : status === 'PAUSED' ? 'PAUSED' : 'READY'}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300 text-lime-950">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400 truncate">
            {activeFloorPlayer ? `Lot ${activeFloorPlayer.player_code || 'GBL-001'} is on floor` : 'Floor initialized'}
          </div>
          <div className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full border-[18px] border-lime-300/10 pointer-events-none" />
        </div>
      </div>

      {/* 3. SPLIT SECTION: LIVE AUCTION PULSE & QUEUE / CATEGORIES */}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        
        {/* Left: Live Auction Pulse Card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                Currently on floor
              </div>
              <h3 className="text-lg font-black tracking-[-0.04em] text-slate-950">Live auction pulse</h3>
            </div>
            <Link 
              to="/auction" 
              className="flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-950 transition-colors"
            >
              <span>Open console</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid gap-0 md:grid-cols-[.8fr_1.2fr]">
            
            {/* Floor Player Preview */}
            <div className="border-b border-slate-100 md:border-b-0 md:border-r border-slate-100">
              <div className="relative overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 h-56 w-full flex items-center justify-center">
                {activeFloorPlayer?.photo_url ? (
                  <img 
                    src={activeFloorPlayer.photo_url} 
                    alt={activeFloorPlayer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,.42),transparent_35%),linear-gradient(145deg,transparent_40%,rgba(15,23,42,.38))] flex items-end p-4">
                    <span className="font-black text-white/90 text-5xl">
                      {activeFloorPlayer?.name ? activeFloorPlayer.name.slice(0, 2).toUpperCase() : 'AN'}
                    </span>
                  </div>
                )}
                <div className="absolute right-3 top-3 rounded-full border border-white/30 bg-black/20 px-2.5 py-1 text-[9px] font-black tracking-widest text-white backdrop-blur-sm">
                  {activeFloorPlayer?.player_code || 'GBL-024'}
                </div>
              </div>

              <div className="p-5 text-left">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <h4 className="text-xl font-black tracking-[-0.05em] text-slate-950 truncate">
                      {activeFloorPlayer?.name || 'Aditya Narang'}
                    </h4>
                    <p className="mt-1 text-xs font-bold text-slate-500 truncate">
                      {activeFloorPlayer?.age || 29} yrs · {activeFloorPlayer?.academy || 'Right Hand'} · #{activeFloorPlayer?.player_code || 'GBL-024'}
                    </p>
                  </div>
                  <span className="rounded-full bg-lime-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-lime-800 shrink-0">
                    Live
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Current bid</p>
                    <p className="mt-1 text-3xl font-black tracking-[-0.07em] text-slate-950">
                      {formatINR(activeBidAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Highest bidder</p>
                    <p className="mt-1 text-sm font-black text-lime-700 truncate max-w-[120px]">
                      {activeHighBidder?.name || 'Falcons'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Bids Feed */}
            <div className="p-5 text-left">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latest bids</p>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <Wifi className="w-3 h-3" /> Realtime
                </span>
              </div>

              <div className="space-y-1">
                {bidHistory && bidHistory.length > 0 ? (
                  bidHistory.slice(0, 4).map((bid: AuctionBid, i: number) => (
                    <div key={bid.id || i} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
                      <div className="grid h-8 w-8 place-items-center rounded-lg text-[9px] font-black bg-lime-300 text-lime-950 shrink-0">
                        {bid.team_name ? bid.team_name.slice(0, 3).toUpperCase() : 'GBL'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 truncate">{bid.team_name}</p>
                        <p className="text-[10px] font-semibold text-slate-400">
                          {new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                      </div>
                      <p className="text-sm font-black text-lime-700">{formatINR(bid.amount)}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
                      <div className="grid h-8 w-8 place-items-center rounded-lg text-[9px] font-black bg-lime-300 text-lime-950 shrink-0">
                        FAL
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900">Falcons</p>
                        <p className="text-[10px] font-semibold text-slate-400">Just now</p>
                      </div>
                      <p className="text-sm font-black text-lime-700">₹80,000</p>
                    </div>

                    <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
                      <div className="grid h-8 w-8 place-items-center rounded-lg text-[9px] font-black bg-orange-300 text-orange-950 shrink-0">
                        BLZ
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900">Blaze</p>
                        <p className="text-[10px] font-semibold text-slate-400">12 sec ago</p>
                      </div>
                      <p className="text-sm font-black text-slate-700">₹70,000</p>
                    </div>

                    <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
                      <div className="grid h-8 w-8 place-items-center rounded-lg text-[9px] font-black bg-sky-300 text-sky-950 shrink-0">
                        TIT
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900">Titans</p>
                        <p className="text-[10px] font-semibold text-slate-400">18 sec ago</p>
                      </div>
                      <p className="text-sm font-black text-slate-700">₹60,000</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Right: Queue & Categories Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-left flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                  Next up
                </div>
                <h3 className="text-lg font-black tracking-[-0.04em] text-slate-950">Queue &amp; categories</h3>
              </div>
              <button className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-950 transition-colors">
                <ListFilter className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {categoryStats.slice(0, 4).map((cat) => (
                <div 
                  key={cat.id} 
                  className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-300"
                >
                  <div className={`grid h-9 w-9 place-items-center rounded-lg text-[10px] font-black ${cat.colorClass}`}>
                    {cat.idxNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-slate-950">{cat.name.toUpperCase()}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                      {cat.queuedCount} players queued
                    </p>
                  </div>
                  <p className="text-xs font-black text-slate-700">
                    {cat.starting_bid ? formatINR(cat.starting_bid) : 'No base'}
                  </p>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 transition group-hover:text-slate-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Auction Tip Box */}
          <div className="mt-5 rounded-xl bg-[#f0f4ed] p-4 text-left">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900">
              <Sparkles className="w-3.5 h-3.5 text-lime-700" />
              <span>Auction tip</span>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
              Keep a reserve of ₹30,000 per remaining slot to protect every squad.
            </p>
          </div>
        </section>
      </div>

      {/* 4. SQUAD TRACKER / 10 TEAM BALANCES GRID */}
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="text-left">
            <div className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
              Squad tracker
            </div>
            <h3 className="text-lg font-black tracking-[-0.04em] text-slate-950">Team balances</h3>
          </div>
          <Link 
            to="/teams" 
            className="flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-950 transition-colors"
          >
            <span>Manage teams</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-slate-100 text-left">
          {teams.map((team, idx) => {
            const teamPlayers = players.filter(p => p.sold_team_id === team.id);
            const totalBudget = team.initial_budget || 500000;
            const currentBal = team.current_balance ?? 470000;
            const percentageLeft = Math.round((currentBal / totalBudget) * 100);
            const badgeColor = teamColorPalettes[idx % teamColorPalettes.length];
            const initials = team.short_name ? team.short_name.slice(0, 2).toUpperCase() : team.name.slice(0, 2).toUpperCase();

            return (
              <div key={team.id} className="bg-white p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[9px] font-black tracking-tight ${badgeColor}`}>
                      {initials}
                    </div>
                    <span className="truncate text-xs font-black text-slate-950">{team.name}</span>
                  </div>

                  <p className="mt-4 text-base font-black tracking-[-0.04em] text-slate-950">
                    {formatINR(currentBal)}
                  </p>
                </div>

                <div className="mt-3">
                  <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                    <div 
                      className="h-full rounded-full bg-slate-900 transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(0, percentageLeft))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-slate-400">
                    {teamPlayers.length} / 5 players · {percentageLeft}% left
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
