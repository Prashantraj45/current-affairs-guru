import React from 'react';
import { Text, StyleSheet } from 'react-native';
type Color = 'default' | 'red' | 'amber' | 'green';
const colorMap: Record<Color, { bg: string; text: string }> = {
  default: { bg: '#e0e7ff', text: '#4338ca' }, red: { bg: '#fee2e2', text: '#dc2626' },
  amber: { bg: '#fef3c7', text: '#d97706' }, green: { bg: '#dcfce7', text: '#16a34a' },
};
export default function Badge({ label, color = 'default' }: { label: string; color?: Color }) {
  const { bg, text } = colorMap[color];
  return <Text style={[styles.b, { backgroundColor: bg, color: text }]}>{label}</Text>;
}
const styles = StyleSheet.create({ b: { fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, overflow: 'hidden' } });
