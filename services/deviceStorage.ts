// Device Storage Service - Lưu thông tin thiết bị đã kết nối
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WearableDevice } from '../types';

const CONNECTED_DEVICE_KEY = '@connected_device';
const DEVICE_CONFIG_KEY = '@device_config';
const DEVICE_HISTORY_KEY = '@device_history';

export class DeviceStorage {
    // Lưu thiết bị đã kết nối
    static async saveConnectedDevice(device: WearableDevice): Promise<void> {
        try {
            await AsyncStorage.setItem(CONNECTED_DEVICE_KEY, JSON.stringify(device));
            console.log('[Storage] Device saved:', device.name);

            // Also add to history
            await this.addToDeviceHistory(device);
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

    // Thêm device vào lịch sử (tối đa 10 devices)
    static async addToDeviceHistory(device: WearableDevice): Promise<void> {
        try {
            const historyJson = await AsyncStorage.getItem(DEVICE_HISTORY_KEY);
            let history: WearableDevice[] = historyJson ? JSON.parse(historyJson) : [];

            // Remove duplicate if exists
            history = history.filter(d => d.id !== device.id);

            // Add to beginning
            history.unshift(device);

            // Keep only last 10 devices
            if (history.length > 10) {
                history = history.slice(0, 10);
            }

            await AsyncStorage.setItem(DEVICE_HISTORY_KEY, JSON.stringify(history));
            console.log('[Storage] Device added to history:', device.name);
        } catch (error) {
            console.error('[Storage] Failed to add device to history:', error);
        }
    }

    // Lấy danh sách devices đã kết nối
    static async getDeviceHistory(): Promise<WearableDevice[]> {
        try {
            const historyJson = await AsyncStorage.getItem(DEVICE_HISTORY_KEY);
            if (historyJson) {
                const history = JSON.parse(historyJson);
                console.log('[Storage] Retrieved device history:', history.length);
                return history;
            }
            return [];
        } catch (error) {
            console.error('[Storage] Failed to get device history:', error);
            return [];
        }
    }

    // Xóa device khỏi lịch sử
    static async removeFromDeviceHistory(deviceId: string): Promise<void> {
        try {
            const historyJson = await AsyncStorage.getItem(DEVICE_HISTORY_KEY);
            if (historyJson) {
                let history: WearableDevice[] = JSON.parse(historyJson);
                history = history.filter(d => d.id !== deviceId);
                await AsyncStorage.setItem(DEVICE_HISTORY_KEY, JSON.stringify(history));
                console.log('[Storage] Device removed from history:', deviceId);
            }
        } catch (error) {
            console.error('[Storage] Failed to remove device from history:', error);
        }
    }
}
