import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Flame, 
  Calendar, 
  Award, 
  Tv, 
  ShieldCheck, 
  Menu, 
  X, 
  Volume2, 
  VolumeX, 
  Zap, 
  Radio, 
  ChevronDown, 
  ChevronRight,
  Shield,
  BarChart3,
  HelpCircle,
  Image,
  Mail
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAuction } from '../../contexts/AuctionContext';
import { sounds } from '../../lib/sound';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { status, timerSeconds } = useAuction();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(sounds.isEnabled());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleAudio = () => {
    const next = !audioEnabled;
    sounds.setEnabled(next);
    setAudioEnabled(next);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // EXACTLY 5 PRIMARY NAVIGATION HEADERS (Clean, uncluttered, spacious)
  const primaryLinks = [
    { name: 'Home', path: '/' },
    { name: 'Teams', path: '/teams' },
    { name: 'Players', path: '/players' },
    { name: 'Matches', path: '/results' },
    { name: 'Live Auction', path: '/auction', isAuction: true },
  ];

  // Secondary links nested in "More"
  const secondaryLinks = [
    { name: 'Points Table & Standings', path: '/standings', icon: BarChart3 },
    { name: 'Tournament Dossier', path: '/tournament', icon: Trophy },
    { name: 'Team Bidding Portal', path: '/team-bid', icon: Shield },
    { name: 'Official Rules & Format', path: '/rules', icon: HelpCircle },
    { name: 'Photo Gallery', path: '/gallery', icon: Image },
    { name: 'Contact Organizers', path: '/contact', icon: Mail },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const isMoreActive = secondaryLinks.some(link => location.pathname.startsWith(link.path));

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-gbl-navy-950/95 border-b border-gbl-navy-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
      
      {/* Top Sponsor & Live Telemetry Strip - Optimized for all mobile screen sizes */}
      <div className="bg-gradient-to-r from-gbl-navy-950 via-gbl-navy-900 to-gbl-navy-950 border-b border-gbl-navy-800/60 px-3 sm:px-8 py-1.5 text-[10px] sm:text-[11px] font-bold text-slate-300 flex justify-between items-center tracking-wider uppercase overflow-hidden">
        <div className="flex items-center gap-2 truncate">
          <div className="flex items-center gap-1 bg-gbl-orange-500/10 border border-gbl-orange-500/30 px-1.5 sm:px-2 py-0.5 rounded text-gbl-orange-400 text-[9px] sm:text-[10px] font-black shrink-0">
            <span>SPONSOR</span>
          </div>
          <span className="truncate text-slate-300 hidden md:inline">
            GULF OIL LUBRICANTS INDIA • GOKULAM TRADERS • BADMINTON PREMIER LEAGUE 2026
          </span>
          <span className="truncate text-slate-300 md:hidden">
            GULF OIL • GOKULAM TRADERS
          </span>
        </div>
        
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {status === 'LIVE' ? (
            <span className="flex items-center gap-1 bg-red-500/20 text-red-300 px-2 sm:px-3 py-0.5 rounded-full border border-red-500/50 shadow-sm animate-pulse text-[9px] sm:text-[11px]">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-black">LIVE ({timerSeconds}s)</span>
            </span>
          ) : (
            <span className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>ARENA READY</span>
            </span>
          )}
          
          <Link 
            to="/projector" 
            target="_blank" 
            className="hover:text-sky-400 text-slate-300 flex items-center gap-1 transition-colors font-bold text-[10px] sm:text-xs"
            title="Launch 1080p Arena LED Display"
          >
            <Tv className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-sky-400" /> 
            <span className="hidden sm:inline">Projector</span>
          </Link>
          
          <button 
            onClick={toggleAudio} 
            title={audioEnabled ? "Mute sound effects" : "Unmute sound effects"}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 p-1 min-w-[28px] min-h-[28px] justify-center"
            aria-label="Toggle Sound"
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 opacity-50" />}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* GBL Brand Crest */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0">
            <div className="relative">
              <img
                src="/gbl-logo.png"
                alt="GBL Official Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl object-cover bg-gbl-navy-950 p-0.5 border border-amber-500/40 shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-all"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gbl-orange-500 border-2 border-gbl-navy-950 flex items-center justify-center shadow-md">
                <Zap className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-white font-sports leading-none">GBL</span>
                <span className="text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 bg-gbl-orange-500/20 text-gbl-orange-400 rounded border border-gbl-orange-500/30 uppercase tracking-wider">
                  PREMIER LEAGUE
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">Gulf Oil Badminton</p>
            </div>
          </Link>

          {/* 5 CLEAN DESKTOP NAVIGATION HEADERS */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5">
            {primaryLinks.map((link) => {
              const active = isActive(link.path);

              if (link.isAuction) {
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`relative px-4 lg:px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      active
                        ? 'bg-gradient-to-r from-gbl-orange-600 via-gbl-orange-500 to-amber-500 text-white shadow-xl shadow-gbl-orange-500/30 ring-2 ring-gbl-orange-500/40'
                        : 'bg-gbl-orange-500/10 text-gbl-orange-400 border border-gbl-orange-500/40 hover:bg-gbl-orange-500 hover:text-white hover:shadow-lg'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-white animate-pulse" />
                    <span>{link.name}</span>
                    {status === 'LIVE' && (
                      <span className="w-2 h-2 rounded-full bg-white animate-ping ml-0.5" />
                    )}
                  </Link>
                );
              }

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 lg:px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    active
                      ? 'text-white bg-gbl-navy-900 border border-gbl-orange-500/50 shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-gbl-navy-900/60'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Clean "More" Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  isMoreActive
                    ? 'text-gbl-orange-400 bg-gbl-navy-900 border border-gbl-orange-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-gbl-navy-900/60'
                }`}
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-gbl-navy-900 border border-gbl-navy-700/70 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="space-y-1">
                    {secondaryLinks.map((item) => {
                      const Icon = item.icon;
                      const active = location.pathname.startsWith(item.path);

                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setMoreDropdownOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            active
                              ? 'bg-gbl-orange-500 text-white font-bold'
                              : 'text-slate-300 hover:bg-gbl-navy-950 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gbl-orange-400'}`} />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action: Admin Access on desktop */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <Link
                to="/admin"
                className="px-3.5 lg:px-4 py-2 rounded-xl bg-gradient-to-r from-gbl-navy-900 to-gbl-navy-800 hover:from-gbl-navy-800 hover:to-gbl-navy-700 border border-gbl-orange-500/40 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-gbl-orange-400" />
                <span>Console</span>
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="px-3.5 lg:px-4 py-2 rounded-xl bg-gbl-navy-900/80 hover:bg-gbl-navy-800 border border-gbl-navy-700 hover:border-gbl-orange-500/40 text-slate-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
              >
                Admin Login
              </Link>
            )}
          </div>

          {/* Mobile Quick Action Buttons & Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/auction"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-gbl-orange-600 to-amber-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              <span>Live</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-gbl-navy-900 border border-gbl-navy-700 text-slate-200 hover:text-white active:bg-gbl-navy-800 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu - Fluid & Touch Friendly */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gbl-navy-950/98 backdrop-blur-3xl border-b border-gbl-navy-800 px-4 pt-3 pb-6 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-2 mb-1">
              MAIN NAVIGATION
            </span>
            <div className="grid grid-cols-1 gap-1">
              {primaryLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between min-h-[44px] ${
                    isActive(link.path)
                      ? 'bg-gbl-orange-500 text-white shadow-lg font-black'
                      : 'text-slate-300 hover:bg-gbl-navy-900 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {link.isAuction && <Flame className="w-4 h-4 text-white" />}
                    <span>{link.name}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-gbl-navy-800/80">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-2 mb-1">
              ADDITIONAL PAGES
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {secondaryLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2.5 rounded-xl text-[11px] font-semibold text-slate-300 hover:bg-gbl-navy-900 hover:text-white bg-gbl-navy-950 border border-gbl-navy-800/80 flex items-center gap-2 truncate min-h-[40px]"
                  >
                    <Icon className="w-3.5 h-3.5 text-gbl-orange-400 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2 border-t border-gbl-navy-800/80">
            <Link
              to="/projector"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-3 rounded-xl bg-sky-950/50 border border-sky-500/40 text-sky-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Tv className="w-4 h-4" />
              <span>Open 1080p Arena Projector</span>
            </Link>
            
            <Link
              to={isAuthenticated ? "/admin" : "/admin/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-3 rounded-xl bg-gradient-to-r from-gbl-orange-600 via-gbl-orange-500 to-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-gbl-orange-500/25 min-h-[44px] flex items-center justify-center"
            >
              {isAuthenticated ? "Go to Admin Dashboard" : "Admin Login Portal"}
            </Link>
          </div>
        </div>
      )}

    </header>
  );
};
