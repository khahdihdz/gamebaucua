const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

module.exports = function setupPassport() {
  const adminUsers = (process.env.ADMIN_USERS || '').split(',').map(u => u.trim());

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:10000'}/auth/github/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });
      
      const isAdmin = adminUsers.includes(profile.username);
      
      if (!user) {
        user = await User.create({
          githubId: profile.id,
          username: profile.username,
          avatar: profile.photos?.[0]?.value || '',
          role: isAdmin ? 'admin' : 'user',
          balance: 10000 // Welcome bonus 10k
        });
        console.log(`[AUTH] New user: ${profile.username} (${isAdmin ? 'admin' : 'user'})`);
      } else {
        // Update role if needed
        if (isAdmin && user.role !== 'admin') {
          user.role = 'admin';
          await user.save();
        }
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
