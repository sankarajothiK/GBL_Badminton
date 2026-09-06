import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Zap, 
  X, 
  LayoutDashboard, 
  Gavel, 
  Users, 
  User, 
  Trophy, 
  MonitorPlay, 
  Maximize2, 
  Menu, 
  Bell, 
  ShieldCheck, 
  Wallet,
  MoreHorizontal,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import { useAuth } from '../../contexts/AuthContext';
import { sounds } from '../../lib/sound';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const { status, timerSeconds } = useAuction();
  const { isAuthenticated, currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(sounds.isEnabled());

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleAudio = () => {
    const next = !audioEnabled;
    sounds.setEnabled(next);
    setAudioEnabled(next);
  };

  // Determine current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/auction')) return 'Live Auction';
    if (path.startsWith('/teams')) return 'Official Teams';
    if (path.startsWith('/players')) return 'Players Pool';
    if (path.startsWith('/standings')) return 'Standings & Table';
    if (path.startsWith('/results')) return 'Tournament Results';
    if (path.startsWith('/team-bid')) return 'Team Console';
    if (path.startsWith('/tournament')) return 'Tournament Dossier';
    if (path.startsWith('/rules')) return 'Rules & Format';
    if (path.startsWith('/gallery')) return 'Photo Gallery';
    if (path.startsWith('/contact')) return 'Contact Desk';
    return 'League Command';
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Live auction', path: '/auction', icon: Gavel, hasLiveBadge: true },
    { label: 'Teams', path: '/teams', icon: Users },
    { label: 'Players', path: '/players', icon: User },
    { label: 'Results & standings', path: '/standings', icon: Trophy },
  ];

  const viewItems = [
    { label: 'Projector preview', path: '/projector', icon: MonitorPlay, isExternal: true },
    { label: 'Team Console', path: '/team-bid', icon: Wallet },
    { label: 'Admin command', path: '/admin', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#edf0eb] text-slate-950 selection:bg-lime-300 selection:text-lime-950">
      
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Fixed / Responsive Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-white/10 bg-[#101a1d] px-4 py-5 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-3">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300 text-lime-950 shadow-[0_0_0_5px_rgba(190,242,100,.08)]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div className="text-left">
              <div className="text-lg font-black tracking-[-0.08em]">
                GBL<span className="text-lime-300">.</span>
              </div>
              <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">
                League command
              </div>
            </div>
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section: Workspace */}
        <div className="mt-8 px-3">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
            Workspace
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                  isActive 
                    ? 'bg-lime-300 text-lime-950 shadow-sm' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'stroke-[2.8]' : ''}`} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.hasLiveBadge && (
                  <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Section: Views */}
        <div className="mt-7 px-3">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
            Views
          </div>
        </div>

        <div className="space-y-1">
          {viewItems.map((item) => {
            const Icon = item.icon;
            if (item.isExternal) {
              return (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  <Maximize2 className="w-3.5 h-3.5 opacity-60" />
                </a>
              );
            }

            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                  isActive 
                    ? 'bg-lime-300 text-lime-950' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom Profile Pill */}
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[11px] font-black tracking-tight bg-lime-300 text-lime-950">
              {currentUser?.full_name ? currentUser.full_name.slice(0, 2).toUpperCase() : 'AM'}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-xs font-black text-white group-hover:text-lime-300 transition-colors">
                {currentUser?.full_name || 'Aarav Mehta'}
              </div>
              <div className="mt-0.5 text-[10px] font-semibold text-slate-500">
                {currentUser?.role || 'Super admin'}
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-slate-500" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-h-screen lg:pl-[248px] flex flex-col justify-between">
        
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-[#edf0eb]/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-800 shadow-sm border border-slate-200/60 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-500">GBL / Season 04</p>
              <h1 className="text-xl font-black tracking-[-0.05em] text-slate-950">{getPageTitle()}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Indicator Pill */}
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-700 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              All systems live
            </div>

            {/* Sound Mute/Unmute Toggle */}
            <button
              onClick={toggleAudio}
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-950 shadow-sm transition-colors"
              title={audioEnabled ? 'Mute Sounds' : 'Enable Sounds'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Notification Bell */}
            <button 
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-950 shadow-sm transition-colors" 
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>

            {/* Projector Button */}
            <Link
              to="/projector"
              target="_blank"
              className="hidden items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-slate-800 sm:flex"
            >
              <MonitorPlay className="w-4 h-4" />
              <span>Projector</span>
            </Link>
          </div>
        </header>

        {/* Page Content Outlet */}
        <div className="flex-1">
          <Outlet />
        </div>

        {/* Bottom Micro Footer */}
        <footer className="border-t border-slate-200/80 bg-white/40 py-4 px-5 sm:px-8 lg:px-10 text-xs font-semibold text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 Gulf Oil Badminton Premier League (GBL). All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/tournament" className="hover:text-slate-950">Dossier</Link>
            <Link to="/rules" className="hover:text-slate-950">Rules</Link>
            <Link to="/team-bid" className="hover:text-slate-950">Team Console</Link>
            <Link to="/admin" className="hover:text-slate-950">Admin</Link>
          </div>
        </footer>
      </main>
    </div>
  );
};
