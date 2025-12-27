# OpeningBlitz Deep Dive Review

## The Vision

**How deep and fast can you go without blundering?**

OpeningBlitz is a speed test for opening knowledge. The goal isn't to memorize lines - it's to build instincts fast enough that you don't have to think. The timer measures YOUR thinking time only (not API/computer time). The challenge is: with 30 seconds of your own decision time, how many solid moves can you make before either:
1. You run out of time
2. You leave the opening book
3. You blunder

Blunders are tracked and can be re-tested to fix weaknesses.

---

## What's Been Fixed

### Player-Only Timer
Timer now pauses during:
- Opponent "thinking" (API call)
- Computer move animation

This means 30 seconds = 30 seconds of YOUR decision time. Fair.

### Blunder Tracking System
New `localStorage` storage for blunders:
- Tracks position (FEN), what you played, opening name
- Counts times seen, times fixed, times blundered again
- Priority queue for spaced repetition (worst blunders first)

---

## Blunder Test Mode (Design)

### Concept
A dedicated mode that ONLY tests positions where you previously blundered.

### Flow
1. Select "Blunder Practice" from menu
2. System loads blunder positions (sorted by priority)
3. Board shows the position BEFORE your blunder
4. You have 10 seconds to play a move
5. If you play differently (not the blunder): SUCCESS, mark as fixed
6. If you play the same blunder: FAIL, mark as repeated
7. Show what the blunder was and move to next position

### Priority Algorithm
```
Priority Score = (timesBlundered / timesSeen) * recencyWeight
```
- Never-fixed blunders appear first
- Recently blundered positions appear before old ones
- Positions you've fixed multiple times drop in priority

### UI Elements
- Progress bar: "Fixed 12/47 blunders"
- Streak counter for consecutive fixes
- "You blundered Nf6 here. Good move was d6."

---

## Ranked Recommendations

### TIER 1: Critical (Do Now)
Impact: High | Effort: Low

| # | Issue | Status | Why Critical |
|---|-------|--------|--------------|
| 1 | Timer runs during thinking | FIXED | Unfair to player |
| 2 | Blunder storage | FIXED | Core learning feature |
| 3 | Replay saves as new session | TODO | Corrupts stats |
| 4 | Mobile drag unreliable | PARTIAL | Users can't play |

### TIER 2: Important (This Week)
Impact: High | Effort: Medium

| # | Issue | Why Important |
|---|-------|---------------|
| 5 | Blunder Test Mode UI | Completes the learning loop |
| 6 | Mobile tap-only mode | Reliable touch experience |
| 7 | localStorage quota warning | Prevents data loss |
| 8 | Post-game blunder summary | "Why was that bad?" |

### TIER 3: Polish (Next Week)
Impact: Medium | Effort: Medium

| # | Issue | Why |
|---|-------|-----|
| 9 | Sound effects | Arcade feel, accessibility |
| 10 | Sticky header during play | Mobile scroll issues |
| 11 | Larger touch targets | 44x44px minimum |
| 12 | Opening goals context | "What am I trying to do?" |

### TIER 4: Enhancement (Month)
Impact: Medium | Effort: High

| # | Issue | Why |
|---|-------|-----|
| 13 | Pattern grouping | "You struggle with Sicilians" |
| 14 | Progress visualization | Graphs, trends |
| 15 | Daily challenges | Return habit |
| 16 | Enhanced combo system | More fun |

### TIER 5: Future (Backlog)
Impact: Variable | Effort: High

| # | Issue | Notes |
|---|-------|-------|
| 17 | Accounts/sync | Requires backend |
| 18 | Leaderboards | Requires accounts |
| 19 | Transposition normalization | Complex FEN handling |
| 20 | Architecture refactor | DrillGame too big |

---

## Technical Debt

### Quick Fixes Remaining

```typescript
// DrillGame.tsx:350 - Don't save replay sessions
if (!isReplayMode) {
  saveSession({...});
}

// ChessBoard.tsx - Memoize Chess instance
const gameInstance = useMemo(() => new Chess(fen), [fen]);

// MoveHistory.tsx:30 - Fix accuracy formula
// Current: arbitrary weighting
// Better: (score / maxPossibleScore) * 100
```

### Mobile-Specific Fixes

1. **Tap-only on small screens**
```tsx
const isMobile = typeof window !== 'undefined' &&
  window.matchMedia('(max-width: 640px)').matches;
// In ChessBoard: allowDragging: !disabled && !isMobile
```

2. **Larger sliders**
```tsx
// Current: h-3 (12px)
// Better: h-6 (24px) with larger thumb
```

3. **Sticky header**
```tsx
<header className="sticky top-0 z-50 ...">
```

---

## Session Storage Optimization

Current: Each move stores full FEN (~80 chars)
Better: Store moves as SAN list, reconstruct FEN when needed

```typescript
// Before: 20 moves = ~1.5KB
moves: [{ fen: "rnbqkbnr/...", move: "e4", ... }, ...]

// After: 20 moves = ~200 bytes
moveList: "e4 e5 Nf3 Nc6 Bb5 a6",
startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
```

---

## Learning Loop (Complete Picture)

```
┌─────────────────────────────────────────────────┐
│                PLAY MODE                        │
│  Speed drill → Blunders recorded automatically  │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│              BLUNDER REVIEW                     │
│  See past blunders → Replay specific sessions   │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│              BLUNDER TEST MODE                  │
│  Practice blunder positions → Track fix rate   │
│  Spaced repetition → Worst blunders first      │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│              MASTERY                            │
│  Fix rate improves → Deeper opening knowledge  │
│  Faster instincts → Better games               │
└─────────────────────────────────────────────────┘
```

---

## Metrics That Matter

### For the Player
- **Depth**: Average moves before out-of-book
- **Speed**: Moves per second (excluding computer time)
- **Accuracy**: % non-blunder moves
- **Fix Rate**: % of blunder positions now fixed

### For the Product
- **Sessions per visit**: Engagement
- **Return rate**: Stickiness
- **Blunder test usage**: Learning loop completion
- **Depth trend**: Are users improving?

---

## Sound Design (When Ready)

| Event | Sound | Feel |
|-------|-------|------|
| Piece place | Soft click | Satisfying |
| Best move | Bright chime | Reward |
| Good move | Soft ping | Acknowledgment |
| OK move | None | Neutral |
| Blunder | Low buzz | Warning |
| Streak 3+ | Power-up | Momentum |
| Timer <10s | Tick | Urgency |
| Timer <5s | Fast tick | Pressure |
| Game over | Whoosh | Finality |

---

## Implementation Order

### Week 1 (Core Loop)
1. ~~Fix player-only timer~~ DONE
2. ~~Add blunder storage~~ DONE
3. Fix replay session saving
4. Build Blunder Test Mode UI

### Week 2 (Mobile)
5. Mobile tap-only detection
6. Larger touch targets
7. Sticky header
8. localStorage quota check

### Week 3 (Learning)
9. Post-game blunder explanation
10. Opening principle summaries
11. Blunder position context ("This was in the Sicilian")

### Week 4 (Polish)
12. Sound effects
13. Enhanced streaks/combos
14. Progress visualization
15. Daily challenges

---

*Review updated: December 2024*
*Timer fix and blunder storage: Implemented*
*Blunder Test Mode: Designed, ready to build*
