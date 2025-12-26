# OpeningBlitz.com - Claude Guidelines

## Project Overview
Ultra-fast chess opening speed trainer with competitive ranking.
Target: Non-expert players (800-1600) who want arcade-style drilling.

## Autonomous Operation Mode

**Default Mode = DO IT**

When working on this project:
1. **Be Autonomous** - Execute without asking permission on clear tasks
2. **Move fast** - Don't wait for approval on straightforward work
3. **Commit when ready** - Auto-commit with descriptive messages when work is complete

**Only stop and ask when:**
- Confidence < 70% on how to proceed
- Multiple viable architectural paths exist
- User says "STOP" or "WAIT"
- About to make a major design decision with significant implications

**If task is clear -> DO IT**
**If implementation is obvious -> DO IT**
**If fix is straightforward -> DO IT**

## Tech Stack
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- chess.js (move validation)
- react-chessboard (board UI)
- Lichess Opening Explorer API (opening data)

## Data Source
Lichess Opening Explorer API: `https://explorer.lichess.ovh/lichess`
- Free, no auth required
- Filter by rating range (800, 1000, 1200, 1400, 1600)
- Returns move stats, win rates, opening names

## Core Concept
- Speed drilling (10-30 second rounds)
- Blunder-focused ("don't hang pieces" not "find GM move")
- Rating-appropriate (different acceptable moves per level)
- Arcade feel with scoring and streaks

## File Structure
```
poc/
├── app/                 # Next.js app routes
│   ├── page.tsx        # Main drill page
│   └── layout.tsx      # Root layout
├── components/         # React components
│   ├── Chessboard.tsx  # Board wrapper
│   ├── Timer.tsx       # Countdown timer
│   └── Score.tsx       # Score display
├── lib/                # Core logic
│   ├── lichess.ts      # API client
│   ├── openings.ts     # Opening data/logic
│   └── types.ts        # TypeScript types
└── data/               # Static data (if needed)
```

## Success Criteria
- Fast, responsive UI (no lag)
- Works on mobile (touch/drag)
- Fun arcade feel
- Clear feedback on moves (good/ok/blunder)
