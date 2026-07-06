import React, { useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFeed } from '../hooks/useFeed';
import TopicCard from '../components/TopicCard';
import FeedSkeleton from '../components/FeedSkeleton';
import { useTheme } from '../../../hooks/useTheme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../../navigation/types';
import SafeScreen from '../../../components/layout/SafeScreen';
import { formatDate } from '../../../lib/date';
type Props = NativeStackScreenProps<HomeStackParamList, 'Feed'>;
export default function FeedScreen({ navigation }: Props) {
  const { data, isLoading, refetch, isRefetching } = useFeed();
  const { colors } = useTheme();
  const onPress = useCallback((topic: any) => navigation.navigate('TopicDetail', { topicId: topic.id, date: data?.date }), [navigation, data?.date]);
  if (isLoading) return <FeedSkeleton />;
  return (
    <SafeScreen>
      <FlashList
        data={data?.topics ?? []}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: any) => <TopicCard topic={item} onPress={() => onPress(item)} />}
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={[s.date, { color: colors.subtext }]}>{data?.date ? formatDate(data.date) : ''}</Text>
            <Text style={[s.title, { color: colors.text }]}>Today's Current Affairs</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={{ backgroundColor: colors.background, paddingBottom: 24 }}
      />
    </SafeScreen>
  );
}
const s = StyleSheet.create({ header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }, date: { fontSize: 12, marginBottom: 4 }, title: { fontSize: 22, fontWeight: '700' } });
