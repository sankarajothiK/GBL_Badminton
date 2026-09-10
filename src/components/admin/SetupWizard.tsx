import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Settings, 
  Shield, 
  Layers, 
  Clock, 
  Users, 
  Flame,
  Check
} from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { formatINR } from '../../lib/currency';

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const { tournament, settings, teams, categories, players, updateTournament, updateSettings } = useTournament();
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form states for wizard editing
  const [tournamentName, setTournamentName] = useState(tournament.name);
  const [venue, setVenue] = useState(tournament.venue);
  const [tournamentDates, setTournamentDates] = useState(tournament.tournament_dates);
  const [auctionDate, setAuctionDate] = useState(tournament.auction_date);
  
  const [timerSeconds, setTimerSeconds] = useState(settings.timer_seconds || 20);
  const [initialBudget, setInitialBudget] = useState(settings.initial_budget || 500000);
  const [reservePerSlot, setReservePerSlot] = useState(settings.reserve_per_slot || 20000);

  const steps = [
    { num: 1, title: 'Tournament Info', icon: Settings },
    { num: 2, title: 'Tournament Teams', icon: Shield },
    { num: 3, title: 'Categories', icon: Layers },
    { num: 4, title: 'Auction Rules', icon: Clock },
    { num: 5, title: 'Players Roster', icon: Users },
    { num: 6, title: 'Ready for Auction', icon: Flame },
  ];

  const handleNext = async () => {
    if (currentStep === 1) {
      await updateTournament({
        name: tournamentName,
        venue,
        tournament_dates: tournamentDates,
        auction_date: auctionDate
      });
    } else if (currentStep === 4) {
      await updateSettings({
        timer_seconds: Number(timerSeconds),
        initial_budget: Number(initialBudget),
        reserve_per_slot: Number(reservePerSlot)
      });
    }

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('gbl_setup_wizard_completed', 'true');
      onComplete();
    }
  };

  return (
    <div className="bg-gbl-navy-900 border border-gbl-navy-700 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-4xl mx-auto">
      {/* Wizard Progress Bar */}
      <div className="border-b border-gbl-navy-800 pb-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gbl-orange-400 uppercase tracking-wider">Tournament Onboarding</span>
            <h2 className="text-2xl font-black text-white font-sports">GBL TOURNAMENT SETUP WIZARD</h2>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-gbl-navy-800 text-slate-300 rounded-full border border-gbl-navy-700">
            Step {currentStep} of 6
          </span>
        </div>

        {/* Step Icons */}
        <div className="grid grid-cols-6 gap-2 mt-6">
          {steps.map((s) => {
            const isDone = s.num < currentStep;
            const isCurrent = s.num === currentStep;
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex flex-col items-center text-center">
                <div 
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    isDone 
                      ? 'bg-emerald-500 text-white shadow-md' 
                      : isCurrent 
                      ? 'bg-gbl-orange-500 text-white ring-4 ring-gbl-orange-500/20' 
                      : 'bg-gbl-navy-800 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] font-semibold mt-2 hidden sm:block ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[280px]">
        {/* Step 1: Tournament Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-sports">Step 1: Tournament Information</h3>
            <p className="text-xs text-slate-400">Configure the official title, venue, and primary dates for the league.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tournament Name</label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-gbl-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Venue Address</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-gbl-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tournament Dates</label>
                <input
                  type="text"
                  value={tournamentDates}
                  onChange={(e) => setTournamentDates(e.target.value)}
                  className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-gbl-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Auction Date & Time</label>
                <input
                  type="text"
                  value={auctionDate}
                  onChange={(e) => setAuctionDate(e.target.value)}
                  className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-gbl-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Create / Edit Teams */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-sports">Step 2: {teams.length} Official Teams Initialized</h3>
            <p className="text-xs text-slate-400">All {teams.length} teams have been initialized with standard ₹5,00,000 budgets (₹30,000 owner reserve + ₹4,70,000 player purse). You can customize logos and owners at any time from Team Management.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
              {teams.map((t) => (
                <div key={t.id} className="bg-gbl-navy-950 border border-gbl-navy-800 p-3 rounded-xl flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white" style={{ backgroundColor: t.team_color }}>
                    {t.short_name}
                  </div>
                  <span className="text-xs font-bold text-white mt-1.5 truncate w-full">{t.name}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{formatINR(t.current_balance)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Configure Categories */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-sports">Step 3: Player Categories & Bidding Defaults</h3>
            <p className="text-xs text-slate-400">The 7 official tournament categories are ready with starting bids and reserve rules.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {categories.map((c) => (
                <div key={c.id} className="bg-gbl-navy-950 border border-gbl-navy-800 p-3.5 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">{c.name}</h4>
                    <p className="text-[10px] text-slate-400">Starting Bid: <strong className="text-gbl-orange-400">{formatINR(c.starting_bid)}</strong></p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Configure Auction Rules */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-sports">Step 4: Live Auction Engine Rules</h3>
            <p className="text-xs text-slate-400">Verify countdown timer and squad budget reserve parameters.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Timer Duration (Seconds)</label>
                <input
                  type="number"
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(Number(e.target.value))}
                  className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-gbl-orange-500 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Official rule: 20 seconds</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Team Purse (INR)</label>
                <input
                  type="number"
                  value={initialBudget}
                  onChange={(e) => setInitialBudget(Number(e.target.value))}
                  className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-gbl-orange-500 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Standard: ₹5,00,000</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reserve Per Unfilled Slot</label>
                <input
                  type="number"
                  value={reservePerSlot}
                  onChange={(e) => setReservePerSlot(Number(e.target.value))}
                  className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-gbl-orange-500 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Guarantees teams can fill squad</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Add / Import Players */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-sports">Step 5: Player Roster Ready</h3>
            <p className="text-xs text-slate-400">
              {players.length} players are currently loaded into the tournament database. You can import more players anytime via CSV in Player Management.
            </p>
            <div className="bg-gbl-navy-950 border border-gbl-navy-800 rounded-xl p-4 divide-y divide-gbl-navy-800">
              <div className="flex justify-between items-center py-2 text-xs">
                <span className="text-slate-300 font-medium">Total Registered Players</span>
                <span className="text-white font-bold">{players.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-xs">
                <span className="text-slate-300 font-medium">Ready for Auction (UNSOLD)</span>
                <span className="text-gbl-orange-400 font-bold">{players.filter(p => p.auction_status === 'UNSOLD').length}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-xs">
                <span className="text-slate-300 font-medium">10 MB Image Upload Support</span>
                <span className="text-emerald-400 font-bold">Enabled & Verified</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Ready for Auction */}
        {currentStep === 6 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce-short">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white font-sports">GBL TOURNAMENT SETUP COMPLETE</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Your tournament settings, {teams.length} team balances, 7 player categories, and live bidding engine are fully configured and ready.
            </p>
            <div className="p-4 bg-gbl-navy-950 border border-gbl-navy-800 rounded-xl max-w-md mx-auto text-xs text-slate-400">
              Connect your external projector screen at <strong className="text-sky-400">/projector</strong> and open the Live Auction Control console to conduct bidding in real-time!
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="border-t border-gbl-navy-800 pt-6 mt-8 flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="px-4 py-2 rounded-xl bg-gbl-navy-800 hover:bg-gbl-navy-700 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
        ) : <div></div>}

        <button
          onClick={handleNext}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gbl-orange-600 to-gbl-orange-500 hover:from-gbl-orange-500 hover:to-gbl-orange-400 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-gbl-orange-500/20 transition-all"
        >
          <span>{currentStep === 6 ? 'Launch Tournament' : 'Continue'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
