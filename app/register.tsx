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
import { apiService, RegistrationRequest } from '../services/api';
import { authToasts, showToast } from '../utils/toast';

export default function RegisterScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleRegister = async () => {
        // Validate inputs
        if (!name.trim()) {
            showToast.error('Please enter your name');
            return;
        }

        if (!email.trim()) {
            showToast.error('Please enter your email');
            return;
        }

        if (!validateEmail(email.trim())) {
            showToast.error('Please enter a valid email address');
            return;
        }

        if (!username.trim()) {
            showToast.error('Please enter a username');
            return;
        }

        if (username.trim().length < 3) {
            showToast.error('Username must be at least 3 characters long');
            return;
        }

        if (!password) {
            showToast.error('Please enter a password');
            return;
        }

        if (password.length < 6) {
            showToast.error('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            showToast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const registrationData: RegistrationRequest = {
                name: name.trim(),
                email: email.trim(),
                username: username.trim(),
                password: password,
            };

            const response = await apiService.register(registrationData);

            console.log('[Register] Registration successful:', response.message);
            authToasts.registerSuccess();

            // Navigate back to login after a short delay
            setTimeout(() => {
                router.back();
            }, 1000);
        } catch (error: any) {
            console.error('[Register] Registration failed:', error);
            authToasts.registerError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        router.back();
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Hide default header */}
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.tint }]}>
                        <Ionicons name="person-add" size={48} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Sign up to start tracking your health journey
                    </Text>
                </View>

                {/* Registration Form */}
                <View style={styles.form}>
                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.divider }]}>
                            <Ionicons name="person-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your full name"
                                placeholderTextColor={colors.placeholder}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                editable={!loading}
                            />
                        </View>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.divider }]}>
                            <Ionicons name="mail-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your email"
                                placeholderTextColor={colors.placeholder}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoCorrect={false}
                                editable={!loading}
                            />
                        </View>
                    </View>

                    {/* Username Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Username</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.divider }]}>
                            <Ionicons name="at" size={20} color={colors.placeholder} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Choose a username"
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
                                placeholder="Create a password"
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

                    {/* Confirm Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.divider }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Confirm your password"
                                placeholderTextColor={colors.placeholder}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={20}
                                    color={colors.placeholder}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Register Button */}
                    <TouchableOpacity
                        style={[styles.registerButton, { backgroundColor: colors.tint }, loading && styles.disabledButton]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.registerButtonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={styles.loginContainer}>
                        <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                            Already have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={handleBackToLogin} disabled={loading}>
                            <Text style={[styles.loginLink, { color: colors.tint }]}>Sign In</Text>
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
        paddingTop: 60,
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
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
    registerButton: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    disabledButton: {
        opacity: 0.6,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    loginText: {
        fontSize: 16,
    },
    loginLink: {
        fontSize: 16,
        fontWeight: '700',
    },
});
