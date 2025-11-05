import { HealthMetrics, SleepData, HeartRateData, WearableDevice, WatchFace, UserProfile, SpO2Data, WeightData } from '../types';

// Mock Health Data
export const mockHealthMetrics: HealthMetrics = {
    calories: {
        current: 120,
        goal: 200,
    },
    steps: {
        current: 2195,
        goal: 2000,
    },
    standing: {
        current: 4,
        goal: 6,
    },
    moving: {
        minutes: 45,
    },
};

export const mockSleepData: SleepData = {
    duration: '7h 51min',
    date: '10 Sep',
    quality: 'Good',
    qualityScore: 75,
};

export const mockHeartRateData: HeartRateData = {
    bpm: 64,
    timestamp: '10 Sep, 06:22',
    history: [62, 65, 68, 64, 70, 72, 65, 63, 60, 58, 62, 64, 68, 72, 75, 73, 70, 67, 65, 63, 61, 60, 62, 64],
};

export const mockSpO2Data: SpO2Data = {
    percentage: 98,
    timestamp: '10 Sep, 06:22',
    history: [97, 98, 99, 98, 97, 96, 98, 99, 97, 98, 99, 98, 97, 96, 98, 99, 97, 98, 99, 98, 97, 96, 98, 99],
};

export const mockWeightData: WeightData = {
    weight: 55,
    date: '10 Sep',
    history: [56, 55.8, 55.5, 55.3, 55.1, 55, 54.9, 54.8, 54.7, 54.6, 54.5, 54.4, 54.3, 54.2, 54.1, 54, 53.9, 53.8, 53.7, 53.6, 53.5, 53.4, 53.3, 53.2],
};

// Mock Device Data
export const mockWearableDevice: WearableDevice = {
    id: 'xiaomi-watch-s3-001',
    name: 'Xiaomi Watch S3',
    type: 'smartwatch',
    connected: true,
    battery: 65,
};

export const mockWatchFaces: WatchFace[] = [
    {
        id: 'face-1',
        name: 'G928',
        thumbnail: '🕐',
        category: 'online',
    },
    {
        id: 'face-2',
        name: 'Vitality 2',
        thumbnail: '⌚',
        category: 'online',
    },
    {
        id: 'face-3',
        name: 'Vitality 1',
        thumbnail: '🕑',
        category: 'online',
    },
    {
        id: 'face-4',
        name: 'Vitality I',
        thumbnail: '⏱️',
        category: 'online',
    },
];

// Mock User Profile
export const mockUserProfile: UserProfile = {
    id: '777',
    name: '777',
    gender: 'Female',
    height: 165,
    age: 22,
    weight: 55,
};
