import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../navigation/types';
type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;
export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={s.c}>
      <Text style={s.logo}>Current Affairs Guru</Text>
      <Text style={s.tag}>Master UPSC Current Affairs daily</Text>
      <Pressable style={s.btn} onPress={() => navigation.navigate('Login')}>
        <Text style={s.btnText}>Get Started</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e', padding: 32 },
  logo: { fontSize: 28, fontWeight: '800', color: '#e0e0e0', textAlign: 'center', marginBottom: 12 },
  tag: { fontSize: 15, color: '#aaa', textAlign: 'center', marginBottom: 48 },
  btn: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
