'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

// AXE themes: light is the default; dark is [data-theme="dark"] on <html>.
const apply = (t) => { document.documentElement.dataset.theme = t; };

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    let saved = 'light';
    try { saved = localStorage.getItem('ax-theme') === 'dark' ? 'dark' : 'light'; } catch {}
    setTheme(saved);
    apply(saved);
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try { localStorage.setItem('ax-theme', next); } catch {}
    apply(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
