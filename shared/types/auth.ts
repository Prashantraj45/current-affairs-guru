export type AuthProvider = 'google' | 'apple';

export interface UserProfile {
  uid: string;
  provider: AuthProvider;
  email: string;
  displayName: string;
  photoUrl: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export interface Bookmark {
  topicId: string;
  date: string;
  savedAt: string;
}

export interface HistoryRecord {
  topicId: string;
  date: string;
  readAt: string;
}
