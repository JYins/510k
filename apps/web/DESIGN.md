# 510K Design System

A premium mobile-first card game UI design system for the 510K web application.

---

## Design Rationale

The 510K card game UI is designed to feel like a native iOS game app rather than a traditional web dashboard. Key principles:

### Visual Philosophy
- **Dark & Immersive**: Deep black backgrounds let card colors pop and reduce eye strain during extended play
- **Premium & Refined**: Muted accent colors, subtle shadows, and generous spacing create an elegant feel
- **Tactile & Responsive**: Cards and buttons respond to interaction with smooth animations and physical feedback
- **Focused & Uncluttered**: Every element serves a purpose; no visual noise

### Mobile-First Approach
- Touch targets are 44x44pt minimum (Apple HIG standard)
- Layouts stack vertically for one-handed play
- Swipe-friendly card selection with clear visual feedback
- Safe area insets support for notched devices

---

## Design Tokens

### Color Palette

#### Background Colors
```
bg-primary:      #000000  (Pure black - main background)
bg-secondary:    #0A0A0A  (Slightly lifted surfaces)
bg-tertiary:     #111111  (Elevated cards)
bg-elevated:     #1A1A1A  (Modals, popovers)
bg-card:         #141414  (Card surfaces)
```

#### Surface Colors
```
surface:         #1C1C1E  (Interactive elements)
surface-hover:   #2C2C2E  (Hover state)
surface-pressed: #3A3A3C  (Active/pressed state)
```

#### Text Colors
```
text-primary:    #FFFFFF  (Headlines, important text)
text-secondary:  #8E8E93  (Body text, labels)
text-tertiary:   #636366  (Disabled, hints)
text-inverse:    #000000  (On light backgrounds)
```

#### Accent Colors
```
accent:          #6366F1  (Primary actions, selection)
accent-hover:    #818CF8  (Hover state)
accent-pressed:  #4F46E5  (Active state)
```

#### Semantic Colors
```
success:  #34C759  (Success states, current turn)
warning:  #FF9500  (Warnings, leader indicator)
error:    #FF3B30  (Errors, destructive actions)
```

#### Card Suit Colors
```
suit-hearts:   #FF453A  (Red - Hearts & Diamonds)
suit-spades:   #FFFFFF  (White - Spades & Clubs)
```

### Typography

#### Font Stack
```css
font-family: "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
```

#### Type Scale
```
Display:         32px / -0.02em / 700  (Game titles)
Title:           24px / -0.01em / 600  (Section headers)
Headline:        20px / -0.01em / 600  (Card titles)
Body:            17px / 0 / 400        (Primary content)
Body-Emphasized: 17px / 0 / 600        (Important body text)
Subhead:         15px / 0 / 400        (Secondary content)
Footnote:        13px / 0 / 400        (Labels, captions)
Caption:         12px / 0 / 400        (Small labels)
```

### Spacing Scale

```
1:   4px   (Tight padding, icon gaps)
2:   8px   (Inline elements)
3:   12px  (Small card padding)
4:   16px  (Standard spacing)
5:   20px  (Section padding)
6:   24px  (Large gaps)
8:   32px  (Section breaks)
10:  40px  (Major sections)
12:  48px  (Page padding)
```

### Border Radius Scale

```
xs:   4px   (Small chips, badges)
sm:   8px   (Compact buttons)
md:   12px  (Buttons, inputs)
lg:   16px  (Cards, panels)
xl:   20px  (Large cards)
2xl:  24px  (Modals)
3xl:  28px  (Hero elements)
4xl:  32px  (Full-width banners)
full: 9999px (Pills, avatars)
```

### Shadows

```
shadow-card:       0 4px 20px rgba(0, 0, 0, 0.4)
shadow-card-hover: 0 8px 30px rgba(0, 0, 0, 0.5)
shadow-elevated:   0 8px 32px rgba(0, 0, 0, 0.5)
shadow-glow:       0 0 20px rgba(99, 102, 241, 0.4)
shadow-glow-green: 0 0 20px rgba(52, 199, 89, 0.4)
```

### Animation Timing

```
ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1)  (Playful bounces)
ease-smooth:  cubic-bezier(0.4, 0, 0.2, 1)      (Standard transitions)
ease-bounce:  cubic-bezier(0.68, -0.55, 0.265, 1.55) (Overshoot)
```

### Animation Durations

```
fast:    150ms  (Micro-interactions)
normal:  200ms  (Standard transitions)
slow:    300ms  (Page transitions)
slower:  400ms  (Complex animations)
```

---

## Component Breakdown

### Card Component

**Usage:** Display individual playing cards in the hand or table.

**Props:**
```typescript
interface CardProps {
  card: Card;           // Card data object
  selected?: boolean;   // Selected state styling
  disabled?: boolean;   // Non-interactive state
  onClick?: () => void; // Click handler
  size?: "sm" | "md" | "lg";
  animate?: boolean;    // Enable entry animation
}
```

**Visual States:**
- **Default:** Dark surface, subtle shadow
- **Hover:** Slight lift (-2px), enhanced shadow
- **Selected:** Glow ring, elevated (-12px), scale up
- **Disabled:** Reduced opacity, no hover effects

### PlayerAvatar Component

**Usage:** Show player identity in game header and lists.

**Props:**
```typescript
interface PlayerAvatarProps {
  name: string;
  score: number;
  seat: number;
  isCurrentTurn?: boolean;  // Animated ring indicator
  isMe?: boolean;           // Self identifier
  isLeader?: boolean;       // Crown badge
  size?: "sm" | "md" | "lg";
  status?: "ready" | "waiting" | "playing" | "offline";
}
```

**Features:**
- Auto-generated gradient avatars based on name hash
- Animated turn indicator with pulsing ring
- Score display below avatar
- Status dot indicator

### ActionButton Component

**Usage:** Primary actions (Play, Pass, Create Room, etc.)

**Variants:**
- **Primary:** Gradient background, glow on hover
- **Secondary:** Surface background, subtle border
- **Ghost:** Transparent, accent text
- **Danger:** Red tint for destructive actions
- **Success:** Green tint for positive actions

**Sizes:**
- **Small:** Compact actions, icon buttons
- **Medium:** Standard buttons
- **Large:** Hero actions (Start Game)

### TableArea Component

**Usage:** Central game area showing played cards and game state.

**Layout:**
- Deck counter (top-left)
- Discard pile counter (top-left)
- Current turn indicator (top-right)
- Played cards (center, animated entry)
- Player position markers (edges)

### HandCards Component

**Usage:** Display player's hand with fan layout.

**Features:**
- Fan arrangement with overlap calculation
- Selected cards elevate and glow
- Tap to toggle selection
- Entry animations from bottom
- "Selected count" hint when choosing

### GameHeader Component

**Usage:** Navigation and status bar.

**Elements:**
- Back button (left)
- Room ID and status badge (center)
- Settings menu (right)

---

## Page Structure

### Lobby Page (`/`)

```
┌─────────────────────────────┐
│         510K                │  ← Logo + Tagline
│      经典扑克牌游戏          │
├─────────────────────────────┤
│                             │
│      ┌─────────┐            │  ← Animated card icon
│      │   🃏    │            │
│      └─────────┘            │
│                             │
├─────────────────────────────┤
│      创建房间               │  ← Player count selector
│   [2人] [3人] [4人]         │
│                             │
│   ┌─────────────────────┐   │
│   │     创建房间         │   │  ← Primary CTA
│   └─────────────────────┘   │
├─────────────────────────────┤
│            或               │  ← Divider
├─────────────────────────────┤
│      加入房间               │
│   ┌─────────────────────┐   │
│   │   输入房间号         │   │  ← Room code input
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │     加入房间         │   │  ← Secondary CTA
│   └─────────────────────┘   │
└─────────────────────────────┘
```

### Room Waiting Page (`/room/[id]`)

```
┌─────────────────────────────┐
│ ← 房间 ABC123    [等待中] ⚙️│  ← Header with status
├─────────────────────────────┤
│                             │
│         房间号              │
│        A B C 1 2 3          │  ← Large room code
│      [分享]                 │
│                             │
├─────────────────────────────┤
│  玩家 (2/4)                 │
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤 张三 (我)     座位1  │ │  ← Player row
│ │    房主      [已准备]   │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤 李四          座位2  │ │
│ │            [已准备]     │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ +  等待玩家加入...      │ │  ← Empty slot
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│   ┌─────────────────────┐   │
│   │     开始游戏         │   │  ← Enabled when ready
│   └─────────────────────┘   │
│                             │
│        离开房间             │  ← Ghost button
└─────────────────────────────┘
```

### In-Game Page (`/game/[id]`)

```
┌─────────────────────────────┐
│ ← 房间 ABC123    [进行中] ⚙️│
├─────────────────────────────┤
│  [👤我 0分] [👤P2 5分] ... │  ← Player chips row
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐    │
│  │  🎴 12    🗑️ 8      │    │  ← Deck/discard counts
│  │                     │    │
│  │                     │    │
│  │    张三 出牌        │    │  ← Last play info
│  │   [♠A] [♥K] [♦Q]    │    │  ← Played cards
│  │                     │    │
│  │                     │    │
│  │    ● 我的回合        │    │  ← Turn indicator
│  └─────────────────────┘    │  ← Table area
│                             │
├─────────────────────────────┤
│                             │
│    ○ ○ ○ ○ ○ ○ ○ ○ ○ ○     │  ← Hand cards (fan layout)
│   已选 3 张牌               │  ← Selection hint
│                             │
├─────────────────────────────┤
│   ┌────────┐  ┌──────────┐  │
│   │  跳过   │  │ 出牌 (3) │  │  ← Action buttons
│   └────────┘  └──────────┘  │
└─────────────────────────────┘
```

### Game Result Page (`/game/[id]/result`)

```
┌─────────────────────────────┐
│                             │
│          游戏结束            │
│    🎉 恭喜获胜！ / 下次再接再厉 │
│                             │
│            👑               │  ← Crown animates
│          ┌───┐              │
│          │👤 │              │  ← Winner avatar
│          └───┘              │
│           冠军              │
│                             │
├─────────────────────────────┤
│        最终排名             │
│                             │
│  ┌─────────────────────────┐│
│  │ 🥇  张三    45分       ││  ← Winner (gold)
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🥈  李四    30分       ││  ← 2nd place
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🥉  王五    15分       ││  ← 3rd place
│  └─────────────────────────┘│
│                             │
├─────────────────────────────┤
│   ┌─────────────────────┐   │
│   │      再来一局        │   │
│   └─────────────────────┘   │
│        返回大厅             │
└─────────────────────────────┘
```

---

## Tailwind-Friendly Style Definitions

### Common Patterns

```css
/* Premium card */
.premium-card {
  @apply bg-surface rounded-2xl p-5 border border-white/5 shadow-card;
}

/* Interactive row */
.interactive-row {
  @apply flex items-center gap-3 p-4 rounded-2xl bg-surface
         hover:bg-surface-hover active:bg-surface-pressed
         transition-all duration-200;
}

/* Glass effect */
.glass-panel {
  @apply bg-surface/70 backdrop-blur-xl border border-white/10;
}

/* Glow text */
.glow-text {
  @apply text-accent drop-shadow-[0_0_10px_rgba(99,102,241,0.5)];
}

/* Safe area padding */
.safe-container {
  @apply pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
         pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)];
}
```

### Animation Classes

```css
/* Entry animations */
.animate-fade-up {
  @apply animate-[fadeUp_0.4s_cubic-bezier(0.4,0,0.2,1)_forwards];
}

.animate-scale-in {
  @apply animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards];
}

/* Continuous animations */
.animate-pulse-soft {
  @apply animate-[pulseSoft_2s_ease-in-out_infinite];
}

.animate-glow-pulse {
  @apply animate-[glowPulse_2s_ease-in-out_infinite];
}

/* Turn indicator pulse */
.turn-indicator {
  @apply animate-[pulse_1.5s_ease-out_infinite];
}
```

---

## Implementation Notes

### Mobile Optimization
- Use `touch-action: manipulation` for instant button response
- Prevent zoom on input focus with `font-size: 16px` minimum
- Respect safe area insets with `env(safe-area-inset-*)`
- Disable pull-to-refresh for game pages

### Performance
- Use `will-change: transform` on animated cards
- Implement `content-visibility: auto` for off-screen sections
- Lazy load card images if using custom designs
- Use CSS containment for card components

### Accessibility
- Maintain 4.5:1 contrast ratio for all text
- Support reduced motion preferences
- Ensure 44x44pt minimum touch targets
- Provide screen reader labels for card values

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom design tokens
- **Animations:** Framer Motion
- **Icons:** Lucide React (or inline SVG)
- **State:** React hooks + Firebase real-time sync
