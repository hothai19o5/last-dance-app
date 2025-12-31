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
 * Calculate calories burned from steps based on activity type
 * 
 * Walking: ~0.04 calories per step (varies by weight)
 * Running: ~0.06 calories per step (varies by weight)
 * 
 * More accurate formula considers weight:
 * Walking: calories = steps × weight(kg) × 0.00048
 * Running: calories = steps × weight(kg) × 0.00072
 * 
 * @param steps Number of steps
 * @param activityStatus 0=sleeping, 1=resting, 2=walking, 3=running
 * @param weightKg User's weight in kg
 * @returns Calories burned from activity
 */
export function calculateActivityCalories(
    steps: number,
    activityStatus: number = 2, // Default to walking
    weightKg: number = 70 // Default weight if not provided
): number {
    if (steps <= 0 || !weightKg) {
        return 0;
    }

    let caloriesPerStep: number;

    switch (activityStatus) {
        case 0: // Sleeping
            return 0; // No active calories during sleep
        case 1: // Resting
            return 0; // No active calories while resting
        case 2: // Walking
            caloriesPerStep = weightKg * 0.00048;
            break;
        case 3: // Running
            caloriesPerStep = weightKg * 0.00072;
            break;
        default:
            caloriesPerStep = weightKg * 0.00048; // Default to walking
    }

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
 * Calculate moving time based on steps and activity type
 * 
 * Walking: ~100 steps per minute (2000 steps/hour)
 * Running: ~160 steps per minute (3200 steps/hour)
 * 
 * @param steps Number of steps
 * @param activityStatus Activity type
 * @returns Moving time in minutes
 */
export function calculateMovingTime(
    steps: number,
    activityStatus: number = 2
): number {
    if (steps <= 0) {
        return 0;
    }

    let stepsPerMinute: number;

    switch (activityStatus) {
        case 0: // Sleeping
        case 1: // Resting
            return 0;
        case 2: // Walking
            stepsPerMinute = 100;
            break;
        case 3: // Running
            stepsPerMinute = 160;
            break;
        default:
            stepsPerMinute = 100;
    }

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
