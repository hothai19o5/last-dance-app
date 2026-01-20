// Calorie Calculator - BMR and Activity-based calories
import { UserProfile } from '@/types';

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

/**
 * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor equation
 * This is more accurate for modern populations than Harris-Benedict
 * 
 * Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
 * Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
 * 
 * @param profile User profile containing weight, height, age, gender
 * @returns BMR in calories per day
 */
export function calculateBMR(profile: UserProfile): number {
    const { weightKg, heightM, gender, dob } = profile;

    // Validate required fields
    if (!weightKg || !heightM || !gender || !dob) {
        console.warn('[CalorieCalculator] Missing required fields for BMR calculation');
        return 0;
    }

    const heightCm = heightM * 100; // Convert meters to centimeters
    const age = calculateAge(dob);

    let bmr: number;

    if (gender === 'MALE') {
        bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    } else {
        bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }

    return Math.round(bmr);
}

/**
 * Calculate calories burned from steps
 * Simple formula: ~0.04 calories per step (walking average)
 * 
 * @param steps Number of steps
 * @returns Calories burned
 */
export function calculateActivityCalories(
    steps: number,
    _activityStatus: number = 2, // Not used anymore, kept for compatibility
    _weightKg: number = 70 // Not used anymore, kept for compatibility
): number {
    if (steps <= 0) {
        return 0;
    }

    // Simple formula: 0.04 calories per step (average for walking)
    const caloriesPerStep = 0.04;
    return Math.round(steps * caloriesPerStep);
}

/**
 * Calculate total daily calories (BMR + Activity)
 * 
 * @param profile User profile
 * @param steps Total steps for the day
 * @param activityStatus Current activity status
 * @returns Total calories burned for the day
 */
export function calculateTotalDailyCalories(
    profile: UserProfile,
    steps: number,
    activityStatus: number = 2
): number {
    const bmr = calculateBMR(profile);
    const activityCalories = calculateActivityCalories(
        steps,
        activityStatus,
        profile.weightKg || 70
    );

    // BMR is per day, we calculate it proportionally based on time of day
    // For simplicity, we can use the full BMR + activity calories
    // Or divide BMR by 24 hours and multiply by elapsed hours

    // Here we return just the activity calories since BMR is passive
    // The total would be BMR + activity, but for tracking purposes
    // we often show just active calories
    return activityCalories;
}

/**
 * Calculate moving time based on steps
 * Simple formula: ~100 steps per minute (average walking pace)
 * 
 * @param steps Number of steps
 * @returns Moving time in minutes
 */
export function calculateMovingTime(
    steps: number,
    _activityStatus: number = 2 // Not used anymore, kept for compatibility
): number {
    if (steps <= 0) {
        return 0;
    }

    // Simple formula: 100 steps per minute (average walking pace)
    const stepsPerMinute = 100;
    return Math.round(steps / stepsPerMinute);
}

/**
 * Get activity status label
 */
export function getActivityLabel(activityStatus: number): string {
    switch (activityStatus) {
        case 0:
            return 'Sleeping';
        case 1:
            return 'Resting';
        case 2:
            return 'Walking';
        case 3:
            return 'Running';
        default:
            return 'Unknown';
    }
}
