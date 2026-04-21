const Redis = require('ioredis');
const logger = require('./logger');

let redisClient;
let redisSubscriber;

async function connectRedis() {
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    enableReadyCheck: true
  });

  redisSubscriber = redisClient.duplicate();

  redisClient.on('error', (err) => logger.error('Redis client error:', err));
  redisSubscriber.on('error', (err) => logger.error('Redis subscriber error:', err));

  await redisClient.ping();
  return redisClient;
}

// ─── Distributed Lock (prevent duplicate webhook) ────────────────────────────
async function acquireLock(key, ttlMs = 5000) {
  const lockKey = `lock:${key}`;
  const result = await redisClient.set(lockKey, '1', 'PX', ttlMs, 'NX');
  return result === 'OK';
}

async function releaseLock(key) {
  return redisClient.del(`lock:${key}`);
}

// ─── Rate Limiting helpers ────────────────────────────────────────────────────
async function incrementCounter(key, windowMs = 60000) {
  const multi = redisClient.multi();
  multi.incr(key);
  multi.pexpire(key, windowMs);
  const results = await multi.exec();
  return results[0][1]; // count
}

async function getCounter(key) {
  const val = await redisClient.get(key);
  return parseInt(val || '0', 10);
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
async function cacheSet(key, value, ttlSeconds = 300) {
  return redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

async function cacheGet(key) {
  const val = await redisClient.get(key);
  return val ? JSON.parse(val) : null;
}

async function cacheDel(key) {
  return redisClient.del(key);
}

// ─── Pub/Sub ──────────────────────────────────────────────────────────────────
async function publish(channel, data) {
  return redisClient.publish(channel, JSON.stringify(data));
}

async function subscribe(channel, handler) {
  await redisSubscriber.subscribe(channel);
  redisSubscriber.on('message', (ch, msg) => {
    if (ch === channel) {
      try { handler(JSON.parse(msg)); } catch (_) { handler(msg); }
    }
  });
}

module.exports = {
  connectRedis,
  get redisClient() { return redisClient; },
  get redisSubscriber() { return redisSubscriber; },
  acquireLock,
  releaseLock,
  incrementCounter,
  getCounter,
  cacheSet,
  cacheGet,
  cacheDel,
  publish,
  subscribe
};
