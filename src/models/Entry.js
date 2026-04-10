import mongoose from 'mongoose';

const mcqSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
}, { _id: false });

const prelimsSchema = new mongoose.Schema({
  key_facts: [String],
  mcq: mcqSchema,
}, { _id: false });

const answerFrameworkSchema = new mongoose.Schema({
  intro: String,
  body: [String],
  conclusion: String,
}, { _id: false });

const mainsSchema = new mongoose.Schema({
  gs_paper: String,
  question: String,
  answer_framework: answerFrameworkSchema,
}, { _id: false });

const topicSchema = new mongoose.Schema({
  id: { type: String, index: true },
  type: { type: String, enum: ['topic', 'case-study', 'fact-sheet'], default: 'topic' },
  title: String,
  category: String,
  importance: String,
  score: Number,
  summary: String,
  why_in_news: String,
  keyPoints: [String],
  backgroundContext: [String],
  editorialInsights: [String],
  interlinkages: [String],
  explanation: String,
  facts: [String],
  tags: [String],
  prelims: prelimsSchema,
  mains: mainsSchema,
  revision_note: String,
}, { _id: false });

// Lightweight card — auto-generated from topic, no heavy text
const cardSchema = new mongoose.Schema({
  id: String,
  title: String,
  type: String,
  shortSummary: String,
  tags: [String],
  importance: String,
}, { _id: false });

// Standalone MCQ — daily practice set (5-8 per day)
const mcqStandaloneSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
  explanation: String,
  topic: String,
}, { _id: false });

// Case study — policy/governance deep dives (3-4 per day)
const caseStudySchema = new mongoose.Schema({
  title: String,
  context: String,
  problem: String,
  intervention: String,
  outcome: String,
  learningPoints: [String],
  tags: [String],
}, { _id: false });

// Stored as "insights" in MongoDB for backward compat; exposed as "signalDeck" in API
const insightsSchema = new mongoose.Schema({
  trends: [String],
  recurringThemes: [String],
  highFrequencyTopics: [String],
  strategyNotes: [String],
  highPriorityDomains: [String],
  editorialPatterns: [String],
}, { _id: false });

const entrySchema = new mongoose.Schema({
  date: { type: String, unique: true, index: true },
  topics: [topicSchema],
  cards: [cardSchema],
  mcqs: [mcqStandaloneSchema],
  caseStudies: [caseStudySchema],
  insights: insightsSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Entry', entrySchema);
