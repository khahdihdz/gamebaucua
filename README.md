# 🎲 Bầu Cua Casino — Production-Ready

Casino Bầu Cua Tôm Cá trực tuyến với polling realtime, GitHub OAuth, thanh toán SePay tự động, popup thông báo, và admin panel đầy đủ.

---

## ⚠️ TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM

> **ĐỌC KỸ TRƯỚC KHI SỬ DỤNG**

### 🔞 Độ tuổi
Dự án này **CHỈ dành cho người từ 18 tuổi trở lên**. Nếu bạn chưa đủ 18 tuổi, vui lòng **không sử dụng** dưới bất kỳ hình thức nào.

### 🎮 Mục đích sử dụng
Đây là dự án **mã nguồn mở, phi lợi nhuận**, được xây dựng hoàn toàn với mục đích:
- **Học tập** các công nghệ web (Next.js, Node.js, MongoDB, Redis, OAuth, Webhook)
- **Nghiên cứu** kiến trúc hệ thống realtime và thanh toán tự động
- **Demo kỹ thuật** cho cộng đồng lập trình viên

Dự án này **KHÔNG** phải là sòng bạc thực sự, **KHÔNG** nhằm mục đích kinh doanh, và **KHÔNG** khuyến khích hoạt động cờ bạc.

### ⚖️ Trách nhiệm pháp lý
- Người triển khai và vận hành có **toàn bộ trách nhiệm** đảm bảo tuân thủ pháp luật địa phương
- Tại nhiều quốc gia, vận hành dịch vụ cờ bạc trực tuyến không có giấy phép là **vi phạm pháp luật**
- Tác giả và cộng tác viên **không chịu bất kỳ trách nhiệm pháp lý nào** phát sinh từ việc sử dụng mã nguồn này
- Nếu bạn không chắc về tính hợp pháp, hãy **tham khảo luật sư** trước khi triển khai

### 💸 Rủi ro tài chính
- Tác giả **không chịu trách nhiệm** về bất kỳ tổn thất tài chính nào
- Cờ bạc có thể gây **nghiện** và ảnh hưởng nghiêm trọng đến sức khỏe tâm thần
- **Đặt giới hạn** cho bản thân và biết dừng đúng lúc
- Nếu bạn hoặc người thân gặp vấn đề với cờ bạc, hãy liên hệ đường dây hỗ trợ tại địa phương

### 🛡️ Bảo mật & Dữ liệu
- Mã nguồn được cung cấp **"nguyên trạng" (AS-IS)** không có bảo đảm
- Người dùng chịu trách nhiệm về **bảo mật** khi triển khai production
- **Không lưu trữ** thông tin thẻ tín dụng hay dữ liệu nhạy cảm trong hệ thống này

### 📄 Giấy phép
```
MIT License — Tự do sử dụng, sao chép, sửa đổi, nhưng phải giữ nguyên thông báo bản quyền.
Tác giả không chịu trách nhiệm về bất kỳ thiệt hại nào phát sinh từ việc sử dụng phần mềm.
```

---

## 🏗️ Kiến trúc

```
baucua/
├── backend/                  # Node.js + Express (deploy Render)
│   ├── server.js             # Entry point
│   ├── models/               # MongoDB Mongoose schemas
│   │   ├── User.js
│   │   └── index.js          # Transaction, Bet, Round, FraudLog
│   ├── routes/
│   │   ├── auth.js           # GitHub OAuth
│   │   ├── game.js           # Game state + betting
│   │   ├── deposit.js        # SePay webhook + VietQR
│   │   └── admin.js          # Admin API
│   ├── services/
│   │   ├── gameEngine.js     # Game loop + Redis state
│   │   └── antifraud.js      # Fraud detection
│   └── config/
│       ├── passport.js       # GitHub strategy
│       └── redis.js          # Redis client + lock
│
└── frontend/                 # Next.js 14 App Router (deploy Vercel)
    ├── app/
    │   ├── layout.tsx         # Root: Toast + Disclaimer
    │   ├── page.tsx           # Game + ResultPopup
    │   ├── deposit/           # Nạp tiền + QR
    │   └── admin/             # Dashboard, Transactions, Users, Fraud, Rounds
    ├── components/
    │   ├── Toast.tsx          # 🆕 Global toast notifications
    │   ├── DisclaimerModal.tsx # 🆕 Disclaimer popup (first visit)
    │   ├── ResultPopup.tsx    # 🆕 Win/loss result popup
    │   ├── BettingBoard.tsx
    │   ├── DiceResult.tsx
    │   ├── PhaseTimer.tsx
    │   └── Navbar.tsx
    └── lib/
        ├── api.ts
        ├── useAuth.tsx
        ├── useGameState.ts    # Polling 2s
        └── symbols.ts
```

---

## 🆕 Popup & Thông báo

### DisclaimerModal
- Hiện **tự động khi vào trang lần đầu**
- Lưu trạng thái vào `localStorage` — không hiện lại sau khi đồng ý
- Yêu cầu tick checkbox **"Tôi đã đọc và đồng ý"** mới cho phép tiếp tục
- Nút "Rời khỏi trang" redirect sang google.com
- Nội dung: độ tuổi 18+, pháp lý, rủi ro tài chính, cảnh báo nghiện

### ResultPopup
- Hiện **tự động sau mỗi ván** nếu người dùng có đặt cược
- Animation flip xúc xắc + hiệu ứng 🏆 win / 💀 lose
- Hiển thị breakdown từng ô: số tiền cược × số lần khớp
- Tự đóng sau 5 giây hoặc click dismiss
- Tính lợi nhuận/thua lỗ chính xác

### Toast System
- **4 loại:** success ✅ / error ❌ / warning ⚠️ / info ℹ️
- Progress bar đếm ngược TTL (mặc định 4s)
- Stack tối đa 5 toast, vị trí top-right
- Được dùng tại: đặt cược thành công/thất bại, nạp tiền, lỗi API
- Hook: `const { success, error, warning, info } = useToast()`

---

## ⚡ Quick Start

### Backend

```bash
cd backend
cp .env.example .env
# Điền đủ các biến môi trường
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

1. Tạo **Web Service** mới
2. Connect GitHub → chọn folder `backend/`
3. **Build:** `npm install` | **Start:** `node server.js`
4. Thêm ENV vars:

| Key | Value |
|-----|-------|
| `PORT` | `10000` |
| `NODE_ENV` | `production` |
| `MONGO_URI` | `mongodb+srv://...` |
| `REDIS_URL` | Redis URL (Upstash free tier) |
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret |
| `SESSION_SECRET` | Random ≥ 32 ký tự |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `BACKEND_URL` | `https://your-backend.onrender.com` |
| `SEPAY_BANK` | Mã NH: `MB`, `VCB`, `TCB`... |
| `SEPAY_ACCOUNT` | Số tài khoản |
| `ADMIN_USERS` | GitHub username, cách nhau dấu phẩy |

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
# Thêm env: NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 🔑 GitHub OAuth Setup

1. **GitHub → Settings → Developer settings → OAuth Apps → New**
2. Homepage: `https://your-app.vercel.app`
3. Callback: `https://your-backend.onrender.com/auth/github/callback`
4. Copy Client ID + Secret → Render ENV

---

## 💰 SePay Webhook

1. Đăng ký [SePay.vn](https://sepay.vn) → thêm tài khoản ngân hàng
2. Webhook URL: `https://your-backend.onrender.com/webhook/sepay`
3. Format nội dung CK: `NAP{userId_6chars}{random_5chars}` — hệ thống tự sinh

---

## 🎮 Game Loop

```
BETTING (10s) ──► ROLLING (5s) ──► RESULT (3s) ──► BETTING ...

Server: tick() mỗi 1s → cập nhật Redis (TTL 2s)
Client: poll GET /api/game/state mỗi 2s
```

**Tỷ lệ thưởng:** 1 khớp = 1x + hoàn vốn | 2 khớp = 2x + hoàn vốn | 3 khớp = 3x + hoàn vốn

---

## 🔒 Anti-Fraud

| Rule | Ngưỡng | Điểm Risk |
|------|--------|-----------|
| Spam nạp tiền | >5 lần/phút | +40 |
| Sai số tiền CK | Thực tế < Yêu cầu | +30 |
| Duplicate webhook | Content đã xử lý | Block ngay |
| Risk ≥ 70 | — | 🚨 Khóa TK |

---

## 📡 API Reference

```
# Auth
GET  /auth/github           → OAuth redirect
GET  /auth/me               → User hiện tại
POST /auth/logout

# Game
GET  /api/game/state        → Poll 2s
POST /api/game/bet          → { betData: { bau: 10000 } }
GET  /api/game/history

# Deposit
POST /api/deposit/create    → { amount }
GET  /api/deposit/status/:id
POST /webhook/sepay         → SePay callback

# Admin
GET   /admin/analytics
GET   /admin/transactions
GET   /admin/users
PATCH /admin/users/:id/balance
PATCH /admin/users/:id/unflag
GET   /admin/fraud
GET   /admin/rounds
```

---

## 🛡️ Security Notes

- Session cookie: `httpOnly`, `secure: true`, `sameSite: none` (production)
- Rate limit deposit: 5 req/phút
- Redis distributed lock chống duplicate webhook
- Helmet.js security headers
- Server-side validate toàn bộ — không trust client

---

## 📦 Tech Stack

| | Tech |
|--|------|
| Frontend | Next.js 14 App Router, TailwindCSS, Framer Motion |
| Backend | Node.js, Express, Passport.js |
| Database | MongoDB Atlas (Mongoose) |
| Cache | Redis (Upstash) |
| Auth | GitHub OAuth 2.0 |
| Realtime | HTTP Polling 2s |
| Payment | SePay webhook + VietQR |
| Deploy | Render.com + Vercel |

---

*Dự án này được cung cấp "nguyên trạng" không có bảo đảm. Tác giả không chịu trách nhiệm về bất kỳ thiệt hại nào phát sinh từ việc sử dụng.*
