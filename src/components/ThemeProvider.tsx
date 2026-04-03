"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "theme-cyberpunk" | "theme-ocean" | "theme-sunset" | "theme-forest" | "theme-grid" | "theme-dots" | "theme-lines";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = "dark" }: { children: React.ReactNode, defaultTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  // Load from local storage securely on mount
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("behera-theme") as Theme;
      if (storedTheme) {
        setThemeState(storedTheme);
      }
    } catch (e) {}
  }, []);

  // Update document classes dynamically
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "theme-cyberpunk", "theme-ocean", "theme-sunset", "theme-forest", "theme-grid", "theme-dots", "theme-lines");
    
    // Light is usually default without class or forced, but for our setup, dark is standard or explicit
    if (theme !== "light") {
       root.classList.add(theme);
    }
    
    // Save securely
    try {
      localStorage.setItem("behera-theme", theme);
    } catch (e) {}
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
