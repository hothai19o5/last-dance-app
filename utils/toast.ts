// Toast Notification Utility
import Toast from 'react-native-toast-message';

export const showToast = {
    // Success Toast
    success: (message: string, title?: string) => {
        Toast.show({
            type: 'success',
            text1: title || 'Success',
            text2: message,
            position: 'top',
            visibilityTime: 3000,
            topOffset: 60,
        });
    },

    // Error Toast
    error: (message: string, title?: string) => {
        Toast.show({
            type: 'error',
            text1: title || 'Error',
            text2: message,
            position: 'top',
            visibilityTime: 4000,
            topOffset: 60,
        });
    },

    // Info Toast
    info: (message: string, title?: string) => {
        Toast.show({
            type: 'info',
            text1: title || 'Info',
            text2: message,
            position: 'top',
            visibilityTime: 3000,
            topOffset: 60,
        });
    },

    // Warning Toast
    warning: (message: string, title?: string) => {
        Toast.show({
            type: 'error', // Using error type with custom styling
            text1: title || 'Warning',
            text2: message,
            position: 'top',
            visibilityTime: 3500,
            topOffset: 60,
        });
    },
};

// Predefined toast messages for authentication
export const authToasts = {
    loginSuccess: () => showToast.success('Welcome back!', 'Login Successful'),
    loginError: (message?: string) => showToast.error(message || 'Invalid username or password', 'Login Failed'),
    registerSuccess: () => showToast.success('Account created successfully! Please login.', 'Registration Successful'),
    registerError: (message?: string) => showToast.error(message || 'Unable to register. Please try again.', 'Registration Failed'),
    logoutSuccess: () => showToast.success('You have been logged out', 'Logout Successful'),
    unauthorized: () => showToast.error('Please login again', 'Session Expired'),
};

// Predefined toast messages for device
export const deviceToasts = {
    syncSuccess: () => showToast.success('Device data synced successfully', 'Sync Complete'),
    syncError: (message?: string) => showToast.error(message || 'Failed to sync device data', 'Sync Failed'),
    connected: (deviceName: string) => showToast.success(`Connected to ${deviceName}`, 'Device Connected'),
    disconnected: () => showToast.info('Device disconnected', 'Disconnected'),
    connectionFailed: (deviceName: string) => showToast.error(`Could not connect to ${deviceName}. Make sure device is nearby and powered on.`, 'Connection Failed'),
};
