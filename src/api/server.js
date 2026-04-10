import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB, getLatestEntry, getEntry, getAllEntries, readREADME } from '../db/db.js';
import { startScheduler as initScheduler, stopScheduler as stopJob, getJobStatus as getSchedulerStatus } from '../services/scheduler.js';
import { secretManager } from '../../config/secrets.js';

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
  max: 5, // Stricter on auth endpoints
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
      return res.status(404).json({ error: 'No data available for today' });
    }
    res.json(latest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all history
app.get('/api/history', async (req, res) => {
  try {
    const entries = await getAllEntries();
    res.json({
      total: entries.length,
      entries: entries
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific date
app.get('/api/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const entry = await getEntry(date);

    if (!entry) {
      return res.status(404).json({ error: `No data available for ${date}` });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system memory / README
app.get('/api/memory', async (req, res) => {
  try {
    const readme = await readREADME();
    if (!readme) {
      return res.status(404).json({ error: 'No memory data available' });
    }
    res.json(readme);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard data
app.get('/api/dashboard', async (req, res) => {
  try {
    const latest = await getLatestEntry();
    if (!latest || !latest.ui_output) {
      return res.status(404).json({ error: 'No dashboard data available' });
    }
    res.json(latest.ui_output.dashboard || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get insights
app.get('/api/insights', async (req, res) => {
  try {
    const latest = await getLatestEntry();
    if (!latest || !latest.ui_output) {
      return res.status(404).json({ error: 'No insights data available' });
    }
    res.json(latest.ui_output.insights || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get topics list
app.get('/api/topics', async (req, res) => {
  try {
    const latest = await getLatestEntry();
    if (!latest || !latest.topics) {
      return res.status(404).json({ error: 'No topics available' });
    }
    res.json(latest.topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single topic by ID
app.get('/api/topic/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const latest = await getLatestEntry();

    if (!latest || !latest.topics) {
      return res.status(404).json({ error: 'No topics available' });
    }

    const topic = latest.topics.find(t => t.id === id);
    if (!topic) {
      return res.status(404).json({ error: `Topic ${id} not found` });
    }

    res.json(topic);
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available: [
      'GET /health',
      'GET /api/today',
      'GET /api/history',
      'GET /api/date/:date',
      'GET /api/memory',
      'GET /api/dashboard',
      'GET /api/insights',
      'GET /api/topics',
      'GET /api/topic/:id',
      'GET /api/admin/status (requires x-admin-key header)',
      'POST /api/admin/stop (requires x-admin-key header)'
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
      console.log('    GET  /api/memory');
      console.log('    GET  /api/dashboard');
      console.log('    GET  /api/insights');
      console.log('    GET  /api/topics');
      console.log('    GET  /api/topic/:id');
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
