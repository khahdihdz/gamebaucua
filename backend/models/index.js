const mongoose = require('mongoose');

// Transaction
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  content: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'done', 'rejected'], default: 'pending' },
  sePayData: { type: Object },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

// Bet
const betSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roundId: { type: String, required: true },
  betData: {
    type: Map,
    of: Number  // { bau: 10000, cua: 5000, ... }
  },
  totalBet: { type: Number, default: 0 },
  winAmount: { type: Number, default: 0 },
  isWin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Round
const roundSchema = new mongoose.Schema({
  roundId: { type: String, required: true, unique: true },
  result: {
    dice1: { type: String }, // bau, cua, tom, ca, ga, nai
    dice2: { type: String },
    dice3: { type: String }
  },
  totalBets: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  houseProfit: { type: Number, default: 0 },
  phase: { type: String, enum: ['betting', 'rolling', 'result'] },
  createdAt: { type: Date, default: Date.now }
});

// FraudLog
const fraudLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  reason: { type: String, required: true },
  details: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Transaction: mongoose.model('Transaction', transactionSchema),
  Bet: mongoose.model('Bet', betSchema),
  Round: mongoose.model('Round', roundSchema),
  FraudLog: mongoose.model('FraudLog', fraudLogSchema)
};
