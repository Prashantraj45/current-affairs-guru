import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';
const light = { background:'#ffffff',card:'#f8f8f8',text:'#1a1a2e',subtext:'#666',border:'#e0e0e0',primary:'#6366f1',accent:'#f59e0b',success:'#10b981',error:'#ef4444' };
const dark  = { background:'#1a1a2e',card:'#16213e',text:'#e0e0e0',subtext:'#aaa',border:'#2a2a4a',primary:'#818cf8',accent:'#fbbf24',success:'#34d399',error:'#f87171' };
export function useTheme() {
  const { mode } = useThemeStore();
  const system = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return { isDark, colors: isDark ? dark : light };
}
