import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockUserProfile } from '../../data/mockData';
import { useTheme, useThemeColors } from '../../contexts/ThemeContext';
import AddMenuToggle from '../../components/AddMenuToggle';

export default function ProfileScreen() {
    const profile = mockUserProfile;
    const { themeMode, setThemeMode } = useTheme();
    const colors = useThemeColors();
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);

    const handleEditProfile = () => {
        Alert.alert('Edit Profile', 'Profile editing will be implemented here.');
    };

    const handleCompetition = () => {
        Alert.alert('Competition', 'View your competitions and achievements.');
    };

    const handleThemeSelect = (mode: 'light' | 'dark' | 'system') => {
        setThemeMode(mode);
        setShowThemeModal(false);
    };

    // Menu items for add button
    const menuItems = [
        {
            icon: 'person-add' as const,
            iconColor: colors.info,
            title: 'Edit Profile',
            onPress: handleEditProfile,
        },
        {
            icon: 'trophy' as const,
            iconColor: colors.warning,
            title: 'Add Achievement',
            onPress: () => Alert.alert('Achievement', 'Add a new achievement'),
        },
        {
            icon: 'people' as const,
            iconColor: colors.success,
            title: 'Invite Friends',
            onPress: () => Alert.alert('Invite', 'Invite friends to compete'),
        },
        {
            icon: 'share-social' as const,
            iconColor: colors.stepsColor,
            title: 'Share Progress',
            onPress: () => Alert.alert('Share', 'Share your progress on social media'),
        },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={[styles.header]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddMenu(true)}>
                    <Ionicons name="add-circle-outline" size={28} color={colors.info} />
                </TouchableOpacity>
            </View>

            {/* User Info Card */}
            <TouchableOpacity style={[styles.userCard]} onPress={handleEditProfile}>
                <View style={[styles.userAvatar, { backgroundColor: colors.background }]}>
                    <Ionicons name="person" size={40} color={colors.textSecondary} />
                </View>
                <View style={styles.userInfo}>
                    <Text style={[styles.userId, { color: colors.text }]}>{profile.name}</Text>
                    <Text style={[styles.userDetails, { color: colors.textSecondary }]}>
                        {profile.gender}   {profile.height} cm   {profile.age}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
            </TouchableOpacity>

            {/* Competition Card */}
            <TouchableOpacity style={[styles.competitionCard, { backgroundColor: colors.cardBackground }]} onPress={handleCompetition}>
                <View style={styles.competitionContent}>
                    <View style={styles.trophyIcon}>
                        <Text style={styles.trophyEmoji}><Ionicons name="trophy" size={32} color="#fd570aff" /></Text>
                    </View>
                    <View style={styles.competitionLeft}>
                        <Text style={[styles.competitionTitle, { color: colors.text }]}>Competition</Text>
                        <Text style={[styles.competitionStatus, { color: colors.textSecondary }]}>Competition in progress</Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Settings List */}
            <View style={[styles.settingsList, { backgroundColor: colors.cardBackground }]}>
                <SettingItem
                    icon="contrast"
                    iconColor="#5E5CE6"
                    title="Appearance"
                    subtitle={themeMode === 'system' ? 'System' : themeMode === 'dark' ? 'Dark' : 'Light'}
                    onPress={() => setShowThemeModal(true)}
                    colors={colors}
                />
                <SettingItem
                    icon="settings-outline"
                    iconColor="#5E5CE6"
                    title="App settings"
                    subtitle="Language, units, notifications"
                    onPress={() => Alert.alert('App Settings', 'Configure app settings')}
                    colors={colors}
                />
                <SettingItem
                    icon="cloud-outline"
                    iconColor="#34C759"
                    title="Third-party data"
                    subtitle="Connect to other health apps"
                    onPress={() => Alert.alert('Third-party Data', 'Manage connected apps')}
                    colors={colors}
                />
                <SettingItem
                    icon="shield-checkmark-outline"
                    iconColor="#32ADE6"
                    title="App permissions"
                    subtitle="Manage app permissions"
                    onPress={() => Alert.alert('Permissions', 'Manage app permissions')}
                    colors={colors}
                />
                <SettingItem
                    icon="chatbubble-outline"
                    iconColor="#FF9500"
                    title="Feedback"
                    subtitle="Send feedback or report issues"
                    onPress={() => Alert.alert('Feedback', 'Send us your feedback')}
                    colors={colors}
                />
                <SettingItem
                    icon="information-circle-outline"
                    iconColor="#007AFF"
                    title="About this app"
                    subtitle="Version 1.0.0"
                    onPress={() => Alert.alert('About', 'Health Tracker v1.0.0\n\nBuilt with React Native & Expo')}
                    colors={colors}
                />
            </View>

            {/* Logout Button */}
            <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: colors.cardBackground }]}
                onPress={() => Alert.alert('Logout', 'Are you sure you want to logout?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Logout', style: 'destructive', onPress: () => console.log('Logout') }
                ])}
            >
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
            </TouchableOpacity>

            {/* Theme Selection Modal */}
            <Modal
                visible={showThemeModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowThemeModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowThemeModal(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Theme</Text>

                        <TouchableOpacity
                            style={[styles.themeOption, themeMode === 'light' && { backgroundColor: colors.background }]}
                            onPress={() => handleThemeSelect('light')}
                        >
                            <Ionicons name="sunny" size={24} color={colors.text} />
                            <Text style={[styles.themeOptionText, { color: colors.text }]}>Light</Text>
                            {themeMode === 'light' && <Ionicons name="checkmark" size={24} color={colors.tint} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.themeOption, themeMode === 'dark' && { backgroundColor: colors.background }]}
                            onPress={() => handleThemeSelect('dark')}
                        >
                            <Ionicons name="moon" size={24} color={colors.text} />
                            <Text style={[styles.themeOptionText, { color: colors.text }]}>Dark</Text>
                            {themeMode === 'dark' && <Ionicons name="checkmark" size={24} color={colors.tint} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.themeOption, themeMode === 'system' && { backgroundColor: colors.background }]}
                            onPress={() => handleThemeSelect('system')}
                        >
                            <Ionicons name="phone-portrait" size={24} color={colors.text} />
                            <Text style={[styles.themeOptionText, { color: colors.text }]}>System</Text>
                            {themeMode === 'system' && <Ionicons name="checkmark" size={24} color={colors.tint} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalCancelButton, { backgroundColor: colors.background }]}
                            onPress={() => setShowThemeModal(false)}
                        >
                            <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <View style={styles.bottomSpacing} />

            {/* Add Menu Toggle */}
            <AddMenuToggle
                visible={showAddMenu}
                onClose={() => setShowAddMenu(false)}
                menuItems={menuItems}
                title="Quick Actions"
            />
        </ScrollView>
    );
}

// Setting Item Component
interface SettingItemProps {
    icon: any;
    iconColor: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    colors: any;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, iconColor, title, subtitle, onPress, colors }) => (
    <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.divider }]} onPress={onPress}>
        <View style={styles.settingLeft}>
            <View style={[styles.settingIconContainer, { backgroundColor: iconColor }]}>
                <Ionicons name={icon} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
            </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 0,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
    },
    addButton: {
        padding: 4,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        marginTop: 1,
    },
    userAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    userInfo: {
        flex: 1,
    },
    userId: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 4,
    },
    userDetails: {
        fontSize: 14,
    },
    competitionCard: {
        marginHorizontal: 16,
        marginTop: 24,
        borderRadius: 12,
        padding: 16,
    },
    competitionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    competitionLeft: {
        flex: 1,
        marginLeft: 12,
    },
    competitionTitle: {
        fontSize: 20,
        fontWeight: '500',
        marginBottom: 4,
    },
    competitionStatus: {
        fontSize: 14,
    },
    trophyIcon: {
    },
    trophyEmoji: {
        fontSize: 48,
    },
    settingsList: {
        marginTop: 24,
        borderRadius: 12,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    settingIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 13,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginTop: 24,
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
    },
    themeOptionText: {
        fontSize: 16,
        flex: 1,
    },
    modalCancelButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 100,
    },
});
