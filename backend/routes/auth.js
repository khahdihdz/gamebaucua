const express = require('express');
const router = express.Router();
const passport = require('passport');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/login?error=auth_failed` }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}?login=success`);
  }
);

// GET /auth/me
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ user: null });
  }
  const { _id, username, avatar, balance, role, riskScore, isFlagged } = req.user;
  res.json({ user: { _id, username, avatar, balance, role, riskScore, isFlagged } });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

module.exports = router;
