# Deployment & Scheduling Guide

This guide covers deploying the UPSC AI system and scheduling daily jobs.

## 🔄 Schedule Daily Job

### Option 1: Cron (Linux/Mac)

Edit your crontab:
```bash
crontab -e
```

Add this line to run daily at 6 AM:
```cron
0 6 * * * cd /Users/prashantraj/Desktop/current-affairs-guru && /usr/local/bin/node src/jobs/dailyJob.js >> logs/cron.log 2>&1
```

Or use environment variables:
```cron
0 6 * * * cd /Users/prashantraj/Desktop/current-affairs-guru && ANTHROPIC_API_KEY=sk-ant-v7-xxx /usr/local/bin/node src/jobs/dailyJob.js
```

### Option 2: PM2 (Process Manager)

Install PM2:
```bash
npm install -g pm2
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'upsc-api',
      script: 'src/api/server.js',
      exec_mode: 'cluster',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        ANTHROPIC_API_KEY: 'sk-ant-v7-xxx'
      }
    },
    {
      name: 'upsc-daily-job',
      script: 'src/jobs/dailyJob.js',
      exec_mode: 'fork',
      cron_restart: '0 6 * * *',  // 6 AM daily
      env: {
        NODE_ENV: 'production',
        ANTHROPIC_API_KEY: 'sk-ant-v7-xxx'
      }
    }
  ]
};
```

Start services:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: GitHub Actions (Automated)

Create `.github/workflows/daily-job.yml`:
```yaml
name: Daily UPSC Intelligence Job

on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily

jobs:
  daily-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node src/jobs/dailyJob.js
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: database
          path: db.json
```

### Option 4: Docker + Cron

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY src ./src
COPY .env .

CMD ["node", "src/api/server.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - PORT=3000
    volumes:
      - ./db.json:/app/db.json
      - ./system_memory.json:/app/system_memory.json
```

## 🚀 Deploy to Production

### AWS Lambda (Serverless)

1. Create `handler.js`:
```javascript
import { processNewsBatch } from './src/claude/runClaude.js';
import { fetchNews } from './src/scraper/fetchNews.js';
import { saveEntry, readREADME, writeREADME } from './src/db/db.js';

export const handler = async (event) => {
  try {
    const newsBatch = await fetchNews(15);
    const previousREADME = readREADME();
    const output = await processNewsBatch(newsBatch, previousREADME);
    
    if (output.readme) writeREADME(output.readme);
    saveEntry(output);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, topics: output.topics.length })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

2. Deploy with Serverless Framework:
```bash
npm install -g serverless
serverless deploy
```

### Google Cloud Run

Create `deploy.sh`:
```bash
gcloud build submit --tag gcr.io/PROJECT_ID/upsc-ai
gcloud run deploy upsc-ai \
  --image gcr.io/PROJECT_ID/upsc-ai \
  --platform managed \
  --region us-central1 \
  --set-env-vars ANTHROPIC_API_KEY=sk-ant-v7-xxx \
  --allow-unauthenticated
```

### Heroku

```bash
heroku create upsc-ai
heroku config:set ANTHROPIC_API_KEY=sk-ant-v7-xxx
git push heroku main
```

## 📊 Monitoring

### Setup Logging

Create `src/utils/logger.js`:
```javascript
import fs from 'fs';
import path from 'path';

const logsDir = './logs';
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

export function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${level}: ${message}`;
  console.log(logEntry);
  
  fs.appendFileSync(
    path.join(logsDir, 'app.log'),
    logEntry + '\n'
  );
}
```

### Health Monitoring

Setup monitoring with tools like:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Datadog** - Infrastructure monitoring
- **New Relic** - Performance monitoring

### Example Sentry Integration

```bash
npm install @sentry/node
```

In `src/jobs/dailyJob.js`:
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

try {
  // Your job code
} catch (error) {
  Sentry.captureException(error);
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions for Testing

Create `.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run lint
```

## 🔒 Environment Variables

Production checklist:
- ✅ ANTHROPIC_API_KEY - Set in secrets manager
- ✅ NODE_ENV - Set to 'production'
- ✅ DB_PATH - Point to persistent storage
- ✅ README_PATH - Point to persistent storage
- ✅ PORT - Set to 3000 or cloud-specific port

## 📈 Scaling Considerations

### Current Limitations
- File-based storage (db.json) - Works for ~1 year of daily data
- Single-process API - Adequate for <100 concurrent users

### Future Improvements
- **Scale DB**: Migrate to MongoDB, PostgreSQL, or DynamoDB
- **Scale API**: Use load balancer (nginx) or serverless
- **Cache**: Add Redis for frequently accessed data
- **Queue**: Use Bull or RabbitMQ for batched processing

### Database Migration

When ready to migrate from JSON:

```javascript
// export-to-db.js
import { readDB } from './src/db/db.js';
import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  date: String,
  plan: Object,
  readme: Object,
  topics: Array,
  ui_output: Object
});

const Entry = mongoose.model('Entry', entrySchema);

async function migrate() {
  const db = readDB();
  await Entry.insertMany(db.entries);
  console.log(`Migrated ${db.entries.length} entries`);
}

migrate();
```

## 🔄 Backup Strategy

### Automated Backups

Create `backup.js`:
```javascript
import fs from 'fs';
import path from 'path';

const timestamp = new Date().toISOString().split('T')[0];
const backupDir = './backups';

if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

['db.json', 'system_memory.json'].forEach(file => {
  fs.copyFileSync(file, path.join(backupDir, `${file}.${timestamp}`));
});

console.log('Backup complete');
```

Schedule in crontab:
```cron
0 0 * * * cd /Users/prashantraj/Desktop/current-affairs-guru && node backup.js
```

Or add to PM2 ecosystem:
```javascript
{
  name: 'upsc-backup',
  script: 'backup.js',
  cron_restart: '0 0 * * *'  // Midnight daily
}
```

## 📞 Troubleshooting Deployments

**Cron not running?**
```bash
# Check crontab
crontab -l

# Test manually
node src/jobs/dailyJob.js

# Check logs
tail -f logs/cron.log
```

**PM2 not restarting?**
```bash
pm2 monit
pm2 logs upsc-daily-job
```

**Lambda timeout?**
Increase timeout in serverless.yml:
```yaml
functions:
  dailyJob:
    handler: handler.handler
    timeout: 60
```

---

**Ready to deploy!** Choose your platform above and follow the steps.
