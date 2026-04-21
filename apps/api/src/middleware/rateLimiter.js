const rateLimit = require('express-rate-limit');
const { redisClient } = require('../config/redis');

// ─── Redis-backed store for rate-limit ────────────────────────────────────────
function createRedisStore(prefix) {
  return {
    async increment(key) {
      const fullKey = `ratelimit:${prefix}:${key}`;
      const multi = redisClient.multi();
      multi.incr(fullKey);
      multi.pexpire(fullKey, 60 * 1000); // 1 min window
      const results = await multi.exec();
      return { totalHits: results[0][1], resetTime: new Date(Date.now() + 60000) };
    },
    async decrement(key) {
      const fullKey = `ratelimit:${prefix}:${key}`;
      await redisClient.decr(fullKey);
    },
    async resetKey(key) {
      const fullKey = `ratelimit:${prefix}:${key}`;
      await redisClient.del(fullKey);
    }
  };
}

// ─── General API rate limit ───────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'rate_limit', message: 'Quá nhiều yêu cầu, thử lại sau.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ─── Auth endpoints (stricter) ────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { error: 'rate_limit', message: 'Quá nhiều lần đăng nhập, thử lại sau 15 phút.' }
});

// ─── Payment endpoints ────────────────────────────────────────────────────────
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'rate_limit', message: 'Quá nhiều yêu cầu nạp tiền. Tối đa 5 lần/phút.' },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip
});

// ─── Bet endpoints ────────────────────────────────────────────────────────────
const betLimiter = rateLimit({
  windowMs: 1000, // 1s
  max: 3,
  message: { error: 'rate_limit', message: 'Đặt cược quá nhanh.' },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip
});

// ─── Admin endpoints ──────────────────────────────────────────────────────────
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'rate_limit', message: 'Rate limit exceeded.' }
});

module.exports = {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  betLimiter,
  adminLimiter
};
