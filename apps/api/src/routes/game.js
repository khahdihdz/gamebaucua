const router = require('express').Router();
const { isAuthenticated } = require('../middleware/auth');
const { betLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { placeBet, getCurrentRound } = require('../services/gameLoop');
const { GameRound, Bet } = require('@baucua/db');

// ─── Current round state ──────────────────────────────────────────────────────
router.get('/round', (req, res) => {
  const round = getCurrentRound();
  if (!round) return res.json({ status: 'waiting' });
  res.json(round);
});

// ─── Place bet ────────────────────────────────────────────────────────────────
router.post('/bet', isAuthenticated, betLimiter, async (req, res) => {
  try {
    const { choices, roundId } = req.body;

    if (!roundId || !choices) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    const result = await placeBet({
      userId: req.user._id,
      choices,
      roundId
    });

    res.json({
      success: true,
      betId: result.bet._id,
      totalBet: result.bet.totalBet,
      newBalance: result.newBalance
    });
  } catch (err) {
    const errorMap = {
      round_not_betting: { status: 400, message: 'Chưa đến lúc đặt cược.' },
      round_mismatch:    { status: 400, message: 'Ván đã đổi, thử lại.' },
      betting_closed:    { status: 400, message: 'Hết thời gian đặt cược.' },
      already_bet:       { status: 400, message: 'Bạn đã đặt cược ván này.' },
      insufficient_balance: { status: 400, message: 'Số dư không đủ.' },
      min_bet_100:       { status: 400, message: 'Cược tối thiểu 100 xu.' },
      max_bet_10M:       { status: 400, message: 'Cược tối đa 10,000,000 xu.' }
    };

    const mapped = errorMap[err.message];
    if (mapped) return res.status(mapped.status).json({ error: err.message, message: mapped.message });

    res.status(500).json({ error: 'server_error', message: 'Lỗi máy chủ.' });
  }
});

// ─── Round history ────────────────────────────────────────────────────────────
router.get('/history', apiLimiter, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const rounds = await GameRound.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit), 100))
      .select('roundId result totalBets totalPayout createdAt')
      .lean();
    res.json(rounds);
  } catch {
    res.status(500).json({ error: 'server_error' });
  }
});

// ─── My bets for current or specific round ────────────────────────────────────
router.get('/my-bets/:roundId', isAuthenticated, async (req, res) => {
  try {
    const bet = await Bet.findOne({
      roundId: req.params.roundId,
      userId: req.user._id
    }).lean();
    res.json(bet || null);
  } catch {
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
