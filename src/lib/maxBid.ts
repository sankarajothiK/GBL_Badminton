import { Team, TournamentSettings, Category } from '../types/database';

export interface MaxBidResult {
  maxLegalBid: number;
  currentBalance: number;
  squadCount: number;
  requiredSlots: number;
  remainingSlots: number;
  remainingSlotsAfterThisBid: number;
  reservePerSlot: number;
  totalReserveRequired: number;
  isEligibleToBid: boolean;
  ineligibilityReason?: string;
  ownerIsPlayer: boolean;
  ownerAllocation: number;
  auctionBudget: number;
  totalPoints: number;
  totalSpent: number;
}

export interface TeamAuctionMetrics {
  teamId: string;
  teamName: string;
  ownerName: string;
  ownerIsPlayer: boolean;
  totalPoints: number;
  ownerAllocation: number;
  auctionBudget: number;
  playersBought: number;
  maxAuctionSlots: number;
  totalSquadSlots: number;
  remainingSlots: number;
  totalSpent: number;
  remainingBalance: number;
  maxLegalBid: number;
  isLocked: boolean;
}

/**
 * GBL Tournament Budget & Owner Allocation Engine
 * 
 * Rules:
 * - Each team receives ₹5,00,000 total auction points.
 * - If Owner IS playing:
 *     * Fixed owner allocation: ₹1,00,000 (occupies 1 roster slot).
 *     * Available for player bidding: ₹4,00,000.
 *     * Squad total: 6 players (1 Owner + 5 Auctioned Players).
 *     * Required auction picks: 5 players.
 * - If Owner is NOT playing (Tamilaga Asiriyar kootani warriors - Owner: jeevananthan):
 *     * Owner allocation: ₹0 (occupies 0 roster slots).
 *     * Available for player bidding: ₹5,00,000.
 *     * Squad total: 6 players (0 Owner + 6 Auctioned Players).
 *     * Required auction picks: 6 players.
 * - Winning bids deduct ONLY from Available Auction Points.
 * - Owner allocation (1,00,000 or 0) is isolated and NEVER deducted during bidding.
 * - Teams reaching their quota (5 or 6) are locked from further bidding.
 */
export function calculateMaxLegalBid(
  team: Team,
  currentSquadCount: number,
  settings?: Partial<TournamentSettings>,
  currentCategory?: Category
): MaxBidResult {
  const totalPoints = team.initial_budget || 500000;
  const ownerIsPlayer = team.owner_is_player !== false;
  // Dynamic Owner Allocation: OPEN (1,00,000), Normal (30,000), or No-Play (0)
  const ownerAllocation = team.owner_points_allocation !== undefined
    ? team.owner_points_allocation
    : (team.owner_reserved_points !== undefined ? team.owner_reserved_points : (ownerIsPlayer ? 30000 : 0));
  const auctionBudget = team.auction_budget || (totalPoints - ownerAllocation);
  const currentBalance = Number(team.current_balance !== undefined ? team.current_balance : auctionBudget);
  const totalSpent = Number(team.total_spent || 0);

  // Total squad quota: exactly 6 members for every team
  const totalSquadTarget = team.total_squad_slots || 6;
  const reservePerSlot = Number(settings?.reserve_per_slot || 10000);
  
  // Remaining squad slots to be filled
  const remainingSlots = Math.max(0, totalSquadTarget - currentSquadCount);

  // If team has reached 6 members, locked from bidding
  if (currentSquadCount >= totalSquadTarget) {
    return {
      maxLegalBid: 0,
      currentBalance,
      squadCount: currentSquadCount,
      requiredSlots: totalSquadTarget,
      remainingSlots: 0,
      remainingSlotsAfterThisBid: 0,
      reservePerSlot,
      totalReserveRequired: 0,
      isEligibleToBid: false,
      ineligibilityReason: ownerIsPlayer 
        ? 'Team roster complete (5 auctioned players + 1 playing owner = 6 members)' 
        : 'Team roster complete (6 auctioned players acquired = 6 members)',
      ownerIsPlayer,
      ownerAllocation,
      auctionBudget,
      totalPoints,
      totalSpent
    };
  }

  // Slots that must still be purchased AFTER this bid
  const remainingSlotsAfterThisBid = Math.max(0, totalSquadTarget - (currentSquadCount + 1));
  const totalReserveRequired = remainingSlotsAfterThisBid * reservePerSlot;

  // Dynamic Maximum Legal Bid
  const maxLegalBid = Math.max(0, currentBalance - totalReserveRequired);

  const startingBid = currentCategory?.starting_bid ?? 30000;
  const isEligibleToBid = maxLegalBid >= startingBid && maxLegalBid > 0;

  let ineligibilityReason: string | undefined;
  if (!isEligibleToBid) {
    if (currentBalance <= 0) {
      ineligibilityReason = 'Zero auction balance remaining';
    } else if (maxLegalBid < startingBid) {
      ineligibilityReason = `Cannot meet starting bid (₹${startingBid.toLocaleString('en-IN')}) after reserving ₹${totalReserveRequired.toLocaleString('en-IN')} for ${remainingSlotsAfterThisBid} remaining player slot(s)`;
    }
  }

  return {
    maxLegalBid,
    currentBalance,
    squadCount: currentSquadCount,
    requiredSlots: totalSquadTarget,
    remainingSlots,
    remainingSlotsAfterThisBid,
    reservePerSlot,
    totalReserveRequired,
    isEligibleToBid,
    ineligibilityReason,
    ownerIsPlayer,
    ownerAllocation,
    auctionBudget,
    totalPoints,
    totalSpent
  };
}

/**
 * Calculates complete 7-point summary for any team
 */
export function getTeamAuctionMetrics(
  team: Team,
  playersBoughtCount: number,
  settings?: Partial<TournamentSettings>,
  currentCategory?: Category
): TeamAuctionMetrics {
  const maxBidInfo = calculateMaxLegalBid(team, playersBoughtCount, settings, currentCategory);
  const totalSquadSlots = team.total_squad_slots || 6;
  const isLocked = playersBoughtCount >= totalSquadSlots;
  const maxAuctionSlots = maxBidInfo.ownerIsPlayer ? 5 : 6;

  return {
    teamId: team.id,
    teamName: team.name,
    ownerName: team.owner_name,
    ownerIsPlayer: maxBidInfo.ownerIsPlayer,
    totalPoints: maxBidInfo.totalPoints,
    ownerAllocation: maxBidInfo.ownerAllocation,
    auctionBudget: maxBidInfo.auctionBudget,
    playersBought: playersBoughtCount,
    maxAuctionSlots,
    totalSquadSlots,
    remainingSlots: maxBidInfo.remainingSlots,
    totalSpent: maxBidInfo.totalSpent,
    remainingBalance: maxBidInfo.currentBalance,
    maxLegalBid: maxBidInfo.maxLegalBid,
    isLocked
  };
}

export function calculateMaxBid({
  balance,
  squadCount,
  totalAuctionSlots = 5,
  reservePerSlot = 10000
}: {
  balance: number;
  squadCount: number;
  totalAuctionSlots?: number;
  reservePerSlot?: number;
}): {
  maxBid: number;
  remainingSlots: number;
  totalReserveRequired: number;
  remainingAuctionSlots: number;
  reservedPoints: number;
} {
  const remainingAuctionSlots = Math.max(0, totalAuctionSlots - squadCount);
  if (squadCount >= totalAuctionSlots) {
    return {
      maxBid: 0,
      remainingSlots: 0,
      totalReserveRequired: 0,
      remainingAuctionSlots: 0,
      reservedPoints: 0
    };
  }
  const remainingSlotsAfterThisBid = Math.max(0, totalAuctionSlots - (squadCount + 1));
  const totalReserveRequired = remainingSlotsAfterThisBid * reservePerSlot;
  const maxBid = Math.max(0, balance - totalReserveRequired);
  return {
    maxBid,
    remainingSlots: remainingSlotsAfterThisBid,
    totalReserveRequired,
    remainingAuctionSlots,
    reservedPoints: totalReserveRequired
  };
}
