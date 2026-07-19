import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ENV } from '../../config/env';

export function configureGoogleSignin() {
  GoogleSignin.configure({
    webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
}

export async function googleSignIn(): Promise<string> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // Force a fresh sign-in by clearing any stale cached session first.
  // On Android emulators, cached sign-ins often return a null idToken.
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore – user may not have been signed in
  }

  // v16 API: signIn() returns { type, data } — must check type before accessing data
  const result = await GoogleSignin.signIn();

  if (result.type === 'cancelled') {
    throw new Error('Google Sign-In was cancelled');
  }

  // Prefer idToken from the signIn result (most reliable path)
  let idToken: string | null = result.data?.idToken ?? null;

  // Fall back to getTokens() in case the signIn result didn't carry an idToken
  if (!idToken) {
    const tokens = await GoogleSignin.getTokens();
    idToken = tokens.idToken ?? null;
  }

  if (!idToken) {
    throw new Error(
      'No idToken from Google. Ensure the Web Client ID is of type "Web application" and matches the one registered in GCP.',
    );
  }

  return idToken;
}

export async function googleSignOut() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore
  }
}
