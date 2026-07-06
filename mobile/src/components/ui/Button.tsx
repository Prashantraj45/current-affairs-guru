import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
export default function Button({ label, onPress, loading, variant = 'primary' }: { label: string; onPress: () => void; loading?: boolean; variant?: 'primary' | 'danger' }) {
  return (
    <Pressable style={[styles.btn, { backgroundColor: variant === 'danger' ? '#ef4444' : '#6366f1' }]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.lbl}>{label}</Text>}
    </Pressable>
  );
}
const styles = StyleSheet.create({ btn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' }, lbl: { color: '#fff', fontWeight: '700', fontSize: 15 } });
