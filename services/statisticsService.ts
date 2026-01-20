import { apiService, HealthMetric, StatisticsData, StatisticsRange } from './api';

// Re-export for backward compatibility
export type { StatisticsData };

/**
 * Normalize statistics data to ensure all fields have valid values
 */
function normalizeStats(data: Partial<StatisticsData> | null | undefined): StatisticsData {
    return {
        chartData: data?.chartData ?? [],
        average: data?.average ?? 0,
        total: data?.total ?? 0,
        max: data?.max ?? 0,
        min: data?.min ?? 0,
    };
}

/**
 * Service for fetching health statistics from backend
 * Uses centralized API methods from api.ts
 */
class StatisticsService {
    /**
     * Generic method to get statistics for any metric
     */
    private async getStats(metric: HealthMetric, range: StatisticsRange): Promise<StatisticsData> {
        try {
            const response = await apiService.getHealthStatistics(metric, range);
            return normalizeStats(response);
        } catch (error) {
            console.error(`Failed to fetch ${metric} stats:`, error);
            return this.getEmptyStats();
        }
    }

    /**
     * Get calories statistics
     */
    async getCaloriesStats(range: StatisticsRange): Promise<StatisticsData> {
        return this.getStats('calories', range);
    }

    /**
     * Get steps statistics
     */
    async getStepsStats(range: StatisticsRange): Promise<StatisticsData> {
        return this.getStats('steps', range);
    }

    /**
     * Get water intake statistics
     */
    async getWaterStats(range: StatisticsRange): Promise<StatisticsData> {
        return this.getStats('water', range);
    }

    /**
     * Get heart rate statistics
     */
    async getHeartRateStats(range: StatisticsRange): Promise<StatisticsData> {
        return this.getStats('hr', range);
    }

    /**
     * Get SpO2 statistics
     */
    async getSpO2Stats(range: StatisticsRange): Promise<StatisticsData> {
        return this.getStats('spo2', range);
    }

    /**
     * Get sleep statistics
     */
    async getSleepStats(range: StatisticsRange): Promise<StatisticsData> {
        return this.getStats('sleep', range);
    }

    /**
     * Get weight statistics
     */
    async getWeightStats(range: StatisticsRange): Promise<StatisticsData> {
        return this.getStats('weight', range);
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
