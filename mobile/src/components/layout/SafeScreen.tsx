import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
export default function SafeScreen({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <SafeAreaView style={[s.s, { backgroundColor: colors.background }]}>{children}</SafeAreaView>;
}
const s = StyleSheet.create({ s: { flex: 1 } });
