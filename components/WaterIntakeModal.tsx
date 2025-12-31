// Water Intake Modal - Quick add water with preset amounts
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../contexts/ThemeContext';

interface WaterIntakeModalProps {
    visible: boolean;
    onClose: () => void;
    onAddWater: (amountMl: number) => void;
}

const WaterIntakeModal: React.FC<WaterIntakeModalProps> = ({ visible, onClose, onAddWater }) => {
    const colors = useThemeColors();
    const [customAmount, setCustomAmount] = useState('');

    const presetAmounts = [
        { label: '1 Glass', ml: 250, icon: 'wine' },
        { label: '1 Bottle', ml: 500, icon: 'water' },
        { label: '1 Liter', ml: 1000, icon: 'flask' },
    ];

    const handleAddWater = (amountMl: number) => {
        onAddWater(amountMl);
        setCustomAmount('');
        onClose();
    };

    const handleCustomAdd = () => {
        const amount = parseInt(customAmount);
        if (amount && amount > 0 && amount <= 5000) {
            handleAddWater(amount);
        }
    };

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
                <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]} onStartShouldSetResponder={() => true}>
                    <View style={styles.header}>
                        <Ionicons name="water" size={28} color={colors.waterIntakeColor} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Add Water Intake</Text>
                    </View>

                    {/* Preset Amounts */}
                    <View style={styles.presetContainer}>
                        {presetAmounts.map((preset, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.presetButton, { backgroundColor: colors.waterIntakeColor + '20', borderColor: colors.waterIntakeColor }]}
                                onPress={() => handleAddWater(preset.ml)}
                            >
                                <Ionicons name={preset.icon as any} size={24} color={colors.waterIntakeColor} />
                                <Text style={[styles.presetLabel, { color: colors.text }]}>{preset.label}</Text>
                                <Text style={[styles.presetAmount, { color: colors.textSecondary }]}>{preset.ml}ml</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom Amount */}
                    <View style={styles.customContainer}>
                        <Text style={[styles.customLabel, { color: colors.text }]}>Custom Amount (ml)</Text>
                        <View style={styles.customInputRow}>
                            <TextInput
                                style={[styles.customInput, {
                                    backgroundColor: colors.background,
                                    color: colors.text,
                                    borderColor: colors.divider
                                }]}
                                placeholder="Enter amount"
                                placeholderTextColor={colors.placeholder}
                                keyboardType="numeric"
                                value={customAmount}
                                onChangeText={setCustomAmount}
                            />
                            <TouchableOpacity
                                style={[styles.customAddButton, {
                                    backgroundColor: colors.waterIntakeColor,
                                    opacity: customAmount ? 1 : 0.5
                                }]}
                                onPress={handleCustomAdd}
                                disabled={!customAmount}
                            >
                                <Ionicons name="add" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        style={[styles.cancelButton, { backgroundColor: colors.background }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    presetContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    presetButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
        gap: 8,
    },
    presetLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    presetAmount: {
        fontSize: 12,
    },
    customContainer: {
        marginBottom: 16,
    },
    customLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    customInputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    customInput: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
    },
    customAddButton: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default WaterIntakeModal;
