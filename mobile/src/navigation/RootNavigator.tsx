import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { useAuthStore } from '../store/authStore';
import { getAccessToken, getRefreshToken, isTokenExpired } from '../services/auth/tokenService';
import { api } from '../services/api/endpoints';
import { saveTokens } from '../services/auth/tokenService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const accessToken = await getAccessToken();
        const refreshToken = await getRefreshToken();
        if (!accessToken || !refreshToken) { clearAuth(); return; }
        if (!isTokenExpired(accessToken)) {
          const user = await api.user.me();
          setAuth(user, accessToken, refreshToken);
        } else {
          const data = await api.auth.refresh(refreshToken);
          await saveTokens(data.accessToken, data.refreshToken);
          setAuth(data.user, data.accessToken, data.refreshToken);
        }
      } catch { clearAuth(); }
      finally { setBooting(false); }
    })();
  }, []);

  if (booting) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <NavigationContainer linking={{ prefixes: ['cag://'], config: { screens: { App: 'app' } } as any }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? <Stack.Screen name="App" component={AppNavigator} /> : <Stack.Screen name="Auth" component={AuthNavigator} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
