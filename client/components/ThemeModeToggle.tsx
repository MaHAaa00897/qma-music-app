import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useThemeMode } from '@/contexts/ThemeModeContext';
import { FontAwesome6 } from '@expo/vector-icons';

export function ThemeModeToggle() {
  const { mode, toggle } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <TouchableOpacity style={styles.pill} onPress={toggle} activeOpacity={0.7}>
      <FontAwesome6 name={isDark ? 'moon' : 'monitor'} size={13} color="#F5F5F7" />
      <Text style={styles.label}>{isDark ? '深色' : '跟随系统'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 34,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  label: { color: '#F5F5F7', fontSize: 12, fontWeight: '600' },
});