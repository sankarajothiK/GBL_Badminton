import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Shield, User, Calendar, Flame } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { formatINR } from '../../lib/currency';
import { Badge } from '../../components/common/Badge';

export const PlayerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { players, teams, categories } = useTournament();

  const player = players.find(p => p.id === id || p.player_code === id);
  if (!player) {
    return (
      <div className="min-h-screen bg-gbl-navy-950 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-white mb-2">Player not found</h2>
        <Link to="/players" className="text-sm font-semibold text-gbl-orange-400 hover:underline">
          Back to Players
        </Link>
      </div>
    );
  }

  const soldTeam = player.sold_team_id ? teams.find(t => t.id === player.sold_team_id) : null;

  return (
    <div className="min-h-screen bg-gbl-navy-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Roster</span>
        </button>

        {/* Profile Card */}
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12">
            
            {/* Left Image Area */}
            <div className="md:col-span-5 relative bg-gbl-navy-950 aspect-[4/5] md:aspect-auto">
              <img
                src={player.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'}
                alt={player.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs font-mono font-bold text-white border border-white/20">
                  {player.player_code}
                </span>
              </div>
            </div>

            {/* Right Information Area */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                
                {/* Status Indicator */}
                <div>
                  {player.auction_status === 'SOLD' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      SOLD in Auction
                    </span>
                  ) : player.auction_status === 'LIVE' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                      Currently Live on Auction Floor
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      Available for Live Auction
                    </span>
                  )}
                </div>

                {/* Name & Basic info */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white font-sports uppercase tracking-tight">
                    {player.name}
                  </h1>
                  <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                    <span className="text-xs text-slate-400 font-semibold">
                      Age: {player.age} Years | Gender: {player.gender}
                    </span>
                    {player.academy && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        Academy: {player.academy}
                      </span>
                    )}
                    {player.tshirt_size && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-gbl-navy-950 text-slate-300 border border-gbl-navy-800">
                        T-Shirt: {player.tshirt_size}
                      </span>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Eligible Categories:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {player.eligible_category_names.map((catName) => (
                      <Badge key={catName} variant="orange" size="md">
                        {catName}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Achievements & Bio */}
                {player.achievements && (
                  <div className="bg-gbl-navy-950/70 border border-gbl-navy-800 p-4 rounded-2xl">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                      Tournament Achievements & Notes
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {player.achievements}
                    </p>
                  </div>
                )}
              </div>

              {/* Auction Result Banner if Sold */}
              {player.auction_status === 'SOLD' && soldTeam && (
                <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Acquired By</span>
                    <h4 className="text-base font-bold text-white">{soldTeam.name}</h4>
                    <p className="text-xs text-slate-400">Owner: {soldTeam.owner_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Winning Bid</span>
                    <p className="text-xl font-black text-emerald-400">{formatINR(player.sold_price)}</p>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
