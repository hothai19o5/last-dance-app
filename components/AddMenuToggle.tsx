import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';

interface MenuItem {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    title: string;
    onPress: () => void;
}

interface AddMenuToggleProps {
    visible: boolean;
    onClose: () => void;
    menuItems: MenuItem[];
    title?: string;
}

const AddMenuToggle: React.FC<AddMenuToggleProps> = ({ visible, onClose, menuItems, title = 'Add New' }) => {
    const colors = useThemeColors();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>

                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.menuItem,
                                index !== menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider }
                            ]}
                            onPress={() => {
                                item.onPress();
                                onClose();
                            }}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: item.iconColor }]}>
                                <Ionicons name={item.icon} size={20} color="#FFFFFF" />
                            </View>
                            <Text style={[styles.menuItemText, { color: colors.text }]}>{item.title}</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={[styles.modalCancelButton, { backgroundColor: colors.background }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
        marginBottom: 16,
        textAlign: 'center',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 12,
    },
    menuIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        flex: 1,
    },
    modalCancelButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddMenuToggle;
