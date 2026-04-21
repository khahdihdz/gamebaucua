require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');

const { connectDB } = require('@baucua/db');
const { connectRedis, redisClient } = require('./config/redis');
const { initSocket } = require('./socket');
const { initGameLoop } = require('./services/gameLoop');
const { initBotSystem } = require('./services/botSystem');
const logger = require('./config/logger');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const gameRoutes = require('./routes/game');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for dev, enable in prod
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: [
    process.env.WEB_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// ─── Body Parser ──────────────────────────────────────────────────────────────
// Raw body for SePay webhook signature verification
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));

// ─── Session ──────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'baucua_secret_change_in_prod',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 7 * 24 * 60 * 60 // 7 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// ─── Passport ─────────────────────────────────────────────────────────────────
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await connectDB();
    logger.info('✅ MongoDB connected');

    await connectRedis();
    logger.info('✅ Redis connected');

    const io = initSocket(server);
    logger.info('✅ Socket.IO initialized');

    initGameLoop(io);
    logger.info('✅ Game loop started');

    initBotSystem(io);
    logger.info('✅ Bot system started');

    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      logger.info(`🚀 API server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Bootstrap failed:', err);
    process.exit(1);
  }
}

bootstrap();

module.exports = { app, server };
