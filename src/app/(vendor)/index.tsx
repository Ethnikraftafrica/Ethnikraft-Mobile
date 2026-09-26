import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';
import { formatPrice } from '@/utils/price';
import {
  AddProductFigmaIcon,
  ViewProductsFigmaIcon,
  CustomBidsFigmaIcon,
  PackageFigmaIcon,
  StarFigmaIcon,
  IncomeFigmaIcon,
  TrendingUpFigmaIcon,
  StarOutlineFigmaIcon,
} from '@/components/vendor/DashboardFigmaIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HERO_BG_LIGHT = require('../../../assets/images/vendor-hero-bg.png');
const HERO_BG_DARK = require('../../../assets/images/vendor-hero-bg-dark.png');
const AVATAR_DEFAULT = require('../../../assets/images/vendor-avatar-default.png');

type RangePeriod = 'all_time' | 'this_week' | 'this_month' | 'today';

export default function ArtisanDashboardScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const auth = useAppSelector((state) => state.auth);
  const { user, vendor } = auth;
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<RangePeriod>('all_time');
  const [rangeModalVisible, setRangeModalVisible] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 750);
  };

  const handleCopyStoreLink = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNavigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const getRangeLabel = () => {
    switch (selectedRange) {
      case 'all_time':
        return 'All';
      case 'this_week':
        return 'Week';
      case 'this_month':
        return 'Month';
      case 'today':
        return 'Today';
    }
  };

  // Performance metrics corresponding directly to Figma 7274:15088 specs
  const getKpiData = () => {
    switch (selectedRange) {
      case 'today':
        return [
          {
            title: "Today's Revenue",
            value: formatPrice(85000, currencyCode, exchangeRate),
            badge: '+12.5% vs yesterday',
            type: 'revenue' as const,
          },
          {
            title: 'Orders in Studio',
            value: '2 Orders',
            badge: '1 ready to ship',
            type: 'orders' as const,
          },
          {
            title: 'Custom Requests',
            value: '2 Inquiries',
            badge: '1 new quote',
            type: 'requests' as const,
          },
          {
            title: 'Your rating',
            value: '4.98',
            hasStar: true,
            badge: '18 Reviews',
            type: 'rating' as const,
          },
        ];
      case 'this_month':
        return [
          {
            title: 'Monthly Revenue',
            value: formatPrice(2850000, currencyCode, exchangeRate),
            badge: '+24.2% vs last month',
            type: 'revenue' as const,
          },
          {
            title: 'Orders in Studio',
            value: '24 Orders',
            badge: '8 due this week',
            type: 'orders' as const,
          },
          {
            title: 'Custom Requests',
            value: '14 Inquiries',
            badge: '6 pending quotes',
            type: 'requests' as const,
          },
          {
            title: 'Your rating',
            value: '4.95',
            hasStar: true,
            badge: '380 Reviews',
            type: 'rating' as const,
          },
        ];
      case 'this_week':
      case 'all_time':
      default:
        return [
          {
            title: 'Weekly Revenue',
            value: currencyCode === 'GBP' ? '£ 698.95' : formatPrice(698.95 * 1800, currencyCode, exchangeRate),
            badge: '+18.4% vs last week',
            type: 'revenue' as const,
          },
          {
            title: 'Orders in Studio',
            value: '6 Orders',
            badge: '3 due for shipping',
            type: 'orders' as const,
          },
          {
            title: 'Custom Requests',
            value: '5 Inquiries',
            badge: '3 pending quotes',
            type: 'requests' as const,
          },
          {
            title: 'Your rating',
            value: '4.96',
            hasStar: true,
            badge: '142 Reviews',
            type: 'rating' as const,
          },
        ];
    }
  };

  // Recent in-studio orders
  const recentOrders = [
    {
      id: 'ORD-8942',
      customer: 'Chief Adebayo O.',
      item: 'Royal Hand-Carved Benin Leopard Bronze',
      amount: formatPrice(320000, currencyCode, exchangeRate),
      status: 'In Progress',
      statusColor: '#C46C27',
      edd: 'Sep 28, 2026',
    },
    {
      id: 'ORD-8938',
      customer: 'Dr. Folake B.',
      item: 'Vintage Indigo-Dyed Yoruba Adire Kaftan',
      amount: formatPrice(85000, currencyCode, exchangeRate),
      status: 'Due for shipping',
      statusColor: theme.success,
      edd: 'Tomorrow',
    },
    {
      id: 'ORD-8931',
      customer: 'Kofi Mensah',
      item: 'Custom Handwoven Ashanti Kente Sash',
      amount: formatPrice(145000, currencyCode, exchangeRate),
      status: 'Design Review',
      statusColor: '#556B2F',
      edd: 'Oct 02, 2026',
    },
  ];

  return (
    <View style={[styles.mainWrapper, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* ─── 1. HERO SECTION (FIGMA AUTHENTIC TEXTILE BACKDROP) ─── */}
        <View
          style={[
            styles.heroOuterWrap,
            {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(54, 19, 0, 0.25)',
              backgroundColor: isDark ? '#191919' : '#1E140A',
            },
          ]}
        >
          <Image
            source={isDark ? HERO_BG_DARK : HERO_BG_LIGHT}
            style={styles.heroBackgroundImage}
            resizeMode="cover"
          />
          <View style={styles.heroCard}>
            {/* Top Row: Avatar + Store Name + Category Pills */}
            <View style={styles.heroTopRow}>
              <Image source={AVATAR_DEFAULT} style={styles.artisanAvatar} />
              <View style={styles.heroHeaderInfo}>
                <Text style={styles.storeNameText} numberOfLines={1}>
                  {vendor?.businessName || "Greywolf's stiches"}
                </Text>
                <View style={styles.categoryPillsRow}>
                  {['Wears', 'Accessories', 'Crafts'].map((tag) => (
                    <View key={tag} style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Middle: Welcome Greeting & Quote */}
            <Text style={styles.heroGreetingText}>
              Welcome back, {user?.firstName || 'Kwame'}!
            </Text>
            <Text style={styles.heroQuoteText}>
              &ldquo;Your hands don&rsquo;t just create - that inspire... Lets create something amazing today&rdquo;
            </Text>

            {/* Bottom Row: Copy Link Action */}
            <View style={styles.heroBottomRow}>
              <TouchableOpacity
                style={styles.copyLinkBtn}
                onPress={handleCopyStoreLink}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copiedLink ? 'checkmark-circle' : 'copy-outline'}
                  size={15}
                  color="#FFFFFF"
                />
                <Text style={styles.copyLinkText}>
                  {copiedLink ? 'Copied' : 'Copy Link'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ─── 2. WORKSHOP PERFORMANCE HEADER & 2x2 METRICS GRID ─── */}
        <View style={styles.performanceHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Workshop Performance
          </Text>

          {/* Time Range Filter Pill (13px radius) */}
          <TouchableOpacity
            style={[
              styles.rangePillBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setRangeModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.rangePillText, { color: theme.textPrimary }]}>
              {getRangeLabel()}
            </Text>
            <Ionicons name="chevron-down" size={13} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* 2x2 Metric Cards Grid (Figma 183x130, 7px radius) */}
        <View style={styles.kpiGrid}>
          {getKpiData().map((kpi) => (
            <View
              key={kpi.title}
              style={[
                styles.kpiCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Top Pill Badge */}
              <View
                style={[
                  styles.kpiPillBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(10, 210, 79, 0.12)'
                      : 'rgba(0, 157, 26, 0.08)',
                  },
                ]}
              >
                {kpi.type === 'revenue' && (
                  <TrendingUpFigmaIcon size={6} color={isDark ? '#0AD24F' : '#009D1A'} />
                )}
                {kpi.type === 'orders' && (
                  <PackageFigmaIcon size={12} color={isDark ? '#0AD24F' : '#009D1A'} />
                )}
                {kpi.type === 'requests' && (
                  <IncomeFigmaIcon size={12} color={isDark ? '#0AD24F' : '#009D1A'} />
                )}
                {kpi.type === 'rating' && (
                  <StarOutlineFigmaIcon size={11} color={isDark ? '#0AD24F' : '#009D1A'} />
                )}
                <Text
                  style={[
                    styles.kpiPillText,
                    { color: isDark ? '#0AD24F' : '#009D1A' },
                  ]}
                >
                  {kpi.badge}
                </Text>
              </View>

              {/* Metric Main Value */}
              <View style={styles.kpiValueRow}>
                <Text style={[styles.kpiValueText, { color: theme.textPrimary }]}>
                  {kpi.value}
                </Text>
                {kpi.hasStar && (
                  <StarFigmaIcon
                    size={18}
                    color="#C46C27"
                    style={{ marginLeft: 5, marginBottom: 2 }}
                  />
                )}
              </View>

              {/* Subtitle */}
              <Text style={styles.kpiSubtitleText}>{kpi.title}</Text>
            </View>
          ))}
        </View>

        {/* ─── 3. THREE QUICK ACTION CARDS (FIGMA 130px HEIGHT, 32px ICONS) ─── */}
        <View style={styles.quickActionsRow}>
          {/* Action 1: Add a Product */}
          <TouchableOpacity
            style={[
              styles.quickActionCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => handleNavigate('/(vendor)/catalog')}
            activeOpacity={0.8}
          >
            <AddProductFigmaIcon size={32} color="#C46C27" />
            <Text style={[styles.quickActionLabel, { color: theme.textPrimary }]}>
              Add a Product
            </Text>
          </TouchableOpacity>

          {/* Action 2: View Products */}
          <TouchableOpacity
            style={[
              styles.quickActionCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => handleNavigate('/(vendor)/catalog')}
            activeOpacity={0.8}
          >
            <ViewProductsFigmaIcon size={32} color="#D27451" />
            <Text style={[styles.quickActionLabel, { color: theme.textPrimary }]}>
              View Products
            </Text>
          </TouchableOpacity>

          {/* Action 3: Custom Bids */}
          <TouchableOpacity
            style={[
              styles.quickActionCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => handleNavigate('/(vendor)/requests')}
            activeOpacity={0.8}
          >
            <CustomBidsFigmaIcon size={32} color="#556B2F" />
            <Text style={[styles.quickActionLabel, { color: theme.textPrimary }]}>
              Custom Bids
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── 4. STUDIO ORDERS SECTION (FIGMA FRAME 2454 & 2455) ─── */}
        <View style={styles.ordersHeaderRow}>
          <View style={styles.ordersTitleGroup}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Studio Orders
            </Text>
            <View style={styles.orderCountBadge}>
              <Text style={styles.orderCountBadgeText}>{recentOrders.length}</Text>
            </View>
          </View>
        </View>

        {/* Studio Orders Container Card (170px height, 7px radius) */}
        <TouchableOpacity
          style={[
            styles.ordersContainerBox,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
          onPress={() => handleNavigate('/(vendor)/orders')}
          activeOpacity={0.85}
        >
          {recentOrders.slice(0, 2).map((order, index) => (
            <View
              key={order.id}
              style={[
                styles.orderItemRow,
                index === 0 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.borderSubtle,
                },
              ]}
            >
              <View style={styles.orderItemLeft}>
                <View style={styles.orderIdStatusRow}>
                  <Text style={[styles.orderItemCode, { color: theme.primary }]}>
                    {order.id}
                  </Text>
                  <View
                    style={[
                      styles.orderItemStatusPill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.65)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.orderItemStatusText,
                        { color: order.statusColor },
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.orderItemTitle, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {order.item}
                </Text>

                <Text style={styles.orderItemCustomer}>
                  {order.customer} • <Text style={{ color: theme.textPrimary, fontFamily: FontFamily.headingBold }}>{order.amount}</Text>
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.textMuted}
              />
            </View>
          ))}
        </TouchableOpacity>
      </ScrollView>

      {/* ─── TIME RANGE PICKER MODAL ─────────────────────────── */}
      <Modal
        visible={rangeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRangeModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRangeModalVisible(false)}
        >
          <View
            style={[
              styles.rangeModalCard,
              {
                backgroundColor: isDark ? '#191919' : '#FCF4E1',
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>
              Select Performance Period
            </Text>

            {(
              [
                { key: 'all_time', label: 'All (Lifetime Overview)' },
                { key: 'this_week', label: 'Week (Last 7 Days)' },
                { key: 'this_month', label: 'Month (Last 30 Days)' },
                { key: 'today', label: 'Today (Live Summary)' },
              ] as const
            ).map((opt) => {
              const isSelected = selectedRange === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.modalOptionRow,
                    isSelected && {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.55)',
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedRange(opt.key);
                    setRangeModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      {
                        color: isSelected ? theme.primaryLight : theme.textPrimary,
                        fontFamily: isSelected
                          ? FontFamily.headingBold
                          : FontFamily.bodyRegular,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={theme.primaryLight} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 110,
  },

  // ─── 1. HERO SECTION ─────────────────────────────────────────
  heroOuterWrap: {
    borderRadius: Radius.xl, // 17px
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    position: 'relative',
  },
  heroBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: Radius.xl,
    resizeMode: 'cover',
  },
  heroCard: {
    width: '100%',
    padding: Spacing.md + 4,
    borderRadius: Radius.xl,
    minHeight: 200,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artisanAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#D1995A',
  },
  heroHeaderInfo: {
    marginLeft: 10,
    flex: 1,
  },
  storeNameText: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: 9.5,
    fontFamily: FontFamily.headingBold,
    color: '#000000',
  },
  heroGreetingText: {
    fontSize: 21,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
    marginTop: 14,
    letterSpacing: -0.3,
  },
  heroQuoteText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
    lineHeight: 17,
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  copyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  copyLinkText: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },

  // ─── 2. PERFORMANCE HEADER & KPIS ───────────────────────────
  performanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 20, // EXACT FIGMA 20px
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.3,
  },
  rangePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Radius.lg, // 13px
    borderWidth: 1,
    gap: 6,
  },
  rangePillText: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  kpiCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 10) / 2,
    height: 130, // EXACT FIGMA HEIGHT
    borderRadius: Radius.md, // 7px
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  kpiPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    height: 24, // EXACT FIGMA PILL HEIGHT
    borderRadius: 4,
    gap: 6,
  },
  kpiPillText: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  kpiValueText: {
    fontSize: 24, // EXACT FIGMA VALUE SIZE
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.4,
  },
  kpiSubtitleText: {
    fontSize: 12, // EXACT FIGMA SUBTITLE SIZE
    fontFamily: FontFamily.headingBold, // EXACT FIGMA BOLD SUBTITLE
    color: '#808080',
    marginTop: 1,
  },

  // ─── 3. THREE QUICK ACTION CARDS (FIGMA 130px HEIGHT) ────────
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  quickActionCard: {
    flex: 1,
    height: 130, // EXACT FIGMA HEIGHT
    borderRadius: Radius.md, // 7px
    borderWidth: 1,
    paddingTop: 22, // EXACT FIGMA TOP OFFSET
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  quickActionLabel: {
    fontSize: 14, // EXACT FIGMA 14px BOLD
    fontFamily: FontFamily.headingBold,
    marginTop: 24, // EXACT FIGMA 24px GAP
    textAlign: 'center',
    lineHeight: 18,
  },

  // ─── 4. STUDIO ORDERS SECTION (FIGMA 170px HEIGHT) ───────────
  ordersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ordersTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderCountBadge: {
    backgroundColor: '#C46C27',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  orderCountBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },
  ordersContainerBox: {
    height: 170, // EXACT FIGMA HEIGHT
    borderRadius: Radius.md, // 7px
    borderWidth: 1,
    padding: Spacing.sm,
    justifyContent: 'space-around',
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  orderItemLeft: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  orderIdStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  orderItemCode: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },
  orderItemStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderItemStatusText: {
    fontSize: 10,
    fontFamily: FontFamily.headingBold,
  },
  orderItemTitle: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
    marginBottom: 2,
  },
  orderItemCustomer: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: '#808080',
  },

  // ─── MODAL STYLES ───────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  rangeModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.md, // 7px
    borderWidth: 1,
    padding: Spacing.md,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
    marginBottom: 4,
  },
  modalOptionText: {
    fontSize: 13,
  },
});
