import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockHealthMetrics, mockSleepData, mockHeartRateData, mockSpO2Data, mockWeightData } from '../../data/mockData';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { useTheme, useThemeColors } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function HealthScreen() {
    const { calories, steps, standing, moving } = mockHealthMetrics;
    const colors = useThemeColors();
    const { themeTransition } = useTheme();
    const fadeAnim = useRef(new Animated.Value(1)).current;

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
    const caloriesPercent = (calories.current / calories.goal) * 100;
    const stepsPercent = (steps.current / steps.goal) * 100;
    const standingPercent = (standing.current / standing.goal) * 100;
    const overallPercent = (caloriesPercent + stepsPercent + standingPercent) / 3;

    // Calculate cookies earned (1 cookie per 50 calories)
    const cookiesEarned = Math.floor(calories.current / 50);

    // Prepare gauge data (sorted from outer to inner: Steps, Standing, Calories)
    const gaugeData = [
        {
            value: steps.current,
            maxValue: steps.goal,
            color: '#34C759',
            label: 'Steps',
        },
        {
            value: standing.current,
            maxValue: standing.goal,
            color: '#FFD60A',
            label: 'Standing',
        },
        {
            value: calories.current,
            maxValue: calories.goal,
            color: '#FF453A',
            label: 'Calories',
        },
    ];

    // Prepare heart rate chart data
    const heartRateChartData = mockHeartRateData.history.slice(-12).map((bpm, index) => ({
        value: bpm,
        label: index % 3 === 0 ? `${index}h` : '',
    }));

    // Prepare SpO2 chart data (fall back to empty array if not available)
    const spO2ChartData = mockSpO2Data && mockSpO2Data.history
        ? mockSpO2Data.history.slice(-12).map((val, index) => ({
            value: val,
            label: index % 3 === 0 ? `${index}h` : '',
        }))
        : [];

    // Prepare weight chart data (use available history or empty)
    const weightChartData = mockWeightData && mockWeightData.history
        ? mockWeightData.history.map((w, index) => ({
            value: w,
            label: index % 2 === 0 ? `${index}` : '',
        }))
        : [];

    return (
        <Animated.ScrollView
            style={[styles.container, { backgroundColor: colors.background, opacity: fadeAnim }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Health</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Ionicons name="add-circle-outline" size={28} color={colors.info} />
                </TouchableOpacity>
            </View>

            {/* Summary Circle */}
            <View style={[styles.summaryContainer, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.circleContainer}>
                    {/* Outer Ring - Steps */}
                    <View style={[styles.ring, styles.ringOuter, { borderColor: colors.border }]}>
                        <View style={[styles.ringProgress, {
                            borderColor: colors.stepsColor,
                            borderTopWidth: 8,
                            borderRightWidth: stepsPercent > 25 ? 8 : 0,
                            borderBottomWidth: stepsPercent > 50 ? 8 : 0,
                            borderLeftWidth: stepsPercent > 75 ? 8 : 0,
                        }]} />
                    </View>

                    {/* Middle Ring - Standing */}
                    <View style={[styles.ring, styles.ringMiddle, { borderColor: colors.border }]}>
                        <View style={[styles.ringProgress, {
                            borderColor: colors.standingColor,
                            borderTopWidth: 6,
                            borderRightWidth: standingPercent > 25 ? 6 : 0,
                            borderBottomWidth: standingPercent > 50 ? 6 : 0,
                            borderLeftWidth: standingPercent > 75 ? 6 : 0,
                        }]} />
                    </View>

                    {/* Inner Ring - Calories */}
                    <View style={[styles.ring, styles.ringInner, { borderColor: colors.border }]}>
                        <View style={[styles.ringProgress, {
                            borderColor: colors.caloriesColor,
                            borderTopWidth: 5,
                            borderRightWidth: caloriesPercent > 25 ? 5 : 0,
                            borderBottomWidth: caloriesPercent > 50 ? 5 : 0,
                            borderLeftWidth: caloriesPercent > 75 ? 5 : 0,
                        }]} />
                    </View>

                    {/* Center Content */}
                    <View style={styles.circleCenter}>
                        <Text style={[styles.percentText, { color: colors.text }]}>{Math.round(overallPercent)}%</Text>
                    </View>
                </View>

                {/* Achievement Card */}
                <View style={[styles.achievementCard, { backgroundColor: colors.background }]}>
                    <Text style={styles.cookieEmoji}>🍪</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.warning }}>x {cookiesEarned}</Text>
                </View>
            </View>

            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
                <MetricCard
                    icon="flame"
                    iconColor={colors.caloriesColor}
                    label="Calories"
                    value={calories.current}
                    unit="kcal"
                    goal={calories.goal}
                    colors={colors}
                />
                <MetricCard
                    icon="footsteps"
                    iconColor={colors.stepsColor}
                    label="Steps"
                    value={steps.current}
                    unit="steps"
                    goal={steps.goal}
                />
                <MetricCard
                    icon="time"
                    iconColor={colors.standingColor}
                    label="Standing"
                    value={standing.current}
                    unit="hrs"
                    goal={standing.goal}
                    colors={colors}
                />
            </View>

            {/* Moving Time */}
            <TouchableOpacity style={[styles.movingCard, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.movingContent}>
                    <Ionicons name="walk" size={24} color={colors.info} />
                    <Text style={[styles.movingText, { color: colors.text }]}>Moving {moving.minutes}mins</Text>
                </View>
            </TouchableOpacity>

            {/* Detail Cards */}
            <View style={styles.detailCards}>
                {/* Heart Rate Card */}
                <TouchableOpacity style={[styles.detailCard, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="heart" size={24} color={colors.heartRateColor} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Heart rate</Text>
                    </View>
                    <Text style={[styles.cardValue, { color: colors.text }]}>{mockHeartRateData.bpm} BPM</Text>
                    <Text style={[styles.cardSubtext, { color: colors.textSecondary }]}>{mockHeartRateData.timestamp}</Text>

                    {/* Heart Rate Chart */}
                    <View style={styles.chartContainer}>
                        <BarChart
                            data={heartRateChartData}
                            barWidth={10}
                            spacing={6}
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
                        <Ionicons name="water" size={24} color={colors.spO2Color} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>SpO2</Text>
                    </View>
                    <Text style={[styles.cardValue, { color: colors.text }]}>{mockSpO2Data.percentage} %</Text>
                    <Text style={[styles.cardSubtext, { color: colors.textSecondary }]}>{mockSpO2Data.timestamp}</Text>

                    {/* SpO2 Chart */}
                    <View style={styles.chartContainer}>
                        <BarChart
                            data={spO2ChartData}
                            barWidth={10}
                            spacing={6}
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
                        <Ionicons name="scale" size={24} color={colors.weightColor} />
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
                        <Ionicons name="moon" size={24} color={colors.sleepColor} />
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

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
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
    goal: number;
    colors?: any;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, iconColor, label, value, unit, goal, colors }) => {
    const themeColors = colors || useThemeColors();
    return (
        <TouchableOpacity style={[styles.metricCard, { backgroundColor: themeColors.cardBackground }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
            <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>{label}</Text>
            <Text style={[styles.metricValue, { color: themeColors.text }]}>{value}</Text>
            <Text style={[styles.metricGoal, { color: themeColors.textSecondary }]}>/{goal}{unit}</Text>
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
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
    },
    addButton: {
        padding: 4,
    },
    summaryContainer: {
        paddingVertical: 30,
        alignItems: 'center',
        position: 'relative',
    },
    circleContainer: {
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ring: {
        position: 'absolute',
        borderRadius: 100,
        backgroundColor: 'transparent',
    },
    ringOuter: {
        width: 180,
        height: 180,
        borderWidth: 8,
    },
    ringMiddle: {
        width: 150,
        height: 150,
        borderWidth: 6,
    },
    ringInner: {
        width: 120,
        height: 120,
        borderWidth: 5,
    },
    ringProgress: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
        borderColor: 'transparent',
        transform: [{ rotate: '-90deg' }],
    },
    circleCenter: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentText: {
        fontSize: 28,
        fontWeight: '600',
    },
    // i want achievement card in bottom right corner of summary container
    achievementCard: {
        position: 'absolute',
        right: 20,
        bottom: 16,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'column',
        alignItems: 'center',
    },
    cookieEmoji: {
        fontSize: 40,
    },
    metricsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 12,
    },
    metricCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: 'flex-start',
    },
    metricLabel: {
        fontSize: 12,
        marginTop: 8,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '600',
        marginTop: 4,
    },
    metricGoal: {
        fontSize: 12,
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
        fontWeight: '500',
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
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    cardValue: {
        fontSize: 32,
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
        height: 100,
    },
});
