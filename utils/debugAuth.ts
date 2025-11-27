// Debug utility to check authentication status
import { authService } from '../services/authService';

export const debugAuth = {
    /**
     * Check and log current authentication status
     */
    async checkStatus(): Promise<void> {
        console.log('=== AUTH DEBUG ===');

        const token = await authService.getAccessToken();
        const userInfo = await authService.getUserInfo();
        const isLoggedIn = await authService.isLoggedIn();

        console.log('Token exists:', !!token);
        if (token) {
            console.log('Token length:', token.length);
            console.log('Token preview:', token.substring(0, 50) + '...');
        }
        console.log('User info:', userInfo);
        console.log('Is logged in:', isLoggedIn);
        console.log('==================');
    },

    /**
     * Clear all auth data (for testing)
     */
    async clearAll(): Promise<void> {
        await authService.clearTokens();
        console.log('[DEBUG] All auth data cleared');
    },
};
