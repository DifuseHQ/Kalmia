import { createContext, useEffect, useState } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const theme = window.localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.setAttribute('data-color-scheme', 'dark');
      return true;
    } else {
      document.documentElement.classList.remove('dark');
      document.body.setAttribute('data-color-scheme', 'light');
      return false;
    }
  });

  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!window.localStorage.getItem('theme') && prefersDarkMode) {
      document.documentElement.classList.add('light');
      document.body.setAttribute('data-color-scheme', 'light');
      setDarkMode(false);
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      document.body.setAttribute('data-color-scheme', 'light');
      window.localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      document.body.setAttribute('data-color-scheme', 'dark');
      window.localStorage.setItem('theme', 'dark');
    }
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
