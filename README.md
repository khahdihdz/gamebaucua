# 🎲 Bầu Cua Casino — Production-Ready

Casino **Bầu Cua Tôm Cá** trực tuyến với polling realtime, GitHub OAuth, thanh toán SePay tự động, hệ thống **Gift Code**, popup thông báo, và admin panel đầy đủ.

---

## ⚠️ TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM

> **ĐỌC KỸ TRƯỚC KHI SỬ DỤNG**

### 🔞 Độ tuổi
Dự án này **CHỈ dành cho người từ 18 tuổi trở lên**. Nếu bạn chưa đủ 18 tuổi, vui lòng **không sử dụng** dưới bất kỳ hình thức nào.

### 🎮 Mục đích sử dụng
Đây là dự án **mã nguồn mở, phi lợi nhuận**, được xây dựng với mục đích:
- **Học tập** các công nghệ web (Next.js, Node.js, MongoDB, Redis, OAuth, Webhook)
- **Nghiên cứu** kiến trúc hệ thống realtime và thanh toán tự động
- **Demo kỹ thuật** cho cộng đồng lập trình viên

Dự án **KHÔNG** phải là sòng bạc thực sự, **KHÔNG** nhằm mục đích kinh doanh, và **KHÔNG** khuyến khích hoạt động cờ bạc.

### ⚖️ Trách nhiệm pháp lý
- Người triển khai và vận hành có **toàn bộ trách nhiệm** đảm bảo tuân thủ pháp luật địa phương
- Tại nhiều quốc gia, vận hành dịch vụ cờ bạc trực tuyến không có giấy phép là **vi phạm pháp luật**
- Tác giả **không chịu bất kỳ trách nhiệm pháp lý nào** phát sinh từ việc sử dụng mã nguồn này

### 📄 Giấy phép
```
MIT License — Tự do sử dụng, sao chép, sửa đổi, nhưng phải giữ nguyên thông báo bản quyền.
Tác giả không chịu trách nhiệm về bất kỳ thiệt hại nào phát sinh từ việc sử dụng phần mềm.
```

---

## 🏗️ Kiến trúc

```
gamebaucua/
├── backend/                    # Node.js + Express → deploy Render.com
│   ├── server.js               # Entry point
│   ├── models/
│   │   ├── User.js             # Schema người dùng
│   │   ├── GiftCode.js         # 🆕 Schema gift code
│   │   └── index.js            # Transaction, Bet, Round, FraudLog
│   ├── routes/
│   │   ├── auth.js             # GitHub OAuth
│   │   ├── game.js             # Game state + betting
│   │   ├── deposit.js          # SePay webhook + VietQR
│   │   ├── giftcode.js         # 🆕 User redeem + Admin CRUD
│   │   └── admin.js            # Admin analytics, users, fraud, rounds
│   ├── services/
│   │   ├── gameEngine.js       # Game loop + Redis state
│   │   └── antifraud.js        # Fraud detection
│   └── config/
│       ├── passport.js         # GitHub strategy
│       └── redis.js            # Redis client + lock
│
└── frontend/                   # Next.js 14 App Router → deploy Vercel
    ├── app/
    │   ├── layout.tsx           # Root: Toast + Disclaimer
    │   ├── page.tsx             # Game + ResultPopup
    │   ├── deposit/             # Nạp tiền + VietQR
    │   └── admin/
    │       ├── layout.tsx       # 🆕 Sidebar responsive + mobile drawer
    │       ├── page.tsx         # Dashboard analytics
    │       ├── transactions/    # Lịch sử giao dịch + phân trang
    │       ├── users/           # Quản lý người dùng + sửa số dư
    │       ├── giftcodes/       # 🆕 Tạo / bật-tắt / xóa gift code
    │       ├── fraud/           # Fraud logs
    │       └── rounds/          # Lịch sử ván cược
    ├── components/
    │   ├── Toast.tsx            # Global toast notifications
    │   ├── DisclaimerModal.tsx  # Disclaimer popup (first visit)
    │   ├── ResultPopup.tsx      # Win/loss popup sau mỗi ván
    │   ├── BettingBoard.tsx
    │   ├── DiceResult.tsx
    │   ├── PhaseTimer.tsx
    │   └── Navbar.tsx
    └── lib/
        ├── api.ts               # fetch wrapper (get/post/patch/delete)
        ├── useAuth.tsx
        ├── useGameState.ts      # Polling 2s
        └── symbols.ts
```

---

## 🆕 Tính năng mới

### 🎁 Hệ thống Gift Code
Admin tạo mã quà tặng, người dùng nhập để nhận tiền thưởng ngay.

**Backend:**
- `POST /api/giftcode/redeem` — User nhập code để nhận tiền (yêu cầu đăng nhập)
- `GET  /admin/giftcodes` — Lấy danh sách code (có phân trang + filter)
- `POST /admin/giftcodes` — Tạo code mới
- `PATCH /admin/giftcodes/:id/toggle` — Bật/tắt code
- `DELETE /admin/giftcodes/:id` — Xóa code

**Tính năng gift code:**
- Giới hạn lượt dùng (`maxUses`): đặt `0` = vô hạn, `1` = single-use
- Thời hạn tùy chọn (`expiresAt`): để trống = không hết hạn
- Chống dùng lại: mỗi tài khoản chỉ dùng 1 code 1 lần
- Tạo code ngẫu nhiên bằng nút 🎲 trong admin panel
- Ghi chú nội bộ cho admin

**Frontend Admin (`/admin/giftcodes`):**
- Form tạo code với các trường: code, số tiền, lượt dùng, hết hạn, ghi chú
- Bảng desktop + card layout mobile
- Thanh tiến trình lượt dùng (xanh → cam → đỏ)
- Bật/tắt và xóa inline

### 📱 Admin Panel — Responsive cải tiến
Layout admin được viết lại để hiển thị tốt trên mọi màn hình:

| Màn hình | Layout |
|----------|--------|
| Desktop (≥768px) | Sidebar cố định bên trái, sticky khi scroll |
| Mobile (<768px) | Topbar sticky + Drawer menu trượt từ phải |

**Chi tiết cải tiến:**
- **Mobile drawer**: menu trượt ra từ phải với overlay nền mờ, đóng khi tap ra ngoài
- **Active indicator**: chấm vàng nhỏ bên phải item đang active
- **User badge**: hiển thị avatar + username admin ở cuối sidebar
- **Hover animation**: icon nav scale nhẹ khi hover
- Tất cả các trang admin (`users`, `transactions`, `rounds`) đã có `overflow-x-auto` cho table

---

## 🎮 Game Loop

```
BETTING (10s) ──► ROLLING (5s) ──► RESULT (3s) ──► BETTING ...

Server: tick() mỗi 1s → cập nhật Redis (TTL 2s)
Client: poll GET /api/game/state mỗi 2s
```

**Tỷ lệ thưởng:** 1 khớp = ×1 + hoàn vốn | 2 khớp = ×2 | 3 khớp = ×3

---

## ⚡ Quick Start

### Backend

```bash
cd backend
cp .env.example .env
# Điền đủ các biến môi trường (xem bảng bên dưới)
npm install
node server.js
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:10000
npm install
npm run dev
```

---

## 🌐 Deploy

### Backend → Render.com

1. Tạo **Web Service** mới, connect repo GitHub
2. **Root Directory:** `backend`
3. **Build:** `npm install` | **Start:** `node server.js`
4. Thêm Environment Variables:

| Key | Giá trị |
|-----|---------|
| `PORT` | `10000` |
| `NODE_ENV` | `production` |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/casino` |
| `REDIS_URL` | Redis URL (Upstash free tier khuyến nghị) |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `SESSION_SECRET` | Chuỗi ngẫu nhiên ≥ 32 ký tự |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `BACKEND_URL` | `https://your-backend.onrender.com` |
| `SEPAY_BANK` | Mã ngân hàng: `MB`, `VCB`, `TCB`... |
| `SEPAY_ACCOUNT` | Số tài khoản ngân hàng |
| `ADMIN_USERS` | GitHub username admin, cách nhau dấu phẩy |

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
# Thêm env: NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 🔑 GitHub OAuth Setup

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. **Homepage URL:** `https://your-app.vercel.app`
3. **Authorization callback URL:** `https://your-backend.onrender.com/auth/github/callback`
4. Copy **Client ID** + **Client Secret** → dán vào Render ENV

---

## 💰 SePay Webhook

1. Đăng ký [SePay.vn](https://sepay.vn) → thêm tài khoản ngân hàng
2. **Webhook URL:** `https://your-backend.onrender.com/webhook/sepay`
3. Format nội dung chuyển khoản: `NAP{userId_6chars}{random_5chars}` — hệ thống tự sinh khi người dùng tạo lệnh nạp

---

## 🔒 Anti-Fraud

| Rule | Ngưỡng | Điểm Risk |
|------|--------|-----------| 
| Spam nạp tiền | > 5 lần / phút | +40 |
| Sai số tiền CK | Thực tế < Yêu cầu | +30 |
| Duplicate webhook | Content đã xử lý | Block ngay |
| Risk ≥ 70 | — | 🚨 Khóa tài khoản |

---

## 📡 API Reference

```
# Auth
GET  /auth/github                     → OAuth redirect
GET  /auth/me                         → User hiện tại
POST /auth/logout

# Game
GET  /api/game/state                  → Poll 2s
POST /api/game/bet                    → { betData: { bau: 10000 } }
GET  /api/game/history

# Deposit
POST /api/deposit/create              → { amount }
GET  /api/deposit/status/:id
POST /webhook/sepay                   → SePay callback

# Gift Code
POST /api/giftcode/redeem             → { code: "ABC123" }  [user authed]

# Admin
GET   /admin/analytics
GET   /admin/transactions             → ?status=&page=
GET   /admin/users                    → ?flagged=true&page=
PATCH /admin/users/:id/balance        → { balance: 50000 }
PATCH /admin/users/:id/unflag
GET   /admin/fraud
GET   /admin/rounds
GET   /admin/giftcodes                → ?active=true&page=
POST  /admin/giftcodes                → { code, amount, maxUses, expiresAt?, note? }
PATCH /admin/giftcodes/:id/toggle
DELETE /admin/giftcodes/:id
```

---

## 🛡️ Security Notes

- Session cookie: `httpOnly`, `secure: true`, `sameSite: none` (production)
- Rate limit deposit: 5 req / phút per user
- Redis distributed lock chống duplicate webhook
- Helmet.js security headers
- Server-side validate toàn bộ — không trust client
- Gift code: kiểm tra per-user đã dùng chưa ở tầng DB

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 App Router, TailwindCSS, Framer Motion |
| Backend | Node.js, Express, Passport.js |
| Database | MongoDB Atlas (Mongoose) |
| Cache | Redis (Upstash) |
| Auth | GitHub OAuth 2.0 |
| Realtime | HTTP Polling 2s |
| Payment | SePay webhook + VietQR |
| Deploy | Render.com + Vercel |

---

## 📁 Changelog

### v2.0
- 🆕 Thêm hệ thống Gift Code (backend model + routes + admin UI)
- 🆕 Admin layout responsive: sticky sidebar desktop, mobile drawer
- 🆕 `api.delete()` helper trong frontend
- 📖 README viết lại đầy đủ

### v1.0
- Game Bầu Cua Tôm Cá realtime
- GitHub OAuth + session
- SePay webhook + VietQR deposit
- Admin panel: analytics, users, transactions, fraud, rounds
- Toast system + DisclaimerModal + ResultPopup

---

*Dự án được cung cấp "nguyên trạng" không có bảo đảm. Tác giả không chịu trách nhiệm về bất kỳ thiệt hại nào phát sinh từ việc sử dụng.*
