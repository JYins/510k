# Play Here

[https://510k.vercel.app/](https://510k.vercel.app/)

# 510K

> [中文说明](README.zh-CN.md)
>
> I made this because 510K is one of those games that feels alive when friends sit around the table.
> Someone remembers the rules a little differently, someone counts points too fast, someone says "wait wait that should beat it".
> I love that chaos, so I wanted to keep the feeling and make it easier to play online.

510K is a web version of the card game my friends and I really play in real life.
It is built for small group games, fast room sharing, simple rules lookup, and that "one more round" energy.

## What This Project Has

- Real-time online rooms for 2 to 4 players
- Clean mobile-first game UI
- Firebase login with email/password and Google
- Live scoreboard
- Rules page in Chinese and English
- Server-side game validation
- Bot players for filling empty seats when you just want to start

## About the Game

510K uses one 54-card deck, including two jokers.

- Each player starts with 5 cards
- The player with the smallest card leads first
- Players take turns clockwise
- You either beat the current play or pass
- The trick winner takes the points in that trick
- While the deck still has cards, players refill back toward 5 cards
- Final settlement only starts after the deck is empty

### Point Cards

| Card | Points |
|---|---|
| 5 | 5 |
| 10 | 10 |
| K | 10 |

### Rank Order

`4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2 < 3 < Small Joker < Big Joker`

Suit order for tie-break:
`Spades > Hearts > Clubs > Diamonds`

### Supported Play Types

- Single
- Pair
- Triple
- Triple + Single
- Triple + Pair
- Straight
- Bomb
- Joker Bomb

## New Features

- The rules page is now cleaner and more consistent in both Chinese and English
- The rules text matches the actual game logic better, so players do not get confused
- Hosts can add Bot players in the lobby to fill open seats
- Bot turns run on the server, so the game can continue without keeping one browser page alive

## Tech Stack

- Frontend: Next.js 14, React, Tailwind CSS, Framer Motion
- Backend: Firebase Cloud Functions v2
- Database: Cloud Firestore
- Auth: Firebase Auth
- Shared logic: TypeScript package in `shared/`
- Deploy: Vercel + Firebase

## Project Structure

```text
510k/
├── apps/web/      # Next.js app
├── functions/     # Firebase Cloud Functions
├── shared/        # Shared card rules and helpers
├── firebase.json
└── package.json
```

## Local Development

```bash
npm install
npm run build:shared
npm run dev:web
npm run build:functions
```

## Deploy

```bash
firebase deploy --only functions
firebase deploy --only firestore:rules
```

Dedicated to my friends. I will always love you all.
