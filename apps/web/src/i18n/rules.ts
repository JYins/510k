import type { Locale } from "./translations";

export const rulesContent: Record<Locale, string> = {
  zh: `# 510K 游戏规则（完整版）

## 1. 游戏基本信息

- **人数**：2–4 人
- **牌组**：一副标准 54 张扑克（52 张普通牌 + 小王 + 大王）
- **行动顺序**：顺时针
- **先手**：第一墩由系统指定（持最小牌者），此后每墩由上一墩赢家先出

## 2. 牌的大小规则

### 点数大小（从小到大）

4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2 < 3 < 小王 < 大王

### 花色大小（同点数时比较）

黑桃 ♠ > 红桃 ♥ > 梅花 ♣ > 方块 ♦

花色只在同点数时使用；大小王没有花色。

## 3. 分牌规则

| 牌 | 分值 |
|---|------|
| 5 | 5 分 |
| 10 | 10 分 |
| K | 10 分 |

其他牌不计分。

## 4. 开局发牌

每人发 5 张手牌，剩余牌形成牌堆。游戏过程中手牌数量会变化，满足条件时会补牌到 5 张。

## 5. 一墩（Trick）流程

- 某位玩家先出一手牌
- 其他玩家依次选择压牌或 Pass
- 当所有人（包括先手再轮到自己时）都选择 Pass 后，本墩结束
- 最大者赢得本墩并吃掉本墩分数

## 6. 允许的出牌方式

- **单张**：任意 1 张
- **对子**：两张同点数
- **三张**：三张同点数
- **三带一**：三张同点 + 任意单张
- **三带二**：三张同点 + 一对
- **顺子**：5 张及以上连续单牌（不含 2、3、王）
- **连对**：2 对及以上连续对子（不含 2、3、王）
- **飞机**：2 组及以上连续三张（不含 2、3、王）
- **炸弹**：四张同点数
- **王炸**：小王 + 大王（最大）

## 7. 出牌规则

- **先手**：可出任意合法牌型，不能 Pass
- **跟牌**：只能出牌压过当前最大牌，或 Pass
- **回到先手**：当除先手外所有人都 Pass，轮回到先手时，先手可出任意牌型（不必跟上一手），或 Pass 结束本墩

## 8. 压制规则

- 牌型相同、结构相同、牌力更大才能压
- 对子同点数时，可比较花色：两张牌的花色都大于对方时才能压
- 炸弹可压普通牌型
- 更大炸弹压更小炸弹
- 王炸最大

## 9. 零分墩补牌

若本墩总分 = 0 且牌堆有牌，则从本墩赢家开始顺时针补牌，每人补到 5 张（牌堆不足则补到空为止）。

## 10. 牌堆空后与终局条件

不再补牌，玩家只打手中剩余牌。满足以下任一条件时终局结算：

- 牌库发空后，若所有人都 Pass，则终局结算
- 任一玩家手牌打光时，立即终局结算

## 11. 终局结算

- 已吃到的分数保留
- 剩余手牌中的分牌：比较每人手中最大一张牌，最大者获得所有剩余分牌总分

## 12. 胜负

按总分排名，分数最高者获胜。`,

  en: `# 510K Game Rules (Full)

## 1. Basics

- **Players**: 2–4
- **Deck**: Standard 54 cards (52 + Small Joker + Big Joker)
- **Turn order**: Clockwise
- **Lead**: First trick — player with smallest card; later tricks — previous winner leads

## 2. Card Ranking

### Rank (low to high)

4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2 < 3 < Small Joker < Big Joker

### Suits (tie-breaker when ranks equal)

♠ Spades > ♥ Hearts > ♣ Clubs > ♦ Diamonds

Suits only matter for same-rank comparison; jokers have no suit.

## 3. Point Cards

| Card | Points |
|------|--------|
| 5 | 5 |
| 10 | 10 |
| K | 10 |

All other cards: 0 points.

## 4. Dealing

Each player gets 5 cards. Remaining cards form the deck. Hands change during play; refills to 5 when conditions are met.

## 5. Trick Flow

- One player leads with a valid play
- Others take turns: play higher or pass
- When everyone (including the leader when it comes back to them) has passed, the trick ends
- Highest play wins the trick and takes all points in it

## 6. Valid Play Types

- **Single**: Any 1 card
- **Pair**: Two cards of same rank
- **Triple**: Three cards of same rank
- **Triple+Single**: Triple + any single
- **Triple+Pair**: Triple + pair
- **Straight**: 5+ consecutive singles (no 2, 3, jokers)
- **Consecutive pairs**: 2+ consecutive pairs (no 2, 3, jokers)
- **Plane**: 2+ consecutive triples (no 2, 3, jokers)
- **Bomb**: Four of a kind
- **Joker Bomb**: Small + Big Joker (highest)

## 7. Play Rules

- **Lead**: May play any valid type; cannot pass
- **Follow**: Must play higher than current best, or pass
- **Back to leader**: When everyone except the leader has passed and it's the leader's turn again, the leader may play any valid type (no need to follow the previous play) or pass to end the trick

## 8. Beating Rules

- Same type, same structure, higher rank (and suit if tied)
- For same-rank pairs: both of your cards must beat both of opponent's by suit
- Bombs beat non-bombs
- Higher bomb beats lower bomb
- Joker bomb beats everything

## 9. Zero-Point Trick Refill

If trick total = 0 and deck has cards, refill clockwise from winner until each has 5 cards (or deck is empty).

## 10. Empty Deck and End Conditions

No more refills. Players use remaining cards. Game ends when either:

- Deck is empty and everyone has passed
- Any player runs out of cards

## 11. End Game

- Points already won are kept
- Remaining point cards in hand: compare each player’s highest card; highest takes all remaining points

## 12. Winner

Highest total score wins.`,
};
