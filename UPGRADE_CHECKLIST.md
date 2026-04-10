# v2.0 Upgrade Checklist

Follow these steps to complete the v1.0 → v2.0 upgrade.

---

## ✅ Pre-Upgrade (Read These First)

- [ ] Read [QUICKSTART_V2.md](QUICKSTART_V2.md) - 5 minute overview
- [ ] Read [UPGRADE_V2.md](UPGRADE_V2.md) - Complete guide
- [ ] Read [CHANGES_V2.md](CHANGES_V2.md) - Technical details
- [ ] Have MongoDB Atlas account (get at mongodb.com/cloud/atlas)
- [ ] Have ANTHROPIC_API_KEY ready
- [ ] Backup db.json (optional, kept as backup by default)

---

## 🔧 Setup MongoDB (5 minutes)

- [ ] Go to https://mongodb.com/cloud/atlas
- [ ] Sign up or log in
- [ ] Create a new cluster (free tier)
- [ ] Click "Connect"
- [ ] Select "Drivers" connection method
- [ ] Copy connection string
- [ ] Replace `<password>` with your DB password
- [ ] Copy final URI: `mongodb+srv://user:pass@cluster.mongodb.net/upsc-ai`

**Result:** `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/upsc-ai`

---

## 🔐 Update Configuration

- [ ] Edit `.env` file
- [ ] Add `MONGODB_URI=mongodb+srv://...`
- [ ] Add `ADMIN_SECRET=your-secure-random-key` (min 8 chars)
- [ ] Keep `ANTHROPIC_API_KEY=sk-ant-v7-...`
- [ ] Verify `SCHEDULER_ENABLED=true`
- [ ] Set `JOB_TIME=05:00` (or your preferred time)
- [ ] Save `.env` file

---

## 📦 Install Backend Dependencies

- [ ] Run: `npm install`
- [ ] Wait for completion (1-2 min)
- [ ] Verify no errors

---

## 🚀 Start Backend

- [ ] Run: `npm start`
- [ ] Verify output shows:
  - [ ] `✓ MongoDB connected`
  - [ ] `📅 Scheduler starting`
  - [ ] `✓ Scheduler ready`
  - [ ] `🚀 UPSC AI API Server running on http://localhost:3000`
- [ ] Note the terminal window (keep it open)

---

## 🎨 Install & Start Frontend

- [ ] **Open NEW terminal window**
- [ ] Run: `cd frontend`
- [ ] Run: `npm install`
- [ ] Wait for completion (1-2 min)
- [ ] Run: `npm run dev`
- [ ] Verify output shows:
  - [ ] `ready - started server on 0.0.0.0:3001`
- [ ] Keep this terminal open

---

## 🧪 Test Backend API

In another terminal or browser:

- [ ] Test health: `curl http://localhost:3000/health`
  - [ ] Should return: `{"status":"ok",...}`
- [ ] Test today's data: `curl http://localhost:3000/api/today | jq '.topics | length'`
  - [ ] Should return a number (or empty array)
- [ ] Test admin endpoint: `curl http://localhost:3000/api/admin/status -H "x-admin-key: YOUR_SECRET"`
  - [ ] Should return scheduler status

---

## 🌐 Test Frontend

- [ ] Open browser: http://localhost:3001
- [ ] Homepage loads
  - [ ] See navigation bar (Dashboard, History, Insights, Admin)
  - [ ] See "Loading..." or topics
- [ ] Click on a topic (if available)
  - [ ] See topic detail page
  - [ ] See prelims and mains sections
- [ ] Click "History" tab
  - [ ] See historical entries (or empty)
- [ ] Click "Insights" tab
  - [ ] See domains, trends, etc
- [ ] Click "Admin" tab
  - [ ] See admin panel with key input

---

## 🔄 Run Daily Job (Manual)

- [ ] In new terminal: `npm run job`
- [ ] Wait for completion
- [ ] Verify output shows:
  - [ ] `[STEP 1] Fetching news from RSS feeds...`
  - [ ] `[STEP 2] Loading previous state...`
  - [ ] `[STEP 3] Processing with Claude AI...`
  - [ ] `[STEP 4] Updating system memory...`
  - [ ] `[STEP 5] Saving to database...`
  - [ ] `JOB COMPLETED SUCCESSFULLY`
- [ ] Check MongoDB Atlas to verify data exists in `entries` collection

---

## 🛡️ Test Admin Control

- [ ] Go to http://localhost:3001/admin
- [ ] Enter your ADMIN_SECRET
- [ ] Click "Stop Scheduler"
- [ ] Should see: `✓ Scheduler stopped successfully`
- [ ] Verify backend logs show scheduler stopped

---

## 📊 Verify MongoDB Data

- [ ] Go to MongoDB Atlas
- [ ] Click "Browse Collections"
- [ ] Expand `upsc-ai` database
- [ ] Click `entries` collection
  - [ ] Should see documents with date, plan, readme, topics, ui_output
- [ ] Click `memories` collection
  - [ ] Should see document with system memory

---

## 🎯 Final Checks

- [ ] Backend running on port 3000
  - [ ] `npm start`
- [ ] Frontend running on port 3001
  - [ ] `cd frontend && npm run dev`
- [ ] MongoDB connected and verified
- [ ] Daily job can run (manual or automatic at 5 AM)
- [ ] Admin endpoint works with correct secret
- [ ] All pages load and show data
- [ ] Rate limiting works (send 101 rapid requests to see limit)

---

## 🚀 Optional: Schedule Production Deployment

Once verified, see [DEPLOYMENT.md](DEPLOYMENT.md) for:
- [ ] PM2 process manager setup
- [ ] Cron job scheduling
- [ ] GitHub Actions
- [ ] Docker deployment
- [ ] Monitoring & logging

---

## 📝 Troubleshooting

| Error | Solution |
|-------|----------|
| `MongoDB connection failed` | Check MONGODB_URI in .env, verify IP whitelist |
| `Scheduler not starting` | Check SCHEDULER_ENABLED=true in .env |
| `Admin endpoint unauthorized` | Verify x-admin-key header matches ADMIN_SECRET |
| `Port 3000/3001 in use` | Use PORT=3001 npm start or kill process |
| `Frontend can't connect to API` | Ensure backend is running on port 3000 |
| `No topics showing` | Run `npm run job` manually first |
| `MongoDB URI syntax error` | Check format: `mongodb+srv://user:pass@...` |

See [SETUP.md](SETUP.md) for detailed troubleshooting.

---

## ✨ Success Indicators

After completing all checks, you should have:

- ✅ Backend API running on :3000
- ✅ Frontend UI running on :3001
- ✅ MongoDB Atlas connected with data
- ✅ Daily scheduler ready (runs at 5 AM)
- ✅ Job locking prevents duplicates
- ✅ Admin can stop scheduler securely
- ✅ Rate limiting active
- ✅ 5 frontend pages working
- ✅ Full backward compatibility maintained
- ✅ Zero breaking changes

---

## 📞 Getting Help

1. **Setup issues?** → Read [UPGRADE_V2.md](UPGRADE_V2.md)
2. **Technical details?** → Read [CHANGES_V2.md](CHANGES_V2.md)
3. **API questions?** → Read [API-EXAMPLES.md](API-EXAMPLES.md)
4. **Deployment?** → Read [DEPLOYMENT.md](DEPLOYMENT.md)
5. **Production ready?** → Check [PRODUCTION.md](PRODUCTION.md) (optional)

---

## 🎉 Next Steps After Upgrade

1. **Customize Job Time** - Edit JOB_TIME in .env
2. **Deploy** - Follow DEPLOYMENT.md for production
3. **Monitor** - Set up logging and alerts
4. **Backup** - Configure MongoDB Atlas backups
5. **Iterate** - Customize frontend as needed

---

## 📋 Estimated Time

- MongoDB setup: 5 minutes
- Configuration: 2 minutes
- Backend install: 2 minutes
- Frontend install: 2 minutes
- Testing: 5 minutes
- **Total: ~15 minutes**

---

**Status:** Ready to upgrade! 🚀

Start with: [QUICKSTART_V2.md](QUICKSTART_V2.md)

