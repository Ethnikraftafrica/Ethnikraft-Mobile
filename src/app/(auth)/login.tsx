import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="sparkles" size={24} color={Colors.accentGold} />
          </View>
          <Text style={styles.brandTitle}>ETHNIKRAFT</Text>
          <Text style={styles.brandSubtitle}>African Luxury Heritage & Artisan Commerce</Text>
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
              color={loginType === 'customer' ? Colors.textInverse : Colors.textSecondary}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.typeTabText,
                loginType === 'customer' && styles.typeTabTextActive,
              ]}
            >
              Customer
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
              color={loginType === 'artisan' ? Colors.textInverse : Colors.textSecondary}
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
            <Ionicons name="alert-circle" size={18} color={Colors.danger} style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Credentials Form */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={loginType === 'customer' ? 'you@domain.com' : 'workshop@artisan.com'}
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>PASSWORD</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              loginType === 'artisan' && styles.submitBtnVendor,
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.submitBtnText}>
                {loginType === 'customer' ? 'Sign In to Boutique' : 'Access Artisan Hub'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Secondary Links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.createAccountBtn}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.footerLinkBold}>Create an account</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.orDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.guestBtn} onPress={handleGuestContinue}>
            <Text style={styles.guestBtnText}>Explore Boutique as Guest</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primaryDark,
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#EAE1D2',
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.md,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  typeTabActive: {
    backgroundColor: Colors.primary,
  },
  typeTabActiveVendor: {
    backgroundColor: Colors.secondary,
  },
  tabIcon: {
    marginRight: 6,
  },
  typeTabText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  typeTabTextActive: {
    color: Colors.textInverse,
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#EFE7DA',
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
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
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  forgotText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  submitBtnVendor: {
    backgroundColor: Colors.secondary,
  },
  submitBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  footerLinks: {
    alignItems: 'center',
  },
  createAccountBtn: {
    padding: Spacing.sm,
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  footerLinkBold: {
    color: Colors.primary,
    fontWeight: '800',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    width: '80%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5DAC8',
  },
  dividerText: {
    paddingHorizontal: Spacing.sm,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  guestBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
