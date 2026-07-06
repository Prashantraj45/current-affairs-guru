import React from 'react';
import { View, Text, Pressable, Switch, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { useTheme } from '../../../hooks/useTheme';
import { clearTokens } from '../../../services/auth/tokenService';
import { api } from '../../../services/api/endpoints';
import SafeScreen from '../../../components/layout/SafeScreen';
export default function SettingsScreen() {
  const { clearAuth, refreshToken } = useAuthStore();
  const { mode, setMode } = useThemeStore();
  const { colors } = useTheme();
  const handleLogout = () => Alert.alert('Sign Out', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: async () => { try { if (refreshToken) await api.auth.logout(refreshToken); } catch {} await clearTokens(); clearAuth(); } },
  ]);
  return (
    <SafeScreen>
      <View style={s.c}>
        <Text style={[s.heading, { color: colors.subtext }]}>Appearance</Text>
        <View style={[s.row, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text }}>Dark Mode</Text>
          <Switch value={mode === 'dark'} onValueChange={(v) => setMode(v ? 'dark' : 'light')} trackColor={{ true: colors.primary }} />
        </View>
        <Pressable style={[s.danger, { backgroundColor: colors.card }]} onPress={handleLogout}>
          <Text style={{ color: colors.error, fontWeight: '600' }}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeScreen>
  );
}
const s = StyleSheet.create({ c: { padding: 16, gap: 12 }, heading: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 16 }, danger: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 } });
