import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  let tabBarStyle: any = {
    backgroundColor: '#0D0D14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
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
        tabBarActiveTintColor: '#8A63FF',
        tabBarInactiveTintColor: 'rgba(245,245,247,0.45)',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '音乐库',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome6 name={focused ? 'music' : 'music'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: '播放列表',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome6 name={focused ? 'list-ul' : 'list-ul'} size={19} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '历史',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome6 name={focused ? 'clock-rotate-left' : 'clock-rotate-left'} size={19} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}