import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'dark';

const STORAGE_KEY = 'qma_theme_mode';

interface ThemeModeValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggle: () => Promise<void>;
}

const ThemeModeContext = createContext<ThemeModeValue | undefined>(undefined);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw === 'system' || raw === 'dark') {
          setModeState(raw);
        }
      } catch {
        // 忽略读取失败，使用默认深色
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

  const toggle = useCallback(async () => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'system' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
      return next;
    });
  }, []);

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return ctx;
}