import React, { useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useSearch } from '../hooks/useSearch';
import { useTheme } from '../../../hooks/useTheme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiscoverStackParamList } from '../../../navigation/types';
import SafeScreen from '../../../components/layout/SafeScreen';
import Badge from '../../../components/ui/Badge';
type Props = NativeStackScreenProps<DiscoverStackParamList, 'Search'>;
export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const { results } = useSearch(query);
  const { colors } = useTheme();
  return (
    <SafeScreen>
      <View style={[s.inputWrap, { backgroundColor: colors.card }]}>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search topics, categories, tags..." placeholderTextColor={colors.subtext} style={[s.input, { color: colors.text }]} autoFocus />
      </View>
      <FlatList data={results} keyExtractor={(item: any) => item.id + item.date}
        renderItem={({ item }: any) => (
          <Pressable style={[s.result, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('TopicDetail', { topicId: item.id, date: item.date })}>
            <View style={{ marginBottom: 6 }}><Badge label={item.category} /></View>
            <Text style={[s.title, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
          </Pressable>
        )}
        ListEmptyComponent={query.length > 0 ? <Text style={[s.empty, { color: colors.subtext }]}>No results for "{query}"</Text> : null}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeScreen>
  );
}
const s = StyleSheet.create({ inputWrap: { margin: 16, borderRadius: 12, paddingHorizontal: 16 }, input: { height: 48, fontSize: 15 }, result: { margin: 8, marginHorizontal: 16, borderRadius: 10, padding: 14 }, title: { fontSize: 14, fontWeight: '600' }, empty: { textAlign: 'center', marginTop: 40, fontSize: 14 } });
