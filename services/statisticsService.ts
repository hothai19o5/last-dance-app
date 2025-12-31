import { apiService } from './api';

export interface StatisticsData {
    chartData: { value: number; label: string }[];
    average: number;
    total: number;
    max: number;
    min: number;
}

/**
 * Service for fetching health statistics from backend
 */
class StatisticsService {
    /**
     * Get calories statistics
     */
    async getCaloriesStats(range: 'day' | 'week'): Promise<StatisticsData> {
        try {
            const response = await apiService.get<StatisticsData>(
                `/health-data/statistics?metric=calories&range=${range}`,
                true
            );
            return response;
        } catch (error) {
            console.error('Failed to fetch calories stats:', error);
            return this.getEmptyStats();
        }
    }

    /**
     * Get steps statistics
     */
    async getStepsStats(range: 'day' | 'week'): Promise<StatisticsData> {
        try {
            const response = await apiService.get<StatisticsData>(
                `/health-data/statistics?metric=steps&range=${range}`,
                true
            );
            return response;
        } catch (error) {
            console.error('Failed to fetch steps stats:', error);
            return this.getEmptyStats();
        }
    }

    /**
     * Get water intake statistics
     */
    async getWaterStats(range: 'day' | 'week'): Promise<StatisticsData> {
        try {
            const response = await apiService.get<StatisticsData>(
                `/health-data/statistics?metric=water&range=${range}`,
                true
            );
            return response;
        } catch (error) {
            console.error('Failed to fetch water stats:', error);
            return this.getEmptyStats();
        }
    }

    /**
     * Get heart rate statistics
     */
    async getHeartRateStats(range: 'day' | 'week'): Promise<StatisticsData> {
        try {
            const response = await apiService.get<StatisticsData>(
                `/health-data/statistics?metric=hr&range=${range}`,
                true
            );
            return response;
        } catch (error) {
            console.error('Failed to fetch heart rate stats:', error);
            return this.getEmptyStats();
        }
    }

    /**
     * Get SpO2 statistics
     */
    async getSpO2Stats(range: 'day' | 'week'): Promise<StatisticsData> {
        try {
            const response = await apiService.get<StatisticsData>(
                `/health-data/statistics?metric=spo2&range=${range}`,
                true
            );
            return response;
        } catch (error) {
            console.error('Failed to fetch SpO2 stats:', error);
            return this.getEmptyStats();
        }
    }

    /**
     * Get sleep statistics
     */
    async getSleepStats(range: 'day' | 'week'): Promise<StatisticsData> {
        try {
            const response = await apiService.get<StatisticsData>(
                `/health-data/statistics?metric=sleep&range=${range}`,
                true
            );
            return response;
        } catch (error) {
            console.error('Failed to fetch sleep stats:', error);
            return this.getEmptyStats();
        }
    }

    /**
     * Get weight statistics
     */
    async getWeightStats(range: 'day' | 'week'): Promise<StatisticsData> {
        try {
            const response = await apiService.get<StatisticsData>(
                `/health-data/statistics?metric=weight&range=${range}`,
                true
            );
            return response;
        } catch (error) {
            console.error('Failed to fetch weight stats:', error);
            return this.getEmptyStats();
        }
    }

    /**
     * Return empty statistics for error fallback
     */
    private getEmptyStats(): StatisticsData {
        return {
            chartData: [],
            average: 0,
            total: 0,
            max: 0,
            min: 0,
        };
    }
}

export const statisticsService = new StatisticsService();
