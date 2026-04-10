# DevOps & Security Hardening Guide

Complete security implementation for UPSC AI system.

---

## 🔐 Security Layers Implemented

### 1. Secrets Management
- `config/secrets.js` - Centralized secret loading and validation
- No hardcoded credentials anywhere
- Automatic validation on startup
- Prevents secret exposure in logs

### 2. Database Job Locking
- `src/models/Lock.js` - MongoDB-based distributed locking
- Prevents concurrent job runs
- Persists across server restarts
- Auto-expiry after 1 hour
- Lock status tracking

### 3. Scheduler Safety
- `src/services/scheduler.js` - Cron-based job execution
- Atomic lock acquisition before job start
- Automatic lock release after completion
- Daily run at 5 AM (configurable)
- Skips if today's data already exists

### 4. API Security
- `src/api/server.js` - Production-hardened Express server
- Helmet.js - HTTP security headers
- Rate limiting - 100 req/15 min per IP
- CORS restriction - Only whitelisted origins
- Constant-time key comparison (timing attack prevention)

### 5. Frontend Security
- `frontend/pages/admin.js` - Admin key never collected
- Frontend cannot access admin functions
- API always validates x-admin-key header
- Admin operations disabled in frontend

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

New packages:
- `helmet` - Security headers
- (Already installed: mongoose, node-cron, express-rate-limit)

### 2. Configure Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
nano .env
```

**Required secrets:**

```env
# API Key (get from https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-v7-xxxxxxxxxxxxxxxxxxxxx

# MongoDB URI (get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/upsc-ai

# Admin Secret (generate below)
ADMIN_SECRET=64-character-random-key-here
```

**Generate secure ADMIN_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Verify Secrets

```bash
node -e "
require('dotenv/config');
const s = require('./config/secrets.js').default;
console.log('✓ Secrets loaded and validated');
"
```

### 4. Start Server

```bash
npm start
```

Expected output:
```
🔐 Initializing UPSC AI Server...
═══════════════════════════════════════
🔐 System Configuration (Masked)
═══════════════════════════════════════
Port:               3000
Environment:        development
Anthropic API:      sk-ant-v7-...****
MongoDB:            mongodb+srv://:****@
Admin Secret:       ****REDACTED****
...
✓ Server ready for requests
```

---

## 📋 Security Best Practices

### Environment Variable Handling

**DO:**
- ✓ Store secrets in `.env` (local development only)
- ✓ Use `config/secrets.js` to load and validate
- ✓ Check `.env` is in `.gitignore`
- ✓ Use `.env.example` with placeholder values
- ✓ Rotate secrets regularly
- ✓ Log only masked versions

**DON'T:**
- ✗ Hardcode secrets in source code
- ✗ Commit `.env` to GitHub
- ✗ Log full secret values
- ✗ Pass secrets via URL parameters
- ✗ Share secrets via email/chat
- ✗ Use weak passwords

### Admin Key Security

**DO:**
- ✓ Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- ✓ Store in `.env` ONLY (backend only)
- ✓ Send via `x-admin-key` header (not in URL/body)
- ✓ Use only from trusted networks
- ✓ Rotate quarterly
- ✓ Monitor admin action logs

**DON'T:**
- ✗ Collect from frontend UI
- ✗ Send via email/Slack/chat
- ✗ Include in API responses
- ✗ Log full key values
- ✗ Use weak/default secrets
- ✗ Share with untrusted parties

### Database Security

**MongoDB Atlas Settings:**
```
1. Network Access → Add IP Whitelist
2. Database Access → Create strong password
3. Connection String → Use IP restrictions
4. Backups → Enable daily automated
5. Monitoring → Enable performance alerts
```

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/upsc-ai?retryWrites=true&w=majority
```

### API Security

**Rate Limiting:**
- 100 requests per 15 minutes per IP (public endpoints)
- 5 requests per 15 minutes (admin endpoints)
- Skip health check endpoint

**CORS Configuration:**
```javascript
Allowed origins:
- http://localhost:3001 (dev frontend)
- http://localhost:3000 (alternative)
- Production: Add your domain
```

**Headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- CSP (Content Security Policy)

---

## 🔒 Job Locking Mechanism

### How It Works

```
[Job Trigger] → Check Lock → Acquire Lock → Execute Job → Release Lock
                  (DB)          (DB)          (5-30 min)    (DB)
                                                 ↓
                                           If error: Mark failed
```

### Lock Document (MongoDB)

```javascript
{
  _id: ObjectId,
  job: "daily_intelligence",
  running: false,
  startedAt: 2024-04-08T05:00:00Z,
  lastCompletedAt: 2024-04-08T05:15:30Z,
  lockExpiry: 2024-04-08T06:00:00Z,
  lockedBy: "process_1234",
  attemptCount: 1,
  createdAt: 2024-04-08T05:00:00Z,
  updatedAt: 2024-04-08T05:15:30Z
}
```

### API for Lock Management

```bash
# Check lock status
curl http://localhost:3000/api/admin/status \
  -H "x-admin-key: YOUR_KEY"

# Force unlock (ADMIN ONLY - use with caution)
# In code only: await forceUnlock('daily_intelligence')
```

---

## 📊 Scheduler Configuration

### Daily Execution Time

In `.env`:
```env
JOB_TIME=05:00  # 5 AM UTC (24-hour format)
```

Change time example:
```env
JOB_TIME=06:00  # 6 AM instead
JOB_TIME=14:30  # 2:30 PM
```

### Enable/Disable

```env
SCHEDULER_ENABLED=true   # Enable (default)
SCHEDULER_ENABLED=false  # Disable
```

### Manual Execution

```bash
npm run job
```

---

## 🛡️ Security Checklist

### Before First Deployment

- [ ] `.env` file created with all required secrets
- [ ] All secrets have strong values (32+ chars for ADMIN_SECRET)
- [ ] `.env` is in `.gitignore`
- [ ] No secrets in source code
- [ ] No secrets in commit history
- [ ] MongoDB Atlas has IP whitelist
- [ ] CORS origins configured
- [ ] Rate limiting tested
- [ ] Admin key functionality verified
- [ ] Job locking tested with concurrent runs

### Ongoing Security

- [ ] Monthly: Review and rotate secrets
- [ ] Weekly: Check admin action logs
- [ ] Daily: Monitor error logs
- [ ] Monthly: Security patches (npm update)
- [ ] Quarterly: Admin key rotation
- [ ] Quarterly: Database password rotation
- [ ] As needed: Update CORS origins

---

## 🔄 Secrets Rotation

### Rotate ADMIN_SECRET

```bash
# 1. Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Update .env
ADMIN_SECRET=new-secret-here

# 3. Restart server (if running)
npm start

# 4. Notify team members (via secure channel)
```

### Rotate API Key

```bash
# 1. Go to https://console.anthropic.com
# 2. Generate new key
# 3. Update .env
ANTHROPIC_API_KEY=sk-ant-v7-new-key-here

# 4. Restart server
npm start

# 5. Delete old key from Anthropic console
```

### Rotate MongoDB Password

```bash
# 1. Go to MongoDB Atlas
# 2. Database Access → Edit User
# 3. Edit Password
# 4. Copy new connection string
# 5. Update .env
MONGODB_URI=mongodb+srv://user:new-password@cluster.mongodb.net/upsc-ai

# 6. Test connection
# 7. Restart server
```

---

## 📝 Admin Operations

### Using Admin API

All admin operations require `x-admin-key` header.

**Check Scheduler Status:**
```bash
curl http://localhost:3000/api/admin/status \
  -H "x-admin-key: YOUR_ADMIN_SECRET"
```

Response:
```json
{
  "status": "authorized",
  "scheduler": {
    "job": "daily_intelligence",
    "running": false,
    "scheduledTime": "05:00",
    "lock": {
      "locked": false,
      "lastCompletedAt": "2024-04-08T05:15:30Z"
    }
  },
  "timestamp": "2024-04-08T10:30:00Z"
}
```

**Stop Scheduler:**
```bash
curl -X POST http://localhost:3000/api/admin/stop \
  -H "x-admin-key: YOUR_ADMIN_SECRET"
```

Response:
```json
{
  "status": "success",
  "message": "Scheduler has been stopped",
  "timestamp": "2024-04-08T10:30:00Z",
  "note": "Restart the server to resume scheduler"
}
```

---

## 🚨 Security Incident Response

### Exposed Secret

**IMMEDIATE ACTION:**
1. Stop the server
2. Rotate the exposed secret
3. Check logs for unauthorized access
4. Restart with new secret
5. Notify team members

**Prevention:**
- Use git-secrets to prevent future exposure
- Implement secret scanning in CI/CD

### Suspicious Admin Activity

**INVESTIGATE:**
1. Check logs for admin endpoint access
2. Review what actions were performed
3. Check if lock status is normal
4. Verify job execution logs

**RESPOND:**
1. Rotate ADMIN_SECRET immediately
2. Review MongoDB access logs
3. Check for unauthorized data access
4. Notify security team

### Rate Limit Abuse

**DETECT:**
- Monitor 429 responses
- Check for DDoS patterns
- Review attacker IPs

**RESPOND:**
1. Block IPs at firewall level
2. Increase rate limits temporarily if needed
3. Enable AWS WAF or similar
4. Notify infrastructure team

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `config/secrets.js` | Secret loading & validation |
| `src/models/Lock.js` | DB-based job locking |
| `src/services/scheduler.js` | Cron scheduler with locking |
| `src/api/server.js` | Secure Express server |
| `frontend/pages/admin.js` | Admin UI (no key exposure) |
| `.env.example` | Template with placeholders |
| `.gitignore` | Blocks secrets from git |
| `GIT_SETUP.md` | Safe repository setup |

---

## 🔗 Related Documentation

- [GIT_SETUP.md](GIT_SETUP.md) - Safe GitHub repository
- [README.md](README.md) - Project overview
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [UPGRADE_V2.md](UPGRADE_V2.md) - System upgrade

---

## ✅ Summary

**Security Implemented:**
- ✓ Centralized secrets management
- ✓ Database-based job locking
- ✓ Secure scheduler with atomicity
- ✓ Production-hardened API
- ✓ Admin key validation (timing-safe)
- ✓ Rate limiting and CORS
- ✓ Security headers (Helmet.js)
- ✓ Frontend isolation (no admin keys)

**Ready for Production:** YES ✓

