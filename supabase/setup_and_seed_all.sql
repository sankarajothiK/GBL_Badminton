-- ==============================================================================
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
('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 'GBL-001', 'Jayasanth', 31, 'Male', '9.789237332E9', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 1),
('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', 'GBL-002', 'Raj', 44, 'Male', '8.883730018E9', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', 'Turbo Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Turbo Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 2),
('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', 'GBL-003', 'Ramakrishnan(fire)', 45, 'Male', '8.2209583E9', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', 'Turbo Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Turbo Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 3),
('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000001', 'GBL-004', 'V.marirajendran', 45, 'Male', '9.626447272E9', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"35+","Veterans Doubles","80+","Combined Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 4),
('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000001', 'GBL-005', 'Balakumar', 34, 'Male', '7.305060123E9', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 5),
('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000001', 'GBL-006', 'BENNIE', 53, 'Male', '9.8652333E9', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 6),
('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0000-000000000001', 'GBL-007', 'A.Arockia muthuraj', 42, 'Male', '9.944678135E9', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 7),
('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0000-000000000001', 'GBL-008', 'Vignesh raam N K', 19, 'Male', '9.080094765E9', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 8),
('00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0000-000000000001', 'GBL-009', 'Arul Kantharaj M', 47, 'Male', '9.994282849E9', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'Union Club Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Union Club Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 9),
('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0000-000000000001', 'GBL-010', 'Muruganantham.S', 45, 'Male', '9.841471471E9', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', 'Sakthi badminton club', '{"Veterans Doubles"}', 'Affiliated with Sakthi badminton club. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 10),
('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0000-000000000001', 'GBL-011', 'Ponsingh Antony Clarance J', 35, 'Male', '8.220006949E9', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 11),
('00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0000-000000000001', 'GBL-012', 'JEEVA', 42, 'Male', '9.629611055E9', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 12),
('00000000-0000-0000-0002-000000000013', '00000000-0000-0000-0000-000000000001', 'GBL-013', 'Sathya narayanan', 33, 'Male', '9.566922314E9', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', 'Jolly Friends Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Jolly Friends Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 13),
('00000000-0000-0000-0002-000000000014', '00000000-0000-0000-0000-000000000001', 'GBL-014', 'Ranjith Hari', 27, 'Male', '9.585502634E9', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', 'Captains Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Captains Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 14),
('00000000-0000-0000-0002-000000000015', '00000000-0000-0000-0000-000000000001', 'GBL-015', 'Karthick Raja', 38, 'Male', '9.994167828E9', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80', 'Jolly Friends Academy', '{"Open","35+","Jumbled","Super Doubles"}', 'Affiliated with Jolly Friends Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 15),
('00000000-0000-0000-0002-000000000016', '00000000-0000-0000-0000-000000000001', 'GBL-016', 'Harish', 27, 'Male', '7.708899341E9', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80', 'Turbo Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Turbo Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 16),
('00000000-0000-0000-0002-000000000017', '00000000-0000-0000-0000-000000000001', 'GBL-017', 'Manikandan', 49, 'Male', '9.443659941E9', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'Turbo Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Turbo Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 17),
('00000000-0000-0000-0002-000000000018', '00000000-0000-0000-0000-000000000001', 'GBL-018', 'Vignesh', 34, 'Male', '8.807009324E9', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 18),
('00000000-0000-0000-0002-000000000019', '00000000-0000-0000-0000-000000000001', 'GBL-019', 'R.marikannan', 47, 'Male', '9.566986273E9', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', 'Captains Badminton Academy', '{"Veterans Doubles"}', 'Affiliated with Captains Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 19),
('00000000-0000-0000-0002-000000000020', '00000000-0000-0000-0000-000000000001', 'GBL-020', 'Vignesh JK', 29, 'Male', '7.094831937E9', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 20),
('00000000-0000-0000-0002-000000000021', '00000000-0000-0000-0000-000000000001', 'GBL-021', 'SENTHAMIL', 32, 'Male', '9.840861317E9', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', 'Turbo Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Turbo Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 21),
('00000000-0000-0000-0002-000000000022', '00000000-0000-0000-0000-000000000001', 'GBL-022', 'Eric', 30, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', 'Captains Badminton Academy', '{"Open","Super Doubles","Future Stars"}', 'Affiliated with Captains Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 22),
('00000000-0000-0000-0002-000000000023', '00000000-0000-0000-0000-000000000001', 'GBL-023', 'Vignesh S', 33, 'Male', '9.486427272E9', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 23),
('00000000-0000-0000-0002-000000000024', '00000000-0000-0000-0000-000000000001', 'GBL-024', 'DEEPAK KUMAR', 40, 'Male', '9.600346543E9', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80', 'Turbo Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Turbo Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 24),
('00000000-0000-0000-0002-000000000025', '00000000-0000-0000-0000-000000000001', 'GBL-025', 'Ganesan m', 38, 'Male', '8.883123789E9', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 25),
('00000000-0000-0000-0002-000000000026', '00000000-0000-0000-0000-000000000001', 'GBL-026', 'R Hari Vignesh', 27, 'Male', '8.903426122E9', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', 'Turbo Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Turbo Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 26),
('00000000-0000-0000-0002-000000000027', '00000000-0000-0000-0000-000000000001', 'GBL-027', 'ANTRO RUBAN S', 24, 'Male', '6.382464759E9', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 27),
('00000000-0000-0000-0002-000000000028', '00000000-0000-0000-0000-000000000001', 'GBL-028', 'Selvaraj T', 61, 'Male', '9.042130987E9', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 28),
('00000000-0000-0000-0002-000000000029', '00000000-0000-0000-0000-000000000001', 'GBL-029', 'J.Raja', 44, 'Male', '7.904976262E9', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', 'Union Club Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Union Club Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 29),
('00000000-0000-0000-0002-000000000030', '00000000-0000-0000-0000-000000000001', 'GBL-030', 'Dr Mohanaselvan', 37, 'Male', '9.994200122E9', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', 'Turbo Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Turbo Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 30),
('00000000-0000-0000-0002-000000000031', '00000000-0000-0000-0000-000000000001', 'GBL-031', 'Vallichouthry A', 29, 'Male', '8.148871169E9', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80', 'Turbo Badminton Academy', '{"Open","35+","Jumbled","Super Doubles"}', 'Affiliated with Turbo Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 31),
('00000000-0000-0000-0002-000000000032', '00000000-0000-0000-0000-000000000001', 'GBL-032', 'Arvind S', 19, 'Male', '7.010570727E9', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80', 'Turbo Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Turbo Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 32),
('00000000-0000-0000-0002-000000000033', '00000000-0000-0000-0000-000000000001', 'GBL-033', 'Pravinbose', 25, 'Male', '9.344207418E9', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'Turbo Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Turbo Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 33),
('00000000-0000-0000-0002-000000000034', '00000000-0000-0000-0000-000000000001', 'GBL-034', 'SARAVANASELVAM S', 49, 'Male', '9.84313424E9', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', 'Turbo Badminton Academy', '{"80+","Combined Doubles","Veterans Doubles"}', 'Affiliated with Turbo Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 34),
('00000000-0000-0000-0002-000000000035', '00000000-0000-0000-0000-000000000001', 'GBL-035', 'Sundar', 54, 'Male', '9.994916169E9', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', 'Jolly Friends Academy', '{"80+","Combined Doubles","Veterans Doubles"}', 'Affiliated with Jolly Friends Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 35),
('00000000-0000-0000-0002-000000000036', '00000000-0000-0000-0000-000000000001', 'GBL-036', 'Hari haran', 34, 'Male', '9.791959527E9', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"35+","Jumbled","80+","Combined Doubles","Super Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 36),
('00000000-0000-0000-0002-000000000037', '00000000-0000-0000-0000-000000000001', 'GBL-037', 'Raj kumar', 52, 'Male', '9.940999567E9', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', 'Literary Association Academy', '{"80+","Combined Doubles","Veterans Doubles"}', 'Affiliated with Literary Association Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 37),
('00000000-0000-0000-0002-000000000038', '00000000-0000-0000-0000-000000000001', 'GBL-038', 'RAMESH P', 46, 'Male', '9.994170753E9', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', 'Sharavanas Badminton Academy', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with Sharavanas Badminton Academy. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 38),
('00000000-0000-0000-0002-000000000039', '00000000-0000-0000-0000-000000000001', 'GBL-039', 'HARIVIGNESH', 27, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80', 'TURBO', '{"35+","Jumbled","80+","Combined Doubles","Super Doubles"}', 'Affiliated with TURBO. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 39),
('00000000-0000-0000-0002-000000000040', '00000000-0000-0000-0000-000000000001', 'GBL-040', 'GOKUL', 35, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80', 'SHARAVANAS', '{"35+","Jumbled","80+","Combined Doubles","Super Doubles"}', 'Affiliated with SHARAVANAS. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 40),
('00000000-0000-0000-0002-000000000041', '00000000-0000-0000-0000-000000000001', 'GBL-041', 'HARIHARAN', 34, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'SHARAVANAS', '{"35+","Jumbled","80+","Combined Doubles","Super Doubles"}', 'Affiliated with SHARAVANAS. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 41),
('00000000-0000-0000-0002-000000000042', '00000000-0000-0000-0000-000000000001', 'GBL-042', 'SANJAI KARNA', 24, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', 'SHARAVANAS', '{"35+","Jumbled","80+","Combined Doubles","Super Doubles"}', 'Affiliated with SHARAVANAS. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 42),
('00000000-0000-0000-0002-000000000043', '00000000-0000-0000-0000-000000000001', 'GBL-043', 'GOWTHAM', 31, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', 'TURBO', '{"35+","Jumbled","80+","Combined Doubles","Super Doubles"}', 'Affiliated with TURBO. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 43),
('00000000-0000-0000-0002-000000000044', '00000000-0000-0000-0000-000000000001', 'GBL-044', 'ARUL KANTHARAJ', 47, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80', 'UNION', '{"35+","Jumbled","80+","Combined Doubles","Super Doubles","Veterans Doubles"}', 'Affiliated with UNION. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 44),
('00000000-0000-0000-0002-000000000045', '00000000-0000-0000-0000-000000000001', 'GBL-045', 'DEEPAK', 40, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', 'SHARAVANAS', '{"35+","Jumbled","80+","Combined Doubles","Super Doubles","Veterans Doubles"}', 'Affiliated with SHARAVANAS. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 45),
('00000000-0000-0000-0002-000000000046', '00000000-0000-0000-0000-000000000001', 'GBL-046', 'MURUGANANTHAN', 46, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', 'SAKTHI', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with SAKTHI. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 46),
('00000000-0000-0000-0002-000000000047', '00000000-0000-0000-0000-000000000001', 'GBL-047', 'MANIKANDAN. P', 49, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80', 'TURBO', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with TURBO. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 47),
('00000000-0000-0000-0002-000000000048', '00000000-0000-0000-0000-000000000001', 'GBL-048', 'PONSINGH', 35, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80', 'SHARAVANAS', '{"35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars"}', 'Affiliated with SHARAVANAS. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 48),
('00000000-0000-0000-0002-000000000049', '00000000-0000-0000-0000-000000000001', 'GBL-049', 'KAYATHAR GANESHAN', 49, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'TURBO', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with TURBO. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 49),
('00000000-0000-0000-0002-000000000050', '00000000-0000-0000-0000-000000000001', 'GBL-050', 'SELVARAJ', 62, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', 'SHARAVANAS', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with SHARAVANAS. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 50),
('00000000-0000-0000-0002-000000000051', '00000000-0000-0000-0000-000000000001', 'GBL-051', 'KSR SELVAM', 45, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', 'TURBO', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with TURBO. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 51),
('00000000-0000-0000-0002-000000000052', '00000000-0000-0000-0000-000000000001', 'GBL-052', 'RAMAKRISHNAN', 45, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80', 'TURBO', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with TURBO. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 52),
('00000000-0000-0000-0002-000000000053', '00000000-0000-0000-0000-000000000001', 'GBL-053', 'MARIYA RAJENDRAN', 45, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', 'SHARAVANAS', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with SHARAVANAS. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 53),
('00000000-0000-0000-0002-000000000054', '00000000-0000-0000-0000-000000000001', 'GBL-054', 'ERIC PHILIP ADAM', 39, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', 'TURBO', '{"35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars"}', 'Affiliated with TURBO. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 54),
('00000000-0000-0000-0002-000000000055', '00000000-0000-0000-0000-000000000001', 'GBL-055', 'JAYAKUMAR', 52, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80', 'SHARAVANAS', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with SHARAVANAS. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 55),
('00000000-0000-0000-0002-000000000056', '00000000-0000-0000-0000-000000000001', 'GBL-056', 'RAJA J', 44, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80', 'UNION', '{"35+","Jumbled","80+","Combined Doubles","Super Doubles"}', 'Affiliated with UNION. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 56),
('00000000-0000-0000-0002-000000000057', '00000000-0000-0000-0000-000000000001', 'GBL-057', 'RAJKUMAR', 53, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'LITERARY', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with LITERARY. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 57),
('00000000-0000-0000-0002-000000000058', '00000000-0000-0000-0000-000000000001', 'GBL-058', 'KALYANA SUNDRAM', 35, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '16', '{"35+","Jumbled","Super Doubles"}', 'Affiliated with 16. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 58),
('00000000-0000-0000-0002-000000000059', '00000000-0000-0000-0000-000000000001', 'GBL-059', 'DHANUSHKODI', 35, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', '19', '{"35+","Jumbled","Super Doubles"}', 'Affiliated with 19. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 59),
('00000000-0000-0000-0002-000000000060', '00000000-0000-0000-0000-000000000001', 'GBL-060', 'TURBO', 35, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80', '20', '{"35+","Jumbled","Super Doubles"}', 'Affiliated with 20. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 60),
('00000000-0000-0000-0002-000000000061', '00000000-0000-0000-0000-000000000001', 'GBL-061', 'SHARAVANAS', 35, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', '32', '{"35+","Jumbled","Super Doubles"}', 'Affiliated with 32. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 61),
('00000000-0000-0000-0002-000000000062', '00000000-0000-0000-0000-000000000001', 'GBL-062', 'ALL CATEGORIES', 23, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', 'PON SUBBURAJ', '{"Open","Super Doubles","Future Stars"}', 'Affiliated with PON SUBBURAJ. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 62),
('00000000-0000-0000-0002-000000000063', '00000000-0000-0000-0000-000000000001', 'GBL-063', 'AROCKIA MUTHURAJ', 42, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80', 'SHARAVANAS', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with SHARAVANAS. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 63),
('00000000-0000-0000-0002-000000000064', '00000000-0000-0000-0000-000000000001', 'GBL-064', 'SURESH KUMAR', 55, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80', 'LITERARY', '{"Open","35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars","Veterans Doubles"}', 'Affiliated with LITERARY. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 64),
('00000000-0000-0000-0002-000000000065', '00000000-0000-0000-0000-000000000001', 'GBL-065', 'DANY MADHAVAN', 35, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'SHARAVANAS', '{"35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars"}', 'Affiliated with SHARAVANAS. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 65),
('00000000-0000-0000-0002-000000000066', '00000000-0000-0000-0000-000000000001', 'GBL-066', 'DR MOHANA SELVAN', 37, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', 'TURBO', '{"35+","Jumbled","80+","Combined Doubles","Super Doubles","Challenges Doubles","Future Stars"}', 'Affiliated with TURBO. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 66),
('00000000-0000-0000-0002-000000000067', '00000000-0000-0000-0000-000000000001', 'GBL-067', 'IBRAHIM IBU', 39, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', '35+,80+,SD,CD,FS', '{"35+","Jumbled","Super Doubles"}', 'Affiliated with 35+,80+,SD,CD,FS. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 67),
('00000000-0000-0000-0002-000000000068', '00000000-0000-0000-0000-000000000001', 'GBL-068', 'CAPTAINS', 35, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80', '30', '{"35+","Jumbled","Super Doubles"}', 'Affiliated with 30. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 68),
('00000000-0000-0000-0002-000000000069', '00000000-0000-0000-0000-000000000001', 'GBL-069', 'LITERARY', 35, 'Male', '+91 98840 00000', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', '31', '{"35+","Jumbled","Super Doubles"}', 'Affiliated with 31. Registered for GBL 2026 Kovilpatti tournament.', 'UNSOLD', 69);

-- 11. Disable Row Level Security on all tables for seamless write/update from admin panel
ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE auctions DISABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE standings DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- 12. Grant permissions to public/anon role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- SETUP COMPLETE!
