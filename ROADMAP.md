# OpeningBlitz - Product Roadmap

## Vision
Track player performance by opening, show strengths/weaknesses, rank openings from best to worst, all with a **local-first** approach that syncs when desired.

---

## Phase 1: Local Storage (Current + Next)
**Goal**: Store everything in browser, no backend needed.

### Data to Store Locally
```typescript
interface LocalStats {
  sessions: SessionRecord[];
  openingStats: Record<string, OpeningPerformance>;
  lastSyncedAt?: string;
}

interface SessionRecord {
  id: string;
  timestamp: string;
  ratingLevel: number;
  playerColor: 'white' | 'black';
  timeLimit: number;
  totalScore: number;
  movesPlayed: number;
  moves: { move: string; rating: MoveRating; opening: string; fen: string }[];
}

interface OpeningPerformance {
  openingName: string;
  eco: string;
  timesPlayed: number;
  totalMoves: number;
  bestMoves: number;
  goodMoves: number;
  okMoves: number;
  blunders: number;
  avgScore: number;
  lastPlayed: string;
}
```

### Features
- [x] Basic drill game
- [ ] Save session to localStorage after each game
- [ ] "My Stats" page showing:
  - Total sessions played
  - Opening rankings (best → worst → unplayed)
  - Weak spots (positions where you blunder most)
- [ ] Export stats as JSON (manual backup)

### Tech
- `localStorage` for persistence
- No login required
- Works offline

---

## Phase 2: Optional Cloud Sync
**Goal**: Let users sync across devices without forced login.

### Approach: Anonymous + Claimable Accounts
1. Generate a random user ID on first visit
2. Store ID in localStorage
3. "Sync" button uploads stats to cloud with that ID
4. User can optionally "claim" account with email (no password - magic link)
5. If they log in on another device, data merges

### Backend Options (Cost Analysis)

| Option | Free Tier | Pros | Cons |
|--------|-----------|------|------|
| **Supabase** | 500MB DB, 1GB storage, 2GB bandwidth | Postgres, Auth built-in, generous | Vendor lock-in |
| **PlanetScale** | 1 billion row reads/mo, 10M writes | MySQL, branching, serverless | Hobby tier discontinued? |
| **Turso (libSQL)** | 9GB storage, 500 DBs | SQLite-based, edge, cheap | Newer, less ecosystem |
| **Azure Cosmos DB** | 1000 RU/s, 25GB | Global, flexible | Complex pricing |
| **Cloudflare D1** | 5GB, 5M reads/day | SQLite, edge, dirt cheap | Beta-ish |
| **Firebase/Firestore** | 1GB storage, 50K reads/day | Easy auth | Costs spike unpredictably |

### Recommendation: **Supabase** or **Turso**
- Supabase: Best if you want easy auth + Postgres
- Turso: Best if you want SQLite simplicity + edge performance

### Sync Strategy
```
Local (source of truth) ←→ Cloud (backup + cross-device)

On "Sync" click:
1. Pull cloud data for this user ID
2. Merge with local (local wins on conflict, or latest timestamp wins)
3. Push merged data to cloud
4. Update lastSyncedAt
```

---

## Phase 3: Full Accounts (Later)
**Goal**: Social features, leaderboards, opening recommendations.

### Features
- Email/Google login via Supabase Auth
- Global leaderboards by opening
- "Recommended openings" based on your weak spots
- Share your opening report card
- Compare with friends

### Database Schema (Supabase/Postgres)
```sql
-- Users (handled by Supabase Auth)

-- Opening Stats per User
CREATE TABLE user_opening_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  opening_name TEXT NOT NULL,
  eco TEXT,
  times_played INT DEFAULT 0,
  total_moves INT DEFAULT 0,
  best_moves INT DEFAULT 0,
  good_moves INT DEFAULT 0,
  ok_moves INT DEFAULT 0,
  blunders INT DEFAULT 0,
  avg_score FLOAT DEFAULT 0,
  last_played TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, opening_name)
);

-- Session History
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  rating_level INT,
  player_color TEXT,
  time_limit INT,
  total_score INT,
  moves_played INT,
  moves JSONB, -- array of move records
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_opening ON user_opening_stats(user_id, opening_name);
CREATE INDEX idx_sessions_user ON sessions(user_id, played_at DESC);
```

---

## Phase Summary

| Phase | Auth | Storage | Sync | Effort |
|-------|------|---------|------|--------|
| 1 | None | localStorage | None | 1-2 days |
| 2 | Anonymous ID | localStorage + Supabase | Manual button | 3-5 days |
| 3 | Email/OAuth | Supabase | Auto | 1-2 weeks |

---

## Immediate Next Steps (Phase 1)

1. **Create `lib/storage.ts`** - localStorage wrapper
2. **Save session on game end** - write to localStorage
3. **Build "My Stats" page** - `/stats` route
4. **Opening rankings component** - sorted table with performance

---

## Cost Projection

**Phase 1**: $0 (all local)

**Phase 2**: $0-5/mo
- Supabase free tier handles ~10K monthly active users easily
- Only pay if you exceed free tier

**Phase 3**: $5-25/mo
- Depends on traffic
- Supabase Pro is $25/mo if needed

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  DrillGame  │→ │ localStorage│→ │ Stats Page          │  │
│  │  Component  │  │ (sessions,  │  │ (opening rankings,  │  │
│  │             │  │  openings)  │  │  weak spots)        │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────┘  │
│                          │                                   │
│                    [SYNC BUTTON]                             │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   SUPABASE (Phase 2+)  │
              │  ┌──────────────────┐  │
              │  │ user_opening_stats│  │
              │  │ sessions          │  │
              │  │ (Postgres)        │  │
              │  └──────────────────┘  │
              │  ┌──────────────────┐  │
              │  │ Auth (Phase 3)   │  │
              │  │ (magic link/OAuth)│ │
              │  └──────────────────┘  │
              └────────────────────────┘
```

---

*Last updated: December 2024*
