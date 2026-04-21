const { v4: uuidv4 } = require('uuid');
const { getRedis } = require('../config/redis');
const { Round, Bet } = require('../models/index');
const User = require('../models/User');

const SYMBOLS = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
const SYMBOL_LABELS = { bau: '🎃 Bầu', cua: '🦀 Cua', tom: '🦐 Tôm', ca: '🐟 Cá', ga: '🐓 Gà', nai: '🦌 Nai' };

const PHASE_BETTING = 'betting';
const PHASE_ROLLING = 'rolling';
const PHASE_RESULT = 'result';

const BETTING_DURATION = 10000; // 10s
const ROLLING_DURATION = 5000;  // 5s
const RESULT_DURATION = 3000;   // 3s show result

let currentState = null;
let phaseTimer = null;

function rollDice() {
  return {
    dice1: SYMBOLS[Math.floor(Math.random() * 6)],
    dice2: SYMBOLS[Math.floor(Math.random() * 6)],
    dice3: SYMBOLS[Math.floor(Math.random() * 6)]
  };
}

async function saveState(state) {
  try {
    const redis = await getRedis();
    await redis.set('game_state', JSON.stringify(state), { EX: 30 });
  } catch (e) {
    console.error('Redis saveState error:', e.message);
  }
}

async function processBets(roundId, result) {
  try {
    const bets = await Bet.find({ roundId }).populate('userId');
    const resultArr = [result.dice1, result.dice2, result.dice3];
    
    let totalPayout = 0;
    let totalBetAmount = 0;

    for (const bet of bets) {
      let winAmount = 0;
      const betData = Object.fromEntries(bet.betData);
      totalBetAmount += bet.totalBet;

      for (const [symbol, amount] of Object.entries(betData)) {
        const matches = resultArr.filter(d => d === symbol).length;
        if (matches > 0) {
          winAmount += amount * matches; // 1x per match + return bet
          winAmount += amount; // return original bet
        }
      }

      bet.winAmount = winAmount;
      bet.isWin = winAmount > 0;
      await bet.save();

      if (winAmount > 0) {
        await User.findByIdAndUpdate(bet.userId._id, {
          $inc: { balance: winAmount }
        });
        totalPayout += winAmount;
      }
    }

    // Update round stats
    await Round.findOneAndUpdate(
      { roundId },
      {
        result,
        totalBets: totalBetAmount,
        totalWins: totalPayout,
        houseProfit: totalBetAmount - totalPayout
      }
    );
  } catch (e) {
    console.error('processBets error:', e.message);
  }
}

async function startNewRound() {
  const roundId = `R-${Date.now()}-${uuidv4().slice(0, 6)}`;
  
  currentState = {
    roundId,
    phase: PHASE_BETTING,
    timeLeft: BETTING_DURATION / 1000,
    result: null,
    startedAt: Date.now()
  };

  // Save to DB
  await Round.create({ roundId, phase: PHASE_BETTING });
  await saveState(currentState);

  console.log(`[GAME] New round: ${roundId} | Phase: betting`);
  return roundId;
}

async function tick() {
  if (!currentState) return;
  
  const elapsed = Date.now() - currentState.startedAt;
  
  if (currentState.phase === PHASE_BETTING) {
    currentState.timeLeft = Math.max(0, Math.ceil((BETTING_DURATION - elapsed) / 1000));
    
    if (elapsed >= BETTING_DURATION) {
      // Transition to rolling
      const result = rollDice();
      currentState.phase = PHASE_ROLLING;
      currentState.timeLeft = ROLLING_DURATION / 1000;
      currentState.result = result;
      currentState.startedAt = Date.now();
      await saveState(currentState);
      console.log(`[GAME] Rolling: ${JSON.stringify(result)}`);
    } else {
      await saveState(currentState);
    }
    
  } else if (currentState.phase === PHASE_ROLLING) {
    currentState.timeLeft = Math.max(0, Math.ceil((ROLLING_DURATION - elapsed) / 1000));
    
    if (elapsed >= ROLLING_DURATION) {
      // Process bets
      await processBets(currentState.roundId, currentState.result);
      
      currentState.phase = PHASE_RESULT;
      currentState.timeLeft = RESULT_DURATION / 1000;
      currentState.startedAt = Date.now();
      await saveState(currentState);
      console.log(`[GAME] Result phase`);
    } else {
      await saveState(currentState);
    }
    
  } else if (currentState.phase === PHASE_RESULT) {
    currentState.timeLeft = Math.max(0, Math.ceil((RESULT_DURATION - elapsed) / 1000));
    
    if (elapsed >= RESULT_DURATION) {
      await startNewRound();
    } else {
      await saveState(currentState);
    }
  }
}

async function getGameState() {
  try {
    const redis = await getRedis();
    const cached = await redis.get('game_state');
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return currentState;
}

async function initGameEngine() {
  console.log('[GAME] Engine starting...');
  await startNewRound();
  
  // Tick every 1s
  setInterval(tick, 1000);
  console.log('[GAME] Engine running');
}

module.exports = { initGameEngine, getGameState, SYMBOLS, SYMBOL_LABELS };
