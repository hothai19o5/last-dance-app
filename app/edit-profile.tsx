import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../contexts/ThemeContext';
import { userProfileService } from '../services/userProfileService';
import { UserProfile } from '../types';
import { showToast } from '../utils/toast';

interface EditProfileScreenProps {
    existingProfile: UserProfile | null;
    onSave: () => void;
}

export default function EditProfileScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
    const [height, setHeight] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);

    // Load existing profile on mount
    React.useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const profile = await userProfileService.getProfile();
            if (profile) {
                setName(profile.name || '');
                setGender(profile.gender || 'Male');
                setHeight(profile.height?.toString() || '');
                setAge(profile.age?.toString() || '');
                setWeight(profile.weight?.toString() || '');
                setAvatarUri(profile.avatar);
            }
        } catch (error) {
            console.error('[EditProfile] Error loading profile:', error);
        }
    };

    const pickImage = async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please grant permission to access your photo library to select an avatar.'
                );
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                setAvatarUri(imageUri);
                showToast.success('Avatar selected', 'Tap Save to confirm');
            }
        } catch (error) {
            console.error('[EditProfile] Error picking image:', error);
            showToast.error('Error', 'Failed to select image');
        }
    };

    const takePhoto = async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please grant permission to access your camera to take a photo.'
                );
                return;
            }

            // Launch camera
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                setAvatarUri(imageUri);
                showToast.success('Photo taken', 'Tap Save to confirm');
            }
        } catch (error) {
            console.error('[EditProfile] Error taking photo:', error);
            showToast.error('Error', 'Failed to take photo');
        }
    };

    const showAvatarOptions = () => {
        Alert.alert(
            'Change Avatar',
            'Choose an option',
            [
                {
                    text: 'Take Photo',
                    onPress: takePhoto,
                },
                {
                    text: 'Choose from Library',
                    onPress: pickImage,
                },
                avatarUri && {
                    text: 'Remove Avatar',
                    style: 'destructive',
                    onPress: () => setAvatarUri(undefined),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ].filter(Boolean) as any
        );
    };

    const validateForm = (): boolean => {
        if (!name.trim()) {
            showToast.error('Validation Error', 'Please enter your name');
            return false;
        }

        if (!height || isNaN(Number(height)) || Number(height) <= 0) {
            showToast.error('Validation Error', 'Please enter a valid height in cm');
            return false;
        }

        if (!age || isNaN(Number(age)) || Number(age) <= 0 || Number(age) > 150) {
            showToast.error('Validation Error', 'Please enter a valid age');
            return false;
        }

        if (weight && (isNaN(Number(weight)) || Number(weight) <= 0)) {
            showToast.error('Validation Error', 'Please enter a valid weight in kg');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Save avatar if changed
            let finalAvatarUri = avatarUri;
            if (avatarUri) {
                finalAvatarUri = await userProfileService.saveAvatar(avatarUri);
            }

            // Save profile
            const profileData: Partial<UserProfile> = {
                name: name.trim(),
                gender,
                height: Number(height),
                age: Number(age),
                weight: weight ? Number(weight) : undefined,
                avatar: finalAvatarUri,
            };

            await userProfileService.saveProfile(profileData);

            showToast.success('Success', 'Profile updated successfully');

            // Navigate back
            setTimeout(() => {
                router.back();
            }, 500);
        } catch (error) {
            console.error('[EditProfile] Error saving profile:', error);
            showToast.error('Error', 'Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        <Text style={[styles.saveButton, { color: loading ? colors.textSecondary : colors.tint }]}>
                            {loading ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity
                        style={[styles.avatarContainer, { backgroundColor: colors.cardBackground }]}
                        onPress={showAvatarOptions}
                    >
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        ) : (
                            <Ionicons name="person" size={60} color={colors.textSecondary} />
                        )}
                        <View style={[styles.avatarBadge, { backgroundColor: colors.tint }]}>
                            <Ionicons name="camera" size={16} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
                        Tap to change avatar
                    </Text>
                </View>

                {/* Form Fields */}
                <View style={[styles.formSection, { backgroundColor: colors.cardBackground }]}>
                    <View style={[styles.formField, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
                        <TextInput
                            style={[styles.fieldInput, { color: colors.text }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor={colors.placeholder}
                        />
                    </View>

                    <View style={[styles.formField, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Gender</Text>
                        <View style={styles.genderButtons}>
                            {(['Male', 'Female', 'Other'] as const).map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[
                                        styles.genderButton,
                                        gender === g && { backgroundColor: colors.tint },
                                    ]}
                                    onPress={() => setGender(g)}
                                >
                                    <Text
                                        style={[
                                            styles.genderButtonText,
                                            { color: gender === g ? '#FFFFFF' : colors.text },
                                        ]}
                                    >
                                        {g}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.formField, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Height (cm)</Text>
                        <TextInput
                            style={[styles.fieldInput, { color: colors.text }]}
                            value={height}
                            onChangeText={setHeight}
                            placeholder="170"
                            placeholderTextColor={colors.placeholder}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={[styles.formField, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Age</Text>
                        <TextInput
                            style={[styles.fieldInput, { color: colors.text }]}
                            value={age}
                            onChangeText={setAge}
                            placeholder="25"
                            placeholderTextColor={colors.placeholder}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.formField}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Weight (kg)</Text>
                        <TextInput
                            style={[styles.fieldInput, { color: colors.text }]}
                            value={weight}
                            onChangeText={setWeight}
                            placeholder="68 (optional)"
                            placeholderTextColor={colors.placeholder}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarBadge: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    avatarHint: {
        marginTop: 12,
        fontSize: 14,
    },
    formSection: {
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    formField: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    fieldLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    fieldInput: {
        fontSize: 16,
        paddingVertical: 4,
    },
    genderButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    genderButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    genderButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    bottomSpacing: {
        height: 40,
    },
});
