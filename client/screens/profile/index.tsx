import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/Screen';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { useTheme, type ThemeMode } from '@/contexts/ThemeModeContext';
import { FontAwesome6 } from '@expo/vector-icons';

interface ThemeOption {
  value: ThemeMode;
  label: string;
  desc: string;
  icon: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'system', label: '跟随系统', desc: '自动匹配设备的浅色/深色', icon: 'monitor' },
  { value: 'light', label: '浅色', desc: '白天使用明亮的界面', icon: 'sun' },
  { value: 'dark', label: '深色', desc: '夜间使用沉浸的深色界面', icon: 'moon' },
];

export default function ProfileScreen() {
  const { colors, mode, setMode } = useTheme();

  return (
    <Screen backgroundColor={colors.background} statusBarStyle={colors.statusBarStyle}>
      <View style={[styles.header, { paddingTop: 16 }]}>
        <Text style={[styles.brand, { color: colors.textPrimary }]}>我的</Text>
        <Text style={[styles.subtitle, { color: colors.textDim }]}>外观设置</Text>
      </View>

      <View style={styles.body}>
        {/* 外观设置卡片 */}
        <Text style={[styles.sectionTitle, { color: colors.textDim }]}>界面主题</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {THEME_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={opt.value}
              activeOpacity={0.7}
              style={[styles.optionRow, i < THEME_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}
              onPress={() => setMode(opt.value)}
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.primaryDim }]}>
                <FontAwesome6 name={opt.icon as any} size={17} color={colors.primary} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                <Text style={[styles.optionDesc, { color: colors.textDim }]}>{opt.desc}</Text>
              </View>
              <View style={[styles.radio, { borderColor: mode === opt.value ? colors.primary : colors.iconSub }]}>
                {mode === opt.value && (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          主题切换会立即应用到整个应用，并自动保存你的选择。
        </Text>
      </View>

      <MiniPlayer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  brand: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },
  body: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, marginBottom: 10, marginTop: 4 },
  card: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 6, overflow: 'hidden' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  optionDesc: { fontSize: 12, marginTop: 3 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  hint: { fontSize: 12, marginTop: 14, lineHeight: 18, textAlign: 'center' },
});