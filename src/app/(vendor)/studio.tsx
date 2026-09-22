import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppSelector } from '@/store';
import { Colors, FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';

export default function VendorStudioScreen() {
  const router = useRouter();
  const auth = useAppSelector((state) => state.auth);
  const { user, vendor } = auth;
  const [refreshing, setRefreshing] = useState(false);
  const [activeStageTab, setActiveStageTab] = useState<'all' | 'design' | 'crafting' | 'inspection'>('all');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleAction = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  // Sample Custom Commission items in workshop
  const studioCommissions = [
    {
      id: 'COMM-8821',
      title: 'Hand-Carved Mahogany Royal Benin Mask',
      client: 'Adewale O.',
      timeline: 'Due in 4 days',
      stage: 'crafting',
      progress: 65,
      budget: '₦185,000',
    },
    {
      id: 'COMM-8824',
      title: 'Bespoke Aso-Oke Wedding Ensemble (Gold Threading)',
      client: 'Dr. Folake B.',
      timeline: 'Due in 8 days',
      stage: 'design',
      progress: 25,
      budget: '₦320,000',
    },
    {
      id: 'COMM-8819',
      title: 'Bronze Casted Ife Head Figurine',
      client: 'Kofi Mensah',
      timeline: 'Inspection Ready',
      stage: 'inspection',
      progress: 95,
      budget: '₦140,000',
    },
  ];

  const filteredCommissions =
    activeStageTab === 'all'
      ? studioCommissions
      : studioCommissions.filter((c) => c.stage === activeStageTab);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FFD79E"
          colors={['#C46C27']}
        />
      }
    >
      {/* Studio Workshop Hero Banner Card */}
      <View style={[styles.heroCard, Shadows.md]}>
        <LinearGradient
          colors={['#3E1C03', '#241205', '#160B05']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.heroGoldenRim} />

        <View style={styles.heroHeader}>
          <View style={styles.studioAvatarCircle}>
            <Ionicons name="color-palette" size={32} color="#FFD79E" />
          </View>
          <View style={styles.heroInfoCol}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.studioTitle} numberOfLines={1}>
                {vendor?.businessName || `${user?.firstName || 'Artisan'}'s Studio`}
              </Text>
              <Ionicons name="checkmark-circle" size={18} color="#009D1A" style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.studioCategory}>Bespoke Crafting & Custom Commissions</Text>
            <Text style={styles.studioLocation}>
              <Ionicons name="sparkles" size={12} color="#FFD79E" /> Master Artisan Workbench Active
            </Text>
          </View>
        </View>

        {/* Studio Workshop Live Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>3</Text>
            <Text style={styles.metricLbl}>Active Commissions</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>₦645k</Text>
            <Text style={styles.metricLbl}>In-Studio Value</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>100%</Text>
            <Text style={styles.metricLbl}>Milestone On-Time</Text>
          </View>
        </View>
      </View>

      {/* Quick Studio Operations */}
      <Text style={styles.sectionHeader}>STUDIO ACTIONS</Text>

      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionCard, Shadows.sm]}
          onPress={() => handleAction('/(vendor)/requests')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#FFEDD5' }]}>
            <Ionicons name="hammer-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Custom Requests</Text>
          <Text style={styles.actionDesc}>Review incoming bespoke bids</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, Shadows.sm]}
          onPress={() => handleAction('/(vendor)/orders')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="construct-outline" size={22} color="#B45309" />
          </View>
          <Text style={styles.actionTitle}>Work in Progress</Text>
          <Text style={styles.actionDesc}>Update crafting milestones</Text>
        </TouchableOpacity>
      </View>

      {/* Studio Workbench Pipeline Header & Tabs */}
      <View style={styles.pipelineHeaderRow}>
        <Text style={styles.sectionHeaderNoMargin}>ACTIVE COMMISSIONS</Text>
        <TouchableOpacity
          onPress={() => handleAction('/(vendor)/requests')}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllLink}>View All Bids →</Text>
        </TouchableOpacity>
      </View>

      {/* Stage Filter Chips */}
      <View style={styles.filterChipRow}>
        {(
          [
            { key: 'all', label: 'All (3)' },
            { key: 'design', label: 'Design (1)' },
            { key: 'crafting', label: 'Crafting (1)' },
            { key: 'inspection', label: 'Inspection (1)' },
          ] as const
        ).map((tab) => {
          const isActive = activeStageTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveStageTab(tab.key);
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Commission Cards */}
      <View style={styles.commissionsList}>
        {filteredCommissions.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.commissionCard, Shadows.sm]}
            onPress={() => handleAction('/(vendor)/requests')}
            activeOpacity={0.85}
          >
            <View style={styles.commCardTop}>
              <View style={styles.commIdBadge}>
                <Text style={styles.commIdText}>{item.id}</Text>
              </View>
              <Text style={styles.commBudgetText}>{item.budget}</Text>
            </View>

            <Text style={styles.commTitle}>{item.title}</Text>

            <View style={styles.commClientRow}>
              <Ionicons name="person-outline" size={13} color="#9E8C7A" />
              <Text style={styles.commClientText}>Patron: {item.client}</Text>
              <Text style={styles.commDot}>•</Text>
              <Ionicons name="time-outline" size={13} color="#C46C27" />
              <Text style={styles.commTimelineText}>{item.timeline}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
              </View>
              <Text style={styles.progressPercent}>{item.progress}%</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0703',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 110, // Avoid bottom tab bar obstruction
  },
  heroCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    padding: Spacing.lg,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.35)',
    marginBottom: Spacing.lg,
  },
  heroGoldenRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FFD79E',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studioAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#381A05',
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
  studioTitle: {
    fontSize: 18,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF3D6',
    flexShrink: 1,
  },
  studioCategory: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsMedium,
    color: '#D4A373',
    marginTop: 2,
  },
  studioLocation: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    color: '#FFD79E',
    marginTop: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 243, 214, 0.06)',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 158, 0.15)',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 17,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFD79E',
  },
  metricLbl: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsRegular,
    color: '#9E8C7A',
    marginTop: 2,
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(212, 163, 115, 0.2)',
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
    color: '#D4A373',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  sectionHeaderNoMargin: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
    color: '#D4A373',
    letterSpacing: 0.8,
  },
  pipelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: 2,
  },
  seeAllLink: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsMedium,
    color: '#FFD79E',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1E0D03',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.2)',
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF3D6',
  },
  actionDesc: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    color: '#9E8C7A',
    marginTop: 2,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginVertical: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 243, 214, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.2)',
  },
  filterChipActive: {
    backgroundColor: '#C46C27',
    borderColor: '#FFD79E',
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
    color: '#9E8C7A',
  },
  filterChipTextActive: {
    color: '#FFF3D6',
    fontFamily: FontFamily.poppinsBold,
  },
  commissionsList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  commissionCard: {
    backgroundColor: '#1A0B03',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.2)',
  },
  commCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commIdBadge: {
    backgroundColor: 'rgba(196, 108, 39, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 158, 0.3)',
  },
  commIdText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFD79E',
  },
  commBudgetText: {
    fontSize: 15,
    fontFamily: FontFamily.poppinsBold,
    color: '#009D1A',
  },
  commTitle: {
    fontSize: 14,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF3D6',
    marginBottom: 6,
  },
  commClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  commClientText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    color: '#9E8C7A',
    marginLeft: 4,
  },
  commDot: {
    color: '#9E8C7A',
    marginHorizontal: 6,
  },
  commTimelineText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
    color: '#FFD79E',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C46C27',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
    color: '#D4A373',
    minWidth: 30,
    textAlign: 'right',
  },
});
