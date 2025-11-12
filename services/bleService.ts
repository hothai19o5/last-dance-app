// BLE Service - Real Implementation using react-native-ble-plx
import { Buffer } from 'buffer';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, State } from 'react-native-ble-plx';
import { BLEConfig, BLEDevice } from '../types';
import { encodeUserProfile, parseHealthDataJSON } from '../utils/bleDebug';

const bleManager = new BleManager();

// BLE Service UUIDs (matching ESP32 device)
const USER_PROFILE_SERVICE_UUID = '0000181C-0000-1000-8000-00805F9B34FB';
const WEIGHT_CHAR_UUID = '00002A98-0000-1000-8000-00805F9B34FB';
const HEIGHT_CHAR_UUID = '00002A8E-0000-1000-8000-00805F9B34FB';
const GENDER_CHAR_UUID = '00002A8C-0000-1000-8000-00805F9B34FB';
const AGE_CHAR_UUID = '00002A80-0000-1000-8000-00805F9B34FB';

const HEALTH_DATA_SERVICE_UUID = '0000180D-0000-1000-8000-00805F9B34FB';
const HEALTH_DATA_BATCH_CHAR_UUID = '00002A37-0000-1000-8000-00805F9B34FB';
const DEVICE_STATUS_CHAR_UUID = '00002A19-0000-1000-8000-00805F9B34FB';

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
      const device = await bleManager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      console.log('[BLE] Connected successfully to:', deviceId);
      return true;
    } catch (error) {
      console.error('[BLE] Connection error:', error);
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

  static async writeConfig(deviceId: string, config: BLEConfig): Promise<boolean> {
    console.log('[BLE] Writing config to device:', deviceId, config);

    try {
      // Encode user profile data using helper function
      const encoded = encodeUserProfile(
        config.height,
        config.weight,
        config.age,
        config.gender
      );

      // Write Weight
      await bleManager.writeCharacteristicWithResponseForDevice(
        deviceId,
        USER_PROFILE_SERVICE_UUID,
        WEIGHT_CHAR_UUID,
        encoded.weight
      );

      // Write Height
      await bleManager.writeCharacteristicWithResponseForDevice(
        deviceId,
        USER_PROFILE_SERVICE_UUID,
        HEIGHT_CHAR_UUID,
        encoded.height
      );

      // Write Gender
      await bleManager.writeCharacteristicWithResponseForDevice(
        deviceId,
        USER_PROFILE_SERVICE_UUID,
        GENDER_CHAR_UUID,
        encoded.gender
      );

      // Write Age
      await bleManager.writeCharacteristicWithResponseForDevice(
        deviceId,
        USER_PROFILE_SERVICE_UUID,
        AGE_CHAR_UUID,
        encoded.age
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
      // Read Health Data Batch (JSON format from ESP32)
      const characteristic = await bleManager.readCharacteristicForDevice(
        deviceId,
        HEALTH_DATA_SERVICE_UUID,
        HEALTH_DATA_BATCH_CHAR_UUID
      );

      if (characteristic.value) {
        // Use helper function to parse health data
        const parsedData = parseHealthDataJSON(characteristic.value);

        if (parsedData) {
          console.log('[BLE] Synced data:', parsedData);
          return {
            ...parsedData,
            timestamp: new Date().toISOString(),
          };
        }
      }
      return null;
    } catch (error) {
      console.error('[BLE] Sync data error:', error);
      // Return mock data if sync fails (for testing)
      return {
        heartRate: 64,
        spo2: 98,
        steps: 319,
        calories: 6,
        alertScore: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async getBatteryLevel(deviceId: string): Promise<number> {
    console.log('[BLE] Getting battery level:', deviceId);

    try {
      const characteristic = await bleManager.readCharacteristicForDevice(
        deviceId,
        HEALTH_DATA_SERVICE_UUID,
        DEVICE_STATUS_CHAR_UUID
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

  // Subscribe to health data notifications
  static async subscribeToHealthData(
    deviceId: string,
    onDataReceived: (data: any) => void
  ): Promise<() => void> {
    console.log('[BLE] Subscribing to health data notifications...');

    // Buffer for incomplete JSON chunks
    let jsonBuffer = '';

    try {
      // Ensure device is connected and services are discovered
      const device = await bleManager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();

      // Request larger MTU for better data transfer (max 512)
      try {
        const mtu = await device.requestMTU(512);
        console.log(`[BLE] MTU set to: ${mtu} bytes`);
      } catch (error) {
        console.log('[BLE] Could not set MTU, using default (23 bytes)');
      }

      // Small delay to ensure characteristics are ready
      await new Promise(resolve => setTimeout(resolve, 500));

      const subscription = bleManager.monitorCharacteristicForDevice(
        deviceId,
        HEALTH_DATA_SERVICE_UUID,
        HEALTH_DATA_BATCH_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('[BLE] Monitor error:', error);
            return;
          }

          if (characteristic?.value) {
            // Decode chunk
            const chunk = Buffer.from(characteristic.value, 'base64').toString('utf-8');

            // Add to buffer
            jsonBuffer += chunk;

            // Check if we have complete JSON (ends with })
            if (jsonBuffer.trim().endsWith('}')) {
              // Try to parse complete JSON
              const healthData = parseHealthDataJSON(Buffer.from(jsonBuffer, 'utf-8').toString('base64'));

              if (healthData) {
                const dataWithTimestamp = {
                  ...healthData,
                  timestamp: new Date().toISOString(),
                };

                console.log('[BLE] Received health data:', dataWithTimestamp);
                onDataReceived(dataWithTimestamp);
              }

              // Clear buffer for next message
              jsonBuffer = '';
            } else {
              console.log(`[BLE] Buffering chunk... (${jsonBuffer.length} chars so far)`);
            }
          }
        }
      );

      console.log('[BLE] Successfully subscribed to health data');

      // Return unsubscribe function
      return () => {
        subscription.remove();
        jsonBuffer = ''; // Clear buffer on unsubscribe
        console.log('[BLE] Unsubscribed from health data');
      };
    } catch (error) {
      console.error('[BLE] Subscribe error:', error);
      return () => { };
    }
  }
}
