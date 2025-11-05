import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockHealthMetrics, mockSleepData, mockHeartRateData, mockSpO2Data, mockWeightData } from '../../data/mockData';
import { BarChart, LineChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');

export default function HealthScreen() {
    const { calories, steps, standing, moving } = mockHealthMetrics;

    // Calculate overall completion percentage
    const caloriesPercent = (calories.current / calories.goal) * 100;
    const stepsPercent = (steps.current / steps.goal) * 100;
    const standingPercent = (standing.current / standing.goal) * 100;
    const overallPercent = (caloriesPercent + stepsPercent + standingPercent) / 3;

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
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Health</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Summary Circle */}
            <View style={styles.summaryContainer}>
                <View style={styles.circleContainer}>
                    {/* Outer Ring - Steps */}
                    <View style={[styles.ring, styles.ringOuter]}>
                        <View style={[styles.ringProgress, {
                            borderColor: '#34C759',
                            borderTopWidth: 8,
                            borderRightWidth: stepsPercent > 25 ? 8 : 0,
                            borderBottomWidth: stepsPercent > 50 ? 8 : 0,
                            borderLeftWidth: stepsPercent > 75 ? 8 : 0,
                        }]} />
                    </View>

                    {/* Middle Ring - Standing */}
                    <View style={[styles.ring, styles.ringMiddle]}>
                        <View style={[styles.ringProgress, {
                            borderColor: '#FFD60A',
                            borderTopWidth: 6,
                            borderRightWidth: standingPercent > 25 ? 6 : 0,
                            borderBottomWidth: standingPercent > 50 ? 6 : 0,
                            borderLeftWidth: standingPercent > 75 ? 6 : 0,
                        }]} />
                    </View>

                    {/* Inner Ring - Calories */}
                    <View style={[styles.ring, styles.ringInner]}>
                        <View style={[styles.ringProgress, {
                            borderColor: '#FF453A',
                            borderTopWidth: 5,
                            borderRightWidth: caloriesPercent > 25 ? 5 : 0,
                            borderBottomWidth: caloriesPercent > 50 ? 5 : 0,
                            borderLeftWidth: caloriesPercent > 75 ? 5 : 0,
                        }]} />
                    </View>

                    {/* Center Content */}
                    <View style={styles.circleCenter}>
                        <Text style={styles.percentText}>{Math.round(overallPercent)}%</Text>
                    </View>
                </View>

                {/* Achievement Icon */}
                <View style={styles.achievementIcon}>
                    <Text style={styles.cookieEmoji}>🍪</Text>
                    <Text style={{ fontSize: 16, paddingLeft: 12 }}>x2</Text>
                </View>
            </View>

            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
                <MetricCard
                    icon="flame"
                    iconColor="#FF453A"
                    label="Calories"
                    value={calories.current}
                    unit="kcal"
                    goal={calories.goal}
                />
                <MetricCard
                    icon="footsteps"
                    iconColor="#34C759"
                    label="Steps"
                    value={steps.current}
                    unit="steps"
                    goal={steps.goal}
                />
                <MetricCard
                    icon="time"
                    iconColor="#FFD60A"
                    label="Standing"
                    value={standing.current}
                    unit="hrs"
                    goal={standing.goal}
                />
            </View>

            {/* Moving Time */}
            <TouchableOpacity style={styles.movingCard}>
                <View style={styles.movingContent}>
                    <Ionicons name="walk" size={24} color="#007AFF" />
                    <Text style={styles.movingText}>Moving {moving.minutes}mins</Text>
                </View>
            </TouchableOpacity>

            {/* Detail Cards */}
            <View style={styles.detailCards}>
                {/* Heart Rate Card */}
                <TouchableOpacity style={styles.detailCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="heart" size={24} color="#FF453A" />
                        <Text style={styles.cardTitle}>Heart rate</Text>
                    </View>
                    <Text style={styles.cardValue}>{mockHeartRateData.bpm} BPM</Text>
                    <Text style={styles.cardSubtext}>{mockHeartRateData.timestamp}</Text>

                    {/* Heart Rate Chart */}
                    <View style={styles.chartContainer}>
                        <BarChart
                            data={heartRateChartData}
                            barWidth={10}
                            spacing={6}
                            barBorderRadius={4}
                            frontColor="#FF453A"
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
                <TouchableOpacity style={styles.detailCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="water" size={24} color="#FF453A" />
                        <Text style={styles.cardTitle}>SpO2</Text>
                    </View>
                    <Text style={styles.cardValue}>{mockSpO2Data.percentage} %</Text>
                    <Text style={styles.cardSubtext}>{mockSpO2Data.timestamp}</Text>

                    {/* SpO2 Chart */}
                    <View style={styles.chartContainer}>
                        <BarChart
                            data={spO2ChartData}
                            barWidth={10}
                            spacing={6}
                            barBorderRadius={4}
                            frontColor="#FF453A"
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
                <TouchableOpacity style={styles.detailCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="scale" size={24} color="#26c949ff" />
                        <Text style={styles.cardTitle}>Weight</Text>
                    </View>
                    <Text style={styles.cardValue}>{mockWeightData.weight} kg</Text>
                    <Text style={styles.cardSubtext}>{mockWeightData.date}</Text>

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
                        />
                    </View>
                </TouchableOpacity>

                {/* Sleep Card */}
                <TouchableOpacity style={styles.detailCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="moon" size={24} color="#5E5CE6" />
                        <Text style={styles.cardTitle}>Sleep</Text>
                    </View>
                    <Text style={styles.cardValue}>{mockSleepData.duration}</Text>
                    <Text style={styles.cardSubtext}>
                        {mockSleepData.date} {mockSleepData.quality}
                    </Text>

                    {/* Quality Bar */}
                    <View style={styles.qualityBarContainer}>
                        <View style={styles.qualityBar}>
                            <View
                                style={[
                                    styles.qualityBarFill,
                                    { width: `${mockSleepData.qualityScore}%` }
                                ]}
                            />
                            <View
                                style={[
                                    styles.qualityIndicator,
                                    { left: `${mockSleepData.qualityScore}%` }
                                ]}
                            />
                        </View>
                        <View style={styles.qualityLabels}>
                            <Text style={styles.qualityLabel}>Poor</Text>
                            <Text style={styles.qualityLabel}>Excellent</Text>
                        </View>
                    </View>
                </TouchableOpacity>

            </View>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
        </ScrollView>
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
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, iconColor, label, value, unit, goal }) => (
    <TouchableOpacity style={styles.metricCard}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricGoal}>/{goal}{unit}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#000',
    },
    addButton: {
        padding: 4,
    },
    summaryContainer: {
        backgroundColor: '#FFFFFF',
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
        borderColor: '#E5E5EA',
    },
    ringMiddle: {
        width: 150,
        height: 150,
        borderWidth: 6,
        borderColor: '#E5E5EA',
    },
    ringInner: {
        width: 120,
        height: 120,
        borderWidth: 5,
        borderColor: '#E5E5EA',
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
        color: '#000',
    },
    achievementIcon: {
        position: 'absolute',
        right: 30,
        top: 40,
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
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'flex-start',
    },
    metricLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 8,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000',
        marginTop: 4,
    },
    metricGoal: {
        fontSize: 12,
        color: '#8E8E93',
    },
    movingCard: {
        backgroundColor: '#FFFFFF',
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
        color: '#007AFF',
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
        backgroundColor: '#FFFFFF',
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
        color: '#000',
    },
    cardValue: {
        fontSize: 32,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    cardSubtext: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 16,
    },
    qualityBarContainer: {
        marginTop: 8,
    },
    qualityBar: {
        height: 6,
        backgroundColor: '#E5E5EA',
        borderRadius: 3,
        position: 'relative',
    },
    qualityBarFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        backgroundColor: '#5E5CE6',
        borderRadius: 3,
    },
    qualityIndicator: {
        position: 'absolute',
        top: -4,
        width: 14,
        height: 14,
        backgroundColor: '#5E5CE6',
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        marginLeft: -7,
    },
    qualityLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    qualityLabel: {
        fontSize: 12,
        color: '#8E8E93',
    },
    chartContainer: {
        marginTop: 8,
        alignItems: 'center',
    },
    bottomSpacing: {
        height: 100,
    },
});
