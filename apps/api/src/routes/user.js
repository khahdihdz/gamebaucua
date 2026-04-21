const router = require('express').Router();
const { User, Transaction } = require('@baucua/db');
const { isAuthenticated } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(apiLimiter);
router.use(isAuthenticated);

// ─── Get profile ──────────────────────────────────────────────────────────────
router.get('/profile', (req, res) => {
  const user = req.user;
  res.json({
    id: user._id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    balance: user.balance,
    role: user.role,
    totalDeposited: user.totalDeposited,
    totalBet: user.totalBet,
    totalWon: user.totalWon,
    gamesPlayed: user.gamesPlayed,
    createdAt: user.createdAt
  });
});

// ─── Transaction history ──────────────────────────────────────────────────────
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const filter = { userId: req.user._id };
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ─── Leaderboard ──────────────────────────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const { by = 'totalWon', limit = 20 } = req.query;
    const validSort = ['totalWon', 'totalBet', 'gamesPlayed', 'balance'];
    const sortField = validSort.includes(by) ? by : 'totalWon';

    const leaders = await User.find({ role: 'user', isBanned: false })
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .select('username displayName avatar balance totalWon totalBet gamesPlayed')
      .lean();

    res.json(leaders);
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
