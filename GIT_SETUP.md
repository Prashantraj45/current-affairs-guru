# Git Setup Guide for UPSC AI

Safe and secure GitHub setup for private repository.

---

## ✅ Pre-Push Checklist

**CRITICAL:** Never push secrets to GitHub!

```bash
# 1. Verify .env is NOT staged
git status
# Should NOT show: .env, .secret_key, or any credential files

# 2. Verify .gitignore blocks sensitive files
git check-ignore .env
# Should show: ".env" is in .gitignore

# 3. View what will be committed
git diff --cached
# Should NOT contain API keys, passwords, or secrets

# 4. Verify no credentials in code
git grep -i "sk-ant-v7" -- ':!.env.example'
git grep -i "password" -- ':!.env.example'
# Both should return nothing
```

---

## 🔧 Initialize Local Repository

```bash
# Initialize git
git init

# Add all files (except .gitignore protected ones)
git add .

# Verify what's being added
git status
# Should show: .env in untracked (because .gitignore blocks it)

# Create initial commit
git commit -m "feat: Initial UPSC AI system with MongoDB, scheduler, and security hardening

- MongoDB integration with proper error handling
- Job locking via database (prevents duplicates)
- Scheduler running at 5 AM daily
- Secure admin control (no key exposure)
- Rate limiting and security middleware
- Complete Next.js frontend
- Production-ready configuration"
```

---

## 📝 Create Private GitHub Repository

### Option 1: GitHub Web UI

1. Go to https://github.com/new
2. Create repository name: `upsc-ai`
3. Set to **PRIVATE**
4. Do NOT initialize with README (we have one)
5. Click "Create repository"
6. Follow instructions to "push an existing repository"

### Option 2: GitHub CLI

```bash
# Install GitHub CLI if needed
# macOS: brew install gh
# Linux: https://github.com/cli/cli/blob/trunk/docs/install.md

# Login to GitHub
gh auth login

# Create private repository
gh repo create upsc-ai --private --source=. --remote=origin --push
```

---

## 🚀 Push to GitHub (After Private Setup)

```bash
# Add remote (if not already done)
git remote add origin https://github.com/YOUR_USERNAME/upsc-ai.git
git branch -M main

# Push with security verification
git push -u origin main

# Verify push
git log --oneline -5
gh repo view --web  # Opens repo in browser
```

---

## 🔍 Verify Repository Safety

After pushing, verify on GitHub:

1. **Check Settings → Security**
   - ✓ Repository is PRIVATE
   - ✓ No public access

2. **Check Files**
   - ✗ Should NOT have .env
   - ✓ Should have .env.example
   - ✗ Should NOT have secrets

3. **Check Commits**
   ```bash
   git log --all --oneline
   git show HEAD  # Last commit should have no secrets
   ```

4. **Secret Scanning** (GitHub Advanced Security)
   - Enable in Settings → Security → Secret scanning
   - GitHub will alert if secrets are found

---

## 🛡️ Ongoing Security Practices

### Before Every Push

```bash
# 1. Check for accidental secrets
git diff --cached | grep -E "api_key|password|secret|token"

# 2. Verify no .env is staged
git status | grep -E "\.env"

# 3. Review all changes
git diff --cached

# 4. Only then push
git push
```

### Protect Against Accidental Secrets

```bash
# Install git-secrets (macOS)
brew install git-secrets

# Initialize in repo
git secrets --install
git secrets --register-aws

# Configure custom patterns
git config --add secrets.patterns 'sk-ant-v7-[A-Za-z0-9]{20,}'
git config --add secrets.patterns 'mongodb\+srv://'

# Scan existing commits
git secrets --scan
```

---

## 📋 GitHub Repository Settings

After creating private repo, configure:

### Collaborators & Access
- Go to Settings → Collaborators
- Add only trusted team members
- Set appropriate permissions

### Branch Protection
- Go to Settings → Branches
- Protect main branch:
  - ✓ Require pull request reviews
  - ✓ Require status checks
  - ✓ Dismiss stale PR approvals
  - ✓ Require branches to be up to date

### Secrets Management
- Go to Settings → Secrets and variables → Actions
- Add secrets for CI/CD (not for direct code):
  - `MONGODB_URI`
  - `ANTHROPIC_API_KEY`
  - `ADMIN_SECRET`
- These can be used safely in GitHub Actions

---

## 🔄 Collaborating Safely

When adding team members:

```bash
# Generate new ADMIN_SECRET for each environment
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Share via secure channel (1Password, LastPass, etc.)
# NOT via GitHub, Slack, or email

# Each environment (.env file) should have unique:
# - ANTHROPIC_API_KEY
# - MONGODB_URI
# - ADMIN_SECRET
```

---

## 🚨 If Secrets Are Committed (Emergency)

**DO NOT PUSH.**

```bash
# 1. Remove from Git history
git rm --cached .env
git commit --amend --no-edit

# 2. Force push (only if not yet on GitHub)
git push --force-with-lease origin main

# 3. If already on GitHub:
   # a. Rotate all credentials immediately
   # b. Contact GitHub Support for removal
   # c. Use BFG Repo-Cleaner:
   
   git install-bfg  # or: brew install bfg
   bfg --delete-files .env
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push --force-with-lease origin main
```

---

## ✅ Final Verification

```bash
# Before considering repo secure:
echo "Checking for secrets..."
git rev-list --all | while read rev; do
  git show $rev | grep -E "sk-ant-v7-|password|secret" && echo "⚠️ FOUND SECRET IN $rev"
done

echo "Checking .gitignore protection..."
git check-ignore .env .secret_key && echo "✓ Sensitive files protected"

echo "Checking repository visibility..."
gh repo view --json isPrivate --jq '.isPrivate' && echo "✓ Repository is private"
```

---

## 📚 Related Documentation

- [.env.example](.env.example) - Template with placeholders
- [config/secrets.js](config/secrets.js) - Runtime secret loading
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-teams-and-people-with-access-to-your-repository) - Collaboration settings

---

## 🎯 Summary

✓ `.env` is in `.gitignore` (never committed)  
✓ `.env.example` has placeholder values  
✓ Repository is PRIVATE on GitHub  
✓ Only code is committed, no secrets  
✓ Team members share credentials securely (1Password, etc.)  
✓ Each environment has unique credentials  
✓ GitHub secret scanning is enabled  

**Safe to push:** Yes ✓

