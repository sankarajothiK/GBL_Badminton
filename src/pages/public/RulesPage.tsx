import React from 'react';
import { BookOpen, Shield, Clock, Calculator, Flame, Award, AlertTriangle } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { formatINR } from '../../lib/currency';
import { Badge } from '../../components/common/Badge';

export const RulesPage: React.FC = () => {
  const { categories, settings } = useTournament();

  return (
    <div className="min-h-screen bg-gbl-navy-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-gbl-orange-400 uppercase tracking-wider">Governing Charter</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-sports uppercase tracking-tight">
            OFFICIAL TOURNAMENT & AUCTION RULES
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
            Governing rules, bidding limits, squad compositions, and category classifications for GBL 2026.
          </p>
        </div>

        {/* 1. AUCTION TIMING & BIDDING ENGINE RULES */}
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-gbl-navy-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-gbl-orange-500/20 text-gbl-orange-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-sports">20-SECOND SYNCHRONIZED AUCTION TIMER</h2>
              <p className="text-xs text-slate-400">Strict server-timestamp synchronized countdown mechanism</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
            <div className="space-y-3">
              <p>• <strong>Starting Clock:</strong> Every auction round commences at <strong>{settings.timer_seconds || 20} seconds</strong> when called by the chief auctioneer.</p>
              <p>• <strong>Reset Rule:</strong> Every valid bid placed by any team resets the countdown timer immediately back to <strong>{settings.timer_seconds || 20} seconds</strong> on every connected laptop, phone, and projector.</p>
              <p>• <strong>Automatic SOLD:</strong> When the timer counts down to 0 and a valid bid exists, the platform automatically strikes the gavel, marks the player <strong>SOLD</strong>, and deducts the purse from the winning team.</p>
            </div>
            <div className="space-y-3">
              <p>• <strong>Automatic UNSOLD:</strong> If the 20-second timer expires with zero bids, the player is automatically recorded as <strong>UNSOLD</strong> and retained for subsequent re-auction rounds.</p>
              <p>• <strong>Urgency Alerts:</strong> At 5 seconds remaining, all screens flash high-contrast visual alerts and audio warning ticks intensify.</p>
              <p>• <strong>Immutable Audit:</strong> Every bid, undo, and edit is timestamped in the audit log.</p>
            </div>
          </div>
        </div>

        {/* 2. MAXIMUM LEGAL BID CALCULATION */}
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-gbl-navy-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-sports">MAXIMUM LEGAL BID SQUAD PROTECTION RULE</h2>
              <p className="text-xs text-slate-400">Protects teams from overspending and stranding unfilled squad spots</p>
            </div>
          </div>

          <div className="bg-gbl-navy-950 border border-gbl-navy-800 rounded-2xl p-5 space-y-3">
            <p className="text-xs text-slate-300">
              To guarantee every team can fulfill their roster requirement of <strong>6 total members (1 Team Owner + 5 Auctioned Players)</strong>, the platform enforces:
            </p>
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-center">
              <span className="font-mono text-sm sm:text-base font-bold text-emerald-400">
                MAX LEGAL BID = Current Balance - (Remaining Players to Buy × ₹30,000)
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard reserve per unfilled player slot: <strong className="text-white">₹30,000</strong>. (From the initial 5,00,000 points, 30,000 is reserved for the Team Owner, leaving 4,70,000 usable player points). The live console immediately disables bid buttons for any team if the bid amount would exceed their maximum legal bid.
            </p>
          </div>
        </div>

        {/* 3. OWNER DOUBLE DEDUCTION RULE */}
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-gbl-navy-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-sports">OWNER DOUBLE DEDUCTION RULES</h2>
              <p className="text-xs text-slate-400">Category-based deduction allowances for team owner pairings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gbl-navy-950 p-4 rounded-xl border border-gbl-navy-800 text-center">
              <span className="text-xs text-slate-400 uppercase font-semibold">OPEN Category</span>
              <p className="text-xl font-black text-white font-mono mt-1">{formatINR(settings.owner_deduction_open)}</p>
            </div>
            <div className="bg-gbl-navy-950 p-4 rounded-xl border border-gbl-navy-800 text-center">
              <span className="text-xs text-slate-400 uppercase font-semibold">35+ Jumbled</span>
              <p className="text-xl font-black text-white font-mono mt-1">{formatINR(settings.owner_deduction_35plus)}</p>
            </div>
            <div className="bg-gbl-navy-950 p-4 rounded-xl border border-gbl-navy-800 text-center">
              <span className="text-xs text-slate-400 uppercase font-semibold">Non-Medalist</span>
              <p className="text-xl font-black text-white font-mono mt-1">{formatINR(settings.owner_deduction_non_medalist || settings.owner_deduction_non_medallist)}</p>
            </div>
          </div>
        </div>

        {/* 4. PLAYER CATEGORIES & STARTING BIDS */}
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-gbl-navy-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-sports">PLAYER CATEGORIES & BASE BID VALUES</h2>
              <p className="text-xs text-slate-400">Bidding parameters across all 7 official tournament categories</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gbl-navy-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Category Name</th>
                  <th className="p-3 text-right">Starting Bid</th>
                  <th className="p-3 text-right">Reserve Points</th>
                  <th className="p-3 text-right">Min Increment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gbl-navy-800 font-medium">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gbl-navy-800/30">
                    <td className="p-3">
                      <span className="font-bold text-white uppercase">{c.name}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-gbl-orange-400">
                      {formatINR(c.starting_bid)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300">
                      {formatINR(c.base_reserve_points)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400">
                      +{formatINR(c.min_bid_increment)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
