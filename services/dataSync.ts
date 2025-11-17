// Data Sync Service - Gom dữ liệu và gửi lên server mỗi 30 phút
import { BLEHealthData } from '@/types';
import { apiService, HealthDataDto, HealthDataPoint } from './api';

const SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

class DataSyncService {
    private dataBuffer: BLEHealthData[] = [];
    private syncTimer: ReturnType<typeof setInterval> | null = null;
    private deviceId: string = '';
    private deviceName: string = '';

    /**
     * Bắt đầu sync service
     */
    start(deviceId: string, deviceName: string) {
        console.log('[DataSync] Starting sync service for device:', deviceName);
        this.deviceId = deviceId;
        this.deviceName = deviceName;

        // Clear existing timer
        this.stop();

        // Set up periodic sync every 30 minutes
        this.syncTimer = setInterval(() => {
            this.syncToServer();
        }, SYNC_INTERVAL);

        // Also sync immediately if buffer has data
        if (this.dataBuffer.length > 0) {
            this.syncToServer();
        }
    }

    /**
     * Dừng sync service
     */
    stop() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
            console.log('[DataSync] Sync service stopped');
        }
    }

    /**
     * Thêm dữ liệu mới vào buffer
     */
    addData(data: BLEHealthData) {
        this.dataBuffer.push(data);
        console.log(`[DataSync] Data added to buffer. Total: ${this.dataBuffer.length} records`);

        // Optional: Sync immediately if buffer is too large (> 100 records)
        if (this.dataBuffer.length >= 100) {
            console.log('[DataSync] Buffer full, syncing immediately...');
            this.syncToServer();
        }
    }

    /**
     * Gửi dữ liệu lên server
     */
    async syncToServer(): Promise<boolean> {
        if (this.dataBuffer.length === 0) {
            console.log('[DataSync] No data to sync');
            return true;
        }

        // Convert BLEHealthData to HealthDataPoint format
        const dataPoints: HealthDataPoint[] = this.dataBuffer.map(data => ({
            timestamp: data.timestamp,
            heartRate: data.heartRate,
            spo2: data.spo2,
            stepCount: data.steps,
            caloriesBurned: data.calories,
        }));

        const healthDataDto: HealthDataDto = {
            deviceUuid: this.deviceId,
            dataPoints: dataPoints,
        };

        console.log(`[DataSync] Syncing ${dataPoints.length} records to server...`);

        try {
            const result = await apiService.sendHealthData(healthDataDto);
            console.log('[DataSync] ✅ Sync successful! Server response:', result);

            // Clear buffer after successful sync
            this.dataBuffer = [];
            return true;
        } catch (error: any) {
            console.error('[DataSync] ❌ Sync error:', error);
            // If unauthorized, user needs to login again
            if (error.status === 401) {
                console.error('[DataSync] Unauthorized - Please login again');
            }
            return false;
        }
    }

    /**
     * Lấy số lượng data đang chờ sync
     */
    getBufferSize(): number {
        return this.dataBuffer.length;
    }

    /**
     * Xóa toàn bộ buffer (dùng khi disconnect)
     */
    clearBuffer() {
        this.dataBuffer = [];
        console.log('[DataSync] Buffer cleared');
    }

    /**
     * Force sync ngay lập tức (manual trigger)
     */
    async forceSyncNow(): Promise<boolean> {
        console.log('[DataSync] Force sync triggered by user');
        return await this.syncToServer();
    }
}

// Export singleton instance
export const dataSyncService = new DataSyncService();
