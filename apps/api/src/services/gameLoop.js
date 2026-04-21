const { v4: uuidv4 } = require('uuid');
const { GameRound, Bet, User, Transaction, GameConfig } = require('@baucua/db');
const { emitToAll, emitToUser, emitToAdmin } = require('../socket');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');
const logger = require('../config/logger');

const SYMBOLS = ['bau', 'cua', 'ca', 'tom', 'ga', 'nai'];
const BET_DURATION_MS  = 10000; // 10s
const ROLL_DURATION_MS =  5000; // 5s
const RESULT_SHOW_MS   =  3000; // 3s before next round

let currentRound = null;
let gameLoopTimer = null;
let defaultRTP = 97; // configurable from admin

// ─── RTP Engine ───────────────────────────────────────────────────────────────
// Controls house edge. If bets are heavy on one symbol, force the other.
// rtp = 97 means house keeps ~3% over time.
async function rollWithRTP(bets) {
  const rtp = await getConfigValue('rtp', defaultRTP);

  // If admin forced a result, use it
  if (currentRound?.forcedResult?.dice1) {
    const { dice1, dice2, dice3 } = currentRound.forcedResult;
    return { dice1, dice2, dice3 };
  }

  // Calculate bet distribution
  const betBySymbol = {};
  SYMBOLS.forEach(s => betBySymbol[s] = 0);
  bets.forEach(bet => {
    bet.choices.forEach(c => {
      betBySymbol[c.symbol] = (betBySymbol[c.symbol] || 0) + c.amount;
    });
  });

  const totalBetAmount = Object.values(betBySymbol).reduce((a, b) => a + b, 0);

  // If very little bet, full random
  if (totalBetAmount < 1000) {
    return randomRoll();
  }

  // Weight dice against heavily bet symbols (house edge)
  const shouldApplyEdge = Math.random() * 100 > rtp; // ~3% of rounds go full house

  if (shouldApplyEdge) {
    // Roll to minimize payout — avoid most-bet symbols
    const sortedByBet = [...SYMBOLS].sort((a, b) => betBySymbol[b] - betBySymbol[a]);
    const leastBet = sortedByBet.slice(3); // bottom 3 symbols
    return {
      dice1: leastBet[Math.floor(Math.random() * leastBet.length)],
      dice2: leastBet[Math.floor(Math.random() * leastBet.length)],
      dice3: leastBet[Math.floor(Math.random() * leastBet.length)]
    };
  }

  return randomRoll();
}

function randomRoll() {
  return {
    dice1: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    dice2: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    dice3: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  };
}

// ─── Payout calculation ────────────────────────────────────────────────────────
// 1 match = 1x, 2 matches = 2x, 3 matches = 3x (bet returned + winnings)
function calculatePayout(choices, result) {
  let totalWin = 0;
  const resultSymbols = [result.dice1, result.dice2, result.dice3];

  choices.forEach(({ symbol, amount }) => {
    const matchCount = resultSymbols.filter(d => d === symbol).length;
    if (matchCount > 0) {
      totalWin += amount * (matchCount + 1); // return bet + matchCount * bet
    }
  });

  return totalWin;
}

// ─── Settle all bets for a round ──────────────────────────────────────────────
async function settleBets(round) {
  const bets = await Bet.find({ roundId: round.roundId, settled: false, isBot: false });
  logger.info(`Settling ${bets.length} bets for round ${round.roundId}`);

  const bulkOps = [];
  const userUpdates = {};
  let totalPayout = 0;

  for (const bet of bets) {
    const winAmount = calculatePayout(bet.choices, round.result);
    totalPayout += winAmount;

    // Accumulate per user
    const uid = bet.userId.toString();
    if (!userUpdates[uid]) userUpdates[uid] = { won: 0, bet: bet.totalBet };
    else userUpdates[uid].bet += bet.totalBet;
    userUpdates[uid].won += winAmount;

    bulkOps.push({
      updateOne: {
        filter: { _id: bet._id },
        update: { $set: { winAmount, settled: true } }
      }
    });
  }

  if (bulkOps.length > 0) await Bet.bulkWrite(bulkOps);

  // Update user balances + emit results
  for (const [userId, { won, bet }] of Object.entries(userUpdates)) {
    const user = await User.findByIdAndUpdate(userId, {
      $inc: {
        balance: won,          // add winnings (bet was deducted at bet time)
        totalWon: won,
        gamesPlayed: 1
      }
    }, { new: true }).select('balance username');

    // Create win transaction if won anything
    if (won > 0) {
      await Transaction.create({
        userId,
        type: 'win',
        amount: won,
        balanceBefore: user.balance - won,
        balanceAfter: user.balance,
        status: 'completed',
        roundId: round.roundId
      });
    }

    // Emit personal result + balance update
    emitToUser(userId, 'round_result', {
      roundId: round.roundId,
      result: round.result,
      winAmount: won,
      newBalance: user.balance
    });
    emitToUser(userId, 'balance_update', { balance: user.balance });

    // Invalidate user cache
    const { invalidateUserCache } = require('../middleware/auth');
    await invalidateUserCache(userId);
  }

  return totalPayout;
}

// ─── Main game loop ────────────────────────────────────────────────────────────
async function runRound() {
  const roundId = uuidv4();
  const bettingEndsAt = new Date(Date.now() + BET_DURATION_MS);

  // Create round in DB
  const round = await GameRound.create({
    roundId,
    status: 'betting',
    bettingEndsAt,
    rtp: await getConfigValue('rtp', defaultRTP)
  });

  currentRound = { roundId, status: 'betting', bettingEndsAt: bettingEndsAt.getTime() };
  await cacheSet('game:current_round', currentRound, 30);

  // Emit new round to all players
  emitToAll('new_round', {
    roundId,
    status: 'betting',
    bettingEndsAt: bettingEndsAt.getTime(),
    timeLeft: BET_DURATION_MS
  });

  logger.info(`Round ${roundId} started — betting phase`);

  // Wait for betting phase
  await sleep(BET_DURATION_MS);

  // Transition to rolling
  currentRound.status = 'rolling';
  await GameRound.updateOne({ roundId }, { status: 'rolling' });
  await cacheSet('game:current_round', currentRound, 10);

  emitToAll('round_rolling', { roundId });
  logger.info(`Round ${roundId} — rolling dice`);

  // Fetch all bets and roll
  const allBets = await Bet.find({ roundId, settled: false });
  const result = await rollWithRTP(allBets);

  await sleep(ROLL_DURATION_MS);

  // Update round with result
  const updatedRound = await GameRound.findOneAndUpdate(
    { roundId },
    { status: 'completed', result, rolledAt: new Date(), completedAt: new Date() },
    { new: true }
  );

  currentRound = { ...currentRound, status: 'completed', result };
  await cacheSet('game:current_round', currentRound, 60);

  // Emit result to all
  emitToAll('round_completed', { roundId, result });
  logger.info(`Round ${roundId} result: ${JSON.stringify(result)}`);

  // Settle bets
  const totalPayout = await settleBets(updatedRound);
  const totalBetAmount = allBets.reduce((s, b) => s + b.totalBet, 0);
  const houseProfit = totalBetAmount - totalPayout;

  await GameRound.updateOne({ roundId }, { totalBets: totalBetAmount, totalPayout, houseProfit });

  // Admin analytics feed
  emitToAdmin('round_summary', {
    roundId,
    result,
    totalBets: allBets.length,
    totalBetAmount,
    totalPayout,
    houseProfit
  });

  logger.info(`Round ${roundId} settled. Bets:${totalBetAmount} Payout:${totalPayout} Profit:${houseProfit}`);

  // Brief pause then next round
  await sleep(RESULT_SHOW_MS);
}

// ─── Loop runner ──────────────────────────────────────────────────────────────
async function gameLoopRunner() {
  while (true) {
    try {
      await runRound();
    } catch (err) {
      logger.error('Game loop error:', err);
      await sleep(3000); // Brief pause on error
    }
  }
}

function initGameLoop(io) {
  gameLoopRunner();
}

function getCurrentRound() {
  return currentRound;
}

// ─── Place bet (called from routes) ───────────────────────────────────────────
async function placeBet({ userId, choices, roundId }) {
  // Validate round exists and is in betting phase
  if (!currentRound || currentRound.status !== 'betting') {
    throw new Error('round_not_betting');
  }

  if (currentRound.roundId !== roundId) {
    throw new Error('round_mismatch');
  }

  if (Date.now() > currentRound.bettingEndsAt) {
    throw new Error('betting_closed');
  }

  // Validate choices
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error('invalid_choices');
  }

  for (const { symbol, amount } of choices) {
    if (!SYMBOLS.includes(symbol)) throw new Error(`invalid_symbol:${symbol}`);
    if (!amount || amount < 100) throw new Error('min_bet_100');
    if (amount > 10000000) throw new Error('max_bet_10M');
  }

  const totalBet = choices.reduce((s, c) => s + c.amount, 0);

  // Check for existing bet in this round
  const existingBet = await Bet.findOne({ roundId, userId });
  if (existingBet) throw new Error('already_bet');

  // Deduct from balance (atomic)
  const user = await User.findOneAndUpdate(
    { _id: userId, balance: { $gte: totalBet } },
    { $inc: { balance: -totalBet, totalBet: totalBet } },
    { new: true }
  );

  if (!user) throw new Error('insufficient_balance');

  // Record bet
  const bet = await Bet.create({
    roundId,
    userId,
    choices,
    totalBet,
    isBot: false
  });

  // Record transaction
  await Transaction.create({
    userId,
    type: 'bet',
    amount: -totalBet,
    balanceBefore: user.balance + totalBet,
    balanceAfter: user.balance,
    status: 'completed',
    roundId,
    betAmount: totalBet
  });

  // Broadcast bet activity (anonymized amount for others)
  emitToAll('bet_placed', {
    username: user.username,
    avatar: user.avatar,
    choices: choices.map(c => c.symbol),
    totalBet
  });

  emitToUser(userId.toString(), 'balance_update', { balance: user.balance });

  const { invalidateUserCache } = require('../middleware/auth');
  await invalidateUserCache(userId.toString());

  return { bet, newBalance: user.balance };
}

// ─── Config helper ─────────────────────────────────────────────────────────────
async function getConfigValue(key, defaultValue) {
  try {
    const cached = await cacheGet(`config:${key}`);
    if (cached !== null) return cached;

    const config = await GameConfig.findOne({ key }).lean();
    const value = config?.value ?? defaultValue;
    await cacheSet(`config:${key}`, value, 60);
    return value;
  } catch {
    return defaultValue;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { initGameLoop, getCurrentRound, placeBet, getConfigValue };
