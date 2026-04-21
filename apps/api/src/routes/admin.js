const router = require('express').Router();
const { User, Transaction, GameRound, FraudLog, GameConfig, Bot } = require('@baucua/db');
const { isAdmin, isStrictAdmin, invalidateUserCache } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiter');
const { cacheSet, cacheDel } = require('../config/redis');
const { emitToAll } = require('../socket');
const logger = require('../config/logger');

router.use(adminLimiter);
router.use(isAdmin);

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════

router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week  = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeToday,
      totalDepositsToday,
      totalRevenue,
      pendingTx,
      fraudCount,
      recentRounds,
      onlineNow
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ lastLoginAt: { $gte: today } }),
      Transaction.aggregate([
        { $match: { type: 'deposit', status: 'completed', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'deposit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.countDocuments({ type: 'deposit', status: 'pending' }),
      FraudLog.countDocuments({ status: 'pending' }),
      GameRound.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(10)
        .select('roundId result totalBets totalPayout houseProfit createdAt').lean(),
      require('../socket').getOnlineCount()
    ]);

    res.json({
      users: {
        total: totalUsers,
        activeToday,
        onlineNow
      },
      finance: {
        revenueToday: totalDepositsToday[0]?.total || 0,
        depositsToday: totalDepositsToday[0]?.count || 0,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingTransactions: pendingTx
      },
      fraud: { pending: fraudCount },
      recentRounds
    });
  } catch (err) {
    logger.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

// ══════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════════════════════════════

router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, banned } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } }
    ];
    if (role) filter.role = role;
    if (banned !== undefined) filter.isBanned = banned === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .select('-__v').lean(),
      User.countDocuments(filter)
    ]);

    res.json({ users, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch { res.status(500).json({ error: 'server_error' }); }
});

router.patch('/users/:id/balance', isStrictAdmin, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    if (!amount || !reason) return res.status(400).json({ error: 'missing_fields' });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { balance: parseInt(amount) } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    await Transaction.create({
      userId: user._id,
      type: 'bonus',
      amount: parseInt(amount),
      balanceBefore: user.balance - parseInt(amount),
      balanceAfter: user.balance,
      status: 'completed',
      adminNote: `Admin adjustment: ${reason}`,
      reviewedBy: req.user._id
    });

    await invalidateUserCache(user._id.toString());
    logger.info(`Admin ${req.user.username} adjusted balance for ${user.username}: ${amount}`);
    res.json({ success: true, newBalance: user.balance });
  } catch { res.status(500).json({ error: 'server_error' }); }
});

router.patch('/users/:id/ban', isStrictAdmin, async (req, res) => {
  try {
    const { banned, reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: Boolean(banned), banReason: reason || '' },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'user_not_found' });
    await invalidateUserCache(user._id.toString());
    logger.info(`Admin ${req.user.username} ${banned ? 'banned' : 'unbanned'} ${user.username}`);
    res.json({ success: true, isBanned: user.isBanned });
  } catch { res.status(500).json({ error: 'server_error' }); }
});

router.patch('/users/:id/role', isStrictAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ error: 'invalid_role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ error: 'user_not_found' });
    await invalidateUserCache(user._id.toString());
    res.json({ success: true, role: user.role });
  } catch { res.status(500).json({ error: 'server_error' }); }
});

// ══════════════════════════════════════════════════════════════
// TRANSACTION MANAGEMENT
// ══════════════════════════════════════════════════════════════

router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 30, status, type, userId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type)   filter.type   = type;
    if (userId) filter.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'username avatar')
        .lean(),
      Transaction.countDocuments(filter)
    ]);

    res.json({ transactions, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch { res.status(500).json({ error: 'server_error' }); }
});

router.patch('/transactions/:id/review', async (req, res) => {
  try {
    const { action, note } = req.body; // action: 'confirm' | 'reject'
    if (!['confirm', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'invalid_action' });
    }

    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'not_found' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ error: 'already_processed' });
    }

    if (action === 'confirm') {
      const user = await User.findByIdAndUpdate(
        tx.userId,
        { $inc: { balance: tx.amount, totalDeposited: tx.amount } },
        { new: true }
      );
      await tx.updateOne({
        status: 'completed',
        balanceAfter: user.balance,
        adminNote: note,
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      });
      await invalidateUserCache(tx.userId.toString());
      emitToAll('balance_update', { userId: tx.userId, balance: user.balance });
    } else {
      await tx.updateOne({
        status: 'rejected',
        adminNote: note,
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      });
    }

    res.json({ success: true });
  } catch { res.status(500).json({ error: 'server_error' }); }
});

// ══════════════════════════════════════════════════════════════
// FRAUD MONITOR
// ══════════════════════════════════════════════════════════════

router.get('/fraud', async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      FraudLog.find({ status })
        .sort({ score: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'username avatar balance isBanned')
        .lean(),
      FraudLog.countDocuments({ status })
    ]);
    res.json({ logs, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch { res.status(500).json({ error: 'server_error' }); }
});

router.patch('/fraud/:id/review', async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!['reviewed', 'cleared', 'confirmed'].includes(status)) {
      return res.status(400).json({ error: 'invalid_status' });
    }
    await FraudLog.findByIdAndUpdate(req.params.id, {
      status,
      reviewNote: note,
      reviewedBy: req.user._id
    });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'server_error' }); }
});

// ══════════════════════════════════════════════════════════════
// GAME CONTROL
// ══════════════════════════════════════════════════════════════

router.get('/config', async (req, res) => {
  try {
    const configs = await GameConfig.find().lean();
    res.json(configs);
  } catch { res.status(500).json({ error: 'server_error' }); }
});

router.put('/config/:key', isStrictAdmin, async (req, res) => {
  try {
    const { value, description } = req.body;
    await GameConfig.findOneAndUpdate(
      { key: req.params.key },
      { value, description, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    // Invalidate config cache
    await cacheDel(`config:${req.params.key}`);
    logger.info(`Admin ${req.user.username} updated config ${req.params.key} = ${JSON.stringify(value)}`);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'server_error' }); }
});

// Force next round result
router.post('/game/force-result', isStrictAdmin, async (req, res) => {
  try {
    const { dice1, dice2, dice3 } = req.body;
    const SYMBOLS = ['bau', 'cua', 'ca', 'tom', 'ga', 'nai'];
    if (![dice1, dice2, dice3].every(d => SYMBOLS.includes(d))) {
      return res.status(400).json({ error: 'invalid_symbols' });
    }

    const { getCurrentRound } = require('../services/gameLoop');
    const round = getCurrentRound();
    if (!round || round.status !== 'betting') {
      return res.status(400).json({ error: 'no_active_betting_round' });
    }

    await GameRound.updateOne(
      { roundId: round.roundId },
      { forcedResult: { dice1, dice2, dice3 } }
    );

    logger.info(`Admin ${req.user.username} forced result: ${dice1}-${dice2}-${dice3}`);
    res.json({ success: true, roundId: round.roundId });
  } catch { res.status(500).json({ error: 'server_error' }); }
});

// ══════════════════════════════════════════════════════════════
// BOT MANAGEMENT
// ══════════════════════════════════════════════════════════════

router.get('/bots', async (req, res) => {
  try {
    const bots = await Bot.find().lean();
    res.json(bots);
  } catch { res.status(500).json({ error: 'server_error' }); }
});

router.patch('/bots/:id', isStrictAdmin, async (req, res) => {
  try {
    const { isActive, personality, chatStyle } = req.body;
    const bot = await Bot.findByIdAndUpdate(
      req.params.id,
      { ...(isActive !== undefined && { isActive }), personality, chatStyle },
      { new: true }
    );
    res.json(bot);
  } catch { res.status(500).json({ error: 'server_error' }); }
});

module.exports = router;
