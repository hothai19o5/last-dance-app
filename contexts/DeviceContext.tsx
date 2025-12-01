// Device Context - Quản lý thiết bị và health data
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { BLEService } from '../services/bleService';
import { dataSyncService } from '../services/dataSync';
import { DeviceStorage } from '../services/deviceStorage';
import { healthHistoryService } from '../services/healthHistoryService';
import { userProfileService } from '../services/userProfileService';
import { BLEBatchData, BLEConfig, BLEHealthData, WearableDevice } from '../types';

interface DeviceContextType {
    device: WearableDevice | null;
    healthData: BLEHealthData | null;
    batteryLevel: number;
    isConnected: boolean;
    pendingSyncCount: number;
    setDevice: (device: WearableDevice | null) => void;
    updateHealthData: (data: BLEHealthData) => void;
    syncDeviceData: () => Promise<void>;
    disconnectDevice: () => Promise<void>;
    forceSyncToServer: () => Promise<boolean>;
    reconnectToDevice: (deviceId: string) => Promise<boolean>;
    getDeviceHistory: () => Promise<WearableDevice[]>;
    sendUserProfileToDevice: (deviceId: string) => Promise<boolean>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [device, setDeviceState] = useState<WearableDevice | null>(null);
    const [healthData, setHealthData] = useState<BLEHealthData | null>(null);
    const [batteryLevel, setBatteryLevel] = useState<number>(100);
    const [isConnected, setIsConnected] = useState(false);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    // Load device on mount
    useEffect(() => {
        loadDevice();

        // Check connection status periodically
        const checkInterval = setInterval(() => {
            checkDeviceConnection();
        }, 5000); // Check every 5 seconds

        return () => clearInterval(checkInterval);
    }, []);

    const checkDeviceConnection = async () => {
        if (device?.id) {
            const connected = await BLEService.isDeviceConnected(device.id);
            if (connected !== isConnected) {
                console.log('[DeviceContext] Connection status changed:', connected);
                setIsConnected(connected);
                await DeviceStorage.updateConnectionStatus(connected);

                // Update device state
                setDeviceState(prev => prev ? { ...prev, connected } : null);

                // If disconnected, try to reconnect
                if (!connected) {
                    console.log('[DeviceContext] Device disconnected, attempting auto-reconnect...');
                    setTimeout(async () => {
                        const reconnected = await reconnectToDevice(device.id);
                        if (reconnected) {
                            console.log('[DeviceContext] Auto-reconnect successful');
                        } else {
                            console.log('[DeviceContext] Auto-reconnect failed');
                        }
                    }, 2000); // Wait 2s before reconnecting
                }
            }
        }
    };

    // Subscribe to health data when device is connected
    useEffect(() => {
        let unsubscribeHealth: (() => void) | null = null;
        let unsubscribeBattery: (() => void) | null = null;

        if (device?.connected && device.id) {
            console.log('[DeviceContext] Subscribing to health data and battery...');

            // Start data sync service
            dataSyncService.start(device.id, device.name);

            // Subscribe to health data (alerts and batch data)
            BLEService.subscribeToHealthData(
                device.id,
                // Callback for single readings/alerts
                async (data: BLEHealthData) => {
                    console.log('[DeviceContext] Received health data:', data);
                    setHealthData(data);

                    // Save to health history for charts
                    await healthHistoryService.addHealthData(data);

                    // Add to sync buffer (alerts are important, sync immediately)
                    if (data.alertScore !== null && data.alertScore > 0.95) {
                        console.log('[DeviceContext] ALERT! Score:', data.alertScore);
                        dataSyncService.addData(data);
                        dataSyncService.forceSyncNow(); // Sync alerts immediately
                    } else {
                        dataSyncService.addData(data);
                    }
                    setPendingSyncCount(dataSyncService.getBufferSize());
                },
                // Callback for batch data (5-minute data)
                async (batchData: BLEBatchData) => {
                    console.log('[DeviceContext] Received batch data:', batchData.count, 'samples');

                    // Convert batch data to individual health data points for history
                    const baseTime = Date.now() - (batchData.count * 1000); // Estimate start time
                    for (let i = 0; i < batchData.count; i++) {
                        const singleData: BLEHealthData = {
                            heartRate: batchData.hr[i],
                            spo2: batchData.spo2[i],
                            steps: 0, // Not included in batch
                            alertScore: null,
                            timestamp: new Date(baseTime + (i * 1000)).toISOString(),
                        };
                        await healthHistoryService.addHealthData(singleData);
                        dataSyncService.addData(singleData);
                    }

                    // Update current health data with latest from batch
                    const latestIndex = batchData.count - 1;
                    setHealthData({
                        heartRate: batchData.hr[latestIndex],
                        spo2: batchData.spo2[latestIndex],
                        steps: 0,
                        alertScore: null,
                        timestamp: new Date().toISOString(),
                    });

                    setPendingSyncCount(dataSyncService.getBufferSize());

                    // Sync batch data to server
                    await dataSyncService.forceSyncNow();
                }
            ).then((unsub) => {
                unsubscribeHealth = unsub;
            });

            // Subscribe to battery notifications
            BLEService.subscribeToBattery(device.id, async (level: number) => {
                console.log('[DeviceContext] Battery updated:', level, '%');
                setBatteryLevel(level);
                await DeviceStorage.updateBatteryLevel(level);
                setDeviceState(prev => prev ? { ...prev, battery: level } : null);
            }).then((unsub) => {
                unsubscribeBattery = unsub;
            });
        }

        return () => {
            if (unsubscribeHealth) {
                console.log('[DeviceContext] Unsubscribing from health data');
                unsubscribeHealth();
            }
            if (unsubscribeBattery) {
                console.log('[DeviceContext] Unsubscribing from battery');
                unsubscribeBattery();
            }
            // Stop sync service when device disconnects
            dataSyncService.stop();
        };
    }, [device?.id, device?.connected]);

    const loadDevice = async () => {
        const savedDevice = await DeviceStorage.getConnectedDevice();
        if (savedDevice) {
            // Check actual BLE connection status
            const actuallyConnected = await BLEService.isDeviceConnected(savedDevice.id);
            const updatedDevice = { ...savedDevice, connected: actuallyConnected };

            setDeviceState(updatedDevice);
            setIsConnected(actuallyConnected);

            // Update storage with actual connection status
            if (actuallyConnected !== savedDevice.connected) {
                await DeviceStorage.updateConnectionStatus(actuallyConnected);
            }

            // If not connected, try auto-reconnect
            if (!actuallyConnected) {
                console.log('[DeviceContext] Device not connected, attempting auto-reconnect...');
                const reconnected = await reconnectToDevice(savedDevice.id);
                if (!reconnected) {
                    console.log('[DeviceContext] Auto-reconnect failed, will retry periodically');
                }
            }
        } else {
            // No saved device, try to connect to most recent device in history
            console.log('[DeviceContext] No saved device, checking history...');
            const history = await DeviceStorage.getDeviceHistory();
            if (history.length > 0) {
                const mostRecent = history[0];
                console.log('[DeviceContext] Attempting to connect to most recent device:', mostRecent.name);
                const connected = await reconnectToDevice(mostRecent.id);
                if (connected) {
                    console.log('[DeviceContext] Auto-connected to most recent device');
                } else {
                    console.log('[DeviceContext] Failed to auto-connect to most recent device');
                }
            }
        }
    };

    const setDevice = async (newDevice: WearableDevice | null) => {
        setDeviceState(newDevice);
        setIsConnected(newDevice?.connected || false);

        if (newDevice) {
            await DeviceStorage.saveConnectedDevice(newDevice);
        } else {
            await DeviceStorage.removeConnectedDevice();
        }
    };

    const updateHealthData = (data: BLEHealthData) => {
        setHealthData(data);
    };

    const syncDeviceData = async () => {
        if (!device?.id) {
            throw new Error('No device connected');
        }

        console.log('[DeviceContext] Syncing device data...');
        const data = await BLEService.syncData(device.id);
        if (data) {
            setHealthData(data);
        }

        // Update battery level
        try {
            const battery = await BLEService.getBatteryLevel(device.id);
            await DeviceStorage.updateBatteryLevel(battery);
            setDeviceState({ ...device, battery });
        } catch (error) {
            console.log('[DeviceContext] Could not read battery level');
        }
    };

    const disconnectDevice = async () => {
        if (device?.id) {
            await BLEService.disconnectDevice(device.id);
            await DeviceStorage.removeConnectedDevice();
            dataSyncService.stop();
            dataSyncService.clearBuffer();
            setDeviceState(null);
            setHealthData(null);
            setIsConnected(false);
            setPendingSyncCount(0);
        }
    };

    const forceSyncToServer = async (): Promise<boolean> => {
        const result = await dataSyncService.forceSyncNow();
        if (result) {
            setPendingSyncCount(0);
        }
        return result;
    };

    const reconnectToDevice = async (deviceId: string): Promise<boolean> => {
        try {
            console.log('[DeviceContext] Reconnecting to device:', deviceId);

            // Try to connect
            const connected = await BLEService.connectToDevice(deviceId);

            if (connected) {
                // Get device from history
                const history = await DeviceStorage.getDeviceHistory();
                const targetDevice = history.find(d => d.id === deviceId);

                if (targetDevice) {
                    const updatedDevice = { ...targetDevice, connected: true };
                    await setDevice(updatedDevice);
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('[DeviceContext] Reconnect failed:', error);
            return false;
        }
    };

    const getDeviceHistory = async (): Promise<WearableDevice[]> => {
        return await DeviceStorage.getDeviceHistory();
    };

    /**
     * Gửi thông tin user profile xuống thiết bị IoT sau khi kết nối BLE
     */
    const sendUserProfileToDevice = async (deviceId: string): Promise<boolean> => {
        try {
            console.log('[DeviceContext] Sending user profile to device...');

            // Get user profile from storage
            const profile = await userProfileService.getProfile();
            if (!profile) {
                console.warn('[DeviceContext] No user profile found, using defaults');
            }

            // Map gender to number (1=Male, 0=Female)
            const genderNum = profile?.gender === 'Male' ? 1 : (profile?.gender === 'Female' ? 0 : 1);

            // Prepare BLE config
            const bleConfig: BLEConfig = {
                height: profile?.height ? profile.height / 100 : 1.70, // Convert cm to meters
                weight: profile?.weight || 65,
                age: profile?.age || 25,
                gender: genderNum,
            };

            console.log('[DeviceContext] Sending config:', bleConfig);

            // Write config to device
            const success = await BLEService.writeConfig(deviceId, bleConfig);

            if (success) {
                console.log('[DeviceContext] ✅ User profile sent to device successfully');
            } else {
                console.error('[DeviceContext] ❌ Failed to send user profile to device');
            }

            return success;
        } catch (error) {
            console.error('[DeviceContext] Error sending user profile:', error);
            return false;
        }
    };

    return (
        <DeviceContext.Provider
            value={{
                device,
                healthData,
                batteryLevel,
                isConnected,
                pendingSyncCount,
                setDevice,
                updateHealthData,
                syncDeviceData,
                disconnectDevice,
                forceSyncToServer,
                reconnectToDevice,
                getDeviceHistory,
                sendUserProfileToDevice,
            }}
        >
            {children}
        </DeviceContext.Provider>
    );
};

export const useDevice = () => {
    const context = useContext(DeviceContext);
    if (!context) {
        throw new Error('useDevice must be used within DeviceProvider');
    }
    return context;
};
