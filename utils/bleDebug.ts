// BLE Debug Utilities - Binary Protocol Parser
import { Buffer } from 'buffer';
import { BleManager } from 'react-native-ble-plx';
import { BLEBatchData, BLEHealthData } from '../types';

const bleManager = new BleManager();

// Constants for packet sizes
const HEALTH_PACKET_SIZE = 8;        // Basic HealthDataPacket (timestamp:4 + steps:2 + hr:1 + spo2:1)
const HEALTH_PACKET_WITH_ALERT = 12; // HealthDataPacket (8 bytes) + AlertScore (float, 4 bytes)

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
 * Common Bluetooth Service UUIDs (Last Dance Project)
 */
export const STANDARD_SERVICES = {
    // Last Dance Services
    USER_PROFILE: '0000181C-0000-1000-8000-00805F9B34FB',  // Config & Time Sync
    HEALTH_DATA: '0000180D-0000-1000-8000-00805F9B34FB',   // Health Data Stream
    BATTERY: '0000180F-0000-1000-8000-00805F9B34FB',       // Battery Level
};

/**
 * Common Bluetooth Characteristic UUIDs (Last Dance Project)
 */
export const STANDARD_CHARACTERISTICS = {
    // User Profile Service Characteristics
    TIME_SYNC: '00002A2B-0000-1000-8000-00805F9B34FB',     // Write: uint32 (Unix Timestamp)
    DATA_MODE: '00002A9A-0000-1000-8000-00805F9B34FB',     // R/W: uint8 (0=Realtime, 1=Batch)
    BMI: '00002A98-0000-1000-8000-00805F9B34FB',           // R/W: float (BMI value)
    STEP_ENABLE: '00002A81-0000-1000-8000-00805F9B34FB',   // R/W: uint8 (0=Off, 1=On)
    ML_ENABLE: '00002A99-0000-1000-8000-00805F9B34FB',     // R/W: uint8 (0=Off, 1=On)

    // Health Data Service Characteristics
    HEALTH_DATA: '00002A37-0000-1000-8000-00805F9B34FB',   // Notify: Binary packets

    // Battery Service Characteristics
    BATTERY_LEVEL: '00002A19-0000-1000-8000-00805F9B34FB', // Read/Notify: uint8 (0-100%)
};

/**
 * Parse battery level from characteristic value
 */
export function parseBatteryLevel(base64Value: string): number {
    const buffer = Buffer.from(base64Value, 'base64');
    return buffer.readUInt8(0);
}

/**
 * Parse a single HealthDataPacket (8 bytes) - Little Endian
 * 
 * Packet structure:
 * - Offset 0-3: timestamp (uint32) - Unix Timestamp
 * - Offset 4-5: steps (uint16) - Total step count
 * - Offset 6: hr (uint8) - Heart rate in BPM
 * - Offset 7: spo2 (uint8) - SpO2 percentage
 * 
 * @param buffer - Buffer containing exactly 8 bytes
 * @returns Parsed health data (without alertScore)
 */
export function parseHealthDataPacket(buffer: Buffer): Omit<BLEHealthData, 'alertScore' | 'timestampISO'> {
    if (buffer.length < HEALTH_PACKET_SIZE) {
        throw new Error(`Invalid packet size: ${buffer.length}, expected ${HEALTH_PACKET_SIZE}`);
    }

    const timestamp = buffer.readUInt32LE(0);
    const steps = buffer.readUInt16LE(4);
    const heartRate = buffer.readUInt8(6);
    const spo2 = buffer.readUInt8(7);

    return {
        timestamp,
        steps,
        heartRate,
        spo2,
    };
}

/**
 * Parse health data from BLE notification (base64 encoded)
 * Handles 3 cases:
 * 1. 8 bytes: Normal packet (HealthDataPacket)
 * 2. 12 bytes: Packet with alert (HealthDataPacket + float AlertScore)
 * 3. N*8 bytes: Batch data (multiple HealthDataPackets)
 * 
 * @param base64Value - Base64 encoded binary data from BLE
 * @returns Parsed data with appropriate type
 */
export function parseHealthDataNotification(base64Value: string): {
    type: 'single' | 'alert' | 'batch';
    data: BLEHealthData | BLEBatchData;
} | null {
    try {
        if (!base64Value || base64Value.length === 0) {
            console.warn('[BLE] Received empty base64 value');
            return null;
        }

        const buffer = Buffer.from(base64Value, 'base64');
        const length = buffer.length;

        console.log(`[BLE] Received ${length} bytes`);

        // Case 1: Single packet (8 bytes)
        if (length === HEALTH_PACKET_SIZE) {
            const packet = parseHealthDataPacket(buffer);
            const healthData: BLEHealthData = {
                ...packet,
                alertScore: null,
                timestampISO: new Date(packet.timestamp * 1000).toISOString(),
            };
            console.log('[BLE] ❤️ Parsed single packet:', healthData);
            return { type: 'single', data: healthData };
        }

        // Case 2: Packet with alert (12 bytes)
        if (length === HEALTH_PACKET_WITH_ALERT) {
            const packet = parseHealthDataPacket(buffer);
            const alertScore = buffer.readFloatLE(8);

            const healthData: BLEHealthData = {
                ...packet,
                alertScore,
                timestampISO: new Date(packet.timestamp * 1000).toISOString(),
            };
            console.log('[BLE] 🚨 Parsed alert packet:', healthData);
            return { type: 'alert', data: healthData };
        }

        // Case 3: Batch data (N * 8 bytes)
        if (length % HEALTH_PACKET_SIZE === 0) {
            const count = length / HEALTH_PACKET_SIZE;
            const packets: BLEHealthData[] = [];

            for (let i = 0; i < count; i++) {
                const offset = i * HEALTH_PACKET_SIZE;
                const packetBuffer = buffer.subarray(offset, offset + HEALTH_PACKET_SIZE);
                const packet = parseHealthDataPacket(packetBuffer);

                packets.push({
                    ...packet,
                    alertScore: null,
                    timestampISO: new Date(packet.timestamp * 1000).toISOString(),
                });
            }

            const batchData: BLEBatchData = {
                packets,
                count,
            };

            console.log('[BLE] 📊 Parsed batch data:', count, 'packets');
            return { type: 'batch', data: batchData };
        }

        // Invalid packet size
        console.error('[BLE] Invalid packet size:', length);
        return null;

    } catch (error) {
        console.error('[BLE] Parse error:', error);
        return null;
    }
}

/**
 * Encode Unix timestamp for Time Sync (uint32, Little Endian)
 * @param timestamp - Unix timestamp in seconds (or Date object)
 * @returns Base64 encoded string
 */
export function encodeTimeSync(timestamp?: number | Date): string {
    let unixTime: number;

    if (timestamp instanceof Date) {
        unixTime = Math.floor(timestamp.getTime() / 1000);
    } else if (typeof timestamp === 'number') {
        unixTime = timestamp;
    } else {
        unixTime = Math.floor(Date.now() / 1000);
    }

    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(unixTime, 0);
    return buffer.toString('base64');
}

/**
 * Encode BMI value (float, Little Endian)
 * @param bmi - BMI value (e.g., 22.5)
 * @returns Base64 encoded string
 */
export function encodeBMI(bmi: number): string {
    const buffer = Buffer.alloc(4);
    buffer.writeFloatLE(bmi, 0);
    return buffer.toString('base64');
}

/**
 * Encode uint8 value (Data Mode, Step Enable, ML Enable)
 * @param value - Value to encode (0 or 1)
 * @returns Base64 encoded string
 */
export function encodeUInt8(value: number): string {
    const buffer = Buffer.alloc(1);
    buffer.writeUInt8(value, 0);
    return buffer.toString('base64');
}

/**
 * Encode config values for writing to device
 * @param bmi - BMI value
 * @param dataMode - 0: Realtime, 1: Batch
 * @param stepEnable - 0: Off, 1: On
 * @param mlEnable - 0: Off, 1: On
 * @returns Object with base64 encoded values
 */
export function encodeUserProfile(
    bmi: number,
    dataMode: number,
    stepEnable: number,
    mlEnable: number
): {
    bmi: string;
    dataMode: string;
    stepEnable: string;
    mlEnable: string;
} {
    return {
        bmi: encodeBMI(bmi),
        dataMode: encodeUInt8(dataMode),
        stepEnable: encodeUInt8(stepEnable),
        mlEnable: encodeUInt8(mlEnable),
    };
}
