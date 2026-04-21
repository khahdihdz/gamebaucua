const { Bot, Bet, User, GameRound } = require('@baucua/db');
const { emitToAll } = require('../socket');
const { getCurrentRound } = require('./gameLoop');
const logger = require('../config/logger');

const SYMBOLS = ['bau', 'cua', 'ca', 'tom', 'ga', 'nai'];
const SYMBOL_LABELS = { bau: '🦐 Bầu', cua: '🦀 Cua', ca: '🐟 Cá', tom: '🦞 Tôm', ga: '🐓 Gà', nai: '🦌 Nai' };

// ─── Chat messages per personality ───────────────────────────────────────────
const CHAT_LINES = {
  excited: [
    'Ăn to lần này! 🔥', 'GO GO GO!!!', 'Cược hết vào con cua!',
    'Hôm nay may mắn lắm!', 'Thắng rồi !!!! 🎉', 'WOW QUÁ ĐỈNH'
  ],
  casual: [
    'Đặt cược thôi', 'Hmmm chọn gì đây', 'Cá lần này',
    'Chơi cho vui', 'Hy vọng thắng', 'Đặt bầu thôi'
  ],
  angry: [
    'Thua hoài vậy trời', 'Gg...', 'Không thể tin được',
    'Round này phải thắng mới được', 'Tức quá!', 'Double down thôi'
  ]
};

// ─── Seed bots on startup ─────────────────────────────────────────────────────
async function seedBots() {
  const count = await Bot.countDocuments();
  if (count >= 20) return;

  const botNames = [
    'Rồng_Vàng88', 'MayMắn_Pro', 'BauCua_King', 'TiênĐồng_VIP',
    'Phú_Quý999', 'Kim_Cương_X', 'Thần_Tài_2k', 'BạcNhớt_Pro',
    'ĐạiGia_Ẩn', 'VipRoom_User', 'Lucky_Strike', 'GoldHand_VN',
    'CăngRa_Win', 'BauBau_Boss', 'CuaCua_Xịn', 'TômNướng88',
    'NaiVàng_Pro', 'GàChọi_VIP', 'CáVàng_2k4', 'Bầu_Master'
  ];

  const personalities = ['aggressive', 'conservative', 'random'];
  const chatStyles = ['excited', 'casual', 'angry'];

  const botsToCreate = botNames.slice(count).map((name, i) => ({
    username: name,
    avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${name}`,
    balance: 500000 + Math.floor(Math.random() * 9500000),
    personality: personalities[i % 3],
    chatStyle: chatStyles[i % 3],
    isActive: true
  }));

  if (botsToCreate.length > 0) {
    await Bot.insertMany(botsToCreate);
    logger.info(`Seeded ${botsToCreate.length} bots`);
  }
}

// ─── Decide bot bet based on personality ─────────────────────────────────────
function decideBotBet(bot, maxBalance) {
  const balance = Math.min(bot.balance, maxBalance);

  let betAmount;
  switch (bot.personality) {
    case 'aggressive':
      betAmount = Math.floor(balance * (0.1 + Math.random() * 0.2));
      break;
    case 'conservative':
      betAmount = Math.floor(balance * (0.01 + Math.random() * 0.05));
      break;
    default: // random
      betAmount = Math.floor(balance * (0.02 + Math.random() * 0.1));
  }

  // Min 500, max 1M per bot bet
  betAmount = Math.max(500, Math.min(betAmount, 1000000));

  // Round to nearest 500
  betAmount = Math.round(betAmount / 500) * 500;

  // Pick 1-2 symbols (bots don't spread too much)
  const numChoices = Math.random() < 0.7 ? 1 : 2;
  const shuffled = [...SYMBOLS].sort(() => Math.random() - 0.5);
  const choices = shuffled.slice(0, numChoices).map(symbol => ({
    symbol,
    amount: numChoices === 1 ? betAmount : Math.floor(betAmount / 2)
  }));

  return choices;
}

// ─── Bot betting phase ────────────────────────────────────────────────────────
async function botBettingPhase(round) {
  const bots = await Bot.find({ isActive: true });

  // Only 30-70% of bots bet each round (natural behavior)
  const activeBots = bots.filter(() => Math.random() < 0.55);

  // Stagger bot bets over the 10s window
  for (const bot of activeBots) {
    const delay = 500 + Math.random() * 8000; // 0.5s - 8.5s into round
    setTimeout(() => placeBotBet(bot, round), delay);
  }

  // Random chat messages
  const chatBots = bots.filter(() => Math.random() < 0.3);
  for (const bot of chatBots) {
    const delay = 1000 + Math.random() * 7000;
    setTimeout(() => emitBotChat(bot), delay);
  }
}

async function placeBotBet(bot, round) {
  try {
    // Verify round is still betting
    const current = getCurrentRound();
    if (!current || current.status !== 'betting' || current.roundId !== round.roundId) return;
    if (Date.now() > current.bettingEndsAt) return;

    const choices = decideBotBet(bot, bot.balance);
    const totalBet = choices.reduce((s, c) => s + c.amount, 0);

    if (bot.balance < totalBet) return;

    // Update bot balance
    await Bot.updateOne({ _id: bot._id }, { $inc: { balance: -totalBet } });

    // Record bet (marked as bot)
    await Bet.create({
      roundId: round.roundId,
      userId: bot._id, // Bot uses its own ID
      isBot: true,
      choices,
      totalBet
    });

    // Broadcast fake bet to all players (looks real)
    emitToAll('bet_placed', {
      username: bot.username,
      avatar: bot.avatar,
      choices: choices.map(c => c.symbol),
      totalBet,
      isBot: false // Don't reveal it's a bot
    });

  } catch (err) {
    // Silently fail — bot errors shouldn't affect game
  }
}

function emitBotChat(bot) {
  try {
    const lines = CHAT_LINES[bot.chatStyle] || CHAT_LINES.casual;
    const message = lines[Math.floor(Math.random() * lines.length)];

    emitToAll('chat_message', {
      userId: bot._id,
      username: bot.username,
      avatar: bot.avatar,
      message,
      timestamp: Date.now()
    });
  } catch { }
}

// ─── Bot result reactions ──────────────────────────────────────────────────────
async function botResultReaction(result) {
  const bots = await Bot.find({ isActive: true });
  const reactingBots = bots.filter(() => Math.random() < 0.25);

  for (const bot of reactingBots) {
    const delay = 500 + Math.random() * 3000;
    setTimeout(() => {
      const reactions = {
        excited: ['THẮNG RỒI!!!! 🎉', 'OMG OMG!!!', 'ĐỈNH QUÁ!'],
        casual:  ['oke', 'nice', 'hehe thắng rồi'],
        angry:   ['Thua nữa rồi...', 'GG', '😤']
      };
      const lines = reactions[bot.chatStyle] || reactions.casual;
      emitToAll('chat_message', {
        userId: bot._id,
        username: bot.username,
        avatar: bot.avatar,
        message: lines[Math.floor(Math.random() * lines.length)],
        timestamp: Date.now()
      });
    }, delay);
  }

  // Restore some bot balances (they "win" virtually to keep betting)
  await Bot.updateMany(
    { balance: { $lt: 50000 } },
    { $set: { balance: 300000 + Math.floor(Math.random() * 200000) } }
  );
}

// ─── Main bot system init ─────────────────────────────────────────────────────
function initBotSystem(io) {
  seedBots();

  // Listen for game events via polling (simpler than socket on server side)
  let lastRoundId = null;
  let lastStatus = null;

  setInterval(async () => {
    try {
      const round = getCurrentRound();
      if (!round) return;

      // New round started → trigger bot bets
      if (round.roundId !== lastRoundId && round.status === 'betting') {
        lastRoundId = round.roundId;
        lastStatus = 'betting';
        botBettingPhase(round);
      }

      // Round completed → trigger reactions
      if (round.roundId === lastRoundId && round.status === 'completed' && lastStatus !== 'completed') {
        lastStatus = 'completed';
        botResultReaction(round.result);
      }
    } catch { }
  }, 500); // Poll every 500ms

  logger.info('Bot system initialized');
}

module.exports = { initBotSystem, seedBots };
