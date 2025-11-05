import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockUserProfile } from '../../data/mockData';

export default function ProfileScreen() {
    const profile = mockUserProfile;

    const handleEditProfile = () => {
        Alert.alert('Edit Profile', 'Profile editing will be implemented here.');
    };

    const handleCompetition = () => {
        Alert.alert('Competition', 'View your competitions and achievements.');
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            {/* User Info Card */}
            <TouchableOpacity style={styles.userCard} onPress={handleEditProfile}>
                <View style={styles.userAvatar}>
                    <Ionicons name="person" size={40} color="#8E8E93" />
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userId}>{profile.id}</Text>
                    <Text style={styles.userDetails}>
                        {profile.gender} | {profile.height}cm | {profile.age}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            {/* Competition Card */}
            <TouchableOpacity style={styles.competitionCard} onPress={handleCompetition}>
                <View style={styles.competitionContent}>
                    <View style={styles.competitionLeft}>
                        <Text style={styles.competitionTitle}>Competition</Text>
                        <Text style={styles.competitionStatus}>Competition in progress</Text>
                    </View>
                    <View style={styles.trophyIcon}>
                        <Text style={styles.trophyEmoji}>🏆</Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Settings List */}
            <View style={styles.settingsList}>
                <SettingItem
                    icon="settings-outline"
                    iconColor="#5E5CE6"
                    title="App settings"
                    subtitle="Language, units, notifications"
                    onPress={() => Alert.alert('App Settings', 'Configure app settings')}
                />
                <SettingItem
                    icon="cloud-outline"
                    iconColor="#34C759"
                    title="Third-party data"
                    subtitle="Connect to other health apps"
                    onPress={() => Alert.alert('Third-party Data', 'Manage connected apps')}
                />
                <SettingItem
                    icon="shield-checkmark-outline"
                    iconColor="#32ADE6"
                    title="App permissions"
                    subtitle="Manage app permissions"
                    onPress={() => Alert.alert('Permissions', 'Manage app permissions')}
                />
                <SettingItem
                    icon="chatbubble-outline"
                    iconColor="#FF9500"
                    title="Feedback"
                    subtitle="Send feedback or report issues"
                    onPress={() => Alert.alert('Feedback', 'Send us your feedback')}
                />
                <SettingItem
                    icon="information-circle-outline"
                    iconColor="#007AFF"
                    title="About this app"
                    subtitle="Version 1.0.0"
                    onPress={() => Alert.alert('About', 'Health Tracker v1.0.0\n\nBuilt with React Native & Expo')}
                />
            </View>

            {/* Logout Button */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => Alert.alert('Logout', 'Are you sure you want to logout?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Logout', style: 'destructive', onPress: () => console.log('Logout') }
                ])}
            >
                <Ionicons name="log-out-outline" size={20} color="#FF453A" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacing} />
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
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, iconColor, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
        <View style={styles.settingLeft}>
            <View style={[styles.settingIconContainer, { backgroundColor: iconColor }]}>
                <Ionicons name={icon} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#000',
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 20,
        marginTop: 1,
    },
    userAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F2F2F7',
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
        color: '#000',
        marginBottom: 4,
    },
    userDetails: {
        fontSize: 14,
        color: '#8E8E93',
    },
    competitionCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 24,
        borderRadius: 12,
        padding: 20,
    },
    competitionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    competitionLeft: {
        flex: 1,
    },
    competitionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    competitionStatus: {
        fontSize: 14,
        color: '#8E8E93',
    },
    trophyIcon: {
        marginLeft: 16,
    },
    trophyEmoji: {
        fontSize: 48,
    },
    settingsList: {
        marginTop: 24,
        backgroundColor: '#FFFFFF',
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
        borderBottomColor: '#F2F2F7',
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
        color: '#000',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 24,
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF453A',
    },
    bottomSpacing: {
        height: 100,
    },
});
