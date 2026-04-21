const { createClient } = require('redis');

let client;

async function getRedis() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
      }
    });
    
    client.on('error', (err) => console.error('Redis error:', err));
    client.on('connect', () => console.log('Redis connected'));
    
    await client.connect();
  }
  return client;
}

// Distributed lock
async function acquireLock(key, ttlSeconds = 10) {
  const redis = await getRedis();
  const lockKey = `lock:${key}`;
  const result = await redis.set(lockKey, '1', {
    NX: true,
    EX: ttlSeconds
  });
  return result === 'OK';
}

async function releaseLock(key) {
  const redis = await getRedis();
  await redis.del(`lock:${key}`);
}

module.exports = { getRedis, acquireLock, releaseLock };
