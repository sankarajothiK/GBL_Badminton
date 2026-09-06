import { Tournament, TournamentSettings, Category, Team, Player, Standing, AdminUser } from '../types/database';
import realPlayers from './players_seed.json';

export const initialTournament: Tournament = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Gulf Oil Badminton Premier League',
  short_name: 'GBL',
  season: 'Season 2026',
  logo_url: '/favicon.svg',
  banner_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1600&q=80',
  description: 'Gokulam Presents Gulf Oil Badminton Premier League – Kovilpatti. Featuring high-intensity player auctions, 10 competitive teams, and championship clashes.',
  venue: 'Gulf Sports Arena, Kovilpatti, Tamil Nadu',
  tournament_dates: 'November 14 - 16, 2026',
  auction_date: 'October 15, 2026',
  auction_time: '10:00 AM IST',
  registration_dates: 'August 1 - October 10, 2026',
  organizer_name: 'Gulf Oil Sports Committee & Gokulam',
  sponsor_info: 'Gulf Oil Lubricants India Ltd. (A Hinduja Group Company)',
  contact_phone: '+91 98844 12345',
  contact_email: 'gbl.tournament@gulfoil.co.in',
  social_instagram: 'https://instagram.com/gulfoilindia',
  social_facebook: 'https://facebook.com/gulfoilindia',
  social_youtube: 'https://youtube.com/gulfoilindia',
  rules_markdown: `### Official GBL Tournament & Auction Rules (Kovilpatti)
1. **Team Structure**: 10 Teams compete across League, Quarter-Finals, Semi-Finals, and Grand Final.
2. **Team Roster**: Maximum 6 members in total (1 Team Owner + 5 Auctioned Players).
3. **Team Points & Budget**:
   - Total Team Points: ₹5,00,000 (5,00,000 points).
   - Team Owner Reserved Points: ₹30,000.
   - Available Usable Player Points: ₹4,70,000.
4. **Dynamic Maximum Bid & Minimum Reserve**:
   - Reserve per remaining player: ₹30,000.
   - Dynamic Max Bid = Current Team Balance - ((Remaining Players to Buy - 1) * ₹30,000).
   - A team cannot bid beyond the maximum amount that still allows all remaining players to be purchased.
5. **Bidding Clock**: Live auction operates on a synchronized 20-second countdown clock. Every valid bid resets the timer to 20 seconds.
6. **Fixture Player Rotation**: In each Team vs Team fixture, a player can play MAXIMUM 2 MATCHES only.`,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const initialSettings: TournamentSettings = {
  id: '00000000-0000-0000-0000-000000000002',
  tournament_id: initialTournament.id,
  timer_seconds: 20,
  initial_budget: 500000,
  owner_reserved_points: 30000,
  min_squad_size: 6,
  max_squad_size: 6,
  required_squad_slots: 5,
  reserve_per_slot: 30000,
  owner_double_deduction_enabled: false,
  owner_deduction_open: 50000,
  owner_deduction_35plus: 20000,
  owner_deduction_non_medallist: 10000,
  qualifying_teams_count: 8,
  currency_symbol: '₹',
  currency_code: 'INR',
  timezone: 'Asia/Kolkata'
};

// Category Bidding Settings: Strictly Open, 35+, and Non-Medallist as required
export const initialCategories: Category[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    tournament_id: initialTournament.id,
    name: 'OPEN',
    code: 'OPEN',
    starting_bid: 50000,
    base_reserve_points: 50000,
    min_bid_increment: 10000,
    owner_deduction: 50000,
    is_active: true,
    sort_order: 1,
    description: 'Elite open category for highest-tier players'
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    tournament_id: initialTournament.id,
    name: '35+',
    code: '35_PLUS',
    starting_bid: 20000,
    base_reserve_points: 20000,
    min_bid_increment: 10000,
    owner_deduction: 20000,
    is_active: true,
    sort_order: 2,
    description: 'Players aged 35 and above'
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    tournament_id: initialTournament.id,
    name: 'NON-MEDALLIST',
    code: 'NON_MEDALLIST',
    starting_bid: 10000,
    base_reserve_points: 10000,
    min_bid_increment: 10000,
    owner_deduction: 10000,
    is_active: true,
    sort_order: 3,
    description: 'Promising talent without prior state or national medals'
  }
];

export const initialTeams: Team[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    tournament_id: initialTournament.id,
    team_number: 1,
    name: 'Gulf Smashers',
    short_name: 'GS',
    logo_url: null,
    owner_name: 'Rajesh K. Varma',
    owner_photo_url: null,
    captain_name: 'Arjun Nambiar',
    captain_photo_url: null,
    team_color: '#FF5E00', // Gulf Orange
    accent_color: '#0A1128',
    description: 'Dynamic power hitters representing the southern coast.',
    initial_budget: 500000,
    owner_reserved_points: 30000,
    current_balance: 470000,
    total_spent: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    tournament_id: initialTournament.id,
    team_number: 2,
    name: 'Gulf Thunderbolts',
    short_name: 'GT',
    logo_url: null,
    owner_name: 'M. Senthil Nathan',
    owner_photo_url: null,
    captain_name: 'Dinesh Balaji',
    captain_photo_url: null,
    team_color: '#0284C7', // Electric Sky Blue
    accent_color: '#0369A1',
    description: 'Lightning-fast court coverage and explosive smashes.',
    initial_budget: 500000,
    owner_reserved_points: 30000,
    current_balance: 470000,
    total_spent: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    tournament_id: initialTournament.id,
    team_number: 3,
    name: 'Gulf Kings XI',
    short_name: 'GKX',
    logo_url: null,
    owner_name: 'K. Vijay Anand',
    owner_photo_url: null,
    captain_name: 'Rohan Sundaram',
    captain_photo_url: null,
    team_color: '#F59E0B', // Championship Gold
    accent_color: '#D97706',
    description: 'Royal tactical play with calculated stroke efficiency.',
    initial_budget: 500000,
    owner_reserved_points: 30000,
    current_balance: 470000,
    total_spent: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    tournament_id: initialTournament.id,
    team_number: 4,
    name: 'Gulf Strikers',
    short_name: 'GST',
    logo_url: null,
    owner_name: 'Anand Mahindra',
    owner_photo_url: null,
    captain_name: 'Vikramaditya Rao',
    captain_photo_url: null,
    team_color: '#10B981', // Championship Emerald
    accent_color: '#059669',
    description: 'High aggression, front-court domination specialists.',
    initial_budget: 500000,
    owner_reserved_points: 30000,
    current_balance: 470000,
    total_spent: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '20000000-0000-0000-0000-000000000005',
    tournament_id: initialTournament.id,
    team_number: 5,
    name: 'Gulf Shuttlers',
    short_name: 'GSH',
    logo_url: null,
    owner_name: 'P. Ravichandran',
    owner_photo_url: null,
    captain_name: 'Deepak Chahar',
    captain_photo_url: null,
    team_color: '#8B5CF6', // Purple
    accent_color: '#7C3AED',
    description: 'Master tacticians with impenetrable doubles defense.',
    initial_budget: 500000,
    owner_reserved_points: 30000,
    current_balance: 470000,
    total_spent: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '20000000-0000-0000-0000-000000000006',
    tournament_id: initialTournament.id,
    team_number: 6,
    name: 'Gulf Warriors',
    short_name: 'GW',
    logo_url: null,
    owner_name: 'G. Shanmugam',
    owner_photo_url: null,
    captain_name: 'Naveen Kumar',
    captain_photo_url: null,
    team_color: '#EC4899', // Pink
    accent_color: '#DB2777',
    description: 'Unyielding rally endurance and high-stamina shuttlers.',
    initial_budget: 500000,
    owner_reserved_points: 30000,
    current_balance: 470000,
    total_spent: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '20000000-0000-0000-0000-000000000007',
    tournament_id: initialTournament.id,
    team_number: 7,
    name: 'Gulf Blasters',
    short_name: 'GB',
    logo_url: null,
    owner_name: 'Saravanan S.',
    owner_photo_url: null,
    captain_name: 'Pradeep Venkat',
    captain_photo_url: null,
    team_color: '#EF4444', // Crimson Red
    accent_color: '#B91C1C',
    description: 'Fierce attacks with blistering jump smashes.',
    initial_budget: 500000,
    owner_reserved_points: 30000,
    current_balance: 470000,
    total_spent: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '20000000-0000-0000-0000-000000000008',
    tournament_id: initialTournament.id,
    team_number: 8,
    name: 'Gulf Falcons',
    short_name: 'GF',
    logo_url: null,
    owner_name: 'Bala Murugan',
    owner_photo_url: null,
    captain_name: 'Manoj Prabhakar',
    captain_photo_url: null,
    team_color: '#14B8A6', // Teal
    accent_color: '#0F766E',
    description: 'Pinpoint precision and rapid transition game.',
    initial_budget: 500000,
    owner_reserved_points: 30000,
    current_balance: 470000,
    total_spent: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '20000000-0000-0000-0000-000000000009',
    tournament_id: initialTournament.id,
    team_number: 9,
    name: 'Gulf Gladiators',
    short_name: 'GG',
    logo_url: null,
    owner_name: 'Venkatesh Prasad',
    owner_photo_url: null,
    captain_name: 'Harish Babu',
    captain_photo_url: null,
    team_color: '#6366F1', // Indigo
    accent_color: '#4338CA',
    description: 'Resilient defense and clinical counter-punching.',
    initial_budget: 500000,
    owner_reserved_points: 30000,
    current_balance: 470000,
    total_spent: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '20000000-0000-0000-0000-000000000010',
    tournament_id: initialTournament.id,
    team_number: 10,
    name: 'Gulf Titans',
    short_name: 'GTI',
    logo_url: null,
    owner_name: 'Ramesh Aravind',
    owner_photo_url: null,
    captain_name: 'Suresh Raina',
    captain_photo_url: null,
    team_color: '#CA8A04', // Amber
    accent_color: '#854D0E',
    description: 'Uncompromising tactical dominance and youth power.',
    initial_budget: 500000,
    owner_reserved_points: 30000,
    current_balance: 470000,
    total_spent: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Initial Real Players from Kovilpatti tournament registrations
export const initialPlayers: Player[] = realPlayers as unknown as Player[];

export const initialStandings: Standing[] = initialTeams.map((team, index) => ({
  id: `00000000-0000-0000-0000-00000000040${index}`,
  tournament_id: initialTournament.id,
  team_id: team.id,
  rank: index + 1,
  played: 0,
  won: 0,
  lost: 0,
  points: 0,
  score_for: 0,
  score_against: 0,
  score_diff: 0,
  is_qualified: false,
  is_eliminated: false,
  manual_qualifier: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}));

export const initialAdminUsers: AdminUser[] = [
  {
    id: '00000000-0000-0000-0000-000000000099',
    email: 'admin@gulfoil.com',
    full_name: 'GBL Tournament Director',
    role: 'SUPER ADMIN',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const defaultAdminUser: AdminUser = initialAdminUsers[0];
