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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RangePeriod = 'today' | 'this_week' | 'this_month' | 'all_time';

export default function ArtisanDashboardScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const auth = useAppSelector((state) => state.auth);
  const { user, vendor } = auth;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<RangePeriod>('this_week');
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

  // Dynamic KPI Data corresponding to Backend Overview metrics
  const getKpiData = () => {
    switch (selectedRange) {
      case 'today':
        return [
          { title: 'Today\'s Revenue', value: '₦85,000', change: '+12.5%', isPos: true, icon: 'cash-outline', iconColor: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7' },
          { title: 'Orders in Studio', value: '2 Pending', change: '1 ready to ship', isPos: true, icon: 'construct-outline', iconColor: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' },
          { title: 'Active Bids', value: '3 Inquiries', change: '2 new patrons', isPos: true, icon: 'hammer-outline', iconColor: theme.primary, bg: isDark ? 'rgba(196, 108, 39, 0.15)' : '#FFEDD5' },
          { title: 'Artisan Rating', value: '4.95 ★', change: 'Top 3% Atelier', isPos: true, icon: 'star-outline', iconColor: '#8B5CF6', bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE' },
        ];
      case 'this_month':
        return [
          { title: 'Month Revenue', value: '₦3,850,000', change: '+28.4%', isPos: true, icon: 'cash-outline', iconColor: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7' },
          { title: 'Completed Orders', value: '28 Fulfilled', change: '98% on-time', isPos: true, icon: 'checkmark-done-circle-outline', iconColor: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' },
          { title: 'Accepted Bids', value: '14 Custom Works', change: '+4 this week', isPos: true, icon: 'hammer-outline', iconColor: theme.primary, bg: isDark ? 'rgba(196, 108, 39, 0.15)' : '#FFEDD5' },
          { title: 'Artisan Rank', value: '#5 Nationwide', change: 'Steady Master', isPos: true, icon: 'trophy-outline', iconColor: '#8B5CF6', bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE' },
        ];
      case 'all_time':
        return [
          { title: 'Lifetime Gross', value: '₦18,420,000', change: '142 sales', isPos: true, icon: 'cash-outline', iconColor: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7' },
          { title: 'Total Products', value: '38 Listed', change: '4 collections', isPos: true, icon: 'cube-outline', iconColor: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' },
          { title: 'Custom Bids Won', value: '45 Bespoke', change: '₦4.8m volume', isPos: true, icon: 'hammer-outline', iconColor: theme.primary, bg: isDark ? 'rgba(196, 108, 39, 0.15)' : '#FFEDD5' },
          { title: 'Artisan Score', value: '98.5 / 100', change: 'Verified Master', isPos: true, icon: 'shield-checkmark-outline', iconColor: '#8B5CF6', bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE' },
        ];
      case 'this_week':
      default:
        return [
          { title: 'Weekly Revenue', value: '₦1,245,000', change: '+18.4% vs last week', isPos: true, icon: 'cash-outline', iconColor: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7' },
          { title: 'Orders in Studio', value: '6 Orders', change: '3 due for shipping', isPos: true, icon: 'construct-outline', iconColor: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' },
          { title: 'Custom Requests', value: '5 Inquiries', change: '3 pending quotes', isPos: true, icon: 'hammer-outline', iconColor: theme.primary, bg: isDark ? 'rgba(196, 108, 39, 0.15)' : '#FFEDD5' },
          { title: 'Artisan Rating', value: '4.96 ★', change: '142 Reviews', isPos: true, icon: 'star-outline', iconColor: '#8B5CF6', bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE' },
        ];
    }
  };

  // Recent In-Studio Orders matching backend order structure
  const recentOrders = [
    {
      id: 'ORD-8942',
      customer: 'Chief Adebayo O.',
      item: 'Royal Hand-Carved Benin Leopard Bronze',
      amount: '₦320,000',
      status: 'In Progress',
      statusColor: '#F59E0B',
      statusBg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
      edd: 'Sep 28, 2026',
      icon: 'sparkles',
    },
    {
      id: 'ORD-8938',
      customer: 'Dr. Folake B.',
      item: 'Vintage Indigo-Dyed Yoruba Adire Kaftan',
      amount: '₦85,000',
      status: 'Ready to Ship',
      statusColor: '#10B981',
      statusBg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#DCFCE7',
      edd: 'Tomorrow',
      icon: 'shirt-outline',
    },
    {
      id: 'ORD-8931',
      customer: 'Kofi Mensah',
      item: 'Custom Handwoven Ashanti Kente Sash',
      amount: '₦145,000',
      status: 'Design Review',
      statusColor: '#6366F1',
      statusBg: isDark ? 'rgba(99, 102, 241, 0.18)' : '#EEF2FF',
      edd: 'Oct 02, 2026',
      icon: 'color-palette-outline',
    },
  ];

  // Active Bespoke Inquiries
  const activeBespokeRequests = [
    {
      id: 'REQ-1092',
      patron: 'Amara Nwosu',
      requestTitle: 'Bespoke Igbo Ceremonial Beaded Coral Crown & Necklace',
      budget: '₦280,000',
      deadline: 'Needed by Oct 12',
      city: 'Enugu, Nigeria',
    },
    {
      id: 'REQ-1088',
      patron: 'Tariq Al-Mansoor',
      requestTitle: 'Hand-Carved Mahogany Royal Benin Mask Set (Pair)',
      budget: '₦450,000',
      deadline: 'Flexible Timeline',
      city: 'London, UK',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
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
      {/* ─── 1. MASTER ARTISAN HERO BANNER ────────────────────── */}
      <View style={[styles.heroCard, Shadows.md]}>
        <LinearGradient
          colors={
            isDark
              ? ['#361300', '#241205', '#120701']
              : ['#2A1203', '#3E1C03', '#241205']
          }
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Top Gold Accent Rim */}
        <View style={styles.heroGoldRim} />

        <View style={styles.heroTopRow}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Ionicons name="storefront" size={28} color="#FFD79E" />
            </View>
            <View style={styles.avatarBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#009D1A" />
            </View>
          </View>

          <View style={styles.heroTextCol}>
            <View style={styles.workshopBadgeRow}>
              <View style={styles.masterBadgePill}>
                <Ionicons name="shield-checkmark" size={11} color="#FFD79E" style={{ marginRight: 4 }} />
                <Text style={styles.masterBadgeText}>
                  {vendor?.status === 'APPROVED' ? 'MASTER ARTISAN WORKSHOP' : 'VERIFIED ARTISAN'}
                </Text>
              </View>
            </View>
            <Text style={styles.welcomeGreeting} numberOfLines={1}>
              Welcome back, {user?.firstName || 'Artisan'}! 🌟
            </Text>
            <Text style={styles.workshopBusinessName} numberOfLines={1}>
              {vendor?.businessName || "Your Atelier Workshop"}
            </Text>
          </View>
        </View>

        {/* Inspirational Slogan Quote */}
        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>
            “Your hands don&apos;t just create — they inspire. Let&apos;s craft something amazing today.”
          </Text>
        </View>

        {/* Copy Store Link Button */}
        <TouchableOpacity
          style={styles.storeLinkBar}
          onPress={handleCopyStoreLink}
          activeOpacity={0.8}
        >
          <Ionicons
            name={copiedLink ? 'checkmark-done-circle' : 'copy-outline'}
            size={16}
            color={copiedLink ? '#4ADE80' : '#FFD79E'}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.storeLinkText} numberOfLines={1}>
            {copiedLink
              ? 'Store Link Copied to Clipboard!'
              : `home.ethnikraft.africa/products/vendor/${vendor?.id ? vendor.id.slice(-6) : 'atelier'}`}
          </Text>
          <View style={styles.copyActionChip}>
            <Text style={styles.copyActionText}>{copiedLink ? 'Copied' : 'Share'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ─── 2. TIME RANGE SELECTOR & KPIS ────────────────────── */}
      <View style={styles.rangeHeaderRow}>
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
          WORKSHOP PERFORMANCE
        </Text>

        {/* Period Chips */}
        <View style={[styles.periodChipsWrap, { backgroundColor: isDark ? '#1F0E04' : '#EFE1C3' }]}>
          {(
            [
              { key: 'today', label: 'Day' },
              { key: 'this_week', label: 'Week' },
              { key: 'this_month', label: 'Month' },
              { key: 'all_time', label: 'All' },
            ] as const
          ).map((p) => {
            const isActive = selectedRange === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.periodChip,
                  isActive && { backgroundColor: theme.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedRange(p.key);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.periodChipText,
                    {
                      color: isActive
                        ? '#FFF3D6'
                        : isDark
                        ? '#A8998A'
                        : '#57534E',
                    },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2x2 Performance KPI Grid */}
      <View style={styles.kpiGrid}>
        {getKpiData().map((kpi, idx) => (
          <View
            key={kpi.title}
            style={[
              styles.kpiCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.borderSubtle,
              },
              Shadows.sm,
            ]}
          >
            <View style={styles.kpiCardTop}>
              <View style={[styles.kpiIconCircle, { backgroundColor: kpi.bg }]}>
                <Ionicons name={kpi.icon as any} size={20} color={kpi.iconColor} />
              </View>
              <View style={styles.kpiTrendBadge}>
                <Text style={styles.kpiTrendText}>{kpi.change}</Text>
              </View>
            </View>

            <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>
              {kpi.value}
            </Text>
            <Text style={[styles.kpiTitle, { color: theme.textMuted }]}>
              {kpi.title}
            </Text>
          </View>
        ))}
      </View>

      {/* ─── 3. QUICK ARTISAN WORKBENCH ACTIONS ───────────────── */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={[
            styles.quickActionBtn,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            Shadows.sm,
          ]}
          onPress={() => handleNavigate('/(vendor)/catalog')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconPill, { backgroundColor: 'rgba(196, 108, 39, 0.15)' }]}>
            <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
          </View>
          <Text style={[styles.actionBtnTitle, { color: theme.textPrimary }]}>New Craft</Text>
          <Text style={[styles.actionBtnSubtitle, { color: theme.textMuted }]}>Add to catalog</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickActionBtn,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            Shadows.sm,
          ]}
          onPress={() => handleNavigate('/(vendor)/requests')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Ionicons name="hammer-outline" size={22} color="#D97706" />
          </View>
          <Text style={[styles.actionBtnTitle, { color: theme.textPrimary }]}>Custom Bids</Text>
          <Text style={[styles.actionBtnSubtitle, { color: theme.textMuted }]}>Review patrons</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickActionBtn,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            Shadows.sm,
          ]}
          onPress={() => handleNavigate('/(vendor)/studio')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconPill, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <Ionicons name="color-palette-outline" size={22} color="#6366F1" />
          </View>
          <Text style={[styles.actionBtnTitle, { color: theme.textPrimary }]}>Studio</Text>
          <Text style={[styles.actionBtnSubtitle, { color: theme.textMuted }]}>Milestone pipeline</Text>
        </TouchableOpacity>
      </View>

      {/* ─── 4. ORDERS IN STUDIO (FULFILLMENT PIPELINE) ────────── */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWithBadge}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
            ORDERS IN STUDIO
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{recentOrders.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleNavigate('/(vendor)/orders')}
          activeOpacity={0.7}
        >
          <Text style={[styles.seeAllText, { color: theme.primary }]}>Show all →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ordersListWrap}>
        {recentOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={[
              styles.orderCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.borderSubtle,
              },
              Shadows.sm,
            ]}
            onPress={() => handleNavigate('/(vendor)/orders')}
            activeOpacity={0.85}
          >
            <View style={styles.orderCardHeader}>
              <View style={styles.orderIdBadge}>
                <Text style={styles.orderIdText}>{order.id}</Text>
              </View>

              <View style={[styles.orderStatusPill, { backgroundColor: order.statusBg }]}>
                <Text style={[styles.orderStatusText, { color: order.statusColor }]}>
                  {order.status}
                </Text>
              </View>
            </View>

            <Text style={[styles.orderItemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {order.item}
            </Text>

            <View style={styles.orderMetaRow}>
              <View style={styles.metaCustomerCol}>
                <Ionicons name="person-circle-outline" size={14} color={theme.textMuted} style={{ marginRight: 4 }} />
                <Text style={[styles.metaCustomerText, { color: theme.textSecondary }]}>
                  {order.customer}
                </Text>
              </View>

              <View style={styles.metaAmountCol}>
                <Text style={[styles.metaAmountVal, { color: theme.primary }]}>
                  {order.amount}
                </Text>
              </View>
            </View>

            <View style={[styles.orderCardFooter, { borderTopColor: theme.borderSubtle }]}>
              <View style={styles.eddRow}>
                <Ionicons name="time-outline" size={13} color={theme.textMuted} style={{ marginRight: 4 }} />
                <Text style={[styles.eddText, { color: theme.textMuted }]}>
                  Est. Delivery: <Text style={{ color: theme.textPrimary, fontFamily: FontFamily.poppinsSemiBold }}>{order.edd}</Text>
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── 5. ACTIVE BESPOKE REQUESTS (COMMISSIONS) ──────────── */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWithBadge}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
            BESPOKE PATRON INQUIRIES
          </Text>
          <View style={[styles.countBadge, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.countBadgeText}>{activeBespokeRequests.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleNavigate('/(vendor)/requests')}
          activeOpacity={0.7}
        >
          <Text style={[styles.seeAllText, { color: theme.primary }]}>View Bids →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.requestsListWrap}>
        {activeBespokeRequests.map((req) => (
          <TouchableOpacity
            key={req.id}
            style={[
              styles.requestCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.borderSubtle,
              },
              Shadows.sm,
            ]}
            onPress={() => handleNavigate('/(vendor)/requests')}
            activeOpacity={0.85}
          >
            <View style={styles.reqTopRow}>
              <View style={styles.reqPatronCol}>
                <Ionicons name="person-outline" size={13} color={theme.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.reqPatronName, { color: theme.textPrimary }]}>
                  {req.patron}
                </Text>
                <Text style={[styles.reqLocation, { color: theme.textMuted }]}>
                  • {req.city}
                </Text>
              </View>
              <Text style={[styles.reqBudgetVal, { color: '#10B981' }]}>
                {req.budget}
              </Text>
            </View>

            <Text style={[styles.reqTitleText, { color: theme.textPrimary }]} numberOfLines={2}>
              {req.requestTitle}
            </Text>

            <View style={styles.reqFooterRow}>
              <View style={styles.reqDeadlinePill}>
                <Ionicons name="calendar-outline" size={12} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={styles.reqDeadlineText}>{req.deadline}</Text>
              </View>

              <TouchableOpacity
                style={[styles.bidActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => handleNavigate('/(vendor)/requests')}
                activeOpacity={0.8}
              >
                <Text style={styles.bidActionBtnText}>Submit Bid</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── 6. ARTISAN MASTERY & RANKING CARD ─────────────────── */}
      <View style={[styles.achievementCard, Shadows.md]}>
        <LinearGradient
          colors={
            isDark
              ? ['#361300', '#251205', '#160802']
              : ['#FCF4E1', '#F7EBD2', '#F2E2C2']
          }
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.achievementBorderRim, { backgroundColor: theme.primary }]} />

        <View style={styles.achievementHeaderRow}>
          <View style={styles.medalCircle}>
            <Ionicons name="ribbon-outline" size={26} color="#FFD79E" />
          </View>
          <View style={styles.achievementTitleCol}>
            <Text style={[styles.achievementMainTitle, { color: isDark ? '#FFF3D6' : '#361300' }]}>
              Artisan Mastery Milestone
            </Text>
            <Text style={[styles.achievementSubtitle, { color: isDark ? '#D1995A' : '#78350F' }]}>
              You are officially a <Text style={{ fontFamily: FontFamily.poppinsBold }}>Steady Master Seller</Text>! 🌟
            </Text>
          </View>
        </View>

        <Text style={[styles.achievementDescText, { color: isDark ? '#FFF3D6' : '#57534E' }]}>
          ⭐ 96% of your reviews are 5 stars — patrons nationwide recognize your extraordinary heritage craftsmanship.
        </Text>

        <View style={[styles.rankStatsRow, { borderTopColor: isDark ? 'rgba(212, 163, 115, 0.2)' : 'rgba(212, 163, 115, 0.35)' }]}>
          <View style={styles.rankStatCol}>
            <Text style={[styles.rankStatLabel, { color: isDark ? '#A8998A' : '#8A7A6A' }]}>Atelier Rank</Text>
            <Text style={[styles.rankStatValue, { color: isDark ? '#FFD79E' : '#361300' }]}>#5 National</Text>
          </View>

          <View style={styles.rankDivider} />

          <View style={styles.rankStatCol}>
            <Text style={[styles.rankStatLabel, { color: isDark ? '#A8998A' : '#8A7A6A' }]}>Quality Score</Text>
            <Text style={[styles.rankStatValue, { color: '#10B981' }]}>98.5 / 100</Text>
          </View>

          <View style={styles.rankDivider} />

          <View style={styles.rankStatCol}>
            <Text style={[styles.rankStatLabel, { color: isDark ? '#A8998A' : '#8A7A6A' }]}>Repeat Patrons</Text>
            <Text style={[styles.rankStatValue, { color: theme.primary }]}>42%</Text>
          </View>
        </View>
      </View>

      {/* ─── 7. TIP OF THE DAY CARD ────────────────────────────── */}
      <View
        style={[
          styles.tipCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.borderSubtle,
          },
          Shadows.sm,
        ]}
      >
        <View style={styles.tipHeaderRow}>
          <Ionicons name="bulb-outline" size={20} color="#F59E0B" style={{ marginRight: 6 }} />
          <Text style={[styles.tipCardHeading, { color: theme.textPrimary }]}>
            Tip of the Day for Artisans
          </Text>
        </View>

        <View style={styles.tipBulletRow}>
          <Ionicons name="camera-outline" size={16} color={theme.primary} style={{ marginTop: 2, marginRight: 8 }} />
          <Text style={[styles.tipBulletText, { color: theme.textSecondary }]}>
            Products with 3+ high-resolution daylight craft photos sell <Text style={{ fontFamily: FontFamily.poppinsBold, color: theme.textPrimary }}>40% faster</Text>.
          </Text>
        </View>

        <View style={styles.tipBulletRow}>
          <Ionicons name="book-outline" size={16} color={theme.primary} style={{ marginTop: 2, marginRight: 8 }} />
          <Text style={[styles.tipBulletText, { color: theme.textSecondary }]}>
            Sharing cultural provenance and tribal weaving origin increases buyer trust by <Text style={{ fontFamily: FontFamily.poppinsBold, color: theme.textPrimary }}>25%</Text>.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 110, // Avoid bottom nav bar overlap
  },

  // ─── 1. HERO BANNER ─────────────────────────────────────────
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.35)',
  },
  heroGoldRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FFD79E',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#381A05',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD79E',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  heroTextCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  workshopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  masterBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 108, 39, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 158, 0.4)',
  },
  masterBadgeText: {
    fontSize: 8.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFD79E',
    letterSpacing: 0.5,
  },
  welcomeGreeting: {
    fontSize: 17,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF3D6',
  },
  workshopBusinessName: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsMedium,
    color: '#D1995A',
  },
  quoteBox: {
    backgroundColor: 'rgba(255, 243, 214, 0.08)',
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    marginTop: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#C46C27',
  },
  quoteText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsMedium,
    color: '#FFF3D6',
    lineHeight: 18,
  },
  storeLinkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 158, 0.25)',
  },
  storeLinkText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
    color: '#FFF3D6',
  },
  copyActionChip: {
    backgroundColor: '#C46C27',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    marginLeft: 6,
  },
  copyActionText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF3D6',
  },

  // ─── 2. RANGE SELECTOR & KPIS ───────────────────────────────
  rangeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
    letterSpacing: 0.8,
  },
  periodChipsWrap: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: 2,
  },
  periodChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  periodChipText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm) / 2,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  kpiCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  kpiIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTrendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  kpiTrendText: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsBold,
    color: '#10B981',
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: FontFamily.poppinsBold,
    marginBottom: 2,
  },
  kpiTitle: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
  },

  // ─── 3. QUICK WORKBENCH ACTIONS ─────────────────────────────
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickActionBtn: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionIconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionBtnTitle: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
    textAlign: 'center',
  },
  actionBtnSubtitle: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsRegular,
    textAlign: 'center',
    marginTop: 1,
  },

  // ─── 4. ORDERS IN STUDIO ────────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  sectionTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: '#C46C27',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
    marginLeft: 6,
  },
  countBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF3D6',
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
  },
  ordersListWrap: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  orderCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderIdBadge: {
    backgroundColor: 'rgba(196, 108, 39, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  orderIdText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
    color: '#C46C27',
  },
  orderStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  orderStatusText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
  },
  orderItemTitle: {
    fontSize: 14,
    fontFamily: FontFamily.poppinsBold,
    marginBottom: 6,
  },
  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metaCustomerCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaCustomerText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsMedium,
  },
  metaAmountCol: {},
  metaAmountVal: {
    fontSize: 15,
    fontFamily: FontFamily.poppinsBold,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs + 2,
    borderTopWidth: 1,
  },
  eddRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eddText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
  },

  // ─── 5. BESPOKE REQUESTS ────────────────────────────────────
  requestsListWrap: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  requestCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  reqTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reqPatronCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reqPatronName: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
  },
  reqLocation: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    marginLeft: 4,
  },
  reqBudgetVal: {
    fontSize: 14,
    fontFamily: FontFamily.poppinsBold,
  },
  reqTitleText: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsMedium,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  reqFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reqDeadlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  reqDeadlineText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
    color: '#D97706',
  },
  bidActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  bidActionBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF3D6',
  },

  // ─── 6. ACHIEVEMENT CARD ────────────────────────────────────
  achievementCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.35)',
  },
  achievementBorderRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  achievementHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  medalCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#381A05',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFD79E',
  },
  achievementTitleCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  achievementMainTitle: {
    fontSize: 16,
    fontFamily: FontFamily.poppinsBold,
  },
  achievementSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsMedium,
    marginTop: 2,
  },
  achievementDescText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsRegular,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  rankStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  rankStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  rankStatLabel: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsRegular,
    marginBottom: 2,
  },
  rankStatValue: {
    fontSize: 14,
    fontFamily: FontFamily.poppinsBold,
  },
  rankDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(212, 163, 115, 0.25)',
  },

  // ─── 7. TIP CARD ────────────────────────────────────────────
  tipCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tipCardHeading: {
    fontSize: 14,
    fontFamily: FontFamily.poppinsBold,
  },
  tipBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tipBulletText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.poppinsRegular,
    lineHeight: 18,
  },
});
