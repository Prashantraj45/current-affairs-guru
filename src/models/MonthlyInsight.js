import mongoose from 'mongoose';

const monthlyInsightSchema = new mongoose.Schema({
  month: { type: String, unique: true, index: true }, // YYYY-MM
  trends: [String],
  recurringThemes: [String],
  highFrequencyTopics: [String],
  strategyNotes: [String],
  highPriorityDomains: [String],
  sourceDates: [String],
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('MonthlyInsight', monthlyInsightSchema);
