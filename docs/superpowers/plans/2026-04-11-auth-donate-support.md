# Auth Logout Fix + Donate + Support Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix logout UX in TopNav, add a `/donate` page with UPI QR, and add a `/support` page with an EmailJS contact form.

**Architecture:** All changes are frontend-only (Next.js Pages Router, plain JS). Logout fix is a targeted edit to `TopNav.js`. Donate and Support are new standalone pages following the existing glass-panel design pattern. EmailJS handles email delivery client-side with no backend changes.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, Firebase (existing), `@emailjs/browser`, lucide-react

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `frontend/components/layout/TopNav.js` | Modify | Add click-outside handler + show display name in UserMenu |
| `frontend/lib/constants.js` | Modify | Add Donate + Support to NAV_LINKS |
| `frontend/pages/donate.js` | Create | UPI QR display + copy UPI ID button |
| `frontend/pages/support.js` | Create | EmailJS contact form |
| `frontend/.env.local` | Modify | Add NEXT_PUBLIC_EMAILJS_* vars |

---

## Task 1: Install @emailjs/browser

**Files:**
- Modify: `frontend/package.json` (via npm install)

- [ ] **Step 1: Install the package**

```bash
cd frontend && npm install @emailjs/browser
```

Expected output: `added 1 package` (or similar), no errors.

- [ ] **Step 2: Verify install**

```bash
grep '@emailjs/browser' frontend/package.json
```

Expected: `"@emailjs/browser": "^x.x.x"` in dependencies.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add package.json package-lock.json
git commit -m "chore: add @emailjs/browser"
```

---

## Task 2: EmailJS Account Setup (Manual — user does this)

This task is manual setup on emailjs.com. No code written here.

- [ ] **Step 1: Create free account**

Go to https://www.emailjs.com/ → Sign Up (free tier: 200 emails/month, no credit card).

- [ ] **Step 2: Add an Email Service**

Dashboard → Email Services → Add New Service → Choose Gmail (or any provider) → Connect your account → Note the **Service ID** (e.g. `service_abc123`).

- [ ] **Step 3: Create an Email Template**

Dashboard → Email Templates → Create New Template.

Set template content:
```
Subject: [Civil Lens Support] Message from {{from_name}}

From: {{from_name}} <{{from_email}}>

{{message}}
```

Save → Note the **Template ID** (e.g. `template_xyz789`).

- [ ] **Step 4: Get Public Key**

Dashboard → Account → General → **Public Key** (e.g. `abc123XYZ`).

- [ ] **Step 5: Add vars to .env.local**

Open `frontend/.env.local` and add:
```
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_abc123
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xyz789
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=abc123XYZ
```

Replace values with your actual IDs.

---

## Task 3: Add Donate + Support to NAV_LINKS

**Files:**
- Modify: `frontend/lib/constants.js`

- [ ] **Step 1: Update NAV_LINKS**

In `frontend/lib/constants.js`, replace the existing `NAV_LINKS` export:

```js
export const NAV_LINKS = [
  { href: '/', label: 'Daily Brief' },
  { href: '/history', label: 'Chronicle' },
  { href: '/intel-canvas', label: 'Signal Deck' },
  { href: '/donate', label: 'Donate' },
  { href: '/support', label: 'Support' },
];
```

- [ ] **Step 2: Verify in browser**

Start frontend dev server: `cd frontend && npm run dev`

Check that "Donate" and "Support" appear in the top nav. On screens narrower than `lg` breakpoint they appear in the hidden section — verify on desktop (≥1024px) they are visible. (The TopNav slices at index 3 for `md` screens and shows all at `lg`.)

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/constants.js
git commit -m "feat: add Donate and Support to nav links"
```

---

## Task 4: Fix TopNav Logout — Click-Outside + Display Name

**Files:**
- Modify: `frontend/components/layout/TopNav.js`

The `UserMenu` function needs two changes:
1. A `useRef` + `useEffect` click-outside listener to close the dropdown
2. The trigger button shows `user.displayName` (truncated) alongside the avatar

- [ ] **Step 1: Replace the UserMenu function**

Open `frontend/components/layout/TopNav.js`.

Replace the entire `UserMenu` function (from `function UserMenu` to the closing `}`) with:

```js
function UserMenu({ user, localMode = false }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const initials = useMemo(() => {
    const source = user?.displayName || user?.email || 'U';
    return source
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const displayName = useMemo(() => {
    const name = user?.displayName || user?.email || '';
    return name.length > 12 ? name.slice(0, 12) + '…' : name;
  }, [user]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => (localMode ? null : setOpen((prev) => !prev))}
        className="tap-target flex items-center gap-2 rounded-full border border-outline-variant bg-surface-mid px-3 py-1"
      >
        {user?.photoURL ? (
          <Image
            src={user.photoURL}
            alt="User avatar"
            width={28}
            height={28}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              localMode ? 'bg-secondary/25 text-secondary' : 'bg-primary text-on-primary'
            }`}
          >
            {initials}
          </span>
        )}
        {!localMode && (
          <span className="hidden text-sm text-on-surface sm:block">{displayName}</span>
        )}
      </button>

      {open && !localMode ? (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-outline-variant bg-surface p-1.5 shadow-xl">
          <button
            type="button"
            className="tap-target flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-mid"
            onClick={async () => {
              await signOutUser();
              setOpen(false);
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Add useRef to imports**

At the top of `TopNav.js`, the React import line currently reads:
```js
import { useMemo, useState } from 'react';
```

Change it to:
```js
import { useEffect, useMemo, useRef, useState } from 'react';
```

- [ ] **Step 3: Verify in browser**

1. Sign in with Google.
2. Click your name/avatar in the top nav → dropdown with "Sign out" appears.
3. Click outside the dropdown → it closes.
4. Click "Sign out" → redirected to `/login`.

- [ ] **Step 4: Commit**

```bash
git add frontend/components/layout/TopNav.js
git commit -m "fix: add click-outside handler and display name to UserMenu"
```

---

## Task 5: Create /donate Page

**Files:**
- Create: `frontend/pages/donate.js`
- Note: User will place `frontend/public/upi-qr.png` manually. Use a placeholder `upi-qr.png` path — the page will show a broken image until the file is added.

- [ ] **Step 1: Create the donate page**

Create `frontend/pages/donate.js`:

```js
import { useState } from 'react';
import { Heart, Copy, Check } from 'lucide-react';
import Head from 'next/head';

const UPI_ID = 'your-upi-id@upi'; // replace with your actual UPI ID

export default function DonatePage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Head>
        <title>Support Civil Lens</title>
      </Head>
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="glass-panel w-full max-w-sm rounded-panel border p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Heart className="h-7 w-7" />
          </div>

          <h1 className="font-headline text-3xl text-on-surface">Support Civil Lens</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            If this tool helps your UPSC prep, a small contribution keeps it running.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="rounded-xl border border-outline-variant bg-surface-mid p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/upi-qr.png"
                alt="UPI QR Code"
                width={180}
                height={180}
                className="h-44 w-44 rounded-lg object-contain"
              />
            </div>
          </div>

          <p className="mt-4 text-xs text-on-surface-variant">
            Scan with GPay, PhonePe, Paytm, or any UPI app
          </p>

          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-high px-4 py-2">
            <span className="font-mono text-sm text-on-surface">{UPI_ID}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="ml-1 rounded-md p-1 text-on-surface-variant transition hover:bg-surface-mid hover:text-on-surface"
              aria-label="Copy UPI ID"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          {copied && (
            <p className="mt-2 text-xs text-green-400">UPI ID copied!</p>
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Update UPI_ID constant**

On line `const UPI_ID = 'your-upi-id@upi';`, replace `your-upi-id@upi` with your actual UPI ID.

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3001/donate` (or whatever port Next.js runs on).

- Page shows the glass-panel card with heart icon, heading, QR placeholder (broken image until `upi-qr.png` is added), UPI ID, and copy button.
- Click Copy → text changes to checkmark, "UPI ID copied!" appears for 2 seconds.

- [ ] **Step 4: Commit**

```bash
git add frontend/pages/donate.js
git commit -m "feat: add /donate page with UPI QR and copy button"
```

---

## Task 6: Create /support Page with EmailJS Form

**Files:**
- Create: `frontend/pages/support.js`
- Requires: Task 1 (install) and Task 2 (EmailJS setup + .env.local) complete

- [ ] **Step 1: Create the support page**

Create `frontend/pages/support.js`:

```js
import { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import Head from 'next/head';

export default function SupportPage() {
  const formRef = useRef(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      await emailjs.sendForm(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        formRef.current,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
      );
      setStatus('success');
      formRef.current.reset();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err?.text || 'Failed to send. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Support — Civil Lens</title>
      </Head>
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="glass-panel w-full max-w-lg rounded-panel border p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-headline text-2xl text-on-surface">Get in Touch</h1>
              <p className="text-sm text-on-surface-variant">
                Feedback, bugs, or just want to say hi?
              </p>
            </div>
          </div>

          {status === 'success' ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-400" />
              <p className="text-base font-medium text-on-surface">Message sent!</p>
              <p className="text-sm text-on-surface-variant">
                I'll get back to you as soon as I can.
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-2 rounded-lg border border-outline-variant px-4 py-2 text-sm text-on-surface hover:bg-surface-mid"
              >
                Send another
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface-variant" htmlFor="from_name">
                  Name
                </label>
                <input
                  id="from_name"
                  name="from_name"
                  type="text"
                  required
                  placeholder="Your name"
                  className="rounded-lg border border-outline-variant bg-surface-mid px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/60 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface-variant" htmlFor="from_email">
                  Email
                </label>
                <input
                  id="from_email"
                  name="from_email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="rounded-lg border border-outline-variant bg-surface-mid px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/60 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface-variant" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  minLength={10}
                  rows={4}
                  placeholder="What's on your mind?"
                  className="resize-none rounded-lg border border-outline-variant bg-surface-mid px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/60 focus:outline-none"
                />
              </div>

              {status === 'error' && (
                <p className="text-xs text-red-400">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-60"
              >
                {status === 'sending' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify env vars are present**

```bash
grep 'EMAILJS' frontend/.env.local
```

Expected: 3 lines with `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`, `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`.

If missing, complete Task 2 first before testing.

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3000/support` (Next.js default port).

- Form shows Name, Email, Message fields and "Send Message" button.
- Submit with empty fields → browser native validation blocks submission.
- Submit valid form → button shows spinner → on success, green checkmark + success message appears.
- Click "Send another" → form resets to idle state.
- Check your email inbox — message should arrive.

- [ ] **Step 4: Commit**

```bash
git add frontend/pages/support.js
git commit -m "feat: add /support page with EmailJS contact form"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Check all nav links render**

Open `http://localhost:3000`. Confirm top nav shows: Daily Brief · Chronicle · Signal Deck · Donate · Support (at `lg` breakpoint). At `md` breakpoint, first 3 appear inline; Donate/Support are hidden (existing TopNav slice behavior).

- [ ] **Step 2: Check logout flow**

1. Sign in with Google.
2. Click name/avatar → dropdown appears with "Sign out".
3. Click outside → dropdown closes.
4. Click "Sign out" → redirected to `/login`.

- [ ] **Step 3: Check donate page**

Navigate to `/donate`. UPI ID copy button works. QR shows placeholder (add `frontend/public/upi-qr.png` to show real QR).

- [ ] **Step 4: Check support page**

Navigate to `/support`. Submit form → email arrives in inbox.

- [ ] **Step 5: Final commit if anything was missed**

```bash
git add -A
git status  # confirm only expected files
git commit -m "chore: final cleanup for auth/donate/support"
```
