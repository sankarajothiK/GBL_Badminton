import React, { useState, useEffect } from 'react';
import { Maximize, Minimize, Flame, Shield, Users, Trophy, Radio, Clock, Sparkles } from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import { useTournament } from '../../contexts/TournamentContext';
import { formatINR, formatCompactINR } from '../../lib/currency';
import confetti from 'canvas-confetti';

export const ProjectorPage: React.FC = () => {
  const { currentAuction, currentPlayer, currentCategory, highestTeam, timerSeconds, isTimerRunning, status } = useAuction();
  const { teams, tournament, players } = useTournament();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Trigger celebratory confetti cannon when SOLD
  useEffect(() => {
    if (status === 'SOLD') {
      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.55 },
        colors: ['#FF5E00', '#0284C7', '#F59E0B', '#10B981', '#FFFFFF']
      });
    }
  }, [status]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isUrgent = timerSeconds <= 5 && isTimerRunning;

  return (
    <div className="min-h-screen w-full bg-gbl-navy-950 text-white select-none flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-y-auto lg:overflow-hidden lg:h-screen">
      
      {/* Ambient Stadium Lighting Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,94,0,0.15),transparent_70%)] pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-500/10 blur-[150px] pointer-events-none -z-0" />

      {/* TOP HEADER BAR */}
      <header className="flex justify-between items-center z-10 border-b border-gbl-navy-800/80 pb-4 sm:pb-5 gap-3">
        {/* GBL Logo & Title */}
        <div className="flex items-center gap-3 sm:gap-5">
          <img 
            src="/gbl-logo.png" 
            alt="GBL Official Logo" 
            className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl object-cover bg-gbl-navy-950 border-2 border-amber-500/50 p-0.5 shadow-[0_0_35px_rgba(255,150,0,0.4)] shrink-0" 
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl sm:text-2xl text-gbl-orange-500 font-sports">GBL</span>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-white font-sports uppercase leading-none">
                GULF OIL BADMINTON PREMIER LEAGUE
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-gbl-orange-400 font-black uppercase tracking-widest mt-1.5">
              OFFICIAL LIVE PLAYER AUCTION • {tournament.season} • ARENA PROJECTOR
            </p>
          </div>
        </div>

        {/* Realtime Live Indicator & Fullscreen Switcher */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/50 text-emerald-400 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-md">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="hidden sm:inline">1080P BROADCAST ACTIVE</span>
            <span className="sm:hidden">LIVE</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 sm:p-3 rounded-2xl bg-gbl-navy-900 border border-gbl-navy-700 hover:border-gbl-orange-500 text-slate-300 hover:text-white transition-all shadow-lg"
            title="Toggle 1080p Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </header>

      {/* CENTER MAIN STAGE (Optimized for both mobile and 1920x1080 TV/Projector) */}
      <main className="flex-1 flex items-center justify-center my-auto z-10 py-6">
        {status === 'LIVE' || status === 'PAUSED' || status === 'SOLD' || status === 'UNSOLD' ? (
          currentPlayer ? (
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
              
              {/* Player Image Showcase */}
              <div className="col-span-1 lg:col-span-5 max-w-md mx-auto lg:max-w-none w-full relative">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border-4 border-gbl-navy-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] bg-gbl-navy-900">
                  <img
                    src={currentPlayer.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'}
                    alt={currentPlayer.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* SOLD Explosive Overlay */}
                  {status === 'SOLD' && (
                    <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-in zoom-in-95 duration-300">
                      <span className="text-7xl font-black text-emerald-400 font-sports tracking-wider drop-shadow-[0_0_30px_rgba(16,185,129,0.6)] animate-bounce">
                        SOLD!
                      </span>
                      <p className="text-2xl font-black text-white uppercase tracking-wide mt-3">
                        ACQUIRED BY {highestTeam?.name}
                      </p>
                      <p className="text-4xl font-black text-amber-400 font-mono mt-2 drop-shadow-md">
                        {formatINR(currentAuction?.current_bid)}
                      </p>
                    </div>
                  )}

                  {/* UNSOLD Overlay */}
                  {status === 'UNSOLD' && (
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                      <span className="text-6xl font-black text-slate-400 font-sports tracking-wider">
                        UNSOLD
                      </span>
                      <p className="text-base font-semibold text-slate-300 mt-3">
                        Player will return for re-auction round
                      </p>
                    </div>
                  )}

                  {/* Player Code Tag */}
                  <div className="absolute top-5 left-5">
                    <span className="px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md text-sm font-mono font-bold text-white border border-white/20 shadow-xl">
                      {currentPlayer.player_code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Player Auction Information & Big Scoreboard */}
              <div className="col-span-1 lg:col-span-7 space-y-5 sm:space-y-7">
                
                {/* Category & Name */}
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="px-3 sm:px-4 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider bg-gradient-to-r from-gbl-orange-500 to-amber-500 text-white shadow-lg">
                      CATEGORY: {currentCategory?.name || 'OPEN'}
                    </span>
                    <span className="text-sm sm:text-lg text-slate-300 font-bold">
                      Age: {currentPlayer.age} Yrs
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-5xl xl:text-6xl font-black text-white font-sports uppercase tracking-tight mt-2 sm:mt-3 leading-tight drop-shadow-md">
                    {currentPlayer.name}
                  </h2>
                  
                  {currentPlayer.achievements && (
                    <p className="text-xs sm:text-base text-slate-300 mt-2 sm:mt-3 line-clamp-2 leading-relaxed font-normal">
                      {currentPlayer.achievements}
                    </p>
                  )}
                </div>

                {/* CURRENT BID & CIRCULAR TIMER BANNER */}
                <div className={`p-5 sm:p-8 rounded-3xl border-2 transition-all duration-300 shadow-2xl ${
                  isUrgent
                    ? 'bg-rose-950/50 border-rose-500 shadow-[0_0_60px_rgba(244,63,94,0.4)] animate-pulse'
                    : 'bg-gradient-to-r from-gbl-navy-900 to-gbl-navy-950 border-gbl-navy-700'
                }`}>
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <span className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-slate-400 block">
                        CURRENT HIGHEST BID
                      </span>
                      <p className="text-3xl sm:text-5xl xl:text-7xl font-black text-emerald-400 font-mono tracking-tight mt-1 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        {formatINR(currentAuction?.current_bid || currentAuction?.starting_bid)}
                      </p>
                      <span className="text-[11px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 block">
                        Opening Bid: <strong className="text-white font-mono">{formatINR(currentAuction?.starting_bid)}</strong>
                      </span>
                    </div>

                    {/* Giant 20-Second Countdown Clock */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-20 h-20 sm:w-28 sm:h-28 xl:w-32 xl:h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                        isUrgent
                          ? 'border-rose-500 bg-rose-500/20 text-rose-400 scale-105 sm:scale-110 shadow-[0_0_40px_rgba(244,63,94,0.6)]'
                          : timerSeconds <= 10
                          ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                          : 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                      }`}>
                        <span className="text-3xl sm:text-4xl xl:text-5xl font-black font-mono leading-none">{timerSeconds}</span>
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest mt-0.5 sm:mt-1">SEC</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LEADING TEAM SPOTLIGHT */}
                <div className="p-4 sm:p-6 rounded-3xl bg-gbl-navy-900/90 border border-gbl-navy-800 flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-3 sm:gap-5">
                    {highestTeam ? (
                      <>
                        {highestTeam.logo_url ? (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gbl-navy-950 border-2 border-gbl-orange-500/50 p-1 shadow-xl shrink-0 flex items-center justify-center overflow-hidden">
                            <img src={highestTeam.logo_url} alt={highestTeam.name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div 
                            className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-white text-base sm:text-lg shadow-xl shrink-0"
                            style={{ backgroundColor: highestTeam.team_color }}
                          >
                            {highestTeam.short_name}
                          </div>
                        )}
                        <div>
                          <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-slate-400 block">
                            CURRENT HIGHEST BIDDER
                          </span>
                          <h3 className="text-lg sm:text-2xl font-black text-white font-sports tracking-wide leading-tight">{highestTeam.name}</h3>
                          <p className="text-[11px] sm:text-xs text-slate-400">Team Owner: {highestTeam.owner_name}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gbl-navy-950 border border-gbl-navy-800 flex items-center justify-center text-slate-500 shrink-0">
                          <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-slate-400 block">
                            AUCTION STAGE
                          </span>
                          <h3 className="text-sm sm:text-xl font-bold text-slate-300">AWAITING OPENING BID</h3>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : null
        ) : (
          /* PROJECTOR STANDBY DISPLAY */
          <div className="text-center space-y-4 sm:space-y-6 max-w-3xl mx-auto py-12 sm:py-16 px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gbl-orange-500/20 text-gbl-orange-400 border border-gbl-orange-500/40 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(255,94,0,0.3)]">
              <Flame className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-5xl font-black text-white font-sports tracking-wide uppercase leading-tight">
                GBL LIVE AUCTION FLOOR ON STANDBY
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-2 sm:mt-3 max-w-xl mx-auto leading-relaxed">
                The next athlete lot is being called to the auction floor. Stand by for live real-time bidding action.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM TICKER: 10 TEAM BALANCES */}
      <footer className="z-10 border-t border-gbl-navy-800/80 pt-4">
        <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2.5 flex items-center gap-2">
          <Shield className="w-4 h-4 text-gbl-orange-500" />
          <span>10 TEAM REMAINING PURSES</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-2.5">
          {teams.map((t) => {
            const squadCount = players.filter(p => p.sold_team_id === t.id).length;
            const totalSlots = t.total_squad_slots || 6;
            const isFull = squadCount >= totalSlots;
            const isLeader = t.id === highestTeam?.id;

            return (
              <div
                key={t.id}
                className={`p-2 sm:p-2.5 rounded-2xl border text-center transition-all relative ${
                  isLeader
                    ? 'bg-gbl-orange-500/20 border-gbl-orange-500 ring-2 ring-gbl-orange-500/40 shadow-lg'
                    : isFull
                    ? 'bg-gbl-navy-950/60 border-gbl-navy-800/80 opacity-75'
                    : 'bg-gbl-navy-900 border-gbl-navy-800'
                }`}
              >
                {isFull && (
                  <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-rose-500 text-white text-[7px] font-black uppercase">
                    FULL
                  </span>
                )}
                {t.logo_url ? (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gbl-navy-950 border border-gbl-navy-700 p-0.5 mx-auto mb-1 sm:mb-1.5 flex items-center justify-center overflow-hidden">
                    <img src={t.logo_url} alt={t.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div 
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[9px] sm:text-[10px] font-black text-white mx-auto mb-1 sm:mb-1.5 shadow-md"
                    style={{ backgroundColor: t.team_color }}
                  >
                    {t.short_name}
                  </div>
                )}
                <p className="text-[10px] sm:text-[11px] font-bold text-white truncate">{t.name}</p>
                <div className="flex items-center justify-between mt-0.5 px-0.5 text-[10px]">
                  <span className="font-mono text-emerald-400 font-bold">{formatCompactINR(t.current_balance)}</span>
                  <span className="font-mono text-slate-300 font-semibold">{squadCount}/{totalSlots}</span>
                </div>
              </div>
            );
          })}
        </div>
      </footer>

    </div>
  );
};
