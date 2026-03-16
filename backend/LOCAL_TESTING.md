# 本地测试指南

## ✅ 当前状态

**Emulator 运行中:**
- 🔥 Firestore: http://localhost:8080
- ⚡ Functions: http://localhost:5001
- 🖥️ 管理界面: http://localhost:4000

## 前端连接配置

在你的 Next.js 前端项目中添加:

```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "fake-api-key-for-emulator",
  authDomain: "kkkpoker510.firebaseapp.com",
  projectId: "kkkpoker510",
  storageBucket: "kkkpoker510.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const auth = getAuth(app);

// 连接到本地 Emulator
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  // Auth emulator (可选)
  // connectAuthEmulator(auth, 'http://localhost:9099');
}

// 匿名登录
export async function ensureAuth() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser!;
}
```

## 测试流程

```typescript
// 1. 创建房间
const createRoom = httpsCallable(functions, 'createRoom');
const { data } = await createRoom({ displayName: "玩家1" });
const roomId = data.roomId;
console.log("房间ID:", roomId);

// 2. 监听房间状态
import { doc, onSnapshot } from 'firebase/firestore';
const roomRef = doc(db, 'rooms', roomId);
onSnapshot(roomRef, (snapshot) => {
  console.log("房间更新:", snapshot.data());
});

// 3. 获取我的手牌
const getGameState = httpsCallable(functions, 'getGameState');
const { data: gameState } = await getGameState({ roomId });
console.log("我的手牌:", gameState.myHand);

// 4. 出牌
const playCards = httpsCallable(functions, 'playCards');
await playCards({ roomId, cardIndices: [0, 1] }); // 出前两张牌

// 5. 过牌
const passTurn = httpsCallable(functions, 'passTurn');
await passTurn({ roomId });
```

## 多玩家测试

在浏览器控制台模拟第二个玩家:

```javascript
// 打开两个浏览器窗口
// 窗口1: 创建房间的玩家
// 窗口2: 加入房间的玩家

// 窗口2执行:
const joinRoom = httpsCallable(functions, 'joinRoom');
await joinRoom({ roomId: "房间ID", displayName: "玩家2" });
```

## API 端点列表

| 功能 | HTTP Endpoint |
|------|---------------|
| createRoom | `POST http://localhost:5001/kkkpoker510/us-central1/createRoom` |
| joinRoom | `POST http://localhost:5001/kkkpoker510/us-central1/joinRoom` |
| startGame | `POST http://localhost:5001/kkkpoker510/us-central1/startGame` |
| playCards | `POST http://localhost:5001/kkkpoker510/us-central1/playCards` |
| passTurn | `POST http://localhost:5001/kkkpoker510/us-central1/passTurn` |
| getGameState | `POST http://localhost:5001/kkkpoker510/us-central1/getGameState` |
| healthCheck | `POST http://localhost:5001/kkkpoker510/us-central1/healthCheck` |

## Firestore 数据结构

**Public (所有人可读):**
- `rooms/{roomId}` - 房间状态
- `rooms/{roomId}/players/{playerId}` - 玩家公开信息

**Private (仅自己可读):**
- `roomPrivate/{roomId}/hands/{playerId}` - 玩家手牌

## 停止 Emulator

按 `Ctrl+C` 或运行:
```bash
firebase emulators:kill
```

## 生产部署

测试完成后部署到生产:
```bash
firebase deploy
```
