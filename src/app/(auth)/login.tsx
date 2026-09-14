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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLoginMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store';
import { setAuthSuccess, setRole } from '@/store/slices/authSlice';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'customer' | 'artisan'>('customer');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordInputRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email and password.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await login({
        email: email.trim(),
        password,
      }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dispatch(setAuthSuccess(response));

      // Route based on role
      if (response.user.role === 'VENDOR' || response.vendor) {
        dispatch(setRole('vendor'));
        router.replace('/(vendor)');
      } else {
        dispatch(setRole('user'));
        router.replace('/(user)');
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        err?.data?.message ||
        err?.error ||
        'Unable to sign in. Please verify your credentials.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleGuestContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setRole('user'));
    router.replace('/(user)');
  };

  const handleOpenVendorOnboarding = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('https://vendor.ethnikraft.africa/auth/sign-up').catch(() => {
      router.push('/(auth)/register');
    });
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
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="sparkles" size={26} color="#F5EBD5" />
            </View>
            <Text style={styles.brandTitle}>ETHNIKRAFT</Text>
            <Text style={styles.brandSubtitle}>African Luxury Heritage & Artisan Commerce</Text>
            <Text style={styles.signInHeading}>Sign In</Text>
          </View>

          {/* Portal Type Toggle */}
          <View style={[styles.typeSelector, Shadows.sm]}>
            <TouchableOpacity
              style={[
                styles.typeTab,
                loginType === 'customer' && styles.typeTabActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setLoginType('customer');
              }}
            >
              <Ionicons
                name="bag-handle-outline"
                size={16}
                color={loginType === 'customer' ? '#FFFFFF' : '#662502'}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.typeTabText,
                  loginType === 'customer' && styles.typeTabTextActive,
                ]}
              >
                Customer Portal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeTab,
                loginType === 'artisan' && styles.typeTabActiveVendor,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setLoginType('artisan');
              }}
            >
              <Ionicons
                name="hammer-outline"
                size={16}
                color={loginType === 'artisan' ? '#FFFFFF' : '#662502'}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.typeTabText,
                  loginType === 'artisan' && styles.typeTabTextActive,
                ]}
              >
                Artisan Vendor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Notification */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#C92929" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Main Credentials Form Card */}
          <View style={[styles.formCard, Shadows.lg]}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#662502" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={loginType === 'customer' ? 'you@domain.com' : 'workshop@artisan.com'}
                placeholderTextColor="#A8998A"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
            </View>

            <View style={styles.passwordRowHeader}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(auth)/forgot-password');
                }}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#662502" style={styles.inputIcon} />
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor="#A8998A"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#662502"
                />
              </TouchableOpacity>
            </View>

            {/* Submit CTA Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                loginType === 'artisan' && styles.submitBtnVendor,
                isLoading && { opacity: 0.7 },
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {loginType === 'customer' ? 'Continue to Boutique' : 'Access Artisan Hub'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Or Continue With Divider */}
            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Button */}
            <TouchableOpacity
              style={styles.socialBtn}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleGuestContinue();
              }}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 8 }} />
              <Text style={styles.socialBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Subtle Region Badge */}
            <View style={styles.locationBadge}>
              <Ionicons name="globe-outline" size={12} color="#662502" style={{ marginRight: 4 }} />
              <Text style={styles.locationText}>Detected Region: International / West Africa</Text>
            </View>
          </View>

          {/* Footer Area */}
          <View style={styles.footerContainer}>
            <View style={styles.createAccountRow}>
              <Text style={styles.footerText}>New to Ethnikraft? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.footerLinkBold}>Create account »</Text>
              </TouchableOpacity>
            </View>

            {/* Vendor Onboarding Callout Box */}
            <TouchableOpacity
              style={styles.vendorBox}
              onPress={handleOpenVendorOnboarding}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.vendorBoxTitle}>Want to sell on Ethnikraft?</Text>
                <Text style={styles.vendorBoxSub}>Create a free business account</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#C46C27" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.guestBtn} onPress={handleGuestContinue}>
              <Text style={styles.guestBtnText}>Explore Boutique as Guest</Text>
              <Ionicons name="arrow-forward" size={14} color="#341B00" />
            </TouchableOpacity>

            <Text style={styles.disclaimerText}>
              By continuing, you confirm that you're an adult and agree that you have read and accepted our{' '}
              <Text style={styles.legalLink}>Ethnikraft Free Membership Agreement</Text> and{' '}
              <Text style={styles.legalLink}>Privacy Policy</Text>.
            </Text>
          </View>
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
    paddingTop: Spacing.xl + 8,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#341B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#341B00',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#662502',
    marginTop: 2,
    fontWeight: '500',
  },
  signInHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#101213',
    marginTop: Spacing.sm + 4,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(234, 224, 211, 0.7)',
    borderRadius: Radius.full,
    padding: 4,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
  },
  typeTabActive: {
    backgroundColor: '#C46C27', // Terracotta Orange
  },
  typeTabActiveVendor: {
    backgroundColor: '#341B00', // Deep Wood
  },
  tabIcon: {
    marginRight: 6,
  },
  typeTabText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: '#662502',
  },
  typeTabTextActive: {
    color: '#FFFFFF',
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
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: '#B91C1C',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#EFE7DA',
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#662502',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  passwordRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
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
    marginRight: Spacing.sm,
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
  forgotText: {
    fontSize: Typography.fontSize.xs,
    color: '#C46C27',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#C46C27',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitBtnVendor: {
    backgroundColor: '#341B00',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E4DACB',
  },
  dividerText: {
    paddingHorizontal: Spacing.sm,
    fontSize: 11,
    fontWeight: '600',
    color: '#662502',
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4DACB',
    borderRadius: Radius.md,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  socialBtnText: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '700',
    color: '#341B00',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
  },
  locationText: {
    fontSize: 10,
    color: '#662502',
    fontWeight: '500',
  },
  footerContainer: {
    alignItems: 'center',
  },
  createAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: '#662502',
  },
  footerLinkBold: {
    color: '#C46C27',
    fontWeight: '800',
    fontSize: Typography.fontSize.sm,
  },
  vendorBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7DA',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  vendorBoxTitle: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '700',
    color: '#341B00',
  },
  vendorBoxSub: {
    fontSize: 11,
    color: '#C46C27',
    fontWeight: '600',
    marginTop: 2,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  guestBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: '#341B00',
  },
  disclaimerText: {
    fontSize: 10,
    color: '#662502',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: Spacing.sm,
  },
  legalLink: {
    color: '#0152AB',
    textDecorationLine: 'underline',
  },
});
