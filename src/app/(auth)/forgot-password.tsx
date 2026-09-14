import React, { useState, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useInitiatePasswordResetMutation,
  useVerifyPasswordResetOtpMutation,
  useCompletePasswordResetMutation,
} from '@/store/api/authApi';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  // Step 1: 'EMAIL', Step 2: 'OTP', Step 3: 'NEW_PASSWORD', Step 4: 'SUCCESS'
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirmPasswordRef = useRef<TextInput>(null);

  const [initiateReset, { isLoading: isInitiating }] = useInitiatePasswordResetMutation();
  const [verifyResetOtp, { isLoading: isVerifying }] = useVerifyPasswordResetOtpMutation();
  const [completeReset, { isLoading: isCompleting }] = useCompletePasswordResetMutation();

  const isSubmitting = isInitiating || isVerifying || isCompleting;

  // Password validations matching Ethnikraft backend
  const validations = [
    { label: 'Min 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'At least one number', test: (p: string) => /\d/.test(p) },
  ];

  const handleInitiateReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await initiateReset({ email: trimmedEmail }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('OTP');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.data?.message || err?.error || 'Failed to initiate password reset.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await verifyResetOtp({
        email: email.trim(),
        otp: trimmedOtp,
      }).unwrap();

      setVerificationToken(res.verificationToken);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('NEW_PASSWORD');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.data?.message || err?.error || 'Invalid or expired OTP code.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleCompleteReset = async () => {
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await completeReset({
        email: email.trim(),
        newPassword,
        verificationToken,
      }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('SUCCESS');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.data?.message || err?.error || 'Failed to reset password.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <LinearGradient
      colors={['#FCF4E1', '#F5EBD5']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backBtn, Shadows.sm]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#341B00" />
          </TouchableOpacity>

          {/* Icon Badge */}
          <View style={styles.iconCircle}>
            <Ionicons
              name={
                step === 'EMAIL'
                  ? 'key-outline'
                  : step === 'OTP'
                  ? 'mail-unread-outline'
                  : step === 'NEW_PASSWORD'
                  ? 'lock-closed-outline'
                  : 'checkmark-circle-outline'
              }
              size={28}
              color="#F5EBD5"
            />
          </View>

          {/* Header Texts */}
          <Text style={styles.title}>
            {step === 'EMAIL' && 'Reset Password'}
            {step === 'OTP' && 'Verify Code'}
            {step === 'NEW_PASSWORD' && 'Create New Password'}
            {step === 'SUCCESS' && 'Password Updated!'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'EMAIL' && 'Enter your registered email address and we will send you a 6-digit recovery code.'}
            {step === 'OTP' && `We sent a 6-digit verification code to ${email}.`}
            {step === 'NEW_PASSWORD' && 'Enter and confirm your new secure account password.'}
            {step === 'SUCCESS' && 'Your password has been successfully reset. You can now log in with your new credentials.'}
          </Text>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#C92929" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Step 1: Email Input */}
          {step === 'EMAIL' && (
            <View style={[styles.card, Shadows.lg]}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#662502" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@domain.com"
                  placeholderTextColor="#A8998A"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={handleInitiateReset}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleInitiateReset}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnText}>Send Recovery Code</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: OTP Input */}
          {step === 'OTP' && (
            <View style={[styles.card, Shadows.lg]}>
              <Text style={styles.inputLabel}>6-DIGIT RECOVERY CODE</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="123456"
                placeholderTextColor="#A8998A"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleVerifyOtp}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.btn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleVerifyOtp}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnText}>Verify Code & Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleInitiateReset}
                disabled={isSubmitting}
              >
                <Text style={styles.resendText}>Didn't receive code? Resend</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: New Password */}
          {step === 'NEW_PASSWORD' && (
            <View style={[styles.card, Shadows.lg]}>
              <Text style={styles.inputLabel}>NEW PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#662502" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor="#A8998A"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  autoFocus
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#662502"
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>CONFIRM PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#662502" style={styles.inputIcon} />
                <TextInput
                  ref={confirmPasswordRef}
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor="#A8998A"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleCompleteReset}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#662502"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.checklistContainer}>
                {validations.map((item, idx) => {
                  const passed = item.test(newPassword);
                  return (
                    <View key={idx} style={styles.checkItem}>
                      <Ionicons
                        name={passed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={14}
                        color={passed ? '#009D1A' : '#A8998A'}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.checkText, passed && styles.checkTextPassed]}>
                        {item.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.btn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleCompleteReset}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnText}>Save New Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4: Success Message */}
          {step === 'SUCCESS' && (
            <View style={[styles.card, Shadows.lg, { alignItems: 'center' }]}>
              <Ionicons name="checkmark-circle" size={54} color="#009D1A" style={{ marginBottom: 12 }} />
              <Text style={styles.successHeading}>All Set!</Text>
              <Text style={styles.successSub}>
                Your password has been changed successfully. You can now log into your Ethnikraft account.
              </Text>

              <TouchableOpacity
                style={[styles.btn, { width: '100%' }]}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.88}
              >
                <Text style={styles.btnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Return to login link */}
          {step !== 'SUCCESS' && (
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              style={styles.signinLink}
              activeOpacity={0.8}
            >
              <Text style={styles.signinText}>
                Remember your password?{' '}
                <Text style={styles.signinLinkBold}>Sign in »</Text>
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg + 10,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#341B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#341B00',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    color: '#662502',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#662502',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4DACB',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FAF7F2',
  },
  inputIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: Typography.fontSize.sm,
    color: '#341B00',
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#E4DACB',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    fontSize: 26,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: '#FAF7F2',
    color: '#341B00',
    fontWeight: '800',
  },
  checklistContainer: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
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
  btn: {
    backgroundColor: '#C46C27',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  resendBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  resendText: {
    fontSize: Typography.fontSize.xs,
    color: '#C46C27',
    fontWeight: '600',
  },
  successHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#101213',
    marginBottom: 6,
  },
  successSub: {
    fontSize: Typography.fontSize.xs + 1,
    color: '#662502',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  signinLink: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  signinText: {
    fontSize: Typography.fontSize.sm,
    color: '#662502',
  },
  signinLinkBold: {
    color: '#C46C27',
    fontWeight: '800',
  },
});
