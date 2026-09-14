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
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export default function OtpVerifyScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{
    registrationToken: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    storeName?: string;
  }>();

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirmPasswordRef = useRef<TextInput>(null);

  const [verifyOtp, { isLoading: isVerifyingUser }] = useVerifyOtpMutation();
  const [completeRegister, { isLoading: isCompletingUser }] = useCompleteRegisterMutation();
  const [verifyVendorOtp, { isLoading: isVerifyingVendor }] = useVerifyVendorOtpMutation();
  const [completeVendorRegister, { isLoading: isCompletingVendor }] =
    useCompleteVendorRegisterMutation();

  const isVendor = params.role === 'vendor';
  const isVerifying = isVerifyingUser || isVerifyingVendor;
  const isCompleting = isCompletingUser || isCompletingVendor;

  // Password validation checklist matching Ethnikraft backend
  const validations = [
    { label: '6–20 characters', test: (p: string) => p.length >= 6 && p.length <= 20 },
    { label: 'Contains at least an uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Contains at least a number', test: (p: string) => /\d/.test(p) },
    { label: 'Contains at least a special character', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
  ];

  // Step 1: Verify OTP
  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code sent to your email.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isVendor) {
        const res = await verifyVendorOtp({
          registrationToken: params.registrationToken,
          otp: trimmedOtp,
        }).unwrap();
        setVerificationToken(res.verificationToken);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const res = await verifyOtp({
          registrationToken: params.registrationToken,
          otp: trimmedOtp,
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
    if (!password || password.length < 6) {
      setErrorMessage('Password must be between 6 and 20 characters.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!verificationToken) {
      setErrorMessage('Verification session expired. Please verify code again.');
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isVendor) {
        const res = await completeVendorRegister({
          verificationToken,
          firstName: params.firstName || 'Artisan',
          lastName: params.lastName || 'Creator',
          email: params.email,
          phoneNumber: params.phoneNumber || '+2348012345678',
          password,
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

          <View style={styles.iconCircle}>
            <Ionicons
              name={verificationToken ? 'lock-closed' : 'mail-unread'}
              size={28}
              color="#F5EBD5"
            />
          </View>

          <Text style={styles.title}>
            {verificationToken ? 'Create Password' : 'Verify Account'}
          </Text>
          <Text style={styles.subtitle}>
            {verificationToken
              ? 'Create a secure password to finalize your Ethnikraft account.'
              : `Enter the 6-digit verification code sent to ${params.email || 'your email'}.`}
          </Text>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#C92929" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {!verificationToken ? (
            /* Step 1 Form: OTP Verification */
            <View style={[styles.card, Shadows.lg]}>
              <Text style={styles.inputLabel}>VERIFICATION CODE</Text>
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
                style={[styles.btn, isVerifying && { opacity: 0.7 }]}
                onPress={handleVerifyOtp}
                disabled={isVerifying}
                activeOpacity={0.88}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnText}>Verify Code & Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Step 2 Form: Password Creation with Checklist */
            <View style={[styles.card, Shadows.lg]}>
              <Text style={styles.inputLabel}>CREATE PASSWORD *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#662502" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#A8998A"
                  value={password}
                  onChangeText={setPassword}
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

              <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>CONFIRM PASSWORD *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#662502" style={styles.inputIcon} />
                <TextInput
                  ref={confirmPasswordRef}
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#A8998A"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleCompleteRegistration}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#662502"
                  />
                </TouchableOpacity>
              </View>

              {/* Realtime Password Criteria Checklist */}
              <View style={styles.checklistContainer}>
                {validations.map((item, idx) => {
                  const passed = item.test(password);
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
                style={[
                  styles.btn,
                  isVendor && styles.btnVendor,
                  isCompleting && { opacity: 0.7 },
                ]}
                onPress={handleCompleteRegistration}
                disabled={isCompleting}
                activeOpacity={0.88}
              >
                {isCompleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnText}>Complete Registration</Text>
                )}
              </TouchableOpacity>
            </View>
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
  btnVendor: {
    backgroundColor: '#341B00',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
});
