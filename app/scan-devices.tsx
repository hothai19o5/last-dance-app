import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../contexts/ThemeContext';
import { BLEService } from '../services/bleService';

interface ScannedDevice {
    id: string;
    name: string;
    rssi?: number;
}

export default function ScanDevicesScreen() {
    const colors = useThemeColors();
    const router = useRouter();
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
                                Alert.alert('Success', `Connected to ${device.name}`);
                                router.back();
                            } else {
                                Alert.alert('Error', 'Failed to connect to device');
                            }
                        } catch (error) {
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
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Scan Devices</Text>
                <TouchableOpacity onPress={startScanning} disabled={scanning}>
                    <Ionicons
                        name="refresh"
                        size={24}
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
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        flex: 1,
        marginLeft: 16,
    },
    scanningContainer: {
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
