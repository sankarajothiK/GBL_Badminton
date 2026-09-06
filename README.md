# GBL – Gulf Oil Badminton Premier League Platform

Complete Tournament Management and Real-Time Live Player Auction Web Application built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

---

## 🌟 Key Highlights & Architectural Features

1. **Synchronized 20-Second Live Auction Engine**:
   - Server-synchronized countdown clock across Admin laptops, Team mobile devices, and arena Projectors.
   - Every valid bid placed resets the clock to 20 seconds.
   - Automatic **SOLD** triggered when clock hits 0 with a valid bid.
   - Automatic **UNSOLD** triggered when clock hits 0 without bids.
   - Visual and audio urgency cues (heartbeat tick) at 5 seconds remaining.

2. **Maximum Legal Bid Guard (Section 10 & 52)**:
   - Evaluates: `Current Balance - (Remaining Squad Slots × Reserve Per Slot) = Maximum Legal Bid`.
   - Protects franchises from overspending and being unable to complete their minimum squad.
   - Live max bid indicator in auction console and team portals.

3. **Dedicated 1920×1080 Arena Projector Display (`/projector`)**:
   - Designed for high-visibility TV, LED screens, and arena projectors.
   - Massive typography, player spotlight, live clock circle, and bottom 10-team purse ticker.
   - Confetti cannon celebration upon hammer strike (**SOLD**).

4. **10 MB Image Upload Support (Fixing 2 MB Bug)**:
   - Full 10 MB file size upload support for player and franchise photos with automatic browser canvas optimization (fixes previous 2 MB validation bug).

5. **Franchise Team Management (10 Teams with ₹5,00,000 Initial Purses)**:
   - Gulf Smashers, Gulf Thunderbolts, Gulf Kings XI, Gulf Strikers, Gulf Shuttlers, Gulf Warriors, Gulf Blasters, Gulf Falcons, Gulf Gladiators, Gulf Titans.
   - Editable colors, owners, captains, logos, spent points, and purse balances.

6. **7 Official Player Categories**:
   - **OPEN** (Starting Bid: ₹50,000, Base/Reserve: ₹50,000)
   - **35+ JUMBLED** (Starting Bid: ₹20,000, Base/Reserve: ₹20,000)
   - **NON-MEDALLIST** (Starting Bid: ₹10,000, Base/Reserve: ₹10,000)
   - **80+ COMBINED DOUBLES**, **SUPER DOUBLES**, **CHALLENGERS DOUBLES**, **FUTURE STARS**

7. **Franchise Bidding Portal (`/team-bid/:teamId`)**:
   - Quick bidding buttons (+₹10,000, +₹20,000, +₹50,000) with legal max bid guard.

8. **Complete Tournament Management**:
   - Match results entry with set-by-set scores (Set 1, 2, 3).
   - Automatic points table recalculation (Won, Lost, Points, Score Diff, Rank).
   - Qualification management (Top N qualify + manual selection overrides).
   - 10 MB Media Gallery with category filters and image lightbox.
   - CSV Import/Export for players, teams, squads, history, and standings.
   - JSON Tournament Backup & Restore.
   - Granular tournament data reset (Super Admin protected).

---

## 🚀 Running the Project Locally

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The application is accessible at:
- **Public Tournament Site**: [http://localhost:5173/](http://localhost:5173/)
- **Live Auction Arena**: [http://localhost:5173/auction](http://localhost:5173/auction)
- **1080p Projector Display**: [http://localhost:5173/projector](http://localhost:5173/projector)
- **Team Bidding Portal**: [http://localhost:5173/team-bid](http://localhost:5173/team-bid)
- **Admin Console**: [http://localhost:5173/admin](http://localhost:5173/admin)
- **Admin Login**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

---

## ⚡ Supabase Setup Instructions (Project: GBL Sports)

Your Supabase project is already configured in `.env`:
`VITE_SUPABASE_URL=https://rfonfqwpzfafrgkbbsuf.supabase.co`

### Step 1: Run Full Database Migration in Supabase SQL Editor
1. Open your **Supabase Dashboard** at `https://supabase.com/dashboard/project/rfonfqwpzfafrgkbbsuf`
2. Click the **SQL Editor** tab on the left sidebar (`>_` icon).
3. Open [`supabase/full_setup.sql`](file:///c:/Users/ADMIN/Documents/antigravity/quirky-volta/supabase/full_setup.sql) in this workspace.
4. Copy all content, paste it into the SQL Editor, and click **Run**.
   *This automatically creates all 12 PostgreSQL tables, stored procedures (`rpc_place_bid`, `rpc_mark_sold`, `rpc_undo_last_bid`), Realtime publications, 10 teams with ₹5,00,000 purses, 7 categories, and 10 MB storage buckets.*

### Step 2: Add your Public Anon Key
1. In Supabase Dashboard, click **Project Settings** (gear icon) -> **API**.
2. Copy the `anon` `public` key.
3. Paste it into `.env` as `VITE_SUPABASE_ANON_KEY=...`

---

## 🧪 Verification Suite

Run the built-in test suite to verify the engine:
```bash
node scripts/test_engine.js
```
