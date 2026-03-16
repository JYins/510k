# 510K Game Engine - Architecture Documentation

## Overview

This is a **server-authoritative** multiplayer card game backend using Firebase. The frontend is never trusted for game rules - all validation happens in Cloud Functions.

## Tech Stack

- **Firebase Firestore**: Real-time state synchronization
- **Firebase Auth**: Anonymous authentication
- **Firebase Cloud Functions**: Game logic and validation
- **TypeScript**: Type-safe implementation

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
│  - Can ONLY read public room state                              │
│  - Can ONLY read their own hand (via function/getGameState)     │
│  - Sends actions via callable functions                         │
│  - NEVER trusted for game logic                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUD FUNCTIONS                             │
│  - Validate all actions                                         │
│  - Enforce game rules                                           │
│  - Manage private state                                         │
│  - Handle race conditions                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FIRESTORE                                   │
│  rooms/{roomId}        → Public game state                      │
│  roomPrivate/{roomId}  → Server-only state (deck, hands)        │
│  roomPrivate/{roomId}/hands/{playerId} → Player's private hand  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model

### Public State: `rooms/{roomId}`

```typescript
{
  id: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'ended';
  players: PlayerPublic[];
  gameState?: {
    currentTurnPlayerId: string;
    currentTrick: CurrentTrick;
    cardsInDeck: number;  // Only count, not actual cards
    roundNumber: number;
  };
  result?: {
    winnerId: string;
    finalScores: Record<string, number>;
    reason: 'normal' | 'auto-settle' | 'player-left';
  };
}
```

### Private State: `roomPrivate/{roomId}`

```typescript
{
  roomId: string;
  deck: Card[];           // Actual cards remaining
  hands: Record<string, Card[]>;  // All player hands
  moveHistory: GameMove[];  // Audit log
  processingAction: boolean;  // Race condition lock
}
```

### Player Hand: `roomPrivate/{roomId}/hands/{playerId}`

```typescript
{
  playerId: string;
  hand: Card[];  // Only readable by playerId
  updatedAt: Timestamp;
}
```

## Firestore Security Rules

```javascript
// Clients can only read their own hand
match /roomPrivate/{roomId}/hands/{playerId} {
  allow read: if request.auth.uid == playerId;
  allow write: if false;  // Server only
}

// All game mutations go through functions
match /rooms/{roomId} {
  allow read: if isRoomPlayer(roomId);
  allow write: if false;  // Functions only
}
```

## API Surface (Callable Functions)

### Room Management

| Function | Description |
|----------|-------------|
| `createRoom` | Create new room, become host |
| `joinRoom` | Join existing waiting room |
| `leaveRoom` | Leave room (ends game if playing) |
| `startGame` | Host starts game (2-4 players) |

### Game Actions

| Function | Description |
|----------|-------------|
| `playCards` | Play cards from hand |
| `passTurn` | Pass on current trick |
| `getGameState` | Get full state + player's hand |
| `debugGameState` | Host-only debug view |

## Game Loop

```
START
  │
  ▼
┌──────────────┐
│ createRoom   │
│ joinRoom     │
└──────────────┘
  │
  ▼
┌──────────────┐     ┌──────────────┐
│ startGame    │────▶│ Deal 5 cards │
└──────────────┘     │ to each      │
                     │ player       │
                     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Find lowest  │
                    │ card holder  │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ START TRICK  │◀──────────┐
                    │ Leader plays │           │
                    └──────────────┘           │
                           │                   │
                           ▼                   │
                    ┌──────────────┐           │
                    │ Next player  │           │
                    │ - Play cards │           │
                    │ - Pass       │           │
                    └──────────────┘           │
                           │                   │
              ┌────────────┴────────────┐      │
              ▼                         ▼      │
        ┌──────────┐              ┌──────────┐│
        │ Played   │              │ Passed   ││
        │ Valid?   │              │ Everyone ││
        └──────────┘              │ else?    ││
              │                   └──────────┘│
         Yes / No                      │Yes   │
             /                         ▼      │
            ▼                   ┌──────────┐  │
    ┌──────────────┐            │ Trick    │  │
    │ Apply play   │            │ ends     │  │
    │ Check winner │            │ Winner   │  │
    └──────────────┘            │ takes    │  │
                                │ points   │  │
                                └──────────┘  │
                                      │       │
                         ┌────────────┴───────┘
                         ▼
                   ┌──────────┐
                   │ Check:   │
                   │ - Refill?│
                   │ - Game   │
                   │   ended? │
                   └──────────┘
```

## Race Condition Prevention

The system uses a `processingAction` flag in the private state:

```typescript
// Before processing any action:
if (privateState.processingAction) {
  throw new Error('Server is processing another action');
}

// Lock during processing
transaction.update(privateRef, { processingAction: true });

// ... process action ...

// Unlock when done
transaction.update(privateRef, { processingAction: false });
```

This ensures only one action is processed at a time per room.

## Anti-Cheat Measures

1. **Client never sees other players' hands**
   - Hands stored in private collection
   - Security rules enforce playerId matching

2. **All mutations through functions**
   - Direct writes to rooms collection blocked by rules
   - Functions validate all game logic

3. **Transaction-based updates**
   - All state changes in Firestore transactions
   - Prevents partial updates

4. **Pattern validation server-side**
   - Client sends card indices only
   - Server validates:
     - Indices are valid for player's hand
     - Cards form valid pattern
     - Play can beat current
     - It's actually the player's turn

5. **Audit log**
   - Every move recorded in moveHistory
   - Can reconstruct game state for disputes

## Deployment

```bash
# Install dependencies
npm install

# Build
npm run build

# Local development
npm run serve

# Deploy
npm run deploy
```

## Frontend Integration

```typescript
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);

// Connect to room
const roomRef = doc(db, 'rooms', roomId);
onSnapshot(roomRef, (snapshot) => {
  const room = snapshot.data();
  updateUI(room);
});

// Get private hand
const getGameState = httpsCallable(functions, 'getGameState');
const { data } = await getGameState({ roomId });
setMyHand(data.myHand);

// Play cards
const playCards = httpsCallable(functions, 'playCards');
await playCards({ roomId, cardIndices: [0, 1, 2] });
```

## Error Handling

All functions return structured errors:

```typescript
// Game logic errors
throw new functions.https.HttpsError('failed-precondition', 'Not your turn');

// Authentication errors
throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

// Not found
throw new functions.https.HttpsError('not-found', 'Room does not exist');
```

## Testing

```bash
# Run emulator suite
firebase emulators:start

# Test functions
firebase functions:shell

# Call from shell
createRoom({ displayName: "Test" })
```

## Cost Optimization

1. **Regional deployment**: Use us-central1 for lower latency
2. **Firestore reads**: Use `onSnapshot` with careful unsubscribing
3. **Function calls**: Batch client updates where possible
4. **Cleanup**: Scheduled function removes old games daily

## Future Enhancements

- [ ] Rate limiting per player
- [ ] Reconnection handling with timeout
- [ ] Spectator mode
- [ ] Game replay from moveHistory
- [ ] Tournament mode
- [ ] AI opponents
