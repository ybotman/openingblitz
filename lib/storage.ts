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
const CURRENT_VERSION = 1;

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
