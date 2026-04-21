const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { Transaction } = require('../models/index');
const User = require('../models/User');
const {
  checkDepositSpam,
  checkDuplicateWebhook,
  checkAmountMismatch,
  logFraud,
  isUserBlocked
} = require('../services/antifraud');

const depositLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Quá nhiều yêu cầu nạp tiền, thử lại sau' }
});

const BANK = process.env.SEPAY_BANK || 'MB';
const ACCOUNT = process.env.SEPAY_ACCOUNT || '0123456789';
const MIN_DEPOSIT = 10000;
const MAX_DEPOSIT = 50000000;

// POST /api/deposit/create
router.post('/create', requireAuth, depositLimiter, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check fraud
    if (await isUserBlocked(userId)) {
      return res.status(403).json({ error: 'Tài khoản bị tạm khóa do hoạt động bất thường' });
    }

    const spamCheck = await checkDepositSpam(userId.toString());
    if (spamCheck.blocked) {
      return res.status(429).json({ error: spamCheck.reason });
    }

    const { amount } = req.body;
    const amt = parseInt(amount);
    
    if (isNaN(amt) || amt < MIN_DEPOSIT) {
      return res.status(400).json({ error: `Số tiền tối thiểu ${MIN_DEPOSIT.toLocaleString()}đ` });
    }
    if (amt > MAX_DEPOSIT) {
      return res.status(400).json({ error: `Số tiền tối đa ${MAX_DEPOSIT.toLocaleString()}đ` });
    }

    // Generate unique content
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    const content = `NAP${userId.toString().slice(-6)}${random}`;

    // Save pending transaction
    const tx = await Transaction.create({
      userId,
      amount: amt,
      content,
      status: 'pending'
    });

    // Build VietQR URL
    const qrUrl = `https://img.vietqr.io/image/${BANK}-${ACCOUNT}-compact.png?amount=${amt}&addInfo=${content}&accountName=BAU+CUA+CASINO`;

    res.json({
      success: true,
      transactionId: tx._id,
      content,
      amount: amt,
      bank: BANK,
      account: ACCOUNT,
      qrUrl,
      expireIn: 600 // 10 minutes
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/deposit/status/:txId
router.get('/status/:txId', requireAuth, async (req, res) => {
  try {
    const tx = await Transaction.findOne({
      _id: req.params.txId,
      userId: req.user._id
    });
    if (!tx) return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    
    const user = await User.findById(req.user._id);
    res.json({ status: tx.status, balance: user.balance });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/deposit/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const txs = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(txs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /webhook/sepay — SePay calls this
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const data = req.body;
    console.log('[WEBHOOK] Received:', JSON.stringify(data));

    const content = data.content || data.description || '';
    const amount = parseInt(data.transferAmount || data.amount || 0);

    // Must start with NAP
    if (!content.startsWith('NAP')) {
      return res.json({ success: false, reason: 'not_our_transaction' });
    }

    // Check duplicate
    const dupCheck = await checkDuplicateWebhook(content);
    if (dupCheck.duplicate) {
      console.warn('[WEBHOOK] Duplicate:', content);
      return res.json({ success: false, reason: 'duplicate' });
    }

    // Find pending transaction by content
    const tx = await Transaction.findOne({ content, status: 'pending' });
    if (!tx) {
      return res.json({ success: false, reason: 'transaction_not_found' });
    }

    // Check amount
    const amountCheck = await checkAmountMismatch(tx.amount, amount);
    if (amountCheck.mismatch) {
      await logFraud(tx.userId, 30, 'amount_mismatch', {
        expected: tx.amount,
        actual: amount,
        content
      });
      
      await Transaction.findByIdAndUpdate(tx._id, {
        status: 'rejected',
        sePayData: data
      });
      
      return res.json({ success: false, reason: 'amount_mismatch' });
    }

    // All good — credit balance
    await Transaction.findByIdAndUpdate(tx._id, {
      status: 'done',
      completedAt: new Date(),
      sePayData: data
    });

    await User.findByIdAndUpdate(tx.userId, {
      $inc: { balance: amount }
    });

    console.log(`[WEBHOOK] Credited ${amount} to user ${tx.userId}`);
    res.json({ success: true });

  } catch (e) {
    console.error('[WEBHOOK] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
