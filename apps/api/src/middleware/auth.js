const { cacheGet, cacheSet } = require('../config/redis');
const { User } = require('@baucua/db');

// ─── Base auth check ──────────────────────────────────────────────────────────
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    if (req.user.isBanned) {
      return res.status(403).json({
        error: 'account_banned',
        message: req.user.banReason || 'Tài khoản của bạn đã bị khóa.'
      });
    }
    return next();
  }
  return res.status(401).json({ error: 'unauthorized', message: 'Vui lòng đăng nhập.' });
}

// ─── Admin only ───────────────────────────────────────────────────────────────
function isAdmin(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ error: 'forbidden', message: 'Không có quyền truy cập.' });
  }
  next();
}

// ─── Strict admin only ────────────────────────────────────────────────────────
function isStrictAdmin(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}

// ─── Attach fresh user data ───────────────────────────────────────────────────
async function attachUser(req, res, next) {
  if (!req.user) return next();

  try {
    const cacheKey = `user:${req.user._id}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      req.user = cached;
      return next();
    }

    const fresh = await User.findById(req.user._id).select('-__v').lean();
    if (fresh) {
      await cacheSet(cacheKey, fresh, 30); // 30s cache
      req.user = fresh;
    }
    next();
  } catch (err) {
    next(); // Don't block on cache error
  }
}

// ─── Invalidate user cache ────────────────────────────────────────────────────
async function invalidateUserCache(userId) {
  const { cacheDel } = require('../config/redis');
  await cacheDel(`user:${userId}`);
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isStrictAdmin,
  attachUser,
  invalidateUserCache
};
