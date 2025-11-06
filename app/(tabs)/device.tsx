import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockWearableDevice, mockWatchFaces } from '../../data/mockData';
import { BLEService } from '../../services/bleService';
import { useTheme, useThemeColors } from '../../contexts/ThemeContext';

export default function DeviceScreen() {
    const colors = useThemeColors();
    const { themeTransition } = useTheme();
    const [device, setDevice] = useState(mockWearableDevice);
    const [syncing, setSyncing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Fade animation on theme change
    useEffect(() => {
        const listener = themeTransition.addListener(({ value }) => {
            if (value === 0) {
                // Start fade out
                Animated.timing(fadeAnim, {
                    toValue: 0.7,
                    duration: 150,
                    useNativeDriver: true,
                }).start(() => {
                    // Fade back in
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                    }).start();
                });
            }
        });

        return () => {
            themeTransition.removeListener(listener);
        };
    }, [themeTransition, fadeAnim]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const data = await BLEService.syncData(device.id);
            console.log('Synced data:', data);
            Alert.alert('Sync Complete', 'Health data synchronized successfully!');
        } catch (error) {
            Alert.alert('Sync Failed', 'Could not sync data from device.');
        } finally {
            setSyncing(false);
        }
    };

    const handleAddDevice = () => {
        Alert.alert('Add Device', 'Device scanning will be implemented here.');
        // In production: Navigate to device pairing screen
    };

    const handleWatchFaceSelect = (watchFace: any) => {
        Alert.alert('Watch Face', `Selected: ${watchFace.name}`);
    };

    return (
        <Animated.ScrollView
            style={[styles.container, { backgroundColor: colors.background, opacity: fadeAnim }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Wearables</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddDevice}>
                    <Ionicons name="add-circle-outline" size={28} color={colors.info} />
                </TouchableOpacity>
            </View>

            {/* Connected Device */}
            <View style={[styles.deviceContainer, { backgroundColor: colors.cardBackground }]}>
                <TouchableOpacity style={styles.deviceCard}>
                    {/* Device Image */}
                    <View style={styles.deviceImageContainer}>
                        <View style={[styles.watchPlaceholder, { backgroundColor: colors.divider }]}>
                            <Ionicons name="watch" size={80} color={colors.textSecondary} />
                        </View>
                    </View>

                    {/* Device Info */}
                    <View style={styles.deviceInfo}>
                        <View style={styles.deviceHeader}>
                            <Text style={[styles.deviceName, { color: colors.text }]}>{device.name}</Text>
                            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                        </View>
                        <View style={styles.deviceStatus}>
                            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.statusText, { color: colors.success }]}>Connected</Text>
                            <Text style={[styles.batteryText, { color: colors.textSecondary }]}> | Battery: {device.battery}%</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Sync Button */}
                <TouchableOpacity
                    style={[styles.syncButton, { backgroundColor: colors.info }, syncing && styles.syncButtonDisabled]}
                    onPress={handleSync}
                    disabled={syncing}
                >
                    {syncing ? (
                        <Text style={styles.syncButtonText}>Syncing...</Text>
                    ) : (
                        <>
                            <Ionicons name="sync" size={20} color="#FFFFFF" />
                            <Text style={styles.syncButtonText}>Sync</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Watch Faces */}
            <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Online</Text>
                    <TouchableOpacity>
                        <Text style={[styles.sectionLink, { color: colors.info }]}>All</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.info} style={styles.chevron} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.watchFacesContainer}
                >
                    {mockWatchFaces.map((watchFace) => (
                        <TouchableOpacity
                            key={watchFace.id}
                            style={[styles.watchFaceCard, { backgroundColor: colors.cardBackground }]}
                            onPress={() => handleWatchFaceSelect(watchFace)}
                        >
                            <View style={[styles.watchFaceImage, { backgroundColor: colors.divider }]}>
                                <Text style={styles.watchFaceEmoji}>{watchFace.thumbnail}</Text>
                            </View>
                            <Text style={[styles.watchFaceName, { color: colors.text }]}>{watchFace.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Settings List */}
            <View style={[styles.settingsList, { backgroundColor: colors.cardBackground }]}>
                <SettingItem
                    icon="notifications"
                    iconColor={colors.warning}
                    title="Notifications and calls"
                    onPress={() => Alert.alert('Notifications', 'Configure notification settings')}
                    colors={colors}
                />
                <SettingItem
                    icon="fitness"
                    iconColor={colors.heartRateColor}
                    title="Fitness and health"
                    onPress={() => Alert.alert('Fitness', 'Configure fitness tracking')}
                    colors={colors}
                />
                <SettingItem
                    icon="apps"
                    iconColor={colors.info}
                    title="Apps"
                    onPress={() => Alert.alert('Apps', 'Manage device apps')}
                    colors={colors}
                />
                <SettingItem
                    icon="alarm"
                    iconColor={colors.sleepColor}
                    title="Alarms"
                    onPress={() => Alert.alert('Alarms', 'Manage alarms')}
                    colors={colors}
                />
                <SettingItem
                    icon="settings"
                    iconColor={colors.textSecondary}
                    title="System settings"
                    onPress={() => Alert.alert('Settings', 'System settings')}
                    colors={colors}
                />
            </View>

            <View style={styles.bottomSpacing} />
        </Animated.ScrollView>
    );
}

// Setting Item Component
interface SettingItemProps {
    icon: any;
    iconColor: string;
    title: string;
    onPress: () => void;
    colors?: any;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, iconColor, title, onPress, colors }) => {
    const themeColors = colors || useThemeColors();
    return (
        <TouchableOpacity
            style={[
                styles.settingItem,
                {
                    backgroundColor: themeColors.cardBackground,
                    borderBottomColor: themeColors.divider
                }
            ]}
            onPress={onPress}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: iconColor }]}>
                    <Ionicons name={icon} size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.settingTitle, { color: themeColors.text }]}>{title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.placeholder} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
    },
    addButton: {
        padding: 4,
    },
    deviceContainer: {
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    deviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    deviceImageContainer: {
        marginRight: 16,
    },
    watchPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deviceInfo: {
        flex: 1,
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    deviceName: {
        fontSize: 20,
        fontWeight: '600',
    },
    deviceStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
    },
    batteryText: {
        fontSize: 14,
    },
    syncButton: {
        flexDirection: 'row',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    syncButtonDisabled: {
        backgroundColor: '#C7C7CC',
    },
    syncButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    section: {
        marginTop: 24,
        paddingVertical: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    sectionLink: {
        fontSize: 16,
    },
    chevron: {
        position: 'absolute',
        right: -18,
        top: 2,
    },
    watchFacesContainer: {
        paddingHorizontal: 16,
        gap: 16,
    },
    watchFaceCard: {
        alignItems: 'center',
        marginHorizontal: 4,
    },
    watchFaceImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    watchFaceEmoji: {
        fontSize: 40,
    },
    watchFaceName: {
        fontSize: 12,
        textAlign: 'center',
    },
    settingsList: {
        marginTop: 24,
        borderRadius: 12,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingTitle: {
        fontSize: 16,
    },
    bottomSpacing: {
        height: 100,
    },
});
