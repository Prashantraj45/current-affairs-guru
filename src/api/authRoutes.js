import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import User from '../models/User.js';
import { issueTokenPair, hashToken, compareToken, verifyRefreshToken } from '../lib/jwt.js';
import { secretManager } from '../../config/secrets.js';

const router = Router();
const googleClient = new OAuth2Client(secretManager.get('GOOGLE_CLIENT_ID'));

async function upsertUser({ uid, provider, email, displayName, photoUrl }) {
  return User.findOneAndUpdate(
    { uid },
    { $setOnInsert: { uid, provider, email: email || '', displayName: displayName || '', photoUrl: photoUrl || '' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

function userProfile(user) {
  return { uid: user.uid, provider: user.provider, email: user.email, displayName: user.displayName, photoUrl: user.photoUrl };
}

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'idToken required' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: secretManager.get('GOOGLE_CLIENT_ID'),
    });
    const { sub: uid, email, name: displayName, picture: photoUrl } = ticket.getPayload();

    const user = await upsertUser({ uid, provider: 'google', email, displayName, photoUrl });
    const { accessToken, refreshToken } = issueTokenPair(user.uid, user.email);

    user.refreshTokenHash = await hashToken(refreshToken);
    await user.save();

    res.json({ user: userProfile(user), accessToken, refreshToken });
  } catch (err) {
    console.error('[auth/google]', err.message);
    res.status(401).json({ error: 'Invalid Google ID token' });
  }
});

// POST /api/auth/apple
router.post('/apple', async (req, res) => {
  const { identityToken, fullName, email } = req.body;
  if (!identityToken) return res.status(400).json({ error: 'identityToken required' });

  try {
    const { sub: uid } = await appleSignin.verifyIdToken(identityToken, {
      audience: secretManager.get('APPLE_CLIENT_ID'),
      ignoreExpiration: false,
    });

    const displayName = fullName
      ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ')
      : '';

    const user = await upsertUser({ uid, provider: 'apple', email: email || '', displayName, photoUrl: '' });

    // Apple only sends email on first sign-in — persist it if we got it
    if (email && !user.email) {
      user.email = email;
    }
    if (displayName && !user.displayName) {
      user.displayName = displayName;
    }

    const { accessToken, refreshToken } = issueTokenPair(user.uid, user.email);
    user.refreshTokenHash = await hashToken(refreshToken);
    await user.save();

    res.json({ user: userProfile(user), accessToken, refreshToken });
  } catch (err) {
    console.error('[auth/apple]', err.message);
    res.status(401).json({ error: 'Invalid Apple identity token' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

  try {
    const { uid } = verifyRefreshToken(refreshToken);
    const user = await User.findOne({ uid });

    if (!user?.refreshTokenHash) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }

    const valid = await compareToken(refreshToken, user.refreshTokenHash);
    if (!valid) return res.status(401).json({ error: 'Invalid refresh token' });

    const tokens = issueTokenPair(user.uid, user.email);
    user.refreshTokenHash = await hashToken(tokens.refreshToken);
    await user.save();

    res.json({ user: userProfile(user), ...tokens });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    try {
      const { uid } = verifyRefreshToken(refreshToken);
      await User.findOneAndUpdate({ uid }, { refreshTokenHash: null });
    } catch {
      // Token already invalid — still return success
    }
  }
  res.json({ status: 'logged out' });
});

export default router;
