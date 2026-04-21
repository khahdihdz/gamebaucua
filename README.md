# 🎲 Bầu Cua Casino — Production-Ready

Web casino Bầu Cua Tôm Cá fullstack với realtime multiplayer, auto payment, anti-fraud.

---

## 🏗️ Kiến Trúc

```
baucua-casino/
├── apps/
│   ├── api/          → Node.js + Express + Socket.IO  (Render.com)
│   ├── web/          → Next.js 14 user frontend        (Vercel)
│   └── admin/        → Next.js 14 admin panel          (Vercel)
└── packages/
    ├── db/           → MongoDB models (shared)
    ├── fraud/        → Anti-fraud engine (shared)
    └── payment/      → SePay + VietQR (shared)
```

```
Client (Next.js)
    │  REST API + Socket.IO
    ▼
API Server (Express)
    │
    ├── Redis ──── distributed lock · cache · rate limit
    └── MongoDB ── users · bets · transactions · fraud logs
```

---

## ⚡ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 · TailwindCSS · Framer Motion · Zustand |
| Backend | Node.js · Express · Socket.IO · Passport.js |
| Database | MongoDB (Mongoose) · Redis (ioredis) |
| Auth | GitHub OAuth |
| Payment | SePay webhook · VietQR |
| Deploy | Render.com (API) · Vercel (web + admin) |

---

## 🎮 Game System

- **Round loop**: 10s betting → 5s rolling → 3s result → repeat
- **RTP Engine**: Configurable từ admin (85–99%), tác động vào roll logic
- **Payout**: 1 match = ×2 | 2 match = ×3 | 3 match = ×4
- **Symbols**: 🦐 Bầu · 🦀 Cua · 🐟 Cá · 🦞 Tôm · 🐓 Gà · 🦌 Nai

---

## 🤖 Bot System

- 20 bots seed tự động khi khởi động
- 3 personalities: `aggressive` · `conservative` · `random`
- 3 chat styles: `excited` · `casual` · `angry`
- 55% bots bet mỗi round (random activation)
- Auto-refill balance khi bot xuống < 50k xu

---

## 💰 Payment Flow (SePay)

```
1. User POST /api/payment/deposit { amount }
2. Server tạo content = NAP{userId}{random}
3. Return QR VietQR + bank info
4. User chuyển khoản đúng nội dung
5. SePay webhook → POST /api/payment/webhook
6. Server:
   ├── verify HMAC signature
   ├── parse content → tìm pending deposit
   ├── Redis lock (chống duplicate)
   ├── fraud checks (spam · mismatch · micro)
   ├── User.balance += amount
   ├── emit deposit_success (Socket.IO)
   └── emit balance_update
```

---

## 🛡️ Anti-Fraud Rules

| Rule | Score | Trigger |
|---|---|---|
| SPAM_DEPOSIT | +30 | >5 requests/phút |
| AMOUNT_MISMATCH | +50 | Chuyển sai số tiền |
| DUPLICATE_WEBHOOK | +40 | Webhook trùng sepayId |
| MICRO_TRANSACTIONS | +25 | Amount < 10,000 VNĐ |
| ABNORMAL_WINRATE | +35 | Win rate >80% sau 20 ván |

**Score > 70 trong 24h → auto-flag → cần admin review**

---

## 🚀 Setup Local

### 1. Prerequisites

```bash
node >= 18
yarn
MongoDB (local hoặc Atlas)
Redis (local hoặc Upstash)
```

### 2. Clone & install

```bash
git clone <your-repo>
cd baucua-casino
yarn install
```

### 3. Environment

```bash
cp apps/api/.env.example apps/api/.env
# Điền đầy đủ các biến trong .env
```

Các biến bắt buộc:
```
MONGO_URI=mongodb://localhost:27017/baucua
REDIS_URL=redis://localhost:6379
SESSION_SECRET=<random 64 chars>
GITHUB_CLIENT_ID=<from github>
GITHUB_CLIENT_SECRET=<from github>
```

### 4. GitHub OAuth App

Vào https://github.com/settings/applications/new:
- **Homepage URL**: `http://localhost:3000`
- **Authorization callback URL**: `http://localhost:4000/api/auth/github/callback`

### 5. Chạy dev

```bash
# Terminal 1: API
yarn dev:api

# Terminal 2: Web
yarn dev:web

# Terminal 3: Admin (optional)
yarn dev:admin
```

- Web: http://localhost:3000
- Admin: http://localhost:3001
- API: http://localhost:4000

---

## 🌐 Deploy Production

### Backend → Render.com

1. Push code lên GitHub
2. Vào https://render.com → New → Blueprint
3. Connect repo → Render tự đọc `render.yaml`
4. Vào **Environment** tab, điền tất cả ENV vars
5. Deploy

**SePay Webhook URL**: `https://baucua-api.onrender.com/api/payment/webhook`

### Frontend → Vercel

#### Web App

```bash
cd apps/web
vercel --prod
```

Set environment variables trong Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://baucua-api.onrender.com
NEXT_PUBLIC_WS_URL=https://baucua-api.onrender.com
```

#### Admin Panel

```bash
cd apps/admin
vercel --prod
```

Set:
```
NEXT_PUBLIC_API_URL=https://baucua-api.onrender.com
```

---

## 🎛️ Admin Panel

URL: `https://baucua-admin.vercel.app`  
Cần tài khoản có `role: 'admin'` trong MongoDB.

**Set admin role thủ công:**
```js
// MongoDB shell
db.users.updateOne(
  { username: "your_github_username" },
  { $set: { role: "admin" } }
)
```

### Tính năng Admin:

| Trang | Chức năng |
|---|---|
| Dashboard | KPIs · doanh thu · online users · recent rounds |
| Analytics | Charts revenue/users · top depositors · fraud summary |
| Users | Search · ban/unban · điều chỉnh số dư · set role |
| Transactions | Filter · confirm/reject nạp tiền thủ công |
| Fraud Monitor | Review fraud logs · flag/clear users |
| Game Control | Set RTP · ép kết quả ván hiện tại |

---

## 📡 Socket.IO Events

### Client nhận:

| Event | Payload |
|---|---|
| `new_round` | `{ roundId, bettingEndsAt }` |
| `round_rolling` | `{ roundId }` |
| `round_completed` | `{ roundId, result }` |
| `round_result` | `{ winAmount, newBalance }` — personal |
| `balance_update` | `{ balance }` — personal |
| `deposit_success` | `{ amount, newBalance }` — personal |
| `chat_message` | `{ username, avatar, message }` |
| `bet_placed` | `{ username, choices, totalBet }` |

### Client gửi:

| Event | Payload |
|---|---|
| `get_state` | — (yêu cầu game state hiện tại) |
| `chat_message` | `{ message }` |

---

## 🔒 Security Checklist

- [x] Helmet.js headers
- [x] CORS whitelist
- [x] Rate limiting per endpoint
- [x] Redis distributed lock (chống duplicate webhook)
- [x] HMAC signature verify (SePay)
- [x] Server-side bet validation (không trust client)
- [x] Session httpOnly + secure cookie
- [x] Admin routes require role check
- [x] Fraud scoring system
- [x] Balance deducted atomically (`$gte` check)
- [x] Bot bets không ảnh hưởng real user balance

---

## 📦 Package Scripts

```bash
yarn dev:api      # Start API dev server (nodemon)
yarn dev:web      # Start web frontend
yarn dev:admin    # Start admin panel
yarn build:api    # Build API
yarn build:web    # Build web
yarn build:admin  # Build admin
```

---

## 🗂️ File Structure hoàn chỉnh

```
apps/api/src/
├── index.js                  # Express bootstrap
├── config/
│   ├── logger.js             # Winston logger
│   ├── passport.js           # GitHub OAuth
│   └── redis.js              # Redis client + helpers
├── middleware/
│   ├── auth.js               # isAuthenticated, isAdmin
│   └── rateLimiter.js        # Per-endpoint rate limits
├── routes/
│   ├── auth.js               # GitHub OAuth routes
│   ├── user.js               # Profile, transactions, leaderboard
│   ├── game.js               # Bet, round state, history
│   ├── payment.js            # Deposit + SePay webhook
│   ├── admin.js              # Full admin CRUD
│   └── analytics.js          # Dashboard metrics
├── services/
│   ├── gameLoop.js           # Round loop + RTP engine
│   └── botSystem.js          # Bot betting + chat
└── socket/
    └── index.js              # Socket.IO namespaces

packages/
├── db/index.js               # 7 Mongoose models
├── fraud/index.js            # Risk scoring engine
└── payment/index.js          # VietQR + SePay helpers

apps/web/src/
├── app/
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Main game page
│   └── globals.css           # Casino dark theme
├── components/
│   ├── game/
│   │   ├── GameBoard.tsx     # Dice + countdown + result
│   │   ├── BettingPanel.tsx  # Symbol grid + chip amounts
│   │   ├── ChatBox.tsx       # Live chat
│   │   ├── DepositModal.tsx  # QR + polling
│   │   └── LeaderboardPanel.tsx
│   ├── layout/
│   │   ├── Header.tsx        # Nav + balance
│   │   └── Providers.tsx     # React Query + auth init
│   └── ui/
│       ├── LoginPrompt.tsx   # GitHub OAuth landing
│       └── LoadingScreen.tsx
├── hooks/useSocket.ts        # Socket.IO hook
├── lib/api.ts                # Axios + all API calls
└── store/index.ts            # Zustand global state

apps/admin/src/
├── app/
│   ├── dashboard/page.tsx    # KPIs + charts
│   ├── analytics/page.tsx    # Full analytics
│   ├── users/page.tsx        # User management
│   ├── transactions/page.tsx # TX list + review
│   ├── fraud/page.tsx        # Fraud monitor
│   └── game-control/page.tsx # RTP + force result
└── components/layout/
    ├── AdminLayout.tsx        # Sidebar navigation
    └── AdminProviders.tsx     # Auth guard
```
