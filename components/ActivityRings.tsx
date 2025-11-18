import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface RingProps {
    radius: number;
    stroke: number;
    color: string;
    percent: number;
    containerSize: number;
}

const Ring: React.FC<RingProps> = ({ radius, stroke, color, percent, containerSize }) => {
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    const center = containerSize / 2;

    // Create light background color from the ring color (20% opacity)
    const backgroundColor = color + '33'; // Add 33 for ~20% opacity in hex

    return (
        <Svg width={containerSize} height={containerSize} style={StyleSheet.absoluteFill}>
            {/* Background circle */}
            <Circle
                stroke={backgroundColor}
                fill="none"
                cx={center}
                cy={center}
                r={radius}
                strokeWidth={stroke}
            />
            {/* Progress circle */}
            <Circle
                stroke={color}
                fill="none"
                cx={center}
                cy={center}
                r={radius}
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${center}, ${center}`}
            />
        </Svg>
    );
};

interface ActivityRingData {
    value: number; // 0 to 1
    color: string;
}

interface ActivityRingsConfig {
    width: number;
    height: number;
    radius?: number;
    ringSize?: number;
}

interface ActivityRingsProps {
    data: ActivityRingData[];
    config: ActivityRingsConfig;
}

const ActivityRings: React.FC<ActivityRingsProps> = ({ data, config }) => {
    const { width, height, radius = 32, ringSize = 14 } = config;
    const spacing = 4; // Space between rings
    const containerSize = Math.max(width, height);

    return (
        <View style={[styles.container, { width, height }]}>
            {data.map((ring, index) => {
                const ringRadius = radius - (index * (ringSize + spacing));
                const percent = ring.value * 100;

                return (
                    <Ring
                        key={index}
                        radius={ringRadius}
                        stroke={ringSize}
                        color={ring.color}
                        percent={percent}
                        containerSize={containerSize}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
});

export default ActivityRings;
