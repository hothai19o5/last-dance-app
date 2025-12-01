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
    id: string;
    name: string;
    gender: 'Male' | 'Female' | 'Other';
    height: number; // cm
    age: number;
    weight?: number; // kg
    avatar?: string;
}

// BLE Types
export interface BLEDevice {
    id: string;
    name: string;
    rssi: number;
}

export interface BLEConfig {
    height: number;  // in meters (e.g., 1.77)
    weight: number;  // in kg (e.g., 65.0)
    age: number;     // years
    gender: number;  // 0: Male, 1: Female
}

// Health data received from ESP32 device (single reading or alert)
export interface BLEHealthData {
    heartRate: number;      // hr (bpm)
    spo2: number;          // spo2 (%)
    steps: number;         // steps count
    alertScore: number | null;  // ML alert score (0-1), only present when > 0.95
    timestamp: string;     // ISO timestamp
}

// Batch health data received from ESP32 device (every 5 minutes)
export interface BLEBatchData {
    type: 'batch';          // Always 'batch' for batch data
    count: number;          // Number of samples (max 300)
    startTs: number;        // Timestamp of first sample (seconds from boot)
    interval: number;       // Interval between samples (1 second)
    hr: number[];           // Array of heart rates (BPM)
    spo2: number[];         // Array of SpO2 values (%)
}

// Battery data from ESP32 device
export interface BLEBatteryData {
    level: number;          // Battery percentage (0-100)
    timestamp: string;      // ISO timestamp
}
