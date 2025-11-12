// Device Context - Quản lý thiết bị và health data
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { BLEService } from '../services/bleService';
import { dataSyncService } from '../services/dataSync';
import { DeviceStorage } from '../services/deviceStorage';
import { BLEHealthData, WearableDevice } from '../types';

interface DeviceContextType {
    device: WearableDevice | null;
    healthData: BLEHealthData | null;
    isConnected: boolean;
    pendingSyncCount: number;
    setDevice: (device: WearableDevice | null) => void;
    updateHealthData: (data: BLEHealthData) => void;
    syncDeviceData: () => Promise<void>;
    disconnectDevice: () => Promise<void>;
    forceSyncToServer: () => Promise<boolean>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [device, setDeviceState] = useState<WearableDevice | null>(null);
    const [healthData, setHealthData] = useState<BLEHealthData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    // Load device on mount
    useEffect(() => {
        loadDevice();
    }, []);

    // Subscribe to health data when device is connected
    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        if (device?.connected && device.id) {
            console.log('[DeviceContext] Subscribing to health data...');

            // Start data sync service
            dataSyncService.start(device.id, device.name);

            BLEService.subscribeToHealthData(device.id, (data) => {
                console.log('[DeviceContext] Received health data:', data);
                setHealthData(data);

                // Add to sync buffer
                dataSyncService.addData(data);
                setPendingSyncCount(dataSyncService.getBufferSize());
            }).then((unsub) => {
                unsubscribe = unsub;
            });
        }

        return () => {
            if (unsubscribe) {
                console.log('[DeviceContext] Unsubscribing from health data');
                unsubscribe();
            }
            // Stop sync service when device disconnects
            dataSyncService.stop();
        };
    }, [device?.id, device?.connected]);

    const loadDevice = async () => {
        const savedDevice = await DeviceStorage.getConnectedDevice();
        if (savedDevice) {
            setDeviceState(savedDevice);
            setIsConnected(savedDevice.connected);
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

    return (
        <DeviceContext.Provider
            value={{
                device,
                healthData,
                isConnected,
                pendingSyncCount,
                setDevice,
                updateHealthData,
                syncDeviceData,
                disconnectDevice,
                forceSyncToServer,
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
