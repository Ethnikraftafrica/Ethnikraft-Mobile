import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { StudioDetails } from '@/store/slices/studioSlice';
import { CATEGORY_CONFIG, CATEGORY_MATERIALS } from './studioData';

interface StudioStepDetailsProps {
  details: StudioDetails;
  selectedCategory: string;
  onUpdateDetails: (updates: Partial<StudioDetails>) => void;
  onNext: () => void;
  onBack: () => void;
}

const COLOR_PRESETS = [
  { name: 'Ochre Bronze', hex: '#C46C27' },
  { name: 'Royal Burgundy', hex: '#800020' },
  { name: 'Heritage Gold', hex: '#D4AF37' },
  { name: 'African Indigo', hex: '#1E3A8A' },
  { name: 'Emerald Palm', hex: '#065F46' },
  { name: 'Ebony Black', hex: '#1C1917' },
  { name: 'Warm Cream', hex: '#FAF6F0' },
];

const WEEKS_OPTIONS = ['1', '2', '3', '4', '6', '8'];

export const StudioStepDetails: React.FC<StudioStepDetailsProps> = ({
  details,
  selectedCategory,
  onUpdateDetails,
  onNext,
  onBack,
}) => {
  const categoryConfig = useMemo(
    () => CATEGORY_CONFIG[selectedCategory.toUpperCase()] || CATEGORY_CONFIG.WEARS,
    [selectedCategory]
  );
  const materialGroups = useMemo(
    () => CATEGORY_MATERIALS[selectedCategory.toUpperCase()] || CATEGORY_MATERIALS.WEARS,
    [selectedCategory]
  );

  const handleWeeksSelect = useCallback(
    (weeks: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const weeksNum = parseInt(weeks) || 2;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + weeksNum * 7);
      const isoDate = targetDate.toISOString().split('T')[0];
      onUpdateDetails({
        deliveryWeeks: weeks,
        deliveryDate: isoDate,
      });
    },
    [onUpdateDetails]
  );

  const handleBudgetQuickAdd = useCallback(
    (delta: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const currentBudget = parseInt(details.budget.replace(/[^0-9]/g, '')) || 20000;
      const newBudget = Math.max(5000, currentBudget + delta);
      onUpdateDetails({ budget: newBudget.toString() });
    },
    [details.budget, onUpdateDetails]
  );

  const handleQuantityChange = useCallback(
    (delta: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const current = parseInt(details.quantity) || 1;
      const updated = Math.max(1, current + delta);
      onUpdateDetails({ quantity: updated.toString() });
    },
    [details.quantity, onUpdateDetails]
  );

  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [onNext]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step Indicator Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="create-outline" size={14} color={Colors.primary} />
            <Text style={styles.badgeText}>STEP 3 OF 4</Text>
          </View>
          <Text style={styles.title}>Bespoke Specifications</Text>
          <Text style={styles.subtitle}>
            Fine-tune fabrics, measurements, delivery timeline, and budget for your {selectedCategory.toLowerCase()}.
          </Text>
        </View>

        {/* 1. Item Name / Title */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Commission Title <Text style={styles.optionalText}>(Optional)</Text>
          </Text>
          <TextInput
            value={details.title}
            onChangeText={(text) => onUpdateDetails({ title: text })}
            placeholder={categoryConfig.titlePlaceholder}
            placeholderTextColor={Colors.textMuted}
            style={styles.textInput}
          />
        </View>

        {/* 2. Category-Specific Material Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Fabric & Material Type <Text style={styles.optionalText}>(Optional)</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalChips}
          >
            {materialGroups.map((group) =>
              group.materials.map((mat) => {
                const isSelected = details.material === mat;
                return (
                  <TouchableOpacity
                    key={mat}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onUpdateDetails({ material: isSelected ? '' : mat });
                    }}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {mat}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* 3. Color Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Color Palette & Accents <Text style={styles.optionalText}>(Optional)</Text>
          </Text>
          <View style={styles.colorPresetsRow}>
            {COLOR_PRESETS.map((c) => {
              const isSelected = details.color === c.hex;
              return (
                <TouchableOpacity
                  key={c.hex}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onUpdateDetails({ color: isSelected ? '' : c.hex });
                  }}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c.hex },
                    isSelected && styles.colorCircleSelected,
                  ]}
                >
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={c.hex === '#FAF6F0' ? Colors.textPrimary : '#FFFFFF'}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Sizing (if applicable) */}
        {categoryConfig.showSize && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Size Specification <Text style={styles.optionalText}>(Optional)</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalChips}
            >
              {categoryConfig.sizes.map((s) => {
                const isSelected = details.size === s;
                return (
                  <TouchableOpacity
                    key={s}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onUpdateDetails({ size: isSelected ? '' : s });
                    }}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 5. Quality Tier Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Craft Quality Tier</Text>
          <View style={styles.qualityRow}>
            {['Standard', 'Premium', 'Luxury'].map((tier) => {
              const isSelected = details.quality === tier;
              return (
                <TouchableOpacity
                  key={tier}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onUpdateDetails({ quality: tier as any });
                  }}
                  style={[
                    styles.qualityCard,
                    isSelected && styles.qualityCardSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.qualityTitle,
                      isSelected && styles.qualityTitleSelected,
                    ]}
                  >
                    {tier}
                  </Text>
                  <Text style={styles.qualitySub}>
                    {tier === 'Standard'
                      ? 'Quality machine stitch'
                      : tier === 'Premium'
                      ? 'Hand-stitched details'
                      : 'Master craftsman luxury'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 6. Profile Measurements Toggle & Input */}
        {categoryConfig.showMeasurements && (
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Measurements & Fitting</Text>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleText}>Use Profile Fit</Text>
                <Switch
                  value={details.useProfileMeasurements}
                  onValueChange={(val) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onUpdateDetails({
                      useProfileMeasurements: val,
                      measurements: val ? 'Profile Measurements Linked' : '',
                    });
                  }}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={details.useProfileMeasurements ? Colors.primary : '#FFFFFF'}
                />
              </View>
            </View>

            <TextInput
              value={details.measurements}
              editable={!details.useProfileMeasurements}
              onChangeText={(text) => onUpdateDetails({ measurements: text })}
              placeholder={categoryConfig.measurementPlaceholder}
              placeholderTextColor={Colors.textMuted}
              style={[
                styles.textInput,
                details.useProfileMeasurements && styles.textInputDisabled,
              ]}
            />
          </View>
        )}

        {/* 7. Quantity & Budget Row */}
        <View style={styles.rowTwoCols}>
          {/* Quantity */}
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>
              Quantity <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                onPress={() => handleQuantityChange(-1)}
                style={styles.stepperBtn}
              >
                <Ionicons name="remove" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{details.quantity}</Text>
              <TouchableOpacity
                onPress={() => handleQuantityChange(1)}
                style={styles.stepperBtn}
              >
                <Ionicons name="add" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Budget Input */}
          <View style={[styles.formGroup, { flex: 1.6 }]}>
            <Text style={styles.label}>
              Estimated Budget <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              value={details.budget}
              onChangeText={(text) =>
                onUpdateDetails({ budget: text.replace(/[^0-9]/g, '') })
              }
              keyboardType="numeric"
              placeholder="20000"
              placeholderTextColor={Colors.textMuted}
              style={styles.textInput}
            />
          </View>
        </View>

        {/* Quick Budget Increment Chips */}
        <View style={styles.budgetPillsRow}>
          <Text style={styles.quickLabel}>Quick Add:</Text>
          {[5000, 10000, 25000, 50000].map((amount) => (
            <TouchableOpacity
              key={amount}
              onPress={() => handleBudgetQuickAdd(amount)}
              style={styles.budgetChip}
            >
              <Text style={styles.budgetChipText}>+₦{(amount / 1000)}k</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 8. Delivery Timeline */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              Target Delivery Timeline <Text style={styles.requiredStar}>*</Text>
            </Text>
            {details.deliveryDate ? (
              <Text style={styles.datePreview}>
                Due:{' '}
                <Text style={styles.dateBold}>
                  {new Date(details.deliveryDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </Text>
            ) : null}
          </View>
          <View style={styles.weeksRow}>
            {WEEKS_OPTIONS.map((w) => {
              const isSelected = details.deliveryWeeks === w;
              return (
                <TouchableOpacity
                  key={w}
                  onPress={() => handleWeeksSelect(w)}
                  style={[
                    styles.weekChip,
                    isSelected && styles.weekChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekChipText,
                      isSelected && styles.weekChipTextSelected,
                    ]}
                  >
                    {w}w
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 9. Notes & Additional Style Details */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Special Instructions & Notes <Text style={styles.optionalText}>(Optional)</Text>
          </Text>
          <TextInput
            value={details.notes}
            onChangeText={(text) => onUpdateDetails({ notes: text })}
            placeholder={categoryConfig.detailsPlaceholder}
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.textInput, styles.textArea]}
          />
        </View>
      </ScrollView>

      {/* Fixed bottom bar with CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>
            {categoryConfig.ctaLabel}
          </Text>
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
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  header: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primaryDark,
    letterSpacing: 0.8,
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
  formGroup: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  optionalText: {
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  requiredStar: {
    color: '#DC2626',
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textPrimary,
  },
  textInputDisabled: {
    backgroundColor: Colors.surfaceSubtle,
    color: Colors.textMuted,
  },
  textArea: {
    minHeight: 90,
  },
  horizontalChips: {
    gap: Spacing.xs + 2,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.textInverse,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
  },
  colorPresetsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: Colors.primary,
    transform: [{ scale: 1.1 }],
  },
  qualityRow: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
  },
  qualityCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  qualityCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFDF9',
  },
  qualityTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  qualityTitleSelected: {
    color: Colors.primaryDark,
  },
  qualitySub: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    lineHeight: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textSecondary,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 48,
  },
  stepperBtn: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  budgetPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
  },
  quickLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textMuted,
  },
  budgetChip: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  budgetChipText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.primaryDark,
  },
  datePreview: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
  },
  dateBold: {
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.primary,
  },
  weeksRow: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
  },
  weekChip: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  weekChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weekChipText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textPrimary,
  },
  weekChipTextSelected: {
    color: Colors.textInverse,
    fontFamily: Typography.fontFamily.poppinsBold,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    backgroundColor: Colors.surface,
  },
  backButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
  },
  continueButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
});
