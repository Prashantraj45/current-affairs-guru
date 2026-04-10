import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  id: String,
  title: String,
  category: String,
  upsc_relevance_score: Number,
  why_in_news: String,
  core_concept: String,
  explanation: String,
  prelims: {
    key_facts: [String],
    mcq: {
      question: String,
      options: [String],
      answer: String
    }
  },
  mains: {
    gs_paper: String,
    question: String,
    answer_framework: {
      intro: String,
      body: [String],
      conclusion: String
    }
  },
  revision_note_50_words: String,
  static_link: String,
  sources: [{
    name: String,
    url: String
  }],
  metadata: {
    date: String,
    importance_tag: String,
    repeat_topic_probability: String
  }
});

const planSchema = new mongoose.Schema({
  identified_topics: [String],
  merge_groups: [String],
  priority_topics: [String],
  rejected_count_estimate: Number,
  processing_strategy: String
});

const readmeSchema = new mongoose.Schema({
  date: String,
  version: String,
  summary: String,
  high_priority_domains: [String],
  key_trends: [String],
  recurring_topics: [String],
  static_focus_areas: [String],
  exam_strategy_notes: [String],
  data_quality_notes: String
});

const uiOutputSchema = new mongoose.Schema({
  dashboard: mongoose.Schema.Types.Mixed,
  topic_detail: mongoose.Schema.Types.Mixed,
  history: mongoose.Schema.Types.Mixed,
  insights: mongoose.Schema.Types.Mixed
});

const entrySchema = new mongoose.Schema({
  date: { type: String, unique: true, index: true },
  plan: planSchema,
  readme: readmeSchema,
  topics: [topicSchema],
  ui_output: uiOutputSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Entry', entrySchema);
