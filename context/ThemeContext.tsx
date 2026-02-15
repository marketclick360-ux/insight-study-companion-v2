import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeColors = {
  primary: string;
  primaryLight: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
};

type ThemeValue = {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
};

const lightColors: ThemeColors = {
  primary: '#1e3a5f',
  primaryLight: '#dbeafe',
  background: '#f0f4f8',
  surface: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  border: '#e2e8f0',
};

const darkColors: ThemeColors = {
  primary: '#60a5fa',
  primaryLight: '#1f2a44',
  background: '#0b1220',
  surface: '#111a2e',
  text: '#e5e7eb',
  textSecondary: '#94a3b8',
  border: '#26324a',
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [isDark, setIsDark] = useState(scheme === 'dark');

  const toggleTheme = () => setIsDark((v) => !v);

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);
  const value = useMemo(() => ({ colors, isDark, toggleTheme }), [colors, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
