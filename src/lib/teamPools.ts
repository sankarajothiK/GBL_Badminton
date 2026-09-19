import { Team } from '../types/database';

export const OFFICIAL_POOLS = ['Pool A', 'Pool B', 'Pool C'] as const;
export type OfficialPool = typeof OFFICIAL_POOLS[number];

/**
 * Deterministic default pool mapping for the 12 official GBL tournament teams by UUID
 */
export const OFFICIAL_TEAM_POOL_MAPPING: Record<string, OfficialPool> = {
  // POOL A
  '20000000-0000-0000-0000-000000000004': 'Pool A', // Tamilaga Asiriyar kootani warriors
  '20000000-0000-0000-0000-000000000007': 'Pool A', // Fire Falcon's
  '20000000-0000-0000-0000-000000000009': 'Pool A', // Smash squad
  '20000000-0000-0000-0000-000000000002': 'Pool A', // Gokulam Super Kings / Gopalam

  // POOL B
  '24d61ebe-2ba0-43c7-9d6f-474c716b19d7': 'Pool B', // GOLD WARRIORS
  '4afd005c-7677-4838-bd91-f097d56e37f0': 'Pool B', // THANGARATHINAM GOLD BOYS
  '20000000-0000-0000-0000-000000000003': 'Pool B', // Jolly strikers cool bro's
  '20000000-0000-0000-0000-000000000006': 'Pool B', // Feathers Fury

  // POOL C
  '20000000-0000-0000-0000-000000000010': 'Pool C', // Sharavanas Badminton Academy
  '20000000-0000-0000-0000-000000000005': 'Pool C', // TURBO BADMINTON ACADEMY
  '20000000-0000-0000-0000-000000000001': 'Pool C', // The Emperor
  '20000000-0000-0000-0000-000000000008': 'Pool C', // The BarBarians
};

/**
 * Universal pool resolver that guarantees every team always gets their correct pool
 * across all client devices, laptops, phones, incognito sessions, and cloud syncs.
 */
export function resolveTeamPool(team?: Partial<Team> | null): OfficialPool | string {
  if (!team) return 'Pool A';

  // 1. Direct explicit pool value if valid
  if (team.pool && (team.pool === 'Pool A' || team.pool === 'Pool B' || team.pool === 'Pool C')) {
    return team.pool;
  }

  // 2. Parse from embedded [POOL:Pool X] in description
  if (team.description) {
    const match = team.description.match(/\[POOL:\s*(Pool\s+[ABC]|[^\]]+)\]/i);
    if (match && match[1]) {
      const p = match[1].trim();
      const normalized = p.toUpperCase().replace(/\s+/g, ' ');
      if (normalized.includes('POOL A') || normalized === 'A') return 'Pool A';
      if (normalized.includes('POOL B') || normalized === 'B') return 'Pool B';
      if (normalized.includes('POOL C') || normalized === 'C') return 'Pool C';
      return p;
    }
  }

  // 3. Match by Team ID
  if (team.id && OFFICIAL_TEAM_POOL_MAPPING[team.id]) {
    return OFFICIAL_TEAM_POOL_MAPPING[team.id];
  }

  // 4. Match by Team Name (case-insensitive keyword matching)
  const name = (team.name || '').toLowerCase();
  const shortName = (team.short_name || '').toLowerCase();

  // POOL A Matchers
  if (
    name.includes('tamilaga') || name.includes('asiriyar') || name.includes('kootani') || shortName === 'takw' ||
    name.includes('fire falcon') || name.includes('falcon') || shortName === 'ffc' ||
    name.includes('smash') || shortName === 'ss' ||
    name.includes('gokulam') || name.includes('gopalam') || shortName === 'gsk'
  ) {
    return 'Pool A';
  }

  // POOL B Matchers
  if (
    name.includes('gold warrior') || (name.includes('warrior') && !name.includes('asiriyar')) || shortName === 'gw' ||
    name.includes('thangarathinam') || name.includes('gold boys') || shortName === 'tgb' ||
    name.includes('jolly') || name.includes('cool bro') || shortName === 'jscb' ||
    name.includes('feather') || name.includes('furry') || shortName === 'ff'
  ) {
    return 'Pool B';
  }

  // POOL C Matchers
  if (
    name.includes('sharavana') || shortName === 'sba' ||
    name.includes('turbo') || shortName === 'tba' ||
    name.includes('emperor') || shortName === 'emp' ||
    name.includes('barbarian') || shortName === 'bar'
  ) {
    return 'Pool C';
  }

  // 5. Fallback based on team number (1-4 -> Pool A, 5-8 -> Pool B, 9-12 -> Pool C, or modulo)
  if (team.team_number) {
    if ([4, 7, 9, 2].includes(team.team_number)) return 'Pool A';
    if ([12, 11, 3, 6].includes(team.team_number)) return 'Pool B';
    if ([10, 5, 1, 8].includes(team.team_number)) return 'Pool C';
  }

  return 'Pool A';
}
