export type AuctionStatus = 'READY' | 'LIVE' | 'PAUSED' | 'SOLD' | 'UNSOLD' | 'CANCELLED';

export type BidType = 'NORMAL' | 'QUICK_10K' | 'QUICK_20K' | 'QUICK_50K' | 'EDITED' | 'UNDO';

export type AdminRole = 'SUPER ADMIN' | 'AUCTION ADMIN' | 'TOURNAMENT ADMIN' | 'VIEWER';

export interface Tournament {
  id: string;
  name: string;
  short_name: string;
  season: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string;
  venue: string;
  tournament_dates: string;
  auction_date: string;
  auction_time: string;
  registration_dates: string;
  organizer_name: string;
  sponsor_info: string;
  contact_phone: string;
  contact_email: string;
  social_instagram: string;
  social_facebook: string;
  social_youtube: string;
  rules_markdown?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ELIGIBLE_CATEGORIES = [
  '35',
  '80',
  'Super Doubles',
  'Challengers Doubles',
  'Future Stars',
  'Veteran Doubles'
] as const;

export type EligibleCategory = typeof ELIGIBLE_CATEGORIES[number];

export const AUCTION_CATEGORIES = [
  'OPEN',
  'NON-MEDALLIST',
  '35+ AGE'
] as const;

export type AuctionCategory = typeof AUCTION_CATEGORIES[number];

// Retain alias for any existing references
export const OFFICIAL_PLAYER_CATEGORIES = ELIGIBLE_CATEGORIES;
export type OfficialPlayerCategory = EligibleCategory;

export interface TournamentSettings {
  id: string;
  tournament_id: string;
  timer_seconds: number;
  initial_budget: number;
  owner_reserved_points: number;
  min_squad_size: number;
  max_squad_size: number;
  required_squad_slots: number;
  reserve_per_slot: number;
  owner_double_deduction_enabled: boolean;
  owner_deduction_open: number;
  owner_deduction_35plus: number;
  owner_deduction_non_medallist: number;
  qualifying_teams_count: number;
  currency_symbol: string;
  currency_code: string;
  timezone: string;
}

export interface Category {
  id: string;
  tournament_id: string;
  name: string;
  code: string;
  starting_bid: number;
  base_reserve_points: number;
  min_bid_increment: number;
  max_player_slots?: number | null;
  owner_deduction: number;
  is_active: boolean;
  sort_order: number;
  description?: string;
}

export interface Team {
  id: string;
  tournament_id: string;
  team_number: number;
  name: string;
  short_name: string;
  logo_url: string | null;
  owner_name: string;
  owner_photo_url: string | null;
  captain_name: string;
  captain_photo_url: string | null;
  team_color: string;
  accent_color: string;
  description: string;
  initial_budget: number;
  owner_reserved_points: number;
  current_balance: number;
  total_spent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Owner & Auction Allocation Rules
  owner_is_player?: boolean;
  owner_points_allocation?: number;
  auction_budget?: number;
  max_auction_slots?: number;
  total_squad_slots?: number;
}

export interface Player {
  id: string;
  tournament_id: string;
  player_code: string;
  name: string;
  age: number;
  gender: string;
  mobile: string;
  photo_url: string | null;
  academy?: string;
  tshirt_size?: string;
  payment_status?: string;
  eligible_category_ids: string[];
  eligible_category_names: string[];
  auction_category?: AuctionCategory;
  achievements: string;
  notes: string;
  registration_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  auction_status: 'UNSOLD' | 'LIVE' | 'SOLD';
  sold_price: number | null;
  sold_team_id: string | null;
  auction_order: number;
  created_at: string;
  updated_at: string;
}

export interface Auction {
  id: string;
  tournament_id: string;
  player_id: string;
  category_id: string;
  status: AuctionStatus;
  starting_bid: number;
  current_bid: number;
  highest_team_id: string | null;
  server_started_at: string | null;
  server_expires_at: string | null;
  paused_at: string | null;
  remaining_seconds_at_pause: number;
  completed_at: string | null;
  created_by: string;
  updated_at: string;
}

export interface AuctionBid {
  id: string;
  auction_id: string;
  team_id: string;
  amount: number;
  bid_type: BidType;
  increment_amount?: number;
  is_reverted: boolean;
  reverted_at?: string | null;
  notes?: string;
  created_at: string;
  created_by: string;
  team_name?: string;
  team_color?: string;
}

export interface AuditLog {
  id: string;
  tournament_id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  category_id: string | null;
  round: string;
  match_number: number;
  team1_id: string;
  team2_id: string;
  court: string;
  match_date: string;
  match_time: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  winner_team_id: string | null;
  score_summary: string | null;
  set1_team1: number;
  set1_team2: number;
  set2_team1: number;
  set2_team2: number;
  set3_team1: number;
  set3_team2: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Standing {
  id: string;
  tournament_id: string;
  team_id: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  score_for: number;
  score_against: number;
  score_diff: number;
  rank: number;
  is_qualified: boolean;
  is_eliminated: boolean;
  manual_qualifier: boolean;
}

export interface GalleryItem {
  id: string;
  tournament_id: string;
  title: string;
  category: 'tournament' | 'auction' | 'teams' | 'matches';
  image_url: string;
  caption: string;
  sort_order: number;
  created_at: string;
}

export interface AdminUser {
  id: string;
  user_id?: string;
  email: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
