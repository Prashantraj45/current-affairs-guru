export type RootStackParamList = { Auth: undefined; App: undefined; };
export type AuthStackParamList = { Welcome: undefined; Login: undefined; };
export type AppTabParamList = { Home: undefined; Discover: undefined; Practice: undefined; History: undefined; Profile: undefined; };
export type HomeStackParamList = { Feed: undefined; TopicDetail: { topicId: string; date?: string }; };
export type DiscoverStackParamList = { Search: undefined; TopicDetail: { topicId: string; date?: string }; };
export type PracticeStackParamList = { MCQ: undefined; Insights: undefined; };
export type HistoryStackParamList = { HistoryList: undefined; TopicDetail: { topicId: string; date?: string }; };
export type ProfileStackParamList = { Bookmarks: undefined; Settings: undefined; };
