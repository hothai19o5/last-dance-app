/**
 * Service để lưu trữ dữ liệu health trong ngày
 * Khi user thoát ra vào lại app, data vẫn hiển thị được
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BLEHealthData } from '../types';

const TODAY_HEALTH_KEY = '@today_health_data';

interface TodayHealthStorage {
    date: string;  // YYYY-MM-DD format to check if it's still today
    data: BLEHealthData;
    lastUpdated: string;  // ISO timestamp
    // Cumulative values for the day
    totalCaloriesBurned: number;  // Total calories burned today
    totalMovingMinutes: number;   // Total moving time in minutes today
    lastSteps: number;            // Last recorded steps (to calculate delta)
}

/**
 * Get today's date string in YYYY-MM-DD format
 */
const getTodayDateString = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

export const todayHealthDataService = {
    /**
     * Save or update today's health data
     * Simple: calories and moving time are calculated directly from total steps
     * @param data Health data from device
     * @param caloriesBurned Calories burned (steps × 0.04)
     * @param movingMinutes Moving time (steps ÷ 100)
     */
    async saveHealthData(data: BLEHealthData, caloriesBurned?: number, movingMinutes?: number): Promise<void> {
        try {
            const today = getTodayDateString();
            const totalCaloriesBurned = caloriesBurned ?? 0;
            const totalMovingMinutes = movingMinutes ?? 0;

            const storage: TodayHealthStorage = {
                date: today,
                data: {
                    ...data,
                    caloriesBurned: Math.round(totalCaloriesBurned),
                },
                lastUpdated: new Date().toISOString(),
                totalCaloriesBurned: Math.round(totalCaloriesBurned),
                totalMovingMinutes: Math.round(totalMovingMinutes),
                lastSteps: data.steps,
            };

            await AsyncStorage.setItem(TODAY_HEALTH_KEY, JSON.stringify(storage));
        } catch (error) {
            console.error('[TodayHealth] Failed to save data:', error);
        }
    },

    /**
     * Get today's health data
     * Returns null if no data for today or data is from a previous day
     */
    async getTodayHealthData(): Promise<BLEHealthData | null> {
        try {
            const storageJson = await AsyncStorage.getItem(TODAY_HEALTH_KEY);
            if (!storageJson) {
                console.log('[TodayHealth] No stored data found');
                return null;
            }

            const storage: TodayHealthStorage = JSON.parse(storageJson);
            const today = getTodayDateString();

            // Check if data is from today
            if (storage.date !== today) {
                console.log('[TodayHealth] Data is from', storage.date, 'not today', today);
                // Optionally clear old data
                await this.clearData();
                return null;
            }

            console.log('[TodayHealth] Loaded today data:', {
                hr: storage.data.heartRate,
                spo2: storage.data.spo2,
                steps: storage.data.steps,
                activity: storage.data.activityStatus,
                calories: storage.totalCaloriesBurned,
                movingMinutes: storage.totalMovingMinutes,
                lastUpdated: storage.lastUpdated,
            });

            // Return data with cumulative values
            return {
                ...storage.data,
                caloriesBurned: storage.totalCaloriesBurned,
            };
        } catch (error) {
            console.error('[TodayHealth] Failed to get data:', error);
            return null;
        }
    },

    /**
     * Get cumulative stats for today (calories and moving time)
     */
    async getTodayStats(): Promise<{ calories: number; movingMinutes: number } | null> {
        try {
            const storageJson = await AsyncStorage.getItem(TODAY_HEALTH_KEY);
            if (!storageJson) {
                return null;
            }

            const storage: TodayHealthStorage = JSON.parse(storageJson);
            const today = getTodayDateString();

            if (storage.date !== today) {
                return null;
            }

            return {
                calories: storage.totalCaloriesBurned ?? 0,
                movingMinutes: storage.totalMovingMinutes ?? 0,
            };
        } catch (error) {
            console.error('[TodayHealth] Failed to get today stats:', error);
            return null;
        }
    },

    /**
     * Clear stored data
     */
    async clearData(): Promise<void> {
        try {
            await AsyncStorage.removeItem(TODAY_HEALTH_KEY);
            console.log('[TodayHealth] Data cleared');
        } catch (error) {
            console.error('[TodayHealth] Failed to clear data:', error);
        }
    },

    /**
     * Check if we have data for today
     */
    async hasDataForToday(): Promise<boolean> {
        const data = await this.getTodayHealthData();
        return data !== null;
    },

    /**
     * Update specific fields without replacing entire data
     * Useful for updating steps count while keeping other data
     */
    async updateHealthData(updates: Partial<BLEHealthData>): Promise<void> {
        try {
            const currentData = await this.getTodayHealthData();
            if (!currentData) {
                console.log('[TodayHealth] No existing data to update');
                return;
            }

            const updatedData: BLEHealthData = {
                ...currentData,
                ...updates,
            };

            await this.saveHealthData(updatedData);
        } catch (error) {
            console.error('[TodayHealth] Failed to update data:', error);
        }
    },

    /**
     * Get the last update timestamp
     */
    async getLastUpdateTime(): Promise<string | null> {
        try {
            const storageJson = await AsyncStorage.getItem(TODAY_HEALTH_KEY);
            if (!storageJson) {
                return null;
            }

            const storage: TodayHealthStorage = JSON.parse(storageJson);
            const today = getTodayDateString();

            if (storage.date !== today) {
                return null;
            }

            return storage.lastUpdated;
        } catch (error) {
            console.error('[TodayHealth] Failed to get last update time:', error);
            return null;
        }
    },
};
