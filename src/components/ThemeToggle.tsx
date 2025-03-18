import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { mode, toggleTheme } = useTheme();

  return (
    <button 
      className={`theme-toggle ${className}`}
      onClick={toggleTheme} 
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
    >
      {mode === 'light' ? (
        // Moon icon for dark mode
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
        </svg>
      ) : (
        // Sun icon for light mode
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5a1 1 0 0 0 1-1V1a1 1 0 0 0-2 0v.01A1 1 0 0 0 12 2zm0 20a1 1 0 0 0-1 1V23a1 1 0 0 0 2 0v-.01a1 1 0 0 0-1-.99zm10-10a1 1 0 0 0 1-1 1 1 0 0 0-1-1h-.01a1 1 0 0 0 0 2H22zm-20 0a1 1 0 0 0 1-1 1 1 0 0 0-1-1H2a1 1 0 0 0 0 2h.01zM19.071 5.343a1 1 0 0 0 1.414-1.414l-.707-.707a1 1 0 0 0-1.414 1.414l.707.707zm-14.142 0l.707-.707A1 1 0 0 0 4.222 3.222l-.707.707a1 1 0 0 0 1.414 1.414zM19.071 18.657l.707.707a1 1 0 0 0 1.414-1.414l-.707-.707a1 1 0 0 0-1.414 1.414zm-14.142 0a1 1 0 0 0 1.414 1.414l.707-.707a1 1 0 0 0-1.414-1.414l-.707.707z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle; 