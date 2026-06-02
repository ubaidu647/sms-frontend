import { useThemeStore } from '../store/themeStore';
import { COLORS } from './colors';

const LIGHT = {
  ...COLORS,
  bg: '#f6f6f6',
  card: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  muted: '#6b7280',
  mutedSoft: '#9ca3af',
  topbarBg: '#f6f6f6',
  topbarText: '#111827',
  topbarBorder: '#e5e7eb',
};

const DARK = {
  ...COLORS,
  bg: '#161616',
  card: '#1f2937',
  border: '#374151',
  text: '#f3f4f6',
  muted: '#9ca3af',
  mutedSoft: '#6b7280',
  topbarBg: '#161616',
  topbarText: '#f3f4f6',
  topbarBorder: '#1f2937',
};

export function useColors() {
  const theme = useThemeStore((s) => s.theme);
  return theme === 'dark' ? DARK : LIGHT;
}

export function useIsDark() {
  return useThemeStore((s) => s.theme) === 'dark';
}
