import React, { useState, useRef, useEffect } from 'react';
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
  useInitiateRegisterMutation,
  useInitiateVendorRegisterMutation,
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
  const [currentRegistrationToken, setCurrentRegistrationToken] = useState(
    params.registrationToken
  );
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const confirmPasswordRef = useRef<TextInput>(null);

  const [verifyOtp, { isLoading: isVerifyingUser }] = useVerifyOtpMutation();
  const [completeRegister, { isLoading: isCompletingUser }] = useCompleteRegisterMutation();
  const [verifyVendorOtp, { isLoading: isVerifyingVendor }] = useVerifyVendorOtpMutation();
  const [completeVendorRegister, { isLoading: isCompletingVendor }] =
    useCompleteVendorRegisterMutation();

  const [initiateRegister] = useInitiateRegisterMutation();
  const [initiateVendorRegister] = useInitiateVendorRegisterMutation();

  const isVendor = params.role === 'vendor';
  const isVerifying = isVerifyingUser || isVerifyingVendor;
  const isCompleting = isCompletingUser || isCompletingVendor;
  const minPasswordLength = isVendor ? 8 : 6;

  // Countdown timer effect
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Password validation checklist matching Ethnikraft backend
  const validations = [
    {
      label: isVendor ? '8–20 characters' : '6–20 characters',
      test: (p: string) => p.length >= minPasswordLength && p.length <= 20,
    },
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

    const activeToken = currentRegistrationToken || params.registrationToken || '';
    if (!activeToken) {
      setErrorMessage('Registration token missing. Please return to the registration screen and try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isVendor) {
        const res = await verifyVendorOtp({
          registrationToken: activeToken,
          otp: trimmedOtp,
        }).unwrap();
        const vToken = res?.verificationToken || (res as any)?.data?.verificationToken || '';
        setVerificationToken(vToken);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const res = await verifyOtp({
          registrationToken: activeToken,
          otp: trimmedOtp,
        }).unwrap();
        const vToken = res?.verificationToken || (res as any)?.data?.verificationToken || '';
        setVerificationToken(vToken);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.data?.message || err?.error || 'Invalid or expired OTP code.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  // Step 1: Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0 || isResending || !params.email) return;

    setIsResending(true);
    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (isVendor) {
        const res = await initiateVendorRegister({
          email: params.email.trim(),
        }).unwrap();
        const nextToken = res?.registrationToken || (res as any)?.data?.registrationToken || '';
        if (nextToken) setCurrentRegistrationToken(nextToken);
        setOtp('');
        setTimer(60);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const res = await initiateRegister({
          email: params.email.trim(),
          firstName: params.firstName || '',
          lastName: params.lastName || '',
        }).unwrap();
        const nextToken = res?.registrationToken || (res as any)?.data?.registrationToken || '';
        if (nextToken) setCurrentRegistrationToken(nextToken);
        setOtp('');
        setTimer(60);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.data?.message || err?.error || 'Failed to resend code.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Complete Registration with Password
  const handleCompleteRegistration = async () => {
    if (!password || password.length < minPasswordLength) {
      setErrorMessage(`Password must be between ${minPasswordLength} and 20 characters.`);
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
        // Persist session tokens so subsequent API requests carry the Authorization header
        dispatch(setAuthSuccess(res));
        dispatch(setRole('vendor'));

        const createdVendorId = res.vendor?.id;
        // Transition to Step 3: Workshop Details
        router.replace({
          pathname: '/(auth)/vendor-business-info',
          params: {
            vendorId: createdVendorId,
            storeName: params.storeName || '',
            phoneNumber: params.phoneNumber || '',
            email: params.email || '',
          },
        });
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

              {/* Resend OTP Button with Countdown */}
              <View style={styles.resendContainer}>
                <Text style={styles.spamHint}>
                  If you don't see the email, please check your spam or junk folder.
                </Text>

                <TouchableOpacity
                  style={[styles.resendBtn, (timer > 0 || isResending) && { opacity: 0.6 }]}
                  onPress={handleResendOtp}
                  disabled={timer > 0 || isResending}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={14}
                    color="#C46C27"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.resendText}>
                    {timer > 0
                      ? `Resend code in (${timer}s)`
                      : isResending
                      ? 'Sending code...'
                      : 'Resend verification code'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.changeEmailBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.changeEmailText}>Wrong email? Change email address</Text>
                </TouchableOpacity>
              </View>
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
  resendContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  spamHint: {
    fontSize: 11,
    color: '#662502',
    textAlign: 'center',
    marginBottom: Spacing.sm + 2,
    lineHeight: 16,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendText: {
    fontSize: Typography.fontSize.xs,
    color: '#C46C27',
    fontWeight: '700',
  },
  changeEmailBtn: {
    marginTop: Spacing.sm,
    paddingVertical: 4,
  },
  changeEmailText: {
    fontSize: 11,
    color: '#808080',
    textDecorationLine: 'underline',
  },
});
