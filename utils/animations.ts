import { Animated } from 'react-native';

/**
 * Creates a smooth color transition animation
 * @param animatedValue - The animated value to use (typically starts at 0)
 * @param duration - Duration of the animation in milliseconds
 * @returns A function that starts the animation
 */
export const createColorTransition = (animatedValue: Animated.Value, duration: number = 300) => {
    return () => {
        Animated.timing(animatedValue, {
            toValue: 1,
            duration,
            useNativeDriver: false, // Color animations can't use native driver
        }).start(() => {
            animatedValue.setValue(0); // Reset for next transition
        });
    };
};

/**
 * Interpolates a color based on an animated value
 * @param animatedValue - The animated value (0 to 1)
 * @param fromColor - Starting color
 * @param toColor - Ending color
 * @returns Interpolated color
 */
export const interpolateColor = (
    animatedValue: Animated.Value,
    fromColor: string,
    toColor: string
): Animated.AnimatedInterpolation<string> => {
    return animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [fromColor, toColor],
    });
};
