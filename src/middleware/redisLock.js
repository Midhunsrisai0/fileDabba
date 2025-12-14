const { acquireLock, releaseLock, isLocked } = require('../config/redisClient');

// Middleware to acquire file-level write locks for uploaded files (by name + folder)
async function lockUploadMiddleware(req, res, next) {
  try {
    const parentFolderId = req.parentFolderId;
    const files = req.files || [];
    req.uploadLocks = [];
    req.uploadLockSkipped = [];

    if (!parentFolderId || files.length === 0) return next();

    const ttl = Number(process.env.REDIS_LOCK_TTL_MS) || 30000;
    for (const file of files) {
       const fileId = file.fileId; 
      const keys = [
        `lock:folder:${parentFolderId}:write`,
        `lock:folder:${parentFolderId}:intent:read`,
        `lock:folder:${parentFolderId}:intent:write`,
        `lock:file:${fileId}:read`,
        `lock:file:${fileId}:write`,
      ];
      const resp = await acquireLock(keys, 'file_write', ttl);
      if (resp.success) {
        req.uploadLocks.push({ keys, value: resp.value, originalName: file.originalname });
      } else {
        req.uploadLockSkipped.push(file.originalname);
      }
    }

    if (req.uploadLockSkipped.length > 0) {
      res.set('X-Upload-Lock-Skipped', req.uploadLockSkipped.join(','));
    }

    next();
  } catch (err) {
    console.error('lockUploadMiddleware error', err);
    next();
  }
}

// Middleware to acquire a file-level write lock for delete operations (DELETE -> write)
async function lockDeleteMiddleware(req, res, next) {
  try {
    const fileId = req.fileId;
    if (!fileId || !req.fileObject) return next();

    const folderId = req.fileObject.folderId;
    const ttl = Number(process.env.REDIS_LOCK_TTL_MS) || 30000;

    const keys = [
      `lock:folder:${folderId}:write`,
      `lock:folder:${folderId}:intent:read`,
      `lock:folder:${folderId}:intent:write`,
      `lock:file:${fileId}:read`,
      `lock:file:${fileId}:write`,
    ];

    const resp = await acquireLock(keys, 'file_write', ttl);

    if (!resp.success) {
      return res.status(423).json({
        code: 423,
        message: 'File is locked by another operation',
      });
    }

    req.deleteLock = { keys, value: resp.value };
    next();
  } catch (err) {
    console.error('lockDeleteMiddleware error', err);
    next();
  }
}


// Middleware to acquire a file-level read lock for GET (GET -> read)
async function markReadLockMiddleware(req, res, next) {
  try {
    const fileId = req.fileId;
    if (!fileId || !req.fileObject) return next();

    const folderId = req.fileObject.folderId;
    const ttl = Number(process.env.REDIS_LOCK_TTL_MS) || 60000;

    // HARD BLOCK CONDITIONS
    if (
      await isLocked(`lock:file:${fileId}:write`) ||
      await isLocked(`lock:folder:${folderId}:write`) ||
      await isLocked(`lock:folder:${folderId}:intent:write`)
    ) {
      return res.status(423).json({
        code: 423,
        message: 'File is locked by another operation',
      });
    }

    const keys = [
      `lock:folder:${folderId}:write`,
      `lock:folder:${folderId}:intent:read`,
      `lock:folder:${folderId}:intent:write`,
      `lock:file:${fileId}:read`,
      `lock:file:${fileId}:write`,
    ];

    const resp = await acquireLock(keys, 'file_read', ttl);

    if (!resp.success) {
      return res.status(423).json({ code: 423, message: 'File is locked' });
    }

    req.readLock = { keys, value: resp.value };

    const release = async () => {
      await releaseLock(req.readLock.keys, req.readLock.value).catch(() => {});
    };

    res.once('finish', release);
    res.once('close', release);

    next();
  } catch (err) {
    console.error('markReadLockMiddleware error', err);
    next();
  }
}


module.exports = {
  lockUploadMiddleware,
  lockDeleteMiddleware,
  markReadLockMiddleware,
};
