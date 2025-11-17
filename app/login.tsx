import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useThemeColors } from '../contexts/ThemeContext';
import { apiService, LoginRequest } from '../services/api';
import { authService } from '../services/authService';
import { authToasts, showToast } from '../utils/toast';

export default function LoginScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        // Validate inputs
        if (!username.trim()) {
            showToast.error('Please enter your username');
            return;
        }

        if (!password.trim()) {
            showToast.error('Please enter your password');
            return;
        }

        setLoading(true);

        try {
            const loginData: LoginRequest = {
                username: username.trim(),
                password: password,
            };

            const response = await apiService.login(loginData);

            // Save user info
            await authService.saveUserInfo({
                username: username.trim(),
            });

            console.log('[Login] Login successful');
            authToasts.loginSuccess();

            // Navigate to main app after a short delay to show toast
            setTimeout(() => {
                router.replace('/(tabs)/health');
            }, 500);
        } catch (error: any) {
            console.error('[Login] Login failed:', error);
            authToasts.loginError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = () => {
        router.push('/register' as any);
    };

    const handleOAuthLogin = (provider: string) => {
        showToast.info(`${provider} login will be implemented in future updates.`, 'Coming Soon');
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Hide default header */}
                <Stack.Screen options={{ headerShown: false }} />
                {/* Logo/Title */}
                <View style={styles.header}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.tint }]}>
                        <Ionicons name="fitness" size={48} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Sign in to continue tracking your health
                    </Text>
                </View>

                {/* Login Form */}
                <View style={styles.form}>
                    {/* Username Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Username</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.divider }]}>
                            <Ionicons name="person-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your username"
                                placeholderTextColor={colors.placeholder}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.divider }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your password"
                                placeholderTextColor={colors.placeholder}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={20}
                                    color={colors.placeholder}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: colors.tint }, loading && styles.disabledButton]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.loginButtonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
                        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                    </View>

                    {/* OAuth Login Options */}
                    <View style={styles.oauthContainer}>
                        <TouchableOpacity
                            style={[styles.oauthButton, { backgroundColor: colors.cardBackground, borderColor: colors.divider }]}
                            onPress={() => handleOAuthLogin('Google')}
                            disabled={loading}
                        >
                            <Ionicons name="logo-google" size={24} color="#DB4437" />
                            <Text style={[styles.oauthButtonText, { color: colors.text }]}>Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.oauthButton, { backgroundColor: colors.cardBackground, borderColor: colors.divider }]}
                            onPress={() => handleOAuthLogin('Apple')}
                            disabled={loading}
                        >
                            <Ionicons name="logo-apple" size={24} color={colors.text} />
                            <Text style={[styles.oauthButtonText, { color: colors.text }]}>Apple</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Register Link */}
                    <View style={styles.registerContainer}>
                        <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                            Don't have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={handleRegister} disabled={loading}>
                            <Text style={[styles.registerLink, { color: colors.tint }]}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    eyeIcon: {
        padding: 4,
    },
    loginButton: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    disabledButton: {
        opacity: 0.6,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
    },
    oauthContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    oauthButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    oauthButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerText: {
        fontSize: 16,
    },
    registerLink: {
        fontSize: 16,
        fontWeight: '700',
    },
});
