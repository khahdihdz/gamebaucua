const { getRedis } = require('../config/redis');
const User = require('../models/User');
const { FraudLog } = require('../models/index');

const RISK_THRESHOLD = 70;

async function checkDepositSpam(userId) {
  const redis = await getRedis();
  const key = `deposit_count:${userId}`;
  
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60); // 1 minute window
  }
  
  if (count > 5) {
    await logFraud(userId, 40, 'deposit_spam', { count, window: '1m' });
    return { blocked: true, reason: 'Quá nhiều lần nạp tiền trong 1 phút' };
  }
  
  return { blocked: false };
}

async function checkDuplicateWebhook(content) {
  const redis = await getRedis();
  const key = `webhook:${content}`;
  
  const exists = await redis.get(key);
  if (exists) {
    return { duplicate: true };
  }
  
  // Mark as processed (keep 24h)
  await redis.set(key, '1', { EX: 86400 });
  return { duplicate: false };
}

async function checkAmountMismatch(expected, actual) {
  if (actual < expected) {
    return { mismatch: true, reason: `Amount mismatch: expected ${expected}, got ${actual}` };
  }
  return { mismatch: false };
}

async function logFraud(userId, score, reason, details = {}) {
  try {
    await FraudLog.create({ userId, score, reason, details });
    
    // Update user risk score
    const user = await User.findById(userId);
    if (user) {
      const newScore = Math.min(100, user.riskScore + score);
      const shouldFlag = newScore >= RISK_THRESHOLD;
      
      await User.findByIdAndUpdate(userId, {
        riskScore: newScore,
        isFlagged: shouldFlag
      });
      
      if (shouldFlag) {
        console.warn(`[FRAUD] User ${userId} flagged! Score: ${newScore}`);
      }
    }
  } catch (e) {
    console.error('logFraud error:', e.message);
  }
}

async function isUserBlocked(userId) {
  const user = await User.findById(userId);
  return user?.isFlagged || false;
}

module.exports = {
  checkDepositSpam,
  checkDuplicateWebhook,
  checkAmountMismatch,
  logFraud,
  isUserBlocked
};
