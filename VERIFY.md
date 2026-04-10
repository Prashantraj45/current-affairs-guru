# ✅ Verification Guide - Test Your Installation

Use this guide to verify your UPSC AI system is working correctly.

## 🔍 Pre-Installation Checks

### 1. Check Node.js Version

```bash
node --version
npm --version
```

**Expected:** Node 18+ and npm 8+

```
v18.17.0
9.6.4
```

### 2. Check API Key

```bash
echo $ANTHROPIC_API_KEY
```

**Expected:** Should show your API key (starts with `sk-ant-v7-`)

If empty, update `.env`:
```bash
cat .env
```

---

## 📦 Post-Installation Checks

### 3. Verify Dependencies Installed

```bash
npm list --depth=0
```

**Expected Output:**
```
upsc-ai@1.0.0
├── @anthropic-ai/sdk@...
├── dotenv@...
├── express@...
└── rss-parser@...
```

### 4. Check File Structure

```bash
find src -type f -name "*.js" | sort
```

**Expected:**
```
src/api/server.js
src/claude/runClaude.js
src/db/db.js
src/jobs/dailyJob.js
src/scraper/fetchNews.js
```

### 5. Check Configuration Files

```bash
ls -la | grep -E "(\.env|package\.json|\.gitignore)"
```

**Expected:**
```
.env
.env.example
.gitignore
package.json
```

---

## 🚀 Functionality Checks

### 6. Test Daily Job (Main Pipeline)

```bash
node src/jobs/dailyJob.js
```

**Expected Output:**
```
========================================
UPSC Daily Intelligence Job Started
Time: 2026-04-08T...

[STEP 1] Fetching news from RSS feeds...
✓ Fetched 15 news items

[STEP 2] Loading previous state...
✓ Previous state loaded

[STEP 3] Processing with Claude AI...
✓ Claude processing completed

[STEP 4] Updating system memory...
✓ README updated

[STEP 5] Saving to database...
✓ Database entry saved

========================================
JOB COMPLETED SUCCESSFULLY
Topics processed: 12
Database location: ./db.json
========================================
```

**Verification:**
```bash
# Check db.json exists and has data
ls -lh db.json
cat db.json | jq '.entries | length'
```

Should show `1` entry (today's data).

---

### 7. Test API Server

In one terminal:
```bash
npm start
```

**Expected:**
```
UPSC AI API Server running on http://localhost:3000
Available endpoints:
  GET /health - Health check
  GET /api/today - Today's intelligence
  ...
```

In another terminal, test endpoints:

#### Health Check
```bash
curl http://localhost:3000/health | jq
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-08T..."
}
```

#### Get Today's Data
```bash
curl http://localhost:3000/api/today | jq '.topics | length'
```

**Expected:** Shows number like `12` (number of topics)

#### Get Topics
```bash
curl http://localhost:3000/api/topics | jq '.[0].id'
```

**Expected:** Shows topic ID like `"env-001"`

#### Get System Memory
```bash
curl http://localhost:3000/api/memory | jq '.date'
```

**Expected:** Shows date like `"2026-04-08"`

---

## 📊 Database Verification

### 8. Check Database Structure

```bash
cat db.json | jq '.entries[0] | keys'
```

**Expected:**
```
[
  "date",
  "plan",
  "readme",
  "topics",
  "ui_output"
]
```

### 9. Check System Memory

```bash
cat system_memory.json | jq '.high_priority_domains'
```

**Expected:**
```json
[
  "Environment & Climate",
  "Economy & Reports",
  "International Relations",
  "Polity & Governance"
]
```

---

## 🧪 Advanced Checks

### 10. Test Topic Structure

```bash
curl http://localhost:3000/api/topics | jq '.[0] | keys'
```

**Expected keys:**
```
[
  "category",
  "core_concept",
  "explanation",
  "id",
  "mains",
  "metadata",
  "prelims",
  "revision_note_50_words",
  "sources",
  "static_link",
  "title",
  "upsc_relevance_score",
  "why_in_news"
]
```

### 11. Test Prelims Data

```bash
curl http://localhost:3000/api/topics | jq '.[0].prelims.mcq'
```

**Expected:**
```json
{
  "answer": "2030",
  "options": ["2025", "2028", "2030", "2035"],
  "question": "The recent global climate summit..."
}
```

### 12. Test Mains Data

```bash
curl http://localhost:3000/api/topics | jq '.[0].mains'
```

**Expected:**
```json
{
  "gs_paper": "GS-III",
  "question": "Discuss the significance...",
  "answer_framework": {
    "intro": "...",
    "body": [...],
    "conclusion": "..."
  }
}
```

---

## 📈 Performance Checks

### 13. API Response Time

```bash
time curl -s http://localhost:3000/api/today > /dev/null
```

**Expected:** < 100ms

### 14. Job Execution Time

```bash
time node src/jobs/dailyJob.js
```

**Expected:** 30-90 seconds (depending on internet)

### 15. Database Size

```bash
du -h db.json system_memory.json
```

**Expected:**
- `db.json`: 100KB - 1MB
- `system_memory.json`: 1-5KB

---

## 🔄 Integration Checks

### 16. Test with Frontend Framework (React Example)

```javascript
// test.js
const fetch = require('node-fetch');

async function test() {
  const res = await fetch('http://localhost:3000/api/today');
  const data = await res.json();
  
  console.log('✓ Topics:', data.topics.length);
  console.log('✓ Plan:', data.plan?.processing_strategy);
  console.log('✓ Memory:', data.readme?.date);
}

test();
```

Run:
```bash
node test.js
```

**Expected:**
```
✓ Topics: 12
✓ Plan: Clustered by domain, merged duplicates...
✓ Memory: 2026-04-08
```

### 17. Test History Endpoint

```bash
curl http://localhost:3000/api/history | jq '.entries | length'
```

**Expected:** `1` or more (number of days with data)

---

## 🔐 Security Checks

### 18. Verify .env Security

```bash
git status --short .env
```

**Expected:** `.env` should NOT be in git status (it's in .gitignore)

```bash
grep ANTHROPIC_API_KEY .env
```

**Expected:** Shows your API key is set

### 19. Check No Sensitive Data in db.json

```bash
grep -i "api_key\|secret\|password" db.json
```

**Expected:** No output (nothing found)

---

## 🛠 Troubleshooting Checks

### 20. Verify Source Files

```bash
wc -l src/**/*.js
```

**Expected:**
- `server.js`: ~100 lines
- `dailyJob.js`: ~100 lines
- `runClaude.js`: ~80 lines
- `db.js`: ~100 lines
- `fetchNews.js`: ~80 lines

### 21. Check Dependencies

```bash
npm ls | grep "peer|UNMET"
```

**Expected:** No output (no unmet dependencies)

### 22. Verify RSS Feeds Accessible

```bash
curl -s https://indianexpress.com/feed/ | head -20
```

**Expected:** XML RSS feed content

---

## ✅ Complete Verification Checklist

Print this and check off as you verify:

```
Pre-Installation:
☐ Node version 18+
☐ npm version 8+
☐ API key available

Installation:
☐ npm install successful
☐ All dependencies installed
☐ .env file configured

Daily Job:
☐ Job runs without errors
☐ db.json created
☐ system_memory.json created
☐ Topics generated (10-20)

API Server:
☐ Server starts on port 3000
☐ /health endpoint responds
☐ /api/today returns data
☐ /api/topics returns topics
☐ /api/memory returns memory

Database:
☐ db.json has correct structure
☐ system_memory.json has trends
☐ Topics have all required fields
☐ Prelims MCQs present
☐ Mains answer frameworks present

Performance:
☐ API responses < 100ms
☐ Job execution < 90 seconds
☐ Database size < 1MB

Security:
☐ .env not in git
☐ No API keys in db.json
☐ All environment variables set

Advanced:
☐ Topic structure correct
☐ MCQ format valid
☐ Answer frameworks present
☐ Sources included
☐ Metadata complete

Integration:
☐ Frontend can fetch /api/today
☐ History endpoint works
☐ Specific date endpoint works
```

---

## 🎯 Quick Test Script

Save as `test-all.sh` and run `bash test-all.sh`:

```bash
#!/bin/bash

echo "🧪 UPSC AI System Verification"
echo "================================"

echo "✓ Checking Node.js..."
node --version

echo "✓ Checking npm..."
npm --version

echo "✓ Checking dependencies..."
npm list --depth=0

echo "✓ Checking file structure..."
find src -type f -name "*.js" | wc -l

echo "✓ Starting server..."
npm start &
SERVER_PID=$!
sleep 3

echo "✓ Testing /health endpoint..."
curl -s http://localhost:3000/health | jq .status

echo "✓ Testing /api/topics endpoint..."
curl -s http://localhost:3000/api/topics | jq 'length'

echo "✓ Testing API response time..."
time curl -s http://localhost:3000/api/today > /dev/null

echo "✓ Killing server..."
kill $SERVER_PID

echo "================================"
echo "✅ All checks passed!"
```

---

## 🆘 Verification Failed?

| Check Failed | Solution |
|-------------|----------|
| Node version | Install Node 18+ from nodejs.org |
| API key | Set ANTHROPIC_API_KEY in .env |
| npm install fails | Try `npm cache clean --force` then `npm install` |
| Daily job fails | Check internet, verify RSS feeds |
| API doesn't start | Check PORT 3000 is free, try PORT=3001 npm start |
| db.json empty | Run job again: `node src/jobs/dailyJob.js` |
| Topics missing | Check Claude API is working with valid key |

---

## ✨ What to Do Next

If all checks pass:
1. Read [API-EXAMPLES.md](API-EXAMPLES.md) to integrate with frontend
2. Read [DEPLOYMENT.md](DEPLOYMENT.md) to schedule daily
3. Read [INDEX.md](INDEX.md) for all documentation

If checks failed:
1. See Troubleshooting section
2. Check [SETUP.md](SETUP.md) detailed guide
3. Verify environment variables in `.env`

---

**All verified?** You're ready to build on this! 🚀
