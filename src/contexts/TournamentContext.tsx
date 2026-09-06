import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Tournament, 
  TournamentSettings, 
  Category, 
  Team, 
  Player, 
  Standing, 
  TournamentMatch, 
  GalleryItem, 
  AuditLog 
} from '../types/database';
import { 
  initialTournament, 
  initialSettings, 
  initialCategories, 
  initialTeams, 
  initialPlayers, 
  initialStandings 
} from '../data/seedData';
import { 
  supabase, 
  realtimeManager, 
  isSupabaseConfigured, 
  testSupabaseConnection, 
  setSupabaseCredentials,
  currentSupabaseUrl,
  currentSupabaseAnonKey
} from '../lib/supabase';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface TournamentContextType {
  tournament: Tournament;
  settings: TournamentSettings;
  teams: Team[];
  players: Player[];
  categories: Category[];
  matches: TournamentMatch[];
  standings: Standing[];
  gallery: GalleryItem[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  isRealtimeConnected: boolean;
  isCloudConnected: boolean;
  cloudSyncStatus: 'connected' | 'disconnected' | 'checking';
  cloudSyncMessage: string;

  // Cloud Credentials Management
  testCloudConnection: () => Promise<{ success: boolean; message: string }>;
  updateCloudCredentials: (url: string, anonKey: string) => Promise<{ success: boolean; message: string }>;
  refreshCloudData: () => Promise<void>;

  // Mutators
  updateTournament: (updates: Partial<Tournament>) => Promise<void>;
  updateSettings: (updates: Partial<TournamentSettings>) => Promise<void>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  createTeam: (newTeam: Omit<Team, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  createPlayer: (newPlayer: Omit<Player, 'id' | 'created_at' | 'updated_at'>) => Promise<Player>;
  updatePlayer: (playerId: string, updates: Partial<Player>) => Promise<void>;
  deletePlayer: (playerId: string) => Promise<void>;
  importPlayersList: (playersList: Partial<Player>[]) => Promise<number>;
  createCategory: (newCategory: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCategory: (categoryId: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  saveMatchResult: (match: TournamentMatch) => Promise<void>;
  toggleManualQualifier: (teamId: string) => Promise<void>;
  setQualifyingTeamsCount: (count: number) => Promise<void>;
  addGalleryItem: (item: Omit<GalleryItem, 'id' | 'created_at'>) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;
  logAuditAction: (action: string, details: Record<string, any>) => void;
  resetTournamentData: (scope: 'auction' | 'teams' | 'players' | 'results' | 'everything') => Promise<void>;
  restoreTournamentBackup: (backupData: any) => Promise<{ success: boolean; error?: string }>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournament, setTournament] = useState<Tournament>(initialTournament);
  const [settings, setSettings] = useState<TournamentSettings>(initialSettings);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [standings, setStandings] = useState<Standing[]>(initialStandings);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string>('Checking central database...');

  // Test and load data from Supabase
  const loadData = async () => {
    setIsLoading(true);
    setCloudSyncStatus('checking');
    try {
      const connTest = await testSupabaseConnection();
      if (connTest.success) {
        setIsCloudConnected(true);
        setCloudSyncStatus('connected');
        setCloudSyncMessage('Connected & synced with Central Cloud Database');

        // Fetch all tables from central database
        const [
          { data: tData },
          { data: sData },
          { data: tmData },
          { data: pData },
          { data: cData },
          { data: mData },
          { data: stData },
          { data: gData }
        ] = await Promise.all([
          supabase.from('tournaments').select('*').limit(1).maybeSingle(),
          supabase.from('tournament_settings').select('*').limit(1).maybeSingle(),
          supabase.from('teams').select('*').order('team_number'),
          supabase.from('players').select('*').order('auction_order'),
          supabase.from('categories').select('*').order('sort_order'),
          supabase.from('tournament_matches').select('*').order('match_number'),
          supabase.from('standings').select('*').order('rank'),
          supabase.from('gallery').select('*').order('sort_order')
        ]);

        if (tData) setTournament(tData);
        if (sData) setSettings(sData);
        if (tmData && tmData.length > 0) setTeams(tmData);
        if (pData && pData.length > 0) setPlayers(pData);
        if (cData && cData.length > 0) setCategories(cData);
        if (mData && mData.length > 0) setMatches(mData);
        if (stData && stData.length > 0) setStandings(stData);
        if (gData && gData.length > 0) setGallery(gData);
      } else {
        setIsCloudConnected(false);
        setCloudSyncStatus('disconnected');
        setCloudSyncMessage(connTest.message);
        console.warn('Central database notice: operating with primed seed state. Reason:', connTest.message);
      }
    } catch (err: any) {
      setIsCloudConnected(false);
      setCloudSyncStatus('disconnected');
      setCloudSyncMessage(err?.message || 'Database connection error');
      console.warn('Central database error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to cross-client updates
    const unsubscribe = realtimeManager.subscribe((type, payload) => {
      if (type === 'TEAM_UPDATED') {
        setTeams(prev => prev.map(t => t.id === payload.id ? { ...t, ...payload } : t));
      } else if (type === 'TEAM_CREATED') {
        setTeams(prev => prev.some(t => t.id === payload.id) ? prev : [...prev, payload]);
      } else if (type === 'TEAM_DELETED') {
        setTeams(prev => prev.filter(t => t.id !== payload.id));
      } else if (type === 'PLAYER_UPDATED') {
        setPlayers(prev => prev.map(p => p.id === payload.id ? { ...p, ...payload } : p));
      } else if (type === 'PLAYER_CREATED') {
        setPlayers(prev => prev.some(p => p.id === payload.id) ? prev : [...prev, payload]);
      } else if (type === 'PLAYER_DELETED') {
        setPlayers(prev => prev.filter(p => p.id !== payload.id));
      } else if (type === 'PLAYERS_IMPORTED') {
        setPlayers(prev => [...prev, ...payload]);
      } else if (type === 'STANDINGS_UPDATED') {
        setStandings(payload);
      } else if (type === 'TOURNAMENT_RESET') {
        loadData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const testCloudConnection = async () => {
    return await testSupabaseConnection();
  };

  const updateCloudCredentials = async (url: string, anonKey: string) => {
    setSupabaseCredentials(url, anonKey);
    const test = await testSupabaseConnection(url, anonKey);
    if (test.success) {
      setIsCloudConnected(true);
      setCloudSyncStatus('connected');
      setCloudSyncMessage('Connected to Central Supabase Cloud DB');
      await loadData();
    } else {
      setIsCloudConnected(false);
      setCloudSyncStatus('disconnected');
      setCloudSyncMessage(test.message);
    }
    return test;
  };

  const refreshCloudData = async () => {
    await loadData();
  };

  // Update Tournament
  const updateTournament = async (updates: Partial<Tournament>) => {
    const updated = { ...tournament, ...updates, updated_at: new Date().toISOString() };
    setTournament(updated);
    try {
      await supabase.from('tournaments').update(updates).eq('id', tournament.id);
    } catch (e) {
      console.warn('Database sync error on updateTournament:', e);
    }
    realtimeManager.broadcast('TOURNAMENT_UPDATED', updated);
    logAuditAction('TOURNAMENT_SETTINGS_UPDATED', updates);
  };

  // Update Settings
  const updateSettings = async (updates: Partial<TournamentSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    try {
      await supabase.from('tournament_settings').update(updates).eq('id', settings.id);
    } catch (e) {
      console.warn('Database sync error on updateSettings:', e);
    }
    realtimeManager.broadcast('SETTINGS_UPDATED', updated);
    logAuditAction('SETTINGS_UPDATED', updates);
  };

  // Update Team
  const updateTeam = async (teamId: string, updates: Partial<Team>) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
    try {
      await supabase.from('teams').update(updates).eq('id', teamId);
    } catch (e) {
      console.warn('Database sync error on updateTeam:', e);
    }
    realtimeManager.broadcast('TEAM_UPDATED', { id: teamId, ...updates });
    logAuditAction('TEAM_UPDATED', { teamId, updates });
  };

  // Create Team
  const createTeam = async (newTeamData: Omit<Team, 'id' | 'created_at' | 'updated_at'>) => {
    const newTeam: Team = {
      ...newTeamData,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setTeams(prev => [...prev, newTeam]);
    try {
      await supabase.from('teams').insert(newTeam);
    } catch (e) {
      console.warn('Database sync error on createTeam:', e);
    }
    realtimeManager.broadcast('TEAM_CREATED', newTeam);
    logAuditAction('TEAM_CREATED', { name: newTeam.name });
  };

  // Delete Team
  const deleteTeam = async (teamId: string) => {
    const target = teams.find(t => t.id === teamId);
    setTeams(prev => prev.filter(t => t.id !== teamId));
    try {
      await supabase.from('teams').delete().eq('id', teamId);
    } catch (e) {
      console.warn('Database sync error on deleteTeam:', e);
    }
    realtimeManager.broadcast('TEAM_DELETED', { id: teamId });
    if (target) {
      logAuditAction('TEAM_DELETED', { name: target.name, id: teamId });
    }
  };

  // Create Player
  const createPlayer = async (newPlayerData: Omit<Player, 'id' | 'created_at' | 'updated_at'>): Promise<Player> => {
    const newPlayer: Player = {
      ...newPlayerData,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setPlayers(prev => [...prev, newPlayer]);
    try {
      await supabase.from('players').insert(newPlayer);
    } catch (e) {
      console.warn('Database sync error on createPlayer:', e);
    }
    realtimeManager.broadcast('PLAYER_CREATED', newPlayer);
    logAuditAction('PLAYER_CREATED', { player: newPlayer.name, code: newPlayer.player_code });
    return newPlayer;
  };

  // Update Player
  const updatePlayer = async (playerId: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
    try {
      await supabase.from('players').update(updates).eq('id', playerId);
    } catch (e) {
      console.warn('Database sync error on updatePlayer:', e);
    }
    realtimeManager.broadcast('PLAYER_UPDATED', { id: playerId, ...updates });
  };

  // Delete Player
  const deletePlayer = async (playerId: string) => {
    const target = players.find(p => p.id === playerId);
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    try {
      await supabase.from('players').delete().eq('id', playerId);
    } catch (e) {
      console.warn('Database sync error on deletePlayer:', e);
    }
    realtimeManager.broadcast('PLAYER_DELETED', { id: playerId });
    if (target) {
      logAuditAction('PLAYER_DELETED', { player: target.name, id: playerId });
    }
  };

  // Import Players List from CSV
  const importPlayersList = async (playersList: Partial<Player>[]): Promise<number> => {
    const created: Player[] = playersList.map((p, idx) => ({
      id: generateUUID(),
      tournament_id: tournament.id,
      player_code: p.player_code || `GBL-${String(players.length + idx + 1).padStart(3, '0')}`,
      name: p.name || 'Unnamed Player',
      age: p.age || 25,
      gender: p.gender || 'Male',
      mobile: p.mobile || '',
      photo_url: p.photo_url || null,
      academy: p.academy || 'GBL Badminton Club',
      eligible_category_ids: p.eligible_category_ids || [],
      eligible_category_names: p.eligible_category_names || ['Open'],
      achievements: p.achievements || '',
      notes: p.notes || '',
      registration_status: 'APPROVED',
      auction_status: 'UNSOLD',
      sold_price: null,
      sold_team_id: null,
      auction_order: players.length + idx + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    setPlayers(prev => [...prev, ...created]);
    try {
      await supabase.from('players').insert(created);
    } catch (e) {
      console.warn('Database sync error on importPlayersList:', e);
    }
    realtimeManager.broadcast('PLAYERS_IMPORTED', created);
    logAuditAction('CSV_PLAYERS_IMPORTED', { count: created.length });
    return created.length;
  };

  // Category CRUD
  const createCategory = async (newCategoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    const newCat: Category = {
      ...newCategoryData,
      id: generateUUID(),
      tournament_id: tournament.id
    };
    setCategories(prev => [...prev, newCat]);
    try {
      await supabase.from('categories').insert(newCat);
    } catch (e) {
      console.warn('Database sync error on createCategory:', e);
    }
    logAuditAction('CATEGORY_CREATED', { name: newCat.name });
  };

  const updateCategory = async (categoryId: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...updates } : c));
    try {
      await supabase.from('categories').update(updates).eq('id', categoryId);
    } catch {
      // ignore
    }
    logAuditAction('CATEGORY_UPDATED', { categoryId, updates });
  };

  const deleteCategory = async (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    try {
      await supabase.from('categories').delete().eq('id', categoryId);
    } catch {
      // ignore
    }
  };

  // Save Match Result and Recalculate Standings Automatically
  const saveMatchResult = async (matchData: TournamentMatch) => {
    setMatches(prev => {
      const idx = prev.findIndex(m => m.id === matchData.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = matchData;
        return copy;
      }
      return [...prev, matchData];
    });

    try {
      await supabase.from('tournament_matches').upsert(matchData);
    } catch {
      // ignore
    }

    // Auto-calculate standings
    recalculateStandings([...matches.filter(m => m.id !== matchData.id), matchData]);
    logAuditAction('MATCH_RESULT_ENTERED', { matchNumber: matchData.match_number, winner: matchData.winner_team_id });
  };

  const recalculateStandings = (allMatches: TournamentMatch[]) => {
    const stats: Record<string, { played: number; won: number; lost: number; points: number; score_for: number; score_against: number }> = {};
    
    teams.forEach(t => {
      stats[t.id] = { played: 0, won: 0, lost: 0, points: 0, score_for: 0, score_against: 0 };
    });

    allMatches.forEach(m => {
      if (m.status === 'COMPLETED' && m.winner_team_id) {
        const t1 = m.team1_id;
        const t2 = m.team2_id;
        const totalT1 = (m.set1_team1 || 0) + (m.set2_team1 || 0) + (m.set3_team1 || 0);
        const totalT2 = (m.set1_team2 || 0) + (m.set2_team2 || 0) + (m.set3_team2 || 0);

        if (stats[t1]) {
          stats[t1].played += 1;
          stats[t1].score_for += totalT1;
          stats[t1].score_against += totalT2;
          if (m.winner_team_id === t1) {
            stats[t1].won += 1;
            stats[t1].points += 2; // 2 points for win
          } else {
            stats[t1].lost += 1;
          }
        }

        if (stats[t2]) {
          stats[t2].played += 1;
          stats[t2].score_for += totalT2;
          stats[t2].score_against += totalT1;
          if (m.winner_team_id === t2) {
            stats[t2].won += 1;
            stats[t2].points += 2;
          } else {
            stats[t2].lost += 1;
          }
        }
      }
    });

    // Rank teams by Points DESC, then Score Diff DESC
    const sorted = [...teams].map(team => {
      const st = stats[team.id] || { played: 0, won: 0, lost: 0, points: 0, score_for: 0, score_against: 0 };
      const score_diff = st.score_for - st.score_against;
      return {
        id: `standing_${team.id}`,
        tournament_id: tournament.id,
        team_id: team.id,
        played: st.played,
        won: st.won,
        lost: st.lost,
        points: st.points,
        score_for: st.score_for,
        score_against: st.score_against,
        score_diff,
        rank: 0,
        is_qualified: false,
        is_eliminated: false,
        manual_qualifier: false
      };
    }).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.score_diff - a.score_diff;
    });

    const qualifyCount = settings.qualifying_teams_count || 8;
    const rankedStandings: Standing[] = sorted.map((item, idx) => {
      const rank = idx + 1;
      const is_qualified = rank <= qualifyCount;
      return {
        ...item,
        rank,
        is_qualified,
        is_eliminated: !is_qualified
      };
    });

    setStandings(rankedStandings);
    realtimeManager.broadcast('STANDINGS_UPDATED', rankedStandings);
  };

  // Toggle manual qualifier
  const toggleManualQualifier = async (teamId: string) => {
    setStandings(prev => prev.map(s => {
      if (s.team_id === teamId) {
        const nextVal = !s.manual_qualifier;
        return {
          ...s,
          manual_qualifier: nextVal,
          is_qualified: nextVal
        };
      }
      return s;
    }));
  };

  const setQualifyingTeamsCount = async (count: number) => {
    await updateSettings({ qualifying_teams_count: count });
  };

  // Gallery CRUD
  const addGalleryItem = async (item: Omit<GalleryItem, 'id' | 'created_at'>) => {
    const newItem: GalleryItem = {
      ...item,
      id: 'gallery_' + Date.now(),
      created_at: new Date().toISOString()
    };
    setGallery(prev => [newItem, ...prev]);
    try {
      await supabase.from('gallery').insert(newItem);
    } catch {
      // ignore
    }
    logAuditAction('GALLERY_IMAGE_ADDED', { title: item.title });
  };

  const deleteGalleryItem = async (id: string) => {
    setGallery(prev => prev.filter(g => g.id !== id));
    try {
      await supabase.from('gallery').delete().eq('id', id);
    } catch {
      // ignore
    }
  };

  // Audit Logger
  const logAuditAction = (action: string, details: Record<string, any>) => {
    const logItem: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      tournament_id: tournament.id,
      actor_id: 'Tournament Admin',
      actor_role: 'SUPER ADMIN',
      action,
      details,
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [logItem, ...prev.slice(0, 99)]);
    try {
      supabase.from('audit_logs').insert(logItem).then();
    } catch {
      // ignore
    }
  };

  // Granular Tournament Reset
  const resetTournamentData = async (scope: 'auction' | 'teams' | 'players' | 'results' | 'everything') => {
    if (scope === 'auction' || scope === 'everything') {
      // Reset all players to UNSOLD
      setPlayers(prev => prev.map(p => ({
        ...p,
        auction_status: 'UNSOLD',
        sold_price: null,
        sold_team_id: null
      })));

      // Reset team balances back to ₹5,00,000
      setTeams(prev => prev.map(t => ({
        ...t,
        current_balance: t.initial_budget || 500000,
        total_spent: 0
      })));
    }

    if (scope === 'results' || scope === 'everything') {
      setMatches([]);
      setStandings(initialStandings);
    }

    if (scope === 'teams') {
      setTeams(initialTeams);
    }

    if (scope === 'players') {
      setPlayers(initialPlayers);
    }

    if (scope === 'everything') {
      setTournament(initialTournament);
      setSettings(initialSettings);
      setCategories(initialCategories);
      setTeams(initialTeams);
      setPlayers(initialPlayers);
      setStandings(initialStandings);
      setMatches([]);
      setGallery([]);
    }

    realtimeManager.broadcast('TOURNAMENT_RESET', { scope });
    logAuditAction('TOURNAMENT_DATA_RESET', { scope });
  };

  // Restore from JSON backup
  const restoreTournamentBackup = async (backupData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      if (backupData.tournament) setTournament(backupData.tournament);
      if (backupData.settings) setSettings(backupData.settings);
      if (backupData.teams) setTeams(backupData.teams);
      if (backupData.categories) setCategories(backupData.categories);
      if (backupData.players) setPlayers(backupData.players);
      if (backupData.matches) setMatches(backupData.matches);
      if (backupData.standings) setStandings(backupData.standings);
      if (backupData.gallery) setGallery(backupData.gallery);

      logAuditAction('BACKUP_RESTORED', { timestamp: backupData.exported_at });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to restore backup' };
    }
  };

  return (
    <TournamentContext.Provider
      value={{
        tournament,
        settings,
        teams,
        players,
        categories,
        matches,
        standings,
        gallery,
        auditLogs,
        isLoading,
        isRealtimeConnected,
        isCloudConnected,
        cloudSyncStatus,
        cloudSyncMessage,
        testCloudConnection,
        updateCloudCredentials,
        refreshCloudData,
        updateTournament,
        updateSettings,
        updateTeam,
        createTeam,
        deleteTeam,
        createPlayer,
        updatePlayer,
        deletePlayer,
        importPlayersList,
        createCategory,
        updateCategory,
        deleteCategory,
        saveMatchResult,
        toggleManualQualifier,
        setQualifyingTeamsCount,
        addGalleryItem,
        deleteGalleryItem,
        logAuditAction,
        resetTournamentData,
        restoreTournamentBackup
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
