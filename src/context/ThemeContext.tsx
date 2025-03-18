import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { lightModeColors, darkModeColors } from '../styles/colors';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  colors: typeof lightModeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Check if user has a preference in localStorage or use system preference
  const getInitialTheme = (): ThemeMode => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  };

  const [mode, setMode] = useState<ThemeMode>('light');
  const [colors, setColors] = useState(lightModeColors);

  // Initialize theme on mount
  useEffect(() => {
    const initialTheme = getInitialTheme();
    setMode(initialTheme);
    setColors(initialTheme === 'dark' ? darkModeColors : lightModeColors);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    setColors(newMode === 'dark' ? darkModeColors : lightModeColors);
    
    // Save to localStorage
    localStorage.setItem('theme', newMode);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 