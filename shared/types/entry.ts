import { Topic, Card, StandaloneMCQ, CaseStudy } from './topic';

export interface SignalDeck {
  trends: string[];
  recurringThemes: string[];
  highFrequencyTopics: string[];
  strategyNotes: string[];
  highPriorityDomains: string[];
  editorialPatterns: string[];
}

export interface DailyEntry {
  date: string;
  topics: Topic[];
  cards: Card[];
  mcqs: StandaloneMCQ[];
  caseStudies: CaseStudy[];
  insights: SignalDeck;
  signalDeck: SignalDeck;
}

export interface HistoryEntry {
  date: string;
  topicCount: number;
  topics: Topic[];
}

export interface HistoryResponse {
  total: number;
  entries: HistoryEntry[];
}
