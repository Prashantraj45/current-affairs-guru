import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ENV } from '../../config/env';
export function configureGoogleSignin() {
  GoogleSignin.configure({ webClientId: ENV.GOOGLE_WEB_CLIENT_ID, offlineAccess: false });
}
export async function googleSignIn(): Promise<string> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const { data } = await GoogleSignin.signIn();
  if (!data?.idToken) throw new Error('No idToken from Google');
  return data.idToken;
}
export async function googleSignOut() {
  try { await GoogleSignin.signOut(); } catch {}
}
