import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useDevice } from '../contexts/DeviceContext';
import { useThemeColors } from '../contexts/ThemeContext';
import { BLEService } from '../services/bleService';
import { BLEConfig } from '../types';
import { showToast } from '../utils/toast';

const DEVICE_CONFIG_KEY = '@device_config';

export default function DeviceSettingsScreen() {
    const colors = useThemeColors();
    const router = useRouter();
    const { device, isConnected } = useDevice();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [config, setConfig] = useState<BLEConfig>({
        bmi: 25.0,
        dataMode: 0, // 0: Realtime, 1: Batch
        stepEnable: 1,
        mlEnable: 1,
    });
    const [originalConfig, setOriginalConfig] = useState<BLEConfig | null>(null);

    // Load saved config on mount
    const loadSavedConfig = useCallback(async () => {
        try {
            const savedConfig = await AsyncStorage.getItem(DEVICE_CONFIG_KEY);
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig) as BLEConfig;
                console.log('[DeviceSettings] Loaded saved config:', parsed);
                setConfig(parsed);
                setOriginalConfig(parsed);
            } else {
                setOriginalConfig(config);
            }
        } catch (error) {
            console.error('[DeviceSettings] Error loading config:', error);
            setOriginalConfig(config);
        }
    }, []);

    useEffect(() => {
        loadSavedConfig();
    }, [loadSavedConfig]);

    // Check if config has changed
    useEffect(() => {
        if (originalConfig) {
            const changed =
                config.dataMode !== originalConfig.dataMode ||
                config.stepEnable !== originalConfig.stepEnable ||
                config.mlEnable !== originalConfig.mlEnable;
            setHasChanges(changed);
        }
    }, [config, originalConfig]);

    // Toggle handlers - only update local state, don't write to device
    const handleToggleDataMode = (value: boolean) => {
        const newMode = value ? 1 : 0;
        setConfig(prev => ({ ...prev, dataMode: newMode }));
    };

    const handleToggleStepCounting = (value: boolean) => {
        const newValue = value ? 1 : 0;
        setConfig(prev => ({ ...prev, stepEnable: newValue }));
    };

    const handleToggleMLDetection = (value: boolean) => {
        const newValue = value ? 1 : 0;
        setConfig(prev => ({ ...prev, mlEnable: newValue }));
    };

    const handleSaveSettings = async () => {
        if (!device?.id || !isConnected) {
            showToast.error('Device not connected', 'Error');
            return;
        }

        setSaving(true);
        setLoading(true);

        try {
            console.log('[DeviceSettings] Saving config to device:', config);

            // Write config to device
            const success = await BLEService.writeConfig(device.id, config);

            if (success) {
                // Save to local storage
                await AsyncStorage.setItem(DEVICE_CONFIG_KEY, JSON.stringify(config));
                console.log('[DeviceSettings] Config saved to storage');
                setOriginalConfig(config);
                setHasChanges(false);

                showToast.success(
                    'Settings saved successfully',
                    'Device Updated'
                );
            } else {
                showToast.error('Failed to save settings to device', 'Error');
            }
        } catch (error) {
            console.error('[DeviceSettings] Error saving settings:', error);
            showToast.error('Failed to save settings', 'Error');
        } finally {
            setSaving(false);
            setLoading(false);
        }
    };

    const handleResetToDefaults = () => {
        const defaults: BLEConfig = {
            bmi: 25.0,
            dataMode: 0,
            stepEnable: 1,
            mlEnable: 1,
        };
        setConfig(defaults);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.tint} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Device Settings</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Connection Status */}
                {!isConnected && (
                    <View style={[styles.warningBox, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
                        <Ionicons name="warning-outline" size={24} color={colors.error} />
                        <Text style={[styles.warningText, { color: colors.error }]}>
                            Device not connected. Please connect to a device first.
                        </Text>
                    </View>
                )}

                {/* Data Transmission Section */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Transmission</Text>
                    <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                        Choose how health data is sent from your device
                    </Text>

                    <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.tint }]}>
                                <Ionicons name="sync" size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={[styles.settingTitle, { color: colors.text }]}>Batch Mode</Text>
                                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                                    {config.dataMode === 1
                                        ? 'Enabled - Data sent every 5 minutes or when buffer full'
                                        : 'Disabled - Realtime transmission'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={config.dataMode === 1}
                            onValueChange={handleToggleDataMode}
                            disabled={loading}
                            trackColor={{ false: colors.divider, true: colors.tint }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <View style={[styles.infoBox, { backgroundColor: colors.tint + '10' }]}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.tint} />
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                            {config.dataMode === 1
                                ? 'Batch mode collects up to 600 samples (5 minutes) and sends them together. Saves battery but delays data.'
                                : 'Realtime mode sends data immediately every second for instant monitoring.'}
                        </Text>
                    </View>
                </View>

                {/* Sensor Features Section */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Sensor Features</Text>
                    <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                        Enable or disable specific tracking features
                    </Text>

                    {/* Step Counting */}
                    <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
                                <Ionicons name="walk" size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={[styles.settingTitle, { color: colors.text }]}>Step Counting</Text>
                                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                                    Track your daily steps with MPU6050
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={config.stepEnable === 1}
                            onValueChange={handleToggleStepCounting}
                            disabled={loading}
                            trackColor={{ false: colors.divider, true: '#10B981' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    {/* ML Anomaly Detection */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' }]}>
                                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={[styles.settingTitle, { color: colors.text }]}>AI Anomaly Detection</Text>
                                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                                    Get alerts for abnormal health patterns
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={config.mlEnable === 1}
                            onValueChange={handleToggleMLDetection}
                            disabled={loading}
                            trackColor={{ false: colors.divider, true: '#F59E0B' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Device Info Section */}
                {device && (
                    <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Device Information</Text>

                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Device Name:</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]}>{device.name}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Device ID:</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1} ellipsizeMode="middle">
                                {device.id}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Connection Status:</Text>
                            <View style={styles.statusBadge}>
                                <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : colors.error }]} />
                                <Text style={[styles.statusText, { color: isConnected ? '#10B981' : colors.error }]}>
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Reset Button */}
                <TouchableOpacity
                    style={[styles.resetButton, { borderColor: colors.textSecondary }]}
                    onPress={handleResetToDefaults}
                    disabled={loading}
                >
                    <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>
                        Reset to Defaults
                    </Text>
                </TouchableOpacity>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Save Button - Fixed at bottom */}
            <View style={[styles.saveButtonContainer, { backgroundColor: colors.background, borderTopColor: colors.divider }]}>
                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        { backgroundColor: hasChanges && isConnected ? colors.tint : colors.divider }
                    ]}
                    onPress={handleSaveSettings}
                    disabled={!hasChanges || loading || !isConnected}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.saveButtonText}>
                                {hasChanges ? 'Save Settings' : 'No Changes'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
                {hasChanges && (
                    <Text style={[styles.unsavedText, { color: colors.warning || '#F59E0B' }]}>
                        You have unsaved changes
                    </Text>
                )}
            </View>

            {/* Loading Overlay */}
            {loading && !saving && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.tint} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>Updating settings...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
        gap: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    sectionDescription: {
        fontSize: 14,
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 13,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        flex: 1,
        textAlign: 'right',
        marginLeft: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
        marginBottom: 16,
    },
    resetButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    bottomSpacing: {
        height: 100,
    },
    saveButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    unsavedText: {
        textAlign: 'center',
        marginTop: 8,
        fontSize: 12,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
