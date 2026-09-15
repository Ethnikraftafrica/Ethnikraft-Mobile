import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import { closeDeleteModal, confirmDeleteRequest } from '@/store/slices/studioSlice';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export const StudioRequestDeleteModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isDeleteModalOpen, selectedRequestForDelete: req } = useAppSelector(
    (state) => state.studio.hub
  );

  if (!req) return null;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(closeDeleteModal());
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch(confirmDeleteRequest(req.id));
  };

  return (
    <Modal
      visible={isDeleteModalOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="trash-outline" size={28} color="#EF4444" />
          </View>

          <Text style={styles.title}>Delete Studio Request?</Text>
          <Text style={styles.desc}>
            Are you sure you want to cancel and delete{' '}
            <Text style={styles.boldTitle}>"{req.title}"</Text>? All associated artisan quotes and draft specs will be removed. This action cannot be undone.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Keep Request</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleConfirm} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Yes, Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  desc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  boldTitle: {
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
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
  deleteBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: '#FFFFFF',
  },
});
