// Data Sync Service - Gom dữ liệu và gửi lên server mỗi 30 phút
import { BLEHealthData } from '@/types';

const MOCK_API_URL = 'https://jsonplaceholder.typicode.com/posts'; // Mock API endpoint
const SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

interface HealthDataBatch {
    deviceId: string;
    deviceName: string;
    userId: string;
    data: BLEHealthData[];
    syncedAt?: string;
}

class DataSyncService {
    private dataBuffer: BLEHealthData[] = [];
    private syncTimer: ReturnType<typeof setInterval> | null = null;
    private deviceId: string = '';
    private deviceName: string = '';
    private userId: string = 'user_001'; // Default user ID

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

        const batch: HealthDataBatch = {
            deviceId: this.deviceId,
            deviceName: this.deviceName,
            userId: this.userId,
            data: [...this.dataBuffer],
            syncedAt: new Date().toISOString(),
        };

        console.log(`[DataSync] Syncing ${batch.data.length} records to server...`);

        try {
            const response = await fetch(MOCK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(batch),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[DataSync] ✅ Sync successful! Server response:', result);

                // Clear buffer after successful sync
                this.dataBuffer = [];
                return true;
            } else {
                console.error('[DataSync] ❌ Sync failed:', response.status, response.statusText);
                return false;
            }
        } catch (error) {
            console.error('[DataSync] ❌ Sync error:', error);
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
