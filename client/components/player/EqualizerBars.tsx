import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const BAR_COUNT = 28;

interface BarProps {
  height: Animated.Value;
  playing: boolean;
  color: string;
}

// 单根均器柱
function Bar({ height, playing, color }: BarProps) {
  const animRef = useRef<{ stop: () => void } | null>(null);
  useEffect(() => {
    if (playing) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(height, {
            toValue: 6 + Math.random() * 26,
            duration: 280 + Math.random() * 240,
            useNativeDriver: false,
          }),
          Animated.timing(height, {
            toValue: 6,
            duration: 220 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      animRef.current = loop;
      return () => loop.stop();
    } else {
      Animated.timing(height, { toValue: 6, duration: 240, useNativeDriver: false }).start();
    }
    return undefined;
  }, [playing, height]);
  void animRef;
  return (
    <Animated.View
      style={[styles.bar, { height, backgroundColor: color }]}
    />
  );
}

interface EqualizerBarsProps {
  playing: boolean;
  color?: string;
  barCount?: number;
}

export function EqualizerBars({ playing, color = '#8A63FF', barCount = BAR_COUNT }: EqualizerBarsProps) {
  const heights = useMemo(
    () => Array.from({ length: barCount }, () => new Animated.Value(6)),
    [barCount]
  );
  return (
    <View style={styles.row}>
      {heights.map((h, i) => (
        <Bar key={i} height={h} playing={playing} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 40,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});