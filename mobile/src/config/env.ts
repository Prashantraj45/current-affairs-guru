const Config: Record<string, string> = {};
export const ENV = {
  API_URL: process.env.API_URL ?? 'http://localhost:3000',
  GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID ?? '',
};
