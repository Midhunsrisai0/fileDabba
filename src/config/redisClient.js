const Redis = require('ioredis');
const crypto = require('crypto');

const redis = new Redis(process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
});

// Lua script provided by the user — handles file/folder intent/read/write atomically
const LOCK_LUA = `
-- KEYS:
-- 1 folder_write
-- 2 folder_intent_read
-- 3 folder_intent_write
-- 4 file_read
-- 5 file_write

-- ARGV:
-- 1 op
-- 2 value
-- 3 ttl

local op = ARGV[1]
local val = ARGV[2]
local ttl = tonumber(ARGV[3])

local function exists(k)
  return redis.call('EXISTS', k) == 1
end

if op == 'file_read' then
  if exists(KEYS[1]) then return 0 end
  redis.call('SET', KEYS[2], val, 'PX', ttl, 'NX')
  redis.call('SET', KEYS[4], val, 'PX', ttl, 'NX')
  return 1
end

if op == 'file_write' then
  if exists(KEYS[1]) then return 0 end
  redis.call('SET', KEYS[3], val, 'PX', ttl, 'NX')
  redis.call('SET', KEYS[5], val, 'PX', ttl, 'NX')
  return 1
end

if op == 'folder_delete' then
  if exists(KEYS[2]) or exists(KEYS[3]) then return 0 end
  redis.call('SET', KEYS[1], val, 'PX', ttl, 'NX')
  return 1
end

return 0
`;

async function acquireLock(keys, op, ttl = 30000) {
  const value = crypto.randomUUID();
  try {
    const resp = await redis.eval(LOCK_LUA, keys.length, ...keys, op, value, String(ttl));
    console.log('acquireLock', { keys, op, resp });
    return resp === 1 ? { success: true, value } : { success: false };
  } catch (err) {
    return { success: false };
  }
}

async function releaseLock(keys, value) {
  // Accept either a single key or array of keys — attempt to delete any matching entries
  const RELEASE_SCRIPT = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';
  try {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const k of keyList) {
      try {
        await redis.eval(RELEASE_SCRIPT, 1, k, value);
      } catch (e) {
        // ignore per-key errors
      }
    }
    return true;
  } catch (err) {
    return false;
  }
}

async function isLocked(key) {
  try {
    const v = await redis.get(key);
    return v !== null;
  } catch (err) {
    return false;
  }
}

module.exports = {
  acquireLock,
  releaseLock,
  isLocked,
};
