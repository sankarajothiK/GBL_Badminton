import React from 'react';
import { Calendar, MapPin, Phone, Mail, Award, Trophy, Users, ShieldCheck, Sparkles, CheckCircle2, Tv, Flame } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';

export const TournamentPage: React.FC = () => {
  const { tournament, settings } = useTournament();

  return (
    <div className="min-h-screen bg-gbl-navy-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gbl-orange-500/10 blur-[130px] pointer-events-none -z-0" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[300px] bg-sky-500/10 blur-[130px] pointer-events-none -z-0" />

      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <img 
              src="/gbl-logo.png" 
              alt="GBL Official Logo" 
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover bg-gbl-navy-950 border-2 border-amber-500/50 p-1 shadow-2xl shadow-amber-500/10" 
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gbl-orange-500/10 border border-gbl-orange-500/30 text-gbl-orange-400 text-xs font-black uppercase tracking-wider">
            <span>OFFICIAL TOURNAMENT GUIDE & DOSSIER</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-sports uppercase tracking-tight">
            ABOUT {tournament.name}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {tournament.description}
          </p>
        </div>

        {/* Highlight Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-800 p-6 rounded-3xl text-center shadow-lg hover:border-gbl-orange-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-gbl-orange-500/15 border border-gbl-orange-500/30 flex items-center justify-center text-gbl-orange-400 mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Tournament Dates</h4>
            <p className="text-sm font-black text-white mt-1.5">{tournament.tournament_dates}</p>
          </div>

          <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-800 p-6 rounded-3xl text-center shadow-lg hover:border-sky-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Live Player Auction</h4>
            <p className="text-sm font-black text-white mt-1.5">{tournament.auction_date}</p>
            <p className="text-xs text-sky-400 font-semibold mt-0.5">{tournament.auction_time}</p>
          </div>

          <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-800 p-6 rounded-3xl text-center shadow-lg hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Championship Venue</h4>
            <p className="text-sm font-black text-white mt-1.5">{tournament.venue}</p>
          </div>

          <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-800 p-6 rounded-3xl text-center shadow-lg hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3">
              <Trophy className="w-6 h-6" />
            </div>
            <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Governing Body</h4>
            <p className="text-sm font-black text-white mt-1.5">{tournament.organizer_name}</p>
          </div>
        </div>

        {/* Tournament Rules & Structure */}
        <div className="bg-gradient-to-b from-gbl-navy-900 to-gbl-navy-950 border border-gbl-navy-700/60 rounded-3xl p-8 sm:p-10 space-y-8 shadow-2xl">
          <div className="border-b border-gbl-navy-800 pb-5">
            <span className="text-[10px] font-black text-gbl-orange-400 uppercase tracking-widest block">LEAGUE GOVERNANCE</span>
            <h3 className="text-2xl font-black text-white font-sports tracking-wide uppercase mt-1">
              TOURNAMENT ARCHITECTURE & REGULATIONS
            </h3>
            <p className="text-xs text-slate-400 mt-1">Official regulations ratified by Gulf Oil Premier League Governing Council.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-300">
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-gbl-orange-400 tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Squad & Bidding Architecture</span>
              </h4>
              <ul className="space-y-3 text-xs leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-gbl-orange-400 shrink-0 mt-0.5" />
                  <span><strong>10 Official Teams</strong> initialized with ₹5,00,000 wallet budget each.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-gbl-orange-400 shrink-0 mt-0.5" />
                  <span>Target squad size of <strong>{settings.required_squad_slots} athletes</strong> (Min: {settings.min_squad_size}, Max: {settings.max_squad_size}).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-gbl-orange-400 shrink-0 mt-0.5" />
                  <span>Strict <strong>Max Legal Bid Guard</strong> reserving ₹{settings.reserve_per_slot.toLocaleString('en-IN')} for each required squad slot.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-2">
                <Tv className="w-4 h-4" />
                <span>Live Arena Technology</span>
              </h4>
              <ul className="space-y-3 text-xs leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>Synchronized <strong>{settings.timer_seconds}-second countdown</strong> on all connected spectator displays and terminals.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>Automated <strong>SOLD & UNSOLD state triggers</strong> at 0 seconds with audio chimes and gongs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>Dedicated <strong>1920x1080 Arena Projector Mode</strong> featuring confetti cannons and live purse tickers.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
