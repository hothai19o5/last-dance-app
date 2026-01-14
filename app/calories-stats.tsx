import { statisticsService } from '@/services/statisticsService';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useThemeColors } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function CaloriesStatsScreen() {
    const colors = useThemeColors();
    const [range, setRange] = useState<'day' | 'week'>('day');
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<{ value: number; label: string }[]>([]);
    const [average, setAverage] = useState(0);
    const [total, setTotal] = useState(0);
    const [max, setMax] = useState(0);

    useEffect(() => {
        loadData();
    }, [range]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await statisticsService.getCaloriesStats(range);
            setChartData(data?.chartData ?? []);
            setAverage(data?.average ?? 0);
            setTotal(data?.total ?? 0);
            setMax(data?.max ?? 0);
        } catch (error) {
            console.error('Failed to load calories stats:', error);
            setChartData([]);
            setAverage(0);
            setTotal(0);
            setMax(0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Calories Statistics</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Range Toggle */}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        range === 'day' && styles.toggleButtonActive,
                        { borderColor: colors.border },
                        range === 'day' && { backgroundColor: colors.tint },
                    ]}
                    onPress={() => setRange('day')}
                >
                    <Text style={[styles.toggleText, { color: range === 'day' ? '#FFFFFF' : colors.text }]}>Day</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        range === 'week' && styles.toggleButtonActive,
                        { borderColor: colors.border },
                        range === 'week' && { backgroundColor: colors.tint },
                    ]}
                    onPress={() => setRange('week')}
                >
                    <Text style={[styles.toggleText, { color: range === 'week' ? '#FFFFFF' : colors.text }]}>Week</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            ) : (
                <>
                    {/* Summary Cards */}
                    <View style={styles.summaryContainer}>
                        <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Average</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>{average.toFixed(0)}</Text>
                            <Text style={[styles.summaryUnit, { color: colors.textSecondary }]}>kcal</Text>
                        </View>
                        <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>{total.toFixed(0)}</Text>
                            <Text style={[styles.summaryUnit, { color: colors.textSecondary }]}>kcal</Text>
                        </View>
                        <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Max</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>{max.toFixed(0)}</Text>
                            <Text style={[styles.summaryUnit, { color: colors.textSecondary }]}>kcal</Text>
                        </View>
                    </View>

                    {/* Chart */}
                    <View style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}>
                        <Text style={[styles.chartTitle, { color: colors.text }]}>
                            {range === 'day' ? 'Last 24 Hours' : 'Last 7 Days'}
                        </Text>
                        <View style={styles.chartContainer}>
                            <BarChart
                                data={chartData}
                                barWidth={range === 'day' ? 12 : 30}
                                spacing={range === 'day' ? 8 : 12}
                                barBorderRadius={4}
                                frontColor={colors.caloriesColor}
                                yAxisThickness={0}
                                xAxisThickness={1}
                                xAxisColor={colors.border}
                                hideRules
                                height={250}
                                width={width - 72}
                                noOfSections={4}
                                yAxisTextStyle={{ color: colors.textSecondary }}
                                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                            />
                        </View>
                    </View>
                </>
            )}
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
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 32,
    },
    toggleContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    toggleButtonActive: {
        borderWidth: 0,
    },
    toggleText: {
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    summaryUnit: {
        fontSize: 14,
        marginTop: 4,
    },
    chartCard: {
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 20,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    chartContainer: {
        alignItems: 'center',
    },
});
