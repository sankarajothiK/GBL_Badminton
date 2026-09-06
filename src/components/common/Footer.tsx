import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Facebook, Youtube, Trophy, ShieldCheck, Tv } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';

export const Footer: React.FC = () => {
  const { tournament } = useTournament();

  return (
    <footer className="bg-gbl-navy-950 border-t border-gbl-navy-800/80 pt-16 pb-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/gbl-logo.png" 
                alt="GBL Official Logo" 
                className="w-12 h-12 rounded-xl object-contain bg-gbl-navy-900 border border-amber-500/40 p-0.5 shadow-lg shrink-0" 
              />
              <div>
                <h3 className="text-white font-extrabold text-lg tracking-tight font-sports">GBL PREMIER LEAGUE</h3>
                <p className="text-xs text-gbl-orange-400 font-semibold">{tournament.season}</p>
              </div>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Gulf Oil Badminton Premier League brings together 10 powerhouse teams, elite national talent, and a thrilling live player auction for the ultimate badminton championship.
            </p>
            <div className="pt-2 flex items-center gap-3 text-slate-400">
              <a href={tournament.social_instagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-gbl-navy-900 border border-gbl-navy-800 flex items-center justify-center hover:text-gbl-orange-400 hover:border-gbl-orange-500/50 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={tournament.social_facebook} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-gbl-navy-900 border border-gbl-navy-800 flex items-center justify-center hover:text-gbl-orange-400 hover:border-gbl-orange-500/50 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href={tournament.social_youtube} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-gbl-navy-900 border border-gbl-navy-800 flex items-center justify-center hover:text-gbl-orange-400 hover:border-gbl-orange-500/50 transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gbl-orange-500" />
              <span>Tournament Links</span>
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link to="/" className="hover:text-gbl-orange-400 transition-colors">Home Page</Link>
              </li>
              <li>
                <Link to="/tournament" className="hover:text-gbl-orange-400 transition-colors">About Tournament</Link>
              </li>
              <li>
                <Link to="/players" className="hover:text-gbl-orange-400 transition-colors">Registered Players</Link>
              </li>
              <li>
                <Link to="/teams" className="hover:text-gbl-orange-400 transition-colors">10 Tournament Teams</Link>
              </li>
              <li>
                <Link to="/auction" className="text-gbl-orange-400 hover:text-gbl-orange-300 transition-colors font-bold">Live Auction Portal</Link>
              </li>
              <li>
                <Link to="/results" className="hover:text-gbl-orange-400 transition-colors">Match Results</Link>
              </li>
              <li>
                <Link to="/standings" className="hover:text-gbl-orange-400 transition-colors">Points Table & Standings</Link>
              </li>
            </ul>
          </div>

          {/* Tournament Guidelines & Displays */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Tv className="w-4 h-4 text-sky-400" />
              <span>Displays & Rules</span>
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link to="/projector" target="_blank" className="hover:text-sky-400 text-sky-400 font-semibold transition-colors flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5" /> Fullscreen Projector (1080p)
                </Link>
              </li>
              <li>
                <Link to="/rules" className="hover:text-gbl-orange-400 transition-colors">Official Rules & Categories</Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-gbl-orange-400 transition-colors">Tournament Photo Gallery</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-gbl-orange-400 transition-colors">Contact Organizers</Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-gbl-orange-400 transition-colors flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Admin Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Venue & Contacts */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gbl-orange-500" />
              <span>Venue & Contact</span>
            </h4>
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gbl-orange-400 shrink-0 mt-0.5" />
                <span>{tournament.venue}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gbl-orange-400 shrink-0" />
                <span>{tournament.contact_phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gbl-orange-400 shrink-0" />
                <span>{tournament.contact_email}</span>
              </div>
              <div className="pt-2">
                <p className="text-[11px] text-slate-400">Tournament Dates:</p>
                <p className="text-xs font-semibold text-white">{tournament.tournament_dates}</p>
                <p className="text-[11px] text-slate-400 mt-1">Auction Date:</p>
                <p className="text-xs font-semibold text-gbl-orange-400">{tournament.auction_date} ({tournament.auction_time})</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-gbl-navy-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <p>© {new Date().getFullYear()} Gulf Oil Badminton Premier League (GBL). All Rights Reserved.</p>
          <p className="flex items-center gap-1.5">
            <span>Powered by</span>
            <span className="font-bold text-white tracking-wide">GULF OIL LUBRICANTS INDIA LTD.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
