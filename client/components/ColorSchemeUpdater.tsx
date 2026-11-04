import { Fragment, useEffect, type ReactNode } from 'react';
import { ColorSchemeName, Platform } from 'react-native';
import { Uniwind } from 'uniwind'
import { useThemeMode } from '@/contexts/ThemeModeContext';

const WebOnlyColorSchemeUpdater = function ({ children }: { children?: ReactNode }) {
  const { mode } = useThemeMode();

  // mode 变化时应用主题（'dark' | 'system'）
  useEffect(() => {
    Uniwind.setTheme(mode);
  }, [mode]);

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
