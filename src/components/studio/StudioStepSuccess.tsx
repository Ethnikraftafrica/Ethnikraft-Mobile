import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { StudioDetails } from '@/store/slices/studioSlice';

interface StudioStepSuccessProps {
  selectedCategory: string;
  details: StudioDetails;
  imagesCount: number;
  vendorSelectionMode: 'BROADCAST' | 'DIRECT';
  onViewHub: () => void;
  onStartAnother: () => void;
}

export const StudioStepSuccess: React.FC<StudioStepSuccessProps> = ({
  selectedCategory,
  details,
  imagesCount,
  vendorSelectionMode,
  onViewHub,
  onStartAnother,
}) => {
  const handleViewHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onViewHub();
  };

  const handleStartAnother = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStartAnother();
  };

  const budgetNum = parseInt(details.budget.replace(/[^0-9]/g, '')) || 20000;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Celebration Badge & Title */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles" size={36} color={Colors.accentGold} />
          </View>
          <Text style={styles.title}>Commission Live in Studio!</Text>
          <Text style={styles.subtitle}>
            Your bespoke {selectedCategory.toLowerCase()} project has been submitted to verified African master craftsmen.
          </Text>
        </View>

        {/* Commission Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {details.title || `Bespoke ${selectedCategory} Commission`}
            </Text>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>OPEN FOR BIDS</Text>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Craft Category</Text>
              <Text style={styles.metaValue}>{selectedCategory}</Text>
            </View>

            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Budget Allocation</Text>
              <Text style={[styles.metaValue, { color: Colors.primaryDark, fontFamily: Typography.fontFamily.poppinsBold }]}>
                ₦{budgetNum.toLocaleString()}
              </Text>
            </View>

            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Fabric / Material</Text>
              <Text style={styles.metaValue}>
                {details.material || 'Artisan Choice'}
              </Text>
            </View>

            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Target Delivery</Text>
              <Text style={styles.metaValue}>
                {details.deliveryWeeks} Week{parseInt(details.deliveryWeeks) > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {imagesCount > 0 && (
            <View style={styles.imagesRow}>
              <Ionicons name="images-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.imagesCountText}>
                {imagesCount} reference photograph{imagesCount > 1 ? 's' : ''} attached
              </Text>
            </View>
          )}

          <View style={styles.broadcastBanner}>
            <Ionicons
              name={vendorSelectionMode === 'BROADCAST' ? 'globe-outline' : 'person-circle-outline'}
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.broadcastText}>
              {vendorSelectionMode === 'BROADCAST'
                ? 'Broadcasted across the open Guild Marketplace.'
                : 'Directly sent to selected specialist artisans.'}
            </Text>
          </View>
        </View>

        {/* What happens next roadmap */}
        <View style={styles.roadmapCard}>
          <Text style={styles.roadmapTitle}>What Happens Next?</Text>

          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}><Text style={styles.stepNum}>1</Text></View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepHeading}>Artisan Review & Quotes</Text>
              <Text style={styles.stepSub}>Master artisans review your sketches and submit milestone pricing.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}><Text style={styles.stepNum}>2</Text></View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepHeading}>Accept Quote & Fund Escrow</Text>
              <Text style={styles.stepSub}>Compare quotes, message artisans directly, and lock funds safely in escrow.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}><Text style={styles.stepNum}>3</Text></View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepHeading}>Tailoring & Milestone Delivery</Text>
              <Text style={styles.stepSub}>Receive photo updates of your piece in production until doorstep delivery.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleStartAnother}
          style={styles.anotherButton}
        >
          <Text style={styles.anotherButtonText}>New Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleViewHub}
          style={styles.viewHubButton}
        >
          <Text style={styles.viewHubButtonText}>Go to Studio Hub</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: 120,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.accentGold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md + 2,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#361300',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: '#92400E',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm + 2,
    marginBottom: Spacing.sm + 2,
  },
  metaCol: {
    width: '47%',
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  imagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  imagesCountText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
  },
  broadcastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  broadcastText: {
    flex: 1,
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.primaryDark,
  },
  roadmapCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  roadmapTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
    alignItems: 'flex-start',
  },
  stepNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  stepNum: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primaryDark,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepHeading: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  stepSub: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: Spacing.sm + 2,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  anotherButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  anotherButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  viewHubButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
  },
  viewHubButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
});
