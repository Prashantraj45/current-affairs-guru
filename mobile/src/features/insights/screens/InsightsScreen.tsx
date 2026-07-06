import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api/endpoints';
import { useTheme } from '../../../hooks/useTheme';
import SafeScreen from '../../../components/layout/SafeScreen';
import LoadingState from '../../../components/ui/LoadingState';
export default function InsightsScreen() {
  const { data, isLoading } = useQuery({ queryKey: ['insights'], queryFn: api.insights });
  const { colors } = useTheme();
  if (isLoading) return <LoadingState />;
  const sections = [['Trends', data?.trends], ['Recurring Themes', data?.recurringThemes], ['High Frequency Topics', data?.highFrequencyTopics], ['Strategy Notes', data?.strategyNotes], ['High Priority Domains', data?.highPriorityDomains]];
  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.c}>
        {sections.map(([label, items]: any) => items?.length ? (
          <View key={label} style={[s.sec, { backgroundColor: colors.card }]}>
            <Text style={[s.lbl, { color: colors.primary }]}>{label}</Text>
            {items.map((item: string, i: number) => <Text key={i} style={[s.item, { color: colors.text }]}>• {item}</Text>)}
          </View>
        ) : null)}
      </ScrollView>
    </SafeScreen>
  );
}
const s = StyleSheet.create({ c: { padding: 16, gap: 12, paddingBottom: 48 }, sec: { borderRadius: 12, padding: 16 }, lbl: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }, item: { fontSize: 14, lineHeight: 22 } });
