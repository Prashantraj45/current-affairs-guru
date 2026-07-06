import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
export default function LoadingState() {
  return <View style={s.c}><ActivityIndicator size="large" color="#6366f1" /></View>;
}
const s = StyleSheet.create({ c: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
