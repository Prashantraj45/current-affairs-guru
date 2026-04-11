import cron from 'node-cron';
import { fetchNews } from '../scraper/fetchNews.js';
import { processNewsBatch } from '../claude/runAI.js';
import { saveEntry, readREADME, writeREADME, entryExists } from '../db/db.js';
import { acquireLock, releaseLock, isLocked, getLockStatus } from '../models/Lock.js';

let scheduledJob = null;
const JOB_NAME = 'daily_intelligence';

export function startScheduler() {
  const enabled = process.env.SCHEDULER_ENABLED !== 'false';

  if (!enabled) {
    console.log('⏸ Scheduler disabled');
    return;
  }

  const jobTime = process.env.JOB_TIME || '05:00';
  const [hour, minute] = jobTime.split(':');

  console.log(`📅 Scheduler starting - Job scheduled for ${jobTime} daily (UTC)`);

  // Schedule job at specified time daily
  scheduledJob = cron.schedule(`${minute} ${hour} * * *`, async () => {
    await runDailyJob();
  });

  console.log('✓ Scheduler ready');
}

export function stopScheduler() {
  if (scheduledJob) {
    scheduledJob.stop();
    console.log('⏹ Scheduler stopped');
    scheduledJob = null;
  }
}

/**
 * Run the daily intelligence job for a specific date.
 * @param {string} [targetDate] YYYY-MM-DD — defaults to yesterday UTC
 */
export async function runDailyJob(targetDate) {
  // Default: yesterday UTC (CA sites publish previous day's content)
  const jobDate = targetDate || new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let lockAcquired = false;

  try {
    // Step 0: Try to acquire lock
    console.log('\n[LOCK] Attempting to acquire job lock...');
    lockAcquired = await acquireLock(JOB_NAME, 3600); // 1 hour TTL

    if (!lockAcquired) {
      console.log(`⚠️  Could not acquire lock for ${JOB_NAME}`);
      const status = await getLockStatus(JOB_NAME);
      console.log('Lock Status:', status);
      return;
    }

    console.log('\n[CHECK] Verifying today\'s data doesn\'t already exist...');
    const exists = await entryExists(jobDate);
    if (exists) {
      console.log(`ℹ️  Today's data (${jobDate}) already processed, skipping execution`);
      await releaseLock(JOB_NAME, true);
      return;
    }

    console.log('\n========================================');
    console.log('UPSC Daily Intelligence Job Started');
    console.log('Target Date:', jobDate);
    console.log('Time:', new Date().toISOString());
    console.log('========================================');

    // Step 1: Fetch news for target date
    console.log(`\n[STEP 1] Fetching news for ${jobDate}...`);
    const newsBatch = await fetchNews(80, jobDate);
    console.log(`✓ Fetched ${newsBatch.length} news items`);

    if (newsBatch.length === 0) {
      console.error('No news items fetched. Aborting job.');
      await releaseLock(JOB_NAME, false, 'No news items fetched');
      return;
    }

    // Step 2: Read previous README for context
    console.log('\n[STEP 2] Loading previous state...');
    const previousREADME = await readREADME();
    console.log('✓ Previous state loaded');

    // Step 3: Process with DeepSeek
    console.log('\n[STEP 3] Processing with DeepSeek AI...');
    const claudeOutput = await processNewsBatch(newsBatch, previousREADME);

    if (!claudeOutput) {
      console.error('AI processing failed. Aborting job.');
      await releaseLock(JOB_NAME, false, 'AI processing failed');
      return;
    }

    console.log('✓ AI processing completed');

    // Step 4: Update memory with latest signal deck / insights
    console.log('\n[STEP 4] Updating system memory...');
    // AI may return signalDeck (new) or insights (legacy); validateDeepSeekResponse normalises both to insights
    const memoryData = claudeOutput.insights || claudeOutput.signalDeck;
    if (memoryData) {
      await writeREADME(memoryData);
      console.log('✓ Memory updated');
    }

    // Step 5: Save to database
    console.log('\n[STEP 5] Saving to database...');
    const entry = {
      topics: claudeOutput.topics || [],
      mcqs: claudeOutput.mcqs || [],
      caseStudies: claudeOutput.caseStudies || [],
      insights: claudeOutput.insights || {},
      // cards are auto-generated in saveEntry from topics if not provided
    };

    await saveEntry(entry, jobDate);
    console.log(`✓ Saved ${entry.topics.length} topics for ${jobDate}`);

    // Step 6: Summary
    console.log('\n========================================');
    console.log('JOB COMPLETED SUCCESSFULLY');
    console.log(`Topics: ${entry.topics.length}`);
    console.log('========================================\n');

    // Release lock on success
    await releaseLock(JOB_NAME, true);

  } catch (error) {
    console.error('\n❌ JOB FAILED');
    console.error('Error:', error.message);
    console.error('========================================\n');

    // Release lock on failure with reason
    if (lockAcquired) {
      await releaseLock(JOB_NAME, false, error.message);
    }
  }
}

export async function getJobStatus() {
  try {
    const lockStatus = await getLockStatus(JOB_NAME);
    return {
      job: JOB_NAME,
      running: lockStatus.locked,
      scheduledTime: process.env.JOB_TIME || '05:00',
      lock: lockStatus
    };
  } catch (error) {
    return {
      job: JOB_NAME,
      error: error.message
    };
  }
}
