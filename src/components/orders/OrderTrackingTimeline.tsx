import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { BackendOrder, useGetOrderTrackingQuery } from '@/store/api/ordersApi';
import { ORDER_STATUS_CONFIG } from './types';

interface OrderTrackingTimelineProps {
  order: BackendOrder;
  visible: boolean;
  onClose: () => void;
}

interface TrackingMilestone {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  isCompleted: boolean;
  isCurrent: boolean;
}

export const OrderTrackingTimeline: React.FC<OrderTrackingTimelineProps> = ({
  order,
  visible,
  onClose,
}) => {
  const { data: trackingData, isLoading, refetch } = useGetOrderTrackingQuery(
    order.id,
    { skip: !visible || !order.id }
  );

  const [copied, setCopied] = React.useState(false);

  // Pulse animation for current active milestone
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (visible) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }

    return () => {
      if (animation) {
        animation.stop();
      }
      pulseAnim.setValue(1);
    };
  }, [visible, pulseAnim]);

  const trackingNumber =
    trackingData?.shipment?.trackingNumber ||
    trackingData?.order?.orderNumber ||
    `EK-${order.id.slice(-8).toUpperCase()}`;

  const shippingProvider =
    trackingData?.order?.shippingProvider ||
    (order.status === 'SHIPPED' ? 'DHL Express Africa' : 'Ethnikraft Logistics');

  const currentStatus = (
    trackingData?.tracking?.currentStatus ||
    trackingData?.shipment?.status ||
    order.status ||
    'CONFIRMED'
  ).toUpperCase();

  // Compute 5 milestone journey steps
  const milestones: TrackingMilestone[] = useMemo(() => {
    const statusOrder = [
      'CONFIRMED',
      'IN_PROGRESS',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];

    let activeIdx = 0;
    if (currentStatus === 'PENDING' || currentStatus === 'PAYMENT_PENDING') {
      activeIdx = 0;
    } else if (currentStatus === 'CONFIRMED') {
      activeIdx = 0;
    } else if (
      currentStatus === 'IN_PROGRESS' ||
      currentStatus === 'PRODUCTION_PENDING'
    ) {
      activeIdx = 1;
    } else if (currentStatus === 'SHIPPED') {
      activeIdx = 2;
    } else if (currentStatus === 'OUT_FOR_DELIVERY') {
      activeIdx = 3;
    } else if (currentStatus === 'DELIVERED' || currentStatus === 'COMPLETED') {
      activeIdx = 4;
    }

    const isCancelled = currentStatus === 'CANCELLED';

    return [
      {
        key: 'ORDER_PLACED',
        title: 'Commission Confirmed',
        subtitle: 'Payment verified & escrow secured',
        icon: 'shield-checkmark',
        isCompleted: !isCancelled && activeIdx >= 0,
        isCurrent: !isCancelled && activeIdx === 0,
      },
      {
        key: 'ARTISAN_CRAFTING',
        title: 'Master Artisan Crafting',
        subtitle: 'Handcrafting & bespoke tailoring inspection',
        icon: 'hammer',
        isCompleted: !isCancelled && activeIdx >= 1,
        isCurrent: !isCancelled && activeIdx === 1,
      },
      {
        key: 'DISPATCHED',
        title: 'Courier Dispatched',
        subtitle: `Picked up by ${shippingProvider}`,
        icon: 'cube',
        isCompleted: !isCancelled && activeIdx >= 2,
        isCurrent: !isCancelled && activeIdx === 2,
      },
      {
        key: 'IN_TRANSIT',
        title: 'In Regional Transit',
        subtitle: 'Moving through logistics distribution hubs',
        icon: 'airplane',
        isCompleted: !isCancelled && activeIdx >= 3,
        isCurrent: !isCancelled && activeIdx === 3,
      },
      {
        key: 'DELIVERED',
        title: 'Delivered to Doorstep',
        subtitle: 'Received & finalized with certificate of craft',
        icon: 'checkmark-done-circle',
        isCompleted: !isCancelled && activeIdx >= 4,
        isCurrent: !isCancelled && activeIdx === 4,
      },
    ];
  }, [currentStatus, shippingProvider]);

  const handleCopyTracking = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, []);

  const formattedEstimatedDate = useMemo(() => {
    const est =
      trackingData?.shipment?.estimatedDeliveryDate ||
      trackingData?.tracking?.estimatedDelivery ||
      order.proposedTimeline ||
      order.customRequest?.timeline;

    if (!est) return '3 - 5 Business Days';
    try {
      return new Date(est).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return String(est);
    }
  }, [
    trackingData?.shipment?.estimatedDeliveryDate,
    trackingData?.tracking?.estimatedDelivery,
    order.proposedTimeline,
    order.customRequest?.timeline,
  ]);

  const carrierEvents = trackingData?.tracking?.events || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleBox}>
            <View style={styles.headerBadge}>
              <Ionicons name="navigate-circle" size={14} color={Colors.primary} />
              <Text style={styles.headerBadgeText}>LIVE SHIPMENT TRACKING</Text>
            </View>
            <Text style={styles.headerTitle}>Order #{order.id.slice(-8).toUpperCase()}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onClose}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Tracking Summary Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroIconCircle}>
                <Ionicons name="cube-outline" size={28} color={Colors.primary} />
              </View>
              <View style={styles.heroDetails}>
                <Text style={styles.heroProviderLabel}>{shippingProvider}</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCopyTracking}
                  style={styles.trackingNumRow}
                >
                  <Text style={styles.trackingNumText}>{trackingNumber}</Text>
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={14}
                    color={copied ? Colors.success : Colors.primary}
                  />
                  {copied && <Text style={styles.copiedText}>Copied!</Text>}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroMetaRow}>
              <View>
                <Text style={styles.metaLabel}>Estimated Arrival</Text>
                <Text style={styles.metaValue}>{formattedEstimatedDate}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>Current Status</Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        ORDER_STATUS_CONFIG[order.status]?.bg || '#FEF3C7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          ORDER_STATUS_CONFIG[order.status]?.text || '#92400E',
                      },
                    ]}
                  >
                    {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stepper Milestones Journey */}
          <Text style={styles.sectionHeading}>Journey Milestones</Text>
          <View style={styles.milestonesCard}>
            {milestones.map((m, idx) => {
              const isLast = idx === milestones.length - 1;

              return (
                <View key={m.key} style={styles.milestoneRow}>
                  {/* Left Column: Icon & Vertical Line */}
                  <View style={styles.nodeColumn}>
                    {m.isCurrent ? (
                      <Animated.View
                        style={[
                          styles.nodeCircleCurrent,
                          { transform: [{ scale: pulseAnim }] },
                        ]}
                      >
                        <Ionicons name={m.icon} size={15} color="#FFFFFF" />
                      </Animated.View>
                    ) : m.isCompleted ? (
                      <View style={styles.nodeCircleCompleted}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={styles.nodeCirclePending}>
                        <Ionicons
                          name={m.icon}
                          size={14}
                          color={Colors.textMuted}
                        />
                      </View>
                    )}

                    {!isLast && (
                      <View
                        style={[
                          styles.connectorLine,
                          m.isCompleted && styles.connectorLineCompleted,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Column: Texts */}
                  <View
                    style={[
                      styles.milestoneContent,
                      !isLast && { paddingBottom: Spacing.lg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.milestoneTitle,
                        m.isCurrent && styles.milestoneTitleCurrent,
                        !m.isCompleted && !m.isCurrent && styles.milestoneTitlePending,
                      ]}
                    >
                      {m.title}
                    </Text>
                    <Text style={styles.milestoneSubtitle}>{m.subtitle}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Carrier Log Activity */}
          <Text style={styles.sectionHeading}>Carrier Activity Log</Text>
          <View style={styles.carrierLogCard}>
            {isLoading ? (
              <View style={{ paddingVertical: Spacing.md, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingLogText}>Fetching live carrier events...</Text>
              </View>
            ) : carrierEvents.length > 0 ? (
              carrierEvents.map((evt, i) => (
                <View
                  key={evt.id || i}
                  style={[
                    styles.eventItem,
                    i < carrierEvents.length - 1 && styles.eventItemBorder,
                  ]}
                >
                  <View style={styles.eventDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventDesc}>{evt.description || evt.status}</Text>
                    <View style={styles.eventMetaRow}>
                      {evt.location && (
                        <Text style={styles.eventLocation}>📍 {evt.location}</Text>
                      )}
                      <Text style={styles.eventTime}>
                        {new Date(evt.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyLog}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyLogText}>
                  Dispatch manifest generated. Carrier tracking updates will sync in real-time once in transit.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  headerBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + 20,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroDetails: {
    flex: 1,
  },
  heroProviderLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  trackingNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackingNumText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  copiedText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.success,
  },
  heroDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsBold,
  },
  sectionHeading: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  milestonesCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  milestoneRow: {
    flexDirection: 'row',
  },
  nodeColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: Spacing.md,
  },
  nodeCircleCurrent: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  nodeCircleCompleted: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeCirclePending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  connectorLineCompleted: {
    backgroundColor: Colors.success,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  milestoneTitleCurrent: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.poppinsBold,
  },
  milestoneTitlePending: {
    color: Colors.textMuted,
  },
  milestoneSubtitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  carrierLogCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  eventItemBorder: {
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 5,
  },
  eventDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textPrimary,
  },
  eventMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
  },
  eventLocation: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
  },
  eventTime: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  loadingLogText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 4,
  },
  emptyLog: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  emptyLogText: {
    flex: 1,
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
