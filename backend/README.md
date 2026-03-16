# 510K Game Engine

Server-authoritative multiplayer card game backend for 510K (五十K).

## Quick Start

```bash
# Install dependencies
npm install

# Set up Firebase (requires Firebase CLI)
npm install -g firebase-tools
firebase login
firebase init

# Build
npm run build

# Run locally
npm run serve

# Deploy
npm run deploy
```

## Project Structure

```
src/
├── types/
│   └── index.ts          # All TypeScript interfaces
├── engine/
│   ├── cards.ts          # Card utilities, deck management
│   ├── patterns.ts       # Pattern recognition & validation
│   └── gameLogic.ts      # Core game state transitions
├── functions/
│   ├── room.ts           # Room management functions
│   ├── game.ts           # Game action functions
│   ├── triggers.ts       # Firestore triggers
│   └── scheduler.ts      # Scheduled cleanup
└── index.ts              # Entry point
```

## Game Rules Summary

- **Players**: 2-4
- **Deck**: 54 cards (standard + 2 jokers)
- **Rank order**: 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2 < 3 < small joker < big joker
- **Suit order**: spade > heart > club > diamond
- **Point cards**: 5 (5 pts), 10 (10 pts), K (10 pts)
- **Initial deal**: 5 cards per player
- **Valid patterns**: single, pair, triplet, triplet+single, triplet+pair, straight (5+), consecutive pairs (3+ pairs), airplane (2+ triplets), bomb (4 of a kind), joker bomb
- **Refill**: After 0-point tricks, refill to 5 cards

## API Reference

### createRoom
```typescript
const result = await createRoom({
  displayName: "Player Name",
  maxPlayers: 4  // optional, default 4
});
// Returns: { roomId: string, playerId: string }
```

### joinRoom
```typescript
await joinRoom({
  roomId: "room-id",
  displayName: "Player Name"
});
```

### startGame
```typescript
await startGame({ roomId: "room-id" });
// Only callable by room host
```

### playCards
```typescript
await playCards({
  roomId: "room-id",
  cardIndices: [0, 1, 2]  // indices in player's hand
});
```

### passTurn
```typescript
await passTurn({ roomId: "room-id" });
// Cannot pass if you're the trick leader
```

### getGameState
```typescript
const { data } = await getGameState({ roomId: "room-id" });
// Returns: { room, myHand, myPlayerId }
```

## Firestore Schema

### rooms/{roomId} (Public)
```typescript
{
  id: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'ended';
  players: PlayerPublic[];
  gameState?: GameState;
  result?: GameResult;
}
```

### roomPrivate/{roomId} (Server-only)
```typescript
{
  deck: Card[];
  hands: Record<string, Card[]>;
  moveHistory: GameMove[];
  processingAction: boolean;
}
```

### roomPrivate/{roomId}/hands/{playerId} (Private)
```typescript
{
  playerId: string;
  hand: Card[];
}
// Only readable by playerId
```

## Security Rules

```javascript
// rooms - readable by players, writable only by functions
match /rooms/{roomId} {
  allow read: if isRoomPlayer(roomId);
  allow write: if false;
}

// player hands - only readable by owner
match /roomPrivate/{roomId}/hands/{playerId} {
  allow read: if request.auth.uid == playerId;
  allow write: if false;
}
```

## Frontend Integration Example

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);
const auth = getAuth(app);

// Auth
await signInAnonymously(auth);

// Create room
const createRoom = httpsCallable(functions, 'createRoom');
const { data } = await createRoom({ displayName: "MyName" });
const roomId = data.roomId;

// Subscribe to room updates
const roomRef = doc(db, 'rooms', roomId);
const unsubscribe = onSnapshot(roomRef, (snapshot) => {
  const room = snapshot.data();
  renderGame(room);
});

// Get my hand
const getGameState = httpsCallable(functions, 'getGameState');
const { data: gameState } = await getGameState({ roomId });
renderHand(gameState.myHand);

// Play cards
const playCards = httpsCallable(functions, 'playCards');
await playCards({ roomId, cardIndices: [0, 1] });
```

## Environment Variables

Create `.env` for local development:

```bash
# Firebase config (usually in firebase config, not env)
# Emulator settings
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

## Testing

```bash
# Start emulators
firebase emulators:start

# Interactive shell
firebase functions:shell

# Run in shell:
createRoom({ displayName: "Test" })
```

## Troubleshooting

**"Not your turn" error**
- Check room.gameState.currentTurnPlayerId matches auth.uid

**"Invalid play" error**
- Verify card indices are valid
- Check that cards form a valid pattern
- Ensure play can beat current trick

**Race condition errors**
- Client should wait for function response before next action
- Server locks processing during action handling

## License

MIT
