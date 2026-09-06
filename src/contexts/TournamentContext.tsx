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
import {
  GBL_PLAYERS_STORAGE_KEY,
  GBL_TEAMS_STORAGE_KEY,
  GBL_TOURNAMENT_STORAGE_KEY,
  GBL_SETTINGS_STORAGE_KEY,
  GBL_CATEGORIES_STORAGE_KEY,
  GBL_MATCHES_STORAGE_KEY,
  GBL_STANDINGS_STORAGE_KEY,
  GBL_GALLERY_STORAGE_KEY,
  GBL_AUDIT_LOGS_STORAGE_KEY,
  loadStoredData,
  saveStoredData,
  clearAllStoredData
} from '../lib/persistentStorage';

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
  pushLocalDataToCloud: () => Promise<{ success: boolean; message: string; rlsError?: boolean }>;

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
  createCategory: (newCategory: Omit<Category, 'id'>) => Promise<void>;
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
  const [tournament, setTournament] = useState<Tournament>(() => loadStoredData(GBL_TOURNAMENT_STORAGE_KEY, initialTournament));
  const [settings, setSettings] = useState<TournamentSettings>(() => loadStoredData(GBL_SETTINGS_STORAGE_KEY, initialSettings));
  const [teams, setTeams] = useState<Team[]>(() => loadStoredData(GBL_TEAMS_STORAGE_KEY, initialTeams));
  const [players, setPlayers] = useState<Player[]>(() => loadStoredData(GBL_PLAYERS_STORAGE_KEY, initialPlayers));
  const [categories, setCategories] = useState<Category[]>(() => loadStoredData(GBL_CATEGORIES_STORAGE_KEY, initialCategories));
  const [matches, setMatches] = useState<TournamentMatch[]>(() => loadStoredData(GBL_MATCHES_STORAGE_KEY, []));
  const [standings, setStandings] = useState<Standing[]>(() => loadStoredData(GBL_STANDINGS_STORAGE_KEY, initialStandings));
  const [gallery, setGallery] = useState<GalleryItem[]>(() => loadStoredData(GBL_GALLERY_STORAGE_KEY, []));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStoredData(GBL_AUDIT_LOGS_STORAGE_KEY, []));
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

        // CRITICAL RESILIENCE RULE:
        // Only update local state if Cloud actually returned data!
        // Never wipe active local edits with empty Cloud tables.
        if (tData) {
          setTournament(tData);
          saveStoredData(GBL_TOURNAMENT_STORAGE_KEY, tData);
        }
        if (sData) {
          if (sData.owner_reserved_points === 30000) {
            const updatedSettings = { ...sData, initial_budget: 500000, owner_reserved_points: 100000, reserve_per_slot: 10000, required_squad_slots: 6 };
            setSettings(updatedSettings);
            saveStoredData(GBL_SETTINGS_STORAGE_KEY, updatedSettings);
            supabase.from('tournament_settings').upsert(updatedSettings).then(undefined, console.warn);
          } else {
            setSettings(sData);
            saveStoredData(GBL_SETTINGS_STORAGE_KEY, sData);
          }
        }
        if (tmData && tmData.length > 0) {
          const isOldDummyTeams = tmData.some((t: any) => t.name === 'Gulf Smashers' || t.name === 'Gulf Thunderbolts');
          if (isOldDummyTeams) {
            console.info('[TournamentContext] Upgrading outdated mock teams in Central DB to official 10 teams.');
            setTeams(initialTeams);
            saveStoredData(GBL_TEAMS_STORAGE_KEY, initialTeams);
            supabase.from('teams').upsert(initialTeams).then(undefined, console.warn);
          } else {
            setTeams(tmData);
            saveStoredData(GBL_TEAMS_STORAGE_KEY, tmData);
          }
        } else {
          supabase.from('teams').upsert(initialTeams).then(undefined, console.warn);
        }
        if (pData && pData.length > 0) {
          setPlayers(pData);
          saveStoredData(GBL_PLAYERS_STORAGE_KEY, pData);
        }
        if (cData && cData.length > 0) {
          setCategories(cData);
          saveStoredData(GBL_CATEGORIES_STORAGE_KEY, cData);
        }
        if (mData && mData.length > 0) {
          setMatches(mData);
          saveStoredData(GBL_MATCHES_STORAGE_KEY, mData);
        }
        if (stData && stData.length > 0) {
          setStandings(stData);
          saveStoredData(GBL_STANDINGS_STORAGE_KEY, stData);
        }
        if (gData && gData.length > 0) {
          setGallery(gData);
          saveStoredData(GBL_GALLERY_STORAGE_KEY, gData);
        }

        const cloudHasData = Boolean((pData && pData.length > 0) || (tmData && tmData.length > 0));
        if (cloudHasData) {
          setCloudSyncStatus('connected');
          setCloudSyncMessage(`Connected & Synced (${pData?.length || 0} players, ${tmData?.length || 0} teams in Cloud DB)`);
        } else {
          setCloudSyncStatus('connected');
          setCloudSyncMessage('Supabase Connected. Cloud DB is empty — using active local data. Click "Push All Data to Cloud" to sync.');
        }
      } else {
        setIsCloudConnected(false);
        setCloudSyncStatus('disconnected');
        setCloudSyncMessage(connTest.message || 'Operating in resilient Local Mode.');
        console.warn('Central database notice: operating with local data. Reason:', connTest.message);
      }
    } catch (err: any) {
      setIsCloudConnected(false);
      setCloudSyncStatus('disconnected');
      setCloudSyncMessage(err?.message || 'Database connection error. Operating in resilient Local Mode.');
      console.warn('Central database error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 1. Storage event listener for instantaneous cross-tab synchronization
    const handleStorageEvent = (event: StorageEvent) => {
      if (!event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (event.key === GBL_PLAYERS_STORAGE_KEY && Array.isArray(parsed)) {
          setPlayers(parsed);
        } else if (event.key === GBL_TEAMS_STORAGE_KEY && Array.isArray(parsed)) {
          setTeams(parsed);
        } else if (event.key === GBL_TOURNAMENT_STORAGE_KEY && parsed) {
          setTournament(parsed);
        } else if (event.key === GBL_SETTINGS_STORAGE_KEY && parsed) {
          setSettings(parsed);
        } else if (event.key === GBL_CATEGORIES_STORAGE_KEY && Array.isArray(parsed)) {
          setCategories(parsed);
        } else if (event.key === GBL_STANDINGS_STORAGE_KEY && Array.isArray(parsed)) {
          setStandings(parsed);
        } else if (event.key === GBL_MATCHES_STORAGE_KEY && Array.isArray(parsed)) {
          setMatches(parsed);
        } else if (event.key === GBL_GALLERY_STORAGE_KEY && Array.isArray(parsed)) {
          setGallery(parsed);
        }
      } catch (e) {
        console.warn('Storage sync error:', e);
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    // 2. Subscribe to realtimeManager cross-client broadcast updates
    const unsubscribe = realtimeManager.subscribe((type, payload) => {
      if (type === 'TEAM_UPDATED') {
        setTeams(prev => {
          const next = prev.map(t => t.id === payload.id ? { ...t, ...payload } : t);
          saveStoredData(GBL_TEAMS_STORAGE_KEY, next);
          return next;
        });
      } else if (type === 'TEAM_CREATED') {
        setTeams(prev => {
          const next = prev.some(t => t.id === payload.id) ? prev : [...prev, payload];
          saveStoredData(GBL_TEAMS_STORAGE_KEY, next);
          return next;
        });
      } else if (type === 'TEAM_DELETED') {
        setTeams(prev => {
          const next = prev.filter(t => t.id !== payload.id);
          saveStoredData(GBL_TEAMS_STORAGE_KEY, next);
          return next;
        });
      } else if (type === 'PLAYER_UPDATED') {
        setPlayers(prev => {
          const next = prev.map(p => p.id === payload.id ? { ...p, ...payload } : p);
          saveStoredData(GBL_PLAYERS_STORAGE_KEY, next);
          return next;
        });
      } else if (type === 'PLAYER_CREATED') {
        setPlayers(prev => {
          const next = prev.some(p => p.id === payload.id) ? prev : [...prev, payload];
          saveStoredData(GBL_PLAYERS_STORAGE_KEY, next);
          return next;
        });
      } else if (type === 'PLAYER_DELETED') {
        setPlayers(prev => {
          const next = prev.filter(p => p.id !== payload.id);
          saveStoredData(GBL_PLAYERS_STORAGE_KEY, next);
          return next;
        });
      } else if (type === 'PLAYERS_IMPORTED') {
        setPlayers(prev => {
          const next = [...prev, ...payload];
          saveStoredData(GBL_PLAYERS_STORAGE_KEY, next);
          return next;
        });
      } else if (type === 'TOURNAMENT_UPDATED') {
        setTournament(payload);
        saveStoredData(GBL_TOURNAMENT_STORAGE_KEY, payload);
      } else if (type === 'SETTINGS_UPDATED') {
        setSettings(payload);
        saveStoredData(GBL_SETTINGS_STORAGE_KEY, payload);
      } else if (type === 'CATEGORY_UPDATED') {
        setCategories(prev => {
          const next = prev.map(c => c.id === payload.id ? { ...c, ...payload } : c);
          saveStoredData(GBL_CATEGORIES_STORAGE_KEY, next);
          return next;
        });
      } else if (type === 'CATEGORY_CREATED') {
        setCategories(prev => {
          const next = prev.some(c => c.id === payload.id) ? prev : [...prev, payload];
          saveStoredData(GBL_CATEGORIES_STORAGE_KEY, next);
          return next;
        });
      } else if (type === 'CATEGORY_DELETED') {
        setCategories(prev => {
          const next = prev.filter(c => c.id !== payload.id);
          saveStoredData(GBL_CATEGORIES_STORAGE_KEY, next);
          return next;
        });
      } else if (type === 'STANDINGS_UPDATED') {
        setStandings(payload);
        saveStoredData(GBL_STANDINGS_STORAGE_KEY, payload);
      } else if (type === 'MATCH_SAVED') {
        setMatches(prev => {
          const next = [...prev.filter(m => m.id !== payload.id), payload];
          saveStoredData(GBL_MATCHES_STORAGE_KEY, next);
          return next;
        });
      } else if (type === 'TOURNAMENT_RESET') {
        loadData();
      }
    });

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
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

  // Push All Local Tournament Data to Supabase Cloud
  const pushLocalDataToCloud = async (): Promise<{ success: boolean; message: string; rlsError?: boolean }> => {
    try {
      // 1. Push tournament
      const { error: tErr } = await supabase.from('tournaments').upsert(tournament);
      if (tErr) {
        if (tErr.code === '42501' || tErr.message?.includes('row-level security') || tErr.message?.includes('violates row-level security')) {
          return {
            success: false,
            message: 'Supabase Row-Level Security (RLS) is blocking writes. Please run the SQL permissions fix in your Supabase SQL Editor.',
            rlsError: true
          };
        }
        return { success: false, message: `Tournament sync failed: ${tErr.message}` };
      }

      // 2. Push settings
      await supabase.from('tournament_settings').upsert(settings);

      // 3. Push categories
      if (categories.length > 0) {
        await supabase.from('categories').upsert(categories);
      }

      // 4. Push teams
      if (teams.length > 0) {
        await supabase.from('teams').upsert(teams);
      }

      // 5. Push players in chunks (batching to avoid payload size limit)
      if (players.length > 0) {
        const chunkSize = 20;
        for (let i = 0; i < players.length; i += chunkSize) {
          const chunk = players.slice(i, i + chunkSize);
          const { error: pErr } = await supabase.from('players').upsert(chunk);
          if (pErr) {
            if (pErr.code === '42501' || pErr.message?.includes('row-level security')) {
              return {
                success: false,
                message: 'Supabase Row-Level Security (RLS) is blocking writes. Please run the SQL permissions fix in your Supabase SQL Editor.',
                rlsError: true
              };
            }
            return { success: false, message: `Players upload failed at batch ${i + 1}: ${pErr.message}` };
          }
        }
      }

      // 6. Push standings
      if (standings.length > 0) {
        await supabase.from('standings').upsert(standings);
      }

      // 7. Push matches
      if (matches.length > 0) {
        await supabase.from('tournament_matches').upsert(matches);
      }

      setCloudSyncStatus('connected');
      setCloudSyncMessage(`Fully synced to Central Cloud DB (${players.length} players, ${teams.length} teams)`);
      return { 
        success: true, 
        message: `Successfully synced ${players.length} players and ${teams.length} teams to Supabase Cloud Database!` 
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Push to cloud failed' };
    }
  };

  // Update Tournament
  const updateTournament = async (updates: Partial<Tournament>) => {
    const updated = { ...tournament, ...updates, updated_at: new Date().toISOString() };
    setTournament(updated);
    saveStoredData(GBL_TOURNAMENT_STORAGE_KEY, updated);

    try {
      await supabase.from('tournaments').upsert(updated);
    } catch (e) {
      console.warn('Database sync error on updateTournament:', e);
    }
    realtimeManager.broadcast('TOURNAMENT_UPDATED', updated);
    logAuditAction('TOURNAMENT_SETTINGS_UPDATED', updates);
  };

  // Update Settings
  const updateSettings = async (updates: Partial<TournamentSettings>) => {
    const updated = { ...settings, ...updates, updated_at: new Date().toISOString() };
    setSettings(updated);
    saveStoredData(GBL_SETTINGS_STORAGE_KEY, updated);

    try {
      await supabase.from('tournament_settings').upsert(updated);
    } catch (e) {
      console.warn('Database sync error on updateSettings:', e);
    }
    realtimeManager.broadcast('SETTINGS_UPDATED', updated);
    logAuditAction('SETTINGS_UPDATED', updates);
  };

  // Update Team
  const updateTeam = async (teamId: string, updates: Partial<Team>) => {
    let updatedTeam: Team | undefined;
    setTeams(prev => {
      const next = prev.map(t => {
        if (t.id === teamId) {
          updatedTeam = { ...t, ...updates, updated_at: new Date().toISOString() };
          return updatedTeam;
        }
        return t;
      });
      saveStoredData(GBL_TEAMS_STORAGE_KEY, next);
      return next;
    });

    realtimeManager.broadcast('TEAM_UPDATED', { id: teamId, ...updates });
    logAuditAction('TEAM_UPDATED', { teamId, updates });

    if (updatedTeam) {
      try {
        await supabase.from('teams').upsert(updatedTeam);
      } catch (e) {
        console.warn('Database sync error on updateTeam:', e);
      }
    }
  };

  // Create Team
  const createTeam = async (newTeamData: Omit<Team, 'id' | 'created_at' | 'updated_at'>) => {
    const newTeam: Team = {
      ...newTeamData,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setTeams(prev => {
      const next = [...prev, newTeam];
      saveStoredData(GBL_TEAMS_STORAGE_KEY, next);
      return next;
    });

    realtimeManager.broadcast('TEAM_CREATED', newTeam);
    logAuditAction('TEAM_CREATED', { name: newTeam.name });

    try {
      await supabase.from('teams').upsert(newTeam);
    } catch (e) {
      console.warn('Database sync error on createTeam:', e);
    }
  };

  // Delete Team
  const deleteTeam = async (teamId: string) => {
    const target = teams.find(t => t.id === teamId);
    setTeams(prev => {
      const next = prev.filter(t => t.id !== teamId);
      saveStoredData(GBL_TEAMS_STORAGE_KEY, next);
      return next;
    });

    realtimeManager.broadcast('TEAM_DELETED', { id: teamId });
    if (target) {
      logAuditAction('TEAM_DELETED', { name: target.name, id: teamId });
    }

    try {
      await supabase.from('teams').delete().eq('id', teamId);
    } catch (e) {
      console.warn('Database sync error on deleteTeam:', e);
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
    setPlayers(prev => {
      const next = [...prev, newPlayer];
      saveStoredData(GBL_PLAYERS_STORAGE_KEY, next);
      return next;
    });

    realtimeManager.broadcast('PLAYER_CREATED', newPlayer);
    logAuditAction('PLAYER_CREATED', { player: newPlayer.name, code: newPlayer.player_code });

    try {
      await supabase.from('players').upsert(newPlayer);
    } catch (e) {
      console.warn('Database sync error on createPlayer:', e);
    }
    return newPlayer;
  };

  // Update Player (Persists immediately to storage, updates live state, broadcasts across tabs, and upserts to Supabase)
  const updatePlayer = async (playerId: string, updates: Partial<Player>) => {
    let updatedPlayer: Player | undefined;
    setPlayers(prev => {
      const next = prev.map(p => {
        if (p.id === playerId) {
          updatedPlayer = { ...p, ...updates, updated_at: new Date().toISOString() };
          return updatedPlayer;
        }
        return p;
      });
      saveStoredData(GBL_PLAYERS_STORAGE_KEY, next);
      return next;
    });

    realtimeManager.broadcast('PLAYER_UPDATED', { id: playerId, ...updates });

    if (updatedPlayer) {
      try {
        const { error } = await supabase.from('players').upsert(updatedPlayer);
        if (error) {
          console.warn('Supabase player upsert notice:', error.message);
        }
      } catch (e) {
        console.warn('Database sync error on updatePlayer:', e);
      }
    }
  };

  // Delete Player
  const deletePlayer = async (playerId: string) => {
    const target = players.find(p => p.id === playerId);
    setPlayers(prev => {
      const next = prev.filter(p => p.id !== playerId);
      saveStoredData(GBL_PLAYERS_STORAGE_KEY, next);
      return next;
    });

    realtimeManager.broadcast('PLAYER_DELETED', { id: playerId });
    if (target) {
      logAuditAction('PLAYER_DELETED', { player: target.name, id: playerId });
    }

    try {
      await supabase.from('players').delete().eq('id', playerId);
    } catch (e) {
      console.warn('Database sync error on deletePlayer:', e);
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

    setPlayers(prev => {
      const next = [...prev, ...created];
      saveStoredData(GBL_PLAYERS_STORAGE_KEY, next);
      return next;
    });

    realtimeManager.broadcast('PLAYERS_IMPORTED', created);
    logAuditAction('CSV_PLAYERS_IMPORTED', { count: created.length });

    try {
      await supabase.from('players').upsert(created);
    } catch (e) {
      console.warn('Database sync error on importPlayersList:', e);
    }
    return created.length;
  };

  // Category CRUD
  const createCategory = async (newCategoryData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...newCategoryData,
      id: generateUUID(),
      tournament_id: tournament.id
    };
    setCategories(prev => {
      const next = [...prev, newCat];
      saveStoredData(GBL_CATEGORIES_STORAGE_KEY, next);
      return next;
    });
    try {
      await supabase.from('categories').upsert(newCat);
    } catch (e) {
      console.warn('Database sync error on createCategory:', e);
    }
    realtimeManager.broadcast('CATEGORY_CREATED', newCat);
    logAuditAction('CATEGORY_CREATED', { name: newCat.name });
  };

  const updateCategory = async (categoryId: string, updates: Partial<Category>) => {
    let updatedCat: Category | undefined;
    setCategories(prev => {
      const next: Category[] = prev.map(c => {
        if (c.id === categoryId) {
          updatedCat = { ...c, ...updates };
          return updatedCat;
        }
        return c;
      });
      saveStoredData(GBL_CATEGORIES_STORAGE_KEY, next);
      return next;
    });

    if (updatedCat) {
      try {
        await supabase.from('categories').upsert(updatedCat);
      } catch {}
    }
    realtimeManager.broadcast('CATEGORY_UPDATED', { id: categoryId, ...updates });
    logAuditAction('CATEGORY_UPDATED', { categoryId, updates });
  };

  const deleteCategory = async (categoryId: string) => {
    setCategories(prev => {
      const next = prev.filter(c => c.id !== categoryId);
      saveStoredData(GBL_CATEGORIES_STORAGE_KEY, next);
      return next;
    });
    try {
      await supabase.from('categories').delete().eq('id', categoryId);
    } catch {}
    realtimeManager.broadcast('CATEGORY_DELETED', { id: categoryId });
  };

  // Save Match Result and Recalculate Standings Automatically
  const saveMatchResult = async (matchData: TournamentMatch) => {
    setMatches(prev => {
      const idx = prev.findIndex(m => m.id === matchData.id);
      let next: TournamentMatch[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = matchData;
      } else {
        next = [...prev, matchData];
      }
      saveStoredData(GBL_MATCHES_STORAGE_KEY, next);
      return next;
    });

    try {
      await supabase.from('tournament_matches').upsert(matchData);
    } catch {
      // ignore
    }

    realtimeManager.broadcast('MATCH_SAVED', matchData);
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
    saveStoredData(GBL_STANDINGS_STORAGE_KEY, rankedStandings);
    realtimeManager.broadcast('STANDINGS_UPDATED', rankedStandings);
  };

  // Toggle manual qualifier
  const toggleManualQualifier = async (teamId: string) => {
    setStandings(prev => {
      const next = prev.map(s => {
        if (s.team_id === teamId) {
          const nextVal = !s.manual_qualifier;
          return {
            ...s,
            manual_qualifier: nextVal,
            is_qualified: nextVal
          };
        }
        return s;
      });
      saveStoredData(GBL_STANDINGS_STORAGE_KEY, next);
      realtimeManager.broadcast('STANDINGS_UPDATED', next);
      return next;
    });
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
    setGallery(prev => {
      const next = [newItem, ...prev];
      saveStoredData(GBL_GALLERY_STORAGE_KEY, next);
      return next;
    });
    try {
      await supabase.from('gallery').upsert(newItem);
    } catch {
      // ignore
    }
    logAuditAction('GALLERY_IMAGE_ADDED', { title: item.title });
  };

  const deleteGalleryItem = async (id: string) => {
    setGallery(prev => {
      const next = prev.filter(g => g.id !== id);
      saveStoredData(GBL_GALLERY_STORAGE_KEY, next);
      return next;
    });
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
    setAuditLogs(prev => {
      const next = [logItem, ...prev.slice(0, 99)];
      saveStoredData(GBL_AUDIT_LOGS_STORAGE_KEY, next);
      return next;
    });
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
      setPlayers(prev => {
        const next = prev.map(p => ({
          ...p,
          auction_status: 'UNSOLD' as const,
          sold_price: null,
          sold_team_id: null
        }));
        saveStoredData(GBL_PLAYERS_STORAGE_KEY, next);
        return next;
      });

      // Reset team balances back to initial budget
      setTeams(prev => {
        const next = prev.map(t => ({
          ...t,
          current_balance: t.initial_budget || 500000,
          total_spent: 0
        }));
        saveStoredData(GBL_TEAMS_STORAGE_KEY, next);
        return next;
      });
    }

    if (scope === 'results' || scope === 'everything') {
      setMatches([]);
      saveStoredData(GBL_MATCHES_STORAGE_KEY, []);
      setStandings(initialStandings);
      saveStoredData(GBL_STANDINGS_STORAGE_KEY, initialStandings);
    }

    if (scope === 'teams') {
      setTeams(initialTeams);
      saveStoredData(GBL_TEAMS_STORAGE_KEY, initialTeams);
    }

    if (scope === 'players') {
      setPlayers(initialPlayers);
      saveStoredData(GBL_PLAYERS_STORAGE_KEY, initialPlayers);
    }

    if (scope === 'everything') {
      clearAllStoredData();
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
      if (backupData.tournament) {
        setTournament(backupData.tournament);
        saveStoredData(GBL_TOURNAMENT_STORAGE_KEY, backupData.tournament);
      }
      if (backupData.settings) {
        setSettings(backupData.settings);
        saveStoredData(GBL_SETTINGS_STORAGE_KEY, backupData.settings);
      }
      if (backupData.teams) {
        setTeams(backupData.teams);
        saveStoredData(GBL_TEAMS_STORAGE_KEY, backupData.teams);
      }
      if (backupData.categories) {
        setCategories(backupData.categories);
        saveStoredData(GBL_CATEGORIES_STORAGE_KEY, backupData.categories);
      }
      if (backupData.players) {
        setPlayers(backupData.players);
        saveStoredData(GBL_PLAYERS_STORAGE_KEY, backupData.players);
      }
      if (backupData.matches) {
        setMatches(backupData.matches);
        saveStoredData(GBL_MATCHES_STORAGE_KEY, backupData.matches);
      }
      if (backupData.standings) {
        setStandings(backupData.standings);
        saveStoredData(GBL_STANDINGS_STORAGE_KEY, backupData.standings);
      }
      if (backupData.gallery) {
        setGallery(backupData.gallery);
        saveStoredData(GBL_GALLERY_STORAGE_KEY, backupData.gallery);
      }

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
        pushLocalDataToCloud,
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
