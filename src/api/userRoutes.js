import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import User from '../models/User.js';

const router = Router();
router.use(authenticate);

// GET /api/user/me
router.get('/me', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select('-refreshTokenHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ uid: user.uid, provider: user.provider, email: user.email, displayName: user.displayName, photoUrl: user.photoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/bookmarks
router.get('/bookmarks', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select('bookmarks');
    res.json({ bookmarks: user?.bookmarks || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/bookmarks/:topicId
router.post('/bookmarks/:topicId', async (req, res) => {
  const { topicId } = req.params;
  const { date } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date (YYYY-MM-DD) required' });
  }
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid, 'bookmarks.topicId': { $ne: topicId } },
      { $push: { bookmarks: { topicId, date, savedAt: new Date() } } },
      { new: true }
    );
    res.json({ bookmarks: user?.bookmarks || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/user/bookmarks/:topicId
router.delete('/bookmarks/:topicId', async (req, res) => {
  const { topicId } = req.params;
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $pull: { bookmarks: { topicId } } },
      { new: true }
    );
    res.json({ bookmarks: user?.bookmarks || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/history
router.get('/history', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const user = await User.findOne({ uid: req.user.uid }).select('readingHistory');
    const all = user?.readingHistory || [];
    const sorted = [...all].sort((a, b) => new Date(b.readAt) - new Date(a.readAt));
    const total = sorted.length;
    const items = sorted.slice((page - 1) * limit, page * limit);
    res.json({ total, page, limit, history: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/history
router.post('/history', async (req, res) => {
  const { topicId, date } = req.body;
  if (!topicId || !date) return res.status(400).json({ error: 'topicId and date required' });
  try {
    await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $push: { readingHistory: { $each: [{ topicId, date, readAt: new Date() }], $slice: -500 } } }
    );
    res.json({ status: 'recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/push-token
router.post('/push-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $addToSet: { pushTokens: token } }
    );
    res.json({ status: 'registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/user/push-token
router.delete('/push-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $pull: { pushTokens: token } }
    );
    res.json({ status: 'removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
