import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
export default function ErrorState({ onRetry, message = 'Something went wrong' }: { onRetry?: () => void; message?: string }) {
  return (
    <View style={s.c}>
      <Text style={s.msg}>{message}</Text>
      {onRetry && <Pressable style={s.btn} onPress={onRetry}><Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text></Pressable>}
    </View>
  );
}
const s = StyleSheet.create({ c: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }, msg: { color: '#666', fontSize: 15, textAlign: 'center', marginBottom: 16 }, btn: { backgroundColor: '#6366f1', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 } });
