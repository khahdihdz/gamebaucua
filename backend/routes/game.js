const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getGameState } = require('../services/gameEngine');
const { Bet } = require('../models/index');
const User = require('../models/User');

// GET /api/game/state — polling endpoint
router.get('/state', async (req, res) => {
  try {
    const state = await getGameState();
    
    // Add user bet info if logged in
    if (req.isAuthenticated() && state) {
      const myBet = await Bet.findOne({
        userId: req.user._id,
        roundId: state.roundId
      });
      return res.json({ ...state, myBet: myBet || null });
    }
    
    res.json(state || { error: 'Game not started' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/game/bet
router.post('/bet', requireAuth, async (req, res) => {
  try {
    const { betData } = req.body; // { bau: 10000, cua: 5000 }
    
    if (!betData || typeof betData !== 'object') {
      return res.status(400).json({ error: 'betData không hợp lệ' });
    }

    const state = await getGameState();
    if (!state || state.phase !== 'betting') {
      return res.status(400).json({ error: 'Không phải thời gian đặt cược' });
    }

    const SYMBOLS = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
    const MIN_BET = 1000;
    const MAX_BET_PER_SYMBOL = 500000;

    let totalBet = 0;
    const cleanBetData = new Map();
    
    for (const [symbol, amount] of Object.entries(betData)) {
      if (!SYMBOLS.includes(symbol)) continue;
      const amt = parseInt(amount);
      if (isNaN(amt) || amt < MIN_BET) continue;
      if (amt > MAX_BET_PER_SYMBOL) {
        return res.status(400).json({ error: `Tối đa ${MAX_BET_PER_SYMBOL.toLocaleString()}đ mỗi ô` });
      }
      cleanBetData.set(symbol, amt);
      totalBet += amt;
    }

    if (totalBet === 0) {
      return res.status(400).json({ error: 'Không có cược hợp lệ' });
    }

    // Check balance
    const user = await User.findById(req.user._id);
    if (user.balance < totalBet) {
      return res.status(400).json({ error: 'Số dư không đủ' });
    }

    // Check existing bet this round
    const existingBet = await Bet.findOne({ userId: req.user._id, roundId: state.roundId });
    if (existingBet) {
      return res.status(400).json({ error: 'Đã đặt cược round này rồi' });
    }

    // Deduct balance
    await User.findByIdAndUpdate(req.user._id, { $inc: { balance: -totalBet } });

    // Save bet
    const bet = await Bet.create({
      userId: req.user._id,
      roundId: state.roundId,
      betData: cleanBetData,
      totalBet
    });

    res.json({ success: true, bet, newBalance: user.balance - totalBet });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/game/history — user bet history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(bets);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
