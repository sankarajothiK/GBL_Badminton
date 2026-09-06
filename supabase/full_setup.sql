-- ==============================================================================
-- GBL – Gulf Oil Badminton Premier League: FULL SUPABASE SETUP SCRIPT
-- Run this complete script in Supabase Dashboard -> SQL Editor (Left sidebar >_)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TOURNAMENTS
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'Gulf Oil Badminton Premier League',
    short_name VARCHAR(50) NOT NULL DEFAULT 'GBL',
    season VARCHAR(50) NOT NULL DEFAULT 'Season 2026',
    logo_url TEXT,
    banner_url TEXT,
    description TEXT DEFAULT 'The official Gulf Oil Badminton Premier League tournament and live player auction.',
    venue TEXT DEFAULT 'Gulf Sports Arena, Chennai',
    tournament_dates TEXT DEFAULT 'November 14 - 16, 2026',
    auction_date TEXT DEFAULT 'November 1, 2026',
    auction_time TEXT DEFAULT '10:00 AM IST',
    registration_dates TEXT DEFAULT 'August 1 - October 20, 2026',
    organizer_name VARCHAR(255) DEFAULT 'Gulf Oil Sports Committee',
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

-- 3. TOURNAMENT SETTINGS
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

-- 4. CATEGORIES
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

-- 5. TEAMS
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

-- 6. PLAYERS
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    age INT,
    gender VARCHAR(20) DEFAULT 'Male',
    mobile VARCHAR(30),
    photo_url TEXT,
    eligible_category_ids TEXT[] DEFAULT '{}',
    eligible_category_names TEXT[] DEFAULT '{}',
    achievements TEXT,
    notes TEXT,
    registration_status VARCHAR(50) DEFAULT 'APPROVED',
    auction_status VARCHAR(50) DEFAULT 'UNSOLD',
    sold_price NUMERIC(12, 2) DEFAULT NULL,
    sold_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    auction_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AUCTIONS
CREATE TABLE IF NOT EXISTS auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'READY',
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

-- 8. AUCTION BIDS
CREATE TABLE IF NOT EXISTS auction_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    bid_type VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    is_reverted BOOLEAN DEFAULT false,
    reverted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100) DEFAULT 'Admin'
);

-- 9. AUDIT LOGS
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

-- 10. TOURNAMENT MATCHES
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    round VARCHAR(50) NOT NULL DEFAULT 'Group Stage',
    match_number INT NOT NULL,
    team1_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    team2_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    court VARCHAR(50) DEFAULT 'Court 1',
    match_date DATE DEFAULT CURRENT_DATE,
    match_time VARCHAR(20) DEFAULT '10:00 AM',
    status VARCHAR(50) DEFAULT 'SCHEDULED',
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

-- 11. STANDINGS
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

-- 12. GALLERY
CREATE TABLE IF NOT EXISTS gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'tournament',
    image_url TEXT NOT NULL,
    caption TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ADMIN USERS
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ATOMIC CONCURRENCY STORED PROCEDURES (RPC)
-- ==============================================================================

-- RPC: PLACE BID
CREATE OR REPLACE FUNCTION rpc_place_bid(
    p_auction_id UUID,
    p_team_id UUID,
    p_amount NUMERIC(12, 2),
    p_bid_type VARCHAR(50) DEFAULT 'NORMAL',
    p_actor_name VARCHAR(100) DEFAULT 'Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction RECORD;
    v_team RECORD;
    v_category RECORD;
    v_settings RECORD;
    v_current_squad_count INT;
    v_remaining_slots INT;
    v_reserve_required NUMERIC(12, 2);
    v_max_legal_bid NUMERIC(12, 2);
    v_new_expires_at TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    IF v_auction.status != 'LIVE' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not live');
    END IF;

    SELECT * INTO v_team FROM teams WHERE id = p_team_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Team not found');
    END IF;

    SELECT * INTO v_category FROM categories WHERE id = v_auction.category_id;
    SELECT * INTO v_settings FROM tournament_settings WHERE tournament_id = v_auction.tournament_id LIMIT 1;

    -- Amount validations
    IF v_auction.current_bid > 0 THEN
        IF p_amount <= v_auction.current_bid THEN
            RETURN jsonb_build_object('success', false, 'error', 'Bid must be higher than current bid of ₹' || v_auction.current_bid::TEXT);
        END IF;
    ELSE
        IF p_amount < v_auction.starting_bid THEN
            RETURN jsonb_build_object('success', false, 'error', 'Bid cannot be less than starting bid of ₹' || v_auction.starting_bid::TEXT);
        END IF;
    END IF;

    IF p_amount > v_team.current_balance THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient team balance. Available: ₹' || v_team.current_balance::TEXT);
    END IF;

    -- Max Legal Bid Rule
    SELECT COUNT(*) INTO v_current_squad_count FROM players WHERE sold_team_id = p_team_id;
    v_remaining_slots := GREATEST(0, COALESCE(v_settings.required_squad_slots, 7) - (v_current_squad_count + 1));
    v_reserve_required := v_remaining_slots * COALESCE(v_settings.reserve_per_slot, 20000.00);
    v_max_legal_bid := GREATEST(0, v_team.current_balance - v_reserve_required);

    IF p_amount > v_max_legal_bid THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Bid exceeds maximum legal bid of ₹' || v_max_legal_bid::TEXT
        );
    END IF;

    v_new_expires_at := NOW() + (COALESCE(v_settings.timer_seconds, 20) || ' seconds')::INTERVAL;

    UPDATE auctions
    SET current_bid = p_amount,
        highest_team_id = p_team_id,
        server_expires_at = v_new_expires_at,
        updated_at = NOW()
    WHERE id = p_auction_id;

    INSERT INTO auction_bids (auction_id, team_id, amount, bid_type, created_at, created_by)
    VALUES (p_auction_id, p_team_id, p_amount, p_bid_type, NOW(), p_actor_name);

    INSERT INTO audit_logs (tournament_id, actor_id, actor_role, action, details)
    VALUES (
        v_auction.tournament_id,
        p_actor_name,
        'AUCTION ADMIN',
        'BID_PLACED',
        jsonb_build_object('auction_id', p_auction_id, 'team_id', p_team_id, 'amount', p_amount, 'team_name', v_team.name)
    );

    RETURN jsonb_build_object(
        'success', true,
        'amount', p_amount,
        'team_id', p_team_id,
        'server_expires_at', v_new_expires_at
    );
END;
$$;

-- RPC: MARK SOLD
CREATE OR REPLACE FUNCTION rpc_mark_sold(
    p_auction_id UUID,
    p_actor_name VARCHAR(100) DEFAULT 'Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction RECORD;
    v_team RECORD;
    v_player RECORD;
BEGIN
    SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    IF v_auction.highest_team_id IS NULL OR v_auction.current_bid <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot sell without a valid winning bid');
    END IF;

    SELECT * INTO v_team FROM teams WHERE id = v_auction.highest_team_id FOR UPDATE;
    SELECT * INTO v_player FROM players WHERE id = v_auction.player_id FOR UPDATE;

    UPDATE teams
    SET current_balance = current_balance - v_auction.current_bid,
        total_spent = total_spent + v_auction.current_bid,
        updated_at = NOW()
    WHERE id = v_auction.highest_team_id;

    UPDATE players
    SET auction_status = 'SOLD',
        sold_price = v_auction.current_bid,
        sold_team_id = v_auction.highest_team_id,
        updated_at = NOW()
    WHERE id = v_auction.player_id;

    UPDATE auctions
    SET status = 'SOLD',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_auction_id;

    INSERT INTO audit_logs (tournament_id, actor_id, actor_role, action, details)
    VALUES (
        v_auction.tournament_id,
        p_actor_name,
        'AUCTION ADMIN',
        'PLAYER_SOLD',
        jsonb_build_object('player_id', v_auction.player_id, 'team_id', v_auction.highest_team_id, 'price', v_auction.current_bid)
    );

    RETURN jsonb_build_object(
        'success', true,
        'player_name', v_player.name,
        'team_name', v_team.name,
        'price', v_auction.current_bid
    );
END;
$$;

-- RPC: MARK UNSOLD
CREATE OR REPLACE FUNCTION rpc_mark_unsold(
    p_auction_id UUID,
    p_actor_name VARCHAR(100) DEFAULT 'Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction RECORD;
    v_player RECORD;
BEGIN
    SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    UPDATE players
    SET auction_status = 'UNSOLD',
        sold_price = NULL,
        sold_team_id = NULL,
        updated_at = NOW()
    WHERE id = v_auction.player_id;

    UPDATE auctions
    SET status = 'UNSOLD',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_auction_id;

    INSERT INTO audit_logs (tournament_id, actor_id, actor_role, action, details)
    VALUES (
        v_auction.tournament_id,
        p_actor_name,
        'AUCTION ADMIN',
        'PLAYER_UNSOLD',
        jsonb_build_object('auction_id', p_auction_id, 'player_id', v_auction.player_id)
    );

    RETURN jsonb_build_object('success', true, 'status', 'UNSOLD');
END;
$$;

-- RPC: UNDO LAST BID
CREATE OR REPLACE FUNCTION rpc_undo_last_bid(
    p_auction_id UUID,
    p_actor_name VARCHAR(100) DEFAULT 'Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction RECORD;
    v_last_bid RECORD;
    v_prev_bid RECORD;
    v_settings RECORD;
    v_new_expires_at TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    SELECT * INTO v_last_bid
    FROM auction_bids
    WHERE auction_id = p_auction_id AND is_reverted = false
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active bids to undo');
    END IF;

    UPDATE auction_bids
    SET is_reverted = true,
        reverted_at = NOW(),
        notes = 'Undone by ' || p_actor_name
    WHERE id = v_last_bid.id;

    SELECT * INTO v_prev_bid
    FROM auction_bids
    WHERE auction_id = p_auction_id AND is_reverted = false
    ORDER BY created_at DESC
    LIMIT 1;

    SELECT * INTO v_settings FROM tournament_settings WHERE tournament_id = v_auction.tournament_id LIMIT 1;
    v_new_expires_at := NOW() + (COALESCE(v_settings.timer_seconds, 20) || ' seconds')::INTERVAL;

    IF FOUND THEN
        UPDATE auctions
        SET current_bid = v_prev_bid.amount,
            highest_team_id = v_prev_bid.team_id,
            server_expires_at = v_new_expires_at,
            updated_at = NOW()
        WHERE id = p_auction_id;
    ELSE
        UPDATE auctions
        SET current_bid = v_auction.starting_bid,
            highest_team_id = NULL,
            server_expires_at = v_new_expires_at,
            updated_at = NOW()
        WHERE id = p_auction_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'reverted_amount', v_last_bid.amount,
        'current_bid', COALESCE(v_prev_bid.amount, v_auction.starting_bid),
        'server_expires_at', v_new_expires_at
    );
END;
$$;

-- RPC: CANCEL SOLD
CREATE OR REPLACE FUNCTION rpc_cancel_sold(
    p_auction_id UUID,
    p_actor_name VARCHAR(100) DEFAULT 'Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction RECORD;
    v_player RECORD;
BEGIN
    SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    IF v_auction.status != 'SOLD' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only SOLD auctions can be cancelled');
    END IF;

    IF v_auction.highest_team_id IS NOT NULL THEN
        UPDATE teams
        SET current_balance = current_balance + v_auction.current_bid,
            total_spent = total_spent - v_auction.current_bid,
            updated_at = NOW()
        WHERE id = v_auction.highest_team_id;
    END IF;

    UPDATE players
    SET auction_status = 'UNSOLD',
        sold_price = NULL,
        sold_team_id = NULL,
        updated_at = NOW()
    WHERE id = v_auction.player_id;

    UPDATE auctions
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = p_auction_id;

    RETURN jsonb_build_object('success', true, 'refunded_amount', v_auction.current_bid);
END;
$$;

-- ==============================================================================
-- REALTIME SUBSCRIPTION
-- ==============================================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE auctions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE auction_bids;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE teams;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==============================================================================
-- SEED DATA (10 TEAMS with ₹5,00,000, 7 CATEGORIES)
-- ==============================================================================
INSERT INTO tournaments (id, name, short_name, season)
VALUES ('00000000-0000-0000-0000-000000000001', 'Gulf Oil Badminton Premier League', 'GBL', 'Season 2026')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tournament_settings (tournament_id, timer_seconds, initial_budget, required_squad_slots, reserve_per_slot)
VALUES ('00000000-0000-0000-0000-000000000001', 20, 500000.00, 7, 20000.00)
ON CONFLICT DO NOTHING;

INSERT INTO categories (id, tournament_id, name, code, starting_bid, base_reserve_points, min_bid_increment, owner_deduction, is_active, sort_order) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'OPEN', 'OPEN', 50000.00, 50000.00, 10000.00, 50000.00, true, 1),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '35+ JUMBLED', '35_JUMBLED', 20000.00, 20000.00, 10000.00, 20000.00, true, 2),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'NON-MEDALLIST', 'NON_MEDALLIST', 10000.00, 10000.00, 10000.00, 10000.00, true, 3),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '80+ COMBINED DOUBLES', '80_COMBINED', 0.00, 0.00, 5000.00, 0.00, true, 4),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'SUPER DOUBLES', 'SUPER_DOUBLES', 0.00, 0.00, 5000.00, 0.00, true, 5),
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'CHALLENGERS DOUBLES', 'CHALLENGERS', 0.00, 0.00, 5000.00, 0.00, true, 6),
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'FUTURE STARS', 'FUTURE_STARS', 0.00, 0.00, 5000.00, 0.00, true, 7)
ON CONFLICT (id) DO NOTHING;

INSERT INTO teams (id, tournament_id, team_number, name, short_name, owner_name, captain_name, team_color, initial_budget, current_balance, total_spent) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 'Gulf Smashers', 'GS', 'Rajesh K. Varma', 'Arjun Nambiar', '#FF5E00', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2, 'Gulf Thunderbolts', 'GT', 'Anand Mahindra', 'Karthik S.', '#0284C7', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 3, 'Gulf Kings XI', 'GK', 'Sanjay Dutt', 'Vikramaditya Rao', '#F59E0B', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 4, 'Gulf Strikers', 'GST', 'Dr. Radhakrishnan', 'Deepak Chandran', '#10B981', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 5, 'Gulf Shuttlers', 'GSH', 'Praveen Chander', 'Ganesh Moorthy', '#8B5CF6', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 6, 'Gulf Warriors', 'GW', 'Murali Vijay', 'Santhosh Kumar', '#EC4899', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 7, 'Gulf Blasters', 'GB', 'Saravanan S.', 'Pradeep Venkat', '#EF4444', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 8, 'Gulf Falcons', 'GF', 'Bala Murugan', 'Manoj Prabhakar', '#14B8A6', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 9, 'Gulf Gladiators', 'GG', 'Venkatesh Prasad', 'Harish Babu', '#6366F1', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 10, 'Gulf Titans', 'GTI', 'Ramesh Aravind', 'Suresh Raina', '#EAB308', 500000.00, 500000.00, 0.00)
ON CONFLICT (id) DO NOTHING;

-- Seed Standings
INSERT INTO standings (tournament_id, team_id, played, won, lost, points, score_for, score_against, score_diff, rank)
SELECT '00000000-0000-0000-0000-000000000001', id, 0, 0, 0, 0, 0, 0, 0, ROW_NUMBER() OVER (ORDER BY team_number)
FROM teams
WHERE tournament_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- Seed Sample Players
INSERT INTO players (tournament_id, player_code, name, age, gender, mobile, eligible_category_names, achievements, auction_status, auction_order) VALUES
('00000000-0000-0000-0000-000000000001', 'GBL-001', 'Rahul Kumar', 26, 'Male', '+91 98840 11223', ARRAY['OPEN', 'SUPER DOUBLES'], 'State Ranking Gold Medalist 2024, Inter-club Champion', 'UNSOLD', 1),
('00000000-0000-0000-0000-000000000001', 'GBL-002', 'Siddharth Iyer', 37, 'Male', '+91 98840 22334', ARRAY['OPEN', '35+ JUMBLED'], 'Chennai Masters Doubles Winner 2023', 'UNSOLD', 2),
('00000000-0000-0000-0000-000000000001', 'GBL-003', 'Kavitha Natarajan', 29, 'Female', '+91 98840 33445', ARRAY['OPEN', 'FUTURE STARS'], 'South Zone University Gold, Mixed Doubles Specialist', 'UNSOLD', 3),
('00000000-0000-0000-0000-000000000001', 'GBL-004', 'Dinesh Karthik', 42, 'Male', '+91 98840 44556', ARRAY['35+ JUMBLED', '80+ COMBINED DOUBLES'], 'Veteran State Semi-Finalist 2023', 'UNSOLD', 4),
('00000000-0000-0000-0000-000000000001', 'GBL-005', 'Arunachalam P.', 31, 'Male', '+91 98840 55667', ARRAY['NON-MEDALLIST', 'CHALLENGERS DOUBLES'], 'Corporate League Runner-up 2024', 'UNSOLD', 5),
('00000000-0000-0000-0000-000000000001', 'GBL-006', 'Meenakshi Sundaram', 45, 'Male', '+91 98840 66778', ARRAY['35+ JUMBLED', '80+ COMBINED DOUBLES'], 'Senior District Doubles Finalist', 'UNSOLD', 6),
('00000000-0000-0000-0000-000000000001', 'GBL-007', 'Vigneshwaran S.', 23, 'Male', '+91 98840 77889', ARRAY['OPEN', 'FUTURE STARS', 'SUPER DOUBLES'], 'Junior National Quarter-Finalist', 'UNSOLD', 7),
('00000000-0000-0000-0000-000000000001', 'GBL-008', 'Naveen Prashanth', 33, 'Male', '+91 98840 88990', ARRAY['NON-MEDALLIST', 'CHALLENGERS DOUBLES'], 'Smash League MVP 2023', 'UNSOLD', 8)
ON CONFLICT DO NOTHING;
