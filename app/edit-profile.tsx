import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../contexts/ThemeContext';
import { userProfileService } from '../services/userProfileService';
import { UserProfile } from '../types';
import { showToast } from '../utils/toast';

/**
 * Calculate age from date of birth
 */
const calculateAge = (dob: Date | undefined): number => {
    if (!dob) return 0;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
};

interface EditProfileScreenProps {
    existingProfile: UserProfile | null;
    onSave: () => void;
}

export default function EditProfileScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const [loading, setLoading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | undefined>(undefined);

    // Form state
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
    const [email, setEmail] = useState('');
    const [heightM, setHeightM] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | undefined>(undefined);
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
    const [openDatePicker, setOpenDatePicker] = useState(false);

    // Calculate age from date of birth
    const calculatedAge = useMemo(() => calculateAge(dateOfBirth), [dateOfBirth]);

    // Load existing profile on mount
    React.useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const profile = await userProfileService.getProfile();
            if (profile) {
                setUsername(profile.username || '');
                setFirstName(profile.firstName || '');
                setLastName(profile.lastName || '');
                setGender(profile.gender || 'MALE');
                setHeightM(profile.heightM?.toString() || '');
                setWeightKg(profile.weightKg?.toString() || '');
                setProfilePictureUrl(profile.profilePictureUrl);
                setOriginalAvatarUrl(profile.profilePictureUrl);
                setEmail(profile.email || '');
                if (profile.dob) {
                    setDateOfBirth(new Date(profile.dob));
                }
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
                setProfilePictureUrl(imageUri);
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
                setProfilePictureUrl(imageUri);
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
                profilePictureUrl && {
                    text: 'Remove Avatar',
                    style: 'destructive',
                    onPress: () => setProfilePictureUrl(undefined),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ].filter(Boolean) as any
        );
    };

    const validateForm = (): boolean => {
        if (!firstName.trim()) {
            showToast.error('Validation Error', 'Please enter your first name');
            return false;
        }

        if (!lastName.trim()) {
            showToast.error('Validation Error', 'Please enter your last name');
            return false;
        }

        if (!heightM || isNaN(Number(heightM)) || Number(heightM) <= 0) {
            showToast.error('Validation Error', 'Please enter a valid height in cm');
            return false;
        }

        if (weightKg && (isNaN(Number(weightKg)) || Number(weightKg) <= 0)) {
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
            let finalAvatarUri = profilePictureUrl;

            // Upload avatar if it has changed (local file vs server URL)
            if (profilePictureUrl && profilePictureUrl !== originalAvatarUrl) {
                // Check if it's a local file (not a server URL)
                if (profilePictureUrl.startsWith('file://') || profilePictureUrl.startsWith('content://')) {
                    setAvatarUploading(true);
                    showToast.info('Uploading', 'Uploading avatar...');
                    try {
                        finalAvatarUri = await userProfileService.saveAvatar(profilePictureUrl);
                        showToast.success('Avatar uploaded', 'Avatar uploaded successfully');
                    } catch (avatarError) {
                        console.error('[EditProfile] Error uploading avatar:', avatarError);
                        showToast.error('Avatar Error', 'Failed to upload avatar. Profile will be saved without avatar change.');
                        finalAvatarUri = originalAvatarUrl; // Keep original if upload fails
                    } finally {
                        setAvatarUploading(false);
                    }
                }
            }

            // Save profile via API
            const profileData: Partial<UserProfile> = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                gender,
                heightM: Number(heightM),
                weightKg: weightKg ? Number(weightKg) : undefined,
                email: email.trim(),
                dob: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : undefined,
                profilePictureUrl: finalAvatarUri,
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
                        {profilePictureUrl ? (
                            <Image source={{ uri: profilePictureUrl }} style={styles.avatar} />
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
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Username</Text>
                        <Text style={[styles.fieldInput, { color: colors.text }]}>
                            {username || 'Not set'}
                        </Text>
                    </View>

                    <View style={[styles.formField, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
                        <Text style={[styles.fieldInput, { color: colors.text }]}>
                            {email || 'Not set'}
                        </Text>
                    </View>

                    <View style={[styles.formField, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
                        <TextInput
                            style={[styles.fieldInput, { color: colors.text }]}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Enter your first name"
                            placeholderTextColor={colors.placeholder}
                        />
                    </View>

                    <View style={[styles.formField, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
                        <TextInput
                            style={[styles.fieldInput, { color: colors.text }]}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Enter your last name"
                            placeholderTextColor={colors.placeholder}
                        />
                    </View>

                    <View style={[styles.formField, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Gender</Text>
                        <View style={styles.genderButtons}>
                            {(['MALE', 'FEMALE'] as const).map((g) => (
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
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Height (m)</Text>
                        <TextInput
                            style={[styles.fieldInput, { color: colors.text }]}
                            value={heightM}
                            onChangeText={setHeightM}
                            placeholder="1.70"
                            placeholderTextColor={colors.placeholder}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={[styles.formField, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Weight (kg)</Text>
                        <TextInput
                            style={[styles.fieldInput, { color: colors.text }]}
                            value={weightKg}
                            onChangeText={setWeightKg}
                            placeholder="68"
                            placeholderTextColor={colors.placeholder}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.formField}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date of Birth</Text>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setOpenDatePicker(true)}
                        >
                            <Text style={[styles.fieldInput, { color: dateOfBirth ? colors.text : colors.placeholder }]}>
                                {dateOfBirth ? dateOfBirth.toLocaleDateString() : 'Select date of birth'}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Display calculated age */}
                    {dateOfBirth && (
                        <View style={[styles.formField, { borderTopColor: colors.divider, borderTopWidth: 1 }]}>
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Age (calculated)</Text>
                            <Text style={[styles.fieldInput, { color: colors.text }]}>
                                {calculatedAge} years old
                            </Text>
                        </View>
                    )}

                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Date Picker Modal */}
            {openDatePicker && (
                <DateTimePicker
                    value={dateOfBirth || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setOpenDatePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                            setDateOfBirth(selectedDate);
                        }
                    }}
                    maximumDate={new Date()}
                />
            )}
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
    datePickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    bottomSpacing: {
        height: 40,
    },
});
