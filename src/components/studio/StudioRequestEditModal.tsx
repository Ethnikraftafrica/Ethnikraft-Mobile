import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import { closeEditModal, saveEditRequest } from '@/store/slices/studioSlice';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export const StudioRequestEditModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isEditModalOpen, selectedRequestForEdit: req } = useAppSelector(
    (state) => state.studio.hub
  );

  const [budget, setBudget] = useState('');
  const [deliveryWeeks, setDeliveryWeeks] = useState('2');

  useEffect(() => {
    if (req) {
      setBudget(req.budget ? req.budget.toString() : '20000');
    }
  }, [req]);

  if (!req) return null;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(closeEditModal());
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const budgetNum = parseInt(budget.replace(/[^0-9]/g, '')) || req.budget;
    const weeksNum = parseInt(deliveryWeeks) || 2;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + weeksNum * 7);

    dispatch(
      saveEditRequest({
        id: req.id,
        budget: budgetNum,
        timeline: targetDate.toISOString(),
      })
    );
  };

  return (
    <Modal
      visible={isEditModalOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Update Request Terms</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.reqTitle} numberOfLines={1}>
            {req.title}
          </Text>

          {/* Budget */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Adjust Budget (₦)</Text>
            <TextInput
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              style={styles.textInput}
              placeholder="e.g. 35000"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Delivery Weeks */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Adjust Delivery Timeline</Text>
            <View style={styles.weeksRow}>
              {['1', '2', '3', '4', '6', '8'].map((w) => {
                const isSelected = deliveryWeeks === w;
                return (
                  <TouchableOpacity
                    key={w}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDeliveryWeeks(w);
                    }}
                    style={[
                      styles.weekChip,
                      isSelected && styles.weekChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.weekChipText,
                        isSelected && styles.weekChipTextSelected,
                      ]}
                    >
                      {w}w
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  reqTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textPrimary,
  },
  weeksRow: {
    flexDirection: 'row',
    gap: 6,
  },
  weekChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  weekChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weekChipText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textPrimary,
  },
  weekChipTextSelected: {
    color: Colors.textInverse,
    fontFamily: Typography.fontFamily.poppinsBold,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
});
