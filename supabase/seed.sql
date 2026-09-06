-- ==============================================================================
-- GBL Initial Seed Data
-- 1 Tournament, 10 Teams (₹5,00,000 budget each), 7 Categories, Default Settings
-- ==============================================================================

-- 1. Insert Default Tournament
INSERT INTO tournaments (
    id,
    name,
    short_name,
    season,
    description,
    venue,
    tournament_dates,
    auction_date,
    auction_time,
    organizer_name,
    sponsor_info,
    contact_phone,
    contact_email
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Gulf Oil Badminton Premier League',
    'GBL',
    'Season 2026',
    'The official premier badminton tournament powered by Gulf Oil Lubricants India. Bringing world-class competition, live player auctions, and premier sportsmanship to Chennai.',
    'Gulf International Sports Dome, Chennai',
    'November 14 - 16, 2026',
    'November 1, 2026',
    '10:00 AM IST',
    'Gulf Oil Sports Federation',
    'Gulf Oil Lubricants India Ltd.',
    '+91 98844 12345',
    'gbl.tournaments@gulfoil.co.in'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Tournament Settings
INSERT INTO tournament_settings (
    tournament_id,
    timer_seconds,
    initial_budget,
    min_squad_size,
    max_squad_size,
    required_squad_slots,
    reserve_per_slot,
    owner_double_deduction_enabled,
    owner_deduction_open,
    owner_deduction_35plus,
    owner_deduction_non_medallist,
    qualifying_teams_count
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    20,
    500000.00,
    5,
    12,
    7,
    20000.00,
    true,
    50000.00,
    20000.00,
    10000.00,
    8
) ON CONFLICT DO NOTHING;

-- 3. Insert 7 Official Categories
INSERT INTO categories (id, tournament_id, name, code, starting_bid, base_reserve_points, min_bid_increment, owner_deduction, is_active, sort_order) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'OPEN', 'OPEN', 50000.00, 50000.00, 10000.00, 50000.00, true, 1),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '35+ JUMBLED', '35_JUMBLED', 20000.00, 20000.00, 10000.00, 20000.00, true, 2),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'NON-MEDALLIST', 'NON_MEDALLIST', 10000.00, 10000.00, 10000.00, 10000.00, true, 3),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '80+ COMBINED DOUBLES', '80_COMBINED', 0.00, 0.00, 5000.00, 0.00, true, 4),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'SUPER DOUBLES', 'SUPER_DOUBLES', 0.00, 0.00, 5000.00, 0.00, true, 5),
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'CHALLENGERS DOUBLES', 'CHALLENGERS', 0.00, 0.00, 5000.00, 0.00, true, 6),
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'FUTURE STARS', 'FUTURE_STARS', 0.00, 0.00, 5000.00, 0.00, true, 7)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Exactly 10 Editable Teams
INSERT INTO teams (id, tournament_id, team_number, name, short_name, owner_name, captain_name, team_color, initial_budget, current_balance, total_spent) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 'Gulf Smashers', 'GS', 'Rajesh K. Varma', 'Arjun Nambiar', '#FF5E00', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2, 'Gulf Thunderbolts', 'GT', 'Anand Mahindra', 'Karthik Subramanian', '#0284C7', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 3, 'Gulf Kings XI', 'GK', 'Sanjay Dutt', 'Vikramaditya Rao', '#F59E0B', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 4, 'Gulf Strikers', 'GST', 'Dr. Radhakrishnan', 'Deepak Chandran', '#10B981', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 5, 'Gulf Shuttlers', 'GSH', 'Praveen Chander', 'Ganesh Moorthy', '#8B5CF6', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 6, 'Gulf Warriors', 'GW', 'Murali Vijay', 'Santhosh Kumar', '#EC4899', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 7, 'Gulf Blasters', 'GB', 'Saravanan S.', 'Pradeep Venkat', '#EF4444', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 8, 'Gulf Falcons', 'GF', 'Bala Murugan', 'Manoj Prabhakar', '#14B8A6', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 9, 'Gulf Gladiators', 'GG', 'Venkatesh Prasad', 'Harish Babu', '#6366F1', 500000.00, 500000.00, 0.00),
('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 10, 'Gulf Titans', 'GTI', 'Ramesh Aravind', 'Suresh Raina', '#EAB308', 500000.00, 500000.00, 0.00)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Initial Standings Records for 10 Teams
INSERT INTO standings (tournament_id, team_id, played, won, lost, points, score_for, score_against, score_diff, rank)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    id,
    0, 0, 0, 0, 0, 0, 0,
    ROW_NUMBER() OVER (ORDER BY team_number)
FROM teams
WHERE tournament_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- 6. Insert Sample Players Across Categories
INSERT INTO players (
    tournament_id,
    player_code,
    name,
    age,
    gender,
    mobile,
    eligible_category_names,
    achievements,
    auction_status,
    auction_order
) VALUES
('00000000-0000-0000-0000-000000000001', 'GBL-001', 'Rahul Kumar', 26, 'Male', '+91 98840 11223', ARRAY['OPEN', 'SUPER DOUBLES'], 'State Ranking Gold Medalist 2024, Inter-club Champion', 'UNSOLD', 1),
('00000000-0000-0000-0000-000000000001', 'GBL-002', 'Siddharth Iyer', 37, 'Male', '+91 98840 22334', ARRAY['OPEN', '35+ JUMBLED'], 'Chennai Masters Doubles Winner 2023', 'UNSOLD', 2),
('00000000-0000-0000-0000-000000000001', 'GBL-003', 'Kavitha Natarajan', 29, 'Female', '+91 98840 33445', ARRAY['OPEN', 'FUTURE STARS'], 'South Zone University Gold, Mixed Doubles Specialist', 'UNSOLD', 3),
('00000000-0000-0000-0000-000000000001', 'GBL-004', 'Dinesh Karthik', 42, 'Male', '+91 98840 44556', ARRAY['35+ JUMBLED', '80+ COMBINED DOUBLES'], 'Veteran State Semi-Finalist 2023', 'UNSOLD', 4),
('00000000-0000-0000-0000-000000000001', 'GBL-005', 'Arunachalam P.', 31, 'Male', '+91 98840 55667', ARRAY['NON-MEDALLIST', 'CHALLENGERS DOUBLES'], 'Corporate League Runner-up 2024', 'UNSOLD', 5),
('00000000-0000-0000-0000-000000000001', 'GBL-006', 'Meenakshi Sundaram', 45, 'Male', '+91 98840 66778', ARRAY['35+ JUMBLED', '80+ COMBINED DOUBLES'], 'Senior District Doubles Finalist', 'UNSOLD', 6),
('00000000-0000-0000-0000-000000000001', 'GBL-007', 'Vigneshwaran S.', 23, 'Male', '+91 98840 77889', ARRAY['OPEN', 'FUTURE STARS', 'SUPER DOUBLES'], 'Junior National Quarter-Finalist', 'UNSOLD', 7),
('00000000-0000-0000-0000-000000000001', 'GBL-008', 'Naveen Prashanth', 33, 'Male', '+91 98840 88990', ARRAY['NON-MEDALLIST', 'CHALLENGERS DOUBLES'], 'Smash League MVP 2023', 'UNSOLD', 8),
('00000000-0000-0000-0000-000000000009', 'GBL-009', 'Aravind Swamy', 38, 'Male', '+91 98840 99001', ARRAY['35+ JUMBLED', 'SUPER DOUBLES'], 'Inter-City Trophy Winner', 'UNSOLD', 9),
('00000000-0000-0000-0000-000000000010', 'GBL-010', 'Pooja Venkatesh', 24, 'Female', '+91 98840 10101', ARRAY['OPEN', 'SUPER DOUBLES'], 'State Open Women Singles Finalist 2024', 'UNSOLD', 10);
