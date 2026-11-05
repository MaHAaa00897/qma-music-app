import { Fragment, useEffect, type ReactNode } from 'react';
import { ColorSchemeName, Platform } from 'react-native';
import { Uniwind } from 'uniwind'
import { useTheme, useThemeMode } from '@/contexts/ThemeModeContext';

const WebOnlyColorSchemeUpdater = function ({ children }: { children?: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const { mode } = useThemeMode();

  // 主题模式变化时应用（'light' | 'dark' | 'system' 解析后的实际主题）
  useEffect(() => {
    Uniwind.setTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Web 预览端跟随 host 颜色方案（仅当处于“跟随系统”时）
  useEffect(() => {
    function handleMessage(e: MessageEvent<{ event: string; colorScheme: ColorSchemeName; } | undefined>) {
      if (e.data?.event === 'coze.workbench.colorScheme' && mode === 'system') {
        const cs = e.data.colorScheme;
        if (typeof cs === 'string') {
          Uniwind.setTheme(cs);
        }
      }
    }

    if (Platform.OS === 'web') {
      window.addEventListener('message', handleMessage, false);
    }

    return () => {
      if (Platform.OS === 'web') {
        window.removeEventListener('message', handleMessage, false);
      }
    }
  }, [mode]);

  return <Fragment>
    {children}
  </Fragment>
};

export {
  WebOnlyColorSchemeUpdater,
}