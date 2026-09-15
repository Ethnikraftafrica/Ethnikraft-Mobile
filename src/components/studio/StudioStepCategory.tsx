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
import { CRAFT_CATEGORIES, CraftCategory } from './studioData';

interface StudioStepCategoryProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onNext: () => void;
}

export const StudioStepCategory: React.FC<StudioStepCategoryProps> = ({
  selectedCategory,
  onSelectCategory,
  onNext,
}) => {
  const handleSelect = (categoryValue: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectCategory(categoryValue);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };

  const activeCategoryObj = CRAFT_CATEGORIES.find((c) => c.value === selectedCategory);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={14} color={Colors.primary} />
            <Text style={styles.badgeText}>STEP 1 OF 4</Text>
          </View>
          <Text style={styles.title}>Select Craft Category</Text>
          <Text style={styles.subtitle}>
            What bespoke masterpiece would you like our African artisans to handcraft for you?
          </Text>
        </View>

        <View style={styles.categoriesGrid}>
          {CRAFT_CATEGORIES.map((cat: CraftCategory) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => handleSelect(cat.value)}
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                ]}
              >
                <View
                  style={[
                    styles.iconWrapper,
                    isSelected ? styles.iconWrapperSelected : styles.iconWrapperDefault,
                  ]}
                >
                  <Ionicons
                    name={cat.iconName as any}
                    size={26}
                    color={isSelected ? Colors.textInverse : Colors.primary}
                  />
                </View>
                <View style={styles.cardInfo}>
                  <Text
                    style={[
                      styles.categoryName,
                      isSelected && styles.categoryNameSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  <Text style={styles.categoryTagline} numberOfLines={1}>
                    {cat.tagline}
                  </Text>
                </View>
                <View style={styles.radioCircle}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeCategoryObj && (
          <View style={styles.summaryBanner}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.summaryText}>
              Selected:{' '}
              <Text style={styles.summaryBold}>{activeCategoryObj.name}</Text> — Next, upload
              sketches or reference photos.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>
            Continue to Inspiration
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
    paddingBottom: 110,
  },
  header: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
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
  categoriesGrid: {
    gap: Spacing.sm + 2,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#361300',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoryCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFDF9',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconWrapperDefault: {
    backgroundColor: Colors.surfaceSubtle,
  },
  iconWrapperSelected: {
    backgroundColor: Colors.primary,
  },
  cardInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  categoryNameSelected: {
    color: Colors.primaryDark,
  },
  categoryTagline: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  summaryText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  summaryBold: {
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primaryDark,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
  },
  continueButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
});
