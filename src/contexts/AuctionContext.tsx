import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Auction, AuctionBid, AuctionStatus, BidType, Player, Category, Team } from '../types/database';
import { useTournament } from './TournamentContext';
import { realtimeManager } from '../lib/supabase';
import { sounds } from '../lib/sound';
import { calculateMaxLegalBid } from '../lib/maxBid';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface AuctionContextType {
  currentAuction: Auction | null;
  currentPlayer: Player | null;
  currentCategory: Category | null;
  highestTeam: Team | null;
  bidHistory: AuctionBid[];
  timerSeconds: number;
  isTimerRunning: boolean;
  status: AuctionStatus;
  lastActionMessage: string | null;

  // Actions
  startAuction: (player: Player, category: Category) => void;
  placeBid: (teamId: string, amount: number, bidType?: BidType) => { success: boolean; error?: string };
  placeQuickBid: (teamId: string, increment: number) => { success: boolean; error?: string };
  pauseAuction: () => void;
  resumeAuction: () => void;
  resetTimer: () => void;
  markSoldManually: () => void;
  markUnsoldManually: () => void;
  undoLastBid: () => { success: boolean; error?: string };
  editCurrentBid: (newAmount: number, teamId: string) => { success: boolean; error?: string };
  cancelSold: () => { success: boolean; error?: string };
  reAuctionPlayer: () => void;
  selectNextPlayer: () => void;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tournament, settings, teams, players, categories, updateTeam, updatePlayer, logAuditAction } = useTournament();

  const [currentAuction, setCurrentAuction] = useState<Auction | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [bidHistory, setBidHistory] = useState<AuctionBid[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<number>(20);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  // Target expiration time in milliseconds (server synchronized)
  const expiresAtRef = useRef<number | null>(null);
  const remainingAtPauseRef = useRef<number>(20);

  // Find currently highest bidder team
  const highestTeam = currentAuction?.highest_team_id
    ? teams.find(t => t.id === currentAuction.highest_team_id) || null
    : null;

  // Synchronize state across all connected windows (Projector, Team portals, Admin)
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribe((type, payload) => {
      switch (type) {
        case 'AUCTION_STARTED': {
          setCurrentAuction(payload.auction);
          setCurrentPlayer(payload.player);
          setCurrentCategory(payload.category);
          setBidHistory(payload.bids || []);
          expiresAtRef.current = payload.expiresAt;
          setTimerSeconds(payload.timerSeconds);
          setIsTimerRunning(true);
          sounds.playBidChime();
          break;
        }

        case 'BID_PLACED': {
          setCurrentAuction(payload.auction);
          setBidHistory(prev => {
            const incomingBid: AuctionBid = payload.bid;
            if (!incomingBid) return prev;
            if (prev.some(b => b.id === incomingBid.id || (b.auction_id === incomingBid.auction_id && b.team_id === incomingBid.team_id && b.amount === incomingBid.amount))) {
              return prev;
            }
            return [incomingBid, ...prev];
          });
          expiresAtRef.current = payload.expiresAt;
          setTimerSeconds(payload.timerSeconds || 20);
          setIsTimerRunning(true);
          sounds.playBidChime();
          break;
        }

        case 'AUCTION_PAUSED': {
          setIsTimerRunning(false);
          remainingAtPauseRef.current = payload.remainingSeconds;
          setTimerSeconds(payload.remainingSeconds);
          break;
        }

        case 'AUCTION_RESUMED': {
          expiresAtRef.current = payload.expiresAt;
          setIsTimerRunning(true);
          break;
        }

        case 'TIMER_RESET': {
          expiresAtRef.current = payload.expiresAt;
          setTimerSeconds(payload.timerSeconds || 20);
          setIsTimerRunning(true);
          break;
        }

        case 'AUCTION_SOLD': {
          setIsTimerRunning(false);
          expiresAtRef.current = null;
          setCurrentAuction(payload.auction);
          if (payload.player) setCurrentPlayer(payload.player);
          sounds.playSoldGavel();
          break;
        }

        case 'AUCTION_UNSOLD': {
          setIsTimerRunning(false);
          expiresAtRef.current = null;
          setCurrentAuction(payload.auction);
          if (payload.player) setCurrentPlayer(payload.player);
          sounds.playUnsoldBuzz();
          break;
        }

        case 'AUCTION_CANCELLED': {
          setIsTimerRunning(false);
          expiresAtRef.current = null;
          setCurrentAuction(payload.auction);
          if (payload.player) setCurrentPlayer(payload.player);
          break;
        }

        case 'BID_UNDONE': {
          setCurrentAuction(payload.auction);
          setBidHistory(payload.bids);
          expiresAtRef.current = payload.expiresAt;
          setTimerSeconds(payload.timerSeconds || 20);
          break;
        }

        case 'BID_EDITED': {
          setCurrentAuction(payload.auction);
          setBidHistory(payload.bids);
          break;
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Complete Automatic SOLD action
  const handleAutomaticSold = useCallback(() => {
    if (!currentAuction || !currentPlayer || !currentAuction.highest_team_id) return;
    setIsTimerRunning(false);
    expiresAtRef.current = null;

    const winningTeam = teams.find(t => t.id === currentAuction.highest_team_id);
    if (!winningTeam) return;

    const soldPrice = currentAuction.current_bid;

    // Deduct team balance and increase total spent
    updateTeam(winningTeam.id, {
      current_balance: winningTeam.current_balance - soldPrice,
      total_spent: winningTeam.total_spent + soldPrice
    });

    // Mark player as SOLD
    const updatedPlayer: Player = {
      ...currentPlayer,
      auction_status: 'SOLD',
      sold_price: soldPrice,
      sold_team_id: winningTeam.id,
      updated_at: new Date().toISOString()
    };
    updatePlayer(currentPlayer.id, {
      auction_status: 'SOLD',
      sold_price: soldPrice,
      sold_team_id: winningTeam.id
    });
    setCurrentPlayer(updatedPlayer);

    const updatedAuction: Auction = {
      ...currentAuction,
      status: 'SOLD',
      completed_at: new Date().toISOString()
    };
    setCurrentAuction(updatedAuction);

    sounds.playSoldGavel();
    setLastActionMessage(`SOLD! ${currentPlayer.name} acquired by ${winningTeam.name} for ₹${soldPrice.toLocaleString('en-IN')}`);

    realtimeManager.broadcast('AUCTION_SOLD', {
      auction: updatedAuction,
      player: updatedPlayer,
      winningTeam,
      soldPrice
    });

    logAuditAction('PLAYER_SOLD_AUTOMATIC', {
      player: currentPlayer.name,
      team: winningTeam.name,
      price: soldPrice
    });
  }, [currentAuction, currentPlayer, teams, updateTeam, updatePlayer, logAuditAction]);

  // Complete Automatic UNSOLD action
  const handleAutomaticUnsold = useCallback(() => {
    if (!currentAuction || !currentPlayer) return;
    setIsTimerRunning(false);
    expiresAtRef.current = null;

    const updatedPlayer: Player = {
      ...currentPlayer,
      auction_status: 'UNSOLD',
      sold_price: null,
      sold_team_id: null
    };
    updatePlayer(currentPlayer.id, {
      auction_status: 'UNSOLD',
      sold_price: null,
      sold_team_id: null
    });
    setCurrentPlayer(updatedPlayer);

    const updatedAuction: Auction = {
      ...currentAuction,
      status: 'UNSOLD',
      completed_at: new Date().toISOString()
    };
    setCurrentAuction(updatedAuction);

    sounds.playUnsoldBuzz();
    setLastActionMessage(`UNSOLD: No bids placed for ${currentPlayer.name}`);

    realtimeManager.broadcast('AUCTION_UNSOLD', {
      auction: updatedAuction,
      player: updatedPlayer
    });

    logAuditAction('PLAYER_UNSOLD_AUTOMATIC', { player: currentPlayer.name });
  }, [currentAuction, currentPlayer, updatePlayer, logAuditAction]);

  // Synchronized Server-Timestamp Timer Loop
  useEffect(() => {
    if (!isTimerRunning || !expiresAtRef.current) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = expiresAtRef.current! - now;
      const secRemaining = Math.max(0, Math.ceil(diffMs / 1000));

      setTimerSeconds(secRemaining);

      // Play audio countdown ticks for last 5 seconds (5, 4, 3, 2, 1)
      if (secRemaining > 0 && secRemaining <= 5) {
        sounds.playCountdownTick(secRemaining);
      }

      // Reached zero: Trigger automatic SOLD or UNSOLD
      if (diffMs <= 0) {
        clearInterval(interval);
        if (currentAuction && currentAuction.current_bid > 0 && currentAuction.highest_team_id) {
          handleAutomaticSold();
        } else {
          handleAutomaticUnsold();
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isTimerRunning, currentAuction, handleAutomaticSold, handleAutomaticUnsold]);

  // 1. START AUCTION
  const startAuction = (player: Player, category: Category) => {
    const startBid = (category?.starting_bid && category.starting_bid > 0) ? category.starting_bid : 30000;
    const duration = settings.timer_seconds || 20;
    const expiresAt = Date.now() + duration * 1000;
    expiresAtRef.current = expiresAt;

    const newAuction: Auction = {
      id: generateUUID(),
      tournament_id: tournament.id,
      player_id: player.id,
      category_id: category.id,
      status: 'LIVE',
      starting_bid: startBid,
      current_bid: 0,
      highest_team_id: null,
      server_started_at: new Date().toISOString(),
      server_expires_at: new Date(expiresAt).toISOString(),
      paused_at: null,
      remaining_seconds_at_pause: duration,
      completed_at: null,
      created_by: 'Auction Admin',
      updated_at: new Date().toISOString()
    };

    setCurrentAuction(newAuction);
    setCurrentPlayer(player);
    setCurrentCategory(category);
    setBidHistory([]);
    setTimerSeconds(duration);
    setIsTimerRunning(true);
    setLastActionMessage(`Auction started for ${player.name} in ${category.name}`);

    updatePlayer(player.id, { auction_status: 'LIVE' });

    realtimeManager.broadcast('AUCTION_STARTED', {
      auction: newAuction,
      player,
      category,
      expiresAt,
      timerSeconds: duration,
      bids: []
    });

    logAuditAction('AUCTION_STARTED', { player: player.name, category: category.name, startBid });
  };

  // 2. PLACE BID
  const placeBid = (teamId: string, amount: number, bidType: BidType = 'NORMAL'): { success: boolean; error?: string } => {
    if (!currentAuction || currentAuction.status !== 'LIVE') {
      return { success: false, error: 'Auction is not currently LIVE' };
    }

    const team = teams.find(t => t.id === teamId);
    if (!team) {
      return { success: false, error: 'Invalid team selected' };
    }

    // Validation 1: Amount must be higher than current bid or meeting starting bid
    if (currentAuction.current_bid > 0) {
      if (amount <= currentAuction.current_bid) {
        return { success: false, error: `Bid must be higher than current bid of ₹${currentAuction.current_bid.toLocaleString('en-IN')}` };
      }
      const minIncrement = currentCategory?.min_bid_increment || 10000;
      if (amount - currentAuction.current_bid < minIncrement) {
        return { success: false, error: `Minimum bid increment is ₹${minIncrement.toLocaleString('en-IN')}` };
      }
    } else {
      const minStartingBid = (currentAuction.starting_bid && currentAuction.starting_bid > 0) ? currentAuction.starting_bid : 30000;
      if (amount < minStartingBid) {
        return { success: false, error: `Bid cannot be less than starting bid of ₹${minStartingBid.toLocaleString('en-IN')}` };
      }
    }

    // Validation 2: Available balance
    if (amount > team.current_balance) {
      return { success: false, error: `Insufficient team balance. ${team.name} has only ₹${team.current_balance.toLocaleString('en-IN')}` };
    }

    // Validation 3: Maximum legal bid & squad lock calculation
    const currentSquadCount = players.filter(p => p.sold_team_id === teamId).length;
    const maxBidCalc = calculateMaxLegalBid(team, currentSquadCount, settings, currentCategory || undefined);

    if (!maxBidCalc.isEligibleToBid) {
      return {
        success: false,
        error: maxBidCalc.ineligibilityReason || `Team ${team.name} has completed their squad quota or cannot bid.`
      };
    }

    if (amount > maxBidCalc.maxLegalBid) {
      return {
        success: false,
        error: `Bid exceeds maximum legal bid of ₹${maxBidCalc.maxLegalBid.toLocaleString('en-IN')} (Reserving ₹${maxBidCalc.totalReserveRequired.toLocaleString('en-IN')} for remaining ${maxBidCalc.remainingSlotsAfterThisBid} squad slots)`
      };
    }

    // Reset timer to 20 seconds
    const duration = settings.timer_seconds || 20;
    const expiresAt = Date.now() + duration * 1000;
    expiresAtRef.current = expiresAt;

    // Calculate exact bid increment from current bid or starting bid
    const startingBid = (currentAuction.starting_bid && currentAuction.starting_bid > 0) ? currentAuction.starting_bid : 30000;
    const prevAmount = currentAuction.current_bid > 0 ? currentAuction.current_bid : startingBid;
    const increment = Math.max(0, amount - prevAmount);

    const newBid: AuctionBid = {
      id: generateUUID(),
      auction_id: currentAuction.id,
      team_id: teamId,
      amount,
      increment_amount: increment,
      bid_type: bidType,
      is_reverted: false,
      created_at: new Date().toISOString(),
      created_by: team?.name || 'Admin',
      team_name: team?.name,
      team_color: team?.team_color
    };

    const updatedHistory = [newBid, ...bidHistory];
    setBidHistory(updatedHistory);

    const updatedAuction: Auction = {
      ...currentAuction,
      current_bid: amount,
      highest_team_id: teamId,
      server_expires_at: new Date(expiresAt).toISOString()
    };
    setCurrentAuction(updatedAuction);

    setTimerSeconds(duration);
    setIsTimerRunning(true);
    setLastActionMessage(`${team?.name || 'Team'} bid ₹${amount.toLocaleString('en-IN')}`);

    sounds.playBidChime();

    realtimeManager.broadcast('BID_PLACED', {
      auction: updatedAuction,
      bid: newBid,
      expiresAt,
      timerSeconds: duration
    });

    logAuditAction('BID_PLACED', {
      team: team?.name,
      amount,
      increment,
      bidType
    });

    return { success: true };
  };

  // Quick Bid (+10k, +20k, +50k)
  const placeQuickBid = (teamId: string, increment: number): { success: boolean; error?: string } => {
    if (!currentAuction) return { success: false, error: 'No active auction' };
    const startingBid = (currentAuction.starting_bid && currentAuction.starting_bid > 0) ? currentAuction.starting_bid : 30000;
    const base = currentAuction.current_bid > 0 ? currentAuction.current_bid : startingBid;
    const nextAmount = base + increment;
    const bidType: BidType = increment === 10000 ? 'QUICK_10K' : increment === 20000 ? 'QUICK_20K' : 'QUICK_50K';
    return placeBid(teamId, nextAmount, bidType);
  };

  // Pause Auction
  const pauseAuction = () => {
    if (!isTimerRunning) return;
    setIsTimerRunning(false);
    const remaining = timerSeconds;
    remainingAtPauseRef.current = remaining;
    expiresAtRef.current = null;

    if (currentAuction) {
      setCurrentAuction({
        ...currentAuction,
        status: 'PAUSED',
        remaining_seconds_at_pause: remaining
      });
    }

    realtimeManager.broadcast('AUCTION_PAUSED', { remainingSeconds: remaining });
    logAuditAction('AUCTION_PAUSED', { remainingSeconds: remaining });
  };

  // Resume Auction
  const resumeAuction = () => {
    if (isTimerRunning || !currentAuction) return;
    const duration = remainingAtPauseRef.current || settings.timer_seconds || 20;
    const expiresAt = Date.now() + duration * 1000;
    expiresAtRef.current = expiresAt;

    setCurrentAuction({
      ...currentAuction,
      status: 'LIVE'
    });
    setTimerSeconds(duration);
    setIsTimerRunning(true);

    realtimeManager.broadcast('AUCTION_RESUMED', { expiresAt, timerSeconds: duration });
    logAuditAction('AUCTION_RESUMED', { duration });
  };

  // Reset Timer to 20 seconds
  const resetTimer = () => {
    const duration = settings.timer_seconds || 20;
    const expiresAt = Date.now() + duration * 1000;
    expiresAtRef.current = expiresAt;
    setTimerSeconds(duration);
    setIsTimerRunning(true);

    if (currentAuction) {
      setCurrentAuction({ ...currentAuction, status: 'LIVE' });
    }

    realtimeManager.broadcast('TIMER_RESET', { expiresAt, timerSeconds: duration });
    logAuditAction('TIMER_RESET', { duration });
  };

  // Manual SOLD Trigger
  const markSoldManually = () => {
    handleAutomaticSold();
  };

  // Manual UNSOLD Trigger
  const markUnsoldManually = () => {
    handleAutomaticUnsold();
  };

  // Undo Last Bid
  const undoLastBid = (): { success: boolean; error?: string } => {
    if (!currentAuction) return { success: false, error: 'No active auction' };
    const sortedActiveBids = [...bidHistory.filter(b => !b.is_reverted)].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (sortedActiveBids.length === 0) {
      return { success: false, error: 'No active bids to undo' };
    }

    const lastBid = sortedActiveBids[0];
    const previousBid = sortedActiveBids[1] || null;

    // Mark last bid reverted
    const updatedHistory = bidHistory.map(b => b.id === lastBid.id ? { ...b, is_reverted: true, reverted_at: new Date().toISOString() } : b);
    setBidHistory(updatedHistory);

    const duration = settings.timer_seconds || 20;
    const expiresAt = Date.now() + duration * 1000;
    expiresAtRef.current = expiresAt;

    const newAmount = previousBid ? previousBid.amount : ((currentAuction.starting_bid && currentAuction.starting_bid > 0) ? currentAuction.starting_bid : 30000);
    const newTeamId = previousBid ? previousBid.team_id : null;

    const updatedAuction: Auction = {
      ...currentAuction,
      current_bid: newAmount,
      highest_team_id: newTeamId,
      server_expires_at: new Date(expiresAt).toISOString()
    };

    setCurrentAuction(updatedAuction);
    setTimerSeconds(duration);
    setIsTimerRunning(true);
    setLastActionMessage(`Undone bid of ₹${lastBid.amount.toLocaleString('en-IN')}. Current bid returned to ₹${newAmount.toLocaleString('en-IN')}`);

    realtimeManager.broadcast('BID_UNDONE', {
      auction: updatedAuction,
      bids: updatedHistory,
      expiresAt,
      timerSeconds: duration
    });

    logAuditAction('BID_UNDONE', { undoneAmount: lastBid.amount, currentBid: newAmount });
    return { success: true };
  };

  // Edit Current Bid
  const editCurrentBid = (newAmount: number, teamId: string): { success: boolean; error?: string } => {
    if (!currentAuction) return { success: false, error: 'No active auction' };
    const team = teams.find(t => t.id === teamId);
    if (!team) return { success: false, error: 'Team not found' };

    if (newAmount > team.current_balance) {
      return { success: false, error: `Amount exceeds ${team.name} balance of ₹${team.current_balance.toLocaleString('en-IN')}` };
    }

    const startingBid = (currentAuction.starting_bid && currentAuction.starting_bid > 0) ? currentAuction.starting_bid : 30000;
    const prevAmount = currentAuction.current_bid > 0 ? currentAuction.current_bid : startingBid;
    const increment = Math.max(0, newAmount - prevAmount);

    const editedBid: AuctionBid = {
      id: 'bid_edit_' + Date.now(),
      auction_id: currentAuction.id,
      team_id: teamId,
      amount: newAmount,
      increment_amount: increment,
      bid_type: 'EDITED',
      is_reverted: false,
      created_at: new Date().toISOString(),
      created_by: 'Admin',
      notes: 'Bid edited by Admin',
      team_name: team.name,
      team_color: team.team_color
    };

    const updatedHistory = [editedBid, ...bidHistory.filter(b => b.id !== editedBid.id)];
    setBidHistory(updatedHistory);

    const updatedAuction: Auction = {
      ...currentAuction,
      current_bid: newAmount,
      highest_team_id: teamId
    };
    setCurrentAuction(updatedAuction);
    setLastActionMessage(`Bid edited by Admin to ₹${newAmount.toLocaleString('en-IN')} for ${team.name}`);

    realtimeManager.broadcast('BID_EDITED', {
      auction: updatedAuction,
      bids: updatedHistory
    });

    logAuditAction('BID_EDITED', { newAmount, team: team.name });
    return { success: true };
  };

  // Cancel SOLD
  const cancelSold = (): { success: boolean; error?: string } => {
    if (!currentAuction || currentAuction.status !== 'SOLD' || !currentPlayer) {
      return { success: false, error: 'Current auction is not in SOLD status' };
    }

    const winningTeam = teams.find(t => t.id === currentAuction.highest_team_id);
    const refundAmount = currentAuction.current_bid;

    // Refund team balance
    if (winningTeam) {
      updateTeam(winningTeam.id, {
        current_balance: winningTeam.current_balance + refundAmount,
        total_spent: Math.max(0, winningTeam.total_spent - refundAmount)
      });
    }

    // Reset player back to UNSOLD
    const updatedPlayer: Player = {
      ...currentPlayer,
      auction_status: 'UNSOLD',
      sold_price: null,
      sold_team_id: null
    };
    updatePlayer(currentPlayer.id, {
      auction_status: 'UNSOLD',
      sold_price: null,
      sold_team_id: null
    });
    setCurrentPlayer(updatedPlayer);

    const updatedAuction: Auction = {
      ...currentAuction,
      status: 'CANCELLED',
      updated_at: new Date().toISOString()
    };
    setCurrentAuction(updatedAuction);
    setIsTimerRunning(false);
    expiresAtRef.current = null;

    setLastActionMessage(`Cancelled SOLD status for ${currentPlayer.name}. Refunded ₹${refundAmount.toLocaleString('en-IN')}`);

    realtimeManager.broadcast('AUCTION_CANCELLED', {
      auction: updatedAuction,
      player: updatedPlayer,
      refundAmount
    });

    logAuditAction('SOLD_CANCELLED', { player: currentPlayer.name, refunded: refundAmount });
    return { success: true };
  };

  // Re-Auction Player
  const reAuctionPlayer = () => {
    if (!currentPlayer || !currentCategory) return;
    startAuction(currentPlayer, currentCategory);
  };

  // Select Next Player
  const selectNextPlayer = () => {
    const unsoldPlayers = players.filter(p => p.auction_status === 'UNSOLD');
    if (unsoldPlayers.length === 0) {
      setLastActionMessage('All players have been auctioned!');
      return;
    }
    const nextP = unsoldPlayers[0];
    const categoryName = nextP.auction_category || 'NON-MEDALLIST';
    const cat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase()) || categories[0];
    startAuction(nextP, cat);
  };

  return (
    <AuctionContext.Provider
      value={{
        currentAuction,
        currentPlayer,
        currentCategory,
        highestTeam,
        bidHistory,
        timerSeconds,
        isTimerRunning,
        status: currentAuction?.status || 'READY',
        lastActionMessage,
        startAuction,
        placeBid,
        placeQuickBid,
        pauseAuction,
        resumeAuction,
        resetTimer,
        markSoldManually,
        markUnsoldManually,
        undoLastBid,
        editCurrentBid,
        cancelSold,
        reAuctionPlayer,
        selectNextPlayer
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};
