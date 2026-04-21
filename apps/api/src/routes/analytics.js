const router = require('express').Router();
const { Transaction, User, GameRound, FraudLog } = require('@baucua/db');
const { isAdmin } = require('../middleware/auth');
const { cacheGet, cacheSet } = require('../config/redis');

router.use(isAdmin);

// ─── Main analytics endpoint ──────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'analytics:main';
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const now = new Date();
    const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek  = new Date(now - 7  * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      depositStats,
      dailyDeposits,
      topDepositors,
      gameStats,
      suspiciousUsers,
      userGrowth
    ] = await Promise.all([
      // Overall deposit stats
      Transaction.aggregate([
        { $match: { type: 'deposit', status: 'completed' } },
        { $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          today: {
            $sum: { $cond: [{ $gte: ['$createdAt', today] }, '$amount', 0] }
          },
          thisWeek: {
            $sum: { $cond: [{ $gte: ['$createdAt', thisWeek] }, '$amount', 0] }
          }
        }}
      ]),

      // Daily deposit chart (last 14 days)
      Transaction.aggregate([
        { $match: { type: 'deposit', status: 'completed', createdAt: { $gte: thisWeek } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),

      // Top 10 depositors
      User.find({ role: 'user' })
        .sort({ totalDeposited: -1 })
        .limit(10)
        .select('username avatar totalDeposited balance gamesPlayed')
        .lean(),

      // Game stats
      GameRound.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: thisMonth } } },
        { $group: {
          _id: null,
          totalRounds: { $sum: 1 },
          totalBets: { $sum: '$totalBets' },
          totalPayout: { $sum: '$totalPayout' },
          houseProfit: { $sum: '$houseProfit' }
        }}
      ]),

      // Suspicious users count by score range
      FraudLog.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: '$userId', maxScore: { $max: '$score' }, count: { $sum: 1 } } },
        { $sort: { maxScore: -1 } },
        { $limit: 20 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: {
          username: '$user.username',
          avatar: '$user.avatar',
          maxScore: 1,
          flagCount: '$count'
        }}
      ]),

      // New users per day (last 7 days)
      User.aggregate([
        { $match: { createdAt: { $gte: thisWeek } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    const ds = depositStats[0] || {};
    const gs = gameStats[0] || {};

    const result = {
      deposits: {
        total: ds.total || 0,
        count: ds.count || 0,
        avgAmount: Math.round(ds.avgAmount || 0),
        today: ds.today || 0,
        thisWeek: ds.thisWeek || 0,
        successRate: ds.count > 0 ? 100 : 0
      },
      games: {
        totalRounds: gs.totalRounds || 0,
        totalBetAmount: gs.totalBets || 0,
        totalPayout: gs.totalPayout || 0,
        houseProfit: gs.houseProfit || 0,
        houseEdge: gs.totalBets > 0
          ? ((gs.houseProfit / gs.totalBets) * 100).toFixed(2)
          : 0
      },
      charts: {
        dailyDeposits,
        userGrowth
      },
      topDepositors,
      suspiciousUsers
    };

    await cacheSet(cacheKey, result, 60); // 1 min cache
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ─── Realtime feed (last N events) ───────────────────────────────────────────
router.get('/feed', async (req, res) => {
  try {
    const [recentDeposits, recentBets, recentFraud] = await Promise.all([
      Transaction.find({ type: 'deposit', status: 'completed' })
        .sort({ createdAt: -1 }).limit(10)
        .populate('userId', 'username avatar').lean(),
      Transaction.find({ type: 'bet' })
        .sort({ createdAt: -1 }).limit(10)
        .populate('userId', 'username').lean(),
      FraudLog.find({ status: 'pending' })
        .sort({ createdAt: -1 }).limit(5)
        .populate('userId', 'username').lean()
    ]);

    res.json({ recentDeposits, recentBets, recentFraud });
  } catch { res.status(500).json({ error: 'server_error' }); }
});

module.exports = router;
