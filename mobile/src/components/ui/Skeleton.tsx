import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
export default function Skeleton({ width, height, borderRadius = 4, style }: { width: number | string; height: number; borderRadius?: number; style?: ViewStyle }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={[{ width: width as any, height, borderRadius, backgroundColor: '#d0d0d0', opacity: anim }, style]} />;
}
