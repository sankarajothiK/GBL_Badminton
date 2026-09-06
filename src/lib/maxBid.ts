import { Team, TournamentSettings, Category } from '../types/database';

export interface MaxBidResult {
  maxLegalBid: number;
  currentBalance: number;
  squadCount: number;
  requiredSlots: number;
  remainingSlots: number;
  reservePerSlot: number;
  totalReserveRequired: number;
  isEligibleToBid: boolean;
  ineligibilityReason?: string;
}

/**
 * GBL Tournament Budget & Reservation Engine
 * 
 * Rules:
 * - Total Team Points: 5,00,000
 * - Team Owner Reserved Points: 30,000
 * - Usable Player Points: 4,70,000
 * - Maximum Roster: 6 members (1 Team Owner + 5 Auctioned Players)
 * - Required Auction Players: 5
 * - Reserve per remaining player: 30,000 points
 * 
 * Dynamic Maximum Bid Formula:
 * Remaining Players to Buy After This Bid = Math.max(0, 5 - (currentSquadCount + 1))
 * Required Minimum Balance = Remaining Players * 30,000
 * Maximum Bid = Math.max(0, currentBalance - Required Minimum Balance)
 * 
 * Example:
 * - Current Balance = 3,20,000
 * - Current Squad Count = 0 (or 1 with 4 to go):
 *   If 4 players remaining after purchase -> Required Minimum = 4 * 30,000 = 1,20,000
 *   Maximum Bid = 3,20,000 - 1,20,000 = 2,00,000
 */
export function calculateMaxLegalBid(
  team: Team,
  currentSquadCount: number,
  settings?: Partial<TournamentSettings>,
  currentCategory?: Category
): MaxBidResult {
  const currentBalance = Number(team.current_balance ?? 470000);
  
  // Total auction player slots is strictly 5 (making 6 total members with Team Owner)
  const maxAuctionPlayers = 5;
  const reservePerSlot = 30000;

  // If team already reached 5 auctioned players (6 total with owner), squad is full
  if (currentSquadCount >= maxAuctionPlayers) {
    return {
      maxLegalBid: 0,
      currentBalance,
      squadCount: currentSquadCount,
      requiredSlots: maxAuctionPlayers,
      remainingSlots: 0,
      reservePerSlot,
      totalReserveRequired: 0,
      isEligibleToBid: false,
      ineligibilityReason: 'Team roster complete (5 players + 1 Team Owner = 6 members)'
    };
  }

  // Number of player slots that MUST still be purchased AFTER buying this current candidate
  // e.g. If currentSquadCount = 0, buying this player leaves 4 remaining players needed
  const remainingSlotsAfterThisBid = Math.max(0, maxAuctionPlayers - (currentSquadCount + 1));
  const totalReserveRequired = remainingSlotsAfterThisBid * reservePerSlot;

  // Dynamic Maximum Legal Bid
  const maxLegalBid = Math.max(0, currentBalance - totalReserveRequired);

  const startingBid = currentCategory?.starting_bid ?? 0;
  const isEligibleToBid = maxLegalBid >= startingBid && maxLegalBid > 0;

  let ineligibilityReason: string | undefined;
  if (!isEligibleToBid) {
    if (currentBalance <= 0) {
      ineligibilityReason = 'Zero balance remaining';
    } else if (maxLegalBid < startingBid) {
      ineligibilityReason = `Cannot meet starting bid (₹${startingBid.toLocaleString('en-IN')}) after reserving ₹${totalReserveRequired.toLocaleString('en-IN')} for ${remainingSlotsAfterThisBid} remaining player slot(s)`;
    }
  }

  return {
    maxLegalBid,
    currentBalance,
    squadCount: currentSquadCount,
    requiredSlots: maxAuctionPlayers,
    remainingSlots: remainingSlotsAfterThisBid,
    reservePerSlot,
    totalReserveRequired,
    isEligibleToBid,
    ineligibilityReason
  };
}

export function calculateMaxBid({
  balance,
  squadCount,
  totalAuctionSlots = 5,
  reservePerSlot = 30000
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
