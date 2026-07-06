import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useHistory } from '../hooks/useHistory';
import { useTheme } from '../../../hooks/useTheme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HistoryStackParamList } from '../../../navigation/types';
import SafeScreen from '../../../components/layout/SafeScreen';
import { formatDate } from '../../../lib/date';
import LoadingState from '../../../components/ui/LoadingState';
type Props = NativeStackScreenProps<HistoryStackParamList, 'HistoryList'>;
export default function HistoryScreen({ navigation }: Props) {
  const { data, isLoading } = useHistory();
  const { colors } = useTheme();
  if (isLoading) return <LoadingState />;
  return (
    <SafeScreen>
      <FlashList
        data={data?.entries ?? []}
        keyExtractor={(item: any) => item.date}
        renderItem={({ item }: any) => (
          <Pressable style={[s.item, { backgroundColor: colors.card }]} onPress={() => item.topics?.[0] && navigation.navigate('TopicDetail', { topicId: item.topics[0].id, date: item.date })}>
            <Text style={[s.date, { color: colors.text }]}>{formatDate(item.date)}</Text>
            <Text style={[s.count, { color: colors.subtext }]}>{item.topicCount} topics</Text>
          </Pressable>
        )}
        contentContainerStyle={{ backgroundColor: colors.background, paddingBottom: 24 }}
      />
    </SafeScreen>
  );
}
const s = StyleSheet.create({ item: { margin: 8, marginHorizontal: 16, borderRadius: 10, padding: 16 }, date: { fontSize: 15, fontWeight: '600' }, count: { fontSize: 13, marginTop: 4 } });
