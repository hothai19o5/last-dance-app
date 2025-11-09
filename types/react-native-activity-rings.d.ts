declare module 'react-native-activity-rings' {
    import { Component } from 'react';

    export interface ActivityRingData {
        label?: string;
        value: number;
        color?: string;
        backgroundColor?: string;
    }

    export interface ActivityRingConfig {
        width?: number;
        height?: number;
        radius?: number;
        ringSize?: number;
    }

    export interface ActivityRingsProps {
        data: ActivityRingData[];
        config?: ActivityRingConfig;
    }

    export default class ActivityRings extends Component<ActivityRingsProps> { }
}
