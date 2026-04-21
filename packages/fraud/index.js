const { FraudLog } = require('@baucua/db');

const FRAUD_THRESHOLD = 70;

// ─── Score weights ────────────────────────────────────────────────────────────
const SCORES = {
  SPAM_DEPOSIT:       30,  // >5 deposits/min
  AMOUNT_MISMATCH:    50,  // sent different amount than requested
  DUPLICATE_WEBHOOK:  40,  // same webhook hit twice
  MICRO_TRANSACTIONS: 25,  // many tiny deposits
  ABNORMAL_WINRATE:   35   // win rate > 80% over 20+ games
};

// ─── Analyze a deposit event ──────────────────────────────────────────────────
async function analyzeDeposit({ userId, reason, details = {} }) {
  const score = SCORES[reason] || 10;

  // Get recent fraud score for user (last 24h)
  const recent = await FraudLog.find({
    userId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  }).lean();

  const totalScore = recent.reduce((s, l) => s + l.score, 0) + score;

  // Log this event
  const log = await FraudLog.create({
    userId,
    score,
    reasons: [reason],
    details,
    status: totalScore >= FRAUD_THRESHOLD ? 'pending' : 'cleared'
  });

  return {
    score,
    totalScore,
    flagged: totalScore >= FRAUD_THRESHOLD,
    logId: log._id
  };
}

// ─── Check user's 24h fraud score ─────────────────────────────────────────────
async function getUserFraudScore(userId) {
  const recent = await FraudLog.find({
    userId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  }).lean();

  return recent.reduce((s, l) => s + l.score, 0);
}

// ─── Check abnormal win rate ───────────────────────────────────────────────────
async function checkWinRate(userId) {
  const { User } = require('@baucua/db');
  const user = await User.findById(userId).select('gamesPlayed totalBet totalWon').lean();

  if (!user || user.gamesPlayed < 20) return false;

  const winRate = user.totalWon / user.totalBet;
  if (winRate > 0.8) {
    await analyzeDeposit({
      userId,
      reason: 'ABNORMAL_WINRATE',
      details: { winRate, gamesPlayed: user.gamesPlayed }
    });
    return true;
  }
  return false;
}

module.exports = {
  analyzeDeposit,
  getUserFraudScore,
  checkWinRate,
  FRAUD_THRESHOLD,
  SCORES
};
