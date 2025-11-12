// BLE Debug Utilities
import { Buffer } from 'buffer';
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
    // Standard BLE Services
    BATTERY: '0000180F-0000-1000-8000-00805f9b34fb',
    HEART_RATE: '0000180D-0000-1000-8000-00805f9b34fb',
    DEVICE_INFO: '0000180A-0000-1000-8000-00805f9b34fb',
    CURRENT_TIME: '00001805-0000-1000-8000-00805f9b34fb',
    ALERT_NOTIFICATION: '00001811-0000-1000-8000-00805f9b34fb',
    FITNESS_MACHINE: '00001826-0000-1000-8000-00805f9b34fb',

    // ESP32 Custom Services
    USER_PROFILE: '0000181C-0000-1000-8000-00805F9B34FB',
    HEALTH_DATA: '0000180D-0000-1000-8000-00805F9B34FB',
};

/**
 * Common Bluetooth Characteristic UUIDs
 */
export const STANDARD_CHARACTERISTICS = {
    // Standard
    BATTERY_LEVEL: '00002A19-0000-1000-8000-00805f9b34fb',
    HEART_RATE_MEASUREMENT: '00002A37-0000-1000-8000-00805f9b34fb',
    MANUFACTURER_NAME: '00002A29-0000-1000-8000-00805f9b34fb',
    MODEL_NUMBER: '00002A24-0000-1000-8000-00805f9b34fb',
    FIRMWARE_REVISION: '00002A26-0000-1000-8000-00805f9b34fb',
    HARDWARE_REVISION: '00002A27-0000-1000-8000-00805f9b34fb',

    // ESP32 User Profile
    WEIGHT: '00002A98-0000-1000-8000-00805F9B34FB',
    HEIGHT: '00002A8E-0000-1000-8000-00805F9B34FB',
    GENDER: '00002A8C-0000-1000-8000-00805F9B34FB',
    AGE: '00002A80-0000-1000-8000-00805F9B34FB',

    // ESP32 Health Data
    HEALTH_DATA_BATCH: '00002A37-0000-1000-8000-00805F9B34FB',
    DEVICE_STATUS: '00002A19-0000-1000-8000-00805F9B34FB',
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

/**
 * Parse health data JSON from ESP32
 * Handles incomplete JSON and chunked data
 */
export function parseHealthDataJSON(base64Value: string): any {
    try {
        // Validate input
        if (!base64Value || base64Value.length === 0) {
            console.warn('[BLE] Received empty base64 value');
            return null;
        }

        const jsonString = Buffer.from(base64Value, 'base64').toString('utf-8');

        // Debug: log raw data
        console.log('[BLE DEBUG] Raw base64 length:', base64Value.length);
        console.log('[BLE DEBUG] Raw base64:', base64Value);
        console.log('[BLE DEBUG] Decoded string:', jsonString);
        console.log('[BLE DEBUG] String length:', jsonString.length);

        // Check if string is empty or incomplete
        const trimmed = jsonString.trim();
        if (!trimmed || trimmed.length === 0) {
            console.warn('[BLE] Received empty data after trimming, skipping...');
            return null;
        }

        // Check if it looks like valid JSON (starts with { and ends with })
        if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
            console.warn('[BLE] Data does not look like complete JSON:', trimmed);
            return null;
        }

        // Try to parse JSON
        const data = JSON.parse(trimmed);

        // Validate that we got the expected fields
        if (typeof data !== 'object' || data === null) {
            console.warn('[BLE] Parsed data is not an object:', data);
            return null;
        }

        console.log('[BLE DEBUG] Successfully parsed:', data);

        // ESP32 sends: {hr, spo2, steps, cal, ts, alert (optional)}
        // Map to our app's format
        return {
            heartRate: data.hr || 0,
            spo2: data.spo2 || 0,
            steps: data.steps || 0,
            calories: data.cal || data.calories || 0,  // ESP32 uses "cal" not "calories"
            alertScore: data.alert !== undefined ? data.alert : null,  // ESP32 uses "alert" not "alert_score"
        };
    } catch (error) {
        console.error('[BLE] Parse health data error:', error);
        try {
            const decoded = Buffer.from(base64Value, 'base64').toString('utf-8');
            console.error('[BLE] Failed string (length=' + decoded.length + '):', decoded);
            console.error('[BLE] Failed string (hex):', Buffer.from(base64Value, 'base64').toString('hex'));
        } catch (e) {
            console.error('[BLE] Could not decode failed value');
        }
        return null;
    }
}

/**
 * Encode user profile data for ESP32
 */
export function encodeUserProfile(height: number, weight: number, age: number, gender: number): {
    weight: string;
    height: string;
    gender: string;
    age: string;
} {
    // Weight: uint16 in kg
    const weightBuffer = Buffer.alloc(2);
    weightBuffer.writeUInt16LE(Math.round(weight), 0);

    // Height: uint16 in cm
    const heightBuffer = Buffer.alloc(2);
    heightBuffer.writeUInt16LE(Math.round(height * 100), 0);

    // Gender: uint8 (0=male, 1=female)
    const genderBuffer = Buffer.alloc(1);
    genderBuffer.writeUInt8(gender, 0);

    // Age: uint8
    const ageBuffer = Buffer.alloc(1);
    ageBuffer.writeUInt8(age, 0);

    return {
        weight: weightBuffer.toString('base64'),
        height: heightBuffer.toString('base64'),
        gender: genderBuffer.toString('base64'),
        age: ageBuffer.toString('base64'),
    };
}
