import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useGetMatchingVendorsQuery } from '@/store/api/studioApi';
import { MOCK_ARTISANS } from './studioData';

interface StudioStepVendorsProps {
  selectedCategory: string;
  vendorSelectionMode: 'BROADCAST' | 'DIRECT';
  selectedVendorIds: string[];
  isSubmitting?: boolean;
  onSetMode: (mode: 'BROADCAST' | 'DIRECT') => void;
  onToggleVendor: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onClearVendors: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const StudioStepVendors: React.FC<StudioStepVendorsProps> = ({
  selectedCategory,
  vendorSelectionMode,
  selectedVendorIds,
  isSubmitting = false,
  onSetMode,
  onToggleVendor,
  onSelectAll,
  onClearVendors,
  onSubmit,
  onBack,
}) => {
  const [search, setSearch] = useState('');

  const { data: liveVendors, isLoading: isLoadingVendors } = useGetMatchingVendorsQuery({
    category: selectedCategory,
  });

  const baseArtisansList = useMemo(() => {
    if (isLoadingVendors) {
      return [];
    }
    if (liveVendors && liveVendors.length > 0) {
      return liveVendors;
    }
    return MOCK_ARTISANS;
  }, [liveVendors, isLoadingVendors]);

  const relevantArtisans = useMemo(() => {
    return baseArtisansList.filter((a) => {
      const matchesCategory =
        !a.category ||
        a.category.toUpperCase() === selectedCategory.toUpperCase() ||
        selectedCategory === 'ALL' ||
        baseArtisansList.length <= 3;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        (a.specialty && a.specialty.toLowerCase().includes(q)) ||
        (a.location && a.location.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [baseArtisansList, selectedCategory, search]);

  const handleModeChange = useCallback(
    (mode: 'BROADCAST' | 'DIRECT') => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSetMode(mode);
    },
    [onSetMode]
  );

  const handleSelectAllToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedVendorIds.length === relevantArtisans.length && relevantArtisans.length > 0) {
      onClearVendors();
    } else {
      onSelectAll(relevantArtisans.map((a) => a.id));
    }
  }, [onClearVendors, onSelectAll, relevantArtisans, selectedVendorIds.length]);

  const handleVendorPress = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggleVendor(id);
    },
    [onToggleVendor]
  );

  const handleSubmit = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit();
  }, [onSubmit]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="people" size={14} color={Colors.primary} />
            <Text style={styles.badgeText}>STEP 4 OF 4</Text>
          </View>
          <Text style={styles.title}>Artisan Matching</Text>
          <Text style={styles.subtitle}>
            Broadcast to our verified master artisans or hand-pick specific craftsmen for your commission.
          </Text>
        </View>

        {/* Mode Selector Tabs */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleModeChange('BROADCAST')}
            style={[
              styles.modeTab,
              vendorSelectionMode === 'BROADCAST' && styles.modeTabSelected,
            ]}
          >
            <Ionicons
              name="globe-outline"
              size={16}
              color={
                vendorSelectionMode === 'BROADCAST'
                  ? Colors.primaryDark
                  : Colors.textSecondary
              }
            />
            <Text
              numberOfLines={1}
              style={[
                styles.modeTabText,
                vendorSelectionMode === 'BROADCAST' && styles.modeTabTextSelected,
              ]}
            >
              Public Broadcast
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleModeChange('DIRECT')}
            style={[
              styles.modeTab,
              vendorSelectionMode === 'DIRECT' && styles.modeTabSelected,
            ]}
          >
            <Ionicons
              name="person-circle-outline"
              size={16}
              color={
                vendorSelectionMode === 'DIRECT'
                  ? Colors.primaryDark
                  : Colors.textSecondary
              }
            />
            <Text
              numberOfLines={1}
              style={[
                styles.modeTabText,
                vendorSelectionMode === 'DIRECT' && styles.modeTabTextSelected,
              ]}
            >
              Private Invite
            </Text>
          </TouchableOpacity>
        </View>

        {vendorSelectionMode === 'BROADCAST' ? (
          /* Public Broadcast Benefit Card */
          <View style={styles.broadcastCard}>
            <View style={styles.broadcastIconRow}>
              <View style={styles.broadcastIconBox}>
                <Ionicons name="radio" size={26} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.broadcastTitle}>Open Artisan Marketplace</Text>
                  <View style={styles.recBadge}>
                    <Text style={styles.recBadgeText}>RECOMMENDED</Text>
                  </View>
                </View>
                <Text style={styles.broadcastDesc}>
                  Your custom request will be broadcast to all verified {selectedCategory.toLowerCase()} guild masters across Lagos, Abuja, Kano, and Benin.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.benefitText}>
                  Receive competitive quotes & portfolio samples within 24 hours.
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
                <Text style={styles.benefitText}>
                  100% Escrow Protection — artisans are paid only upon milestone inspection.
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="chatbubbles" size={18} color={Colors.accentGold} />
                <Text style={styles.benefitText}>
                  Direct chat & photo progress updates during tailoring / production.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* Direct Private Invite List */
          <View style={styles.directSection}>
            {/* Search Box */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={16}
                color={Colors.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={`Search ${selectedCategory.toLowerCase()} artisans...`}
                placeholderTextColor={Colors.textMuted}
                style={styles.searchInput}
              />
            </View>

            {/* Select All Row */}
            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderText}>
                {isLoadingVendors
                  ? 'Finding Artisans...'
                  : `${relevantArtisans.length} Verified Artisan${relevantArtisans.length !== 1 ? 's' : ''}`}
              </Text>
              {!isLoadingVendors && relevantArtisans.length > 0 && (
                <TouchableOpacity onPress={handleSelectAllToggle}>
                  <Text style={styles.selectAllText}>
                    {selectedVendorIds.length === relevantArtisans.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Artisan Cards or Loading / Empty States */}
            {isLoadingVendors ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>
                  Discovering verified {selectedCategory.toLowerCase()} master artisans for your commission...
                </Text>
              </View>
            ) : relevantArtisans.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={28} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No matching artisans found</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting your search query or switch to Public Broadcast to reach all verified artisans.
                </Text>
              </View>
            ) : (
              <View style={styles.artisansList}>
                {relevantArtisans.map((artisan) => {
                  const isSelected = selectedVendorIds.includes(artisan.id);
                  return (
                    <TouchableOpacity
                      key={artisan.id}
                      activeOpacity={0.85}
                      onPress={() => handleVendorPress(artisan.id)}
                      style={[
                        styles.artisanCard,
                        isSelected && styles.artisanCardSelected,
                      ]}
                    >
                      <Image
                        source={{ uri: artisan.avatar }}
                        style={styles.artisanAvatar}
                        contentFit="cover"
                        transition={150}
                      />

                      <View style={styles.artisanInfo}>
                        <View style={styles.artisanNameRow}>
                          <Text style={styles.artisanName} numberOfLines={1}>
                            {artisan.name}
                          </Text>
                          <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                        </View>

                        <Text style={styles.artisanSpecialty} numberOfLines={1}>
                          {artisan.specialty}
                        </Text>

                        <View style={styles.artisanMetaRow}>
                          <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color="#EAB308" />
                            <Text style={styles.ratingText}>
                              {artisan.rating} ({artisan.reviewCount})
                            </Text>
                          </View>
                          <Text style={styles.metaDot}>•</Text>
                          <Text style={styles.locationText}>{artisan.location}</Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.checkboxCircle,
                          isSelected && styles.checkboxCircleSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isSubmitting}
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isSubmitting}
          onPress={handleSubmit}
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color={Colors.textInverse} />
              <Text style={styles.submitButtonText}>
                Launch Studio Request
              </Text>
            </>
          )}
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
    marginBottom: Spacing.lg,
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
    paddingHorizontal: Spacing.xs,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
  },
  modeTabSelected: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  modeTabText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textSecondary,
  },
  modeTabTextSelected: {
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primaryDark,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  recBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
    letterSpacing: 0.5,
  },
  broadcastCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#361300',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  broadcastIconRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  broadcastIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  broadcastTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  broadcastDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  benefitsList: {
    gap: Spacing.sm + 2,
  },
  benefitItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  directSection: {
    gap: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textPrimary,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: Spacing.xs,
  },
  listHeaderText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  selectAllText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
  },
  artisansList: {
    gap: Spacing.sm,
  },
  artisanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  artisanCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFDF9',
  },
  artisanAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
    backgroundColor: Colors.surfaceMuted,
  },
  artisanInfo: {
    flex: 1,
  },
  artisanNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  artisanName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  artisanSpecialty: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  artisanMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textPrimary,
  },
  metaDot: {
    marginHorizontal: 4,
    color: Colors.textMuted,
  },
  locationText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  checkboxCircleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
