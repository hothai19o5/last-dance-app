import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import ActivityRings from '../components/ActivityRings';
import { useThemeColors } from '../contexts/ThemeContext';

/**
 * Demo screen for testing ActivityRings component
 * Navigate to this screen to test different configurations
 */
export default function ActivityRingsDemoScreen() {
    const colors = useThemeColors();
    const [config, setConfig] = useState({
        steps: 0.75,
        standing: 0.5,
        calories: 0.9,
    });

    const activityData = [
        {
            value: config.steps,
            color: colors.stepsColor,
            backgroundColor: colors.border,
        },
        {
            value: config.standing,
            color: colors.standingColor,
            backgroundColor: colors.border,
        },
        {
            value: config.calories,
            color: colors.caloriesColor,
            backgroundColor: colors.border,
        },
    ];

    const activityConfig = {
        width: 250,
        height: 250,
        radius: 100,
        ringSize: 18,
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>ActivityRings Demo</Text>

            {/* Rings Display */}
            <View style={styles.ringsContainer}>
                <ActivityRings data={activityData} config={activityConfig} />
            </View>

            {/* Controls */}
            <View style={[styles.controlsContainer, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.label, { color: colors.text }]}>Steps: {Math.round(config.steps * 100)}%</Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.stepsColor }]}
                        onPress={() => setConfig({ ...config, steps: Math.max(0, config.steps - 0.1) })}
                    >
                        <Text style={styles.buttonText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.stepsColor }]}
                        onPress={() => setConfig({ ...config, steps: Math.min(1, config.steps + 0.1) })}
                    >
                        <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Standing: {Math.round(config.standing * 100)}%</Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.standingColor }]}
                        onPress={() => setConfig({ ...config, standing: Math.max(0, config.standing - 0.1) })}
                    >
                        <Text style={styles.buttonText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.standingColor }]}
                        onPress={() => setConfig({ ...config, standing: Math.min(1, config.standing + 0.1) })}
                    >
                        <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Calories: {Math.round(config.calories * 100)}%</Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.caloriesColor }]}
                        onPress={() => setConfig({ ...config, calories: Math.max(0, config.calories - 0.1) })}
                    >
                        <Text style={styles.buttonText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.caloriesColor }]}
                        onPress={() => setConfig({ ...config, calories: Math.min(1, config.calories + 0.1) })}
                    >
                        <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Preset Buttons */}
                <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Presets:</Text>
                <View style={styles.presetRow}>
                    <TouchableOpacity
                        style={[styles.presetButton, { backgroundColor: colors.info }]}
                        onPress={() => setConfig({ steps: 0, standing: 0, calories: 0 })}
                    >
                        <Text style={styles.buttonText}>Empty</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.presetButton, { backgroundColor: colors.warning }]}
                        onPress={() => setConfig({ steps: 0.5, standing: 0.5, calories: 0.5 })}
                    >
                        <Text style={styles.buttonText}>Half</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.presetButton, { backgroundColor: colors.success }]}
                        onPress={() => setConfig({ steps: 1, standing: 1, calories: 1 })}
                    >
                        <Text style={styles.buttonText}>Full</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Info */}
            <View style={[styles.infoContainer, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Component Info:</Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    • Pure React Native SVG{'\n'}
                    • No external dependencies{'\n'}
                    • Configurable radius & ring size{'\n'}
                    • Background rings support{'\n'}
                    • Theme-aware colors
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 60,
        marginBottom: 20,
    },
    ringsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 30,
    },
    controlsContainer: {
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    presetRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    presetButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    infoContainer: {
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        marginBottom: 40,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 22,
    },
});
