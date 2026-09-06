-- ==============================================================================
-- GBL Stored Procedures & Atomic Concurrency Functions (RPC)
-- Ensures server-side integrity and prevents duplicate bids or overspending
-- ==============================================================================

-- 1. ATOMIC BID PLACEMENT
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
    -- Lock auction row to prevent concurrent race conditions
    SELECT * INTO v_auction
    FROM auctions
    WHERE id = p_auction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    IF v_auction.status != 'LIVE' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not live');
    END IF;

    -- Check if auction has expired according to server timestamp
    IF v_auction.server_expires_at IS NOT NULL AND NOW() > v_auction.server_expires_at THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction timer expired');
    END IF;

    -- Lock team row
    SELECT * INTO v_team
    FROM teams
    WHERE id = p_team_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Team not found');
    END IF;

    -- Fetch category details
    SELECT * INTO v_category
    FROM categories
    WHERE id = v_auction.category_id;

    -- Fetch tournament settings
    SELECT * INTO v_settings
    FROM tournament_settings
    WHERE tournament_id = v_auction.tournament_id
    LIMIT 1;

    -- Validation 1: Amount must exceed current bid or starting bid
    IF v_auction.current_bid > 0 THEN
        IF p_amount <= v_auction.current_bid THEN
            RETURN jsonb_build_object('success', false, 'error', 'Bid must be higher than current bid of ₹' || v_auction.current_bid::TEXT);
        END IF;

        IF (p_amount - v_auction.current_bid) < COALESCE(v_category.min_bid_increment, 10000.00) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Minimum increment is ₹' || COALESCE(v_category.min_bid_increment, 10000)::TEXT);
        END IF;
    ELSE
        IF p_amount < v_auction.starting_bid THEN
            RETURN jsonb_build_object('success', false, 'error', 'Bid cannot be less than starting bid of ₹' || v_auction.starting_bid::TEXT);
        END IF;
    END IF;

    -- Validation 2: Available balance
    IF p_amount > v_team.current_balance THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient team balance. Available: ₹' || v_team.current_balance::TEXT);
    END IF;

    -- Validation 3: Maximum legal bid calculation
    -- Current balance - (remaining slots * reserve per slot)
    SELECT COUNT(*) INTO v_current_squad_count
    FROM players
    WHERE sold_team_id = p_team_id;

    -- Remaining slots required to fill squad
    v_remaining_slots := GREATEST(0, COALESCE(v_settings.required_squad_slots, 7) - (v_current_squad_count + 1));
    v_reserve_required := v_remaining_slots * COALESCE(v_settings.reserve_per_slot, 20000.00);
    v_max_legal_bid := GREATEST(0, v_team.current_balance - v_reserve_required);

    IF p_amount > v_max_legal_bid THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Bid exceeds maximum legal bid of ₹' || v_max_legal_bid::TEXT || ' (Reserving ₹' || v_reserve_required::TEXT || ' for ' || v_remaining_slots || ' remaining player slots)'
        );
    END IF;

    -- Calculate new expiration time (20 seconds from now)
    v_new_expires_at := NOW() + (COALESCE(v_settings.timer_seconds, 20) || ' seconds')::INTERVAL;

    -- Update auction
    UPDATE auctions
    SET current_bid = p_amount,
        highest_team_id = p_team_id,
        server_expires_at = v_new_expires_at,
        updated_at = NOW()
    WHERE id = p_auction_id;

    -- Record in bid history
    INSERT INTO auction_bids (
        auction_id,
        team_id,
        amount,
        bid_type,
        created_at,
        created_by
    ) VALUES (
        p_auction_id,
        p_team_id,
        p_amount,
        p_bid_type,
        NOW(),
        p_actor_name
    );

    -- Log to audit
    INSERT INTO audit_logs (
        tournament_id,
        actor_id,
        actor_role,
        action,
        details
    ) VALUES (
        v_auction.tournament_id,
        p_actor_name,
        'AUCTION ADMIN',
        'BID_PLACED',
        jsonb_build_object(
            'auction_id', p_auction_id,
            'team_id', p_team_id,
            'team_name', v_team.name,
            'amount', p_amount,
            'bid_type', p_bid_type
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'amount', p_amount,
        'team_id', p_team_id,
        'server_expires_at', v_new_expires_at
    );
END;
$$;

-- 2. ATOMIC MARK SOLD
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
    SELECT * INTO v_auction
    FROM auctions
    WHERE id = p_auction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    IF v_auction.status NOT IN ('LIVE', 'PAUSED') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not in live/paused state');
    END IF;

    IF v_auction.highest_team_id IS NULL OR v_auction.current_bid <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot sell without a valid winning bid');
    END IF;

    -- Lock winning team
    SELECT * INTO v_team
    FROM teams
    WHERE id = v_auction.highest_team_id
    FOR UPDATE;

    -- Lock player
    SELECT * INTO v_player
    FROM players
    WHERE id = v_auction.player_id
    FOR UPDATE;

    -- Deduct team balance
    UPDATE teams
    SET current_balance = current_balance - v_auction.current_bid,
        total_spent = total_spent + v_auction.current_bid,
        updated_at = NOW()
    WHERE id = v_auction.highest_team_id;

    -- Update player record
    UPDATE players
    SET auction_status = 'SOLD',
        sold_price = v_auction.current_bid,
        sold_team_id = v_auction.highest_team_id,
        updated_at = NOW()
    WHERE id = v_auction.player_id;

    -- Update auction record
    UPDATE auctions
    SET status = 'SOLD',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_auction_id;

    -- Audit log
    INSERT INTO audit_logs (
        tournament_id,
        actor_id,
        actor_role,
        action,
        details
    ) VALUES (
        v_auction.tournament_id,
        p_actor_name,
        'AUCTION ADMIN',
        'PLAYER_SOLD',
        jsonb_build_object(
            'player_id', v_auction.player_id,
            'player_name', v_player.name,
            'team_id', v_auction.highest_team_id,
            'team_name', v_team.name,
            'price', v_auction.current_bid
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'player_name', v_player.name,
        'team_name', v_team.name,
        'price', v_auction.current_bid
    );
END;
$$;

-- 3. ATOMIC MARK UNSOLD
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
    SELECT * INTO v_auction
    FROM auctions
    WHERE id = p_auction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    SELECT * INTO v_player
    FROM players
    WHERE id = v_auction.player_id
    FOR UPDATE;

    -- Update player
    UPDATE players
    SET auction_status = 'UNSOLD',
        sold_price = NULL,
        sold_team_id = NULL,
        updated_at = NOW()
    WHERE id = v_auction.player_id;

    -- Update auction
    UPDATE auctions
    SET status = 'UNSOLD',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_auction_id;

    -- Audit log
    INSERT INTO audit_logs (
        tournament_id,
        actor_id,
        actor_role,
        action,
        details
    ) VALUES (
        v_auction.tournament_id,
        p_actor_name,
        'AUCTION ADMIN',
        'PLAYER_UNSOLD',
        jsonb_build_object(
            'player_id', v_auction.player_id,
            'player_name', v_player.name
        )
    );

    RETURN jsonb_build_object('success', true, 'status', 'UNSOLD');
END;
$$;

-- 4. ATOMIC UNDO LAST BID
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
    SELECT * INTO v_auction
    FROM auctions
    WHERE id = p_auction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    -- Get last active bid
    SELECT * INTO v_last_bid
    FROM auction_bids
    WHERE auction_id = p_auction_id AND is_reverted = false
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active bids to undo');
    END IF;

    -- Mark last bid as reverted
    UPDATE auction_bids
    SET is_reverted = true,
        reverted_at = NOW(),
        notes = 'Undone by ' || p_actor_name
    WHERE id = v_last_bid.id;

    -- Find previous active bid if any
    SELECT * INTO v_prev_bid
    FROM auction_bids
    WHERE auction_id = p_auction_id AND is_reverted = false
    ORDER BY created_at DESC
    LIMIT 1;

    SELECT * INTO v_settings
    FROM tournament_settings
    WHERE tournament_id = v_auction.tournament_id
    LIMIT 1;

    v_new_expires_at := NOW() + (COALESCE(v_settings.timer_seconds, 20) || ' seconds')::INTERVAL;

    IF FOUND THEN
        UPDATE auctions
        SET current_bid = v_prev_bid.amount,
            highest_team_id = v_prev_bid.team_id,
            server_expires_at = v_new_expires_at,
            updated_at = NOW()
        WHERE id = p_auction_id;
    ELSE
        -- Return to starting bid with no highest team
        UPDATE auctions
        SET current_bid = v_auction.starting_bid,
            highest_team_id = NULL,
            server_expires_at = v_new_expires_at,
            updated_at = NOW()
        WHERE id = p_auction_id;
    END IF;

    -- Audit log
    INSERT INTO audit_logs (
        tournament_id,
        actor_id,
        actor_role,
        action,
        details
    ) VALUES (
        v_auction.tournament_id,
        p_actor_name,
        'AUCTION ADMIN',
        'BID_UNDONE',
        jsonb_build_object(
            'auction_id', p_auction_id,
            'undone_bid_id', v_last_bid.id,
            'undone_amount', v_last_bid.amount
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'reverted_amount', v_last_bid.amount,
        'current_bid', COALESCE(v_prev_bid.amount, v_auction.starting_bid),
        'server_expires_at', v_new_expires_at
    );
END;
$$;

-- 5. ATOMIC CANCEL SOLD
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
    v_team RECORD;
    v_player RECORD;
BEGIN
    SELECT * INTO v_auction
    FROM auctions
    WHERE id = p_auction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    IF v_auction.status != 'SOLD' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only SOLD auctions can be cancelled');
    END IF;

    SELECT * INTO v_player
    FROM players
    WHERE id = v_auction.player_id
    FOR UPDATE;

    IF v_auction.highest_team_id IS NOT NULL THEN
        SELECT * INTO v_team
        FROM teams
        WHERE id = v_auction.highest_team_id
        FOR UPDATE;

        -- Refund team purse
        UPDATE teams
        SET current_balance = current_balance + v_auction.current_bid,
            total_spent = total_spent - v_auction.current_bid,
            updated_at = NOW()
        WHERE id = v_auction.highest_team_id;
    END IF;

    -- Restore player
    UPDATE players
    SET auction_status = 'UNSOLD',
        sold_price = NULL,
        sold_team_id = NULL,
        updated_at = NOW()
    WHERE id = v_auction.player_id;

    -- Update auction status
    UPDATE auctions
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = p_auction_id;

    -- Audit log
    INSERT INTO audit_logs (
        tournament_id,
        actor_id,
        actor_role,
        action,
        details
    ) VALUES (
        v_auction.tournament_id,
        p_actor_name,
        'SUPER ADMIN',
        'SOLD_CANCELLED',
        jsonb_build_object(
            'auction_id', p_auction_id,
            'player_id', v_auction.player_id,
            'team_id', v_auction.highest_team_id,
            'refunded_amount', v_auction.current_bid
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'refunded_amount', v_auction.current_bid,
        'player_id', v_auction.player_id
    );
END;
$$;
