import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDevice } from '../contexts/DeviceContext';
import { useThemeColors } from '../contexts/ThemeContext';
import { BLEService } from '../services/bleService';
import { WearableDevice } from '../types';

interface ScannedDevice {
    id: string;
    name: string;
    rssi?: number;
}

export default function ScanDevicesScreen() {
    const colors = useThemeColors();
    const router = useRouter();
    const { setDevice } = useDevice();
    const [scanning, setScanning] = useState(false);
    const [devices, setDevices] = useState<ScannedDevice[]>([]);

    useEffect(() => {
        startScanning();
        return () => {
            BLEService.stopScan();
        };
    }, []);

    const startScanning = async () => {
        setScanning(true);
        setDevices([]);

        try {
            // Real BLE scanning
            await BLEService.scanForDevices(
                (device) => {
                    // Add device to list if not already present
                    setDevices((prevDevices) => {
                        const exists = prevDevices.some((d) => d.id === device.id);
                        if (!exists) {
                            return [...prevDevices, device];
                        }
                        return prevDevices;
                    });
                },
                10000 // Scan for 10 seconds
            );

            // Stop scanning after duration
            setTimeout(() => {
                setScanning(false);
            }, 10000);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to start scanning');
            setScanning(false);
        }
    };

    const handleDeviceConnect = async (device: ScannedDevice) => {
        Alert.alert(
            'Connect Device',
            `Do you want to connect to ${device.name}?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Connect',
                    onPress: async () => {
                        try {
                            // Real BLE connection
                            const connected = await BLEService.connectToDevice(device.id);
                            if (connected) {
                                // Tạo đối tượng thiết bị
                                const wearableDevice: WearableDevice = {
                                    id: device.id,
                                    name: device.name,
                                    type: 'smartwatch',
                                    connected: true,
                                    battery: 100, // Sẽ cập nhật sau
                                };

                                // Đọc battery level
                                try {
                                    const battery = await BLEService.getBatteryLevel(device.id);
                                    wearableDevice.battery = battery;
                                } catch (error) {
                                    console.log('[BLE] Could not read battery level');
                                }

                                // Lưu vào context
                                await setDevice(wearableDevice);

                                Alert.alert('Success', `Connected to ${device.name}`, [
                                    {
                                        text: 'OK',
                                        onPress: () => router.back(),
                                    }
                                ]);
                            } else {
                                Alert.alert('Error', 'Failed to connect to device');
                            }
                        } catch (error) {
                            console.error('[BLE] Connection error:', error);
                            Alert.alert('Error', 'Failed to connect to device');
                        }
                    },
                },
            ]
        );
    };

    const getSignalStrength = (rssi?: number) => {
        if (!rssi) return { icon: 'radio-outline', color: colors.textSecondary };
        if (rssi > -50) return { icon: 'radio', color: colors.success };
        if (rssi > -70) return { icon: 'radio-outline', color: colors.warning };
        return { icon: 'radio-outline', color: colors.error };
    };

    const renderDevice = ({ item }: { item: ScannedDevice }) => {
        const signal = getSignalStrength(item.rssi);
        return (
            <TouchableOpacity
                style={[styles.deviceItem, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}
                onPress={() => handleDeviceConnect(item)}
            >
                <View style={styles.deviceIcon}>
                    <Ionicons name="watch" size={32} color={colors.info} />
                </View>
                <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.deviceId, { color: colors.textSecondary }]}>ID: {item.id}</Text>
                </View>
                <View style={styles.deviceSignal}>
                    <Ionicons name={signal.icon as any} size={20} color={signal.color} />
                    {item.rssi && (
                        <Text style={[styles.rssiText, { color: colors.textSecondary }]}>{item.rssi} dBm</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Hide default header */}
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={32} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Scan Devices</Text>
                <TouchableOpacity onPress={startScanning} disabled={scanning}>
                    <Ionicons
                        name="refresh"
                        size={32}
                        color={scanning ? colors.textSecondary : colors.info}
                    />
                </TouchableOpacity>
            </View>

            {/* Scanning Indicator */}
            {scanning && (
                <View style={[styles.scanningContainer, { backgroundColor: colors.cardBackground }]}>
                    <ActivityIndicator size="large" color={colors.info} />
                    <Text style={[styles.scanningText, { color: colors.text }]}>Scanning for devices...</Text>
                    <Text style={[styles.scanningSubtext, { color: colors.textSecondary }]}>
                        Make sure Bluetooth is enabled and your device is in pairing mode
                    </Text>
                </View>
            )}

            {/* Devices List */}
            {!scanning && devices.length > 0 && (
                <View style={styles.listContainer}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>
                        Found {devices.length} device{devices.length !== 1 ? 's' : ''}
                    </Text>
                    <FlatList
                        data={devices}
                        renderItem={renderDevice}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                    />
                </View>
            )}

            {/* No Devices Found */}
            {!scanning && devices.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.text }]}>No devices found</Text>
                    <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                        Pull to refresh or tap the refresh button to scan again
                    </Text>
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
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 0,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        flex: 1,
        marginLeft: 12,
    },
    scanningContainer: {
        marginTop: 40,
        margin: 20,
        padding: 32,
        borderRadius: 12,
        alignItems: 'center',
    },
    scanningText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    scanningSubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 20,
    },
    listContainer: {
        flex: 1,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '600',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    listContent: {
        paddingHorizontal: 16,
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderBottomWidth: 1,
    },
    deviceIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    deviceId: {
        fontSize: 12,
    },
    deviceSignal: {
        alignItems: 'flex-end',
    },
    rssiText: {
        fontSize: 10,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
});
