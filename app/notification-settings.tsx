import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../contexts/ThemeContext';
import { NotificationSettings, notificationSettingsService } from '../services/notificationSettings';
import { showToast } from '../utils/toast';

export default function NotificationSettingsScreen() {
    const colors = useThemeColors();
    const router = useRouter();
    const [settings, setSettings] = useState<NotificationSettings>({
        alertNotificationsEnabled: true,
        healthAlertsEnabled: true,
        deviceAlertsEnabled: true,
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const savedSettings = await notificationSettingsService.getSettings();
        setSettings(savedSettings);
    };

    const handleToggleAlertNotifications = async (value: boolean) => {
        setSettings(prev => ({ ...prev, alertNotificationsEnabled: value }));
        await notificationSettingsService.toggleAlertNotifications(value);
        showToast.success(
            value ? 'Alert notifications enabled' : 'Alert notifications disabled',
            'Settings Updated'
        );
    };

    const handleToggleHealthAlerts = async (value: boolean) => {
        setSettings(prev => ({ ...prev, healthAlertsEnabled: value }));
        await notificationSettingsService.toggleHealthAlerts(value);
        showToast.success(
            value ? 'Health alerts enabled' : 'Health alerts disabled',
            'Settings Updated'
        );
    };

    const handleToggleDeviceAlerts = async (value: boolean) => {
        setSettings(prev => ({ ...prev, deviceAlertsEnabled: value }));
        await notificationSettingsService.toggleDeviceAlerts(value);
        showToast.success(
            value ? 'Device alerts enabled' : 'Device alerts disabled',
            'Settings Updated'
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            {/* Hide default header */}
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.tint} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Alert Notifications Section */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Alert Notifications</Text>
                    <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                        Receive notifications when abnormal vitals are detected from your device
                    </Text>

                    <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.error }]}>
                                <Ionicons name="warning" size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={[styles.settingTitle, { color: colors.text }]}>
                                    Alert Notifications
                                </Text>
                                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                                    High alert score notifications
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.alertNotificationsEnabled}
                            onValueChange={handleToggleAlertNotifications}
                            trackColor={{ false: colors.divider, true: colors.success }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Health Alerts Section */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Alerts</Text>

                    <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.heartRateColor }]}>
                                <Ionicons name="heart" size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={[styles.settingTitle, { color: colors.text }]}>
                                    Heart Rate Alerts
                                </Text>
                                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                                    Abnormal heart rate notifications
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.healthAlertsEnabled}
                            onValueChange={handleToggleHealthAlerts}
                            trackColor={{ false: colors.divider, true: colors.success }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Device Alerts Section */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Device Alerts</Text>

                    <View style={[styles.settingItem, { borderBottomColor: colors.divider, borderBottomWidth: 0 }]}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.info }]}>
                                <Ionicons name="bluetooth" size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={[styles.settingTitle, { color: colors.text }]}>
                                    Connection Alerts
                                </Text>
                                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                                    Device connection/disconnection
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.deviceAlertsEnabled}
                            onValueChange={handleToggleDeviceAlerts}
                            trackColor={{ false: colors.divider, true: colors.success }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: colors.info + '20', borderColor: colors.info }]}>
                    <Ionicons name="information-circle" size={24} color={colors.info} />
                    <Text style={[styles.infoText, { color: colors.info }]}>
                        Notifications will appear as toast messages at the top of the screen when enabled.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    placeholder: {
        width: 36,
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 24,
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 13,
    },
    infoCard: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 24,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
});
