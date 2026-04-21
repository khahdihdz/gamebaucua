const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const { Transaction, Bet, Round, FraudLog } = require('../models/index');

// GET /admin/analytics
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      suspiciousUsers,
      revenueAgg,
      pendingTx,
      doneTx,
      todayBets
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isFlagged: true }),
      Transaction.aggregate([
        { $match: { status: 'done' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.countDocuments({ status: 'pending' }),
      Transaction.countDocuments({ status: 'done' }),
      Round.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 86400000) } } },
        { $group: { _id: null, totalProfit: { $sum: '$houseProfit' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      totalUsers,
      suspiciousUsers,
      totalRevenue: revenueAgg[0]?.total || 0,
      pendingTransactions: pendingTx,
      doneTransactions: doneTx,
      todayProfit: todayBets[0]?.totalProfit || 0,
      todayRounds: todayBets[0]?.count || 0
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /admin/transactions
router.get('/transactions', requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    
    const txs = await Transaction.find(filter)
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments(filter);
    res.json({ transactions: txs, total, page: parseInt(page) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /admin/users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { flagged, page = 1, limit = 20 } = req.query;
    const filter = flagged === 'true' ? { isFlagged: true } : {};
    
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    res.json({ users, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /admin/users/:id/balance
router.patch('/users/:id/balance', requireAdmin, async (req, res) => {
  try {
    const { balance } = req.body;
    if (typeof balance !== 'number' || balance < 0) {
      return res.status(400).json({ error: 'Số dư không hợp lệ' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { balance },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User không tồn tại' });
    
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /admin/users/:id/unflag
router.patch('/users/:id/unflag', requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, {
      isFlagged: false,
      riskScore: 0
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /admin/fraud
router.get('/fraud', requireAdmin, async (req, res) => {
  try {
    const logs = await FraudLog.find()
      .populate('userId', 'username avatar riskScore isFlagged')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /admin/rounds
router.get('/rounds', requireAdmin, async (req, res) => {
  try {
    const rounds = await Round.find()
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(rounds);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
