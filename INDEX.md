# UPSC Current Affairs AI - Documentation Index

Quick navigation to all project documentation and resources.

---

## 📖 Essential Reading

### Getting Started
- **[README.md](README.md)** — Project overview, features, quick start (v2.1.0)
- **[DEVOPS_CHECKLIST.md](DEVOPS_CHECKLIST.md)** — Setup verification & security tests ⭐

### Setup & Deployment
- **[DEVOPS_SECURITY.md](DEVOPS_SECURITY.md)** — Complete security reference
- **[GIT_SETUP.md](GIT_SETUP.md)** — Safe GitHub repository setup
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Production deployment options
- **[VERIFY.md](VERIFY.md)** — Installation verification checklist

### API & Integration
- **[API-EXAMPLES.md](API-EXAMPLES.md)** — Complete API reference with examples

### Upgrading (v1→v2)
- **[UPGRADE_V2.md](UPGRADE_V2.md)** — Complete v2.0 upgrade guide
- **[UPGRADE_CHECKLIST.md](UPGRADE_CHECKLIST.md)** — Step-by-step v2.0 checklist

---

## 🗂 Project Structure

```
current-affairs-guru/
├── 📖 Documentation
│   ├── README.md                 # Main overview (START HERE)
│   ├── DEVOPS_CHECKLIST.md      # Setup & security tests
│   ├── DEVOPS_SECURITY.md       # Security details
│   ├── GIT_SETUP.md             # GitHub safety
│   ├── API-EXAMPLES.md          # API endpoints
│   ├── DEPLOYMENT.md            # Production setup
│   ├── VERIFY.md                # Verification tests
│   ├── UPGRADE_V2.md            # v2.0 upgrade guide
│   ├── UPGRADE_CHECKLIST.md     # v2.0 checklist
│   ├── INDEX.md                 # This file
│   ├── .env.example             # Config template
│   └── sample-db.json           # Example output
│
├── 📦 Backend (Node.js + Express)
│   ├── src/
│   │   ├── scraper/fetchNews.js
│   │   ├── claude/runClaude.js
│   │   ├── db/db.js
│   │   ├── models/
│   │   ├── services/scheduler.js
│   │   ├── jobs/dailyJob.js
│   │   ├── api/server.js
│   │   └── prompts/upsc_prompt.txt
│   ├── config/secrets.js
│   ├── package.json
│   ├── .env (DO NOT COMMIT)
│   └── .gitignore
│
├── 🎨 Frontend (Next.js)
│   ├── frontend/pages/
│   │   ├── index.js         # Dashboard
│   │   ├── topic/[id].js    # Topic detail
│   │   ├── history.js       # History
│   │   ├── insights.js      # Insights
│   │   └── admin.js         # Admin panel
│   ├── frontend/package.json
│   └── frontend/.env
│
└── 📄 Data Files (auto-created)
    └── sample-db.json       # Example structure
```

---

## 🚀 Quick Start Commands

```bash
# 1. Install & configure
npm install
cp .env.example .env
# Edit .env with your API keys and MongoDB URI

# 2. Start backend
npm start

# 3. Start frontend (new terminal)
cd frontend && npm install && npm run dev

# 4. Access
# Dashboard: http://localhost:3001
# API: http://localhost:3000/api/today
```

---

## 📋 What Each File Does

| File | Purpose | When to Read |
|------|---------|-------------|
| README.md | Project overview & features | First |
| DEVOPS_CHECKLIST.md | Setup verification | During setup |
| DEVOPS_SECURITY.md | Security hardening | Before production |
| GIT_SETUP.md | Safe GitHub setup | Before committing |
| API-EXAMPLES.md | API endpoints & examples | Building frontend |
| DEPLOYMENT.md | Production & scheduling | Going live |
| VERIFY.md | Verification tests | After setup |
| UPGRADE_V2.md | Full v2.0 upgrade | If upgrading from v1 |
| UPGRADE_CHECKLIST.md | Step-by-step v2.0 | If upgrading from v1 |
| INDEX.md | This navigation guide | When lost |

---

## 🔗 Key Links

### External Services
- **Anthropic Console:** https://console.anthropic.com (API keys)
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas (Database)

### API Endpoints (11 total)
- Public: `/health`, `/api/today`, `/api/history`, `/api/date/:date`, `/api/memory`, `/api/dashboard`, `/api/insights`, `/api/topics`, `/api/topic/:id`
- Admin: `/api/admin/status`, `/api/admin/stop` (requires x-admin-key header)

### Frontend Pages (5 total)
- `/` — Dashboard
- `/topic/[id]` — Topic detail
- `/history` — All entries
- `/insights` — Trends & insights
- `/admin` — Admin panel

---

## 🛠 Tech Stack

**Backend:** Node.js 18+, Express.js, MongoDB, Mongoose, Node-cron, Helmet.js, Anthropic SDK

**Frontend:** Next.js 14, React 18, Tailwind CSS, Axios

**DevOps:** MongoDB Atlas, Docker, PM2, GitHub Actions, AWS Lambda, Google Cloud Run

---

## 📞 Common Questions

**Q: Where do I start?**  
A: Read [README.md](README.md), then follow [DEVOPS_CHECKLIST.md](DEVOPS_CHECKLIST.md)

**Q: How do I set up GitHub safely?**  
A: Follow [GIT_SETUP.md](GIT_SETUP.md)

**Q: How do I use the API?**  
A: See [API-EXAMPLES.md](API-EXAMPLES.md)

**Q: How do I deploy to production?**  
A: See [DEPLOYMENT.md](DEPLOYMENT.md)

**Q: I'm upgrading from v1, what do I do?**  
A: See [UPGRADE_V2.md](UPGRADE_V2.md) or [UPGRADE_CHECKLIST.md](UPGRADE_CHECKLIST.md)

**Q: How do I verify my setup works?**  
A: See [VERIFY.md](VERIFY.md)

---

**Version:** 2.1.0 (MongoDB + Scheduler + Security)  
**Status:** ✅ Production Ready  
**Last Updated:** 2026-04-10
