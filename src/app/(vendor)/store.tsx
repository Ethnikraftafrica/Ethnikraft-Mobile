import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppSelector } from '@/store';
import { Colors, FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';

export default function VendorStoreScreen() {
  const router = useRouter();
  const auth = useAppSelector((state) => state.auth);
  const { user, vendor } = auth;

  const handleAction = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Workshop Hero Banner Card */}
      <View style={[styles.heroCard, Shadows.md]}>
        <LinearGradient
          colors={['#3E1C03', '#241205', '#160B05']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.heroGoldenRim} />

        <View style={styles.heroHeader}>
          <View style={styles.storeAvatarCircle}>
            <Ionicons name="storefront" size={32} color="#FFD79E" />
          </View>
          <View style={styles.heroInfoCol}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.storeTitle} numberOfLines={1}>
                {vendor?.businessName || `${user?.firstName || 'Artisan'}'s Workshop`}
              </Text>
              <Ionicons name="checkmark-circle" size={18} color="#009D1A" style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.storeCategory}>African Luxury Heritage Crafts</Text>
            <Text style={styles.storeLocation}>
              <Ionicons name="location-sharp" size={12} color="#C46C27" /> Lagos State, Nigeria
            </Text>
          </View>
        </View>

        {/* Workshop Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>38</Text>
            <Text style={styles.metricLbl}>Crafts Listed</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>142</Text>
            <Text style={styles.metricLbl}>Orders Fulfilled</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>4.9 ★</Text>
            <Text style={styles.metricLbl}>Artisan Rating</Text>
          </View>
        </View>
      </View>

      {/* Quick Atelier Management Grid */}
      <Text style={styles.sectionHeader}>STOREFRONT OPERATIONS</Text>

      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionCard, Shadows.sm]}
          onPress={() => handleAction('/(vendor)/catalog')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#FFEDD5' }]}>
            <Ionicons name="cube-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Products & Stock</Text>
          <Text style={styles.actionDesc}>Manage live craft inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, Shadows.sm]}
          onPress={() => handleAction('/(vendor)/payouts')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="wallet-outline" size={22} color="#15803D" />
          </View>
          <Text style={styles.actionTitle}>Payouts & Escrow</Text>
          <Text style={styles.actionDesc}>Withdraw workshop earnings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, Shadows.sm]}
          onPress={() => handleAction('/(vendor)/requests')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="hammer-outline" size={22} color="#B45309" />
          </View>
          <Text style={styles.actionTitle}>Bespoke Studio</Text>
          <Text style={styles.actionDesc}>Review custom client bids</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, Shadows.sm]}
          onPress={() => handleAction('/(auth)/vendor-documents')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#0369A1" />
          </View>
          <Text style={styles.actionTitle}>Verification Hub</Text>
          <Text style={styles.actionDesc}>CAC & workshop certifications</Text>
        </TouchableOpacity>
      </View>

      {/* About Your Atelier Section */}
      <Text style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>ARTISAN ORIGIN & STORY</Text>
      <View style={[styles.storyCard, Shadows.sm]}>
        <Text style={styles.storyText}>
          Master artisan specializing in traditional bronze casting, bespoke embroidery, and sustainable handwoven materials. Every piece tells a story of African heritage and authentic craftsmanship passed down through generations.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 110,
  },
  heroCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.3)',
    marginBottom: Spacing.lg,
  },
  heroGoldenRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#C46C27',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  storeAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2A1405',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD79E',
  },
  heroInfoCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeTitle: {
    fontSize: 18,
    fontFamily: FontFamily.cormorantBold,
    color: '#FFF3D6',
  },
  storeCategory: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    color: '#FFD79E',
    marginTop: 1,
  },
  storeLocation: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsRegular,
    color: '#A8998A',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.2)',
  },
  metricCol: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF3D6',
  },
  metricLbl: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsRegular,
    color: '#A8998A',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(212, 163, 115, 0.2)',
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
    color: '#662502',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  actionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#341B00',
  },
  actionDesc: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsRegular,
    color: '#8A7B6D',
    marginTop: 2,
  },
  storyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  storyText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsRegular,
    color: '#4A3B2C',
    lineHeight: 19,
  },
});
