const router = require('express').Router();
const { User, Transaction } = require('@baucua/db');
const { createDepositRequest, verifyWebhookSignature, parseWebhookPayload } = require('@baucua/payment');
const { analyzeDeposit } = require('@baucua/fraud');
const { acquireLock, releaseLock, incrementCounter, cacheSet, cacheGet, cacheDel } = require('../config/redis');
const { emitToUser, emitToAdmin } = require('../socket');
const { isAuthenticated, invalidateUserCache } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const logger = require('../config/logger');

// ─── Create deposit request ───────────────────────────────────────────────────
router.post('/deposit', isAuthenticated, paymentLimiter, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id.toString();

    // Validate amount
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount < 10000) {
      return res.status(400).json({ error: 'min_deposit', message: 'Nạp tối thiểu 10,000 VNĐ.' });
    }
    if (numAmount > 50000000) {
      return res.status(400).json({ error: 'max_deposit', message: 'Nạp tối đa 50,000,000 VNĐ/lần.' });
    }

    // Anti-fraud: check deposit rate (>5/min = fraud signal)
    const depositCountKey = `deposit_count:${userId}`;
    const count = await incrementCounter(depositCountKey, 60 * 1000);
    if (count > 5) {
      await analyzeDeposit({ userId, reason: 'SPAM_DEPOSIT', details: { count, amount: numAmount } });
      return res.status(429).json({ error: 'spam_deposit', message: 'Quá nhiều yêu cầu nạp tiền.' });
    }

    // Generate deposit info
    const deposit = await createDepositRequest({ userId, amount: numAmount });

    // Store pending deposit in Redis (15 min TTL)
    await cacheSet(`pending_deposit:${deposit.content}`, {
      userId,
      amount: numAmount,
      content: deposit.content,
      createdAt: Date.now()
    }, 15 * 60);

    // Create pending transaction
    const tx = await Transaction.create({
      userId,
      type: 'deposit',
      amount: numAmount,
      balanceBefore: req.user.balance,
      balanceAfter: req.user.balance, // updated on webhook
      status: 'pending',
      depositContent: deposit.content,
      expectedAmount: numAmount
    });

    logger.info(`Deposit request: user=${userId} amount=${numAmount} content=${deposit.content}`);

    res.json({
      transactionId: tx._id,
      content: deposit.content,
      amount: numAmount,
      bankCode: deposit.bankCode,
      accountNumber: deposit.accountNumber,
      accountName: deposit.accountName,
      qrDataUrl: deposit.qrDataUrl,
      vietQRUrl: deposit.vietQRUrl,
      expiresAt: deposit.expiresAt
    });
  } catch (err) {
    logger.error('Deposit error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

// ─── SePay Webhook ────────────────────────────────────────────────────────────
// Raw body parser applied in index.js for this route
router.post('/webhook', async (req, res) => {
  // Always respond 200 fast — SePay retries if no 200
  res.status(200).json({ received: true });

  try {
    // Verify signature
    const sig = req.headers['x-sepay-signature'] || req.headers['signature'];
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));

    if (!verifyWebhookSignature(rawBody, sig)) {
      logger.warn('Webhook signature mismatch');
      return;
    }

    const payload = parseWebhookPayload(req.body);
    if (!payload) {
      logger.warn('Webhook: could not parse payload');
      return;
    }

    const { sepayId, content, amount } = payload;

    logger.info(`Webhook received: id=${sepayId} content=${content} amount=${amount}`);

    // ── Anti-duplicate lock (Redis) ──────────────────────────────────────────
    const lockKey = `webhook:${sepayId}`;
    const locked = await acquireLock(lockKey, 10000); // 10s lock
    if (!locked) {
      logger.warn(`Duplicate webhook blocked: ${sepayId}`);
      return;
    }

    try {
      // Check if already processed
      const alreadyProcessed = await cacheGet(`processed_webhook:${sepayId}`);
      if (alreadyProcessed) {
        logger.warn(`Webhook already processed: ${sepayId}`);
        return;
      }

      // Also check DB
      const existingTx = await Transaction.findOne({ sepayTxId: sepayId });
      if (existingTx) {
        logger.warn(`Transaction already exists for sepayId: ${sepayId}`);
        // Fraud signal: duplicate webhook
        if (existingTx.userId) {
          await analyzeDeposit({
            userId: existingTx.userId.toString(),
            reason: 'DUPLICATE_WEBHOOK',
            details: { sepayId, content }
          });
        }
        return;
      }

      // Find pending deposit by content
      const pending = await cacheGet(`pending_deposit:${content}`);
      if (!pending) {
        logger.warn(`No pending deposit found for content: ${content}`);
        return;
      }

      const { userId, amount: expectedAmount } = pending;

      // Verify amount
      if (amount < expectedAmount) {
        logger.warn(`Amount mismatch: expected ${expectedAmount} got ${amount}`);
        await analyzeDeposit({
          userId,
          reason: 'AMOUNT_MISMATCH',
          details: { expected: expectedAmount, received: amount, content }
        });
        // Still credit received amount (not reject — SePay already settled)
      }

      // Anti micro-transaction check
      if (amount < 10000) {
        await analyzeDeposit({
          userId,
          reason: 'MICRO_TRANSACTIONS',
          details: { amount, content }
        });
        logger.warn(`Micro transaction detected: ${amount}`);
        return; // Reject micro deposits
      }

      // ── Credit user balance (atomic) ────────────────────────────────────────
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $inc: {
            balance: amount,
            totalDeposited: amount
          }
        },
        { new: true }
      );

      if (!user) {
        logger.error(`User not found for deposit: ${userId}`);
        return;
      }

      // Update transaction
      await Transaction.findOneAndUpdate(
        { depositContent: content, status: 'pending' },
        {
          $set: {
            status: 'completed',
            balanceAfter: user.balance,
            sepayTxId: sepayId,
            bankCode: payload.bankCode,
            adminNote: `SePay: ${sepayId}`
          }
        }
      );

      // Mark processed in Redis (24h)
      await cacheSet(`processed_webhook:${sepayId}`, true, 24 * 60 * 60);
      await cacheDel(`pending_deposit:${content}`);

      // Invalidate user cache
      await invalidateUserCache(userId);

      logger.info(`Deposit credited: user=${userId} amount=${amount} newBalance=${user.balance}`);

      // Emit realtime events
      emitToUser(userId, 'deposit_success', {
        amount,
        newBalance: user.balance,
        content
      });
      emitToUser(userId, 'balance_update', { balance: user.balance });

      // Admin feed
      emitToAdmin('new_deposit', {
        userId,
        username: user.username,
        amount,
        content,
        sepayId,
        timestamp: Date.now()
      });

    } finally {
      await releaseLock(lockKey);
    }

  } catch (err) {
    logger.error('Webhook processing error:', err);
  }
});

// ─── Check pending deposit status ─────────────────────────────────────────────
router.get('/deposit/:content/status', isAuthenticated, async (req, res) => {
  try {
    const { content } = req.params;
    const tx = await Transaction.findOne({
      depositContent: content,
      userId: req.user._id
    }).lean();

    if (!tx) return res.status(404).json({ error: 'not_found' });
    res.json({ status: tx.status, amount: tx.amount });
  } catch {
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
