import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { googleSignIn, configureGoogleSignin } from '../../../services/auth/googleAuth';
import { appleSignIn, isAppleAuthAvailable } from '../../../services/auth/appleAuth';
import { api } from '../../../services/api/endpoints';
import { saveTokens } from '../../../services/auth/tokenService';
configureGoogleSignin();
export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const handleGoogle = async () => {
    try { setLoading('google'); const idToken = await googleSignIn(); const data = await api.auth.google(idToken); await saveTokens(data.accessToken, data.refreshToken); setAuth(data.user, data.accessToken, data.refreshToken); }
    catch (err: any) { Alert.alert('Sign In Failed', err.message); } finally { setLoading(null); }
  };
  const handleApple = async () => {
    try { setLoading('apple'); const { identityToken, fullName, email } = await appleSignIn(); const data = await api.auth.apple(identityToken, fullName, email); await saveTokens(data.accessToken, data.refreshToken); setAuth(data.user, data.accessToken, data.refreshToken); }
    catch (err: any) { Alert.alert('Sign In Failed', err.message); } finally { setLoading(null); }
  };
  return (
    <View style={s.c}>
      <Text style={s.title}>Sign In</Text>
      <Pressable style={[s.btn, s.google]} onPress={handleGoogle} disabled={!!loading}>
        {loading === 'google' ? <ActivityIndicator color="#333" /> : <Text style={s.googleText}>Continue with Google</Text>}
      </Pressable>
      {isAppleAuthAvailable && (
        <Pressable style={[s.btn, s.apple]} onPress={handleApple} disabled={!!loading}>
          {loading === 'apple' ? <ActivityIndicator color="#fff" /> : <Text style={s.appleText}> Sign in with Apple</Text>}
        </Pressable>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', padding: 32, backgroundColor: '#1a1a2e', gap: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#e0e0e0', marginBottom: 24, textAlign: 'center' },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  google: { backgroundColor: '#fff' }, googleText: { color: '#333', fontWeight: '700', fontSize: 16 },
  apple: { backgroundColor: '#000' }, appleText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
