const { createClient } = require('redis');

let client = null;
let redisAvailable = false;

async function getRedis() {
  // If REDIS_URL is not configured, skip Redis entirely
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (client && redisAvailable) {
    return client;
  }

  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            // Stop retrying after 5 attempts — don't spam logs forever
            console.warn('[Redis] Max retries reached. Running without Redis.');
            redisAvailable = false;
            return false; // stop reconnecting
          }
          return Math.min(retries * 500, 5000);
        }
      }
    });

    client.on('error', (err) => {
      if (redisAvailable) {
        console.error('[Redis] Connection lost:', err.message);
      }
      redisAvailable = false;
    });

    client.on('connect', () => {
      console.log('[Redis] Connected');
      redisAvailable = true;
    });

    client.on('ready', () => {
      redisAvailable = true;
    });

    try {
      await client.connect();
      redisAvailable = true;
    } catch (err) {
      console.warn('[Redis] Could not connect:', err.message, '— running without Redis.');
      redisAvailable = false;
      client = null;
      return null;
    }
  }

  return redisAvailable ? client : null;
}

// Distributed lock — gracefully no-ops when Redis unavailable
async function acquireLock(key, ttlSeconds = 10) {
  try {
    const redis = await getRedis();
    if (!redis) return true; // no Redis = no distributed lock, allow through
    const lockKey = `lock:${key}`;
    const result = await redis.set(lockKey, '1', { NX: true, EX: ttlSeconds });
    return result === 'OK';
  } catch {
    return true;
  }
}

async function releaseLock(key) {
  try {
    const redis = await getRedis();
    if (!redis) return;
    await redis.del(`lock:${key}`);
  } catch {}
}

module.exports = { getRedis, acquireLock, releaseLock };
