const router = require('express').Router();
const passport = require('passport');
const { authLimiter } = require('../middleware/rateLimiter');
const { isAuthenticated } = require('../middleware/auth');

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────
router.get('/github',
  authLimiter,
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', {
    failureRedirect: `${process.env.WEB_URL}/login?error=oauth_failed`
  }),
  (req, res) => {
    // Successful authentication
    const redirectTo = req.session.returnTo || process.env.WEB_URL || 'http://localhost:3000';
    delete req.session.returnTo;
    res.redirect(redirectTo);
  }
);

// ─── Session check ────────────────────────────────────────────────────────────
router.get('/me', isAuthenticated, (req, res) => {
  const { _id, username, displayName, avatar, balance, role, totalDeposited, gamesPlayed } = req.user;
  res.json({
    id: _id,
    username,
    displayName,
    avatar,
    balance,
    role,
    totalDeposited,
    gamesPlayed
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post('/logout', isAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'logout_failed' });
    req.session.destroy();
    res.json({ success: true, message: 'Đã đăng xuất.' });
  });
});

module.exports = router;
