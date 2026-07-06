export interface MCQ {
  question: string;
  options: string[];
  answer: string;
}

export interface Prelims {
  key_facts: string[];
  mcq: MCQ;
}

export interface AnswerFramework {
  intro: string;
  body: string[];
  conclusion: string;
}

export interface Mains {
  gs_paper: string;
  question: string;
  answer_framework: AnswerFramework;
}

export type TopicType = 'topic' | 'case-study' | 'fact-sheet';
export type Importance = 'High' | 'Medium' | 'Low';

export interface Topic {
  id: string;
  type: TopicType;
  title: string;
  category: string;
  importance: Importance;
  score: number;
  summary: string;
  why_in_news: string;
  keyPoints: string[];
  backgroundContext: string[];
  editorialInsights: string[];
  interlinkages: string[];
  explanation: string;
  facts: string[];
  tags: string[];
  sources?: string[];
  prelims: Prelims;
  mains: Mains;
  revision_note: string;
}

export interface Card {
  id: string;
  title: string;
  type: TopicType;
  shortSummary: string;
  tags: string[];
  importance: Importance;
}

export interface StandaloneMCQ {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
}

export interface CaseStudy {
  title: string;
  context: string;
  problem: string;
  intervention: string;
  outcome: string;
  learningPoints: string[];
  tags: string[];
}
