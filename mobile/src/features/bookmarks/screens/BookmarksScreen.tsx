import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useBookmarks } from '../hooks/useBookmarks';
import { useTheme } from '../../../hooks/useTheme';
import SafeScreen from '../../../components/layout/SafeScreen';
import { formatDate } from '../../../lib/date';
export default function BookmarksScreen() {
  const { bookmarks, remove } = useBookmarks();
  const { colors } = useTheme();
  return (
    <SafeScreen>
      <FlashList data={bookmarks} keyExtractor={(item: any) => item.topicId}
        renderItem={({ item }: any) => (
          <View style={[s.item, { backgroundColor: colors.card }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.id, { color: colors.text }]}>{item.topicId}</Text>
              <Text style={[s.date, { color: colors.subtext }]}>{formatDate(item.date)}</Text>
            </View>
            <Pressable onPress={() => remove.mutate(item.topicId)}><Text style={{ color: colors.error }}>Remove</Text></Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={[s.empty, { color: colors.subtext }]}>No bookmarks yet</Text>}
        contentContainerStyle={{ backgroundColor: colors.background, paddingBottom: 24 }}
      />
    </SafeScreen>
  );
}
const s = StyleSheet.create({ item: { flexDirection: 'row', alignItems: 'center', margin: 8, marginHorizontal: 16, borderRadius: 10, padding: 14 }, id: { fontSize: 14, fontWeight: '600' }, date: { fontSize: 12, marginTop: 3 }, empty: { textAlign: 'center', marginTop: 40, fontSize: 14 } });
