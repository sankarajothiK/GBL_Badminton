import fs from 'fs';
import path from 'path';

const playersSeedPath = path.resolve(process.cwd(), 'src/data/players_seed.json');
const players = JSON.parse(fs.readFileSync(playersSeedPath, 'utf8'));

const sqlHeader = `-- ==============================================================================
-- GBL – Gulf Oil Badminton Premier League: COMPLETE DATABASE SETUP & SEED SCRIPT
-- Paste this entire script into your Supabase Dashboard -> SQL Editor (>_) and click "RUN".
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-initializing cleanly
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS auction_bids CASCADE;
DROP TABLE IF EXISTS auctions CASCADE;
DROP TABLE IF EXISTS gallery CASCADE;
DROP TABLE IF EXISTS standings CASCADE;
DROP TABLE IF EXISTS tournament_matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tournament_settings CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;

-- 3. TOURNAMENTS TABLE
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::UUID,
    name VARCHAR(255) NOT NULL DEFAULT 'Gulf Oil Badminton Premier League',
    short_name VARCHAR(50) NOT NULL DEFAULT 'GBL',
    season VARCHAR(50) NOT NULL DEFAULT 'Season 2026',
    logo_url TEXT,
    banner_url TEXT,
    description TEXT DEFAULT 'The official Gulf Oil Badminton Premier League tournament and live player auction.',
    venue TEXT DEFAULT 'Gokulam Sports Arena, Kovilpatti',
    tournament_dates TEXT DEFAULT 'October 24 - 26, 2026',
    auction_date TEXT DEFAULT 'October 15, 2026',
    auction_time TEXT DEFAULT '10:00 AM IST',
    registration_dates TEXT DEFAULT 'August 1 - October 10, 2026',
    organizer_name VARCHAR(255) DEFAULT 'Gulf Oil Sports Committee & Gokulam',
    sponsor_info TEXT DEFAULT 'Gulf Oil Lubricants India Ltd.',
    contact_phone VARCHAR(50) DEFAULT '+91 98844 12345',
    contact_email VARCHAR(100) DEFAULT 'gbl.tournament@gulfoil.co.in',
    social_instagram VARCHAR(255) DEFAULT 'https://instagram.com/gulfoilindia',
    social_facebook VARCHAR(255) DEFAULT 'https://facebook.com/gulfoilindia',
    social_youtube VARCHAR(255) DEFAULT 'https://youtube.com/gulfoilindia',
    rules_markdown TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TOURNAMENT SETTINGS TABLE (GBL Rules: 5L budget, 30k reserve, 5 required player slots)
CREATE TABLE tournament_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000002'::UUID,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    timer_seconds INT NOT NULL DEFAULT 20,
    initial_budget NUMERIC(12, 2) NOT NULL DEFAULT 500000.00,
    owner_reserved_points NUMERIC(12, 2) NOT NULL DEFAULT 30000.00,
    min_squad_size INT NOT NULL DEFAULT 6,
    max_squad_size INT NOT NULL DEFAULT 6,
    required_squad_slots INT NOT NULL DEFAULT 5,
    reserve_per_slot NUMERIC(12, 2) NOT NULL DEFAULT 30000.00,
    owner_double_deduction_enabled BOOLEAN NOT NULL DEFAULT false,
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

-- 5. CATEGORIES & BIDDING SETTINGS
CREATE TABLE categories (
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

-- 6. TEAMS TABLE (10 Official Teams)
CREATE TABLE teams (
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
    owner_reserved_points NUMERIC(12, 2) NOT NULL DEFAULT 30000.00,
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 470000.00,
    total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PLAYERS TABLE
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) DEFAULT 'Male',
    mobile VARCHAR(50),
    photo_url TEXT,
    academy VARCHAR(150),
    tshirt_size VARCHAR(20),
    payment_status VARCHAR(50) DEFAULT 'PAID',
    eligible_category_ids TEXT[] DEFAULT '{}',
    eligible_category_names TEXT[] DEFAULT '{}',
    achievements TEXT,
    notes TEXT,
    registration_status VARCHAR(20) DEFAULT 'APPROVED',
    auction_status VARCHAR(20) DEFAULT 'UNSOLD',
    sold_price NUMERIC(12, 2) DEFAULT NULL,
    sold_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    auction_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUCTIONS TABLE
CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
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

-- 9. AUCTION BIDS TABLE
CREATE TABLE auction_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    bid_type VARCHAR(20) DEFAULT 'NORMAL',
    is_reverted BOOLEAN DEFAULT false,
    reverted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100) DEFAULT 'Admin'
);

-- 10. STANDINGS TABLE
CREATE TABLE standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    played INT NOT NULL DEFAULT 0,
    won INT NOT NULL DEFAULT 0,
    lost INT NOT NULL DEFAULT 0,
    points INT NOT NULL DEFAULT 0,
    score_for INT NOT NULL DEFAULT 0,
    score_against INT NOT NULL DEFAULT 0,
    score_diff INT NOT NULL DEFAULT 0,
    rank INT NOT NULL DEFAULT 1,
    is_qualified BOOLEAN NOT NULL DEFAULT false,
    is_eliminated BOOLEAN NOT NULL DEFAULT false,
    manual_qualifier BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TOURNAMENT MATCHES TABLE
CREATE TABLE tournament_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    round VARCHAR(50) NOT NULL DEFAULT 'League',
    match_number INT NOT NULL,
    team1_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    team2_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    court VARCHAR(50) DEFAULT 'Court 1',
    match_date TEXT DEFAULT '2026-10-24',
    match_time TEXT DEFAULT '10:00 AM',
    status VARCHAR(20) DEFAULT 'SCHEDULED',
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

-- 12. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    actor_id VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. REALTIME BROADCASTING PERMISSIONS (Idempotent)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE auctions;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE auction_bids;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE teams;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE standings;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
END $$;

-- 14. DISABLE ROW LEVEL SECURITY FOR CLIENT APP READ/WRITE (OR CONFIGURE OPEN PUBLIC ACCESS)
ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE auctions DISABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE standings DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- INSERT INITIAL TOURNAMENT & SETTINGS
-- ==============================================================================
INSERT INTO tournaments (id, name, short_name, season)
VALUES ('00000000-0000-0000-0000-000000000001', 'Gulf Oil Badminton Premier League', 'GBL', 'Season 2026');

INSERT INTO tournament_settings (tournament_id, timer_seconds, initial_budget, owner_reserved_points, required_squad_slots, reserve_per_slot)
VALUES ('00000000-0000-0000-0000-000000000001', 20, 500000.00, 30000.00, 5, 30000.00);

-- ==============================================================================
-- INSERT CATEGORIES (3 Bidding Categories + 6 Tournament Categories)
-- ==============================================================================
INSERT INTO categories (id, tournament_id, name, code, starting_bid, base_reserve_points, min_bid_increment, is_active, sort_order) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'OPEN', 'OPEN', 50000.00, 50000.00, 10000.00, true, 1),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '35+ JUMBLED', '35_JUMBLED', 20000.00, 20000.00, 10000.00, true, 2),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'NON-MEDALLIST', 'NON_MEDALLIST', 10000.00, 10000.00, 10000.00, true, 3),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '80+ COMBINED DOUBLES', '80_COMBINED', 0.00, 0.00, 5000.00, true, 4),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'SUPER DOUBLES', 'SUPER_DOUBLES', 0.00, 0.00, 5000.00, true, 5),
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'CHALLENGERS DOUBLES', 'CHALLENGERS', 0.00, 0.00, 5000.00, true, 6),
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'FUTURE STARS', 'FUTURE_STARS', 0.00, 0.00, 5000.00, true, 7),
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'VETERANS DOUBLES', 'VETERANS', 0.00, 0.00, 5000.00, true, 8);

-- ==============================================================================
-- INSERT 10 OFFICIAL TEAMS (Total: 5L, Owner Reserve: 30k, Available: 4.7L)
-- ==============================================================================
INSERT INTO teams (id, tournament_id, team_number, name, short_name, owner_name, captain_name, team_color, initial_budget, owner_reserved_points, current_balance, total_spent) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 'Gulf Smashers', 'GS', 'Rajesh K. Varma', 'Arjun Nambiar', '#FF5E00', 500000.00, 30000.00, 470000.00, 0.00),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2, 'Gulf Thunderbolts', 'GT', 'Anand Mahindra', 'Karthik S.', '#0284C7', 500000.00, 30000.00, 470000.00, 0.00),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 3, 'Gulf Kings XI', 'GK', 'Sanjay Dutt', 'Vikramaditya Rao', '#F59E0B', 500000.00, 30000.00, 470000.00, 0.00),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 4, 'Gulf Strikers', 'GST', 'Dr. Radhakrishnan', 'Deepak Chandran', '#10B981', 500000.00, 30000.00, 470000.00, 0.00),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 5, 'Gulf Shuttlers', 'GSH', 'Praveen Chander', 'Ganesh Moorthy', '#8B5CF6', 500000.00, 30000.00, 470000.00, 0.00),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 6, 'Gulf Warriors', 'GW', 'Murali Vijay', 'Santhosh Kumar', '#EC4899', 500000.00, 30000.00, 470000.00, 0.00),
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 7, 'Gulf Blasters', 'GB', 'Saravanan S.', 'Pradeep Venkat', '#EF4444', 500000.00, 30000.00, 470000.00, 0.00),
('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 8, 'Gulf Falcons', 'GF', 'Bala Murugan', 'Manoj Prabhakar', '#14B8A6', 500000.00, 30000.00, 470000.00, 0.00),
('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 9, 'Gulf Gladiators', 'GG', 'Venkatesh Prasad', 'Harish Babu', '#6366F1', 500000.00, 30000.00, 470000.00, 0.00),
('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 10, 'Gulf Titans', 'GTI', 'Ramesh Aravind', 'Suresh Raina', '#EAB308', 500000.00, 30000.00, 470000.00, 0.00);

-- ==============================================================================
-- INSERT INITIAL STANDINGS FOR 10 TEAMS (Clean 0 points)
-- ==============================================================================
INSERT INTO standings (tournament_id, team_id, played, won, lost, points, score_for, score_against, score_diff, rank)
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID,
    id,
    0, 0, 0, 0, 0, 0, 0,
    team_number
FROM teams;

-- ==============================================================================
-- INSERT ALL 69 REAL KOVILPATTI REGISTERED PLAYERS
-- ==============================================================================
INSERT INTO players (id, tournament_id, player_code, name, age, gender, mobile, photo_url, academy, eligible_category_names, achievements, auction_status, auction_order) VALUES
`;

const playerRows = players.map(p => {
  const safeName = p.name.replace(/'/g, "''");
  const safeAcademy = (p.academy || '').replace(/'/g, "''");
  const safePhoto = (p.photo_url || '').replace(/'/g, "''");
  const safeCats = (p.eligible_category_names || []).map(c => `"${c.replace(/"/g, '\\"')}"`).join(',');
  const safeAch = (p.achievements || '').replace(/'/g, "''");
  
  return `('${p.id}', '00000000-0000-0000-0000-000000000001', '${p.player_code}', '${safeName}', ${p.age || 25}, '${p.gender || 'Male'}', '${p.mobile || ''}', '${safePhoto}', '${safeAcademy}', '{${safeCats}}', '${safeAch}', 'UNSOLD', ${p.auction_order || 1})`;
}).join(',\n');

const fullSQL = sqlHeader + playerRows + ';\n\n-- SETUP COMPLETE!\n';

const outSQLPath = path.resolve(process.cwd(), 'supabase/setup_and_seed_all.sql');
fs.writeFileSync(outSQLPath, fullSQL, 'utf8');
console.log(`Generated complete Supabase SQL script at: ${outSQLPath}`);
