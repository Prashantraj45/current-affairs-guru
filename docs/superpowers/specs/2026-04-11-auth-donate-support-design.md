# Design Spec: Auth Logout Fix + Donate + Support Pages

**Date:** 2026-04-11  
**Project:** Civil Lens (current-affairs-guru)  
**Scope:** Fix logout UX, add `/donate` page (UPI QR), add `/support` page (EmailJS contact form)

---

## 1. Auth / Logout Fix

### Problem
`UserMenu` in `frontend/components/layout/TopNav.js` opens a dropdown on avatar click but has no click-outside handler, making it feel broken. The user's display name is not shown alongside the avatar, so the button doesn't look interactive.

### Fix
**File:** `frontend/components/layout/TopNav.js` — `UserMenu` function only.

- Add `useRef` + `useEffect` click-outside listener: `document.addEventListener('mousedown', handler)` closes dropdown when clicking outside the menu container.
- Show user's display name (truncated to ~12 chars with ellipsis) next to the avatar in the trigger button so it's visually clear the button is interactive.
- Existing sign-out logic is correct: `signOutUser()` → Firebase signs out → `AuthGuard` redirects to `/login`. No changes needed there.
- `localMode` behavior unchanged (click disabled).

**No new files. No backend changes.**

---

## 2. `/donate` Page — UPI QR

### New file
`frontend/pages/donate.js`

### Layout
- Full-page centered layout (no `AppShell` nav content, just the page within the shell)
- Glass-panel card (`glass-panel` class, consistent with `login.js`)
- Icon: `Heart` from lucide-react in `bg-primary/15` rounded square
- Heading: "Support Civil Lens"
- Subtext: "If this tool helps your UPSC prep, a small contribution keeps it running."

### UPI QR
- Image: `frontend/public/upi-qr.png` (user provides the file)
- Displayed at ~200×200px, centered, with subtle border
- UPI ID text below: e.g. `yourname@upi`
- **Copy button** next to UPI ID: copies to clipboard, shows "Copied!" for 2s then resets
- Note: "Scan with GPay, PhonePe, Paytm, or any UPI app"

### Nav
- Added to `NAV_LINKS` in `frontend/lib/constants.js` as `{ href: '/donate', label: 'Donate' }`

---

## 3. `/support` Page — EmailJS Contact Form

### New file
`frontend/pages/support.js`

### Layout
- Glass-panel card, same design language
- Icon: `Mail` from lucide-react
- Heading: "Get in Touch"
- Subtext: "Have feedback, found a bug, or just want to say hi?"

### Form Fields
| Field | Type | Validation |
|-------|------|------------|
| Name | text input | required |
| Email | email input | required, valid email |
| Message | textarea (4 rows) | required, min 10 chars |

### Submission — EmailJS
- Package: `@emailjs/browser` (client-side, free tier: 200 emails/month)
- Env vars needed (all `NEXT_PUBLIC_`):
  - `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
  - `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`
  - `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`
- On submit: show spinner, call `emailjs.sendForm(...)`, on success show inline success message, on error show inline error.
- No backend endpoint changes.

### Nav
- Added to `NAV_LINKS` as `{ href: '/support', label: 'Support' }`

---

## 4. NAV_LINKS Update

`frontend/lib/constants.js` — update `NAV_LINKS`:

```js
export const NAV_LINKS = [
  { href: '/', label: 'Daily Brief' },
  { href: '/history', label: 'Chronicle' },
  { href: '/intel-canvas', label: 'Signal Deck' },
  { href: '/donate', label: 'Donate' },
  { href: '/support', label: 'Support' },
];
```

Both new links appear in the top nav. On smaller screens they fall into the `lg:flex` section (already sliced at index 3 in `TopNav.js`).

---

## 5. Dependencies

| Package | Where | Why |
|---------|-------|-----|
| `@emailjs/browser` | frontend | Client-side email via EmailJS |

No new backend packages.

---

## 6. Files Changed / Created

| File | Action |
|------|--------|
| `frontend/components/layout/TopNav.js` | Edit — add click-outside, show display name |
| `frontend/lib/constants.js` | Edit — add Donate + Support to NAV_LINKS |
| `frontend/pages/donate.js` | Create |
| `frontend/pages/support.js` | Create |
| `frontend/public/upi-qr.png` | User provides |
| `frontend/.env.local` | User adds EMAILJS vars |

---

## 7. Out of Scope

- Email/password auth (Google Sign-In only, already working)
- Razorpay / payment gateway
- Backend email relay
- Auth changes beyond the logout UX fix
