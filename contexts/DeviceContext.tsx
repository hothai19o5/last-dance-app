// Device Context - Quản lý thiết bị và health data
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/api';
import { BLEService } from '../services/bleService';
import { dataSyncService } from '../services/dataSync';
import { DeviceStorage } from '../services/deviceStorage';
import { healthHistoryService } from '../services/healthHistoryService';
import { todayHealthDataService } from '../services/todayHealthDataService';
import { userProfileService } from '../services/userProfileService';
import { BLEBatchData, BLEConfig, BLEHealthData, WearableDevice } from '../types';

const DEVICE_CONFIG_KEY = '@device_config';

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
    reconnectToDevice: (deviceId: string, deviceInfo?: WearableDevice) => Promise<boolean>;
    getDeviceHistory: () => Promise<WearableDevice[]>;
    sendUserProfileToDevice: (deviceId: string) => Promise<boolean>;
    removeDevice: (deviceId: string) => Promise<boolean>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [device, setDeviceState] = useState<WearableDevice | null>(null);
    const [healthData, setHealthData] = useState<BLEHealthData | null>(null);
    const [batteryLevel, setBatteryLevel] = useState<number>(100);
    const [isConnected, setIsConnected] = useState(false);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    // Track previous sync count to avoid unnecessary re-renders
    const prevSyncCountRef = useRef<number>(0);

    // Helper function to update sync count only when changed
    const updateSyncCount = () => {
        const newCount = dataSyncService.getBufferSize();
        if (newCount !== prevSyncCountRef.current) {
            prevSyncCountRef.current = newCount;
            setPendingSyncCount(newCount);
        }
    };

    // Load today's health data from local storage (for displaying when app reopens)
    const loadTodayHealthData = async () => {
        try {
            const savedHealthData = await todayHealthDataService.getTodayHealthData();
            if (savedHealthData) {
                console.log('[DeviceContext] Loaded today health data from storage');
                setHealthData(savedHealthData);
            }
        } catch (error) {
            console.error('[DeviceContext] Error loading today health data:', error);
        }
    };

    // Load device on mount
    useEffect(() => {
        loadDevice();
        // Load today's health data so cards show data even before device connects
        loadTodayHealthData();

        // Check connection status periodically
        const checkInterval = setInterval(() => {
            checkDeviceConnection();
        }, 5000); // Check every 5 seconds

        return () => clearInterval(checkInterval);
    }, []);

    // Helper function to check if BLE is ready (permissions + bluetooth state)
    const isBLEReady = async (): Promise<boolean> => {
        try {
            // Check permissions first
            const hasPermissions = await BLEService.requestPermissions();
            if (!hasPermissions) {
                console.log('[DeviceContext] BLE permissions not granted');
                return false;
            }

            // Check Bluetooth state
            const isEnabled = await BLEService.checkBluetoothState();
            if (!isEnabled) {
                console.log('[DeviceContext] Bluetooth is disabled');
                return false;
            }

            return true;
        } catch (error) {
            console.error('[DeviceContext] Error checking BLE readiness:', error);
            return false;
        }
    };

    const checkDeviceConnection = async () => {
        if (device?.id) {
            try {
                // Check BLE readiness first
                const bleReady = await isBLEReady();
                if (!bleReady) {
                    if (isConnected) {
                        console.log('[DeviceContext] BLE not ready, marking as disconnected');
                        setIsConnected(false);
                        await DeviceStorage.updateConnectionStatus(false);
                        setDeviceState(prev => prev ? { ...prev, connected: false } : null);
                    }
                    return;
                }

                const connected = await BLEService.isDeviceConnected(device.id);
                if (connected !== isConnected) {
                    console.log('[DeviceContext] Connection status changed:', connected);
                    setIsConnected(connected);
                    await DeviceStorage.updateConnectionStatus(connected);

                    setDeviceState(prev => prev ? { ...prev, connected } : null);

                    if (!connected) {
                        console.log('[DeviceContext] Device disconnected, attempting auto-reconnect...');
                        setTimeout(async () => {
                            const reconnected = await reconnectToDevice(device.id);
                            if (reconnected) {
                                console.log('[DeviceContext] Auto-reconnect successful');
                            } else {
                                console.log('[DeviceContext] Auto-reconnect failed');
                            }
                        }, 2000);
                    }
                }
            } catch (error) {
                console.error('[DeviceContext] Error checking device connection:', error);
            }
        }
    };

    // Subscribe to health data when device is connected
    useEffect(() => {
        let unsubscribeHealth: (() => void) | null = null;
        let unsubscribeBattery: (() => void) | null = null;

        // Use isConnected state instead of device?.connected for more accurate tracking
        if (isConnected && device?.id) {
            console.log('[DeviceContext] Device connected, subscribing to health data and battery...');
            console.log('[DeviceContext] Device ID:', device.id, 'isConnected:', isConnected);

            // Start data sync service
            dataSyncService.start(device.id, device.name);

            // Subscribe to health data (alerts and batch data)
            BLEService.subscribeToHealthData(
                device.id,
                // Callback for single readings/alerts
                async (data: BLEHealthData) => {
                    console.log('[DeviceContext] ========== RECEIVED HEALTH DATA ==========');
                    console.log('[DeviceContext] Timestamp:', data.timestampISO);
                    console.log('[DeviceContext] HR:', data.heartRate, 'SpO2:', data.spo2, 'Steps:', data.steps);
                    console.log('[DeviceContext] Activity:', data.activityStatus, 'Sleep:', data.sleepDurationMinutes);
                    console.log('[DeviceContext] Alert Score:', data.alertScore);
                    console.log('[DeviceContext] ===============================================');

                    setHealthData(data);

                    // Save to today's health data for persistence (so cards show data when app reopens)
                    await todayHealthDataService.saveHealthData(data);

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
                    updateSyncCount();
                },
                // Callback for batch data (5-minute data)
                async (batchData: BLEBatchData) => {
                    console.log('[DeviceContext] Received batch data:', batchData.count, 'samples');

                    // Save all packets to health history for charts
                    for (const packet of batchData.packets) {
                        await healthHistoryService.addHealthData(packet);
                    }

                    // Add entire batch to sync buffer at once (more efficient)
                    dataSyncService.addBatchData(batchData.packets);

                    // Update current health data with latest from batch
                    if (batchData.packets.length > 0) {
                        const latestPacket = batchData.packets[batchData.packets.length - 1];
                        setHealthData(latestPacket);

                        // Save latest to today's health data for persistence
                        await todayHealthDataService.saveHealthData(latestPacket);
                    }

                    updateSyncCount();

                    // Note: No need to force sync here - batch data will be synced automatically
                    // based on buffer size (1000 records) or interval (5 minutes)
                }
            ).then((unsub) => {
                unsubscribeHealth = unsub;
                console.log('[DeviceContext] Health data subscription established');
            }).catch((error) => {
                console.error('[DeviceContext] Failed to subscribe to health data:', error);
            });

            // Subscribe to battery notifications
            BLEService.subscribeToBattery(device.id, async (level: number) => {
                console.log('[DeviceContext] Battery updated:', level, '%');
                setBatteryLevel(level);
                await DeviceStorage.updateBatteryLevel(level);
                setDeviceState(prev => prev ? { ...prev, battery: level } : null);
            }).then((unsub) => {
                unsubscribeBattery = unsub;
                console.log('[DeviceContext] Battery subscription established');
            }).catch((error) => {
                console.error('[DeviceContext] Failed to subscribe to battery:', error);
            });
        } else {
            console.log('[DeviceContext] Not subscribing - isConnected:', isConnected, 'deviceId:', device?.id);
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
    }, [device?.id, isConnected]); // Changed from device?.connected to isConnected

    const loadDevice = async () => {
        try {
            const savedDevice = await DeviceStorage.getConnectedDevice();
            if (savedDevice) {
                // Check BLE readiness before any BLE operations
                const bleReady = await isBLEReady();

                if (!bleReady) {
                    console.log('[DeviceContext] BLE not ready, setting device as disconnected');
                    const updatedDevice = { ...savedDevice, connected: false };
                    setDeviceState(updatedDevice);
                    setIsConnected(false);
                    return;
                }

                const actuallyConnected = await BLEService.isDeviceConnected(savedDevice.id);
                const updatedDevice = { ...savedDevice, connected: actuallyConnected };

                setDeviceState(updatedDevice);
                setIsConnected(actuallyConnected);

                if (actuallyConnected !== savedDevice.connected) {
                    await DeviceStorage.updateConnectionStatus(actuallyConnected);
                }

                if (!actuallyConnected) {
                    console.log('[DeviceContext] Device not connected, attempting auto-reconnect...');
                    const reconnected = await reconnectToDevice(savedDevice.id);
                    if (!reconnected) {
                        console.log('[DeviceContext] Auto-reconnect failed, will retry periodically');
                    }
                }
            } else {
                console.log('[DeviceContext] No saved device, checking history...');

                // Check BLE readiness before attempting connection
                const bleReady = await isBLEReady();
                if (!bleReady) {
                    console.log('[DeviceContext] BLE not ready, skipping auto-connect');
                    return;
                }

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
        } catch (error) {
            console.error('[DeviceContext] Error loading device:', error);
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
            updateSyncCount(); // Update with actual count after sync
        }
        return result;
    };

    const reconnectToDevice = async (deviceId: string, deviceInfo?: WearableDevice): Promise<boolean> => {
        try {
            console.log('[DeviceContext] Reconnecting to device:', deviceId);

            // Check BLE readiness before connecting
            const bleReady = await isBLEReady();
            if (!bleReady) {
                console.log('[DeviceContext] BLE not ready, skipping reconnect');
                return false;
            }

            const connected = await BLEService.connectToDevice(deviceId);

            if (connected) {
                // Try to find device in local storage first
                const history = await DeviceStorage.getDeviceHistory();
                let targetDevice = history.find(d => d.id === deviceId);

                // If not in local storage but deviceInfo provided (e.g., from API), use that
                if (!targetDevice && deviceInfo) {
                    console.log('[DeviceContext] Device not in local storage, using provided deviceInfo');
                    targetDevice = deviceInfo;
                    // Save to local storage for future use
                    await DeviceStorage.addToDeviceHistory(targetDevice);
                }

                if (targetDevice) {
                    const updatedDevice = { ...targetDevice, connected: true };
                    await setDevice(updatedDevice);

                    console.log('[DeviceContext] Sending user profile to reconnected device...');
                    const profileSent = await sendUserProfileToDevice(deviceId);
                    if (profileSent) {
                        console.log('[DeviceContext] User profile sent to reconnected device');
                    } else {
                        console.warn('[DeviceContext] Failed to send user profile to reconnected device');
                    }

                    return true;
                } else {
                    console.error('[DeviceContext] Device connected but no device info available');
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
     * Xoá device khỏi app và server
     */
    const removeDevice = async (deviceId: string): Promise<boolean> => {
        try {
            console.log('[DeviceContext] Removing device:', deviceId);

            // If this is the current connected device, disconnect first
            if (device?.id === deviceId) {
                await disconnectDevice();
            }

            // Remove from server
            try {
                await apiService.deleteDevice(deviceId);
                console.log('[DeviceContext] Device removed from server');
            } catch (serverError) {
                console.warn('[DeviceContext] Failed to remove device from server:', serverError);
                // Continue to remove locally even if server fails
            }

            // Remove from local history
            await DeviceStorage.removeFromDeviceHistory(deviceId);
            console.log('[DeviceContext] Device removed from local history');

            return true;
        } catch (error) {
            console.error('[DeviceContext] Failed to remove device:', error);
            return false;
        }
    };

    /**
     * Gửi thông tin user profile xuống thiết bị IoT sau khi kết nối BLE
     * Đọc config đã lưu từ device settings (nếu có)
     */
    const sendUserProfileToDevice = async (deviceId: string): Promise<boolean> => {
        try {
            console.log('[DeviceContext] Sending user profile to device...');

            // CRITICAL: Sync time first (mandatory for correct timestamps)
            console.log('[DeviceContext] Step 1: Syncing time...');
            const timeSynced = await BLEService.syncTime(deviceId);
            if (!timeSynced) {
                console.error('[DeviceContext] Time sync failed! Timestamps will be incorrect.');
            } else {
                console.log('[DeviceContext] Time synced successfully');
            }

            // Get user profile from storage
            const profile = await userProfileService.getProfile();
            if (!profile) {
                console.warn('[DeviceContext] No user profile found, using defaults');
            }

            // Calculate BMI from height and weight
            const height = profile?.heightM ? profile.heightM / 100 : 1.70; // Convert cm to meters
            const weight = profile?.weightKg || 65;
            const bmi = weight / (height * height);

            // Try to load saved device config from device settings
            let savedConfig: { dataMode?: number; stepEnable?: number; mlEnable?: number } | null = null;
            try {
                const savedConfigStr = await AsyncStorage.getItem(DEVICE_CONFIG_KEY);
                if (savedConfigStr) {
                    savedConfig = JSON.parse(savedConfigStr);
                    console.log('[DeviceContext] Loaded saved device config:', savedConfig);
                }
            } catch (configError) {
                console.warn('[DeviceContext] Could not load saved config:', configError);
            }

            // Prepare BLE config - use saved values if available, otherwise defaults
            const bleConfig: BLEConfig = {
                bmi: parseFloat(bmi.toFixed(2)), // Round to 2 decimal places
                dataMode: savedConfig?.dataMode ?? 0,      // 0: Realtime (default), 1: Batch
                stepEnable: savedConfig?.stepEnable ?? 1,  // 1: Enable step counting
                mlEnable: savedConfig?.mlEnable ?? 1,      // 1: Enable AI anomaly detection
            };

            console.log('[DeviceContext] Step 2: Sending config:', bleConfig);
            console.log('[DeviceContext]   - Data Mode:', bleConfig.dataMode === 0 ? 'Realtime' : 'Batch');
            console.log('[DeviceContext]   - Step Counting:', bleConfig.stepEnable === 1 ? 'ON' : 'OFF');
            console.log('[DeviceContext]   - ML Detection:', bleConfig.mlEnable === 1 ? 'ON' : 'OFF');

            // Write config to device
            const success = await BLEService.writeConfig(deviceId, bleConfig);

            if (success) {
                console.log('[DeviceContext] User profile sent to device successfully');
            } else {
                console.error('[DeviceContext] Failed to send user profile to device');
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
                removeDevice,
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
