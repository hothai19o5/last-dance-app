import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

export interface NotificationSettings {
    alertNotificationsEnabled: boolean;
    healthAlertsEnabled: boolean;
    deviceAlertsEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
    alertNotificationsEnabled: true,
    healthAlertsEnabled: true,
    deviceAlertsEnabled: true,
};

export const notificationSettingsService = {
    /**
     * Get notification settings
     */
    async getSettings(): Promise<NotificationSettings> {
        try {
            const settingsJson = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
            if (settingsJson) {
                return JSON.parse(settingsJson);
            }
            return DEFAULT_SETTINGS;
        } catch (error) {
            console.error('[NotificationSettings] Failed to get settings:', error);
            return DEFAULT_SETTINGS;
        }
    },

    /**
     * Save notification settings
     */
    async saveSettings(settings: NotificationSettings): Promise<void> {
        try {
            await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
            console.log('[NotificationSettings] Settings saved:', settings);
        } catch (error) {
            console.error('[NotificationSettings] Failed to save settings:', error);
        }
    },

    /**
     * Toggle alert notifications
     */
    async toggleAlertNotifications(enabled: boolean): Promise<void> {
        const settings = await this.getSettings();
        settings.alertNotificationsEnabled = enabled;
        await this.saveSettings(settings);
    },

    /**
     * Check if alert notifications are enabled
     */
    async isAlertNotificationsEnabled(): Promise<boolean> {
        const settings = await this.getSettings();
        return settings.alertNotificationsEnabled;
    },

    /**
     * Toggle health alerts
     */
    async toggleHealthAlerts(enabled: boolean): Promise<void> {
        const settings = await this.getSettings();
        settings.healthAlertsEnabled = enabled;
        await this.saveSettings(settings);
    },

    /**
     * Toggle device alerts
     */
    async toggleDeviceAlerts(enabled: boolean): Promise<void> {
        const settings = await this.getSettings();
        settings.deviceAlertsEnabled = enabled;
        await this.saveSettings(settings);
    },
};
