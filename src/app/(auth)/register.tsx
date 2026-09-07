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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useInitiateRegisterMutation,
  useInitiateVendorRegisterMutation,
} from '@/store/api/authApi';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [initiateRegister, { isLoading: isRegisteringUser }] =
    useInitiateRegisterMutation();
  const [initiateVendorRegister, { isLoading: isRegisteringVendor }] =
    useInitiateVendorRegisterMutation();

  const [role, setRole] = useState<'user' | 'vendor'>('user');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmitting = isRegisteringUser || isRegisteringVendor;

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMessage('Please fill in all required fields.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (role === 'vendor' && !storeName.trim()) {
      setErrorMessage('Please provide your workshop or store name.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (role === 'vendor') {
        const res = await initiateVendorRegister({
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          storeName: storeName.trim(),
        }).unwrap();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push({
          pathname: '/(auth)/otp-verify',
          params: {
            registrationToken: res.registrationToken,
            email: email.trim(),
            role: 'vendor',
            storeName: storeName.trim(),
          },
        });
      } else {
        const res = await initiateRegister({
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }).unwrap();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push({
          pathname: '/(auth)/otp-verify',
          params: {
            registrationToken: res.registrationToken,
            email: email.trim(),
            role: 'user',
          },
        });
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        err?.data?.message || err?.error || 'Failed to initiate registration.';
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
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primaryDark} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Join Ethnikraft</Text>
          <Text style={styles.subtitle}>
            Experience luxury African craft or launch your master artisan workshop.
          </Text>
        </View>

        {/* Role Toggle Selector */}
        <View style={[styles.roleCard, Shadows.sm]}>
          <TouchableOpacity
            style={[styles.roleOption, role === 'user' && styles.roleOptionActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setRole('user');
            }}
          >
            <Ionicons
              name="bag-handle"
              size={18}
              color={role === 'user' ? Colors.textInverse : Colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.roleOptionText,
                role === 'user' && styles.roleOptionTextActive,
              ]}
            >
              I am a Customer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleOption,
              role === 'vendor' && styles.roleOptionActiveVendor,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setRole('vendor');
            }}
          >
            <Ionicons
              name="hammer"
              size={18}
              color={role === 'vendor' ? Colors.textInverse : Colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.roleOptionText,
                role === 'vendor' && styles.roleOptionTextActive,
              ]}
            >
              I am an Artisan
            </Text>
          </TouchableOpacity>
        </View>

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Registration Form */}
        <View style={styles.formCard}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1, marginRight: Spacing.xs }}>
              <Text style={styles.inputLabel}>FIRST NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Kwame"
                placeholderTextColor={Colors.textMuted}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.xs }}>
              <Text style={styles.inputLabel}>LAST NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Mensah"
                placeholderTextColor={Colors.textMuted}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            placeholder="kwame@artisan.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {role === 'vendor' && (
            <>
              <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>WORKSHOP / STORE NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ashanti Royal Looms"
                placeholderTextColor={Colors.textMuted}
                value={storeName}
                onChangeText={setStoreName}
              />
            </>
          )}

          <TouchableOpacity
            style={[
              styles.submitBtn,
              role === 'vendor' && styles.submitBtnVendor,
              isSubmitting && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.submitBtnText}>Continue to Verification</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={styles.signinLink}
        >
          <Text style={styles.signinText}>
            Already have an account?{' '}
            <Text style={styles.signinLinkBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  roleCard: {
    flexDirection: 'row',
    backgroundColor: '#EAE1D2',
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  roleOptionActive: {
    backgroundColor: Colors.primary,
  },
  roleOptionActiveVendor: {
    backgroundColor: Colors.secondary,
  },
  roleOptionText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  roleOptionTextActive: {
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
  nameRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 6,
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
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitBtnVendor: {
    backgroundColor: Colors.secondary,
  },
  submitBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  signinLink: {
    alignItems: 'center',
  },
  signinText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  signinLinkBold: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
