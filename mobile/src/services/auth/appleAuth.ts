import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
export const isAppleAuthAvailable = Platform.OS === 'ios';
export async function appleSignIn() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  return {
    identityToken: credential.identityToken!,
    fullName: credential.fullName ?? undefined,
    email: credential.email ?? undefined,
  };
}
