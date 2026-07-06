export interface MonthlyInsights {
  month: string;
  trends: string[];
  recurringThemes: string[];
  highFrequencyTopics: string[];
  strategyNotes: string[];
  highPriorityDomains: string[];
  sourceDates: string[];
  updatedAt: string;
}

export interface MonthlyInsightsResponse {
  months: string[];
  currentMonth: string;
  selectedMonth: string;
  insights: MonthlyInsights;
}
