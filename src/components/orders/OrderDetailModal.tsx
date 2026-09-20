import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import {
  BackendOrder,
  useUpdateOrderStatusMutation,
} from '@/store/api/ordersApi';
import { ORDER_STATUS_CONFIG } from './types';
import { OrderTrackingTimeline } from './OrderTrackingTimeline';
import { WriteReviewModal, ReviewProductTarget } from '@/components/products';

interface OrderDetailModalProps {
  order: BackendOrder | null;
  visible: boolean;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  visible,
  onClose,
}) => {
  const [showTracking, setShowTracking] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTargetProduct, setReviewTargetProduct] = useState<ReviewProductTarget | null>(null);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const handleOpenReview = useCallback((target: ReviewProductTarget) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setReviewTargetProduct(target);
    setShowReviewModal(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (!order) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? Any payments held in escrow will be refunded immediately to your original payment method.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateStatus({
                id: order.id,
                status: 'CANCELLED',
                notes: 'Cancelled by customer',
              }).unwrap();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Order Cancelled', 'Your order has been cancelled.');
              onClose();
            } catch (err: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(
                'Cancellation Failed',
                err?.data?.message || err?.message || 'Could not cancel order at this time.'
              );
            }
          },
        },
      ]
    );
  }, [order?.id, updateStatus, onClose]);

  if (!order || !visible) return null;

  const statusCfg =
    ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.CONFIRMED;

  const isPending =
    order.status === 'PENDING' ||
    order.status === 'PAYMENT_PENDING' ||
    order.status === 'OPEN';

  const isDelivered =
    order.status === 'DELIVERED' ||
    order.status === 'COMPLETED';

  const isCustomCommission = Boolean(
    order.customRequest || order.customRequestId
  );

  const title =
    order.customRequest?.title ||
    order.orderItems?.[0]?.product?.name ||
    'Bespoke Commission';

  const vendorName =
    order.vendor?.businessName ||
    order.orderItems?.[0]?.product?.vendor?.businessName ||
    'Ethnikraft Master Artisan';

  const orderNumber = `EK-${order.id.slice(-8).toUpperCase()}`;

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalAmount = order.total || order.agreedPrice || 0;
  const shippingFee = 3500;
  const subtotal = Math.max(totalAmount - shippingFee, 0);
  const items = order.orderItems || [];

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
          <View>
            <Text style={styles.headerPretitle}>ORDER DETAILS</Text>
            <Text style={styles.headerTitle}>#{orderNumber}</Text>
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
          {/* Status Banner */}
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: statusCfg.bg, borderColor: statusCfg.border },
            ]}
          >
            <View style={styles.statusBannerLeft}>
              <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
              <View>
                <Text style={[styles.statusBannerLabel, { color: statusCfg.text }]}>
                  {statusCfg.label}
                </Text>
                <Text style={styles.statusBannerDate}>Placed on {formattedDate}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowTracking(true);
              }}
              style={styles.trackActionBtn}
            >
              <Ionicons name="navigate-outline" size={14} color={Colors.primary} />
              <Text style={styles.trackActionText}>Track</Text>
            </TouchableOpacity>
          </View>

          {/* Artisan & Workshop Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Master Artisan & Workshop</Text>
            <View style={styles.vendorRow}>
              <View style={styles.vendorAvatarBox}>
                <Ionicons name="storefront-outline" size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.vendorName}>{vendorName}</Text>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                </View>
                <Text style={styles.vendorLocation}>
                  {order.vendor?.cityOfOperation
                    ? `${order.vendor.cityOfOperation}, Nigeria`
                    : 'Verified Guild Artisan • Escrow Protected'}
                </Text>
              </View>
            </View>
          </View>

          {/* Items Section */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Items in this Order</Text>

            {items.length > 0 ? (
              items.map((item, idx) => (
                <View
                  key={item.id || idx}
                  style={[
                    styles.itemRow,
                    idx < items.length - 1 && styles.itemDivider,
                  ]}
                >
                  <Image
                    source={{
                      uri:
                        item.product?.mainImage ||
                        order.customRequest?.inspirationImages?.[0] ||
                        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80',
                    }}
                    style={styles.itemImage}
                    contentFit="cover"
                    transition={150}
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.product?.name || title}
                    </Text>
                    <Text style={styles.itemCategory}>
                      {item.product?.productCategory || order.customRequest?.categoryType || 'Bespoke Craft'}
                    </Text>
                    <View style={styles.itemPriceRow}>
                      <Text style={styles.itemPrice}>
                        ₦{(item.unitPrice || totalAmount).toLocaleString()}
                      </Text>
                      <Text style={styles.itemQty}>Qty: {item.quantity || 1}</Text>
                    </View>
                    {isDelivered && (
                      <TouchableOpacity
                        style={styles.reviewItemBtn}
                        onPress={() =>
                          handleOpenReview({
                            id: item.productId || item.product?.id || '',
                            name: item.product?.name || title,
                            image: item.product?.mainImage,
                            artisanName: item.product?.vendor?.businessName || vendorName,
                          })
                        }
                        activeOpacity={0.75}
                      >
                        <Ionicons name="star" size={13} color="#D97706" style={{ marginRight: 4 }} />
                        <Text style={styles.reviewItemBtnText}>Rate & Review Item</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.itemRow}>
                <Image
                  source={{
                    uri:
                    order.customRequest?.inspirationImages?.[0] ||
                    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80',
                  }}
                  style={styles.itemImage}
                  contentFit="cover"
                  transition={150}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {title}
                  </Text>
                  <Text style={styles.itemCategory}>
                    {isCustomCommission ? 'Bespoke Custom Studio Commission' : 'Heritage Artifact'}
                  </Text>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>₦{totalAmount.toLocaleString()}</Text>
                    <Text style={styles.itemQty}>Qty: 1</Text>
                  </View>
                  {isDelivered && (
                    <TouchableOpacity
                      style={styles.reviewItemBtn}
                      onPress={() =>
                        handleOpenReview({
                          id: order.customRequest?.id || order.id,
                          name: title,
                          image: order.customRequest?.inspirationImages?.[0],
                          artisanName: vendorName,
                        })
                      }
                      activeOpacity={0.75}
                    >
                      <Ionicons name="star" size={13} color="#D97706" style={{ marginRight: 4 }} />
                      <Text style={styles.reviewItemBtnText}>Rate & Review Commission</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Delivery Details */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Delivery Destination</Text>
            <View style={styles.deliveryRow}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.deliveryAddress}>
                  {order.deliveryAddress?.address ||
                    'Standard Registered Address (Lagos Hub / Home Delivery)'}
                </Text>
                {order.deliveryAddress?.city && (
                  <Text style={styles.deliverySub}>
                    {order.deliveryAddress.city}, {order.deliveryAddress.state || 'Nigeria'}
                  </Text>
                )}
                <Text style={styles.deliveryMethod}>
                  Carrier: {order.status === 'SHIPPED' ? 'DHL Express Africa' : 'Ethnikraft Logistics Network'}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment & Invoice Breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Payment & Invoice Breakdown</Text>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Items Subtotal</Text>
              <Text style={styles.breakdownVal}>₦{subtotal.toLocaleString()}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Insured Shipping & Packaging</Text>
              <Text style={styles.breakdownVal}>₦{shippingFee.toLocaleString()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.breakdownTotalRow}>
              <Text style={styles.breakdownTotalLabel}>Total Paid</Text>
              <Text style={styles.breakdownTotalVal}>₦{totalAmount.toLocaleString()}</Text>
            </View>

            {/* Escrow Guarantee Pill */}
            <View style={styles.escrowNotice}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
              <Text style={styles.escrowNoticeText}>
                Ethnikraft Escrow Protection: Artisan is paid upon milestone verification.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {isDelivered && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  const firstItem = items[0];
                  handleOpenReview({
                    id: firstItem?.productId || firstItem?.product?.id || order.customRequest?.id || order.id,
                    name: firstItem?.product?.name || title,
                    image: firstItem?.product?.mainImage || order.customRequest?.inspirationImages?.[0],
                    artisanName: vendorName,
                  });
                }}
                style={styles.rateOrderBtn}
              >
                <Ionicons name="star" size={18} color={Colors.textInverse} style={{ marginRight: 8 }} />
                <Text style={styles.rateOrderBtnText}>Rate & Review Purchase</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowTracking(true);
              }}
              style={styles.primaryActionBtn}
            >
              <Ionicons name="navigate-circle" size={18} color={Colors.textInverse} />
              <Text style={styles.primaryActionText}>Track Live Shipment</Text>
            </TouchableOpacity>

            {isPending && (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isUpdating}
                onPress={handleCancel}
                style={styles.cancelOrderBtn}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Text style={styles.cancelOrderText}>Cancel Order</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Live Shipment Tracking Submodal */}
        <OrderTrackingTimeline
          order={order}
          visible={showTracking}
          onClose={() => setShowTracking(false)}
        />

        {/* Write Review Submodal */}
        <WriteReviewModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          product={reviewTargetProduct}
        />
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
  headerPretitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textMuted,
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
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + 30,
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusBannerLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
  },
  statusBannerDate: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
  },
  trackActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trackActionText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  cardHeading: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm + 2,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  vendorAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vendorName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  vendorLocation: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  itemRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSubtle,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  itemCategory: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginVertical: 2,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
  },
  itemQty: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textSecondary,
  },
  deliveryRow: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
    alignItems: 'flex-start',
  },
  deliveryAddress: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  deliverySub: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deliveryMethod: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.primary,
    marginTop: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  breakdownLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
  },
  breakdownVal: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  breakdownTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownTotalLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  breakdownTotalVal: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
  },
  escrowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  escrowNoticeText: {
    flex: 1,
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textPrimary,
    lineHeight: 15,
  },
  actionsContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryActionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
  cancelOrderBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md - 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  cancelOrderText: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: '#DC2626',
  },
  rateOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  rateOrderBtnText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
  reviewItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 8,
  },
  reviewItemBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: '#92400E',
  },
});
