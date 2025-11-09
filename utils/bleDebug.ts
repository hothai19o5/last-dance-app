// BLE Debug Utilities
import { BleManager } from 'react-native-ble-plx';

const bleManager = new BleManager();

/**
 * List all services and characteristics of a connected device
 * Useful for discovering UUIDs
 */
export async function debugDeviceServices(deviceId: string): Promise<void> {
    try {
        console.log('=== DEBUG: Device Services ===');
        console.log('Device ID:', deviceId);

        const device = await bleManager.connectToDevice(deviceId);
        await device.discoverAllServicesAndCharacteristics();

        const services = await device.services();

        for (const service of services) {
            console.log('\n📦 Service:', service.uuid);
            console.log('  - Is Primary:', service.isPrimary);

            const characteristics = await service.characteristics();

            for (const char of characteristics) {
                console.log('  📝 Characteristic:', char.uuid);
                console.log('    - Can Read:', char.isReadable);
                console.log('    - Can Write:', char.isWritableWithResponse || char.isWritableWithoutResponse);
                console.log('    - Can Notify:', char.isNotifiable);
                console.log('    - Can Indicate:', char.isIndicatable);

                // Try to read if readable
                if (char.isReadable) {
                    try {
                        const value = await char.read();
                        console.log('    - Value (base64):', value.value);
                        if (value.value) {
                            const decoded = Buffer.from(value.value, 'base64').toString('hex');
                            console.log('    - Value (hex):', decoded);
                        }
                    } catch (error) {
                        console.log('    - Could not read value:', error);
                    }
                }
            }
        }

        console.log('\n=== END DEBUG ===');
    } catch (error) {
        console.error('Debug error:', error);
    }
}

/**
 * Monitor a specific characteristic for changes
 */
export function monitorCharacteristic(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    onData: (data: string) => void
): () => void {
    const subscription = bleManager.monitorCharacteristicForDevice(
        deviceId,
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
            if (error) {
                console.error('Monitor error:', error);
                return;
            }

            if (characteristic?.value) {
                const data = Buffer.from(characteristic.value, 'base64').toString('utf-8');
                console.log('📡 Received data:', data);
                onData(data);
            }
        }
    );

    // Return cleanup function
    return () => {
        subscription.remove();
    };
}

/**
 * Common Bluetooth Service UUIDs
 */
export const STANDARD_SERVICES = {
    BATTERY: '0000180F-0000-1000-8000-00805f9b34fb',
    HEART_RATE: '0000180D-0000-1000-8000-00805f9b34fb',
    DEVICE_INFO: '0000180A-0000-1000-8000-00805f9b34fb',
    CURRENT_TIME: '00001805-0000-1000-8000-00805f9b34fb',
    ALERT_NOTIFICATION: '00001811-0000-1000-8000-00805f9b34fb',
    FITNESS_MACHINE: '00001826-0000-1000-8000-00805f9b34fb',
};

/**
 * Common Bluetooth Characteristic UUIDs
 */
export const STANDARD_CHARACTERISTICS = {
    BATTERY_LEVEL: '00002A19-0000-1000-8000-00805f9b34fb',
    HEART_RATE_MEASUREMENT: '00002A37-0000-1000-8000-00805f9b34fb',
    MANUFACTURER_NAME: '00002A29-0000-1000-8000-00805f9b34fb',
    MODEL_NUMBER: '00002A24-0000-1000-8000-00805f9b34fb',
    FIRMWARE_REVISION: '00002A26-0000-1000-8000-00805f9b34fb',
    HARDWARE_REVISION: '00002A27-0000-1000-8000-00805f9b34fb',
};

/**
 * Parse battery level from characteristic value
 */
export function parseBatteryLevel(base64Value: string): number {
    const buffer = Buffer.from(base64Value, 'base64');
    return buffer.readUInt8(0);
}

/**
 * Parse heart rate from characteristic value
 */
export function parseHeartRate(base64Value: string): number {
    const buffer = Buffer.from(base64Value, 'base64');
    const flags = buffer.readUInt8(0);

    // Check if heart rate is 16-bit
    if (flags & 0x01) {
        return buffer.readUInt16LE(1);
    } else {
        return buffer.readUInt8(1);
    }
}
