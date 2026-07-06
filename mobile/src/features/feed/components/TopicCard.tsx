import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import Badge from '../../../components/ui/Badge';
interface Topic { id: string; title: string; summary: string; category: string; importance: string; tags: string[]; }
export default function TopicCard({ topic, onPress }: { topic: Topic; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, { backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 }]}>
      <View style={s.row}>
        <Badge label={topic.category} />
        <Badge label={topic.importance} color={topic.importance === 'High' ? 'red' : topic.importance === 'Medium' ? 'amber' : 'green'} />
      </View>
      <Text style={[s.title, { color: colors.text }]} numberOfLines={2}>{topic.title}</Text>
      <Text style={[s.summary, { color: colors.subtext }]} numberOfLines={3}>{topic.summary}</Text>
      <View style={s.tags}>
        {(topic.tags ?? []).slice(0, 3).map((t) => <Text key={t} style={[s.tag, { color: colors.primary, borderColor: colors.primary }]}>{t}</Text>)}
      </View>
    </Pressable>
  );
}
const s = StyleSheet.create({
  card: { margin: 8, marginHorizontal: 16, borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 }, title: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  summary: { fontSize: 13, lineHeight: 19, marginBottom: 10 }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
});
