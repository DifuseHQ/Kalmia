import React, { createContext, useEffect, useRef, useState } from "react";

export interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

interface LinkAttributes {
  rel: string;
  sizes?: string;
  href: string;
  type?: string;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const htmlRef = useRef<HTMLElement | null>(null);
  const bodyRef = useRef<HTMLElement | null>(null);

  const setFavicon = () => {
    const links: LinkAttributes[] = [
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/assets/favicon/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/assets/favicon/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/assets/favicon/favicon-16x16.png",
      },
      {
        rel: "manifest",
        href: "/assets/favicon/site.webmanifest",
      },
    ];

    links.forEach((link) => {
      const selector = `link[rel='${link.rel}']${link.sizes ? `[sizes='${link.sizes}']` : ""}`;
      const existingLink =
        document.head.querySelector<HTMLLinkElement>(selector);
      if (existingLink) {
        existingLink.href = link.href;
      } else {
        const newLink = document.createElement("link");
        Object.entries(link).forEach(([attr, value]) => {
          newLink.setAttribute(attr, value);
        });
        document.head.appendChild(newLink);
      }
    });
  };

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const theme = window.localStorage.getItem("theme");
      const isDark = theme === "dark";
      return isDark;
    }
    return false;
  });

  useEffect(() => {
    htmlRef.current = document.documentElement;
    bodyRef.current = document.body;

    const prefersDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (!window.localStorage.getItem("theme") && prefersDarkMode) {
      setDarkMode(false);
    }

    setFavicon();
  }, []);

  useEffect(() => {
    if (htmlRef.current && bodyRef.current) {
      if (darkMode) {
        htmlRef.current.classList.add("dark");
        bodyRef.current.setAttribute("data-color-scheme", "dark");
      } else {
        htmlRef.current.classList.remove("dark");
        bodyRef.current.setAttribute("data-color-scheme", "light");
      }
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newTheme = darkMode ? "light" : "dark";
    window.localStorage.setItem("theme", newTheme);
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
