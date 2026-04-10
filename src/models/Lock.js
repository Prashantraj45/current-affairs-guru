import mongoose from 'mongoose';

/**
 * Job Lock Schema - Prevents concurrent and duplicate job runs
 * Uses MongoDB to ensure atomicity across restarts
 */
const lockSchema = new mongoose.Schema({
  job: {
    type: String,
    unique: true,
    required: true,
    enum: ['daily_intelligence', 'cleanup']
  },
  running: {
    type: Boolean,
    default: false,
    index: true
  },
  startedAt: {
    type: Date,
    default: null
  },
  lastCompletedAt: {
    type: Date,
    default: null
  },
  lastFailedAt: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  },
  lockedBy: {
    type: String,
    default: null
  },
  lockExpiry: {
    type: Date,
    default: null
  },
  attemptCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// TTL for lock expiry (auto-unlock after 1 hour)
lockSchema.index({ lockExpiry: 1 }, { expireAfterSeconds: 0 });

const Lock = mongoose.model('Lock', lockSchema);

/**
 * Acquire a lock for a job
 * @param {string} jobName - Name of the job
 * @param {number} ttlSeconds - Lock TTL (default: 3600 = 1 hour)
 * @returns {Promise<boolean>} True if lock acquired
 */
export async function acquireLock(jobName = 'daily_intelligence', ttlSeconds = 3600) {
  try {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + ttlSeconds * 1000);

    const lock = await Lock.findOneAndUpdate(
      {
        job: jobName,
        $or: [
          { running: false },
          { lockExpiry: { $lt: now } }
        ]
      },
      {
        running: true,
        startedAt: now,
        lockExpiry: lockExpiry,
        lockedBy: `process_${process.pid}`,
        attemptCount: 1,
        updatedAt: now
      },
      { upsert: true, new: true }
    );

    if (!lock) {
      console.warn(`⚠️  Failed to acquire lock for ${jobName} - job may be running`);
      return false;
    }

    console.log(`✓ Lock acquired for ${jobName} (expires at ${lockExpiry})`);
    return true;
  } catch (error) {
    console.error(`Error acquiring lock for ${jobName}:`, error);
    throw error;
  }
}

/**
 * Release a lock after job completion
 * @param {string} jobName - Name of the job
 * @param {boolean} success - Whether job succeeded
 * @param {string} reason - Optional failure reason
 * @returns {Promise<void>}
 */
export async function releaseLock(jobName = 'daily_intelligence', success = true, reason = null) {
  try {
    const update = {
      running: false,
      lockExpiry: null,
      lockedBy: null,
      updatedAt: new Date()
    };

    if (success) {
      update.lastCompletedAt = new Date();
      update.failureReason = null;
    } else {
      update.lastFailedAt = new Date();
      update.failureReason = reason;
    }

    await Lock.findOneAndUpdate(
      { job: jobName },
      update,
      { upsert: true }
    );

    console.log(`✓ Lock released for ${jobName} (success: ${success})`);
  } catch (error) {
    console.error(`Error releasing lock for ${jobName}:`, error);
    throw error;
  }
}

/**
 * Check if job is currently locked
 * @param {string} jobName - Name of the job
 * @returns {Promise<boolean>} True if locked
 */
export async function isLocked(jobName = 'daily_intelligence') {
  try {
    const lock = await Lock.findOne({ job: jobName });

    if (!lock) return false;

    const now = new Date();

    // Check if lock is expired
    if (lock.lockExpiry && lock.lockExpiry < now) {
      console.log(`🔓 Lock expired for ${jobName}, releasing`);
      await releaseLock(jobName, false, 'Lock expired');
      return false;
    }

    return lock.running === true;
  } catch (error) {
    console.error(`Error checking lock for ${jobName}:`, error);
    return false;
  }
}

/**
 * Get lock status
 * @param {string} jobName - Name of the job
 * @returns {Promise<object>} Lock status object
 */
export async function getLockStatus(jobName = 'daily_intelligence') {
  try {
    const lock = await Lock.findOne({ job: jobName });

    if (!lock) {
      return {
        job: jobName,
        locked: false,
        status: 'NO_LOCK'
      };
    }

    const now = new Date();
    const isExpired = lock.lockExpiry && lock.lockExpiry < now;

    return {
      job: jobName,
      locked: lock.running && !isExpired,
      running: lock.running,
      startedAt: lock.startedAt,
      lastCompletedAt: lock.lastCompletedAt,
      lastFailedAt: lock.lastFailedAt,
      failureReason: lock.failureReason,
      lockedBy: lock.lockedBy,
      lockExpiry: lock.lockExpiry,
      isExpired: isExpired,
      attemptCount: lock.attemptCount
    };
  } catch (error) {
    console.error(`Error getting lock status for ${jobName}:`, error);
    return { error: error.message };
  }
}

/**
 * Force unlock (ADMIN ONLY - use with caution)
 * @param {string} jobName - Name of the job
 * @returns {Promise<void>}
 */
export async function forceUnlock(jobName = 'daily_intelligence') {
  try {
    await Lock.findOneAndUpdate(
      { job: jobName },
      {
        running: false,
        lockExpiry: null,
        lockedBy: null,
        updatedAt: new Date()
      },
      { upsert: true }
    );

    console.log(`⚠️  FORCE UNLOCKED ${jobName}`);
  } catch (error) {
    console.error(`Error force unlocking ${jobName}:`, error);
    throw error;
  }
}

export default Lock;
