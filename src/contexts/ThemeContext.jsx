import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        // Check localStorage first, default to dark mode
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('atlas-theme');
            if (stored) return stored === 'dark';
            // Check system preference
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return true;
    });

    useEffect(() => {
        // Apply class to document
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
        }
        // Persist preference
        localStorage.setItem('atlas-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggleTheme = () => setIsDark(prev => !prev);
    const setTheme = (dark) => setIsDark(dark);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
