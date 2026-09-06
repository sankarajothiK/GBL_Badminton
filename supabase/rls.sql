-- ==============================================================================
-- GBL Row Level Security (RLS) Policies
-- Public Read for public site/projector; Admin Write for authorized roles
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 1. PUBLIC READ POLICIES
CREATE POLICY "Allow public read tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow public read settings" ON tournament_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public read auctions" ON auctions FOR SELECT USING (true);
CREATE POLICY "Allow public read auction_bids" ON auction_bids FOR SELECT USING (true);
CREATE POLICY "Allow public read tournament_matches" ON tournament_matches FOR SELECT USING (true);
CREATE POLICY "Allow public read standings" ON standings FOR SELECT USING (true);
CREATE POLICY "Allow public read gallery" ON gallery FOR SELECT USING (true);
CREATE POLICY "Allow public read admin_users" ON admin_users FOR SELECT USING (true);

-- 2. ADMIN ALL ACCESS POLICIES (Authenticated)
CREATE POLICY "Allow authenticated full tournaments" ON tournaments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full settings" ON tournament_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full teams" ON teams FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full players" ON players FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full auctions" ON auctions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full auction_bids" ON auction_bids FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full audit_logs" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full tournament_matches" ON tournament_matches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full standings" ON standings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full gallery" ON gallery FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full admin_users" ON admin_users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. ANON ACCESS WITH ANON KEY FOR AUCTIONS/BIDS (Enables realtime demo and live bidding)
CREATE POLICY "Allow anon insert bids via RPC" ON auction_bids FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update auctions" ON auctions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read audit_logs" ON audit_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert audit_logs" ON audit_logs FOR INSERT TO anon WITH CHECK (true);
