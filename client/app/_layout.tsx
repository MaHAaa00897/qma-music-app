import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeModeContext';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
  // 添加其它想暂时忽略的错误或警告信息
]);

/** 全局状态栏：跟随当前主题的明暗决定文字颜色 */
function ThemedStatusBar() {
  const { resolvedTheme } = useTheme();
  return <StatusBar style={resolvedTheme === 'light' ? 'dark' : 'light'} />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Provider>
        <MusicPlayerProvider>
        <ThemedStatusBar />
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            headerShown: false
          }}
        >
          <Stack.Screen name="(tabs)" options={{ title: "", animation: 'none', gestureEnabled: false }} />
          <Stack.Screen name="player" options={{ title: "正在播放", animation: 'slide_from_bottom' }} />
          <Stack.Screen name="playlist-detail" options={{ title: "" }} />
        </Stack>
        <Toast />
      </MusicPlayerProvider>
      </Provider>
    </ThemeProvider>
  );
}