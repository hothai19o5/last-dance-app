import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useThemeColors } from '../contexts/ThemeContext';
import { Language } from '../i18n';

export default function AppSettingsScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const { language, setLanguage, t, languageNames } = useLanguage();
    const [showLanguageModal, setShowLanguageModal] = useState(false);

    const handleLanguageSelect = async (lang: Language) => {
        await setLanguage(lang);
        setShowLanguageModal(false);
    };

    const getLanguageDisplayName = () => {
        return languageNames[language];
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.tint} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t.settings.appSettings}</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Language Section */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t.settings.language.toUpperCase()}
                    </Text>

                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: colors.divider }]}
                        onPress={() => setShowLanguageModal(true)}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#007AFF' }]}>
                                <Ionicons name="language" size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={[styles.settingTitle, { color: colors.text }]}>
                                    {t.settings.language}
                                </Text>
                                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                                    {getLanguageDisplayName()}
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* More settings can be added here */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t.settings.notifications.toUpperCase()}
                    </Text>

                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: colors.divider }]}
                        onPress={() => router.push('/notification-settings')}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FF9500' }]}>
                                <Ionicons name="notifications" size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={[styles.settingTitle, { color: colors.text }]}>
                                    {t.settings.notifications}
                                </Text>
                                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                                    {t.settings.enableNotifications}
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Language Selection Modal */}
            <Modal
                visible={showLanguageModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLanguageModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowLanguageModal(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {t.settings.chooseLanguage}
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.languageOption,
                                language === 'en' && { backgroundColor: colors.background },
                            ]}
                            onPress={() => handleLanguageSelect('en')}
                        >
                            <Text style={styles.flagEmoji}>🇺🇸</Text>
                            <Text style={[styles.languageOptionText, { color: colors.text }]}>
                                {t.settings.english}
                            </Text>
                            {language === 'en' && (
                                <Ionicons name="checkmark" size={24} color={colors.tint} />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.languageOption,
                                language === 'vi' && { backgroundColor: colors.background },
                            ]}
                            onPress={() => handleLanguageSelect('vi')}
                        >
                            <Text style={styles.flagEmoji}>🇻🇳</Text>
                            <Text style={[styles.languageOptionText, { color: colors.text }]}>
                                {t.settings.vietnamese}
                            </Text>
                            {language === 'vi' && (
                                <Ionicons name="checkmark" size={24} color={colors.tint} />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalCancelButton, { backgroundColor: colors.background }]}
                            onPress={() => setShowLanguageModal(false)}
                        >
                            <Text style={[styles.modalCancelText, { color: colors.text }]}>
                                {t.common.cancel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    flagEmoji: {
        fontSize: 24,
        marginRight: 12,
    },
    languageOptionText: {
        flex: 1,
        fontSize: 16,
    },
    modalCancelButton: {
        marginTop: 12,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
