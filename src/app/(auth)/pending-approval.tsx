import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useDispatch } from 'react-redux';
import { logout, setRole } from '@/store/slices/authSlice';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export default function PendingApprovalScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  const handleExploreGuest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setRole('user'));
    router.replace('/(user)');
  };

  const handleContactSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('mailto:support@ethnikraft.com?subject=Artisan%20Account%20Approval%20Inquiry');
  };

  return (
    <LinearGradient
      colors={['#FCF4E1', '#F5EBD5']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Pill */}
        <View style={styles.statusPill}>
          <View style={styles.amberDot} />
          <Text style={styles.statusPillText}>STATUS: UNDER REVIEW</Text>
        </View>

        {/* Icon Circle */}
        <View style={styles.iconCircle}>
          <Ionicons name="time" size={32} color="#D97706" />
        </View>

        {/* Header */}
        <Text style={styles.title}>Account Pending Approval</Text>
        <Text style={styles.subtitle}>
          Thank you for completing your artisan registration! Your workshop is currently being reviewed by our curation team.
        </Text>

        {/* What Happens Next Card */}
        <View style={[styles.card, Shadows.md]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#341B00" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>What happens next?</Text>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.bulletNumber}>
              <Text style={styles.bulletText}>1</Text>
            </View>
            <Text style={styles.itemText}>
              Our curation team evaluates your craft details and verification documents to uphold Ethnikraft luxury standards.
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.bulletNumber}>
              <Text style={styles.bulletText}>2</Text>
            </View>
            <Text style={styles.itemText}>
              Review typically takes <Text style={{ fontWeight: '700' }}>1–3 business days</Text>.
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.bulletNumber}>
              <Text style={styles.bulletText}>3</Text>
            </View>
            <Text style={styles.itemText}>
              You will receive an official email confirmation as soon as your workshop is activated.
            </Text>
          </View>
        </View>

        {/* Support Card */}
        <View style={[styles.card, Shadows.sm, { marginTop: Spacing.md }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail-unread-outline" size={18} color="#662502" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitleSmall}>Need assistance?</Text>
          </View>
          <Text style={styles.supportDesc}>
            Have questions about your application or need to update your documents? Contact our artisan liaison desk anytime.
          </Text>
          <TouchableOpacity onPress={handleContactSupport} style={styles.emailBtn}>
            <Ionicons name="mail-outline" size={14} color="#C46C27" style={{ marginRight: 6 }} />
            <Text style={styles.emailBtnText}>support@ethnikraft.com</Text>
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.btnGuest, Shadows.sm]}
            onPress={handleExploreGuest}
            activeOpacity={0.85}
          >
            <Ionicons name="compass-outline" size={18} color="#341B00" style={{ marginRight: 6 }} />
            <Text style={styles.btnGuestText}>Explore Marketplace as Guest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSignOut}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color="#887B6C" style={{ marginRight: 6 }} />
            <Text style={styles.btnSignOutText}>Sign Out & Return Later</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + 10,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: Spacing.md,
  },
  amberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#341B00',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    color: '#662502',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
    lineHeight: 18,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm + 1,
    fontWeight: '800',
    color: '#341B00',
  },
  sectionTitleSmall: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '700',
    color: '#341B00',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm + 4,
  },
  bulletNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#662502',
  },
  itemText: {
    flex: 1,
    fontSize: 12,
    color: '#662502',
    lineHeight: 18,
  },
  supportDesc: {
    fontSize: 12,
    color: '#662502',
    lineHeight: 17,
    marginBottom: Spacing.sm,
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FCFAF7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  emailBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C46C27',
  },
  actionContainer: {
    width: '100%',
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  btnGuest: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#341B00',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  btnGuestText: {
    color: '#341B00',
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
  },
  btnSignOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  btnSignOutText: {
    fontSize: Typography.fontSize.xs,
    color: '#887B6C',
    fontWeight: '700',
  },
});
