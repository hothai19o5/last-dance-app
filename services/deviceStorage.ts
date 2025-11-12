// Device Storage Service - Lưu thông tin thiết bị đã kết nối
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WearableDevice } from '../types';

const CONNECTED_DEVICE_KEY = '@connected_device';
const DEVICE_CONFIG_KEY = '@device_config';

export class DeviceStorage {
    // Lưu thiết bị đã kết nối
    static async saveConnectedDevice(device: WearableDevice): Promise<void> {
        try {
            await AsyncStorage.setItem(CONNECTED_DEVICE_KEY, JSON.stringify(device));
            console.log('[Storage] Device saved:', device.name);
        } catch (error) {
            console.error('[Storage] Failed to save device:', error);
        }
    }

    // Lấy thiết bị đã kết nối
    static async getConnectedDevice(): Promise<WearableDevice | null> {
        try {
            const deviceJson = await AsyncStorage.getItem(CONNECTED_DEVICE_KEY);
            if (deviceJson) {
                const device = JSON.parse(deviceJson);
                console.log('[Storage] Retrieved device:', device.name);
                return device;
            }
            return null;
        } catch (error) {
            console.error('[Storage] Failed to get device:', error);
            return null;
        }
    }

    // Xóa thiết bị đã kết nối
    static async removeConnectedDevice(): Promise<void> {
        try {
            await AsyncStorage.removeItem(CONNECTED_DEVICE_KEY);
            console.log('[Storage] Device removed');
        } catch (error) {
            console.error('[Storage] Failed to remove device:', error);
        }
    }

    // Cập nhật trạng thái kết nối
    static async updateConnectionStatus(connected: boolean): Promise<void> {
        try {
            const deviceJson = await AsyncStorage.getItem(CONNECTED_DEVICE_KEY);
            if (deviceJson) {
                const device = JSON.parse(deviceJson);
                device.connected = connected;
                await AsyncStorage.setItem(CONNECTED_DEVICE_KEY, JSON.stringify(device));
                console.log('[Storage] Connection status updated:', connected);
            }
        } catch (error) {
            console.error('[Storage] Failed to update connection status:', error);
        }
    }

    // Cập nhật battery level
    static async updateBatteryLevel(battery: number): Promise<void> {
        try {
            const deviceJson = await AsyncStorage.getItem(CONNECTED_DEVICE_KEY);
            if (deviceJson) {
                const device = JSON.parse(deviceJson);
                device.battery = battery;
                await AsyncStorage.setItem(CONNECTED_DEVICE_KEY, JSON.stringify(device));
                console.log('[Storage] Battery level updated:', battery);
            }
        } catch (error) {
            console.error('[Storage] Failed to update battery level:', error);
        }
    }
}
