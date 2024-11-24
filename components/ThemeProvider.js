'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const [glitchEffect, setGlitchEffect] = useState(false);

  useEffect(() => {
    // Apply theme class to body
    document.body.className = isDark ? 'dark bg-black' : 'light bg-white';
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    // Trigger glitch effect on theme change
    setGlitchEffect(true);
    setTimeout(() => setGlitchEffect(false), 1000);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, glitchEffect }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
