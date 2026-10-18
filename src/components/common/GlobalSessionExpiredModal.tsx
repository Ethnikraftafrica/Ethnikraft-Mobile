import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePathname, useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearSessionExpired, logout } from '@/store/slices/authSlice';
import { useAppTheme } from '@/hooks/useAppTheme';
import { FontFamily, Radius, Spacing } from '@/constants/theme';

export const GlobalSessionExpiredModal: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const sessionExpired = useAppSelector((state) => state.auth.sessionExpired);
  const { theme, isDark } = useAppTheme();

  // Do not show the session expired modal if the user is already on an auth screen (e.g., login, register, forgot-password)
  const isAuthScreen = pathname ? pathname.includes('(auth)') || pathname.includes('/login') : false;

  if (!sessionExpired || isAuthScreen) return null;

  const handleLoginRedirect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(clearSessionExpired());
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  return (
    <Modal
      transparent
      visible={sessionExpired}
      animationType="fade"
      onRequestClose={handleLoginRedirect}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Lock Icon Badge */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark
                  ? 'rgba(196, 108, 39, 0.15)'
                  : 'rgba(196, 108, 39, 0.10)',
              },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={32} color="#C46C27" />
          </View>

          {/* Heading & Explanation */}
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
            Session Expired
          </Text>
          <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
            Your security session has expired. Please sign in again to continue accessing your workshop and studio orders.
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleLoginRedirect}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Sign In Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.lg || 18,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 26,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  actionBtn: {
    backgroundColor: '#C46C27',
    borderRadius: 12,
    height: 46,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
