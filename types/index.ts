// Types for Health Data
export interface HealthMetrics {
    calories: {
        current: number;
        goal: number;
    };
    steps: {
        current: number;
        goal: number;
    };
    standing: {
        current: number;
        goal: number;
    };
    moving: {
        minutes: number;
    };
}

export interface SleepData {
    duration: string;
    date: string;
    quality: 'Poor' | 'Fair' | 'Good' | 'Excellent';
    qualityScore: number; // 0-100
}

export interface HeartRateData {
    bpm: number;
    timestamp: string;
    history: number[]; // Last 24 hours hourly data
}

export interface SpO2Data {
    percentage: number;
    timestamp: string;
    history: number[]; // Last 24 hours hourly data
}

export interface WeightData {
    weight: number; // in kg
    date: string;
    history: number[];
}

// Types for Device
export interface WearableDevice {
    id: string;
    name: string;
    type: string;
    connected: boolean;
    battery: number;
    image?: string;
    lastCharged?: number;
}

export interface WatchFace {
    id: string;
    name: string;
    thumbnail: string;
    category: 'online' | 'installed';
}

// Types for User Profile
export interface UserProfile {
    id?: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    gender?: 'MALE' | 'FEMALE';
    heightM?: number;
    age?: number;
    weightKg?: number;
    profilePictureUrl?: string;
    bmi?: number;
    enable?: boolean;
    dob?: string;
}

// BLE Types
export interface BLEDevice {
    id: string;
    name: string;
    rssi: number;
}

export interface BLEConfig {
    bmi: number;           // BMI value (e.g., 22.5)
    dataMode: number;      // 0: Realtime, 1: Batch
    stepEnable: number;    // 0: Disabled, 1: Enabled
    mlEnable: number;      // 0: Disabled, 1: Enabled (AI anomaly detection)
}

// Activity status enum
export type ActivityStatus = 0 | 1 | 2 | 3; // 0=sleeping, 1=resting, 2=walking, 3=running

// Health data received from ESP32 device (binary packet - 10, 14, or 18 bytes)
export interface BLEHealthData {
    timestamp: number;          // Unix timestamp (uint32)
    steps: number;              // Total step count (uint32)
    heartRate: number;          // HR in BPM (uint8)
    spo2: number;              // SpO2 in % (uint8)
    alertScore: number | null;  // ML alert score (float, 0-1), present when packet is 14+ bytes
    activityStatus?: ActivityStatus; // 0=sleeping, 1=resting, 2=walking, 3=running (uint8)
    sleepDurationMinutes?: number;  // Sleep duration in minutes (uint16)
    caloriesBurned?: number;    // Calculated calories burned (not from device, calculated locally)
    waterIntakeMl?: number;     // Water intake in ml (not from device, tracked locally)
    timestampISO: string;      // ISO string for display/storage
}

// Batch health data received from ESP32 device (N * 10 bytes)
export interface BLEBatchData {
    packets: BLEHealthData[];  // Array of parsed HealthDataPackets (10 bytes each)
    count: number;             // Number of packets in this batch
}

// Battery data from ESP32 device
export interface BLEBatteryData {
    level: number;          // Battery percentage (0-100)
    timestamp: string;      // ISO timestamp
}
