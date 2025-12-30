import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { apiService, UpdateUserRequest } from './api';

const USER_PROFILE_KEY = '@user_profile';
const USER_AVATAR_KEY = '@user_avatar';

export const userProfileService = {
    /**
     * Calculate age from date of birth
     */
    calculateAge(dob: string | undefined): number {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    },

    /**
     * Save user profile to both API and AsyncStorage
     */
    async saveProfile(profile: Partial<UserProfile>): Promise<void> {
        try {
            // Prepare data for API - only send fields that API accepts
            const apiData: UpdateUserRequest = {};
            if (profile.firstName !== undefined) apiData.firstName = profile.firstName;
            if (profile.lastName !== undefined) apiData.lastName = profile.lastName;
            if (profile.email !== undefined) apiData.email = profile.email;
            if (profile.gender !== undefined) apiData.gender = profile.gender;
            if (profile.heightM !== undefined) apiData.heightM = profile.heightM;
            if (profile.weightKg !== undefined) apiData.weightKg = profile.weightKg;
            if (profile.dob !== undefined) apiData.dob = profile.dob;

            // Call API to update user profile
            console.log('[UserProfile] Calling API to update profile:', apiData);
            const response = await apiService.updateUser(apiData);
            console.log('[UserProfile] API update response:', response);

            // Calculate age from dob if available
            const age = this.calculateAge(profile.dob || response.data?.dob);

            // Merge API response with local profile and save to AsyncStorage
            const existingProfile = await this.getProfile();
            const updatedProfile: UserProfile = {
                ...existingProfile,
                ...profile,
                ...response.data,
                age,
            };

            await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
            console.log('[UserProfile] Profile saved successfully:', updatedProfile);
        } catch (error) {
            console.error('[UserProfile] Error saving profile:', error);
            throw error;
        }
    },

    /**
     * Save user profile to local storage only (without API call)
     */
    async saveProfileLocal(profile: Partial<UserProfile>): Promise<void> {
        try {
            const existingProfile = await this.getProfile();
            const updatedProfile = {
                ...existingProfile,
                ...profile,
            };
            await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
            console.log('[UserProfile] Profile saved locally:', updatedProfile);
        } catch (error) {
            console.error('[UserProfile] Error saving profile locally:', error);
            throw error;
        }
    },

    /**
     * Get user profile from AsyncStorage
     */
    async getProfile(): Promise<UserProfile | null> {
        try {
            const profileData = await AsyncStorage.getItem(USER_PROFILE_KEY);
            if (profileData) {
                const profile = JSON.parse(profileData);
                // Calculate age from dob if available
                if (profile.dob) {
                    profile.age = this.calculateAge(profile.dob);
                }
                console.log('[UserProfile] Profile loaded:', profile);
                return profile;
            }
            return null;
        } catch (error) {
            console.error('[UserProfile] Error loading profile:', error);
            return null;
        }
    },

    /**
     * Fetch user profile from API and update local storage
     */
    async fetchProfileFromApi(): Promise<UserProfile | null> {
        try {
            console.log('[UserProfile] Fetching profile from API...');
            const response = await apiService.getUserDetail();

            if (response.data) {
                const profile: UserProfile = {
                    ...response.data,
                    age: this.calculateAge(response.data.dob),
                };

                // Save to local storage
                await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
                console.log('[UserProfile] Profile fetched and saved:', profile);
                return profile;
            }
            return null;
        } catch (error) {
            console.error('[UserProfile] Error fetching profile from API:', error);
            // Fall back to local profile if API fails
            return this.getProfile();
        }
    },

    /**
     * Upload user avatar to server
     * @param imageUri - URI of the selected image
     * @returns URL of the uploaded avatar from server
     */
    async saveAvatar(imageUri: string): Promise<string> {
        try {
            console.log('[UserProfile] Uploading avatar to server:', imageUri);

            // Upload to server
            const response = await apiService.uploadAvatar(imageUri);
            const serverAvatarUrl = response.data;

            console.log('[UserProfile] Avatar uploaded, server URL:', serverAvatarUrl);

            // Save server URL to AsyncStorage
            await AsyncStorage.setItem(USER_AVATAR_KEY, serverAvatarUrl);

            // Update profile with new avatar URL
            await this.saveProfileLocal({ profilePictureUrl: serverAvatarUrl });

            console.log('[UserProfile] Avatar saved successfully:', serverAvatarUrl);
            return serverAvatarUrl;
        } catch (error) {
            console.error('[UserProfile] Error uploading avatar:', error);
            throw error;
        }
    },

    /**
     * Get user avatar URI
     */
    async getAvatar(): Promise<string | null> {
        try {
            const avatarUri = await AsyncStorage.getItem(USER_AVATAR_KEY);
            return avatarUri;
        } catch (error) {
            console.error('[UserProfile] Error loading avatar:', error);
            return null;
        }
    },

    /**
     * Delete user avatar
     */
    async deleteAvatar(): Promise<void> {
        try {
            await AsyncStorage.removeItem(USER_AVATAR_KEY);
            await this.saveProfile({ profilePictureUrl: undefined });
            console.log('[UserProfile] Avatar deleted successfully');
        } catch (error) {
            console.error('[UserProfile] Error deleting avatar:', error);
            throw error;
        }
    },

    /**
     * Clear all user profile data
     */
    async clearProfile(): Promise<void> {
        try {
            await this.deleteAvatar();
            await AsyncStorage.removeItem(USER_PROFILE_KEY);
            console.log('[UserProfile] Profile cleared successfully');
        } catch (error) {
            console.error('[UserProfile] Error clearing profile:', error);
            throw error;
        }
    },

    /**
     * Initialize default profile
     */
    async initializeProfile(userId: string, name: string): Promise<UserProfile> {
        const defaultProfile: UserProfile = {
            id: Number(userId),
            username: name,
            firstName: '',
            lastName: '',
            email: '',
            dob: '',
            gender: 'MALE',
            heightM: 0,
            weightKg: 0,
            age: 0,
            bmi: 0,
            enable: true,
        };
        await this.saveProfile(defaultProfile);
        return defaultProfile;
    },
};
