// Data Sync Service - Gom dữ liệu và gửi lên server mỗi 30 phút
import { BLEHealthData } from '@/types';
import { apiService, HealthDataDto, HealthDataPoint } from './api';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_BUFFER_SIZE = 1000; // Max records to hold in buffer

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
        console.log(`[DataSync] Config - Interval: ${SYNC_INTERVAL / 1000}s (${SYNC_INTERVAL / 60000} min), Max buffer: ${MAX_BUFFER_SIZE}`);
        this.deviceId = deviceId;
        this.deviceName = deviceName;

        // Clear existing timer
        this.stop();

        // Set up periodic sync every 5 minutes
        this.syncTimer = setInterval(() => {
            console.log('[DataSync] Periodic sync triggered (5 min interval)');
            this.syncToServer();
        }, SYNC_INTERVAL);

        console.log('[DataSync] Sync timer started - will sync every 5 minutes');

        // Also sync immediately if buffer has data
        if (this.dataBuffer.length > 0) {
            console.log(`[DataSync] Buffer has ${this.dataBuffer.length} records, syncing immediately...`);
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
        console.log(`[DataSync] Single data added to buffer. Total: ${this.dataBuffer.length}/${MAX_BUFFER_SIZE} records`);

        // Sync immediately if buffer reaches max size
        if (this.dataBuffer.length >= MAX_BUFFER_SIZE) {
            console.log('[DataSync] Buffer reached max size, syncing immediately...');
            this.syncToServer();
        }
    }

    /**
     * Thêm batch data vào buffer (nhiều records cùng lúc)
     */
    addBatchData(dataArray: BLEHealthData[]) {
        this.dataBuffer.push(...dataArray);
        console.log(`[DataSync] Batch data added: ${dataArray.length} records. Total: ${this.dataBuffer.length}/${MAX_BUFFER_SIZE} records`);

        // Sync immediately if buffer reaches or exceeds max size
        if (this.dataBuffer.length >= MAX_BUFFER_SIZE) {
            console.log('[DataSync] Buffer reached max size after batch, syncing immediately...');
            this.syncToServer();
        }
    }

    /**
     * Gửi dữ liệu lên server
     */
    async syncToServer(): Promise<boolean> {
        if (this.dataBuffer.length === 0) {
            console.log('[DataSync] No data to sync, skipping...');
            return true;
        }

        console.log(`[DataSync] ========== SYNC START ==========`);
        console.log(`[DataSync] Buffer size: ${this.dataBuffer.length} records`);

        // Check if user is authenticated before syncing
        const isAuthenticated = await apiService.isAuthenticated();
        if (!isAuthenticated) {
            console.warn('[DataSync] User not authenticated, skipping sync');
            console.warn(`[DataSync] ${this.dataBuffer.length} records remain in buffer`);
            return false;
        }

        // Convert BLEHealthData to HealthDataPoint format
        const dataPoints: HealthDataPoint[] = this.dataBuffer.map(data => ({
            timestamp: data.timestampISO,  // Use timestampISO (ISO string) instead of timestamp (unix)
            heartRate: data.heartRate,
            spo2: data.spo2,
            stepCount: data.steps,
            caloriesBurned: 0, // Not available in new format
            alertScore: data.alertScore, // Include ML alert score if present
        }));

        const healthDataDto: HealthDataDto = {
            deviceUuid: this.deviceId,
            dataPoints: dataPoints,
        };

        console.log(`[DataSync] Syncing ${dataPoints.length} records to server...`);

        try {
            const result = await apiService.sendHealthData(healthDataDto);
            console.log('[DataSync] ✅ Sync successful!');
            console.log('[DataSync] Server response:', result.message);

            // Clear buffer after successful sync
            const syncedCount = this.dataBuffer.length;
            this.dataBuffer = [];
            console.log(`[DataSync] Buffer cleared (${syncedCount} records synced)`);
            console.log(`[DataSync] ========== SYNC END ==========`);
            return true;
        } catch (error: any) {
            console.error('[DataSync] ❌ Sync failed:', error.message || error);
            console.error(`[DataSync] ${this.dataBuffer.length} records remain in buffer`);

            // If unauthorized, user needs to login again
            if (error.status === 401) {
                console.error('[DataSync] Unauthorized - Token may be invalid or expired. Please login again');
            }
            console.log(`[DataSync] ========== SYNC END (FAILED) ==========`);
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
