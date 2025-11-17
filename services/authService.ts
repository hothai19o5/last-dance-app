// Auth Service - Handle JWT token storage and management
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = '@access_token';
const USER_INFO_KEY = '@user_info';

export interface UserInfo {
    username: string;
    name?: string;
    email?: string;
}

class AuthService {
    /**
     * Save access token to AsyncStorage
     */
    async saveAccessToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
            console.log('[Auth] Access token saved');
        } catch (error) {
            console.error('[Auth] Failed to save access token:', error);
            throw error;
        }
    }

    /**
     * Get access token from AsyncStorage
     */
    async getAccessToken(): Promise<string | null> {
        try {
            const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
            return token;
        } catch (error) {
            console.error('[Auth] Failed to get access token:', error);
            return null;
        }
    }

    /**
     * Save user info to AsyncStorage
     */
    async saveUserInfo(userInfo: UserInfo): Promise<void> {
        try {
            await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
            console.log('[Auth] User info saved:', userInfo.username);
        } catch (error) {
            console.error('[Auth] Failed to save user info:', error);
            throw error;
        }
    }

    /**
     * Get user info from AsyncStorage
     */
    async getUserInfo(): Promise<UserInfo | null> {
        try {
            const userInfoJson = await AsyncStorage.getItem(USER_INFO_KEY);
            if (userInfoJson) {
                return JSON.parse(userInfoJson);
            }
            return null;
        } catch (error) {
            console.error('[Auth] Failed to get user info:', error);
            return null;
        }
    }

    /**
     * Clear all tokens and user info (logout)
     */
    async clearTokens(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, USER_INFO_KEY]);
            console.log('[Auth] All tokens and user info cleared');
        } catch (error) {
            console.error('[Auth] Failed to clear tokens:', error);
            throw error;
        }
    }

    /**
     * Check if user is logged in
     */
    async isLoggedIn(): Promise<boolean> {
        const token = await this.getAccessToken();
        return token !== null;
    }

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        console.log('[Auth] Logging out...');
        await this.clearTokens();
    }
}

// Export singleton instance
export const authService = new AuthService();
