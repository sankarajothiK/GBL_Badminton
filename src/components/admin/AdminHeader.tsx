import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  LogOut, 
  Volume2, 
  VolumeX, 
  Radio, 
  Tv, 
  User, 
  RotateCcw,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTournament } from '../../contexts/TournamentContext';
import { useAuction } from '../../contexts/AuctionContext';
import { sounds } from '../../lib/sound';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title, subtitle, actions }) => {
  const navigate = useNavigate();
  const { currentUser, role, logout } = useAuth();
  const { tournament, isCloudConnected, cloudSyncStatus } = useTournament();
  const { status, timerSeconds } = useAuction();
  const [audioEnabled, setAudioEnabled] = useState(sounds.isEnabled());

  const toggleAudio = () => {
    const next = !audioEnabled;
    sounds.setEnabled(next);
    setAudioEnabled(next);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <header className="bg-gbl-navy-950/80 backdrop-blur-md border-b border-gbl-navy-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-40">
      <div>
        <div className="flex items-center gap-3">
          <img 
            src="/gbl-logo.png" 
            alt="GBL Logo" 
            className="w-9 h-9 rounded-xl object-contain bg-gbl-navy-900 border border-amber-500/30 p-0.5 shadow-sm shrink-0" 
          />
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white font-sports tracking-wide leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {status === 'LIVE' && (
            <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold animate-pulse flex items-center gap-1.5 ml-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              LIVE AUCTION ({timerSeconds}s)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Optional Page Action Buttons */}
        {actions}

        {/* Central Cloud DB Indicator */}
        <button
          onClick={() => navigate('/admin/settings')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isCloudConnected 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
          }`}
          title={isCloudConnected ? "Central Cloud DB connected & syncing" : "Central Cloud DB offline (running local mode). Click to configure key in Settings."}
        >
          <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="hidden sm:inline font-bold">
            {isCloudConnected ? 'Cloud DB Synced' : 'Cloud DB Offline'}
          </span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={toggleAudio}
          className="p-2 rounded-xl bg-gbl-navy-900 border border-gbl-navy-700 text-slate-300 hover:text-white hover:border-gbl-orange-500 transition-colors"
          title={audioEnabled ? "Mute audio sound effects" : "Enable sound effects"}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4 text-gbl-orange-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-gbl-navy-900 border border-gbl-navy-700">
          <div className="w-7 h-7 rounded-lg bg-gbl-orange-500/20 text-gbl-orange-400 flex items-center justify-center font-bold text-xs">
            {currentUser?.full_name?.charAt(0) || 'A'}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white leading-tight">{currentUser?.full_name || 'Admin User'}</p>
            <p className="text-[10px] font-semibold text-gbl-orange-400 uppercase leading-none mt-0.5">{role}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl bg-gbl-navy-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-gbl-navy-700 hover:border-rose-500/40 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
