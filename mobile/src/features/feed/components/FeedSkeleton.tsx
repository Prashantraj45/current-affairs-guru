import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../../../components/ui/Skeleton';
export default function FeedSkeleton() {
  return (
    <View style={s.c}>
      {[1,2,3,4].map((i) => (
        <View key={i} style={s.card}>
          <View style={s.row}><Skeleton width={80} height={22} borderRadius={12} /><Skeleton width={60} height={22} borderRadius={12} /></View>
          <Skeleton width="100%" height={18} borderRadius={4} />
          <Skeleton width="85%" height={18} borderRadius={4} />
          <Skeleton width="100%" height={13} borderRadius={4} />
          <Skeleton width="90%" height={13} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}
const s = StyleSheet.create({ c: { padding: 16, gap: 12 }, card: { backgroundColor: '#f0f0f0', borderRadius: 12, padding: 16, gap: 8 }, row: { flexDirection: 'row', gap: 8 } });
