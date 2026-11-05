import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeModeContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, resolvedTheme } = useTheme();

  let tabBarStyle: any = {
    backgroundColor: resolvedTheme === 'light' ? colors.surface : '#0D0D14',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    height: 58 + insets.bottom,
    paddingBottom: insets.bottom,
    paddingTop: 6,
  };

  // 用于修复 Web 上高度异常的问题
  if (Platform.OS === 'web') {
    tabBarStyle = { ...tabBarStyle, height: 'auto' };
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: resolvedTheme === 'light' ? colors.iconInactive : 'rgba(245,245,247,0.45)',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '音乐库',
          tabBarIcon: ({ color }) => <FontAwesome6 name="music" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: '播放列表',
          tabBarIcon: ({ color }) => <FontAwesome6 name="list-ul" size={19} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '历史',
          tabBarIcon: ({ color }) => <FontAwesome6 name="clock-rotate-left" size={19} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <FontAwesome6 name="user" size={19} color={color} />,
        }}
      />
    </Tabs>
  );
}