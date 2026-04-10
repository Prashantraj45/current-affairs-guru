import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
  type: { type: String, default: 'system_memory', unique: true },
  date: String,
  version: String,
  summary: String,
  high_priority_domains: [String],
  key_trends: [String],
  recurring_topics: [String],
  static_focus_areas: [String],
  exam_strategy_notes: [String],
  data_quality_notes: String,
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Memory', memorySchema);
