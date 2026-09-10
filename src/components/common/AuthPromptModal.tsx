import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface AuthPromptModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  visible,
  onClose,
  title = 'Sign in to continue',
  message = 'You need an account to access this page. It only takes a minute to get started.',
}) => {
  const router = useRouter();

  if (!visible) return null;

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push('/(auth)/login');
  };

  const handleRegister = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push('/(auth)/register');
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheetContainer, Shadows.lg]}>
              {/* Handle Bar */}
              <View style={styles.handleBar} />

              {/* Lock Icon Badge */}
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={26} color="#B45309" />
              </View>

              {/* Title & Description */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{message}</Text>

              {/* Primary Action: Sign In */}
              <TouchableOpacity
                style={[styles.primaryBtn, Shadows.sm]}
                onPress={handleSignIn}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryBtnText}>Sign In</Text>
              </TouchableOpacity>

              {/* Secondary Action: Create Account */}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleRegister}
                activeOpacity={0.88}
              >
                <Text style={styles.secondaryBtnText}>Create an Account</Text>
              </TouchableOpacity>

              {/* Dismiss Action */}
              <TouchableOpacity
                style={styles.laterBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.laterBtnText}>Maybe later</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl + 12,
    alignItems: 'center',
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E0D8',
    marginBottom: Spacing.lg,
  },
  lockBadge: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#FFF8ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#101213',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#C46C27', // Terracotta
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginBottom: Spacing.sm + 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C46C27',
    marginBottom: Spacing.md,
  },
  secondaryBtnText: {
    color: '#101213',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  laterBtn: {
    paddingVertical: Spacing.xs,
  },
  laterBtnText: {
    color: '#9CA3AF',
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
});
