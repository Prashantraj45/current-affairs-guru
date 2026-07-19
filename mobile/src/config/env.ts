import Config from 'react-native-config';
export const ENV = {
  API_URL: Config.API_URL ?? 'http://localhost:3001',
  GOOGLE_WEB_CLIENT_ID: Config.GOOGLE_WEB_CLIENT_ID ?? '',
};
