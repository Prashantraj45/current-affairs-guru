import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
  type: { type: String, default: 'system_memory', unique: true },
  date: String,
  trends: [String],
  recurringThemes: [String],
  highFrequencyTopics: [String],
  strategyNotes: [String],
  highPriorityDomains: [String],
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Memory', memorySchema);
