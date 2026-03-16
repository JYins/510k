# 510K - 经典扑克牌游戏

> [English](README.md)  
> 我就是单纯的想把我们几个老友的私下小游戏电子化。
> 每次聚会都玩 510K，但总有人记不住规则，还老是算错分。
> 所以干脆做个网页版，随时随地开一局。

## 游戏规则

**510K** 是一个 2-4 人的扑克牌游戏，使用一副 54 张标准扑克（含大小王）。

### 核心玩法

1. 每人发 5 张手牌
2. 持最小牌者先出
3. 其他人顺时针轮流出牌或跳过
4. 所有人 Pass 后，最大牌的人赢得这一墩
5. 零分墩补牌到 5 张，牌堆空后打完收工

### 分牌规则

| 牌 | 分值 |
|----|------|
| 5  | 5 分 |
| 10 | 10 分 |
| K  | 10 分 |

### 牌面大小

`4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2 < 3 < 小王 < 大王`

花色（同点数时比较）：黑桃 > 红桃 > 梅花 > 方块

### 允许的牌型

单张 / 对子 / 三张 / 三带一 / 三带二 / 顺子(5+) / 炸弹(四张同) / 王炸

## 技术栈

- **前端**: Next.js 14 + Tailwind CSS + Framer Motion
- **后端**: Firebase Cloud Functions (v2)
- **数据库**: Cloud Firestore (实时同步)
- **认证**: Firebase Auth (邮箱/密码、Google 登录)
- **部署**: Vercel (前端) + Firebase (后端)

## 项目结构

```
510k/
├── apps/web/          # Next.js 前端
├── functions/         # Firebase Cloud Functions
├── shared/            # 共享游戏逻辑（牌型分析等）
├── firebase.json      # Firebase 配置
└── package.json       # Monorepo root
```

## 本地开发

```bash
# 安装依赖
npm install

# 构建共享模块
npm run build:shared

# 启动前端开发服务器
npm run dev:web

# 构建 Cloud Functions
npm run build:functions
```

## 部署

前端部署到 Vercel，后端部署到 Firebase：

```bash
# 部署 Cloud Functions
firebase deploy --only functions

# 部署 Firestore 规则
firebase deploy --only firestore:rules
```

---

此游戏致敬 yp 小姐，不过输了还是要大冒险。
