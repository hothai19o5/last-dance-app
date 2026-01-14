// BLE Service - Real Implementation using react-native-ble-plx
// Binary Protocol based on Last Dance Project Specification
import { Buffer } from 'buffer';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, State } from 'react-native-ble-plx';
import { BLEBatchData, BLEConfig, BLEDevice, BLEHealthData } from '../types';
import {
  encodeTimeSync,
  encodeUserProfile,
  parseHealthDataNotification,
  STANDARD_CHARACTERISTICS,
  STANDARD_SERVICES
} from '../utils/bleDebug';

const bleManager = new BleManager();

// Service UUIDs (matching Last Dance device)
const USER_PROFILE_SERVICE_UUID = STANDARD_SERVICES.USER_PROFILE;
const HEALTH_DATA_SERVICE_UUID = STANDARD_SERVICES.HEALTH_DATA;
const BATTERY_SERVICE_UUID = STANDARD_SERVICES.BATTERY;

// User Profile Service Characteristics
const TIME_SYNC_CHAR_UUID = STANDARD_CHARACTERISTICS.TIME_SYNC;
const DATA_MODE_CHAR_UUID = STANDARD_CHARACTERISTICS.DATA_MODE;
const BMI_CHAR_UUID = STANDARD_CHARACTERISTICS.BMI;
const STEP_ENABLE_CHAR_UUID = STANDARD_CHARACTERISTICS.STEP_ENABLE;
const ML_ENABLE_CHAR_UUID = STANDARD_CHARACTERISTICS.ML_ENABLE;

// Health Data Service Characteristics
const HEALTH_DATA_CHAR_UUID = STANDARD_CHARACTERISTICS.HEALTH_DATA;

// Battery Service Characteristics
const BATTERY_LEVEL_CHAR_UUID = STANDARD_CHARACTERISTICS.BATTERY_LEVEL;

// MTU size requirement
const REQUIRED_MTU = 512;

// Callback types for data received
export type OnHealthDataCallback = (data: BLEHealthData) => void;
export type OnBatchDataCallback = (data: BLEBatchData) => void;
export type OnBatteryCallback = (level: number) => void;

export class BLEService {
  // Request BLE permissions (Android)
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 31) {
          // Android 12+ requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);

          return (
            granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
          );
        } else {
          // Android < 12
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (error) {
        console.error('[BLE] Permission request error:', error);
        return false;
      }
    }
    // iOS permissions are handled automatically
    return true;
  }

  // Check if Bluetooth is enabled
  static async checkBluetoothState(): Promise<boolean> {
    const state = await bleManager.state();
    return state === State.PoweredOn;
  }

  static async scanForDevices(
    onDeviceFound: (device: BLEDevice) => void,
    durationMs: number = 10000
  ): Promise<void> {
    console.log('[BLE] Starting device scan...');

    try {
      // Check permissions first
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted');
      }

      // Check Bluetooth state
      const isEnabled = await this.checkBluetoothState();
      if (!isEnabled) {
        throw new Error('Bluetooth is not enabled');
      }

      const foundDevices = new Set<string>();

      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('[BLE] Scan error:', error);
          return;
        }

        if (device && device.name && !foundDevices.has(device.id)) {
          foundDevices.add(device.id);
          console.log('[BLE] Found device:', device.name, device.id);

          onDeviceFound({
            id: device.id,
            name: device.name,
            rssi: device.rssi || -100,
          });
        }
      });

      // Stop scan after duration
      setTimeout(() => {
        bleManager.stopDeviceScan();
        console.log('[BLE] Scan stopped');
      }, durationMs);
    } catch (error) {
      console.error('[BLE] Scan initialization error:', error);
      throw error;
    }
  }

  static async stopScan(): Promise<void> {
    console.log('[BLE] Stopping device scan...');
    bleManager.stopDeviceScan();
  }

  static async connectToDevice(deviceId: string): Promise<boolean> {
    console.log('[BLE] Connecting to device:', deviceId);

    try {
      // CRITICAL: Check permissions before connecting
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.error('[BLE] Bluetooth permissions not granted');
        return false;
      }

      // Check Bluetooth state
      const isEnabled = await this.checkBluetoothState();
      if (!isEnabled) {
        console.error('[BLE] Bluetooth is not enabled');
        return false;
      }

      const device = await bleManager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();

      // CRITICAL: Request MTU 512 bytes (required for batch data)
      if (Platform.OS === 'android') {
        try {
          const deviceWithMtu = await device.requestMTU(REQUIRED_MTU);
          const mtu = deviceWithMtu.mtu || 23;
          console.log(`[BLE] MTU set to: ${mtu} bytes`);
        } catch (mtuError) {
          console.warn('[BLE] MTU request failed:', mtuError);
        }
      }

      console.log('[BLE] Connected successfully to:', deviceId);
      return true;
    } catch (error) {
      console.error('[BLE] Connection failed:', error);
      return false;
    }
  }

  /**
   * Sync time with device (MANDATORY before receiving data)
   * Write current Unix timestamp to Time Sync characteristic
   */
  static async syncTime(deviceId: string, timestamp?: number | Date): Promise<boolean> {
    console.log('[BLE] Syncing time with device...');

    try {
      const encodedTime = encodeTimeSync(timestamp);

      await bleManager.writeCharacteristicWithResponseForDevice(
        deviceId,
        USER_PROFILE_SERVICE_UUID,
        TIME_SYNC_CHAR_UUID,
        encodedTime
      );

      const unixTime = timestamp
        ? (timestamp instanceof Date ? Math.floor(timestamp.getTime() / 1000) : timestamp)
        : Math.floor(Date.now() / 1000);

      console.log('[BLE] Time synced:', new Date(unixTime * 1000).toISOString());
      return true;
    } catch (error) {
      console.error('[BLE] Time sync error:', error);
      return false;
    }
  }

  static async disconnectDevice(deviceId: string): Promise<void> {
    console.log('[BLE] Disconnecting device:', deviceId);
    try {
      await bleManager.cancelDeviceConnection(deviceId);
      console.log('[BLE] Disconnected successfully');
    } catch (error) {
      console.error('[BLE] Disconnect error:', error);
    }
  }

  static async isDeviceConnected(deviceId: string): Promise<boolean> {
    try {
      // Check Bluetooth state first to avoid crash
      const isEnabled = await this.checkBluetoothState();
      if (!isEnabled) {
        return false;
      }

      const device = await bleManager.devices([deviceId]);
      if (device.length > 0) {
        const isConnected = await device[0].isConnected();
        return isConnected;
      }
      return false;
    } catch (error) {
      console.error('[BLE] Error checking connection status:', error);
      return false;
    }
  }

  static async writeConfig(deviceId: string, config: BLEConfig): Promise<boolean> {
    console.log('[BLE] Writing config to device:', deviceId, config);

    try {
      // Encode user profile data using helper function
      const encoded = encodeUserProfile(
        config.bmi,
        config.dataMode,
        config.stepEnable,
        config.mlEnable
      );

      // Write BMI
      await bleManager.writeCharacteristicWithResponseForDevice(
        deviceId,
        USER_PROFILE_SERVICE_UUID,
        BMI_CHAR_UUID,
        encoded.bmi
      );

      // Write Data Mode (0: Realtime, 1: Batch)
      await bleManager.writeCharacteristicWithResponseForDevice(
        deviceId,
        USER_PROFILE_SERVICE_UUID,
        DATA_MODE_CHAR_UUID,
        encoded.dataMode
      );

      // Write Step Enable
      await bleManager.writeCharacteristicWithResponseForDevice(
        deviceId,
        USER_PROFILE_SERVICE_UUID,
        STEP_ENABLE_CHAR_UUID,
        encoded.stepEnable
      );

      // Write ML Enable
      await bleManager.writeCharacteristicWithResponseForDevice(
        deviceId,
        USER_PROFILE_SERVICE_UUID,
        ML_ENABLE_CHAR_UUID,
        encoded.mlEnable
      );

      console.log('[BLE] Config written successfully');
      return true;
    } catch (error) {
      console.error('[BLE] Write config error:', error);
      return false;
    }
  }

  static async syncData(deviceId: string): Promise<any> {
    console.log('[BLE] Syncing data from device:', deviceId);

    try {
      // Read Health Data (Binary format)
      const characteristic = await bleManager.readCharacteristicForDevice(
        deviceId,
        HEALTH_DATA_SERVICE_UUID,
        HEALTH_DATA_CHAR_UUID
      );

      if (characteristic.value) {
        // Use helper function to parse binary health data
        const parsed = parseHealthDataNotification(characteristic.value);

        if (parsed) {
          if (parsed.type === 'batch') {
            console.log('[BLE] Synced batch data:', (parsed.data as BLEBatchData).count, 'packets');
            // Return the first packet for display
            const batchData = parsed.data as BLEBatchData;
            if (batchData.packets.length > 0) {
              return batchData.packets[0];
            }
          } else {
            console.log('[BLE] Synced single data:', parsed.data);
            return parsed.data;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('[BLE] Sync data error:', error);
      return null;
    }
  }

  static async getBatteryLevel(deviceId: string): Promise<number> {
    console.log('[BLE] Getting battery level:', deviceId);

    try {
      const characteristic = await bleManager.readCharacteristicForDevice(
        deviceId,
        BATTERY_SERVICE_UUID,
        BATTERY_LEVEL_CHAR_UUID
      );

      if (characteristic.value) {
        const batteryData = Buffer.from(characteristic.value, 'base64');
        const batteryLevel = batteryData.readUInt8(0);
        console.log('[BLE] Battery level:', batteryLevel);
        return batteryLevel;
      }
      return -1;
    } catch (error) {
      console.error('[BLE] Battery read error:', error);
      return -1;
    }
  }

  // Subscribe to battery level notifications
  static async subscribeToBattery(
    deviceId: string,
    onBatteryReceived: OnBatteryCallback
  ): Promise<() => void> {
    console.log('[BLE] Subscribing to battery notifications...');

    try {
      const subscription = bleManager.monitorCharacteristicForDevice(
        deviceId,
        BATTERY_SERVICE_UUID,
        BATTERY_LEVEL_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('[BLE] Battery monitor error:', error);
            return;
          }

          if (characteristic?.value) {
            const batteryData = Buffer.from(characteristic.value, 'base64');
            const batteryLevel = batteryData.readUInt8(0);
            console.log('[BLE] Battery notification:', batteryLevel, '%');
            onBatteryReceived(batteryLevel);
          }
        }
      );

      console.log('[BLE] Successfully subscribed to battery');
      return () => {
        subscription.remove();
        console.log('[BLE] Unsubscribed from battery');
      };
    } catch (error) {
      console.error('[BLE] Battery subscribe error:', error);
      return () => { };
    }
  }

  // Subscribe to health data notifications (handles binary packets)
  static async subscribeToHealthData(
    deviceId: string,
    onDataReceived: OnHealthDataCallback,
    onBatchReceived?: OnBatchDataCallback
  ): Promise<() => void> {
    console.log('[BLE] Subscribing to health data notifications...');

    try {
      // Check if device is already connected
      const isAlreadyConnected = await bleManager.isDeviceConnected(deviceId);
      let device;

      if (!isAlreadyConnected) {
        console.log('[BLE] Device not connected, connecting first...');
        device = await bleManager.connectToDevice(deviceId);
        await device.discoverAllServicesAndCharacteristics();
      } else {
        console.log('[BLE] Device already connected, reusing connection');
        // Get device instance even if connected (needed for MTU request)
        const devices = await bleManager.connectedDevices([HEALTH_DATA_SERVICE_UUID]);
        device = devices.find(d => d.id === deviceId);
        if (!device) {
          // Fallback if not found in connected list
          device = await bleManager.connectToDevice(deviceId);
        }
      }

      // Request MTU if not already done (Android only)
      if (Platform.OS === 'android') {
        try {
          const deviceWithMtu = await device.requestMTU(REQUIRED_MTU);
          const mtu = deviceWithMtu.mtu || 23;
          console.log(`[BLE] MTU set to: ${mtu} bytes`);
          if (mtu < REQUIRED_MTU) {
            console.warn(`[BLE] MTU ${mtu} < ${REQUIRED_MTU}. Batch chunks may be truncated (max ~${Math.floor((mtu - 7) / 18)} packets per chunk)`);
          }
        } catch (error) {
          console.log('[BLE] MTU request skipped (may already be set)');
        }
      }

      // Small delay to ensure characteristics are ready
      await new Promise(resolve => setTimeout(resolve, 300));

      const subscription = bleManager.monitorCharacteristicForDevice(
        deviceId,
        HEALTH_DATA_SERVICE_UUID,
        HEALTH_DATA_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('[BLE] Monitor error:', error);
            return;
          }

          if (characteristic?.value) {
            // Parse binary data (18 bytes single or batch with header)
            const parsed = parseHealthDataNotification(characteristic.value);

            if (!parsed) {
              // null means we're waiting for more batch chunks
              console.log('[BLE] Waiting for more batch chunks...');
              return;
            }

            console.log('[BLE] Parsed type:', parsed.type);

            // Handle packet types (unified to 'single' and 'batch' only)
            if (parsed.type === 'single') {
              // Single packet (18 bytes)
              const healthData = parsed.data as BLEHealthData;
              console.log('[BLE] Calling onDataReceived with:', healthData);
              onDataReceived(healthData);
            } else if (parsed.type === 'batch') {
              // Batch data (multiple 18-byte packets)
              const batchData = parsed.data as BLEBatchData;
              console.log('[BLE] Received batch data:', batchData.count, 'packets');

              if (onBatchReceived) {
                onBatchReceived(batchData);
              } else {
                // If no batch handler, send each packet individually
                batchData.packets.forEach(packet => onDataReceived(packet));
              }
            } else {
              console.warn('[BLE] Unknown packet type:', parsed.type);
            }
          }
        }
      );

      console.log('[BLE] Successfully subscribed to health data');

      // Return unsubscribe function
      return () => {
        subscription.remove();
        console.log('[BLE] Unsubscribed from health data');
      };
    } catch (error) {
      console.error('[BLE] Subscribe error:', error);
      return () => { };
    }
  }
}
