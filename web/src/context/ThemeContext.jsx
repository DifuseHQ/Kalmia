import { createContext, useEffect, useState } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const updateFavicon = (theme) => {
    const links = [
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: `/admin/assets/favicon/apple-touch-icon.png`
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: `/admin/assets/favicon/favicon-32x32.png`
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: `/admin/assets/favicon/favicon-16x16.png`
      },
      {
        rel: 'manifest',
        href: `/admin/assets/favicon/site.webmanifest`
      }
    ];

    links.forEach((link) => {
      const existingLink = document.querySelector(
        `link[rel='${link.rel}']${link.sizes ? `[sizes='${link.sizes}']` : ''}`
      );
      if (existingLink) {
        existingLink.href = link.href;
      } else {
        const newLink = document.createElement('link');
        Object.keys(link).forEach((attr) =>
          newLink.setAttribute(attr, link[attr])
        );
        document.head.appendChild(newLink);
      }
    });
  };

  const [darkMode, setDarkMode] = useState(() => {
    const theme = window.localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.setAttribute('data-color-scheme', 'dark');
      updateFavicon('dark');
      return true;
    } else {
      document.documentElement.classList.remove('dark');
      document.body.setAttribute('data-color-scheme', 'light');
      updateFavicon('light');
      return false;
    }
  });

  useEffect(() => {
    const prefersDarkMode = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    if (!window.localStorage.getItem('theme') && prefersDarkMode) {
      document.documentElement.classList.add('light');
      document.body.setAttribute('data-color-scheme', 'light');
      updateFavicon('light');
      setDarkMode(false);
    }
  }, []);

  const toggleDarkMode = () => {
    const newTheme = darkMode ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark');
    document.body.setAttribute('data-color-scheme', newTheme);
    window.localStorage.setItem('theme', newTheme);
    updateFavicon(newTheme);
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
