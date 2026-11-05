import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK, LIGHT, type ThemeColors, type ThemeKind } from '@/contexts/theme';

// 为方便消费端统一从本上下文引入，转发主题色板类型
export type { ThemeColors, ThemeKind } from '@/contexts/theme';

/** 主题模式：跟随系统 / 浅色 / 深色 */
export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'qma_theme_mode';

interface ThemeValue {
  mode: ThemeMode;
  /** 最终解析出的明暗主题（供 UI 着色与系统层使用） */
  resolvedTheme: ThemeKind;
  /** 当前明暗主题对应的色板 */
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => Promise<void>;
  setTheme: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 默认跟随系统（若系统未检测到，回退深色）
  const [mode, setModeState] = useState<ThemeMode>('system');
  const systemScheme = useColorScheme();

  // 启动时恢复用户保存的选择
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw === 'system' || raw === 'light' || raw === 'dark') {
          setModeState(raw);
        }
      } catch {
        // 忽略读取失败
      }
    })();
  }, []);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 忽略写入失败
    }
  }, []);

  const setTheme = useCallback(
    async (next: ThemeMode) => {
      await setMode(next);
    },
    [setMode]
  );

  const resolvedTheme: ThemeKind = useMemo(() => {
    if (mode === 'system') {
      return systemScheme === 'light' ? 'light' : 'dark';
    }
    return mode;
  }, [mode, systemScheme]);

  const colors = useMemo<ThemeColors>(() => (resolvedTheme === 'light' ? LIGHT : DARK), [resolvedTheme]);

  const value = useMemo<ThemeValue>(
    () => ({ mode, resolvedTheme, colors, setMode, setTheme }),
    [mode, resolvedTheme, colors, setMode, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

/** 仅供只想读取主题模式选择（不触发整体 UI 重绘）的场景使用 */
export function useThemeMode() {
  const { mode, setMode } = useTheme();
  return { mode, setMode };
}