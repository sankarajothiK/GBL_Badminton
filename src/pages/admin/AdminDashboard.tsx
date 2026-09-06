import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Flame, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Tv, 
  Settings, 
  History, 
  Sliders, 
  Layers, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { useAuction } from '../../contexts/AuctionContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatINR, formatCompactINR } from '../../lib/currency';
import { SetupWizard } from '../../components/admin/SetupWizard';
import { TeamAllocationSummaryTable } from '../../components/admin/TeamAllocationSummaryTable';

export const AdminDashboard: React.FC = () => {
  const { tournament, teams, players, categories, settings } = useTournament();
  const { status, currentAuction, currentPlayer, highestTeam, timerSeconds } = useAuction();
  const { role } = useAuth();

  const [showSetupWizard, setShowSetupWizard] = useState(() => {
    return localStorage.getItem('gbl_setup_wizard_completed') !== 'true';
  });

  const totalPointsSpent = teams.reduce((acc, t) => acc + (t.total_spent || 0), 0);
  const totalPurse = teams.reduce((acc, t) => acc + (t.initial_budget || 500000), 0);
  const remainingPoints = teams.reduce((acc, t) => acc + (t.current_balance || 0), 0);

  const soldCount = players.filter(p => p.auction_status === 'SOLD').length;
  const unsoldCount = players.filter(p => p.auction_status === 'UNSOLD').length;

  if (showSetupWizard) {
    return (
      <div className="p-6">
        <div className="mb-4 flex justify-between items-center max-w-4xl mx-auto">
          <button
            onClick={() => {
              localStorage.setItem('gbl_setup_wizard_completed', 'true');
              setShowSetupWizard(false);
            }}
            className="text-xs text-slate-400 hover:text-white"
          >
            Skip setup wizard →
          </button>
        </div>
        <SetupWizard onComplete={() => setShowSetupWizard(false)} />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-gbl-navy-900 via-gbl-navy-800 to-gbl-navy-900 border border-gbl-navy-700 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gbl-orange-500/20 text-gbl-orange-400 border border-gbl-orange-500/40 text-xs font-bold uppercase tracking-wider">
              {tournament.season}
            </span>
            <span className="text-xs text-slate-400 font-semibold">• {role}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-sports uppercase tracking-tight">
            GBL TOURNAMENT CONTROL HUB
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Live player auction engine, 10 team purse balances, player rosters, and real-time projector synchronization.
          </p>
        </div>

        {/* Quick Launch Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <Link
            to="/admin/auction"
            className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-gradient-to-r from-gbl-orange-600 to-gbl-orange-500 hover:from-gbl-orange-500 hover:to-gbl-orange-400 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-gbl-orange-500/30 transition-all"
          >
            <Flame className="w-4 h-4 text-white animate-pulse" />
            <span>Live Auction Room</span>
          </Link>

          <Link
            to="/projector"
            target="_blank"
            className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-colors"
          >
            <Tv className="w-4 h-4" />
            <span>Launch Projector</span>
          </Link>
        </div>
      </div>

      {/* DASHBOARD STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Teams */}
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Teams</span>
            <Shield className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-3xl font-black text-white font-sports mt-2">{teams.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">10 Editable Records Initialized</p>
        </div>

        {/* Total Players */}
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Players</span>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white font-sports mt-2">{players.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across 7 Competition Tiers</p>
        </div>

        {/* Sold / Unsold Breakdown */}
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sold vs Unsold</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-400 font-sports">{soldCount}</span>
            <span className="text-xs text-slate-400">sold / {unsoldCount} unsold</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {Math.round((soldCount / (players.length || 1)) * 100)}% Auction Completed
          </p>
        </div>

        {/* Total Points Spent */}
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Auction Purse Spent</span>
            <Wallet className="w-5 h-5 text-gbl-orange-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-2">{formatINR(totalPointsSpent)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Remaining: {formatINR(remainingPoints)}</p>
        </div>
      </div>

      {/* CURRENT AUCTION STATUS WIDGET */}
      <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 shadow-xl">
        <div className="flex justify-between items-center pb-4 border-b border-gbl-navy-800">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status === 'LIVE' ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`} />
            <h2 className="text-lg font-bold text-white font-sports uppercase tracking-wider">
              CURRENT LIVE AUCTION STAGE
            </h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
            status === 'LIVE' ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' :
            status === 'SOLD' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
            'bg-slate-800 text-slate-300'
          }`}>
            STATUS: {status}
          </span>
        </div>

        {status === 'LIVE' || status === 'PAUSED' ? (
          currentPlayer ? (
            <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="flex items-center gap-4">
                <img
                  src={currentPlayer.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt={currentPlayer.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-gbl-navy-700"
                />
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400">{currentPlayer.player_code}</span>
                  <h3 className="text-base font-bold text-white">{currentPlayer.name}</h3>
                  <p className="text-xs text-gbl-orange-400 font-semibold">{currentPlayer.eligible_category_names.join(', ')}</p>
                </div>
              </div>

              <div className="text-center p-3 bg-gbl-navy-950 rounded-2xl border border-gbl-navy-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Leading Bid</span>
                <p className="text-2xl font-black text-emerald-400 font-mono">
                  {formatINR(currentAuction?.current_bid || currentAuction?.starting_bid)}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {highestTeam ? highestTeam.name : 'No bids placed yet'}
                </p>
              </div>

              <div className="flex items-center justify-center md:justify-end gap-3">
                <div className="text-center px-4 py-2 bg-gbl-navy-950 rounded-2xl border border-gbl-navy-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Clock</span>
                  <span className="text-2xl font-black font-mono text-gbl-orange-400">{timerSeconds}s</span>
                </div>
                <Link
                  to="/admin/auction"
                  className="px-4 py-3 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Manage Live
                </Link>
              </div>
            </div>
          ) : null
        ) : (
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>No player is currently on the auction floor. Choose an eligible player from the live console to begin.</p>
            <Link
              to="/admin/auction"
              className="px-4 py-2 rounded-xl bg-gbl-navy-950 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-white font-bold uppercase tracking-wider transition-colors"
            >
              Open Auction Console →
            </Link>
          </div>
        )}
      </div>

      {/* 10 TEAMS PURSE & OWNER ALLOCATION SUMMARY */}
      <TeamAllocationSummaryTable />

    </div>
  );
};
