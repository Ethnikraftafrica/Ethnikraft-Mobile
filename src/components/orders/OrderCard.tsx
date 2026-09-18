import React, { memo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { BackendOrder } from '@/store/api/ordersApi';
import { ORDER_STATUS_CONFIG } from './types';

interface OrderCardProps {
  order: BackendOrder;
  onPress: (order: BackendOrder) => void;
  onTrackPress: (order: BackendOrder) => void;
}

const OrderCardComponent: React.FC<OrderCardProps> = ({
  order,
  onPress,
  onTrackPress,
}) => {
  const statusCfg =
    ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.CONFIRMED;

  const isCustomCommission = Boolean(
    order.customRequest || order.customRequestId
  );

  const title =
    order.customRequest?.title ||
    order.orderItems?.[0]?.product?.name ||
    'Bespoke Artisan Commission';

  const vendorName =
    order.vendor?.businessName ||
    order.orderItems?.[0]?.product?.vendor?.businessName ||
    'Ethnikraft Master Guild';

  const imageUri =
    order.orderItems?.[0]?.product?.mainImage ||
    order.customRequest?.inspirationImages?.[0] ||
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80';

  const itemsCount =
    order.orderItems?.reduce((acc, item) => acc + item.quantity, 0) || 1;

  const orderNumber = `EK-${order.id.slice(-8).toUpperCase()}`;

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const totalAmount = order.total || order.agreedPrice || 0;

  const handleCardPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(order);
  }, [onPress, order]);

  const handleTrack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTrackPress(order);
  }, [onTrackPress, order]);

  const isRequestPhase =
    isCustomCommission &&
    (order.status === 'OPEN' || order.status === 'BIDDING');

  const handleAction = useCallback(() => {
    if (isRequestPhase) {
      handleCardPress();
    } else {
      handleTrack();
    }
  }, [isRequestPhase, handleCardPress, handleTrack]);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handleCardPress}
      style={styles.container}
    >
      <View style={styles.contentRow}>
        {/* Product / Commission Image */}
        <View style={styles.imageBox}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
          {isCustomCommission && (
            <View style={styles.commissionBadge}>
              <Ionicons name="sparkles" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Middle Details Column */}
        <View style={styles.detailsColumn}>
          {/* Top Row: Order ID & Status Badge */}
          <View style={styles.topMetaRow}>
            <Text style={styles.orderNumber}>#{orderNumber}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusCfg.bg, borderColor: statusCfg.border },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusCfg.dot }]}
              />
              <Text style={[styles.statusText, { color: statusCfg.text }]}>
                {statusCfg.label}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {/* Artisan Workshop Name */}
          <View style={styles.vendorRow}>
            <Ionicons name="storefront-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.vendorName} numberOfLines={1}>
              {vendorName}
            </Text>
          </View>

          {/* Bottom Row: Price & Actions */}
          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.dateText}>
                {formattedDate} • {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
              </Text>
              <Text style={styles.priceText}>₦{totalAmount.toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAction}
              style={styles.trackBtn}
            >
              <Ionicons
                name={isRequestPhase ? 'eye-outline' : 'navigate-outline'}
                size={13}
                color={Colors.primary}
              />
              <Text style={styles.trackBtnText}>
                {isRequestPhase ? 'Details' : 'Track'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const OrderCard = memo(OrderCardComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  contentRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  imageBox: {
    width: 84,
    height: 84,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSubtle,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  commissionBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: Colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsColumn: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
  },
  title: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: 2,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  vendorName: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingTop: 6,
    marginTop: 2,
  },
  dateText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginBottom: 1,
  },
  priceText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trackBtnText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.primary,
  },
});
