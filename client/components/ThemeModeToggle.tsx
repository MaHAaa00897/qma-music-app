import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme, useThemeMode, type ThemeMode, type ThemeColors } from '@/contexts/ThemeModeContext';
import { FontAwesome6 } from '@expo/vector-icons';

const MODES: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'system', label: '跟随系统', icon: 'monitor' },
  { value: 'light', label: '浅色', icon: 'sun' },
  { value: 'dark', label: '深色', icon: 'moon' },
];

export function ThemeModeToggle() {
  const { colors, mode } = useTheme();
  const { setMode } = useThemeMode();
  const s = useMemo(() => createStyles(colors), [colors]);

  const cur = MODES.find((m) => m.value === mode) ?? MODES[0];

  const cycle = () => {
    const idx = MODES.findIndex((m) => m.value === mode);
    const next = MODES[(idx + 1) % MODES.length];
    setMode(next.value);
  };

  return (
    <TouchableOpacity style={s.pill} onPress={cycle} activeOpacity={0.7}>
      <FontAwesome6 name={cur.icon as any} size={13} color={colors.iconPrimary} />
      <Text style={s.label}>{cur.label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.card,
      borderRadius: 999,
      paddingHorizontal: 12,
      height: 34,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    label: { color: c.textPrimary, fontSize: 12, fontWeight: '600' },
  });