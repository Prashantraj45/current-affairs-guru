import mongoose from 'mongoose';

const mcqSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String
}, { _id: false });

const prelimsSchema = new mongoose.Schema({
  key_facts: [String],
  mcq: mcqSchema
}, { _id: false });

const answerFrameworkSchema = new mongoose.Schema({
  intro: String,
  body: [String],
  conclusion: String
}, { _id: false });

const mainsSchema = new mongoose.Schema({
  gs_paper: String,
  question: String,
  answer_framework: answerFrameworkSchema
}, { _id: false });

const topicSchema = new mongoose.Schema({
  id: { type: String, index: true },
  title: String,
  category: String,
  importance: String,
  score: Number,
  summary: String,
  why_in_news: String,
  explanation: String,
  facts: [String],
  tags: [String],
  prelims: prelimsSchema,
  mains: mainsSchema,
  revision_note: String,
}, { _id: false });

const insightsSchema = new mongoose.Schema({
  trends: [String],
  recurringThemes: [String],
  strategyNotes: [String],
  highPriorityDomains: [String],
}, { _id: false });

const entrySchema = new mongoose.Schema({
  date: { type: String, unique: true, index: true },
  topics: [topicSchema],
  insights: insightsSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Entry', entrySchema);
