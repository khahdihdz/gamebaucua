const mongoose = require('mongoose');
const logger = require('./logger');

// ─── Connection ───────────────────────────────────────────────────────────────
async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/baucua', {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected, retrying...');
  });
}

// ─── User Schema ──────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  githubId:    { type: String, required: true, unique: true },
  username:    { type: String, required: true },
  displayName: { type: String },
  avatar:      { type: String, default: '' },
  email:       { type: String, default: '' },
  balance:     { type: Number, default: 0, min: 0 },
  role:        { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  isBanned:    { type: Boolean, default: false },
  banReason:   { type: String },
  totalDeposited: { type: Number, default: 0 },
  totalBet:    { type: Number, default: 0 },
  totalWon:    { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  lastLoginAt: { type: Date, default: Date.now },
  createdAt:   { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

userSchema.virtual('winRate').get(function () {
  if (this.gamesPlayed === 0) return 0;
  return ((this.totalWon / this.totalBet) * 100).toFixed(2);
});

userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isBanned: 1 });

// ─── Transaction Schema ───────────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['deposit', 'withdraw', 'bet', 'win', 'bonus'], required: true },
  amount:      { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter:  { type: Number, required: true },
  status:      { type: String, enum: ['pending', 'completed', 'failed', 'rejected'], default: 'pending' },
  // For deposits
  depositContent: { type: String }, // NAP_userId_random
  expectedAmount: { type: Number },
  sepayTxId:   { type: String },
  bankCode:    { type: String },
  // For bets
  roundId:     { type: String },
  betChoice:   { type: String }, // 'bau','cua','ca','tom','ga','nai'
  betAmount:   { type: Number },
  winAmount:   { type: Number },
  // Admin
  adminNote:   { type: String },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:  { type: Date }
}, { timestamps: true });

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ depositContent: 1 });
transactionSchema.index({ sepayTxId: 1 }, { unique: true, sparse: true });

// ─── Game Round Schema ─────────────────────────────────────────────────────────
const gameRoundSchema = new mongoose.Schema({
  roundId:     { type: String, required: true, unique: true },
  status:      { type: String, enum: ['betting', 'rolling', 'completed'], default: 'betting' },
  result:      {
    dice1: { type: String, enum: ['bau','cua','ca','tom','ga','nai'] },
    dice2: { type: String, enum: ['bau','cua','ca','tom','ga','nai'] },
    dice3: { type: String, enum: ['bau','cua','ca','tom','ga','nai'] }
  },
  // Forced result from admin
  forcedResult: {
    dice1: { type: String },
    dice2: { type: String },
    dice3: { type: String }
  },
  totalBets:   { type: Number, default: 0 },
  totalPayout: { type: Number, default: 0 },
  houseProfit: { type: Number, default: 0 },
  rtp:         { type: Number, default: 97 }, // RTP % at time of round
  bettingEndsAt: { type: Date },
  rolledAt:    { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

gameRoundSchema.index({ status: 1 });
gameRoundSchema.index({ createdAt: -1 });

// ─── Bet Schema ───────────────────────────────────────────────────────────────
const betSchema = new mongoose.Schema({
  roundId:  { type: String, required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isBot:    { type: Boolean, default: false },
  choices:  [{
    symbol:  { type: String, enum: ['bau','cua','ca','tom','ga','nai'], required: true },
    amount:  { type: Number, required: true, min: 100 }
  }],
  totalBet: { type: Number, required: true },
  winAmount:{ type: Number, default: 0 },
  settled:  { type: Boolean, default: false }
}, { timestamps: true });

betSchema.index({ roundId: 1 });
betSchema.index({ userId: 1, createdAt: -1 });
betSchema.index({ roundId: 1, userId: 1 });

// ─── Fraud Log Schema ─────────────────────────────────────────────────────────
const fraudLogSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score:    { type: Number, required: true },
  reasons:  [{ type: String }],
  details:  { type: mongoose.Schema.Types.Mixed },
  status:   { type: String, enum: ['pending', 'reviewed', 'cleared', 'confirmed'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote: { type: String }
}, { timestamps: true });

fraudLogSchema.index({ userId: 1, createdAt: -1 });
fraudLogSchema.index({ score: -1 });
fraudLogSchema.index({ status: 1 });

// ─── Game Config Schema ────────────────────────────────────────────────────────
const gameConfigSchema = new mongoose.Schema({
  key:         { type: String, required: true, unique: true },
  value:       { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String },
  updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ─── Bot Schema ───────────────────────────────────────────────────────────────
const botSchema = new mongoose.Schema({
  username:   { type: String, required: true, unique: true },
  avatar:     { type: String, default: '' },
  balance:    { type: Number, default: 500000 },
  isActive:   { type: Boolean, default: true },
  personality:{ type: String, enum: ['aggressive', 'conservative', 'random'], default: 'random' },
  chatStyle:  { type: String, enum: ['excited', 'casual', 'angry'], default: 'casual' }
}, { timestamps: true });

// ─── Exports ───────────────────────────────────────────────────────────────────
const User        = mongoose.model('User',        userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const GameRound   = mongoose.model('GameRound',   gameRoundSchema);
const Bet         = mongoose.model('Bet',         betSchema);
const FraudLog    = mongoose.model('FraudLog',    fraudLogSchema);
const GameConfig  = mongoose.model('GameConfig',  gameConfigSchema);
const Bot         = mongoose.model('Bot',         botSchema);

module.exports = {
  connectDB,
  User,
  Transaction,
  GameRound,
  Bet,
  FraudLog,
  GameConfig,
  Bot
};

function logger() {} // stub — replace with real logger in non-package context
