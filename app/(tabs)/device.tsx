import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockWearableDevice, mockWatchFaces } from '../../data/mockData';
import { BLEService } from '../../services/bleService';

export default function DeviceScreen() {
    const [device, setDevice] = useState(mockWearableDevice);
    const [syncing, setSyncing] = useState(false);

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
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Wearables</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddDevice}>
                    <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Connected Device */}
            <View style={styles.deviceContainer}>
                <TouchableOpacity style={styles.deviceCard}>
                    {/* Device Image */}
                    <View style={styles.deviceImageContainer}>
                        <View style={styles.watchPlaceholder}>
                            <Ionicons name="watch" size={80} color="#8E8E93" />
                        </View>
                    </View>

                    {/* Device Info */}
                    <View style={styles.deviceInfo}>
                        <View style={styles.deviceHeader}>
                            <Text style={styles.deviceName}>{device.name}</Text>
                            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
                        </View>
                        <View style={styles.deviceStatus}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Connected</Text>
                            <Text style={styles.batteryText}> | Battery: {device.battery}%</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Sync Button */}
                <TouchableOpacity
                    style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
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
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Online</Text>
                    <TouchableOpacity>
                        <Text style={styles.sectionLink}>All</Text>
                        <Ionicons name="chevron-forward" size={16} color="#007AFF" style={styles.chevron} />
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
                            style={styles.watchFaceCard}
                            onPress={() => handleWatchFaceSelect(watchFace)}
                        >
                            <View style={styles.watchFaceImage}>
                                <Text style={styles.watchFaceEmoji}>{watchFace.thumbnail}</Text>
                            </View>
                            <Text style={styles.watchFaceName}>{watchFace.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Settings List */}
            <View style={styles.settingsList}>
                <SettingItem
                    icon="notifications"
                    iconColor="#FF9500"
                    title="Notifications and calls"
                    onPress={() => Alert.alert('Notifications', 'Configure notification settings')}
                />
                <SettingItem
                    icon="fitness"
                    iconColor="#FF453A"
                    title="Fitness and health"
                    onPress={() => Alert.alert('Fitness', 'Configure fitness tracking')}
                />
                <SettingItem
                    icon="apps"
                    iconColor="#007AFF"
                    title="Apps"
                    onPress={() => Alert.alert('Apps', 'Manage device apps')}
                />
                <SettingItem
                    icon="alarm"
                    iconColor="#5E5CE6"
                    title="Alarms"
                    onPress={() => Alert.alert('Alarms', 'Manage alarms')}
                />
                <SettingItem
                    icon="settings"
                    iconColor="#8E8E93"
                    title="System settings"
                    onPress={() => Alert.alert('Settings', 'System settings')}
                />
            </View>

            <View style={styles.bottomSpacing} />
        </ScrollView>
    );
}

// Setting Item Component
interface SettingItemProps {
    icon: any;
    iconColor: string;
    title: string;
    onPress: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, iconColor, title, onPress }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
        <View style={styles.settingLeft}>
            <View style={[styles.settingIconContainer, { backgroundColor: iconColor }]}>
                <Ionicons name={icon} size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.settingTitle}>{title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#000',
    },
    addButton: {
        padding: 4,
    },
    deviceContainer: {
        backgroundColor: '#FFFFFF',
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
        backgroundColor: '#F2F2F7',
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
        color: '#000',
    },
    deviceStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#34C759',
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        color: '#34C759',
    },
    batteryText: {
        fontSize: 14,
        color: '#8E8E93',
    },
    syncButton: {
        flexDirection: 'row',
        backgroundColor: '#fd570aff',
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
        backgroundColor: '#FFFFFF',
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
        color: '#000',
    },
    sectionLink: {
        fontSize: 16,
        color: '#007AFF',
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
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    watchFaceEmoji: {
        fontSize: 40,
    },
    watchFaceName: {
        fontSize: 12,
        color: '#8E8E93',
        textAlign: 'center',
    },
    settingsList: {
        marginTop: 24,
        backgroundColor: '#FFFFFF',
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
        borderBottomColor: '#F2F2F7',
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
        color: '#000',
    },
    bottomSpacing: {
        height: 100,
    },
});
