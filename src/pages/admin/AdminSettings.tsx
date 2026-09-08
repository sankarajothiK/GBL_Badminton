import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Download, 
  Upload, 
  ShieldAlert, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  FileJson,
  Database,
  RefreshCw,
  Key,
  Globe,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Copy,
  Check,
  CloudUpload,
  Code
} from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatINR } from '../../lib/currency';
import { exportTournamentBackupJSON, validateTournamentBackupJSON } from '../../lib/csv';
import { getSupabaseConfig } from '../../lib/supabase';
import { Modal } from '../../components/common/Modal';

export const AdminSettings: React.FC = () => {
  const { 
    tournament, 
    settings, 
    teams, 
    players, 
    categories, 
    matches, 
    standings, 
    gallery, 
    updateSettings, 
    resetTournamentData, 
    restoreTournamentBackup,
    isCloudConnected,
    cloudSyncStatus,
    cloudSyncMessage,
    testCloudConnection,
    updateCloudCredentials,
    refreshCloudData,
    pushLocalDataToCloud
  } = useTournament();

  const { role } = useAuth();

  // Supabase central cloud connection states
  const existingConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(existingConfig.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(existingConfig.anonKey);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [isRefreshingCloud, setIsRefreshingCloud] = useState(false);
  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const [showSqlFix, setShowSqlFix] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [cloudFeedback, setCloudFeedback] = useState<{ success: boolean; message: string; rlsError?: boolean } | null>(null);

  // Settings form states
  const [timerSeconds, setTimerSeconds] = useState(settings.timer_seconds || 20);
  const [initialBudget, setInitialBudget] = useState(settings.initial_budget || 500000);
  const [requiredSlots, setRequiredSlots] = useState(settings.required_squad_slots || 6);
  const [minSquadSize, setMinSquadSize] = useState(settings.min_squad_size || 6);
  const [maxSquadSize, setMaxSquadSize] = useState(settings.max_squad_size || 6);
  const [reservePerSlot, setReservePerSlot] = useState(settings.reserve_per_slot || 30000);

  // Section 51: Owner double deduction
  const [ownerDeductionEnabled, setOwnerDeductionEnabled] = useState(settings.owner_double_deduction_enabled);
  const [ownerOpen, setOwnerOpen] = useState(settings.owner_deduction_open || 50000);
  const [owner35, setOwner35] = useState(settings.owner_deduction_35plus || 20000);
  const [ownerNonMedallist, setOwnerNonMedallist] = useState(settings.owner_deduction_non_medalist || settings.owner_deduction_non_medallist || 10000);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Reset Modal state (Section 45)
  const [resetScope, setResetScope] = useState<'auction' | 'teams' | 'players' | 'results' | 'everything' | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Backup restore state (Section 47)
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleTestCloudConnection = async () => {
    setIsTestingCloud(true);
    setCloudFeedback(null);
    const success = await testCloudConnection();
    setIsTestingCloud(false);
    if (success) {
      setCloudFeedback({ success: true, message: 'Successfully connected to Central Cloud Database! Tables verified.' });
    } else {
      setCloudFeedback({ success: false, message: 'Connection failed. Please check your Supabase Project URL and Anon Key.' });
    }
  };

  const handleSaveCloudCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingCloud(true);
    setCloudFeedback(null);
    const result = await updateCloudCredentials(supabaseUrl.trim(), supabaseAnonKey.trim());
    setIsTestingCloud(false);
    setCloudFeedback(result);
    if (result.success) {
      setFeedbackMsg('Cloud credentials updated! System is now connected to the central database.');
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleManualSyncCloud = async () => {
    setIsRefreshingCloud(true);
    await refreshCloudData();
    setIsRefreshingCloud(false);
    setFeedbackMsg('Latest data pulled from Central Cloud Database!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const sqlFixCode = `-- GBL Badminton Premier League 2026: Enable Full Database Write & Realtime Access
-- Run this once in your Supabase Dashboard -> SQL Editor to allow saving and realtime updates!

-- 1. Create gallery table if missing
CREATE TABLE IF NOT EXISTS gallery (
    id TEXT PRIMARY KEY,
    tournament_id UUID,
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    caption TEXT,
    tag VARCHAR(50) DEFAULT 'General',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Disable Row Level Security on all tables
ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE auctions DISABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE standings DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;

-- 3. Grant public and authenticated permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
`;

  const handlePushLocalDataToCloud = async () => {
    setIsPushingCloud(true);
    setCloudFeedback(null);
    const result = await pushLocalDataToCloud();
    setIsPushingCloud(false);
    setCloudFeedback(result);
    if (result.rlsError) {
      setShowSqlFix(true);
    }
    if (result.success) {
      setFeedbackMsg(result.message);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlFixCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      timer_seconds: Number(timerSeconds),
      initial_budget: Number(initialBudget),
      required_squad_slots: Number(requiredSlots),
      min_squad_size: Number(minSquadSize),
      max_squad_size: Number(maxSquadSize),
      reserve_per_slot: Number(reservePerSlot),
      owner_double_deduction_enabled: ownerDeductionEnabled,
      owner_deduction_open: Number(ownerOpen),
      owner_deduction_35plus: Number(owner35),
      owner_deduction_non_medallist: Number(ownerNonMedallist),
      owner_deduction_non_medalist: Number(ownerNonMedallist)
    });

    setFeedbackMsg('Auction and tournament settings updated successfully.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Section 47: Export complete tournament JSON backup
  const handleExportBackup = () => {
    exportTournamentBackupJSON({
      tournament,
      settings,
      teams,
      categories,
      players,
      bids: [],
      matches,
      standings
    });
  };

  // Section 47: Import and validate tournament JSON backup
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    const text = await file.text();
    const val = validateTournamentBackupJSON(text);

    if (!val.isValid || !val.data) {
      setRestoreError(val.error || 'Invalid backup JSON file.');
      return;
    }

    const res = await restoreTournamentBackup(val.data);
    if (!res.success) {
      setRestoreError(res.error || 'Failed to apply backup.');
    } else {
      setFeedbackMsg('Tournament data restored successfully from backup.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  // Section 45: Confirm Reset Action
  const handleExecuteReset = async () => {
    if (!resetScope) return;
    if (resetConfirmText.trim().toLowerCase() !== 'confirm') {
      return;
    }

    await resetTournamentData(resetScope);
    setResetScope(null);
    setResetConfirmText('');
    setFeedbackMsg(`Reset operation "${resetScope}" executed successfully.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white font-sports tracking-wide">SYSTEM & AUCTION SETTINGS</h1>
        <p className="text-xs text-slate-400">Configure core auction rules, owner double deductions, database backup, and reset</p>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/50 rounded-2xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* CENTRAL CLOUD DATABASE CONNECTION (SUPABASE) */}
      <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gbl-navy-800">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isCloudConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                <span>Central Cloud Database (Supabase)</span>
                {isCloudConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> ONLINE & SYNCED
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> LOCAL MODE (KEY REQUIRED)
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect your live Supabase project so changes made in office and home sync automatically in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isPushingCloud || !isCloudConnected}
              onClick={handlePushLocalDataToCloud}
              className="px-3.5 py-2 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-md"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isPushingCloud ? 'animate-bounce' : ''}`} />
              <span>{isPushingCloud ? 'Pushing Data...' : 'Push All Data to Cloud'}</span>
            </button>
            <button
              type="button"
              disabled={isRefreshingCloud}
              onClick={handleManualSyncCloud}
              className="px-3.5 py-2 rounded-xl bg-gbl-navy-950 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCloud ? 'animate-spin text-gbl-orange-400' : 'text-sky-400'}`} />
              <span>Pull Fresh Data</span>
            </button>
          </div>
        </div>

        {/* Live Status Description */}
        <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
          isCloudConnected 
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
            : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
        }`}>
          {isCloudConnected ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block">{cloudSyncMessage}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isCloudConnected 
                ? 'All team additions, player edits, bids, and match results are persistently written directly to PostgreSQL and broadcast live to all devices.' 
                : 'To enable cross-computer real-time persistence between your office and home, enter your Supabase Project Anon Key below and click "Connect & Save".'}
            </p>
          </div>
        </div>

        {cloudFeedback && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            cloudFeedback.success 
              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300' 
              : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
          }`}>
            {cloudFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{cloudFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveCloudCredentials} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Supabase Project URL</span>
              </label>
              <input
                type="url"
                required
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Supabase Anon Public API Key</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAnonKey(!showAnonKey)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  {showAnonKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showAnonKey ? 'Hide' : 'Show'}</span>
                </button>
              </label>
              <input
                type={showAnonKey ? 'text' : 'password'}
                required
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isTestingCloud}
              onClick={handleTestCloudConnection}
              className="px-4 py-2 rounded-xl bg-gbl-navy-950 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isTestingCloud ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              type="submit"
              disabled={isTestingCloud}
              className="px-5 py-2 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg shadow-gbl-orange-600/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Connect & Save</span>
            </button>
          </div>
        </form>

        {/* 1-Click SQL Permissions & RLS Fix Card */}
        <div className="pt-4 border-t border-gbl-navy-800">
          <button
            type="button"
            onClick={() => setShowSqlFix(!showSqlFix)}
            className="w-full p-3.5 rounded-2xl bg-gbl-navy-950/80 hover:bg-gbl-navy-800/80 border border-gbl-navy-700/80 flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                <Code className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-white block">
                  1-Click Supabase Permissions & RLS Fix
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Run this SQL in Supabase SQL Editor if you see "Row-Level Security policy" errors or want cloud cross-device sync
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-sky-400 hover:text-sky-300 shrink-0 ml-2">
              {showSqlFix ? 'Hide Script' : 'View Script'}
            </span>
          </button>

          {showSqlFix && (
            <div className="mt-3 p-4 rounded-2xl bg-gbl-navy-950 border border-gbl-navy-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-300">
                  Step 1: Copy script &bull; Step 2: Paste in Supabase SQL Editor &bull; Step 3: Click "Push All Data to Cloud"
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <pre className="p-3 bg-black/60 border border-gbl-navy-800 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-44 leading-relaxed">
                {sqlFixCode}
              </pre>

              <div className="text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2 pt-1">
                <span>After running this script in Supabase, click <strong>"Push All Data to Cloud"</strong> above to sync all players & teams to cloud.</span>
                <a
                  href={`https://supabase.com/dashboard/project/${existingConfig.url.split('//')[1]?.split('.')[0] || '_'}/sql/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline font-bold"
                >
                  Open Supabase SQL Editor &rarr;
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 1. AUCTION RULES & SQUAD LIMITS FORM */}
      <form onSubmit={handleSaveSettings} className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-gbl-navy-800 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-gbl-orange-500" />
          <span>Auction Clock & Squad Parameters</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Timer Countdown (Seconds)</label>
            <input
              type="number"
              required
              min={10}
              max={60}
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(Number(e.target.value))}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">Official GBL rule: 20s</p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Team Purse Budget (₹)</label>
            <input
              type="number"
              required
              min={100000}
              value={initialBudget}
              onChange={(e) => setInitialBudget(Number(e.target.value))}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">Standard: ₹5,00,000</p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Reserve Per Unfilled Slot (₹)</label>
            <input
              type="number"
              required
              min={0}
              value={reservePerSlot}
              onChange={(e) => setReservePerSlot(Number(e.target.value))}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">For maximum legal bid protection</p>
          </div>
        </div>

        {/* Squad Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Squad Slots</label>
            <input
              type="number"
              min={1}
              max={15}
              value={requiredSlots}
              onChange={(e) => setRequiredSlots(Number(e.target.value))}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Minimum Squad Size</label>
            <input
              type="number"
              min={1}
              max={15}
              value={minSquadSize}
              onChange={(e) => setMinSquadSize(Number(e.target.value))}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Maximum Squad Size</label>
            <input
              type="number"
              min={1}
              max={25}
              value={maxSquadSize}
              onChange={(e) => setMaxSquadSize(Number(e.target.value))}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-gbl-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* SECTION 51: OWNER DOUBLE DEDUCTION RULE */}
        <div className="space-y-4 pt-4 border-t border-gbl-navy-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Owner Double Deduction Rule
              </h3>
              <p className="text-[11px] text-slate-400">Category-based deduction allowance for owner doubles pairings</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ownerDeductToggle"
                checked={ownerDeductionEnabled}
                onChange={(e) => setOwnerDeductionEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-gbl-orange-600 focus:ring-0 bg-gbl-navy-950 border-gbl-navy-700"
              />
              <label htmlFor="ownerDeductToggle" className="text-xs font-semibold text-white">
                Rule Enabled
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">OPEN Category Deduction (₹)</label>
              <input
                type="number"
                value={ownerOpen}
                onChange={(e) => setOwnerOpen(Number(e.target.value))}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">35+ Category Deduction (₹)</label>
              <input
                type="number"
                value={owner35}
                onChange={(e) => setOwner35(Number(e.target.value))}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Non-Medalist Deduction (₹)</label>
              <input
                type="number"
                value={ownerNonMedallist}
                onChange={(e) => setOwnerNonMedallist(Number(e.target.value))}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gbl-navy-800 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-gbl-orange-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Rules & Settings</span>
          </button>
        </div>
      </form>

      {/* 2. SECTION 47: BACKUP & RESTORE */}
      <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-gbl-navy-800 flex items-center gap-2">
          <FileJson className="w-4 h-4 text-sky-400" />
          <span>Tournament Data Backup & Restore</span>
        </h2>
        <p className="text-xs text-slate-400">
          Export full JSON snapshot containing tournament configurations, team wallets, rosters, and match records.
        </p>

        {restoreError && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{restoreError}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2.5 rounded-xl bg-gbl-navy-950 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-md"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export Tournament Backup (JSON)</span>
          </button>

          <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-gbl-navy-950 hover:bg-gbl-navy-800 border border-gbl-navy-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-md">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import & Restore Backup</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>

      {/* 3. SECTION 45: GRANULAR TOURNAMENT RESET (Super Admin Only) */}
      <div className="bg-rose-950/20 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-rose-500/30">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-rose-300">
              Granular Tournament Data Reset (Super Admin Only)
            </h2>
            <p className="text-[11px] text-slate-400">Never delete data accidentally. Requires typing confirmation.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => { setResetScope('auction'); setResetConfirmText(''); }}
            className="p-4 rounded-2xl bg-gbl-navy-950 hover:bg-rose-950/40 border border-gbl-navy-800 hover:border-rose-500/40 text-left transition-colors"
          >
            <span className="text-xs font-bold text-white block">Reset Auction Only</span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Clears sold statuses, returns all players to UNSOLD, restores ₹5,00,000 balances.
            </span>
          </button>

          <button
            onClick={() => { setResetScope('results'); setResetConfirmText(''); }}
            className="p-4 rounded-2xl bg-gbl-navy-950 hover:bg-rose-950/40 border border-gbl-navy-800 hover:border-rose-500/40 text-left transition-colors"
          >
            <span className="text-xs font-bold text-white block">Reset Match Results</span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Clears matches, resets standings points and played records.
            </span>
          </button>

          <button
            onClick={() => { setResetScope('everything'); setResetConfirmText(''); }}
            className="p-4 rounded-2xl bg-rose-950/40 hover:bg-rose-950/80 border border-rose-500/50 text-left transition-colors"
          >
            <span className="text-xs font-bold text-rose-300 block">Reset Complete Tournament</span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Pristine reset returning tournament, 10 teams, categories, and players to seed state.
            </span>
          </button>
        </div>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      <Modal
        isOpen={!!resetScope}
        onClose={() => setResetScope(null)}
        title="CONFIRM DATA RESET"
        subtitle={`Target Action: Reset ${resetScope?.toUpperCase()}`}
      >
        <div className="space-y-4 text-xs text-slate-300">
          <p className="text-rose-300 font-semibold">
            Warning: This action will reset selected tournament state in Supabase. Type <strong>confirm</strong> to execute.
          </p>

          <div>
            <label className="block text-slate-400 mb-1">Type "confirm" to proceed:</label>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="confirm"
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              onClick={() => setResetScope(null)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteReset}
              disabled={resetConfirmText.trim().toLowerCase() !== 'confirm'}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold uppercase tracking-wider"
            >
              Execute Reset
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
