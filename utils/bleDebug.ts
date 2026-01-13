// BLE Debug Utilities - Binary Protocol Parser
import { Buffer } from 'buffer';
import { BleManager } from 'react-native-ble-plx';
import { BLEBatchData, BLEHealthData } from '../types';

const bleManager = new BleManager();

// Constants for packet sizes
// UNIFIED: Only one packet type - HealthDataPacket (18 bytes)
const HEALTH_PACKET_SIZE = 18;       // HealthDataPacket: timestamp(4) + steps(2) + hr(1) + spo2(1) + alertScore(4) + activityStatus(1) + sleepDuration(2) + reserved(3)
const BATCH_HEADER_SIZE = 4;         // Batch chunk header: chunkIndex(1) + totalChunks(1) + totalPackets(2)

// Batch chunk accumulator for reassembly
interface BatchChunkState {
    totalChunks: number;
    totalPackets: number;
    receivedChunks: Map<number, BLEHealthData[]>;
    lastReceiveTime: number;
}

let batchChunkState: BatchChunkState | null = null;
const BATCH_TIMEOUT_MS = 10000; // 10 seconds timeout for batch reassembly

/**
 * Helper functions to read from Uint8Array/Buffer (Little Endian)
 * React Native's buffer.subarray() returns Uint8Array which doesn't have readUInt32LE etc.
 */
function readUInt32LE(buffer: Uint8Array | Buffer, offset: number): number {
    return (
        buffer[offset] |
        (buffer[offset + 1] << 8) |
        (buffer[offset + 2] << 16) |
        (buffer[offset + 3] << 24)
    ) >>> 0; // Convert to unsigned
}

function readUInt16LE(buffer: Uint8Array | Buffer, offset: number): number {
    return buffer[offset] | (buffer[offset + 1] << 8);
}

function readUInt8(buffer: Uint8Array | Buffer, offset: number): number {
    return buffer[offset];
}

function readFloatLE(buffer: Uint8Array | Buffer, offset: number): number {
    const bytes = new Uint8Array([
        buffer[offset],
        buffer[offset + 1],
        buffer[offset + 2],
        buffer[offset + 3]
    ]);
    const view = new DataView(bytes.buffer);
    return view.getFloat32(0, true); // true = little endian
}

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
            console.log('\nService:', service.uuid);
            console.log('  - Is Primary:', service.isPrimary);

            const characteristics = await service.characteristics();

            for (const char of characteristics) {
                console.log('  Characteristic:', char.uuid);
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
                console.log('Received data:', data);
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
 * Parse a single HealthDataPacket (18 bytes) - Little Endian
 * 
 * UNIFIED Packet structure (18 bytes):
 * - Offset 0-3: timestamp (uint32) - Unix Timestamp
 * - Offset 4-5: steps (uint16) - Total step count
 * - Offset 6: hr (uint8) - Heart rate in BPM
 * - Offset 7: spo2 (uint8) - SpO2 percentage
 * - Offset 8-11: alertScore (float) - ML alert score (0.0-1.0)
 * - Offset 12: activityStatus (uint8) - Activity (0=Still, 1=Walking, 2=Running, 3=Sleeping)
 * - Offset 13-14: sleepDurationMinutes (uint16) - Sleep duration in minutes
 * - Offset 15-17: reserved (3 bytes)
 * 
 * @param buffer - Buffer containing exactly 18 bytes
 * @returns Parsed health data
 */
export function parseHealthDataPacket(buffer: Uint8Array | Buffer): BLEHealthData {
    if (buffer.length < HEALTH_PACKET_SIZE) {
        throw new Error(`Invalid packet size: ${buffer.length}, expected ${HEALTH_PACKET_SIZE}`);
    }

    const timestamp = readUInt32LE(buffer, 0);
    const steps = readUInt16LE(buffer, 4);
    const heartRate = readUInt8(buffer, 6);
    const spo2 = readUInt8(buffer, 7);
    const alertScore = readFloatLE(buffer, 8);
    const activityStatus = readUInt8(buffer, 12);
    const sleepDurationMinutes = readUInt16LE(buffer, 13);

    return {
        timestamp,
        steps,
        heartRate,
        spo2,
        alertScore,
        activityStatus: activityStatus as 0 | 1 | 2 | 3,
        sleepDurationMinutes,
        timestampISO: new Date(timestamp * 1000).toISOString(),
    };
}

/**
 * Parse health data from BLE notification (base64 encoded)
 * 
 * UNIFIED: Device always sends 18-byte HealthDataPacket
 * - Single packet: 18 bytes
 * - Batch: Header (4 bytes) + N * 18 bytes
 * 
 * @param base64Value - Base64 encoded binary data from BLE
 * @returns Parsed data with appropriate type
 */
export function parseHealthDataNotification(base64Value: string): {
    type: 'single' | 'batch';
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

        // Case 1: Single packet (18 bytes)
        if (length === HEALTH_PACKET_SIZE) {
            const healthData = parseHealthDataPacket(buffer);
            console.log('[BLE] Parsed single packet:', healthData);
            return { type: 'single', data: healthData };
        }

        // Case 2: Chunked batch data with header
        // Format: [chunkIndex(1), totalChunks(1), totalPackets(2)] + N * 18 bytes
        const dataLengthAfterHeader = length - BATCH_HEADER_SIZE;
        if (length > BATCH_HEADER_SIZE && dataLengthAfterHeader % HEALTH_PACKET_SIZE === 0) {
            // Parse header
            const chunkIndex = readUInt8(buffer, 0);
            const totalChunks = readUInt8(buffer, 1);
            const totalPackets = readUInt16LE(buffer, 2);
            const packetsInChunk = dataLengthAfterHeader / HEALTH_PACKET_SIZE;

            console.log(`[BLE] Received chunk ${chunkIndex + 1}/${totalChunks} with ${packetsInChunk} packets (total: ${totalPackets})`);

            // Parse packets in this chunk
            const chunkPackets: BLEHealthData[] = [];
            for (let i = 0; i < packetsInChunk; i++) {
                const offset = BATCH_HEADER_SIZE + i * HEALTH_PACKET_SIZE;
                const packetBuffer = buffer.subarray(offset, offset + HEALTH_PACKET_SIZE);
                const healthData = parseHealthDataPacket(packetBuffer);
                chunkPackets.push(healthData);
            }

            // Initialize or reset state if needed
            const now = Date.now();
            if (!batchChunkState ||
                batchChunkState.totalPackets !== totalPackets ||
                now - batchChunkState.lastReceiveTime > BATCH_TIMEOUT_MS) {
                batchChunkState = {
                    totalChunks,
                    totalPackets,
                    receivedChunks: new Map(),
                    lastReceiveTime: now,
                };
            }

            // Store this chunk
            batchChunkState.receivedChunks.set(chunkIndex, chunkPackets);
            batchChunkState.lastReceiveTime = now;

            // Check if all chunks received
            if (batchChunkState.receivedChunks.size === totalChunks) {
                console.log(`[BLE] All ${totalChunks} chunks received, reassembling...`);

                // Reassemble in order
                const allPackets: BLEHealthData[] = [];
                for (let i = 0; i < totalChunks; i++) {
                    const chunk = batchChunkState.receivedChunks.get(i);
                    if (chunk) {
                        allPackets.push(...chunk);
                    }
                }

                const batchData: BLEBatchData = {
                    packets: allPackets,
                    count: allPackets.length,
                };

                console.log(`[BLE] Reassembled batch: ${allPackets.length} packets`);

                // Reset state
                batchChunkState = null;

                return { type: 'batch', data: batchData };
            } else {
                console.log(`[BLE] Waiting for more chunks: ${batchChunkState.receivedChunks.size}/${totalChunks}`);
                // Return null to indicate we're still accumulating
                return null;
            }
        }

        // Case 3: Legacy batch data (N * 18 bytes without header) - for backward compatibility
        if (length % HEALTH_PACKET_SIZE === 0 && length > HEALTH_PACKET_SIZE) {
            const count = length / HEALTH_PACKET_SIZE;
            const packets: BLEHealthData[] = [];

            console.log(`[BLE] Parsing legacy batch: ${count} packets (${length} bytes total)`);

            for (let i = 0; i < count; i++) {
                const offset = i * HEALTH_PACKET_SIZE;
                const packetBuffer = buffer.subarray(offset, offset + HEALTH_PACKET_SIZE);
                const healthData = parseHealthDataPacket(packetBuffer);
                packets.push(healthData);
            }

            const batchData: BLEBatchData = {
                packets,
                count,
            };

            console.log('[BLE] Parsed legacy batch data:', count, 'packets');
            return { type: 'batch', data: batchData };
        }

        // Case 4: Batch chunk with incomplete data due to MTU limitation
        // If we have header and at least one complete packet, parse what we can
        if (length > BATCH_HEADER_SIZE + HEALTH_PACKET_SIZE) {
            const dataLength = length - BATCH_HEADER_SIZE;
            const completePackets = Math.floor(dataLength / HEALTH_PACKET_SIZE);
            const remainingBytes = dataLength % HEALTH_PACKET_SIZE;

            if (completePackets > 0) {
                // Parse header
                const chunkIndex = readUInt8(buffer, 0);
                const totalChunks = readUInt8(buffer, 1);
                const totalPackets = readUInt16LE(buffer, 2);

                console.warn(`[BLE] Received truncated chunk: ${length} bytes, parsing ${completePackets} complete packets (${remainingBytes} bytes discarded)`);
                console.log(`[BLE] Chunk ${chunkIndex + 1}/${totalChunks}, expected total: ${totalPackets} packets`);

                // Parse complete packets only
                const chunkPackets: BLEHealthData[] = [];
                for (let i = 0; i < completePackets; i++) {
                    const offset = BATCH_HEADER_SIZE + i * HEALTH_PACKET_SIZE;
                    const packetBuffer = buffer.subarray(offset, offset + HEALTH_PACKET_SIZE);
                    const healthData = parseHealthDataPacket(packetBuffer);
                    chunkPackets.push(healthData);
                }

                // Initialize or reset state if needed
                const now = Date.now();
                if (!batchChunkState ||
                    batchChunkState.totalPackets !== totalPackets ||
                    now - batchChunkState.lastReceiveTime > BATCH_TIMEOUT_MS) {
                    batchChunkState = {
                        totalChunks,
                        totalPackets,
                        receivedChunks: new Map(),
                        lastReceiveTime: now,
                    };
                }

                // Store this chunk (with partial data)
                batchChunkState.receivedChunks.set(chunkIndex, chunkPackets);
                batchChunkState.lastReceiveTime = now;

                // Check if all chunks received
                if (batchChunkState.receivedChunks.size === totalChunks) {
                    console.log(`[BLE] All ${totalChunks} chunks received (some may be truncated), reassembling...`);

                    // Reassemble in order
                    const allPackets: BLEHealthData[] = [];
                    for (let i = 0; i < totalChunks; i++) {
                        const chunk = batchChunkState.receivedChunks.get(i);
                        if (chunk) {
                            allPackets.push(...chunk);
                        }
                    }

                    const batchData: BLEBatchData = {
                        packets: allPackets,
                        count: allPackets.length,
                    };

                    console.log(`[BLE] Reassembled batch: ${allPackets.length}/${totalPackets} packets recovered`);

                    // Reset state
                    batchChunkState = null;

                    return { type: 'batch', data: batchData };
                } else {
                    console.log(`[BLE] Waiting for more chunks: ${batchChunkState.receivedChunks.size}/${totalChunks}`);
                    return null;
                }
            }
        }

        // Invalid packet size - can't parse
        console.error('[BLE] Invalid packet size:', length, 'bytes. Expected 18 (single), 4+N*18 (batch chunk), or N*18 (legacy batch)');
        console.error('[BLE] Data (hex):', buffer.toString('hex').substring(0, 40) + '...');
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
