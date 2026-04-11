import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';

export const oauthDisabled = process.env.NEXT_PUBLIC_DISABLE_OAUTH_LOCAL === 'true';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseConfig =
  !oauthDisabled &&
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

const app = hasFirebaseConfig
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

export const auth = app ? getAuth(app) : null;
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

let persistenceReady = null;

const ensureAuthPersistence = async () => {
  if (!auth) return;
  if (!persistenceReady) {
    persistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
      persistenceReady = null;
      throw error;
    });
  }
  await persistenceReady;
};

const shouldUseRedirectFallback = (error) => {
  const code = error?.code || '';
  return [
    'auth/popup-blocked',
    'auth/popup-closed-by-user',
    'auth/cancelled-popup-request',
    'auth/web-storage-unsupported',
    'auth/operation-not-supported-in-this-environment',
  ].includes(code);
};

const formatAuthError = (error) => {
  const code = error?.code || '';

  if (code === 'auth/unauthorized-domain') {
    return new Error(
      'This app domain is not authorized in Firebase Auth. Add the current site to Firebase Authentication > Settings > Authorized domains.'
    );
  }

  if (code === 'auth/operation-not-allowed') {
    return new Error('Google sign-in is not enabled for this Firebase project.');
  }

  if (code === 'auth/popup-closed-by-user') {
    return new Error('The Google sign-in popup was closed before the sign-in finished.');
  }

  if (code === 'auth/network-request-failed') {
    return new Error('Google sign-in could not reach Firebase. Check your network and try again.');
  }

  return error instanceof Error ? error : new Error('Could not sign in with Google.');
};

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error('Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* variables.');
  }

  await ensureAuthPersistence();

  try {
    const result = await signInWithPopup(auth, provider);
    return { redirected: false, result };
  } catch (error) {
    if (shouldUseRedirectFallback(error)) {
      await signInWithRedirect(auth, provider);
      return { redirected: true, result: null };
    }

    throw formatAuthError(error);
  }
};

export const completeGoogleRedirectSignIn = async () => {
  if (!auth) return null;

  await ensureAuthPersistence();

  try {
    return await getRedirectResult(auth);
  } catch (error) {
    throw formatAuthError(error);
  }
};

export const signOutUser = async () => {
  if (!auth) return;
  await auth.signOut();
};
