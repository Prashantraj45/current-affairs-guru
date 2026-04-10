import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
});

const isDarkPreferred = () => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return isDarkPreferred() ? 'dark' : 'light';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.classList.add('theme-fade');
    window.setTimeout(() => {
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
      window.setTimeout(() => {
        body.classList.remove('theme-fade');
      }, 200);
    }, 150);
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
