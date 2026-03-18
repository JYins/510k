import type { Locale } from "./translations";

export const rulesContent: Record<Locale, string> = {
  zh: `# 510K 游戏规则

当前页面以网站现有实现为准，重点帮助你快速确认牌型、压制方式、补牌逻辑和结算条件。

## 快速总览

- **人数**：2–4 人
- **牌组**：一副 54 张扑克牌（52 张普通牌 + 小王 + 大王）
- **行动顺序**：顺时针
- **首墩先手**：持最小牌者先出；之后每墩由上一墩赢家先出
- **补牌逻辑**：牌堆未空时，每墩结束后从赢家开始顺时针补到 5 张
- **终局条件**：只有在牌堆打空后，才会进入最终结算

## 牌型与大小

### 点数顺序

4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2 < 3 < 小王 < 大王

### 花色顺序

黑桃 ♠ > 红桃 ♥ > 梅花 ♣ > 方块 ♦

### 分牌

| 牌 | 分值 |
|---|---|
| 5 | 5 分 |
| 10 | 10 分 |
| K | 10 分 |

其他牌不计分；大小王不看花色。

## 支持的出牌方式

- **单张**：任意 1 张
- **对子**：两张同点数
- **三张**：三张同点数
- **三带一**：三张同点数 + 任意单张
- **三带二**：三张同点数 + 一对
- **顺子**：连续单牌；当前实现里因为手牌上限为 5，实际只会出现 5 张顺子；2、3、大小王不能进入顺子
- **炸弹**：四张同点数
- **王炸**：小王 + 大王，为全场最大

当前实现**不支持**连对、飞机等多组连续组合牌型。

## 出牌与压制

### 出牌流程

- 首位玩家必须先出一手合法牌，不能 Pass
- 之后轮到其他玩家时，只能选择**压过当前最大牌**，或者 Pass
- 当所有其他玩家都 Pass，轮到当前领先玩家时，该玩家可以：
- 继续出一手新的合法牌型
- 或者 Pass，直接收下这一墩

### 压制规则

- 只有**牌型一致、结构一致**时，才可以比较大小
- 点数更大则更大
- 如果点数相同，则按花色比较
- 对于**同点数对子**，你的两张牌花色都必须分别大于对方的两张牌，才算压过
- 炸弹可以压普通牌型
- 炸弹之间比点数大小
- 王炸最大

## 对局流程

### 开局

- 每位玩家先拿 5 张手牌
- 剩余牌组成牌堆

### 一墩结束

- 一墩内所有已出的牌会进入该墩牌池
- 最后保持领先的玩家赢得本墩，并拿走本墩全部分数

### 补牌

- 只要牌堆还有牌，一墩结束后就会从赢家开始顺时针补牌
- 每位玩家都尽量补回到 5 张
- 如果牌堆不够，就补到发空为止

## 终局与结算

### 何时结算

只有牌堆已经打空时，满足以下任一条件才会结算：

- 有玩家手牌打光
- 一整轮都选择 Pass，本墩自然结束

### 如何结算

- 之前已经赢到手的分数全部保留
- 所有人剩余手牌中的分牌会集中比较
- 比较每位玩家剩余手牌中的**最大单张**
- 最大单张所属玩家获得所有剩余分牌总分

### 胜负

按总分排名，分数最高者获胜。`,

  en: `# 510K Rules

This page is aligned with the current website implementation, so it focuses on the exact play types, refill flow, and end-game settlement used in the app.

## Quick View

- **Players**: 2–4
- **Deck**: 54 cards (52 standard cards + Small Joker + Big Joker)
- **Turn order**: Clockwise
- **First lead**: The player holding the smallest card leads the first trick; after that, the previous trick winner leads
- **Refill flow**: While the deck still has cards, every finished trick refills hands back toward 5 cards starting from the winner
- **End game**: Final settlement happens only after the deck is empty

## Card Strength and Points

### Rank Order

4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2 < 3 < Small Joker < Big Joker

### Suit Order

♠ Spades > ♥ Hearts > ♣ Clubs > ♦ Diamonds

### Point Cards

| Card | Points |
|---|---|
| 5 | 5 |
| 10 | 10 |
| K | 10 |

All other cards are worth 0 points, and jokers do not use suits.

## Supported Play Types

- **Single**: Any 1 card
- **Pair**: Two cards of the same rank
- **Triple**: Three cards of the same rank
- **Triple + Single**: Three of a kind plus any single card
- **Triple + Pair**: Three of a kind plus one pair
- **Straight**: Consecutive singles; because the current implementation keeps hand size at 5, this is effectively a 5-card straight; 2, 3, and jokers cannot be used
- **Bomb**: Four cards of the same rank
- **Joker Bomb**: Small Joker + Big Joker, the highest play in the game

The current implementation does **not** support consecutive pairs, planes, or other multi-group sequence patterns.

## Playing and Beating

### Turn Flow

- The leader must open with a valid play and cannot pass
- Other players may either beat the current best play or pass
- When play returns to the current leader after everyone else has passed, that leader may:
- start a new valid play
- or pass to take the trick immediately

### Beating Rules

- You can compare plays only when the **type and structure match**
- Higher rank wins
- If ranks are tied, suit order breaks the tie
- For **same-rank pairs**, both of your suits must beat both of your opponent's suits
- Bombs beat non-bombs
- Higher bombs beat lower bombs
- Joker bomb beats everything

## Match Flow

### Dealing

- Each player starts with 5 cards
- The remaining cards form the deck

### Finishing a Trick

- All cards played in that trick go into the trick pile
- The player who remains ahead at the end of the trick wins all points in that pile

### Refills

- As long as the deck still has cards, every finished trick triggers a refill
- Refill starts with the trick winner and continues clockwise
- Each player refills toward 5 cards
- If the deck runs out, refilling stops immediately

## End Game and Settlement

### When Settlement Starts

Final settlement only starts after the deck is empty, and then one of these happens:

- A player runs out of cards
- The trick ends after a full cycle of passes

### How Settlement Works

- Points already won stay with their owners
- Any remaining point cards still in players' hands are collected into one final pool
- Compare each player's **highest remaining single card**
- The player with the highest remaining card takes all remaining point cards

### Winner

The highest total score wins.`,
};
