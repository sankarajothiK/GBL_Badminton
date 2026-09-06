import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const outputPath = path.resolve(process.cwd(), 'GBL_User_Manual.pdf');
const doc = new PDFDocument({
  size: 'A4',
  margin: 50,
  info: {
    Title: 'GBL Badminton Premier League - Operational User Manual',
    Author: 'Gulf Oil Tournament Committee',
    Subject: 'Official Tournament Management & Live Player Auction Manual',
    Keywords: 'Badminton, GBL, Auction, User Manual, Kovilpatti'
  }
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Helpers for stylish PDF formatting
const primaryColor = '#101A1D';
const accentLime = '#4D7C0F'; // Darker readable lime for print
const accentOrange = '#EA580C';
const darkSlate = '#0F172A';
const mutedSlate = '#475569';
const lightBg = '#F8FAFC';

function drawHeader(title, subtitle) {
  doc.rect(50, 45, 495, 3).fill(accentLime);
  doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text(title, 50, 55);
  if (subtitle) {
    doc.fillColor(mutedSlate).fontSize(10).font('Helvetica').text(subtitle, 50, 78);
  }
  doc.moveDown(2);
}

// ----------------------------------------------------
// PAGE 1: COVER PAGE
// ----------------------------------------------------
doc.rect(0, 0, 595, 842).fill('#101A1D');

// Decorative accent rings
doc.circle(500, 100, 180).lineWidth(15).strokeColor('rgba(190, 242, 100, 0.15)').stroke();
doc.circle(550, 120, 240).lineWidth(2).strokeColor('rgba(255, 255, 255, 0.1)').stroke();

doc.fillColor('#BEF264').fontSize(12).font('Helvetica-Bold').text('OFFICIAL OPERATIONAL GUIDE', 60, 220, { characterSpacing: 2 });

doc.fillColor('#FFFFFF').fontSize(38).font('Helvetica-Bold').text('GBL PREMIER\nLEAGUE 2026', 60, 250, { lineGap: 6 });

doc.fillColor('#94A3B8').fontSize(14).font('Helvetica').text(
  'Complete Tournament Management & Live Player Auction Platform\nGulf Oil Lubricants India Ltd. • Kovilpatti',
  60,
  350,
  { lineGap: 4 }
);

// Highlights Box
doc.roundedRect(60, 450, 475, 140, 12).fill('rgba(255, 255, 255, 0.05)').strokeColor('rgba(255, 255, 255, 0.15)').lineWidth(1).stroke();

doc.fillColor('#BEF264').fontSize(12).font('Helvetica-Bold').text('SYSTEM SPECIFICATIONS & ARCHITECTURE', 80, 470);
doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica').text(
  '• 10 Official Teams initialized with ₹5,00,000 Points Wallets\n' +
  '• Strict Roster Logic: Exactly 6 Members (1 Team Owner + 5 Auctioned Players)\n' +
  '• Dynamic Max Legal Bid Guard reserving ₹30,000 per remaining squad slot\n' +
  '• 9 Official Player Categories & Live Pre-Auction Multi-Category Search\n' +
  '• Real-time 20-Second Auction Clock with Instant Bid Resets\n' +
  '• Central Cloud Supabase Persistence & 1080p Arena Projector Display',
  80,
  495,
  { lineGap: 5 }
);

doc.fillColor('#64748B').fontSize(9).font('Helvetica').text('CONFIDENTIAL • FOR AUTHORIZED TOURNAMENT OFFICIALS ONLY', 60, 750);
doc.fillColor('#64748B').fontSize(9).font('Helvetica').text('Version 4.0 (Production Release) • September 2026', 360, 750);

// ----------------------------------------------------
// PAGE 2: TOURNAMENT RULES & MATHEMATICS
// ----------------------------------------------------
doc.addPage();
drawHeader('1. Tournament Budget & Points Architecture', 'Official Financial & Roster Rules for GBL Kovilpatti');

doc.fillColor(darkSlate).fontSize(10).font('Helvetica').text(
  'Each official team is granted a total budget of 5,00,000 points. The system mathematically reserves funds to protect the integrity of the squad requirements and guarantee that every team can field a full roster.',
  50,
  105,
  { lineGap: 4 }
);

// Table: Budget Parameters
doc.moveDown(1);
const startY = 155;
doc.rect(50, startY, 495, 25).fill('#F1F5F9');
doc.fillColor(darkSlate).fontSize(9).font('Helvetica-Bold');
doc.text('BUDGET PARAMETER', 60, startY + 8);
doc.text('VALUE', 260, startY + 8);
doc.text('OPERATIONAL RULE', 360, startY + 8);

const tableData = [
  ['Total Team Purse', '5,00,000 Points', 'Allocated to all 10 teams at auction start'],
  ['Team Owner Reserved', '30,000 Points', 'Automatically reserved upfront for Owner'],
  ['Available Player Purse', '4,70,000 Points', 'Usable funds to buy players in the auction'],
  ['Total Roster Size', '6 Members Total', 'Strictly 1 Team Owner + 5 Auctioned Players'],
  ['Auctioned Player Slots', '5 Players', 'Each team must acquire exactly 5 players'],
  ['Reserve per Slot', '30,000 Points', 'Guaranteed floor per remaining unfilled slot']
];

let rowY = startY + 25;
tableData.forEach(([param, val, desc], i) => {
  if (i % 2 === 1) {
    doc.rect(50, rowY, 495, 22).fill('#F8FAFC');
  }
  doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica-Bold').text(param, 60, rowY + 6);
  doc.fillColor(accentOrange).fontSize(8.5).font('Helvetica-Bold').text(val, 260, rowY + 6);
  doc.fillColor(mutedSlate).fontSize(8).font('Helvetica').text(desc, 360, rowY + 6);
  rowY += 22;
});

doc.moveDown(2);
doc.rect(50, 310, 495, 1).fill('#E2E8F0');

// Formula Box
doc.roundedRect(50, 325, 495, 80, 8).fill('#F8FAFC').strokeColor('#CBD5E1').lineWidth(1).stroke();
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('DYNAMIC MAXIMUM LEGAL BID FORMULA', 65, 338);
doc.fillColor(accentOrange).fontSize(13).font('Helvetica-Bold').text(
  'Max Legal Bid = Current Balance - ((Remaining Players to Buy - 1) × 30,000)',
  65,
  358
);
doc.fillColor(mutedSlate).fontSize(8.5).font('Helvetica').text(
  'Enforced in real-time across the Admin Desk, Team Bidding Portal, and Projector to prevent bankruptcy.',
  65,
  380
);

// Practical Calculation Examples
doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Practical Bidding Scenarios:', 50, 425);

const examples = [
  {
    title: 'Scenario A: Opening Bid of the Auction',
    calc: 'Available Purse: 4,70,000 pts | 5 Players to buy\nReserve for remaining 4 players = 4 × 30,000 = 1,20,000 pts\n-> Maximum Legal First Bid = 4,70,000 - 1,20,000 = 3,50,000 Points'
  },
  {
    title: 'Scenario B: Mid-Auction with 4 Players Remaining (Client Requirement Example)',
    calc: 'Team purchases Open player for 1,50,000 pts -> Balance becomes 3,20,000 pts.\nRemaining players to buy = 4 players.\nReserve for subsequent 3 players = 3 × 30,000 = 90,000 pts.\n-> Maximum Legal Bid on Next Player = 3,20,000 - 90,000 = 2,30,000 Points'
  },
  {
    title: 'Scenario C: Bidding on the 5th (Final) Roster Spot',
    calc: 'Remaining players to buy after this player = 0 -> Required Reserve = 0 pts.\n-> The team can legally bid their entire remaining balance down to 0 Points.'
  }
];

let exY = 445;
examples.forEach(ex => {
  doc.rect(50, exY, 3, 40).fill(accentLime);
  doc.fillColor(darkSlate).fontSize(9.5).font('Helvetica-Bold').text(ex.title, 60, exY + 2);
  doc.fillColor(mutedSlate).fontSize(8.5).font('Helvetica').text(ex.calc, 60, exY + 16, { lineGap: 3 });
  exY += 65;
});

// Category Floors
doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Official Category Bidding Settings:', 50, 650);
doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica').text(
  '1. OPEN Category: Starting Bid ₹50,000 | Base Reserve ₹50,000 | Min Increment ₹10,000\n' +
  '2. 35+ JUMBLED: Starting Bid ₹20,000 | Base Reserve ₹20,000 | Min Increment ₹10,000\n' +
  '3. NON-MEDALLIST: Starting Bid ₹10,000 | Base Reserve ₹10,000 | Min Increment ₹10,000\n' +
  'Plus 6 Additional Tournament Categories: 80+, Super Doubles, Combined Doubles, Future Stars, Challenges Doubles, Veterans Doubles.',
  50,
  670,
  { lineGap: 4 }
);

// ----------------------------------------------------
// PAGE 3: ADMIN PORTAL & SECURITY
// ----------------------------------------------------
doc.addPage();
drawHeader('2. Admin Console & Production Credentials', 'Secure Tournament Operations & Master Control');

doc.fillColor(darkSlate).fontSize(10).font('Helvetica').text(
  'The Admin Portal is restricted to authorized tournament organizers. To protect tournament integrity, credentials are NOT displayed on any public-facing pages.',
  50,
  105,
  { lineGap: 4 }
);

// Secure Credentials Box
doc.roundedRect(50, 140, 495, 105, 10).fill('#0F172A');
doc.fillColor('#BEF264').fontSize(11).font('Helvetica-Bold').text('OFFICIAL PRODUCTION LOGIN CREDENTIALS', 70, 155);

doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('Master Administrator (Full Access):', 70, 175);
doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold').text('Email:  admin@gulfoil.com', 70, 190);
doc.fillColor('#BEF264').fontSize(10).font('Helvetica-Bold').text('Password:  GBL2026@Admin!', 280, 190);

doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('Chief Auctioneer Desk (Bidding Operator Only):', 70, 210);
doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold').text('Email:  auction@gulfoil.com', 70, 225);
doc.fillColor('#BEF264').fontSize(10).font('Helvetica-Bold').text('Password:  GBL2026@Auction!', 280, 225);

// Admin Features Guide
doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Admin Portal Modules Guide:', 50, 265);

const adminFeatures = [
  {
    sec: 'Live Auctioneer Operator (/admin/auction)',
    desc: 'Select candidates, start the 20s countdown clock, input quick bids (+10k, +20k, +50k), record SOLD / UNSOLD transitions, and trigger arena confetti.'
  },
  {
    sec: 'Teams Management (/admin/teams)',
    desc: 'View all 10 teams, monitor real-time wallet balances, edit owner and captain information, and upload official logos up to 10 MB.'
  },
  {
    sec: 'Players Management (/admin/players)',
    desc: 'Filter 69 real registered Kovilpatti players by Academy or Name. Edit age, academy, T-shirt sizes, and multi-category eligibility tags.'
  },
  {
    sec: 'Central Cloud Database (/admin/settings)',
    desc: 'Verify Supabase connection status. Use "Test Connection" to check database health and "Pull Fresh Data" to sync changes across any office computer or laptop.'
  },
  {
    sec: 'Match Fixtures & Results (/admin/results)',
    desc: 'Record set-by-set match results (Set 1, 2, 3) between teams. Automatically updates won/lost tallies, points, and score differential on the live Points Table.'
  }
];

let afY = 285;
adminFeatures.forEach(af => {
  doc.rect(50, afY, 4, 30).fill(primaryColor);
  doc.fillColor(darkSlate).fontSize(9.5).font('Helvetica-Bold').text(af.sec, 62, afY);
  doc.fillColor(mutedSlate).fontSize(8.5).font('Helvetica').text(af.desc, 62, afY + 13, { width: 480, lineGap: 2 });
  afY += 50;
});

// ----------------------------------------------------
// PAGE 4: AUCTION DAY OPERATIONS & PROJECTOR
// ----------------------------------------------------
doc.addPage();
drawHeader('3. Auction Day Live Operation Guide', 'Standard Operating Procedures for Stage & Teams');

doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Stage 1: Connecting the Arena Projector (1080p)', 50, 105);
doc.fillColor(mutedSlate).fontSize(9).font('Helvetica').text(
  '1. Connect the stage laptop to the venue LED wall, projector, or TV via HDMI cable.\n' +
  '2. Open the URL: http://localhost:5173/projector (or your production web link /projector).\n' +
  '3. Press F11 on the keyboard to enter borderless Fullscreen mode.\n' +
  '4. The projector will spotlight the active player photo, 20s countdown ring, current bid, leading team, and bottom ticker.',
  50,
  125,
  { lineGap: 4 }
);

doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Stage 2: Conducting the Live Bidding', 50, 205);
doc.fillColor(mutedSlate).fontSize(9).font('Helvetica').text(
  '1. The Auctioneer opens /admin/auction on the console laptop.\n' +
  '2. Click "Call Next Player" or click any player from the Queue tab.\n' +
  '3. Click the green "START CLOCK" button. The 20-second timer begins.\n' +
  '4. When a team raises their paddle or bids via mobile, click the quick bid button (+₹10k, +₹20k, +₹50k).\n' +
  '5. Every valid bid automatically resets the clock to 20 seconds.\n' +
  '6. At 5 seconds remaining, the clock flashes pulsing crimson with urgent chimes.\n' +
  '7. When time expires with a bid, the system automatically declares SOLD, deducts points, and triggers confetti!',
  50,
  225,
  { lineGap: 4 }
);

doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Stage 3: Team Owner Mobile Bidding Console (/team-bid)', 50, 325);
doc.fillColor(mutedSlate).fontSize(9).font('Helvetica').text(
  '1. Team Owners open /team-bid on their smartphones or iPads at their team tables.\n' +
  '2. Select their official team name from the dropdown.\n' +
  '3. Team Owners see the active player, current high bidder, remaining purse, and big bid pads.\n' +
  '4. If a team tries to bid beyond their Max Legal Bid, the system blocks the bid to protect their squad.',
  50,
  345,
  { lineGap: 4 }
);

// Deployment Section
doc.rect(50, 430, 495, 1).fill('#E2E8F0');
doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('4. Client Production Deployment Guide', 50, 450);

doc.fillColor(mutedSlate).fontSize(9).font('Helvetica').text(
  'The platform is built as an optimized static web application (`dist/` directory) and can be deployed in under 2 minutes.\n\n' +
  'Option A: One-Click Deploy to Vercel (Recommended)\n' +
  '1. Push the project code to your GitHub / GitLab account.\n' +
  '2. Log in to https://vercel.com and click "Add New Project".\n' +
  '3. Import your repository. Vercel will auto-detect Vite.\n' +
  '4. Under Environment Variables, add:\n' +
  '   • VITE_SUPABASE_URL = https://rfonfqwpzfafrgkbbsuf.supabase.co\n' +
  '   • VITE_SUPABASE_ANON_KEY = [Your Supabase Anon Key]\n' +
  '5. Click "Deploy". Your production URL will be live instantly!\n\n' +
  'Option B: Drag-and-Drop Deploy on Netlify\n' +
  '1. Open https://app.netlify.com/drop in your browser.\n' +
  '2. Drag the pre-built `dist/` folder directly onto the upload area.\n' +
  '3. Your site is deployed immediately with global CDN performance.',
  50,
  470,
  { lineGap: 3.5 }
);

doc.end();

writeStream.on('finish', () => {
  console.log(`✅ PDF User Manual successfully generated at: ${outputPath}`);
});
