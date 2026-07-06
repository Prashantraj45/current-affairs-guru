import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  topicId: { type: String, required: true },
  date: { type: String, required: true },
  savedAt: { type: Date, default: Date.now },
}, { _id: false });

const historyRecordSchema = new mongoose.Schema({
  topicId: { type: String, required: true },
  date: { type: String, required: true },
  readAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  provider: { type: String, enum: ['google', 'apple'], required: true },
  email: { type: String, required: true },
  displayName: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  refreshTokenHash: { type: String, default: null },
  pushTokens: [{ type: String }],
  bookmarks: [bookmarkSchema],
  readingHistory: [historyRecordSchema],
}, {
  timestamps: true,
});

export default mongoose.model('User', userSchema);
