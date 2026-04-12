import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { secretManager } from '../../config/secrets.js';
import {
  connectDB,
  getEntry,
  getHistoryEntries,
  getLatestEntry,
  getMonthlyInsights,
  listMonthlyInsights,
  readREADME,
  refreshMonthlyInsights,
  saveEntry,
} from '../db/db.js';
import { getJobStatus as getSchedulerStatus, runDailyJob, startScheduler as initScheduler, stopScheduler as stopJob } from '../services/scheduler.js';
import { releaseLock, forceUnlock } from '../models/Lock.js';
import { callCaseStudies } from '../claude/providers/deepseek.js';
config({ override: true });

const app = express();
const PORT = secretManager.get('PORT', 3000);
const CORS_ORIGIN = secretManager.get('CORS_ORIGIN', 'http://localhost:3001');

// 🛡️ Security Middleware

// 1. Helmet - Sets HTTP security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 2. Body Parser - Only JSON
app.use(express.json({ limit: '1mb' }));

// 3. Rate Limiting - Strict on auth endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter on auth endpoints
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: false
});

app.use('/api/', apiLimiter);
app.use('/api/admin/', authLimiter);

// 4. CORS - Only allow specific origins
app.use((req, res, next) => {
  const allowedOrigins = [CORS_ORIGIN, 'http://localhost:3000', 'http://localhost:3001'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// 5. Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://current-affairs-guru.vercel.app"
  ]
}));
/**
 * Verify admin key from header
 * CRITICAL: Never log, expose, or return the actual key
 */
function verifyAdminKey(req, res, next) {
  const providedKey = req.headers['x-admin-key'];

  if (!providedKey) {
    console.warn('🚨 Admin endpoint accessed without key');
    return res.status(403).json({ error: 'Unauthorized - missing admin key' });
  }

  try {
    const actualKey = secretManager.get('ADMIN_SECRET');

    // Constant-time comparison (prevents timing attacks)
    const providedBuffer = Buffer.from(providedKey);
    const actualBuffer = Buffer.from(actualKey);

    if (providedBuffer.length !== actualBuffer.length) {
      console.warn('🚨 Admin endpoint accessed with wrong key length');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let isValid = true;
    for (let i = 0; i < actualBuffer.length; i++) {
      if (providedBuffer[i] !== actualBuffer[i]) {
        isValid = false;
      }
    }

    if (!isValid) {
      console.warn('🚨 Admin endpoint accessed with invalid key');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    next();
  } catch (error) {
    console.error('Error verifying admin key:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get today's intelligence
app.get('/api/today', async (req, res) => {
  try {
    const latest = await getLatestEntry();
    if (!latest) {
      return res.status(404).json({ error: 'No data available yet. Run the daily job first.' });
    }
    const ins = latest.insights || {};
    res.json({
      date: latest.date,
      topics: latest.topics || [],
      cards: latest.cards || [],
      mcqs: latest.mcqs || [],
      caseStudies: latest.caseStudies || [],
      insights: ins,                   // backward compat
      signalDeck: ins,                 // new canonical name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get history — optional ?start=YYYY-MM-DD&end=YYYY-MM-DD
app.get('/api/history', async (req, res) => {
  try {
    const { start, end } = req.query;
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    const filter = {};
    if (start && dateRe.test(start)) filter.start = start;
    if (end && dateRe.test(end)) filter.end = end;
    const entries = await getHistoryEntries(filter);
    res.json({
      total: entries.length,
      entries: entries.map(e => ({
        date: e.date,
        topicCount: e.topics?.length || 0,
        topics: e.topics || []
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific date
app.get('/api/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    const entry = await getEntry(date);
    if (!entry) {
      return res.status(404).json({ error: `No data for ${date}` });
    }
    res.json({
      date: entry.date,
      topics: entry.topics || [],
      insights: entry.insights || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get insights from memory
app.get('/api/insights', async (req, res) => {
  try {
    const memory = await readREADME();
    if (!memory) {
      return res.status(404).json({ error: 'No insights available yet' });
    }
    res.json({ ...memory, signalDeck: memory }); // alias for new clients
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly insights index and default month payload
app.get('/api/insights/monthly', async (req, res) => {
  try {
    const monthsDocs = await listMonthlyInsights();
    const months = monthsDocs.map((doc) => doc.month);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const selectedMonth = months.includes(currentMonth) ? currentMonth : months[0] || currentMonth;
    const selectedDoc = await getMonthlyInsights(selectedMonth);

    res.json({
      months: months.length ? months : [currentMonth],
      currentMonth,
      selectedMonth,
      insights: selectedDoc
        ? {
            month: selectedDoc.month,
            trends: selectedDoc.trends || [],
            recurringThemes: selectedDoc.recurringThemes || [],
            highFrequencyTopics: selectedDoc.highFrequencyTopics || [],
            strategyNotes: selectedDoc.strategyNotes || [],
            highPriorityDomains: selectedDoc.highPriorityDomains || [],
            sourceDates: selectedDoc.sourceDates || [],
            updatedAt: selectedDoc.updatedAt
          }
        : {
            month: selectedMonth,
            trends: [],
            recurringThemes: [],
            highFrequencyTopics: [],
            strategyNotes: [],
            highPriorityDomains: [],
            sourceDates: [],
            updatedAt: new Date().toISOString()
          }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly insights by month (YYYY-MM)
app.get('/api/insights/monthly/:month', async (req, res) => {
  try {
    const { month } = req.params;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    const doc = await refreshMonthlyInsights(month);
    res.json({
      month,
      trends: doc?.trends || [],
      recurringThemes: doc?.recurringThemes || [],
      highFrequencyTopics: doc?.highFrequencyTopics || [],
      strategyNotes: doc?.strategyNotes || [],
      highPriorityDomains: doc?.highPriorityDomains || [],
      sourceDates: doc?.sourceDates || [],
      updatedAt: doc?.updatedAt || new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single topic by ID (optional ?date= query param to scope to a specific date)
app.get('/api/topic/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    let entry;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
      entry = await getEntry(date);
    } else {
      entry = await getLatestEntry();
    }

    if (!entry?.topics) {
      return res.status(404).json({ error: 'No topics available' });
    }

    const topic = entry.topics.find(t => t.id === id);
    if (!topic) {
      return res.status(404).json({ error: `Topic '${id}' not found${date ? ` for ${date}` : ''}` });
    }

    const topicObj = topic.toObject ? topic.toObject() : topic;
    res.json({ ...topicObj, date: entry.date });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Admin: Get job status
 * Requires x-admin-key header
 */
app.get('/api/admin/status', verifyAdminKey, async (req, res) => {
  try {
    const status = await getSchedulerStatus();
    res.json({
      status: 'authorized',
      scheduler: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error.message);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * Admin: Stop scheduler
 * Requires x-admin-key header (header value = x-admin-key)
 * CRITICAL: Key is NOT exposed in response or logs
 */
app.post('/api/admin/stop', verifyAdminKey, async (req, res) => {
  try {
    console.log('🛑 Admin requested scheduler stop at', new Date().toISOString());

    stopJob();

    // Send confirmation WITHOUT exposing any secrets
    res.json({
      status: 'success',
      message: 'Scheduler has been stopped',
      timestamp: new Date().toISOString(),
      note: 'Restart the server to resume scheduler'
    });

  } catch (error) {
    console.error('Error stopping scheduler:', error.message);
    res.status(500).json({ error: 'Failed to stop scheduler' });
  }
});

/**
 * Admin: Force-release a stuck job lock (use when server was restarted mid-job)
 */
app.post('/api/admin/release-lock', verifyAdminKey, async (req, res) => {
  try {
    await forceUnlock('daily_intelligence');
    console.log('🔓 Lock force-unlocked by admin at', new Date().toISOString());
    res.json({ status: 'released', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Trigger job for a specific date (or yesterday if omitted)
 * Body: { "date": "YYYY-MM-DD" }  (optional)
 */
app.post('/api/admin/run', verifyAdminKey, async (req, res) => {
  const { date, force = false } = req.body || {};

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  if (force) {
    // Force mode: clear any stuck lock before running
    await forceUnlock('daily_intelligence').catch((e) => console.warn('forceUnlock warn:', e.message));
  } else {
    const status = await getSchedulerStatus();
    if (status.running) {
      return res.status(409).json({ error: 'Job already running', lock: status.lock });
    }
  }

  // Date must always be explicit — caller owns the date, no silent defaults here
  if (!date) {
    return res.status(400).json({ error: 'date is required (YYYY-MM-DD). Pass the date you want to fetch data for.' });
  }

  console.log(`▶ Manual job triggered for ${date} (force=${force}) at ${new Date().toISOString()}`);

  // Fire and forget — job is long-running
  runDailyJob(date, { force }).catch((err) => console.error('Manual job error:', err.message));

  res.json({
    status: 'started',
    targetDate: date,
    message: `Job started for ${date}. Poll /api/admin/status for progress.`,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Admin: Patch case studies for an existing entry (without re-running the full job)
 * Body: { "date": "YYYY-MM-DD" }
 */
app.post('/api/admin/patch-case-studies', verifyAdminKey, async (req, res) => {
  const { date } = req.body || {};
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Valid date required. Use YYYY-MM-DD' });
  }

  const entry = await getEntry(date);
  if (!entry) return res.status(404).json({ error: `No entry found for ${date}` });

  const topics = entry.topics || [];
  if (topics.length < 2) {
    return res.status(422).json({ error: `Entry for ${date} has too few topics (${topics.length}) to generate case studies` });
  }

  console.log(`[patch-case-studies] Generating case studies for ${date} (${topics.length} topics)`);

  try {
    const caseStudies = await callCaseStudies(topics);
    await saveEntry({ ...entry.toObject(), caseStudies }, date);
    res.json({ status: 'ok', date, caseStudiesGenerated: caseStudies.length });
  } catch (err) {
    console.error('[patch-case-studies] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available: [
      'GET  /health',
      'GET  /api/today',
      'GET  /api/history',
      'GET  /api/date/:date',
      'GET  /api/insights',
      'GET  /api/insights/monthly',
      'GET  /api/insights/monthly/:month',
      'GET  /api/topic/:id?date=YYYY-MM-DD',
      'GET  /api/admin/status             (x-admin-key header required)',
      'POST /api/admin/stop               (x-admin-key header required)',
      'POST /api/admin/run                (x-admin-key header required, body: { date?: "YYYY-MM-DD" })',
    ]
  });
});

// Start server with MongoDB connection
async function startServer() {
  try {
    console.log('\n🔐 Initializing UPSC AI Server...\n');

    // Validate secrets
    secretManager.logSafeInfo();

    // Connect to MongoDB
    console.log('📚 Connecting to MongoDB...');
    await connectDB();
    console.log('✓ Connected to MongoDB\n');

    // Start scheduler
    console.log('⏰ Starting scheduler...');
    initScheduler();
    console.log('✓ Scheduler initialized\n');

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 UPSC AI API Server running on http://localhost:${PORT}`);
      console.log('\n📡 Available endpoints:');
      console.log('  Public:');
      console.log('    GET  /health');
      console.log('    GET  /api/today');
      console.log('    GET  /api/history');
      console.log('    GET  /api/date/:date');
      console.log('    GET  /api/insights');
      console.log('    GET  /api/insights/monthly');
      console.log('    GET  /api/insights/monthly/:month');
      console.log('    GET  /api/topic/:id?date=YYYY-MM-DD');
      console.log('\n  Admin (requires x-admin-key header):');
      console.log('    GET  /api/admin/status');
      console.log('    POST /api/admin/stop');
      console.log('\n✓ Server ready for requests\n');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n📛 SIGTERM received, shutting down gracefully...');
      stopJob();
      server.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

export default app;
