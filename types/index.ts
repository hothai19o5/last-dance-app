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

// Health data received from ESP32 device
export interface BLEHealthData {
    heartRate: number;      // hr (bpm)
    spo2: number;          // spo2 (%)
    steps: number;         // steps count
    calories: number;      // calories (kcal)
    alertScore: number | null;  // ML alert score (0-1)
    timestamp: string;     // ISO timestamp
}
