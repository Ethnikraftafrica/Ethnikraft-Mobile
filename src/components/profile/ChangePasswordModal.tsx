import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ visible, onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const newPassRef = useRef<TextInput>(null);
  const confirmPassRef = useRef<TextInput>(null);

  const validations = [
    { label: '6–20 characters', test: (p: string) => p.length >= 6 && p.length <= 20 },
    { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Contains at least a number', test: (p: string) => /\d/.test(p) },
    { label: 'Contains special character', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
  ];

  const handleSavePassword = () => {
    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (newPassword.length < 6 || newPassword.length > 20) {
      setErrorMessage('New password must be between 6 and 20 characters.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMessage(null);
    setIsSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      setIsSuccess(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    }, 900);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <View style={[styles.modalCard, Shadows.lg]}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.modalTitle}>Change Password</Text>
                <Text style={styles.modalSub}>Enhance your account security</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#341B00" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
            >
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color="#C92929" style={{ marginRight: 6 }} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Current Password */}
              <Text style={styles.label}>CURRENT PASSWORD *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color="#662502" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor="#A8998A"
                  secureTextEntry={!showCurrent}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="next"
                  onSubmitEditing={() => newPassRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
                  <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={18} color="#662502" />
                </TouchableOpacity>
              </View>

              {/* New Password */}
              <Text style={[styles.label, { marginTop: Spacing.md }]}>NEW PASSWORD *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#662502" style={styles.inputIcon} />
                <TextInput
                  ref={newPassRef}
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new secure password"
                  placeholderTextColor="#A8998A"
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPassRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                  <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color="#662502" />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <Text style={[styles.label, { marginTop: Spacing.md }]}>CONFIRM NEW PASSWORD *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#662502" style={styles.inputIcon} />
                <TextInput
                  ref={confirmPassRef}
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new secure password"
                  placeholderTextColor="#A8998A"
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleSavePassword}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#662502" />
                </TouchableOpacity>
              </View>

              {/* Password Checklist */}
              <View style={styles.checklist}>
                {validations.map((v, i) => {
                  const passed = v.test(newPassword);
                  return (
                    <View key={i} style={styles.checkItem}>
                      <Ionicons
                        name={passed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={14}
                        color={passed ? '#009D1A' : '#A8998A'}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.checkText, passed && styles.checkTextPassed]}>
                        {v.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, isSuccess && styles.saveBtnSuccess]}
                onPress={handleSavePassword}
                activeOpacity={0.88}
              >
                <Ionicons
                  name={isSuccess ? 'checkmark-circle' : 'key-outline'}
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.saveBtnText}>
                  {isSuccess ? 'Password Updated!' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 14, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
    maxHeight: Platform.OS === 'ios' ? '92%' : '96%',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl + 20 : Spacing.xl + 10,
    maxHeight: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7D9',
    paddingBottom: Spacing.sm + 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#341B00',
  },
  modalSub: {
    fontSize: 11,
    color: '#662502',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  scrollContent: {
    paddingBottom: Spacing.xl + 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '600',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#662502',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: Typography.fontSize.sm,
    color: '#341B00',
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  checklist: {
    marginTop: Spacing.md,
    padding: Spacing.sm + 2,
    backgroundColor: '#FAF7F2',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E4DACB',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  checkText: {
    fontSize: 11,
    color: '#662502',
  },
  checkTextPassed: {
    color: '#009D1A',
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C46C27',
    paddingVertical: 14,
    borderRadius: Radius.md,
    marginTop: Spacing.lg,
  },
  saveBtnSuccess: {
    backgroundColor: '#009D1A',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
});
