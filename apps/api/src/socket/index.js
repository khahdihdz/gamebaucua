const { Server } = require('socket.io');
const logger = require('../config/logger');
const { User } = require('@baucua/db');

let io;
// Map socketId → userId for fast lookup
const socketUserMap = new Map();
// Map userId → Set of socketIds (user can have multiple tabs)
const userSocketMap = new Map();

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.WEB_URL || 'http://localhost:3000',
        process.env.ADMIN_URL || 'http://localhost:3001'
      ],
      credentials: true
    },
    pingTimeout: 20000,
    pingInterval: 25000
  });

  // ─── Auth middleware ───────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    const session = socket.request.session;

    if (!session?.passport?.user) {
      // Allow unauthenticated for spectating
      socket.userId = null;
      socket.isGuest = true;
      return next();
    }

    try {
      const user = await User.findById(session.passport.user)
        .select('_id username avatar balance role isBanned')
        .lean();

      if (!user) return next(new Error('user_not_found'));
      if (user.isBanned) return next(new Error('account_banned'));

      socket.userId = user._id.toString();
      socket.user = user;
      socket.isGuest = false;
      next();
    } catch (err) {
      next(new Error('auth_error'));
    }
  });

  // ─── Game namespace ────────────────────────────────────────────────────────
  const gameNS = io.of('/game');

  gameNS.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} user:${socket.userId || 'guest'}`);

    // Track connections
    if (socket.userId) {
      socketUserMap.set(socket.id, socket.userId);
      if (!userSocketMap.has(socket.userId)) {
        userSocketMap.set(socket.userId, new Set());
      }
      userSocketMap.get(socket.userId).add(socket.id);
    }

    // Join main game room
    socket.join('game:main');

    // Join personal room for targeted events
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Send current game state on connect
    socket.on('get_state', () => {
      const { getCurrentRound } = require('../services/gameLoop');
      socket.emit('game_state', getCurrentRound());
    });

    // Chat message
    socket.on('chat_message', (data) => {
      if (socket.isGuest) return;
      const { message } = data;
      if (!message || typeof message !== 'string') return;
      const clean = message.slice(0, 200).trim();
      if (!clean) return;

      gameNS.to('game:main').emit('chat_message', {
        userId: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
        message: clean,
        timestamp: Date.now()
      });
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        socketUserMap.delete(socket.id);
        const userSockets = userSocketMap.get(socket.userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) userSocketMap.delete(socket.userId);
        }
      }
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  // ─── Admin namespace ───────────────────────────────────────────────────────
  const adminNS = io.of('/admin');
  adminNS.use(async (socket, next) => {
    const session = socket.request.session;
    if (!session?.passport?.user) return next(new Error('unauthorized'));
    try {
      const user = await User.findById(session.passport.user).select('role').lean();
      if (!user || !['admin', 'moderator'].includes(user.role)) {
        return next(new Error('forbidden'));
      }
      socket.userId = user._id.toString();
      next();
    } catch { next(new Error('auth_error')); }
  });

  adminNS.on('connection', (socket) => {
    socket.join('admin:feed');
    logger.info(`Admin socket connected: ${socket.userId}`);
  });

  return io;
}

// ─── Emit helpers (called from services) ──────────────────────────────────────
function emitToUser(userId, event, data) {
  if (!io) return;
  io.of('/game').to(`user:${userId}`).emit(event, data);
}

function emitToAll(event, data) {
  if (!io) return;
  io.of('/game').to('game:main').emit(event, data);
}

function emitToAdmin(event, data) {
  if (!io) return;
  io.of('/admin').to('admin:feed').emit(event, data);
}

function getOnlineCount() {
  if (!io) return 0;
  return io.of('/game').sockets.size;
}

module.exports = { initSocket, emitToUser, emitToAll, emitToAdmin, getOnlineCount };
