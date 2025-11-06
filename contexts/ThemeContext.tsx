import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useDeviceColorScheme, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
    themeMode: ThemeMode;
    colorScheme: ColorScheme;
    setThemeMode: (mode: ThemeMode) => void;
    isDark: boolean;
    themeTransition: Animated.Value;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemColorScheme = useDeviceColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [themeTransition] = useState(new Animated.Value(0));

    // Load saved theme preference on mount
    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
                setThemeModeState(savedTheme as ThemeMode);
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
        }
    };

    const setThemeMode = async (mode: ThemeMode) => {
        try {
            // Trigger animation
            themeTransition.setValue(0);
            Animated.timing(themeTransition, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start();

            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
            setThemeModeState(mode);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    // Determine actual color scheme based on theme mode
    const colorScheme: ColorScheme =
        themeMode === 'system'
            ? (systemColorScheme || 'light')
            : themeMode;

    const isDark = colorScheme === 'dark';

    return (
        <ThemeContext.Provider
            value={{
                themeMode,
                colorScheme,
                setThemeMode,
                isDark,
                themeTransition
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Hook to get themed colors
export function useThemeColors() {
    const { colorScheme } = useTheme();
    const { Colors } = require('../constants/theme');
    return Colors[colorScheme];
}
