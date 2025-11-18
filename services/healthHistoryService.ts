import AsyncStorage from '@react-native-async-storage/async-storage';
import { BLEHealthData } from '../types';

const HEALTH_HISTORY_KEY = '@health_history';
const MAX_HISTORY_POINTS = 12;

interface HealthHistoryData {
    heartRate: number[];
    spo2: number[];
    timestamps: string[];
}

export const healthHistoryService = {
    /**
     * Add new health data point to history
     */
    async addHealthData(data: BLEHealthData): Promise<void> {
        try {
            const history = await this.getHistory();

            // Add new data points
            history.heartRate.push(data.heartRate);
            history.spo2.push(data.spo2);
            history.timestamps.push(data.timestamp);

            // Keep only last MAX_HISTORY_POINTS
            if (history.heartRate.length > MAX_HISTORY_POINTS) {
                history.heartRate = history.heartRate.slice(-MAX_HISTORY_POINTS);
                history.spo2 = history.spo2.slice(-MAX_HISTORY_POINTS);
                history.timestamps = history.timestamps.slice(-MAX_HISTORY_POINTS);
            }

            await AsyncStorage.setItem(HEALTH_HISTORY_KEY, JSON.stringify(history));
            console.log('[HealthHistory] Data added:', {
                points: history.heartRate.length,
                latest: { hr: data.heartRate, spo2: data.spo2 }
            });
        } catch (error) {
            console.error('[HealthHistory] Failed to add data:', error);
        }
    },

    /**
     * Get health history
     */
    async getHistory(): Promise<HealthHistoryData> {
        try {
            const historyJson = await AsyncStorage.getItem(HEALTH_HISTORY_KEY);
            if (historyJson) {
                return JSON.parse(historyJson);
            }
            return {
                heartRate: [],
                spo2: [],
                timestamps: [],
            };
        } catch (error) {
            console.error('[HealthHistory] Failed to get history:', error);
            return {
                heartRate: [],
                spo2: [],
                timestamps: [],
            };
        }
    },

    /**
     * Clear all history
     */
    async clearHistory(): Promise<void> {
        try {
            await AsyncStorage.removeItem(HEALTH_HISTORY_KEY);
            console.log('[HealthHistory] History cleared');
        } catch (error) {
            console.error('[HealthHistory] Failed to clear history:', error);
        }
    },

    /**
     * Get chart data for heart rate (pad with 0 if less than 12 points)
     */
    async getHeartRateChartData(): Promise<{ value: number }[]> {
        const history = await this.getHistory();
        const data = history.heartRate.length > 0 ? history.heartRate : [];

        // Pad with 0 to have exactly 12 points
        const paddedData = Array(MAX_HISTORY_POINTS).fill(0);
        const startIndex = MAX_HISTORY_POINTS - data.length;
        data.forEach((value, index) => {
            paddedData[startIndex + index] = value;
        });

        return paddedData.map(value => ({ value }));
    },

    /**
     * Get chart data for SpO2 (pad with 0 if less than 12 points)
     */
    async getSpO2ChartData(): Promise<{ value: number }[]> {
        const history = await this.getHistory();
        const data = history.spo2.length > 0 ? history.spo2 : [];

        // Pad with 0 to have exactly 12 points
        const paddedData = Array(MAX_HISTORY_POINTS).fill(0);
        const startIndex = MAX_HISTORY_POINTS - data.length;
        data.forEach((value, index) => {
            paddedData[startIndex + index] = value;
        });

        return paddedData.map(value => ({ value }));
    },
};
