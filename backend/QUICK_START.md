# 510K Backend - Quick Start Guide

## Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project created at https://console.firebase.google.com

## Setup (5 minutes)

```bash
# 1. Navigate to backend folder
cd /Users/yinshi/Documents/510k/backend

# 2. Install dependencies
npm install

# 3. Login to Firebase
firebase login

# 4. Initialize Firebase (select Functions and Firestore)
firebase init

# 5. Set your project ID
cp .firebaserc.example .firebaserc
# Edit .firebaserc and add your project ID
```

## Development

```bash
# Start emulators (Firestore + Functions)
npm run serve

# In another terminal, interactive function shell
firebase functions:shell

# Test in shell:
createRoom({displayName: "Test"})
```

## Deploy

```bash
# Deploy everything
npm run deploy

# Or deploy individually:
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## Frontend Connection

```typescript
// Initialize Firebase in your Next.js app
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);

// Use emulators in dev
if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Subscribe to game state
const roomRef = doc(db, 'rooms', roomId);
onSnapshot(roomRef, (doc) => {
  console.log('Room updated:', doc.data());
});

// Call functions
const createRoom = httpsCallable(functions, 'createRoom');
const { data } = await createRoom({ displayName: "Player" });
```

## API Quick Reference

```typescript
// Create room
const { roomId } = await createRoom({ displayName, maxPlayers: 4 });

// Join room
await joinRoom({ roomId, displayName });

// Start game (host only)
await startGame({ roomId });

// Play cards (indices in your hand)
await playCards({ roomId, cardIndices: [0, 1, 2] });

// Pass turn
await passTurn({ roomId });

// Get full state
const { room, myHand } = await getGameState({ roomId });
```

## Firestore Paths

| Path | Access | Contents |
|------|--------|----------|
| `rooms/{id}` | All players | Public game state |
| `rooms/{id}/players/{pid}` | All players | Player public info |
| `roomPrivate/{id}/hands/{pid}` | Owner only | Player's cards |
| `rooms/{id}/moves/{id}` | All players | Action history |

## Common Issues

**"Cannot read property of undefined"**
- Make sure you're authenticated: `signInAnonymously(auth)`

**"Permission denied"**
- Check Firestore rules are deployed: `firebase deploy --only firestore:rules`

**"Not your turn"**
- Verify `room.gameState.currentTurnPlayerId` matches `auth.currentUser.uid`

**Functions timeout**
- Check Firestore indexes are created (see firestore.indexes.json)

## Testing Checklist

- [ ] Create room
- [ ] Join with 2nd player
- [ ] Start game
- [ ] First player can play
- [ ] Other players can beat or pass
- [ ] Trick ends when all pass
- [ ] Points awarded correctly
- [ ] Refill happens after 0-point tricks
- [ ] Game ends when player runs out of cards
- [ ] Auto-settle works when deck empty
- [ ] Players can leave/reconnect

## Next Steps

1. Build your Next.js frontend (see CLIENT_INTEGRATION.md)
2. Add card UI components
3. Implement turn indicators
4. Add animations for plays
5. Test with real players

---

**Ready!** Your backend is complete and ready for the frontend.
