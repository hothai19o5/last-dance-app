import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

const USER_PROFILE_KEY = '@user_profile';
const USER_AVATAR_KEY = '@user_avatar';

export const userProfileService = {
    /**
     * Save user profile to AsyncStorage
     */
    async saveProfile(profile: Partial<UserProfile>): Promise<void> {
        try {
            const existingProfile = await this.getProfile();
            const updatedProfile = {
                ...existingProfile,
                ...profile,
            };
            await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
            console.log('[UserProfile] Profile saved successfully:', updatedProfile);
        } catch (error) {
            console.error('[UserProfile] Error saving profile:', error);
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
     * Save user avatar to local storage
     * @param imageUri - URI of the selected image
     * @returns Local file path of the saved avatar
     */
    async saveAvatar(imageUri: string): Promise<string> {
        try {
            // Simply save the URI directly without copying
            // (For production, integrate with cloud storage like S3, Cloudinary, etc.)

            // Delete old avatar reference if exists
            const oldAvatarUri = await AsyncStorage.getItem(USER_AVATAR_KEY);

            // Save new avatar URI to AsyncStorage
            await AsyncStorage.setItem(USER_AVATAR_KEY, imageUri);

            // Update profile with new avatar
            await this.saveProfile({ avatar: imageUri });

            console.log('[UserProfile] Avatar saved successfully:', imageUri);
            return imageUri;
        } catch (error) {
            console.error('[UserProfile] Error saving avatar:', error);
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
            await this.saveProfile({ avatar: undefined });
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
            id: userId,
            name: name,
            gender: 'Male',
            height: 170,
            age: 25,
        };
        await this.saveProfile(defaultProfile);
        return defaultProfile;
    },
};
