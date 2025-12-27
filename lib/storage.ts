import { MoveRating } from './types';

// A single move record in a session
export interface MoveRecord {
  move: string;           // e.g., "e4", "Nf3"
  rating: MoveRating;
  fen: string;            // Position BEFORE the move
  opponentMove?: string;  // What opponent played after (for replay)
  openingName?: string;
}

// A complete session
export interface SessionRecord {
  id: string;
  timestamp: string;
  ratingLevel: number;
  playerColor: 'white' | 'black';
  timeLimit: number;
  totalScore: number;
  movesPlayed: number;
  moves: MoveRecord[];
  openingName: string;    // Final opening name reached
  blunderCount: number;
}

// All stored data
export interface StoredData {
  sessions: SessionRecord[];
  version: number;
}

const STORAGE_KEY = 'openingblitz_data';
const VISIT_KEY = 'openingblitz_visits';
const BLUNDER_KEY = 'openingblitz_blunders';
const CURRENT_VERSION = 1;

// Blunder tracking for spaced repetition
export interface BlunderRecord {
  id: string;
  fen: string;                    // Position where blunder occurred
  blunderMove: string;            // What player played (wrong)
  openingName: string;
  playerColor: 'white' | 'black';
  ratingLevel: number;
  firstSeen: string;              // When first blundered
  lastTested: string;             // When last tested in blunder mode
  timesSeen: number;              // How many times this position was reached
  timesFixed: number;             // How many times player got it right in testing
  timesBlundered: number;         // How many times blundered (including retests)
}

export interface BlunderData {
  blunders: BlunderRecord[];
  version: number;
}

// Visit tracking
export interface VisitData {
  count: number;
  firstVisit: string;
  lastVisit: string;
}

export function getVisitData(): VisitData {
  if (typeof window === 'undefined') {
    return { count: 0, firstVisit: '', lastVisit: '' };
  }

  try {
    const raw = localStorage.getItem(VISIT_KEY);
    if (!raw) {
      return { count: 0, firstVisit: '', lastVisit: '' };
    }
    return JSON.parse(raw) as VisitData;
  } catch {
    return { count: 0, firstVisit: '', lastVisit: '' };
  }
}

export function recordVisit(): VisitData {
  if (typeof window === 'undefined') {
    return { count: 0, firstVisit: '', lastVisit: '' };
  }

  const now = new Date().toISOString();
  const existing = getVisitData();

  const updated: VisitData = {
    count: existing.count + 1,
    firstVisit: existing.firstVisit || now,
    lastVisit: now,
  };

  localStorage.setItem(VISIT_KEY, JSON.stringify(updated));
  return updated;
}

export function isFirstVisit(): boolean {
  return getVisitData().count === 0;
}

export function shouldShowMilestone(visitCount: number): boolean {
  return visitCount > 1 && visitCount % 5 === 0;
}

// Initialize or get stored data
export function getStoredData(): StoredData {
  if (typeof window === 'undefined') {
    return { sessions: [], version: CURRENT_VERSION };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { sessions: [], version: CURRENT_VERSION };
    }
    const data = JSON.parse(raw) as StoredData;
    return data;
  } catch {
    return { sessions: [], version: CURRENT_VERSION };
  }
}

// Save data
function saveData(data: StoredData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Save a new session
export function saveSession(session: Omit<SessionRecord, 'id' | 'timestamp'>): SessionRecord {
  const data = getStoredData();

  const newSession: SessionRecord = {
    ...session,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  data.sessions.unshift(newSession); // Add to beginning (newest first)

  // Keep only last 100 sessions
  if (data.sessions.length > 100) {
    data.sessions = data.sessions.slice(0, 100);
  }

  saveData(data);
  return newSession;
}

// Get all sessions
export function getSessions(): SessionRecord[] {
  return getStoredData().sessions;
}

// Get sessions with blunders only
export function getBlunderSessions(): SessionRecord[] {
  return getStoredData().sessions.filter(s => s.blunderCount > 0);
}

// Get a specific session by ID
export function getSession(id: string): SessionRecord | undefined {
  return getStoredData().sessions.find(s => s.id === id);
}

// Delete a session
export function deleteSession(id: string): void {
  const data = getStoredData();
  data.sessions = data.sessions.filter(s => s.id !== id);
  saveData(data);
}

// Clear all data
export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// Get stats summary
export function getStats() {
  const sessions = getSessions();

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalMoves: 0,
      avgAccuracy: 0,
      totalBlunders: 0,
      openingStats: {} as Record<string, { played: number; blunders: number; avgScore: number }>,
    };
  }

  const totalMoves = sessions.reduce((sum, s) => sum + s.movesPlayed, 0);
  const totalBlunders = sessions.reduce((sum, s) => sum + s.blunderCount, 0);
  const totalScore = sessions.reduce((sum, s) => sum + s.totalScore, 0);

  // Opening stats
  const openingStats: Record<string, { played: number; blunders: number; totalScore: number }> = {};

  for (const session of sessions) {
    const name = session.openingName || 'Unknown';
    if (!openingStats[name]) {
      openingStats[name] = { played: 0, blunders: 0, totalScore: 0 };
    }
    openingStats[name].played++;
    openingStats[name].blunders += session.blunderCount;
    openingStats[name].totalScore += session.totalScore;
  }

  // Convert to avg score
  const openingStatsWithAvg = Object.fromEntries(
    Object.entries(openingStats).map(([name, stats]) => [
      name,
      {
        played: stats.played,
        blunders: stats.blunders,
        avgScore: Math.round(stats.totalScore / stats.played),
      },
    ])
  );

  return {
    totalSessions: sessions.length,
    totalMoves,
    avgAccuracy: totalMoves > 0 ? Math.round((1 - totalBlunders / totalMoves) * 100) : 0,
    totalBlunders,
    openingStats: openingStatsWithAvg,
  };
}

// ============ BLUNDER TRACKING ============

function getBlunderData(): BlunderData {
  if (typeof window === 'undefined') {
    return { blunders: [], version: CURRENT_VERSION };
  }

  try {
    const raw = localStorage.getItem(BLUNDER_KEY);
    if (!raw) {
      return { blunders: [], version: CURRENT_VERSION };
    }
    return JSON.parse(raw) as BlunderData;
  } catch {
    return { blunders: [], version: CURRENT_VERSION };
  }
}

function saveBlunderData(data: BlunderData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BLUNDER_KEY, JSON.stringify(data));
}

// Record a blunder (or increment if same position seen before)
export function recordBlunder(
  fen: string,
  blunderMove: string,
  openingName: string,
  playerColor: 'white' | 'black',
  ratingLevel: number
): BlunderRecord {
  const data = getBlunderData();
  const now = new Date().toISOString();

  // Check if we already have this position (normalize FEN - remove move counters)
  const normalizedFen = fen.split(' ').slice(0, 4).join(' ');
  const existing = data.blunders.find(b =>
    b.fen.split(' ').slice(0, 4).join(' ') === normalizedFen &&
    b.playerColor === playerColor
  );

  if (existing) {
    existing.timesBlundered++;
    existing.timesSeen++;
    existing.lastTested = now;
    // Update if different blunder move at same position
    if (existing.blunderMove !== blunderMove) {
      existing.blunderMove = blunderMove; // Track most recent
    }
    saveBlunderData(data);
    return existing;
  }

  // New blunder
  const newBlunder: BlunderRecord = {
    id: generateId(),
    fen,
    blunderMove,
    openingName,
    playerColor,
    ratingLevel,
    firstSeen: now,
    lastTested: now,
    timesSeen: 1,
    timesFixed: 0,
    timesBlundered: 1,
  };

  data.blunders.unshift(newBlunder);

  // Keep max 200 blunders
  if (data.blunders.length > 200) {
    data.blunders = data.blunders.slice(0, 200);
  }

  saveBlunderData(data);
  return newBlunder;
}

// Mark a blunder as fixed (player got it right in test mode)
export function markBlunderFixed(blunderId: string): void {
  const data = getBlunderData();
  const blunder = data.blunders.find(b => b.id === blunderId);
  if (blunder) {
    blunder.timesFixed++;
    blunder.timesSeen++;
    blunder.lastTested = new Date().toISOString();
    saveBlunderData(data);
  }
}

// Mark a blunder as repeated (player blundered again in test mode)
export function markBlunderRepeated(blunderId: string): void {
  const data = getBlunderData();
  const blunder = data.blunders.find(b => b.id === blunderId);
  if (blunder) {
    blunder.timesBlundered++;
    blunder.timesSeen++;
    blunder.lastTested = new Date().toISOString();
    saveBlunderData(data);
  }
}

// Get all blunders for testing
export function getBlunders(): BlunderRecord[] {
  return getBlunderData().blunders;
}

// Get blunders that need practice (sorted by priority)
// Priority: recently blundered > low fix rate > not tested recently
export function getBlundersForPractice(playerColor?: 'white' | 'black'): BlunderRecord[] {
  let blunders = getBlunderData().blunders;

  if (playerColor) {
    blunders = blunders.filter(b => b.playerColor === playerColor);
  }

  // Sort by priority score (higher = needs more practice)
  return blunders.sort((a, b) => {
    const aFixRate = a.timesSeen > 0 ? a.timesFixed / a.timesSeen : 0;
    const bFixRate = b.timesSeen > 0 ? b.timesFixed / b.timesSeen : 0;

    // Unfixed blunders first
    if (aFixRate === 0 && bFixRate > 0) return -1;
    if (bFixRate === 0 && aFixRate > 0) return 1;

    // Then by fix rate (lower = needs practice)
    if (aFixRate !== bFixRate) return aFixRate - bFixRate;

    // Then by recency (more recent = more urgent)
    return new Date(b.lastTested).getTime() - new Date(a.lastTested).getTime();
  });
}

// Get blunder stats
export function getBlunderStats() {
  const blunders = getBlunders();
  const totalBlunders = blunders.length;
  const fixed = blunders.filter(b => b.timesFixed > b.timesBlundered).length;
  const needsPractice = blunders.filter(b => b.timesFixed <= b.timesBlundered).length;

  return {
    total: totalBlunders,
    fixed,
    needsPractice,
    fixRate: totalBlunders > 0 ? Math.round((fixed / totalBlunders) * 100) : 0,
  };
}

// Delete a blunder
export function deleteBlunder(id: string): void {
  const data = getBlunderData();
  data.blunders = data.blunders.filter(b => b.id !== id);
  saveBlunderData(data);
}
