/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#fd570aff';
const tintColorDark = '#ff7a3dff';

export const Colors = {
  light: {
    // Primary colors
    text: '#000000',
    textSecondary: '#8E8E93',
    background: '#F2F2F7',
    cardBackground: '#FFFFFF',
    cardAchievementBackground: '#d4d4e7ff',
    tint: tintColorLight,

    // Tab bar
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorLight,
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E5E5EA',

    // Health metrics
    caloriesColor: '#FF453A',
    stepsColor: '#34C759',
    standingColor: '#FFD60A',
    heartRateColor: '#FF453A',
    sleepColor: '#5E5CE6',
    spO2Color: '#FF453A',
    weightColor: '#26c949ff',

    // Icon backgrounds
    heartRateIconBg: '#FF453A',
    sleepIconBg: '#5E5CE6',
    spO2IconBg: '#FF453A',
    weightIconBg: '#34C759',

    // Icon colors (on colored backgrounds)
    iconOnColor: '#FFFFFF',

    // UI elements
    border: '#E5E5EA',
    divider: '#F2F2F7',
    placeholder: '#C7C7CC',
    overlay: 'rgba(0, 0, 0, 0.4)',

    // Status colors
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF453A',
    info: '#007AFF',
  },
  dark: {
    // Primary colors
    text: '#FFFFFF',
    textSecondary: '#98989D',
    background: '#000000',
    cardBackground: '#1C1C1E',
    cardAchievementBackground: '#262631ff',
    tint: tintColorDark,

    // Tab bar
    tabIconDefault: '#98989D',
    tabIconSelected: tintColorDark,
    tabBarBackground: '#1C1C1E',
    tabBarBorder: '#38383A',

    // Health metrics (brighter for dark mode)
    caloriesColor: '#FF6961',
    stepsColor: '#32D74B',
    standingColor: '#FFD60A',
    heartRateColor: '#FF6961',
    sleepColor: '#5E5CE6',
    spO2Color: '#FF6961',
    weightColor: '#30D158',

    // Icon backgrounds
    heartRateIconBg: '#FF6961',
    sleepIconBg: '#5E5CE6',
    spO2IconBg: '#FF6961',
    weightIconBg: '#30D158',

    // Icon colors (on colored backgrounds)
    iconOnColor: '#FFFFFF',

    // UI elements
    border: '#38383A',
    divider: '#2C2C2E',
    placeholder: '#48484A',
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Status colors
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#0A84FF',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
