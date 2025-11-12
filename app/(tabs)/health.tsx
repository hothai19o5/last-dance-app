import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import ActivityRings from '../../components/ActivityRings';
import AddMenuToggle from '../../components/AddMenuToggle';
import { useDevice } from '../../contexts/DeviceContext';
import { useTheme, useThemeColors } from '../../contexts/ThemeContext';
import { mockHealthMetrics, mockSleepData, mockWeightData } from '../../data/mockData';

const { width } = Dimensions.get('window');

export default function HealthScreen() {
    const { calories, steps, standing, moving } = mockHealthMetrics;
    const colors = useThemeColors();
    const { themeTransition } = useTheme();
    const { healthData, device, pendingSyncCount, forceSyncToServer } = useDevice();
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showAlert, setShowAlert] = useState(false);

    // Sử dụng dữ liệu từ device nếu có, nếu không dùng mock data
    const heartRate = healthData?.heartRate || 0;
    const spo2 = healthData?.spo2 || 0;
    const currentSteps = healthData?.steps || steps.current;
    const currentCalories = healthData?.calories || calories.current;
    const alertScore = healthData?.alertScore;

    // Show alert when alertScore is present and >= 0.5
    useEffect(() => {
        if (alertScore !== null && alertScore !== undefined && alertScore >= 0.5) {
            setShowAlert(true);
            // Auto hide after 10 seconds
            const timer = setTimeout(() => setShowAlert(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [alertScore]);

    // Fade animation on theme change
    useEffect(() => {
        const listener = themeTransition.addListener(({ value }) => {
            if (value === 0) {
                // Start fade out
                Animated.timing(fadeAnim, {
                    toValue: 0.7,
                    duration: 150,
                    useNativeDriver: true,
                }).start(() => {
                    // Fade back in
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                    }).start();
                });
            }
        });

        return () => {
            themeTransition.removeListener(listener);
        };
    }, [themeTransition, fadeAnim]);

    // Calculate overall completion percentage
    const caloriesPercent = (currentCalories / calories.goal) * 100;
    const stepsPercent = (currentSteps / steps.goal) * 100;
    const standingPercent = (standing.current / standing.goal) * 100;
    const overallPercent = (caloriesPercent + stepsPercent + standingPercent) / 3;

    // Calculate cookies earned (1 cookie per 50 calories)
    const cookiesEarned = Math.floor(currentCalories / 50);

    // Prepare ActivityRings data
    const activityData = [
        {
            value: stepsPercent / 100 > 1 ? 1 : stepsPercent / 100,
            color: colors.stepsColor,
            backgroundColor: colors.border,
        },
        {
            value: standingPercent / 100 > 1 ? 1 : standingPercent / 100,
            color: colors.standingColor,
            backgroundColor: colors.border,
        },
        {
            value: caloriesPercent / 100 > 1 ? 1 : caloriesPercent / 100,
            color: colors.caloriesColor,
            backgroundColor: colors.border,
        },
    ];

    const activityConfig = {
        width: 200,
        height: 200,
        radius: 80,
        ringSize: 16,
    };

    // Create mock history for charts (will be replaced with real data later)
    const mockHeartRateHistory = Array(12).fill(heartRate || 64);
    const mockSpO2History = Array(12).fill(spo2 || 98);

    const heartRateChartData = mockHeartRateHistory.map((bpm: number) => ({
        value: bpm,
    }));

    // Prepare SpO2 chart data
    const spO2ChartData = mockSpO2History.map((val: number) => ({
        value: val,
    }));

    // Prepare weight chart data (use available history or empty)
    const weightChartData = mockWeightData && mockWeightData.history
        ? mockWeightData.history.map((w: number, index: number) => ({
            value: w,
            label: index % 2 === 0 ? `${index}` : '',
        }))
        : [];

    // Menu items for add button
    const menuItems = [
        {
            icon: 'fitness' as const,
            iconColor: colors.heartRateColor,
            title: 'Add Workout',
            onPress: () => Alert.alert('Add Workout', 'Add a new workout session'),
        },
        {
            icon: 'water' as const,
            iconColor: colors.info,
            title: 'Log Water Intake',
            onPress: () => Alert.alert('Water Intake', 'Log your water consumption'),
        },
        {
            icon: 'restaurant' as const,
            iconColor: colors.warning,
            title: 'Add Meal',
            onPress: () => Alert.alert('Add Meal', 'Log your meal and calories'),
        },
        {
            icon: 'analytics' as const,
            iconColor: colors.success,
            title: 'Manual Entry',
            onPress: () => Alert.alert('Manual Entry', 'Manually enter health data'),
        },
    ];

    return (
        <Animated.ScrollView
            style={[styles.container, { backgroundColor: colors.background, opacity: fadeAnim }]}
        >
            <LinearGradient
                colors={colors.isDark ? ['rgba(0, 0, 0, 1)', 'rgba(36, 33, 33, 0.8)', 'rgba(75, 75, 82, 0.8)'] : ['rgba(255, 255, 255, 1)', 'rgba(242, 242, 247, 0.8)', 'rgba(242, 242, 247, 0)']}
                locations={[0, 0.7, 1]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Health</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {/* Pending Sync Badge */}
                        {pendingSyncCount > 0 && (
                            <TouchableOpacity
                                style={[styles.syncBadge, { backgroundColor: colors.info + '20', borderColor: colors.info }]}
                                onPress={async () => {
                                    const success = await forceSyncToServer();
                                    Alert.alert(
                                        success ? 'Sync Success' : 'Sync Failed',
                                        success ? `${pendingSyncCount} records synced to server` : 'Failed to sync data to server'
                                    );
                                }}
                            >
                                <Ionicons name="cloud-upload-outline" size={16} color={colors.info} />
                                <Text style={[styles.syncBadgeText, { color: colors.info }]}>{pendingSyncCount}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddMenu(true)}>
                            <Ionicons name="add-circle-outline" size={28} color={colors.info} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Alert Banner */}
                {showAlert && alertScore !== null && alertScore !== undefined && (
                    <View style={[styles.alertBanner, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}>
                        <Ionicons name="warning" size={24} color={colors.danger} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.alertTitle, { color: colors.danger }]}>⚠️ Abnormal Vitals Detected</Text>
                            <Text style={[styles.alertText, { color: colors.text }]}>
                                Alert Score: {(alertScore * 100).toFixed(0)}% • HR: {heartRate} bpm • SpO₂: {spo2}%
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowAlert(false)}>
                            <Ionicons name="close-circle" size={24} color={colors.danger} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Summary Circle */}
                <View style={styles.summaryContainer}>
                    <ActivityRings
                        data={activityData}
                        config={activityConfig}
                    />

                    {/* Achievement Card */}
                    <View style={[styles.achievementCard, { backgroundColor: colors.cardAchievementBackground }]}>
                        <Text style={styles.cookieEmoji}>🥯</Text>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>x{cookiesEarned}</Text>
                    </View>
                </View>
            </LinearGradient>


            <LinearGradient
                colors={colors.isDark ? ['rgba(75, 75, 82, 0.8)', 'rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 1)'] : ['rgba(242, 242, 247, 0)', 'rgba(242, 242, 247, 0.8)', 'rgba(242, 242, 247, 1)']}
                locations={[0, 0.3, 1]}
            >
                {/* Key Metrics */}
                <View style={styles.metricsGrid}>
                    <MetricCard
                        icon="flame"
                        iconColor={colors.caloriesColor}
                        label="Calories"
                        value={currentCalories}
                        unit="kcal"
                        goal={calories.goal}
                        colors={colors}
                    />
                    <MetricCard
                        icon="walk"
                        iconColor={colors.stepsColor}
                        label="Steps"
                        value={currentSteps}
                        unit="steps"
                        goal={steps.goal}
                        colors={colors}
                    />
                    <MetricCard
                        icon="trophy"
                        iconColor={colors.standingColor}
                        label="Standing"
                        value={standing.current}
                        unit="hrs"
                        goal={standing.goal}
                        colors={colors}
                    />
                    <MetricCard
                        icon="body"
                        iconColor={colors.movingColor}
                        label="Moving"
                        value={moving.minutes}
                        unit="min"
                        goal={null}
                        colors={colors}
                    />
                </View>                {/* Moving Time */}
                <TouchableOpacity style={[styles.movingCard, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.movingContent}>
                        <View style={[styles.circleIcon, { backgroundColor: colors.info }]}>
                            <Ionicons name="person" size={12} color={colors.iconOnColor} />
                        </View>
                        <Text style={[styles.movingText, { color: colors.text }]}>Moving {moving.minutes} mins</Text>
                    </View>
                </TouchableOpacity>

                {/* Detail Cards */}
                <View style={styles.detailCards}>
                    {/* Heart Rate Card */}
                    <TouchableOpacity style={[styles.detailCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.circleIcon, { backgroundColor: colors.heartRateIconBg }]}>
                                <Ionicons name="heart" size={12} color={colors.iconOnColor} />
                            </View>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Heart rate</Text>
                        </View>
                        <Text style={[styles.cardValue, { color: colors.text }]}>{heartRate} BPM</Text>
                        <Text style={[styles.cardSubtext, { color: colors.textSecondary }]}>
                            {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : 'No data'}
                        </Text>

                        {/* Heart Rate Chart */}
                        <View style={styles.chartContainer}>
                            <BarChart
                                data={heartRateChartData}
                                barWidth={6}
                                spacing={5}
                                barBorderRadius={4}
                                frontColor={colors.heartRateColor}
                                yAxisThickness={0}
                                xAxisThickness={0}
                                hideRules
                                hideYAxisText
                                height={60}
                                width={(width - 44) / 2 - 32}
                                noOfSections={3}
                            />
                        </View>
                    </TouchableOpacity>

                    {/* SpO2 Card */}
                    <TouchableOpacity style={[styles.detailCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.circleIcon, { backgroundColor: colors.spO2IconBg }]}>
                                <Ionicons name="water" size={12} color={colors.iconOnColor} />
                            </View>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>SpO2</Text>
                        </View>
                        <Text style={[styles.cardValue, { color: colors.text }]}>{spo2} %</Text>
                        <Text style={[styles.cardSubtext, { color: colors.textSecondary }]}>
                            {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : 'No data'}
                        </Text>

                        {/* SpO2 Chart */}
                        <View style={styles.chartContainer}>
                            <BarChart
                                data={spO2ChartData}
                                barWidth={6}
                                spacing={5}
                                barBorderRadius={4}
                                frontColor={colors.spO2Color}
                                yAxisThickness={0}
                                xAxisThickness={0}
                                hideRules
                                hideYAxisText
                                height={60}
                                width={(width - 44) / 2 - 32}
                                noOfSections={3}
                            />
                        </View>
                    </TouchableOpacity>

                    {/* Weight Card */}
                    <TouchableOpacity style={[styles.detailCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.circleIcon, { backgroundColor: colors.weightIconBg }]}>
                                <Ionicons name="scale" size={12} color={colors.iconOnColor} />
                            </View>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Weight</Text>
                        </View>
                        <Text style={[styles.cardValue, { color: colors.text }]}>{mockWeightData.weight} kg</Text>
                        <Text style={[styles.cardSubtext, { color: colors.textSecondary }]}>{mockWeightData.date}</Text>

                        {/* Weight Chart */}
                        <View style={styles.chartContainer}>
                            <LineChart
                                data={weightChartData}
                                spacing={16}
                                yAxisThickness={0}
                                xAxisThickness={0}
                                hideRules
                                hideYAxisText
                                height={60}
                                width={(width - 44) / 2 - 32}
                                noOfSections={3}
                                color={colors.weightColor}
                                dataPointsColor={colors.weightColor}
                                startFillColor={colors.weightColor}
                                endFillColor={colors.weightColor}
                                startOpacity={0.4}
                                endOpacity={0.1}
                            />
                        </View>
                    </TouchableOpacity>

                    {/* Sleep Card */}
                    <TouchableOpacity style={[styles.detailCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.circleIcon, { backgroundColor: colors.sleepIconBg }]}>
                                <Ionicons name="moon" size={12} color={colors.iconOnColor} />
                            </View>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Sleep</Text>
                        </View>
                        <Text style={[styles.cardValue, { color: colors.text }]}>{mockSleepData.duration}</Text>
                        <Text style={[styles.cardSubtext, { color: colors.textSecondary }]}>
                            {mockSleepData.date} {mockSleepData.quality}
                        </Text>

                        {/* Quality Bar */}
                        <View style={styles.qualityBarContainer}>
                            <View style={[styles.qualityBar, { backgroundColor: colors.border }]}>
                                <View
                                    style={[
                                        styles.qualityBarFill,
                                        { width: `${mockSleepData.qualityScore}%`, backgroundColor: colors.sleepColor }
                                    ]}
                                />
                                <View
                                    style={[
                                        styles.qualityIndicator,
                                        { left: `${mockSleepData.qualityScore}%`, backgroundColor: colors.sleepColor }
                                    ]}
                                />
                            </View>
                            <View style={styles.qualityLabels}>
                                <Text style={[styles.qualityLabel, { color: colors.textSecondary }]}>Poor</Text>
                                <Text style={[styles.qualityLabel, { color: colors.textSecondary }]}>Excellent</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                </View>
            </LinearGradient>


            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />

            {/* Add Menu Toggle */}
            <AddMenuToggle
                visible={showAddMenu}
                onClose={() => setShowAddMenu(false)}
                menuItems={menuItems}
                title="Add Health Data"
            />
        </Animated.ScrollView>
    );
}

// Metric Card Component
interface MetricCardProps {
    icon: any;
    iconColor: string;
    label: string;
    value: number;
    unit: string;
    goal: number | null;
    colors?: any;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, iconColor, label, value, unit, goal, colors }) => {
    const themeColors = colors || useThemeColors();
    return (
        <TouchableOpacity style={[styles.metricCard, { backgroundColor: themeColors.cardBackground }]}>
            <View style={[styles.circleIcon, { backgroundColor: iconColor }]}>
                <Ionicons name={icon} size={14} color='#FFFFFF' />
            </View>
            <Text style={[styles.metricLabel, { color: themeColors.text }]}>{label}</Text>
            <Text style={[styles.metricValue, { color: themeColors.text }]}>{value}</Text>
            <Text style={[styles.metricGoal, { color: themeColors.textSecondary }]}>
                {goal !== null ? `/${goal}${unit}` : unit}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 0,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
    },
    addButton: {
        padding: 4,
    },
    syncBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        gap: 6,
    },
    syncBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    alertText: {
        fontSize: 13,
        opacity: 0.8,
    },
    summaryContainer: {
        paddingVertical: 0,
        alignItems: 'center',
        position: 'relative',
        justifyContent: 'center',
    },
    achievementCard: {
        position: 'absolute',
        right: 20,
        bottom: 16,
        borderRadius: 30,
        padding: 8,
        paddingLeft: 12,
        paddingRight: 12,
        flexDirection: 'column',
        alignItems: 'center',
    },
    cookieEmoji: {
        fontSize: 40,
    },
    metricsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
    },
    metricCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: 'flex-start',
    },
    metricLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '600',
        marginTop: 4,
    },
    metricGoal: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    movingCard: {
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        padding: 16,
    },
    movingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    movingText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    detailCards: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 12,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    detailCard: {
        borderRadius: 12,
        padding: 10,
        width: (width - 44) / 2, // Two cards per row with 16px padding and 16px gap
        marginBottom: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    circleIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    cardValue: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardSubtext: {
        fontSize: 14,
        marginBottom: 16,
    },
    qualityBarContainer: {
        marginTop: 8,
    },
    qualityBar: {
        height: 6,
        borderRadius: 3,
        position: 'relative',
    },
    qualityBarFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        borderRadius: 3,
    },
    qualityIndicator: {
        position: 'absolute',
        top: -4,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        marginLeft: -7,
    },
    qualityLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    qualityLabel: {
        fontSize: 12,
    },
    chartContainer: {
        marginTop: 8,
        alignItems: 'center',
    },
    bottomSpacing: {
        height: 50,
    },
});
