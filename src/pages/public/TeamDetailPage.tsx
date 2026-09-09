import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Wallet, Shield, Award, User } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { formatINR } from '../../lib/currency';
import { getTeamAuctionMetrics } from '../../lib/maxBid';
import { Badge } from '../../components/common/Badge';
import { TeamCategoryBreakdown } from '../../components/common/TeamCategoryBreakdown';

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { teams, players, settings } = useTournament();

  const team = teams.find(t => t.id === id || String(t.team_number) === id);
  if (!team) {
    return (
      <div className="min-h-screen bg-gbl-navy-950 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-white mb-2">Team not found</h2>
        <Link to="/teams" className="text-sm font-semibold text-gbl-orange-400 hover:underline">
          Back to Teams
        </Link>
      </div>
    );
  }

  const squad = players.filter(p => p.sold_team_id === team.id);
  const metrics = getTeamAuctionMetrics(team, squad.length, settings);

  return (
    <div className="min-h-screen bg-gbl-navy-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Teams</span>
        </button>

        {/* Team Banner Card */}
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Left: Emblem & Details */}
            <div className="flex items-center gap-5">
              {team.logo_url ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gbl-navy-950 border border-gbl-navy-700 p-1.5 shadow-xl shrink-0 flex items-center justify-center overflow-hidden">
                  <img 
                    src={team.logo_url} 
                    alt={team.name} 
                    className="w-full h-full object-contain rounded-xl" 
                  />
                </div>
              ) : (
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-xl shrink-0"
                  style={{ backgroundColor: team.team_color }}
                >
                  {team.short_name}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gbl-orange-400 uppercase tracking-wider">
                    Team #{team.team_number}
                  </span>
                  {metrics.ownerIsPlayer ? (
                    <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                      Playing Owner
                    </span>
                  ) : (
                    <span className="px-2 py-0.2 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold uppercase">
                      Non-Playing Owner
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white font-sports uppercase tracking-tight mt-1">
                  {team.name}
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-lg">{team.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-300 mt-3">
                  <span><strong>Team Owner:</strong> {team.owner_name}</span>
                  <span>•</span>
                  <span><strong>Captain:</strong> {team.captain_name}</span>
                </div>
              </div>
            </div>

            {/* Right: Budget Statistics Card */}
            <div className="bg-gbl-navy-950 border border-gbl-navy-800 p-4 rounded-2xl w-full md:w-auto min-w-[240px] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Available Auction Points:</span>
                <span className="font-black text-emerald-400 font-mono text-base">{formatINR(metrics.remainingBalance)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Spent on Players:</span>
                <span className="font-bold text-white font-mono">{formatINR(metrics.totalSpent)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Owner Allocation:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {metrics.ownerAllocation > 0 ? formatINR(metrics.ownerAllocation) : '₹0 (Non-Playing)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Roster Capacity:</span>
                <span className="font-bold text-sky-400">
                  {squad.length} / {team.total_squad_slots || 6} Members
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-gbl-navy-800">
                <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">Max Next Legal Bid:</span>
                <span className="font-black text-amber-400 font-mono text-base">{formatINR(metrics.maxLegalBid)}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Squad Members Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white font-sports uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-gbl-orange-400" />
                <span>
                  OFFICIAL SQUAD ROSTER ({squad.length} / {team.total_squad_slots || 6} Members)
                </span>
              </h2>
            </div>
            <Link
              to={`/team-bid/${team.id}`}
              target="_blank"
              className="px-3.5 py-1.5 rounded-xl bg-gbl-navy-900 border border-sky-500/30 text-sky-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Open Team Portal
            </Link>
          </div>

          {/* Category-Wise Squad Composition Breakdown */}
          <TeamCategoryBreakdown squad={squad} maxSlots={team.total_squad_slots || 6} />

          {squad.length === 0 ? (
            <div className="text-center py-16 bg-gbl-navy-900 border border-gbl-navy-800 rounded-2xl">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No players purchased yet</h3>
              <p className="text-xs text-slate-400 mt-1">This team will acquire players during the live player auction.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {squad.map((player) => {
                const isOwnerPlayer = team.team_number !== 4 && Boolean(
                  (team.owner_name && (
                    player.name.toLowerCase().includes(team.owner_name.toLowerCase()) ||
                    team.owner_name.toLowerCase().includes(player.name.toLowerCase()) ||
                    team.owner_name.toLowerCase().replace(/y/g, 'i').includes(player.name.toLowerCase().replace(/y/g, 'i')) ||
                    player.name.toLowerCase().replace(/y/g, 'i').includes(team.owner_name.toLowerCase().replace(/y/g, 'i'))
                  )) ||
                  (team.team_number === 2 && (player.player_code === 'GBL-041' || player.id === '10000000-0000-0000-0000-000000000041'))
                );
                const playerCat = (player.auction_category || 'NON-MEDALIST').replace('NON-MEDALLIST', 'NON-MEDALIST');
                return (
                  <div
                    key={player.id}
                    className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-2xl p-4 flex flex-col justify-between shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={player.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                        alt={player.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gbl-navy-700 shrink-0"
                      />
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-slate-400">{player.player_code}</span>
                          {isOwnerPlayer && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px] font-black uppercase border border-amber-500/30">
                              Owner
                            </span>
                          )}
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px] font-black uppercase border border-amber-500/40">
                            {playerCat}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate mt-0.5">{player.name}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{player.age ? `${player.age} yrs • ` : ''}{player.eligible_category_names.join(', ')}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gbl-navy-800 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black tracking-wider uppercase">
                          SOLD
                        </span>
                      </div>
                      <span className="font-black text-emerald-400 font-mono text-sm">{formatINR(player.sold_price)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
