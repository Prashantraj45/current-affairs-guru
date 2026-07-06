import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../../navigation/types';
import { useTopicDetail } from '../hooks/useTopicDetail';
import { useTheme } from '../../../hooks/useTheme';
import LoadingState from '../../../components/ui/LoadingState';
import ErrorState from '../../../components/ui/ErrorState';
import Badge from '../../../components/ui/Badge';
type Props = NativeStackScreenProps<HomeStackParamList, 'TopicDetail'>;
export default function TopicDetailScreen({ route }: Props) {
  const { topicId, date } = route.params;
  const { data, isLoading, error, refetch } = useTopicDetail(topicId, date);
  const { colors } = useTheme();
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState onRetry={refetch} />;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={s.c}>
      <View style={s.badges}><Badge label={data.category} /><Badge label={data.importance} color={data.importance === 'High' ? 'red' : 'amber'} /></View>
      <Text style={[s.title, { color: colors.text }]}>{data.title}</Text>
      {[['Why in News', data.why_in_news], ['Summary', data.summary], ['Explanation', data.explanation]].map(([label, val]) => val ? (
        <View key={label as string}><Text style={[s.sec, { color: colors.primary }]}>{label}</Text><Text style={[s.body, { color: colors.text }]}>{val}</Text></View>
      ) : null)}
      {data.keyPoints?.length > 0 && (<><Text style={[s.sec, { color: colors.primary }]}>Key Points</Text>{data.keyPoints.map((p: string, i: number) => <Text key={i} style={[s.bullet, { color: colors.text }]}>• {p}</Text>)}</>)}
      {data.prelims?.mcq && (<><Text style={[s.sec, { color: colors.primary }]}>Prelims MCQ</Text><Text style={[s.body, { color: colors.text }]}>{data.prelims.mcq.question}</Text>{data.prelims.mcq.options.map((o: string, i: number) => <Text key={i} style={[s.bullet, { color: colors.subtext }]}>{String.fromCharCode(65+i)}. {o}</Text>)}<Text style={[s.answer, { color: colors.success }]}>Answer: {data.prelims.mcq.answer}</Text></>)}
      {data.mains?.question && (<><Text style={[s.sec, { color: colors.primary }]}>Mains Question</Text><Text style={[s.body, { color: colors.text }]}>{data.mains.question}</Text></>)}
      {data.revision_note && (<><Text style={[s.sec, { color: colors.primary }]}>Revision Note</Text><Text style={[s.body, { color: colors.text }]}>{data.revision_note}</Text></>)}
    </ScrollView>
  );
}
const s = StyleSheet.create({ c: { padding: 16, paddingBottom: 48 }, badges: { flexDirection: 'row', gap: 8, marginBottom: 12 }, title: { fontSize: 20, fontWeight: '700', marginBottom: 16, lineHeight: 28 }, sec: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 8 }, body: { fontSize: 15, lineHeight: 23 }, bullet: { fontSize: 14, lineHeight: 22, marginLeft: 8, marginBottom: 4 }, answer: { fontSize: 14, fontWeight: '600', marginTop: 8 } });
