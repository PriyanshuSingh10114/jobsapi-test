import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ className = '' }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('jobsapi_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('jobsapi_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('jobsapi_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-lg text-charcoal-muted hover:text-charcoal hover:bg-surface-soft border border-border-warm/60 transition-colors cursor-pointer ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle visual theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-warning" />
      ) : (
        <Moon className="w-4 h-4 text-charcoal" />
      )}
    </button>
  );
};
