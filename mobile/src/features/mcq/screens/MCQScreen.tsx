import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useMCQ } from '../hooks/useMCQ';
import { useTheme } from '../../../hooks/useTheme';
import SafeScreen from '../../../components/layout/SafeScreen';
export default function MCQScreen() {
  const { data: mcqs, isLoading } = useMCQ();
  const { colors } = useTheme();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  if (isLoading) return <SafeScreen><ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} /></SafeScreen>;
  if (!mcqs?.length) return <SafeScreen><Text style={[s.empty, { color: colors.subtext }]}>No MCQs for today</Text></SafeScreen>;
  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.c}>
        {mcqs.map((mcq: any, i: number) => (
          <View key={i} style={[s.card, { backgroundColor: colors.card }]}>
            <Text style={[s.q, { color: colors.text }]}>{i + 1}. {mcq.question}</Text>
            {mcq.options.map((opt: string, j: number) => { const sel = answers[i] === opt; const cor = revealed[i] && opt === mcq.answer; const wrong = revealed[i] && sel && opt !== mcq.answer; return (
              <Pressable key={j} onPress={() => !revealed[i] && setAnswers((a) => ({ ...a, [i]: opt }))} style={[s.opt, { borderColor: cor ? colors.success : wrong ? colors.error : sel ? colors.primary : colors.border }]}>
                <Text style={{ color: cor ? colors.success : wrong ? colors.error : colors.text }}>{String.fromCharCode(65+j)}. {opt}</Text>
              </Pressable>
            ); })}
            {answers[i] && !revealed[i] && <Pressable onPress={() => setRevealed((r) => ({ ...r, [i]: true }))} style={[s.btn, { backgroundColor: colors.primary }]}><Text style={{ color: '#fff', fontWeight: '600' }}>Reveal Answer</Text></Pressable>}
            {revealed[i] && <View style={s.exp}><Text style={{ color: colors.success, fontWeight: '600' }}>✓ {mcq.answer}</Text>{mcq.explanation && <Text style={{ color: colors.subtext, marginTop: 6, fontSize: 13 }}>{mcq.explanation}</Text>}</View>}
          </View>
        ))}
      </ScrollView>
    </SafeScreen>
  );
}
const s = StyleSheet.create({ c: { padding: 16, gap: 16, paddingBottom: 48 }, card: { borderRadius: 12, padding: 16, gap: 10 }, q: { fontSize: 15, fontWeight: '600', lineHeight: 22 }, opt: { borderWidth: 1.5, borderRadius: 8, padding: 12 }, btn: { borderRadius: 8, padding: 12, alignItems: 'center' }, exp: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }, empty: { textAlign: 'center', marginTop: 40 } });
