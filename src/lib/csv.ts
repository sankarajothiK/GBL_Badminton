import Papa from 'papaparse';
import { Player, Team, AuctionBid, TournamentMatch, Standing } from '../types/database';

/**
 * Downloads a string as a file in the browser
 */
export function downloadFile(content: string, fileName: string, contentType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 1. PLAYERS CSV EXPORT
export function exportPlayersCSV(players: Player[], teams: Team[]) {
  const teamMap = new Map(teams.map(t => [t.id, t.name]));
  const rows = players.map(p => ({
    'Player ID': p.player_code,
    'Player Name': p.name,
    'Age': p.age,
    'Gender': p.gender,
    'Mobile': p.mobile || '',
    'Eligible Categories': p.eligible_category_names.join('; '),
    'Status': p.auction_status,
    'Sold Price': p.sold_price || '',
    'Sold Team': p.sold_team_id ? (teamMap.get(p.sold_team_id) || '') : '',
    'Achievements': p.achievements || '',
    'Notes': p.notes || ''
  }));

  const csv = Papa.unparse(rows);
  downloadFile(csv, `GBL_Players_${new Date().toISOString().slice(0, 10)}.csv`);
}

// 2. TEAMS CSV EXPORT
export function exportTeamsCSV(teams: Team[]) {
  const rows = teams.map(t => ({
    'Team #': t.team_number,
    'Team Name': t.name,
    'Short Name': t.short_name,
    'Owner': t.owner_name,
    'Captain': t.captain_name,
    'Initial Budget': t.initial_budget,
    'Current Balance': t.current_balance,
    'Total Spent': t.total_spent,
    'Description': t.description || ''
  }));

  const csv = Papa.unparse(rows);
  downloadFile(csv, `GBL_Teams_${new Date().toISOString().slice(0, 10)}.csv`);
}

// 3. AUCTION HISTORY CSV EXPORT
export function exportAuctionHistoryCSV(
  bids: (AuctionBid & { playerName?: string; categoryName?: string; teamName?: string })[]
) {
  const rows = bids.map(b => ({
    'Date & Time': new Date(b.created_at).toLocaleString('en-IN'),
    'Player': b.playerName || 'N/A',
    'Category': b.categoryName || 'N/A',
    'Team': b.teamName || b.team_name || 'N/A',
    'Bid Amount': b.amount,
    'Bid Type': b.bid_type,
    'Reverted': b.is_reverted ? 'YES' : 'NO',
    'Reverted Time': b.reverted_at ? new Date(b.reverted_at).toLocaleString('en-IN') : '',
    'Notes': b.notes || ''
  }));

  const csv = Papa.unparse(rows);
  downloadFile(csv, `GBL_Auction_History_${new Date().toISOString().slice(0, 10)}.csv`);
}

// 4. TEAM SQUADS CSV EXPORT
export function exportSquadsCSV(teams: Team[], players: Player[]) {
  const rows: any[] = [];
  teams.forEach(team => {
    const squad = players.filter(p => p.sold_team_id === team.id);
    if (squad.length === 0) {
      rows.push({
        'Team': team.name,
        'Owner': team.owner_name,
        'Player Name': 'No players bought yet',
        'Category': '',
        'Purchased Price': '',
        'Team Balance': team.current_balance
      });
    } else {
      squad.forEach(player => {
        rows.push({
          'Team': team.name,
          'Owner': team.owner_name,
          'Player Code': player.player_code,
          'Player Name': player.name,
          'Category': player.eligible_category_names.join(', '),
          'Purchased Price': player.sold_price,
          'Team Balance': team.current_balance
        });
      });
    }
  });

  const csv = Papa.unparse(rows);
  downloadFile(csv, `GBL_Squads_${new Date().toISOString().slice(0, 10)}.csv`);
}

// 5. RESULTS & STANDINGS CSV EXPORT
export function exportStandingsCSV(standings: (Standing & { teamName?: string })[]) {
  const rows = standings.map(s => ({
    'Rank': s.rank,
    'Team': s.teamName || 'Unknown Team',
    'Played': s.played,
    'Won': s.won,
    'Lost': s.lost,
    'Points': s.points,
    'Score For': s.score_for,
    'Score Against': s.score_against,
    'Score Diff': s.score_diff,
    'Qualified': s.is_qualified ? 'YES' : 'NO'
  }));

  const csv = Papa.unparse(rows);
  downloadFile(csv, `GBL_Standings_${new Date().toISOString().slice(0, 10)}.csv`);
}

// 6. CSV PLAYER IMPORT VALIDATOR
export interface ImportValidationRow {
  rowNumber: number;
  raw: any;
  isValid: boolean;
  errors: string[];
  parsedPlayer?: Partial<Player>;
}

export function validatePlayerImportCSV(
  fileContent: string,
  existingPlayers: Player[],
  validCategoryNames: string[]
): Promise<{ rows: ImportValidationRow[]; validCount: number; errorCount: number }> {
  return new Promise(resolve => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        const rows: ImportValidationRow[] = [];
        const seenCodes = new Set(existingPlayers.map(p => p.player_code.toLowerCase()));
        const seenNames = new Set(existingPlayers.map(p => p.name.toLowerCase()));

        results.data.forEach((rawRow: any, index: number) => {
          const rowNum = index + 2; // header is row 1
          const errors: string[] = [];

          // Find column values leniently
          const name = rawRow['Player Name'] || rawRow['Name'] || rawRow['player_name'] || '';
          const ageStr = rawRow['Age'] || rawRow['age'] || '';
          const gender = rawRow['Gender'] || rawRow['gender'] || 'Male';
          const mobile = rawRow['Mobile'] || rawRow['mobile'] || rawRow['Phone'] || '';
          const categoriesStr = rawRow['Category'] || rawRow['Categories'] || rawRow['Eligible Categories'] || '';
          const notes = rawRow['Notes'] || rawRow['notes'] || rawRow['Achievements'] || '';

          if (!name.trim()) {
            errors.push('Player Name is required.');
          }

          const age = parseInt(ageStr, 10);
          if (isNaN(age) || age < 10 || age > 85) {
            errors.push(`Invalid age "${ageStr}". Must be a number between 10 and 85.`);
          }

          if (name.trim() && seenNames.has(name.trim().toLowerCase())) {
            errors.push(`Duplicate player name "${name.trim()}" already exists in roster.`);
          }

          // Parse categories
          const catList = categoriesStr
            ? categoriesStr
                .split(/[,;|]/)
                .map((s: string) => s.trim())
                .filter(Boolean)
            : ['OPEN'];

          const unknownCats = catList.filter(
            (c: string) => !validCategoryNames.some(v => v.toLowerCase() === c.toLowerCase())
          );
          if (unknownCats.length > 0) {
            errors.push(`Unknown categories: ${unknownCats.join(', ')}.`);
          }

          const isValid = errors.length === 0;

          // Generate next code if none provided
          const nextIndex = existingPlayers.length + rows.length + 1;
          const code = `GBL-${String(nextIndex).padStart(3, '0')}`;

          const parsedPlayer: Partial<Player> | undefined = isValid
            ? {
                player_code: code,
                name: name.trim(),
                age,
                gender: gender.trim(),
                mobile: mobile.trim(),
                eligible_category_names: catList,
                eligible_category_ids: [],
                achievements: notes.trim(),
                notes: notes.trim(),
                registration_status: 'APPROVED',
                auction_status: 'UNSOLD',
                sold_price: null,
                sold_team_id: null,
                auction_order: nextIndex
              }
            : undefined;

          rows.push({
            rowNumber: rowNum,
            raw: rawRow,
            isValid,
            errors,
            parsedPlayer
          });
        });

        const validCount = rows.filter(r => r.isValid).length;
        const errorCount = rows.length - validCount;

        resolve({ rows, validCount, errorCount });
      }
    });
  });
}

// 7. TOURNAMENT JSON BACKUP AND RESTORE
export function exportTournamentBackupJSON(data: {
  tournament: any;
  settings: any;
  teams: any[];
  categories: any[];
  players: any[];
  bids: any[];
  matches: any[];
  standings: any[];
}) {
  const jsonStr = JSON.stringify(
    {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      generator: 'GBL Gulf Oil Badminton Premier League Engine',
      ...data
    },
    null,
    2
  );

  downloadFile(
    jsonStr,
    `GBL_Full_Backup_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`,
    'application/json;charset=utf-8;'
  );
}

export function validateTournamentBackupJSON(jsonContent: string): {
  isValid: boolean;
  error?: string;
  data?: any;
} {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!parsed.teams || !Array.isArray(parsed.teams)) {
      return { isValid: false, error: 'Missing or invalid "teams" array in backup file.' };
    }
    if (!parsed.categories || !Array.isArray(parsed.categories)) {
      return { isValid: false, error: 'Missing or invalid "categories" array in backup file.' };
    }
    if (!parsed.players || !Array.isArray(parsed.players)) {
      return { isValid: false, error: 'Missing or invalid "players" array in backup file.' };
    }
    return { isValid: true, data: parsed };
  } catch (err: any) {
    return { isValid: false, error: `Invalid JSON format: ${err.message}` };
  }
}
