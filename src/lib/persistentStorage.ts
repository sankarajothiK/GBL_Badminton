/**
 * GBL Badminton - Resilient Persistent Storage Manager
 * Ensures that changes made in Admin panel are instantly saved,
 * survive page reloads, and synchronize across browser tabs.
 */

export const GBL_PLAYERS_STORAGE_KEY = 'gbl_players_v1';
export const GBL_TEAMS_STORAGE_KEY = 'gbl_teams_v1';
export const GBL_TOURNAMENT_STORAGE_KEY = 'gbl_tournament_v1';
export const GBL_SETTINGS_STORAGE_KEY = 'gbl_settings_v1';
export const GBL_CATEGORIES_STORAGE_KEY = 'gbl_categories_v1';
export const GBL_MATCHES_STORAGE_KEY = 'gbl_matches_v1';
export const GBL_STANDINGS_STORAGE_KEY = 'gbl_standings_v1';
export const GBL_GALLERY_STORAGE_KEY = 'gbl_gallery_v1';
export const GBL_AUDIT_LOGS_STORAGE_KEY = 'gbl_audit_logs_v1';

/**
 * Loads stored data from localStorage with graceful fallback
 */
export function loadStoredData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    
    // If fallback is an array, ensure parsed is also an array
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    
    // If parsed array is empty and fallback has items, prefer fallback for initial seed
    if (Array.isArray(fallback) && fallback.length > 0 && Array.isArray(parsed) && parsed.length === 0) {
      return fallback;
    }
    
    return parsed as T;
  } catch (err) {
    console.warn(`[GBL Storage] Error reading key "${key}":`, err);
    return fallback;
  }
}

/**
 * Safely writes data to localStorage with quota overflow protection
 */
export function saveStoredData<T>(key: string, data: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err: any) {
    console.warn(`[GBL Storage] Failed to save key "${key}":`, err);

    // If quota exceeded, clear non-critical data like audit logs and retry
    if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.code === 1014) {
      try {
        console.warn('[GBL Storage] LocalStorage quota reached. Pruning audit logs to free space.');
        localStorage.removeItem(GBL_AUDIT_LOGS_STORAGE_KEY);
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (innerErr) {
        console.error('[GBL Storage] Critical storage write failure after pruning:', innerErr);
      }
    }
    return false;
  }
}

/**
 * Clear all GBL tournament storage keys (used during full reset)
 */
export function clearAllStoredData(): void {
  if (typeof window === 'undefined') return;
  const keys = [
    GBL_PLAYERS_STORAGE_KEY,
    GBL_TEAMS_STORAGE_KEY,
    GBL_TOURNAMENT_STORAGE_KEY,
    GBL_SETTINGS_STORAGE_KEY,
    GBL_CATEGORIES_STORAGE_KEY,
    GBL_MATCHES_STORAGE_KEY,
    GBL_STANDINGS_STORAGE_KEY,
    GBL_GALLERY_STORAGE_KEY,
    GBL_AUDIT_LOGS_STORAGE_KEY
  ];
  keys.forEach(k => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
}
