import React, { useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  openWizard,
  openDetailModal,
  openEditModal,
  openDeleteModal,
  setActiveFilter,
  setSearchQuery,
  StudioCustomRequest,
} from '@/store/slices/studioSlice';
import { useGetUserCustomRequestsQuery } from '@/store/api/studioApi';
import { AuthPromptModal } from '@/components/common/AuthPromptModal';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import {
  CRAFT_CATEGORIES,
  StudioRequestCard,
  CustomStudioWizardModal,
  StudioRequestDetailModal,
  StudioRequestEditModal,
  StudioRequestDeleteModal,
} from '@/components/studio';

const FILTERS: Array<{ key: 'ALL' | 'OPEN' | 'CLOSED' | 'COMPLETED' | 'CANCELLED'; label: string }> = [
  { key: 'ALL', label: 'All Requests' },
  { key: 'OPEN', label: 'Open for Bids' },
  { key: 'CLOSED', label: 'In Tailoring' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function StudioScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const {
    requests: localRequests,
    activeFilter,
    searchQuery,
  } = useAppSelector((state) => state.studio.hub);

  const [showAuthModal, setShowAuthModal] = React.useState(false);

  // Fetch live backend custom requests
  const {
    data: remoteRequests,
    isLoading,
    refetch,
  } = useGetUserCustomRequestsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated, refetch]);

  const liveRequests: StudioCustomRequest[] = useMemo(() => {
    if (!isAuthenticated) return localRequests;
    if (!remoteRequests) return [];
    return remoteRequests.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      categoryType: r.categoryType,
      materialType: r.materialType || 'Artisan Choice',
      colors: Array.isArray(r.colors) && r.colors.length > 0 ? r.colors : ['#C46C27'],
      quantity: r.quantity || 1,
      quality: r.materialQuality || 'Standard',
      budget: r.budget,
      timeline: r.timeline,
      status: (r.status === 'IN_PROGRESS' ? 'CLOSED' : r.status) as any,
      inspirationImages: r.inspirationImages || [],
      measurements: r.measurements,
      notes: r.description,
      createdAt: r.createdAt,
      bids: Array.isArray(r.bids)
        ? r.bids.map((b) => ({
            id: b.id,
            amount: b.price,
            status: b.status,
            message: b.notes,
            createdAt: b.submittedAt || b.createdAt,
            vendor: {
              id: b.vendor?.id || b.vendorId,
              businessName: b.vendor?.businessName || 'Artisan Workshop',
              profileImage: b.vendor?.profileImage,
              rating: b.vendor?.rating || 4.9,
              reviewCount: b.vendor?.reviewCount || 10,
              location: b.vendor?.cityOfOperation || 'West Africa',
            },
          }))
        : [],
    }));
  }, [isAuthenticated, remoteRequests, localRequests]);

  const handleStartCommission = useCallback(
    (category?: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!isAuthenticated) {
        setShowAuthModal(true);
        return;
      }
      dispatch(openWizard(category));
    },
    [dispatch, isAuthenticated]
  );

  const handleOpenDetail = useCallback((req: StudioCustomRequest) => {
    dispatch(openDetailModal(req));
  }, [dispatch]);

  const handleOpenEdit = useCallback((req: StudioCustomRequest) => {
    dispatch(openEditModal(req));
  }, [dispatch]);

  const handleOpenDelete = useCallback((req: StudioCustomRequest) => {
    dispatch(openDeleteModal(req));
  }, [dispatch]);

  const filteredRequests = useMemo(() => {
    return liveRequests.filter((r) => {
      const matchesFilter =
        activeFilter === 'ALL' || r.status === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.categoryType?.toLowerCase().includes(q) ||
        r.materialType?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [liveRequests, activeFilter, searchQuery]);

  // Live stats calculation
  const { openCount, inProgressCount, completedCount } = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let completed = 0;
    liveRequests.forEach((r) => {
      if (r.status === 'OPEN') open++;
      else if (r.status === 'CLOSED') inProgress++;
      else if (r.status === 'COMPLETED') completed++;
    });
    return { openCount: open, inProgressCount: inProgress, completedCount: completed };
  }, [liveRequests]);

  const renderItem = useCallback(
    ({ item }: { item: StudioCustomRequest }) => (
      <StudioRequestCard
        request={item}
        onPress={handleOpenDetail}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />
    ),
    [handleOpenDetail, handleOpenEdit, handleOpenDelete]
  );

  const keyExtractor = useCallback((item: StudioCustomRequest) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <View>
        {/* Luxury Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLogoWrapper}>
            <Image
              source={require('../../../assets/revamp/logo.jpg')}
              style={styles.heroLogoImage}
              contentFit="cover"
              transition={200}
            />
          </View>
          <Text style={styles.heroTitle}>Ethnikraft Custom Studio</Text>
          <Text style={styles.heroSubtitle}>
            Commission bespoke African apparel, footwear, jewelry, and fine heritage artwork tailored to your exact measurements, fabrics, and occasion.
          </Text>

          {/* Primary CTA */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleStartCommission()}
            style={styles.heroActionBtn}
          >
            <Ionicons name="add-circle" size={18} color={Colors.textInverse} />
            <Text style={styles.heroActionBtnText}>Start New Commission</Text>
          </TouchableOpacity>

          {/* Quick Category Chips */}
          <View style={styles.quickCatsContainer}>
            <Text style={styles.quickCatsLabel}>Popular Bespoke Crafts:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickCatsRow}
            >
              {CRAFT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.8}
                  onPress={() => handleStartCommission(cat.value)}
                  style={styles.quickCatChip}
                >
                  <Ionicons name={cat.iconName as any} size={14} color={Colors.primary} />
                  <Text style={styles.quickCatText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Live Studio Stats Ribbon */}
        <View style={styles.statsRibbon}>
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{openCount}</Text>
            <Text style={styles.statLabel}>Open Bids</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: Colors.primary }]}>
              {inProgressCount}
            </Text>
            <Text style={styles.statLabel}>In Tailoring</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: Colors.success }]}>
              {completedCount}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Search & Filter Header */}
        <View style={styles.feedHeader}>
          <Text style={styles.sectionTitle}>My Custom Requests</Text>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={(text) => dispatch(setSearchQuery(text))}
              placeholder="Search by title, fabric, category..."
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => dispatch(setSearchQuery(''))}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsRow}
          >
            {FILTERS.map((f) => {
              const isSelected = activeFilter === f.key;
              const count =
                f.key === 'ALL'
                  ? liveRequests.length
                  : liveRequests.filter((r) => r.status === f.key).length;

              return (
                <TouchableOpacity
                  key={f.key}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    dispatch(setActiveFilter(f.key));
                  }}
                  style={[
                    styles.filterPill,
                    isSelected && styles.filterPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected && styles.filterPillTextSelected,
                    ]}
                  >
                    {f.label}
                  </Text>
                  {count > 0 && (
                    <View
                      style={[
                        styles.filterBadge,
                        isSelected && styles.filterBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterBadgeText,
                          isSelected && styles.filterBadgeTextSelected,
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    ),
    [
      handleStartCommission,
      openCount,
      inProgressCount,
      completedCount,
      searchQuery,
      dispatch,
      activeFilter,
      liveRequests,
    ]
  );

  const ListEmpty = useMemo(
    () => (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="sparkles-outline" size={36} color={Colors.accentGold} />
        </View>
        <Text style={styles.emptyTitle}>
          {searchQuery ? 'No matching requests found' : 'No Active Studio Requests'}
        </Text>
        <Text style={styles.emptyDesc}>
          {searchQuery
            ? `No requests match "${searchQuery}". Try adjusting your search query.`
            : 'Commission personalized attire, jewelry, or artwork tailored to your exact measurements, fabrics, and occasion.'}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleStartCommission()}
          style={styles.emptyBtn}
        >
          <Text style={styles.emptyBtnText}>Start First Commission</Text>
        </TouchableOpacity>
      </View>
    ),
    [searchQuery, handleStartCommission]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredRequests}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 100, 120) },
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={7}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      />

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => handleStartCommission()}
        style={[
          styles.fab,
          { bottom: Math.max(insets.bottom + 85, 96) },
        ]}
      >
        <Ionicons name="add" size={28} color={Colors.textInverse} />
      </TouchableOpacity>

      {/* Modals */}
      <CustomStudioWizardModal />
      <StudioRequestDetailModal />
      <StudioRequestEditModal />
      <StudioRequestDeleteModal />
      <AuthPromptModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign In to Custom Studio"
        message="Sign in to commission bespoke pieces, view live artisan bids, and message master craftsmen."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  heroBanner: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
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
  heroLogoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(196, 108, 39, 0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#361300',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  heroLogoImage: {
    width: '100%',
    height: '100%',
  },
  heroTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
    maxWidth: 320,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.full,
    width: '100%',
    maxWidth: 280,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  heroActionBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
  },
  quickCatsContainer: {
    width: '100%',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quickCatsLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  quickCatsRow: {
    gap: 6,
  },
  quickCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickCatText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.primaryDark,
  },
  statsRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  statCol: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  feedHeader: {
    marginBottom: Spacing.sm + 2,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 2,
    marginBottom: Spacing.sm,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textPrimary,
  },
  filterPillsRow: {
    gap: 6,
    paddingBottom: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textSecondary,
  },
  filterPillTextSelected: {
    color: Colors.textInverse,
    fontFamily: Typography.fontFamily.poppinsBold,
  },
  filterBadge: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textSecondary,
  },
  filterBadgeTextSelected: {
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: Spacing.md,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
  },
  emptyBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsBold,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
