import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useVerifyOtpMutation,
  useCompleteRegisterMutation,
  useVerifyVendorOtpMutation,
  useCompleteVendorRegisterMutation,
} from '@/store/api/authApi';
import { useAppDispatch } from '@/store';
import { setAuthSuccess, setRole } from '@/store/slices/authSlice';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export default function OtpVerifyScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{
    registrationToken: string;
    email: string;
    role: string;
    storeName?: string;
  }>();

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [verifyOtp, { isLoading: isVerifyingUser }] = useVerifyOtpMutation();
  const [completeRegister, { isLoading: isCompletingUser }] = useCompleteRegisterMutation();
  const [verifyVendorOtp, { isLoading: isVerifyingVendor }] = useVerifyVendorOtpMutation();
  const [completeVendorRegister, { isLoading: isCompletingVendor }] =
    useCompleteVendorRegisterMutation();

  const isVendor = params.role === 'vendor';
  const isVerifying = isVerifyingUser || isVerifyingVendor;
  const isCompleting = isCompletingUser || isCompletingVendor;

  // Step 1: Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setErrorMessage('Please enter the verification code sent to your email.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isVendor) {
        const res = await verifyVendorOtp({
          registrationToken: params.registrationToken,
          otp: otp.trim(),
        }).unwrap();
        setVerificationToken(res.verificationToken);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const res = await verifyOtp({
          registrationToken: params.registrationToken,
          otp: otp.trim(),
        }).unwrap();
        setVerificationToken(res.verificationToken);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.data?.message || err?.error || 'Invalid or expired OTP code.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  // Step 2: Complete Registration with Password
  const handleCompleteRegistration = async () => {
    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!verificationToken) {
      setErrorMessage('Verification expired. Please verify OTP again.');
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isVendor) {
        const res = await completeVendorRegister({
          verificationToken,
          password,
          storeName: params.storeName || 'Artisan Workshop',
        }).unwrap();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dispatch(setAuthSuccess(res));
        dispatch(setRole('vendor'));
        router.replace('/(vendor)');
      } else {
        const res = await completeRegister({
          verificationToken,
          password,
        }).unwrap();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dispatch(setAuthSuccess(res));
        dispatch(setRole('user'));
        router.replace('/(user)');
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.data?.message || err?.error || 'Failed to complete registration.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconCircle}>
          <Ionicons
            name={verificationToken ? 'lock-closed' : 'mail-unread'}
            size={28}
            color={Colors.primary}
          />
        </View>

        <Text style={styles.title}>
          {verificationToken ? 'Create Secure Password' : 'Enter Verification Code'}
        </Text>
        <Text style={styles.subtitle}>
          {verificationToken
            ? 'Set a strong password for your Ethnikraft account.'
            : `We sent a confirmation code to ${params.email || 'your email'}.`}
        </Text>

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {!verificationToken ? (
          /* Step 1 Form: OTP */
          <View style={styles.card}>
            <Text style={styles.inputLabel}>VERIFICATION CODE</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="123456"
              placeholderTextColor={Colors.textMuted}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.btn, isVerifying && { opacity: 0.7 }]}
              onPress={handleVerifyOtp}
              disabled={isVerifying}
              activeOpacity={0.85}
            >
              {isVerifying ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <Text style={styles.btnText}>Verify Code</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Step 2 Form: Password */
          <View style={styles.card}>
            <Text style={styles.inputLabel}>PASSWORD (MIN 8 CHARACTERS)</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoFocus
            />

            <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>CONFIRM PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor={Colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[
                styles.btn,
                isVendor && styles.btnVendor,
                isCompleting && { opacity: 0.7 },
              ]}
              onPress={handleCompleteRegistration}
              disabled={isCompleting}
              activeOpacity={0.85}
            >
              {isCompleting ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <Text style={styles.btnText}>Complete & Enter Boutique</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: '#B91C1C',
    fontWeight: '600',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#E4DACB',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: '#FAF7F2',
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E4DACB',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#FAF7F2',
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  btnVendor: {
    backgroundColor: Colors.secondary,
  },
  btnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
});
