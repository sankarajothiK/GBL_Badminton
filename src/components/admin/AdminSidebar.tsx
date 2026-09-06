import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  Shield, 
  Users, 
  Layers, 
  Flame, 
  History, 
  Trophy, 
  ListOrdered, 
  Image as ImageIcon, 
  UserCheck, 
  Sliders, 
  Tv, 
  ExternalLink,
  Radio
} from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import { useTournament } from '../../contexts/TournamentContext';

export const AdminSidebar: React.FC = () => {
  const { status, timerSeconds } = useAuction();
  const { isRealtimeConnected } = useTournament();

  const links = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Live Auction', path: '/admin/auction', icon: Flame, badge: status === 'LIVE' ? `${timerSeconds}s` : undefined, isAuction: true },
    { name: 'Auction History', path: '/admin/history', icon: History },
    { name: 'Teams (10)', path: '/admin/teams', icon: Shield },
    { name: 'Players Roster', path: '/admin/players', icon: Users },
    { name: 'Categories & Bidding', path: '/admin/categories', icon: Layers },
    { name: 'Tournament Settings', path: '/admin/tournament', icon: Settings },
    { name: 'Match Results', path: '/admin/results', icon: Trophy },
    { name: 'Standings & Qualifiers', path: '/admin/standings', icon: ListOrdered },
    { name: 'Media / Gallery', path: '/admin/gallery', icon: ImageIcon },
    { name: 'Admin Users', path: '/admin/users', icon: UserCheck },
    { name: 'System Settings', path: '/admin/settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-gbl-navy-950 border-r border-gbl-navy-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-gbl-navy-800 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gbl-orange-500 to-amber-500 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-gbl-navy-950 rounded-[6px] flex items-center justify-center">
              <span className="font-extrabold text-xs text-gbl-orange-500 font-sports">GBL</span>
            </div>
          </div>
          <div>
            <h1 className="text-white font-extrabold text-sm tracking-tight font-sports">GBL ADMIN</h1>
            <p className="text-[10px] text-gbl-orange-400 font-semibold tracking-wider uppercase">Command Center</p>
          </div>
        </Link>

        {/* Realtime Status Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LIVE</span>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? item.isAuction
                      ? 'bg-gbl-orange-600 text-white shadow-lg shadow-gbl-orange-600/30'
                      : 'bg-gbl-navy-900 text-gbl-orange-400 border border-gbl-navy-700'
                    : item.isAuction && status === 'LIVE'
                    ? 'text-gbl-orange-400 bg-gbl-orange-500/10 border border-gbl-orange-500/30 hover:bg-gbl-orange-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-gbl-navy-900/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${item.isAuction && status === 'LIVE' ? 'animate-pulse text-gbl-orange-400' : ''}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Quick Launchers */}
      <div className="p-4 border-t border-gbl-navy-800 space-y-2">
        <Link
          to="/projector"
          target="_blank"
          className="w-full py-2.5 px-3 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <Tv className="w-4 h-4" />
          <span>Launch Projector (1080p)</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </Link>

        <Link
          to="/"
          target="_blank"
          className="w-full py-2 px-3 bg-gbl-navy-900 hover:bg-gbl-navy-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 border border-gbl-navy-700 transition-colors"
        >
          <span>View Public Website</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </Link>
      </div>
    </aside>
  );
};
