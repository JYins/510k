# 510K — Classic Card Game

> I built this to digitize a card game my friends and I play at gatherings.  
> We always play 510K, but someone forgets the rules or miscounts points.  
> So I made a web version — play anytime, anywhere.

## About the Game

**510K** is a 2–4 player card game using a standard 54-card deck (including jokers).

### Core Rules

1. Each player is dealt 5 cards
2. The player with the smallest card leads first
3. Others take turns clockwise: play or pass
4. When everyone passes, the highest play wins the trick
5. Zero-point tricks trigger a refill to 5 cards; when the deck is empty, the game ends

### Point Cards

| Card | Points |
|------|--------|
| 5    | 5      |
| 10   | 10     |
| K    | 10     |

### Card Ranking

`4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2 < 3 < Small Joker < Big Joker`

Suits (for tie-breaking): ♠ Spades > ♥ Hearts > ♣ Clubs > ♦ Diamonds

### Valid Play Types

Single / Pair / Triple / Triple+Single / Triple+Pair / Straight (5+) / Bomb (four of a kind) / Joker Bomb

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion
- **Backend**: Firebase Cloud Functions (v2)
- **Database**: Cloud Firestore (real-time sync)
- **Auth**: Firebase Auth (Email/Password, Google Sign-In)
- **Deployment**: Vercel (frontend) + Firebase (backend)

## Project Structure

```
510k/
├── apps/web/          # Next.js frontend
├── functions/        # Firebase Cloud Functions
├── shared/           # Shared game logic (hand analysis, etc.)
├── firebase.json     # Firebase config
└── package.json      # Monorepo root
```

## Local Development

```bash
# Install dependencies
npm install

# Build shared module
npm run build:shared

# Start frontend dev server
npm run dev:web

# Build Cloud Functions
npm run build:functions
```

## Deployment

Frontend deploys to Vercel; backend to Firebase:

```bash
# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

---

*Dedicated to yp — but losing still means you have to do a dare.*
