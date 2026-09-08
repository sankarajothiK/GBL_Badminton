import React, { useState } from 'react';
import { History, Download, Filter, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { useAuction } from '../../contexts/AuctionContext';
import { formatINR } from '../../lib/currency';
import { exportAuctionHistoryCSV } from '../../lib/csv';
import { Badge } from '../../components/common/Badge';

export const AdminAuctionHistory: React.FC = () => {
  const { players, teams, categories } = useTournament();
  const { bidHistory } = useAuction();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const teamMap = new Map(teams.map(t => [t.id, t]));

  // Historical auction records derived from auctioned players and bids
  const historyRecords = players
    .filter(p => p.auction_status === 'SOLD' || p.auction_status === 'UNSOLD')
    .map(p => {
      const soldTeam = p.sold_team_id ? teamMap.get(p.sold_team_id) : null;
      const primaryCategory = p.eligible_category_names[0] || 'OPEN';
      const catObj = categories.find(c => c.name.toLowerCase() === primaryCategory.toLowerCase());

      return {
        id: p.id,
        playerName: p.name,
        playerCode: p.player_code,
        category: primaryCategory,
        startingBid: (catObj?.starting_bid && catObj.starting_bid > 0) ? catObj.starting_bid : 30000,
        finalBid: p.sold_price || 0,
        winningTeamName: soldTeam?.name || 'None',
        winningTeamColor: soldTeam?.team_color,
        status: p.auction_status,
        timestamp: p.updated_at || p.created_at
      };
    });

  const filtered = historyRecords.filter(r => {
    const matchesSearch = r.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.playerCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
    const matchesTeam = selectedTeam === 'ALL' || r.winningTeamName === selectedTeam;
    const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    return matchesSearch && matchesCat && matchesTeam && matchesStatus;
  });

  const handleExportCSV = () => {
    // Transform history records into format for export (strictly deduplicated)
    const seenIds = new Set<string>();
    const exportable = bidHistory.filter(b => {
      if (!b || !b.id || seenIds.has(b.id)) return false;
      seenIds.add(b.id);
      return true;
    }).map(b => ({
      ...b,
      playerName: players.find(p => p.id === b.auction_id)?.name || 'Player'
    }));
    exportAuctionHistoryCSV(exportable);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-sports tracking-wide">AUCTION LOGS & HISTORY</h1>
          <p className="text-xs text-slate-400">Complete historical record of all player auctions, bids, and transactions</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-gbl-navy-900 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-lg"
        >
          <Download className="w-4 h-4 text-gbl-orange-400" />
          <span>Export History CSV</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-gbl-navy-900 border border-gbl-navy-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by player name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-gbl-orange-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gbl-navy-950 border border-gbl-navy-700 text-xs rounded-xl px-3 py-2 text-white focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Team Filter */}
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="bg-gbl-navy-950 border border-gbl-navy-700 text-xs rounded-xl px-3 py-2 text-white focus:outline-none"
          >
            <option value="ALL">All Teams</option>
            {teams.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-gbl-navy-950 border border-gbl-navy-700 text-xs rounded-xl px-3 py-2 text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SOLD">SOLD</option>
            <option value="UNSOLD">UNSOLD</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gbl-navy-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-gbl-navy-800">
              <tr>
                <th className="p-4">Player</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Starting Bid</th>
                <th className="p-4 text-right">Final Bid</th>
                <th className="p-4">Winning Team</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gbl-navy-800 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No matching auction history records found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gbl-navy-800/40 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-white block">{r.playerName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{r.playerCode}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant="orange" size="sm">{r.category}</Badge>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-400">
                      {formatINR(r.startingBid)}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {r.finalBid > 0 ? formatINR(r.finalBid) : '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {r.winningTeamColor && (
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.winningTeamColor }} />
                        )}
                        <span className="font-semibold text-white">{r.winningTeamName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {r.status === 'SOLD' ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          SOLD
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400">
                          UNSOLD
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right text-[11px] text-slate-400 font-mono">
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
