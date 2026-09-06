-- ==============================================================================
-- GBL – Gulf Oil Badminton Premier League Database Schema
-- Supabase PostgreSQL with UUIDs, RLS, and Realtime Publication
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'Gulf Oil Badminton Premier League',
    short_name VARCHAR(50) NOT NULL DEFAULT 'GBL',
    season VARCHAR(50) NOT NULL DEFAULT 'Season 2026',
    logo_url TEXT,
    banner_url TEXT,
    description TEXT DEFAULT 'The official Gulf Oil Badminton Premier League tournament and live player auction.',
    venue TEXT DEFAULT 'Gulf Sports Arena, Chennai',
    tournament_dates TEXT DEFAULT 'October 24 - 26, 2026',
    auction_date TEXT DEFAULT 'October 15, 2026',
    auction_time TEXT DEFAULT '10:00 AM IST',
    registration_dates TEXT DEFAULT 'August 1 - September 30, 2026',
    organizer_name VARCHAR(255) DEFAULT 'Gulf Oil Sports Committee',
    sponsor_info TEXT DEFAULT 'Gulf Oil Lubricants India Ltd.',
    contact_phone VARCHAR(50) DEFAULT '+91 98844 00123',
    contact_email VARCHAR(100) DEFAULT 'gbl.tournament@gulfoil.co.in',
    social_instagram VARCHAR(255) DEFAULT 'https://instagram.com/gulfoilindia',
    social_facebook VARCHAR(255) DEFAULT 'https://facebook.com/gulfoilindia',
    social_youtube VARCHAR(255) DEFAULT 'https://youtube.com/gulfoilindia',
    rules_markdown TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TOURNAMENT SETTINGS TABLE
CREATE TABLE IF NOT EXISTS tournament_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    timer_seconds INT NOT NULL DEFAULT 20,
    initial_budget NUMERIC(12, 2) NOT NULL DEFAULT 500000.00,
    min_squad_size INT NOT NULL DEFAULT 5,
    max_squad_size INT NOT NULL DEFAULT 12,
    required_squad_slots INT NOT NULL DEFAULT 7,
    reserve_per_slot NUMERIC(12, 2) NOT NULL DEFAULT 20000.00,
    owner_double_deduction_enabled BOOLEAN NOT NULL DEFAULT true,
    owner_deduction_open NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
    owner_deduction_35plus NUMERIC(12, 2) NOT NULL DEFAULT 20000.00,
    owner_deduction_non_medallist NUMERIC(12, 2) NOT NULL DEFAULT 10000.00,
    qualifying_teams_count INT NOT NULL DEFAULT 8,
    currency_symbol VARCHAR(10) NOT NULL DEFAULT '₹',
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES & BIDDING SETTINGS TABLE
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    starting_bid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    base_reserve_points NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_bid_increment NUMERIC(12, 2) NOT NULL DEFAULT 10000.00,
    max_player_slots INT DEFAULT NULL,
    owner_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEAMS TABLE (Initially 10 teams)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_number INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(10) NOT NULL,
    logo_url TEXT,
    owner_name VARCHAR(150),
    owner_photo_url TEXT,
    captain_name VARCHAR(150),
    captain_photo_url TEXT,
    team_color VARCHAR(30) DEFAULT '#FF5E00',
    accent_color VARCHAR(30) DEFAULT '#0A1128',
    description TEXT,
    initial_budget NUMERIC(12, 2) NOT NULL DEFAULT 500000.00,
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 500000.00,
    total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    age INT,
    gender VARCHAR(20) DEFAULT 'Male',
    mobile VARCHAR(30),
    photo_url TEXT,
    eligible_category_ids TEXT[] DEFAULT '{}', -- array of category UUIDs or names
    eligible_category_names TEXT[] DEFAULT '{}',
    achievements TEXT,
    notes TEXT,
    registration_status VARCHAR(50) DEFAULT 'APPROVED', -- PENDING, APPROVED, REJECTED
    auction_status VARCHAR(50) DEFAULT 'UNSOLD',       -- UNSOLD, LIVE, SOLD
    sold_price NUMERIC(12, 2) DEFAULT NULL,
    sold_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    auction_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AUCTIONS TABLE (Current & historical live auctions)
CREATE TABLE IF NOT EXISTS auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'READY', -- READY, LIVE, PAUSED, SOLD, UNSOLD, CANCELLED
    starting_bid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_bid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    highest_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    server_started_at TIMESTAMPTZ,
    server_expires_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    remaining_seconds_at_pause INT DEFAULT 20,
    completed_at TIMESTAMPTZ,
    created_by VARCHAR(100) DEFAULT 'Admin',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AUCTION BIDS TABLE (Immutable bid log with revert marker)
CREATE TABLE IF NOT EXISTS auction_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    bid_type VARCHAR(50) NOT NULL DEFAULT 'NORMAL', -- NORMAL, QUICK_10K, QUICK_20K, QUICK_50K, EDITED, UNDO
    is_reverted BOOLEAN DEFAULT false,
    reverted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100) DEFAULT 'Admin'
);

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    actor_id TEXT,
    actor_role VARCHAR(50) DEFAULT 'SUPER ADMIN',
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TOURNAMENT MATCHES TABLE
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    round VARCHAR(50) NOT NULL DEFAULT 'Group Stage', -- Group Stage, Quarter Final, Semi Final, Final
    match_number INT NOT NULL,
    team1_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    team2_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    court VARCHAR(50) DEFAULT 'Court 1',
    match_date DATE DEFAULT CURRENT_DATE,
    match_time VARCHAR(20) DEFAULT '10:00 AM',
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, LIVE, COMPLETED
    winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    score_summary VARCHAR(100),
    set1_team1 INT DEFAULT 0,
    set1_team2 INT DEFAULT 0,
    set2_team1 INT DEFAULT 0,
    set2_team2 INT DEFAULT 0,
    set3_team1 INT DEFAULT 0,
    set3_team2 INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. STANDINGS TABLE
CREATE TABLE IF NOT EXISTS standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    played INT DEFAULT 0,
    won INT DEFAULT 0,
    lost INT DEFAULT 0,
    points INT DEFAULT 0,
    score_for INT DEFAULT 0,
    score_against INT DEFAULT 0,
    score_diff INT DEFAULT 0,
    rank INT DEFAULT 0,
    is_qualified BOOLEAN DEFAULT false,
    is_eliminated BOOLEAN DEFAULT false,
    manual_qualifier BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. GALLERY TABLE
CREATE TABLE IF NOT EXISTS gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'tournament', -- tournament, auction, teams, matches
    image_url TEXT NOT NULL,
    caption TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ADMIN ROLES & PROFILES TABLE
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- References auth.users(id) when linked
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'VIEWER', -- SUPER ADMIN, AUCTION ADMIN, TOURNAMENT ADMIN, VIEWER
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_players_auction_status ON players(auction_status);
CREATE INDEX IF NOT EXISTS idx_players_tournament ON players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_standings_points ON standings(points DESC, score_diff DESC);

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE auction_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE standings;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
