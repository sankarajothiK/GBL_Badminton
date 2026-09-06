import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const outputPath = path.resolve(process.cwd(), 'GBL_User_Manual.pdf');
const doc = new PDFDocument({
  size: 'A4',
  margin: 45,
  info: {
    Title: 'GBL Badminton Premier League - Master Operational Manual',
    Author: 'Gulf Oil Tournament Committee',
    Subject: 'Official Comprehensive Auction & Tournament Management Guide',
    Keywords: 'Badminton, GBL, Auction, User Manual, Kovilpatti, 2026'
  }
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Brand Colors
const primaryColor = '#101A1D';
const accentLime = '#3F6212';
const accentOrange = '#C2410C';
const darkSlate = '#0F172A';
const mutedSlate = '#475569';
const cardBg = '#F8FAFC';
const borderColor = '#E2E8F0';

function drawHeader(title, subtitle) {
  doc.rect(45, 35, 505, 3).fill(accentLime);
  doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text(title, 45, 45);
  if (subtitle) {
    doc.fillColor(mutedSlate).fontSize(9).font('Helvetica').text(subtitle, 45, 65);
  }
  doc.rect(45, 80, 505, 0.5).fill(borderColor);
}

function drawFooter(pageNumber, totalPages) {
  doc.rect(45, 785, 505, 0.5).fill(borderColor);
  doc.fillColor(mutedSlate).fontSize(8).font('Helvetica').text(
    'GBL Premier League 2026 • Official Master Operational Manual • Confidential',
    45,
    792
  );
  doc.fillColor(darkSlate).fontSize(8).font('Helvetica-Bold').text(
    `Page ${pageNumber} of ${totalPages}`,
    480,
    792,
    { align: 'right' }
  );
}

// ==============================================================================
// PAGE 1: COVER PAGE
// ==============================================================================
doc.rect(0, 0, 595, 842).fill('#0B1315');

doc.circle(520, 90, 160).lineWidth(12).strokeColor('rgba(190, 242, 100, 0.12)').stroke();
doc.circle(560, 110, 220).lineWidth(2).strokeColor('rgba(255, 255, 255, 0.08)').stroke();

doc.fillColor('#BEF264').fontSize(11).font('Helvetica-Bold').text('OFFICIAL TOURNAMENT & AUCTION GUIDE', 55, 180, { characterSpacing: 2 });
doc.fillColor('#FFFFFF').fontSize(34).font('Helvetica-Bold').text('GBL BADMINTON\nPREMIER LEAGUE', 55, 205, { lineGap: 6 });
doc.fillColor('#94A3B8').fontSize(13).font('Helvetica').text(
  'Comprehensive Master Operational Manual for Auctioneers, Officials & Teams\nGulf Oil Lubricants India Ltd. • Kovilpatti Season 2026',
  55,
  290,
  { lineGap: 4 }
);

// Target Audience Box
doc.roundedRect(55, 360, 485, 95, 10).fill('rgba(255, 255, 255, 0.04)').strokeColor('rgba(255, 255, 255, 0.12)').lineWidth(1).stroke();
doc.fillColor('#BEF264').fontSize(11).font('Helvetica-Bold').text('WHO IS THIS MANUAL FOR?', 75, 375);
doc.fillColor('#E2E8F0').fontSize(9.5).font('Helvetica').text(
  'This handbook is engineered specifically for auction conductors, organizers, and team owners—including those with ZERO prior knowledge of badminton rules or auction software. Follow this step-by-step to conduct a 100% professional live auction and tournament.',
  75,
  395,
  { width: 445, lineGap: 4 }
);

// Summary Grid Box
doc.roundedRect(55, 475, 485, 240, 10).fill('rgba(255, 255, 255, 0.04)').strokeColor('rgba(255, 255, 255, 0.12)').lineWidth(1).stroke();
doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold').text('MANUAL MODULES SITEMAP', 75, 492);

const sitemap = [
  ['CHAPTER 1', 'Badminton & League 101 (Basics for Non-Sports Officials)'],
  ['CHAPTER 2', 'The Golden Financial Rules (5 Lakh Budget & Reserve Formula)'],
  ['CHAPTER 3', 'Admin Logins & Security Access (Confidential Credentials)'],
  ['CHAPTER 4', 'Step-by-Step Live Auction Guide (The Conductor Script)'],
  ['CHAPTER 5', 'Where & How Teams Place Bids (Mobile Portals & Paddles)'],
  ['CHAPTER 6', 'Tournament Match Results & Live Standings Table'],
  ['CHAPTER 7', 'Troubleshooting, Reset Controls & Emergency Safety Net']
];

let smY = 515;
sitemap.forEach(([ch, title]) => {
  doc.fillColor('#BEF264').fontSize(8.5).font('Helvetica-Bold').text(ch, 75, smY);
  doc.fillColor('#CBD5E1').fontSize(8.5).font('Helvetica').text(title, 160, smY);
  smY += 27;
});

doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('PRODUCTION RELEASE • VERIFIED & TESTED FOR GBL KOVILPATTI', 55, 760);

// ==============================================================================
// PAGE 2: CHAPTER 1 - BADMINTON & LEAGUE 101 FOR COMPLETE BEGINNERS
// ==============================================================================
doc.addPage();
drawHeader('Chapter 1: Badminton & Tournament 101', 'Core Concepts Explained in Plain Terms for Non-Badminton Organizers');

let y = 95;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('1.1 What is Badminton & What is a League?', 45, y);
y += 18;
doc.fillColor(darkSlate).fontSize(9).font('Helvetica').text(
  'Badminton is a racket sport played by two opposing players (singles) or two pairs of players (doubles) across a netted court. In the GBL Premier League, games are exclusively DOUBLES (2 players per team on court). 10 corporate teams compete against each other in league fixtures to earn standings points and advance to the Finals.',
  45,
  y,
  { width: 505, lineGap: 3.5 }
);

y += 45;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('1.2 Why Do We Have a "Player Auction"?', 45, y);
y += 18;
doc.fillColor(darkSlate).fontSize(9).font('Helvetica').text(
  'Rather than arbitrarily assigning players to teams, GBL uses a competitive auction where all 10 teams bid "Points" from their allocated purse. The team with the highest bid when time expires wins that player. This ensures a balanced, dramatic, and completely fair distribution of talent across all squads.',
  45,
  y,
  { width: 505, lineGap: 3.5 }
);

y += 48;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('1.3 The 10 Official Teams in GBL 2026', 45, y);
y += 18;

const teamsList = [
  ['1. Gulf Smashers (GS)', 'Owner: Rajesh K. Varma', 'Captain: Arjun Nambiar'],
  ['2. Gulf Thunderbolts (GT)', 'Owner: Anand Mahindra', 'Captain: Karthik S.'],
  ['3. Gulf Kings XI (GK)', 'Owner: Sanjay Dutt', 'Captain: Vikramaditya Rao'],
  ['4. Gulf Strikers (GST)', 'Owner: Dr. Radhakrishnan', 'Captain: Deepak Chandran'],
  ['5. Gulf Shuttlers (GSH)', 'Owner: Praveen Chander', 'Captain: Ganesh Moorthy'],
  ['6. Gulf Warriors (GW)', 'Owner: Murali Vijay', 'Captain: Santhosh Kumar'],
  ['7. Gulf Blasters (GB)', 'Owner: Saravanan S.', 'Captain: Pradeep Venkat'],
  ['8. Gulf Falcons (GF)', 'Owner: Bala Murugan', 'Captain: Manoj Prabhakar'],
  ['9. Gulf Gladiators (GG)', 'Owner: Venkatesh Prasad', 'Captain: Harish Babu'],
  ['10. Gulf Titans (GTI)', 'Owner: Ramesh Aravind', 'Captain: Suresh Raina']
];

doc.rect(45, y, 505, 125).fill(cardBg).strokeColor(borderColor).lineWidth(1).stroke();
let ty = y + 8;
for (let i = 0; i < 5; i++) {
  const [t1, o1] = teamsList[i];
  const [t2, o2] = teamsList[i + 5];
  doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold').text(t1, 55, ty);
  doc.fillColor(mutedSlate).fontSize(7.5).font('Helvetica').text(o1, 55, ty + 11);

  doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold').text(t2, 305, ty);
  doc.fillColor(mutedSlate).fontSize(7.5).font('Helvetica').text(o2, 305, ty + 11);
  ty += 23;
}

y += 135;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('1.4 The Player Categories Explained Simply', 45, y);
y += 18;

const categoriesExplained = [
  ['Open Category', 'Top tier open players of any age with high competitive tournament ranking.'],
  ['35+ Jumbled', 'Experienced senior shuttlers aged 35 and above, paired dynamically.'],
  ['Veterans Doubles', 'Master shuttlers aged 45+ competing in dedicated veteran doubles brackets.'],
  ['80+ Combined', 'Doubles pair whose combined ages sum up to 80 years or greater (e.g. 42 + 38).'],
  ['Super Doubles', 'Fast-paced elite doubles pairings competing at highest tempo.'],
  ['Non-Medallist', 'Grassroots players who have not won a district/state medal—great for balance.']
];

categoriesExplained.forEach(([cat, desc]) => {
  doc.rect(45, y, 3, 16).fill(accentOrange);
  doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica-Bold').text(cat + ': ', 55, y + 3);
  const catWidth = doc.widthOfString(cat + ': ');
  doc.fillColor(mutedSlate).fontSize(8).font('Helvetica').text(desc, 55 + catWidth, y + 3, { width: 440 - catWidth });
  y += 20;
});

drawFooter(2, 7);

// ==============================================================================
// PAGE 3: CHAPTER 2 - THE GOLDEN FINANCIAL RULES & MATHEMATICS
// ==============================================================================
doc.addPage();
drawHeader('Chapter 2: The Golden Financial & Budget Rules', 'How Points, Owner Reserves & Maximum Legal Bids Protect Every Squad');

y = 95;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('2.1 The 5,00,000 Points Purse Allocation', 45, y);
y += 18;
doc.fillColor(darkSlate).fontSize(9).font('Helvetica').text(
  'Every team in GBL starts with a virtual wallet of 5,00,000 Points. In order to field a full squad of 6 players, the software mathematically enforces specific reserve deductions so teams cannot make careless mistakes.',
  45,
  y,
  { width: 505, lineGap: 3.5 }
);

y += 40;
doc.roundedRect(45, y, 160, 50, 6).fill('#FEF3C7').strokeColor('#F59E0B').lineWidth(1).stroke();
doc.fillColor('#92400E').fontSize(7.5).font('Helvetica-Bold').text('TOTAL TEAM PURSE', 55, y + 8);
doc.fillColor('#78350F').fontSize(16).font('Helvetica-Bold').text('5,00,000', 55, y + 22);

doc.roundedRect(217, y, 160, 50, 6).fill('#FEE2E2').strokeColor('#EF4444').lineWidth(1).stroke();
doc.fillColor('#991B1B').fontSize(7.5).font('Helvetica-Bold').text('OWNER RESERVED POINTS', 227, y + 8);
doc.fillColor('#7F1D1D').fontSize(16).font('Helvetica-Bold').text('- 30,000', 227, y + 22);

doc.roundedRect(390, y, 160, 50, 6).fill('#ECFCCB').strokeColor('#84CC16').lineWidth(1).stroke();
doc.fillColor('#365314').fontSize(7.5).font('Helvetica-Bold').text('USABLE PLAYER PURSE', 400, y + 8);
doc.fillColor('#14532D').fontSize(16).font('Helvetica-Bold').text('4,70,000', 400, y + 22);

y += 65;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('2.2 Squad Capacity: Exactly 6 Members', 45, y);
y += 16;
doc.fillColor(darkSlate).fontSize(9).font('Helvetica').text(
  'A team roster consists of 1 Team Owner (locked upfront) + 5 Auctioned Players = 6 Members Total. Once a team wins 5 players in the auction, their squad is FULL. The system will automatically close their bidding portal and display "SQUAD COMPLETED".',
  45,
  y,
  { width: 505, lineGap: 3.5 }
);

y += 45;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('2.3 The "Minimum Reserve per Unfilled Slot" Rule', 45, y);
y += 16;
doc.fillColor(darkSlate).fontSize(9).font('Helvetica').text(
  'Why can\'t a team spend 4,50,000 points on their first player? Because they still need 4 more players! If they spent 4.5 Lakhs, they would only have 20,000 points left for 4 players—which would break the minimum base price rules. Therefore, the software enforces the Dynamic Max Legal Bid Guard:',
  45,
  y,
  { width: 505, lineGap: 3.5 }
);

y += 45;
doc.roundedRect(45, y, 505, 55, 8).fill('#F1F5F9').strokeColor('#CBD5E1').lineWidth(1).stroke();
doc.fillColor(accentOrange).fontSize(11).font('Helvetica-Bold').text(
  'Max Legal Bid = Current Balance - ((Remaining Players to Buy - 1) × 30,000)',
  60,
  y + 14
);
doc.fillColor(mutedSlate).fontSize(8).font('Helvetica').text(
  'This formula guarantees that exactly ₹30,000 points are locked away for every remaining unfilled slot.',
  60,
  y + 34
);

y += 70;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('2.4 Practical Bidding Calculations (Real Examples)', 45, y);
y += 16;

const mathExamples = [
  ['Scenario 1 (First Player of the Auction):', 'Purse = 4,70,000 pts. Team needs 5 players. Reserve for other 4 players = 4 × 30,000 = 1,20,000 pts.\n-> Max Legal First Bid = 4,70,000 - 1,20,000 = 3,50,000 Points.'],
  ['Scenario 2 (Mid-Auction - 4 Players Remaining):', 'Team bought Player 1 for 1,50,000 pts. Current purse = 3,20,000 pts. 4 players remaining.\nReserve for other 3 players = 3 × 30,000 = 90,000 pts.\n-> Max Legal Bid on Next Player = 3,20,000 - 90,000 = 2,30,000 Points.'],
  ['Scenario 3 (The 5th & Final Player):', 'Remaining players after this one = 0. No further reserve needed.\n-> The team can legally spend their entire remaining balance down to 0 Points!']
];

mathExamples.forEach(([title, desc]) => {
  doc.rect(45, y, 2, 28).fill(accentLime);
  doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica-Bold').text(title, 55, y);
  doc.fillColor(mutedSlate).fontSize(8).font('Helvetica').text(desc, 55, y + 12, { width: 490, lineGap: 2 });
  y += 40;
});

drawFooter(3, 7);

// ==============================================================================
// PAGE 4: CHAPTER 3 - ACCESS, CREDENTIALS & SITEMAP
// ==============================================================================
doc.addPage();
drawHeader('Chapter 3: System Access & Admin Credentials', 'Security Protocols, Passwords and Screen Roles');

y = 95;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('3.1 System Screen Structure (4 Major Interfaces)', 45, y);
y += 18;

const screens = [
  ['1. Public Website (/)', 'Open to all badminton fans, players, and sponsors. View live rosters, player profiles, standings points table, and real-time auction ticker without logging in.'],
  ['2. Admin Console (/admin)', 'Restricted to tournament officials. Used by the Auctioneer operator to manage candidate queues, start clocks, place bids, and record match scores.'],
  ['3. Arena Projector (/projector)', 'Designed for 1080p/4K venue TVs, projectors, or LED walls. Spotlight player photo, animated 20s countdown ring, current leading bid, and team logos.'],
  ['4. Team Portals (/team-portal/:id)', 'Private screen for team owners at their tables. Shows their live budget balance, roster count, and instant 1-tap bid buttons (+10k, +20k, +50k).']
];

screens.forEach(([title, desc]) => {
  doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica-Bold').text(title, 45, y);
  doc.fillColor(mutedSlate).fontSize(8).font('Helvetica').text(desc, 45, y + 11, { width: 505, lineGap: 2.5 });
  y += 36;
});

y += 10;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('3.2 Production Admin Login Credentials (Confidential)', 45, y);
y += 16;
doc.fillColor(mutedSlate).fontSize(8.5).font('Helvetica').text(
  'To maintain auction integrity, credentials are NOT displayed on the public website. Store these securely:',
  45,
  y
);

y += 18;
doc.roundedRect(45, y, 505, 110, 8).fill('#0F172A');
doc.fillColor('#BEF264').fontSize(10).font('Helvetica-Bold').text('ADMINISTRATIVE AUTHENTICATION DESK', 65, y + 15);

doc.fillColor('#94A3B8').fontSize(8.5).font('Helvetica').text('Super Administrator (Full System Control & Database Settings):', 65, y + 35);
doc.fillColor('#FFFFFF').fontSize(9.5).font('Helvetica-Bold').text('Username:  admin@gulfoil.com', 65, y + 50);
doc.fillColor('#BEF264').fontSize(9.5).font('Helvetica-Bold').text('Password:  GBL2026@Admin!', 285, y + 50);

doc.fillColor('#94A3B8').fontSize(8.5).font('Helvetica').text('Chief Auctioneer Desk (Bidding Operator Mode):', 65, y + 72);
doc.fillColor('#FFFFFF').fontSize(9.5).font('Helvetica-Bold').text('Username:  auction@gulfoil.com', 65, y + 87);
doc.fillColor('#BEF264').fontSize(9.5).font('Helvetica-Bold').text('Password:  GBL2026@Auction!', 285, y + 87);

y += 125;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('3.3 First-Time Database Synchronization (Supabase)', 45, y);
y += 16;
doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica').text(
  'If your database ever shows "0 rows" or "violates row-level security", simply open the Supabase SQL Editor (>_), paste the master query from `supabase/setup_and_seed_all.sql`, and click "Run". This instantly recreates all 10 teams, 69 players, and unlocks unrestricted read/write permissions for the admin portal.',
  45,
  y,
  { width: 505, lineGap: 3 }
);

drawFooter(4, 7);

// ==============================================================================
// PAGE 5: CHAPTER 4 - THE LIVE AUCTION CONDUCTOR MASTER SCRIPT
// ==============================================================================
doc.addPage();
drawHeader('Chapter 4: The Live Auction Conductor Guide', 'Step-by-Step Practical Script for the Stage Auctioneer & Operator');

y = 95;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('4.1 Hardware & Venue Setup (30 Minutes Before Start)', 45, y);
y += 16;

const setupSteps = [
  '1. Connect Operator Laptop to WiFi & navigate to /admin/auction (Auction Master view).',
  '2. Connect Projector Screen Laptop to Hall LED TV/Projector via HDMI & open /projector in Fullscreen (F11).',
  '3. Test sound audio: Ensure the venue speaker system plays the bid chime and the final gavel gong.',
  '4. Team Table Check: Confirm each of the 10 team tables has a phone or iPad open to their team bidding portal.'
];

setupSteps.forEach(s => {
  doc.fillColor(mutedSlate).fontSize(8.5).font('Helvetica').text(s, 50, y, { width: 500, lineGap: 2 });
  y += 18;
});

y += 10;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('4.2 The 7-Step Live Auction Procedure (Per Player)', 45, y);
y += 16;

const auctionFlow = [
  ['Step 1: Select Candidate', 'The operator clicks "Call Next Player" or selects a player from the queue. The player\'s full profile, academy, photo, and eligible categories appear on both the operator console and the venue big screen.'],
  ['Step 2: Announce Candidate', 'The Auctioneer speaks into the mic: "Calling Player No. GBL-012: Jeeva, Age 42, Sharavanas Badminton Academy. Eligible for Open and 35+ Jumbled. Base starting price: 20,000 Points!"'],
  ['Step 3: Start the Clock', 'The operator clicks the green "START CLOCK" button. The animated 20-second countdown begins on the arena screen, accompanied by an opening chime.'],
  ['Step 4: Receiving Bids', 'When a team raises their paddle or taps on their phone, the operator clicks the quick bid button (+10,000, +20,000, or +50,000) under that team\'s name.'],
  ['Step 5: The 20s Reset', 'EVERY SINGLE VALID BID resets the clock back to 20 seconds. This ensures opposing teams always have a fair window of 20 seconds to counter-bid.'],
  ['Step 6: The Urgent 5-Second Warning', 'When the timer dips below 5 seconds, the countdown circle pulses urgent crimson with rhythmic beeps ("Going once... Going twice...").'],
  ['Step 7: Sold Declaration', 'When the timer reaches 0, the gavel bangs, confetti explodes across the arena projector, and the player is automatically marked SOLD to the winning team with points deducted!']
];

auctionFlow.forEach(([st, desc]) => {
  doc.rect(45, y, 3, 24).fill(accentLime);
  doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica-Bold').text(st, 55, y);
  doc.fillColor(mutedSlate).fontSize(7.8).font('Helvetica').text(desc, 55, y + 11, { width: 490, lineGap: 1.5 });
  y += 33;
});

y += 5;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('4.3 What If Nobody Bids? (Unsold Protocol)', 45, y);
y += 14;
doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica').text(
  'If the 20 seconds expire with zero bids, click "Mark UNSOLD". The player is safely placed into the Unsold Pool. After all 69 players have had their first round, the Auctioneer can click "Re-Auction Unsold Players" to bring them back at a reduced base price.',
  45,
  y,
  { width: 505, lineGap: 2.5 }
);

drawFooter(5, 7);

// ==============================================================================
// PAGE 6: CHAPTER 5 - WHERE & HOW TEAMS PLACE BIDS
// ==============================================================================
doc.addPage();
drawHeader('Chapter 5: Where & How Teams Bid', 'Two Operating Models: Mobile Table Portals vs Physical Paddles');

y = 95;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('5.1 Method A: Digital Mobile Bidding Portals (/team-portal/:id)', 45, y);
y += 16;
doc.fillColor(darkSlate).fontSize(9).font('Helvetica').text(
  'Every team has a private, mobile-optimized bidding console designed to be used on smartphones or tablets at the team table. Team owners simply open their dedicated URL (e.g. `https://your-site.vercel.app/team-portal/team-1`).',
  45,
  y,
  { width: 505, lineGap: 3.5 }
);

y += 38;
doc.rect(45, y, 505, 95).fill(cardBg).strokeColor(borderColor).lineWidth(1).stroke();
doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold').text('WHAT TEAM OWNERS SEE ON THEIR PHONES:', 55, y + 10);
doc.fillColor(mutedSlate).fontSize(8).font('Helvetica').text(
  '• Live Remaining Purse Budget: Updates in real-time as points are spent.\n' +
  '• Active Player Spotlight: Instant photo, name, academy, and current high bidder.\n' +
  '• Dynamic One-Tap Bid Buttons: Big touch pads for +10,000, +20,000, and +50,000 points.\n' +
  '• Automatic Bankruptcy Lock: If a bid exceeds the team\'s Max Legal Bid, the button disables with a red warning: "Exceeds squad reserve".\n' +
  '• Realtime Audio Feedback: Plays a reassuring chime whenever their bid is accepted.',
  55,
  y + 26,
  { lineGap: 3.5 }
);

y += 110;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('5.2 Method B: Physical Paddle Bidding (Traditional Auction Style)', 45, y);
y += 16;
doc.fillColor(darkSlate).fontSize(9).font('Helvetica').text(
  'If your venue has spotty WiFi or if team owners prefer holding numbered paddles, the Auction Operator at the main stage laptop controls the bidding directly from `/admin/auction`.',
  45,
  y,
  { width: 505, lineGap: 3 }
);

y += 35;
const paddleFlow = [
  ['1. Team Raises Paddle', 'The owner of Gulf Thunderbolts (Table 2) raises their paddle in the hall.'],
  ['2. Auctioneer Acknowledges', 'The Auctioneer shouts: "Bid taken by Gulf Thunderbolts at 70,000 Points!"'],
  ['3. Operator Clicks Button', 'The operator clicks the "+10k" or "GT" button on the screen. The big screen instantly flashes Thunderbolts as the leading bidder and the clock resets to 20s.']
];

paddleFlow.forEach(([h, d]) => {
  doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica-Bold').text(h, 45, y);
  doc.fillColor(mutedSlate).fontSize(8).font('Helvetica').text(d, 45, y + 11, { width: 505, lineGap: 2 });
  y += 30;
});

y += 10;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('5.3 Correcting Human Errors During Live Bidding', 45, y);
y += 16;

const corrections = [
  ['Undo Last Bid:', 'If the operator mistakenly clicked the wrong team, click "Undo Last Bid" immediately. The system restores the previous bidder and previous price seamlessly.'],
  ['Edit Bid Amount:', 'If an unusual increment is requested (e.g. jumping from ₹1,00,000 straight to ₹1,75,000), enter the custom amount into the manual bid box and click Submit.'],
  ['Cancel Sold Status:', 'If a player was marked sold prematurely, go to Auction History, locate the player, and click "Reopen Bidding". The points are refunded to the team and the player returns to active status.']
];

corrections.forEach(([c, desc]) => {
  doc.rect(45, y, 2, 22).fill(accentOrange);
  doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica-Bold').text(c, 55, y);
  doc.fillColor(mutedSlate).fontSize(8).font('Helvetica').text(desc, 55, y + 10, { width: 490, lineGap: 2 });
  y += 30;
});

drawFooter(6, 7);

// ==============================================================================
// PAGE 7: CHAPTER 6 & 7 - MATCH RESULTS, TROUBLESHOOTING & EMERGENCY
// ==============================================================================
doc.addPage();
drawHeader('Chapter 6 & 7: Tournament Operations & Emergency Kit', 'Post-Auction Match Management, Data Backups & Safety Nets');

y = 95;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('6.1 Recording Match Results & Live Points Table (/admin/results)', 45, y);
y += 16;
doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica').text(
  'After the auction concludes, the tournament fixtures begin. The match scoring module allows officials to record court fixtures and set scores (Set 1, Set 2, Set 3). Matches follow standard 21-point BWF badminton scoring. As soon as a match winner is saved, the live Points Table automatically calculates:\n' +
  '• Matches Played, Won, and Lost\n' +
  '• Standing Points (2 points per win)\n' +
  '• Total Score For, Score Against, and Score Differential (used for tie-breakers)\n' +
  '• Auto-qualification badges for the top 8 teams advancing to the playoffs.',
  45,
  y,
  { width: 505, lineGap: 3 }
);

y += 75;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('7.1 Tournament Data Backup & Restore (/admin/settings)', 45, y);
y += 16;
doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica').text(
  'Never worry about data loss. The system includes an automated 1-click JSON snapshot utility:\n' +
  '• Click "Export Tournament Backup" at any point to download the complete tournament state (all wallets, sold players, and matches) into a single timestamped `.json` file.\n' +
  '• If a laptop crashes or battery dies, plug in any other laptop, log in, and click "Import & Restore Backup" to restore the exact state in 2 seconds.',
  45,
  y,
  { width: 505, lineGap: 3 }
);

y += 65;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('7.2 Granular Reset Controls (Super Admin Only)', 45, y);
y += 16;
doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica').text(
  'For rehearsal or tournament resets, navigate to /admin/settings. Reset actions are guarded by strict typing confirmation ("confirm") so data cannot be deleted accidentally:\n' +
  '1. Reset Auction Only: Clears sold prices and bids; returns all 69 players to UNSOLD and all wallets back to ₹5,00,000.\n' +
  '2. Reset Results Only: Clears match score sheets and resets the Points Table.\n' +
  '3. Complete Tournament Reset: Returns the entire platform to fresh tournament seed state.',
  45,
  y,
  { width: 505, lineGap: 3 }
);

y += 65;
doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('7.3 Emergency Troubleshooting Quick Reference', 45, y);
y += 16;

const faq = [
  ['What if venue WiFi disconnects during bidding?', 'The system has an offline local cache and will keep counting down without crashing. Once reconnected, it syncs bids to the cloud.'],
  ['What if the big screen freezes?', 'Simply press F5 on the projector laptop. The projector reconnects to the live state in under 1 second without disturbing the auction.'],
  ['What if an owner accidentally bids on the wrong player?', 'Click "Undo Last Bid" on the operator console or "Cancel Sold" from the Auction History tab. Points are instantly refunded.']
];

faq.forEach(([q, a]) => {
  doc.fillColor(darkSlate).fontSize(8).font('Helvetica-Bold').text(q, 45, y);
  doc.fillColor(mutedSlate).fontSize(7.8).font('Helvetica').text(a, 45, y + 10, { width: 505, lineGap: 1.5 });
  y += 28;
});

y += 10;
doc.roundedRect(45, y, 505, 30, 6).fill('#FEF2F2').strokeColor('#FCA5A5').lineWidth(1).stroke();
doc.fillColor('#991B1B').fontSize(8).font('Helvetica-Bold').text(
  'TOURNAMENT HELPLINE & EMERGENCY SUPPORT:  admin@gulfoil.com  |  +91 98844 12345',
  55,
  y + 11
);

drawFooter(7, 7);

// Finalize PDF
doc.end();

writeStream.on('finish', () => {
  console.log(`✅ Master 7-Page PDF User Manual successfully generated at: ${outputPath}`);
});
