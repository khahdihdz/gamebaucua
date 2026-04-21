const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const { User } = require('@baucua/db');
const logger = require('./logger');

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL || 'http://localhost:4000'}/api/auth/github/callback`,
  scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user
    let user = await User.findOne({ githubId: profile.id });

    if (!user) {
      user = await User.create({
        githubId: profile.id,
        username: profile.username,
        displayName: profile.displayName || profile.username,
        avatar: profile.photos?.[0]?.value || '',
        email: profile.emails?.[0]?.value || '',
        balance: 10000, // Welcome bonus: 10,000 xu
        role: 'user'
      });
      logger.info(`New user registered: ${user.username}`);
    } else {
      // Update avatar + displayName on each login
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      user.lastLoginAt = new Date();
      await user.save();
    }

    return done(null, user);
  } catch (err) {
    logger.error('GitHub OAuth error:', err);
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-__v');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
