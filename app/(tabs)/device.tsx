import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AddMenuToggle from '../../components/AddMenuToggle';
import { useDevice } from '../../contexts/DeviceContext';
import { useTheme, useThemeColors } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';
import { WearableDevice } from '../../types';
import { deviceToasts, showToast } from '../../utils/toast';

export default function DeviceScreen() {
    const colors = useThemeColors();
    const router = useRouter();
    const { themeTransition } = useTheme();
    const { device, syncDeviceData, disconnectDevice, pendingSyncCount, forceSyncToServer, isConnected, reconnectToDevice, getDeviceHistory, removeDevice } = useDevice();
    const [syncing, setSyncing] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [deviceHistory, setDeviceHistory] = useState<WearableDevice[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const hasDevice = !!device;

    // Load device history when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadDeviceHistory();
        }, [])
    );

    /**
     * Load devices from both API (server) and local storage, then merge them.
     * API devices are the source of truth for registered devices.
     * Local storage may have devices that were connected but not yet synced.
     */
    const loadDeviceHistory = async () => {
        setLoadingDevices(true);
        try {
            // Get devices from local storage first (for offline support)
            const localHistory = await getDeviceHistory();

            // Try to fetch devices from API
            try {
                const response = await apiService.getMyDevices();
                console.log('[Device] API response:', response);

                if (response.data && Array.isArray(response.data)) {
                    // Convert API response to WearableDevice format
                    const apiDevices: WearableDevice[] = response.data.map(d => ({
                        id: d.deviceUuid,
                        name: d.deviceName,
                        type: 'smartwatch',
                        connected: device?.id === d.deviceUuid && isConnected,
                        battery: device?.id === d.deviceUuid ? (device?.battery ?? 100) : 100,
                    }));

                    // Merge: API devices take priority, but preserve local connection status
                    const mergedDevices = apiDevices.map(apiDevice => {
                        const localDevice = localHistory.find(l => l.id === apiDevice.id);
                        return {
                            ...apiDevice,
                            connected: localDevice?.connected ?? apiDevice.connected,
                            battery: localDevice?.battery ?? apiDevice.battery,
                        };
                    });

                    // Add any local-only devices (connected but not yet registered on server)
                    const apiDeviceIds = new Set(apiDevices.map(d => d.id));
                    const localOnlyDevices = localHistory.filter(l => !apiDeviceIds.has(l.id));

                    const finalDevices = [...mergedDevices, ...localOnlyDevices];
                    console.log('[Device] Final merged devices:', finalDevices.length);
                    setDeviceHistory(finalDevices);
                } else {
                    // API returned empty or invalid data, use local
                    console.log('[Device] API returned no devices, using local storage');
                    setDeviceHistory(localHistory);
                }
            } catch (apiError) {
                // API failed, fall back to local storage
                console.warn('[Device] Failed to fetch devices from API:', apiError);
                setDeviceHistory(localHistory);
            }
        } catch (error) {
            console.error('[Device] Error loading device history:', error);
            showToast.error('Failed to load devices');
        } finally {
            setLoadingDevices(false);
        }
    };

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
        if (!device) return;

        setSyncing(true);
        try {
            await syncDeviceData();
            deviceToasts.syncSuccess();
        } catch (error) {
            console.error('[Device] Sync error:', error);
            deviceToasts.syncError();
        } finally {
            setSyncing(false);
        }
    };

    const handleAddDevice = () => {
        // Navigate to scan devices screen
        router.push('/scan-devices');
    };

    const handleWatchFaceSelect = (selectedDevice: WearableDevice) => {
        Alert.alert(
            'Connect to Device',
            `Do you want to connect to ${selectedDevice.name}?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Connect',
                    onPress: async () => {
                        // Pass device info so it can be saved to local storage if not already there
                        const success = await reconnectToDevice(selectedDevice.id, selectedDevice);
                        if (success) {
                            deviceToasts.connected(selectedDevice.name);
                            await loadDeviceHistory();
                        } else {
                            deviceToasts.connectionFailed(selectedDevice.name);
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteDevice = (targetDevice: WearableDevice) => {
        Alert.alert(
            'Delete Device',
            `Are you sure you want to remove "${targetDevice.name}" from your devices? This action cannot be undone.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await removeDevice(targetDevice.id);
                        if (success) {
                            showToast.success('Device removed successfully');
                            await loadDeviceHistory();
                        } else {
                            showToast.error('Failed to remove device');
                        }
                    },
                },
            ]
        );
    };

    // Menu items for add button
    const menuItems = [
        {
            icon: 'watch' as const,
            iconColor: colors.info,
            title: 'Add Device',
            onPress: handleAddDevice,
        },
        {
            icon: 'bluetooth' as const,
            iconColor: colors.stepsColor,
            title: 'Scan Bluetooth Devices',
            onPress: () => router.push('/scan-devices'),
        },
        {
            icon: 'sync' as const,
            iconColor: colors.success,
            title: 'Sync Data',
            onPress: handleSync,
        },
    ];

    // Render when no device is connected
    if (!hasDevice) {
        return (
            <Animated.ScrollView
                style={[styles.container, { backgroundColor: colors.background, opacity: fadeAnim }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={[styles.header]}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Wearables</Text>
                    {/* When press button -> toggle add-new-device -> handle similar when press addDeviceButton */}
                    <TouchableOpacity style={styles.addButton} onPress={() => setShowAddMenu(true)} >
                        <Ionicons name="add-circle-outline" size={28} color={colors.tint} />
                    </TouchableOpacity>
                </View>

                {/* No Device Card */}
                <View style={styles.noDeviceContainer}>
                    <View style={[styles.noDeviceCard, { backgroundColor: colors.cardBackground }]}>
                        <Image
                            source={require('../../assets/images/device.png')}
                            style={styles.deviceImage}
                            resizeMode="contain"
                        />
                        <TouchableOpacity
                            style={[styles.addDeviceButton, { backgroundColor: colors.tint }]}
                            onPress={handleAddDevice}
                        >
                            <Text style={styles.addDeviceButtonText}>Add Device</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* My Devices - Show registered devices even when not connected */}
                {(deviceHistory.length > 0 || loadingDevices) && (
                    <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Devices</Text>
                            <TouchableOpacity onPress={loadDeviceHistory} disabled={loadingDevices}>
                                {loadingDevices ? (
                                    <ActivityIndicator size="small" color={colors.tint} />
                                ) : (
                                    <Ionicons name="refresh" size={20} color={colors.tint} />
                                )}
                            </TouchableOpacity>
                        </View>

                        {loadingDevices ? (
                            <View style={styles.emptyDevicesContainer}>
                                <ActivityIndicator size="large" color={colors.tint} />
                                <Text style={[styles.emptyDevicesText, { color: colors.textSecondary, marginTop: 12 }]}>
                                    Loading devices...
                                </Text>
                            </View>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.watchFacesContainer}
                            >
                                {deviceHistory.map((savedDevice) => (
                                    <TouchableOpacity
                                        key={savedDevice.id}
                                        style={[styles.watchFaceCard, { backgroundColor: colors.cardBackground }]}
                                        onPress={() => handleWatchFaceSelect(savedDevice)}
                                        onLongPress={() => handleDeleteDevice(savedDevice)}
                                        delayLongPress={500}
                                    >
                                        <View style={[styles.watchFaceImage, { backgroundColor: colors.divider }]}>
                                            {savedDevice.image ? (
                                                <Image
                                                    source={{ uri: savedDevice.image }}
                                                    style={styles.savedDeviceImage}
                                                    resizeMode="contain"
                                                />
                                            ) : (
                                                <Image
                                                    source={require('../../assets/images/device.png')}
                                                    style={styles.savedDeviceImage}
                                                    resizeMode="contain"
                                                />
                                            )}
                                        </View>
                                        <Text style={[styles.watchFaceName, { color: colors.text }]} numberOfLines={1}>
                                            {savedDevice.name}
                                        </Text>
                                        <Text style={[styles.tapToConnectText, { color: colors.tint }]}>
                                            Tap to connect
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}

                <View style={styles.bottomSpacing} />

                {/* Add Menu Toggle */}
                <AddMenuToggle
                    visible={showAddMenu}
                    onClose={() => setShowAddMenu(false)}
                    menuItems={menuItems}
                    title="Quick Actions"
                />
            </Animated.ScrollView>
        );
    }

    // Render when device is connected
    return (
        <Animated.ScrollView
            style={[styles.container, { backgroundColor: colors.background, opacity: fadeAnim }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Wearables</Text>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    {/* Pending Sync Badge */}
                    {pendingSyncCount > 0 && (
                        <TouchableOpacity
                            style={[styles.syncBadge, { backgroundColor: colors.success + '20', borderColor: colors.success }]}
                            onPress={async () => {
                                const success = await forceSyncToServer();
                                if (success) {
                                    deviceToasts.syncSuccess();
                                } else {
                                    deviceToasts.syncError();
                                }
                            }}
                        >
                            <Ionicons name="cloud-upload" size={16} color={colors.success} />
                            <Text style={[styles.syncBadgeText, { color: colors.success }]}>{pendingSyncCount}</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.addButton} onPress={() => setShowAddMenu(true)}>
                        <Ionicons name="add-circle-outline" size={28} color={colors.tint} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Connected Device */}
            <View style={[styles.deviceContainer, { backgroundColor: colors.background }]}>
                <View style={styles.deviceCard}>
                    {/* Column 1: Device Image */}
                    <View>
                        <View style={[styles.watchPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                            <Image
                                source={require('../../assets/images/device.png')}
                                style={styles.deviceImagePlaceHolder}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    {/* Column 2: Device Info + Sync Button */}
                    <View style={styles.deviceRightColumn}>
                        {/* Row 1: Device Info */}
                        <TouchableOpacity style={styles.deviceInfo}>
                            <View style={styles.deviceHeader}>
                                <Text style={[styles.deviceName, { color: colors.text }]}>{device?.name || 'Unknown Device'}</Text>
                            </View>
                            <View style={styles.deviceStatus}>
                                <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.success : colors.error }]} />
                                <Text style={[styles.statusText, { color: isConnected ? colors.success : colors.error }]}>
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </Text>
                            </View>
                            {isConnected && (
                                <View style={styles.deviceStatus}>
                                    <View style={[styles.statusDot, { backgroundColor: 'transparent' }]} />
                                    <Text style={[styles.batteryText, { color: colors.textSecondary }]}>
                                        Battery: {device?.battery || 0}%
                                        {' | Last charged '}{device?.lastCharged || 'N/A'} days ago
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Row 2: Sync Button */}
                        <TouchableOpacity
                            style={[styles.syncButton, { backgroundColor: colors.lightTint }, syncing && styles.syncButtonDisabled]}
                            onPress={handleSync}
                            disabled={syncing}
                        >
                            {syncing ? (
                                <Text style={[styles.syncButtonText, { color: colors.tint }]}>Syncing...</Text>
                            ) : (
                                <>
                                    <Ionicons name="sync" size={20} style={{ color: colors.tint }} />
                                    <Text style={[styles.syncButtonText, { color: colors.tint }]}>Sync</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* My Devices */}
            <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>My Devices</Text>
                    <TouchableOpacity onPress={loadDeviceHistory} disabled={loadingDevices}>
                        {loadingDevices ? (
                            <ActivityIndicator size="small" color={colors.tint} />
                        ) : (
                            <Ionicons name="refresh" size={20} color={colors.tint} />
                        )}
                    </TouchableOpacity>
                </View>

                {loadingDevices ? (
                    <View style={styles.emptyDevicesContainer}>
                        <ActivityIndicator size="large" color={colors.tint} />
                        <Text style={[styles.emptyDevicesText, { color: colors.textSecondary, marginTop: 12 }]}>
                            Loading devices...
                        </Text>
                    </View>
                ) : deviceHistory.length === 0 ? (
                    <View style={styles.emptyDevicesContainer}>
                        <Text style={[styles.emptyDevicesText, { color: colors.textSecondary }]}>
                            No devices found. Connect a device to get started.
                        </Text>
                    </View>
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.watchFacesContainer}
                    >
                        {deviceHistory.map((savedDevice) => (
                            <TouchableOpacity
                                key={savedDevice.id}
                                style={[styles.watchFaceCard, { backgroundColor: colors.cardBackground }]}
                                onPress={() => handleWatchFaceSelect(savedDevice)}
                                onLongPress={() => handleDeleteDevice(savedDevice)}
                                delayLongPress={500}
                            >
                                <View style={[styles.watchFaceImage, { backgroundColor: colors.divider }]}>
                                    {savedDevice.image ? (
                                        <Image
                                            source={{ uri: savedDevice.image }}
                                            style={styles.savedDeviceImage}
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <Image
                                            source={require('../../assets/images/device.png')}
                                            style={styles.savedDeviceImage}
                                            resizeMode="contain"
                                        />
                                    )}
                                </View>
                                <Text style={[styles.watchFaceName, { color: colors.text }]} numberOfLines={1}>
                                    {savedDevice.name}
                                </Text>
                                {savedDevice.id === device?.id && (
                                    <View style={[styles.activeDeviceBadge, { backgroundColor: colors.success }]}>
                                        <Text style={styles.activeDeviceText}>Active</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Settings List */}
            <View style={[styles.settingsList, { backgroundColor: colors.cardBackground }]}>
                <SettingItem
                    icon="settings-outline"
                    iconColor={colors.tint}
                    title="Device Settings"
                    onPress={() => router.push('/device-settings')}
                    colors={colors}
                    disabled={!isConnected}
                />
                <SettingItem
                    icon="notifications"
                    iconColor={colors.warning}
                    title="Notifications and calls"
                    onPress={() => router.push('/notification-settings')}
                    colors={colors}
                />
                <SettingItem
                    icon="fitness"
                    iconColor={colors.heartRateColor}
                    title="Fitness and health"
                    onPress={() => showToast.info('Feature coming soon')}
                    colors={colors}
                />
                <SettingItem
                    icon="apps"
                    iconColor={colors.info}
                    title="Apps"
                    onPress={() => showToast.info('Feature coming soon')}
                    colors={colors}
                />
                <SettingItem
                    icon="alarm"
                    iconColor={colors.sleepColor}
                    title="Alarms"
                    onPress={() => showToast.info('Feature coming soon')}
                    colors={colors}
                />
                <SettingItem
                    icon="settings"
                    iconColor={colors.textSecondary}
                    title="System settings"
                    onPress={() => showToast.info('Feature coming soon')}
                    colors={colors}
                />
            </View>

            <View style={styles.bottomSpacing} />

            {/* Add Menu Toggle */}
            <AddMenuToggle
                visible={showAddMenu}
                onClose={() => setShowAddMenu(false)}
                menuItems={menuItems}
                title="Quick Actions"
            />
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
    disabled?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, iconColor, title, onPress, colors, disabled = false }) => {
    const themeColors = colors || useThemeColors();
    return (
        <TouchableOpacity
            style={[
                styles.settingItem,
                {
                    backgroundColor: themeColors.cardBackground,
                    borderBottomColor: themeColors.divider,
                    opacity: disabled ? 0.5 : 1
                }
            ]}
            onPress={onPress}
            disabled={disabled}
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
        paddingTop: 30,
        paddingBottom: 0,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
    },
    addButton: {
        padding: 4,
    },
    syncBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        gap: 6,
    },
    syncBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    noDeviceContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    noDeviceCard: {
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
    },
    deviceImage: {
        width: 200,
        height: 200,
    },
    deviceImagePlaceHolder: {
        width: '100%',
        height: '100%',
    },
    addDeviceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 32,
    },
    addDeviceButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    deviceContainer: {
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    deviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    watchPlaceholder: {
        width: 160,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deviceRightColumn: {
        flex: 1,
        justifyContent: 'space-between',
    },
    deviceInfo: {
        flex: 1,
        marginBottom: 16,
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
        fontWeight: 'bold'
    },
    batteryText: {
        fontSize: 14,
        fontWeight: 'bold'
    },
    syncButton: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    syncButtonDisabled: {
        backgroundColor: '#C7C7CC',
    },
    syncButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        marginTop: 24,
        paddingVertical: 16,
        borderRadius: 12,
        marginHorizontal: 16,
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
        right: 0,
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
        overflow: 'hidden',
    },
    savedDeviceImage: {
        width: '100%',
        height: '100%',
    },
    watchFaceEmoji: {
        fontSize: 40,
    },
    watchFaceName: {
        fontSize: 12,
        textAlign: 'center',
        maxWidth: 80,
    },
    tapToConnectText: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
    },
    activeDeviceBadge: {
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    activeDeviceText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    emptyDevicesContainer: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyDevicesText: {
        fontSize: 14,
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
