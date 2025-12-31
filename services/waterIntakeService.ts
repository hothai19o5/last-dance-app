// Water Intake Storage Service - Track daily water consumption
import AsyncStorage from '@react-native-async-storage/async-storage';

const WATER_INTAKE_KEY = 'water_intake';
const WATER_INTAKE_DATE_KEY = 'water_intake_date';

export interface WaterIntakeData {
    totalMl: number;
    date: string; // YYYY-MM-DD format
    entries: WaterEntry[];
}

export interface WaterEntry {
    amountMl: number;
    timestamp: string; // ISO string
}

class WaterIntakeService {
    /**
     * Get current date in YYYY-MM-DD format
     */
    private getCurrentDate(): string {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    /**
     * Load water intake data for today
     */
    async loadTodayData(): Promise<WaterIntakeData> {
        try {
            const storedData = await AsyncStorage.getItem(WATER_INTAKE_KEY);
            const storedDate = await AsyncStorage.getItem(WATER_INTAKE_DATE_KEY);
            const currentDate = this.getCurrentDate();

            // If date changed, reset data
            if (storedDate !== currentDate || !storedData) {
                const newData: WaterIntakeData = {
                    totalMl: 0,
                    date: currentDate,
                    entries: [],
                };
                await this.saveData(newData);
                return newData;
            }

            const data: WaterIntakeData = JSON.parse(storedData);
            return data;
        } catch (error) {
            console.error('[WaterIntake] Error loading data:', error);
            return {
                totalMl: 0,
                date: this.getCurrentDate(),
                entries: [],
            };
        }
    }

    /**
     * Save water intake data
     */
    private async saveData(data: WaterIntakeData): Promise<void> {
        try {
            await AsyncStorage.setItem(WATER_INTAKE_KEY, JSON.stringify(data));
            await AsyncStorage.setItem(WATER_INTAKE_DATE_KEY, data.date);
        } catch (error) {
            console.error('[WaterIntake] Error saving data:', error);
        }
    }

    /**
     * Add water intake entry
     */
    async addWater(amountMl: number): Promise<WaterIntakeData> {
        try {
            const data = await this.loadTodayData();

            const newEntry: WaterEntry = {
                amountMl,
                timestamp: new Date().toISOString(),
            };

            data.entries.push(newEntry);
            data.totalMl += amountMl;

            await this.saveData(data);
            console.log(`[WaterIntake] Added ${amountMl}ml. Total: ${data.totalMl}ml`);

            return data;
        } catch (error) {
            console.error('[WaterIntake] Error adding water:', error);
            throw error;
        }
    }

    /**
     * Reset water intake (for testing or manual reset)
     */
    async reset(): Promise<void> {
        const data: WaterIntakeData = {
            totalMl: 0,
            date: this.getCurrentDate(),
            entries: [],
        };
        await this.saveData(data);
        console.log('[WaterIntake] Data reset');
    }

    /**
     * Get total water intake for today
     */
    async getTotalToday(): Promise<number> {
        const data = await this.loadTodayData();
        return data.totalMl;
    }

    /**
     * Remove last water entry (undo functionality)
     */
    async removeLastEntry(): Promise<WaterIntakeData> {
        try {
            const data = await this.loadTodayData();

            if (data.entries.length === 0) {
                return data;
            }

            const removedEntry = data.entries.pop();
            if (removedEntry) {
                data.totalMl -= removedEntry.amountMl;
            }

            await this.saveData(data);
            console.log('[WaterIntake] Removed last entry');

            return data;
        } catch (error) {
            console.error('[WaterIntake] Error removing entry:', error);
            throw error;
        }
    }

    /**
     * Get water intake history (all entries for today)
     */
    async getHistory(): Promise<WaterEntry[]> {
        const data = await this.loadTodayData();
        return data.entries;
    }
}

export const waterIntakeService = new WaterIntakeService();
