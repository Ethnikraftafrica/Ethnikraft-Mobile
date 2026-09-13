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
import { LinearGradient } from 'expo-linear-gradient';
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

          <View style={styles.header}>
            <Text style={styles.title}>Join Ethnikraft</Text>
            <Text style={styles.subtitle}>
              Experience luxury African craft or launch your master artisan workshop.
            </Text>
          </View>

          {/* Role Selection Tabs */}
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
                size={16}
                color={role === 'user' ? '#FFFFFF' : '#662502'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.roleOptionText,
                  role === 'user' && styles.roleOptionTextActive,
                ]}
              >
                Customer Account
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
                size={16}
                color={role === 'vendor' ? '#FFFFFF' : '#662502'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.roleOptionText,
                  role === 'vendor' && styles.roleOptionTextActive,
                ]}
              >
                Artisan Vendor
              </Text>
            </TouchableOpacity>
          </View>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#C92929" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Registration Form Card */}
          <View style={[styles.formCard, Shadows.lg]}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1, marginRight: Spacing.xs }}>
                <Text style={styles.inputLabel}>FIRST NAME *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={16} color="#662502" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Kwame"
                    placeholderTextColor="#A8998A"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                <Text style={styles.inputLabel}>LAST NAME *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={16} color="#662502" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mensah"
                    placeholderTextColor="#A8998A"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>EMAIL ADDRESS *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#662502" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="kwame@artisan.com"
                placeholderTextColor="#A8998A"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {role === 'vendor' && (
              <>
                <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>WORKSHOP / STORE NAME *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="storefront-outline" size={18} color="#662502" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Ashanti Royal Looms"
                    placeholderTextColor="#A8998A"
                    value={storeName}
                    onChangeText={setStoreName}
                  />
                </View>
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
              activeOpacity={0.88}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Continue to Verification</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Sign-In Prompt */}
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            style={styles.signinLink}
            activeOpacity={0.8}
          >
            <Text style={styles.signinText}>
              Already have an account?{' '}
              <Text style={styles.signinLinkBold}>Sign in »</Text>
            </Text>
          </TouchableOpacity>
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
  },
  backBtn: {
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
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#341B00',
  },
  subtitle: {
    fontSize: Typography.fontSize.xs + 1,
    color: '#662502',
    marginTop: 4,
    lineHeight: 18,
  },
  roleCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(234, 224, 211, 0.7)',
    borderRadius: Radius.full,
    padding: 4,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
  },
  roleOptionActive: {
    backgroundColor: '#C46C27',
  },
  roleOptionActiveVendor: {
    backgroundColor: '#341B00',
  },
  roleOptionText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: '#662502',
  },
  roleOptionTextActive: {
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
  nameRow: {
    flexDirection: 'row',
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
  signinLink: {
    alignItems: 'center',
    marginTop: Spacing.xs,
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
