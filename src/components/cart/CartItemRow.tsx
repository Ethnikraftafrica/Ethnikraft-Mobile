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
import { Colors, Radius, Spacing, Typography, Shadows } from '@/constants/theme';
import { CartItem } from './types';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onRemove: (id: string) => void;
  onPressItem?: (item: CartItem) => void;
}

const CartItemRowComponent: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  onPressItem,
}) => {
  const handleDecrement = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    } else {
      onRemove(item.id);
    }
  }, [item.id, item.quantity, onUpdateQuantity, onRemove]);

  const handleIncrement = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.quantity < (item.maxStock || 99)) {
      onUpdateQuantity(item.id, item.quantity + 1);
    }
  }, [item.id, item.quantity, item.maxStock, onUpdateQuantity]);

  const handleRemovePress = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onRemove(item.id);
  }, [item.id, onRemove]);

  const handleRowPress = useCallback(() => {
    if (onPressItem) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPressItem(item);
    }
  }, [item, onPressItem]);

  const itemTotal = item.price * item.quantity;
  const hasDiscount = Boolean(
    item.originalPrice && item.originalPrice > item.price
  );

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        activeOpacity={onPressItem ? 0.85 : 1}
        onPress={handleRowPress}
        style={styles.mainRow}
      >
        {/* Product Thumbnail */}
        <View style={styles.thumbnailBox}>
          <Image
            source={{
              uri:
                item.image ||
                'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80',
            }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={150}
          />
          {item.isRequestable && (
            <View style={styles.bespokeBadge}>
              <Ionicons name="sparkles" size={9} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Item Details */}
        <View style={styles.detailsCol}>
          {/* Header Row: Title & Remove Button */}
          <View style={styles.titleRow}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {item.name}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRemovePress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.removeBtn}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Artisan Workshop Meta */}
          <View style={styles.artisanRow}>
            <Ionicons name="storefront-outline" size={12} color={Colors.primary} />
            <Text style={styles.artisanText} numberOfLines={1}>
              {item.artisanName || 'Ethnikraft Guild Artisan'}
            </Text>
          </View>

          {/* Variant / Customization Tags */}
          {(item.selectedVariant || item.customization) && (
            <View style={styles.variantPillsWrap}>
              {item.selectedVariant?.size && (
                <View style={styles.variantPill}>
                  <Text style={styles.variantPillText}>
                    Size: {item.selectedVariant.size}
                  </Text>
                </View>
              )}
              {item.selectedVariant?.color && (
                <View style={styles.variantPill}>
                  <Text style={styles.variantPillText}>
                    Color: {item.selectedVariant.color}
                  </Text>
                </View>
              )}
              {item.customization?.garmentType && (
                <View style={[styles.variantPill, styles.bespokePill]}>
                  <Ionicons name="cut-outline" size={10} color={Colors.primary} />
                  <Text style={[styles.variantPillText, { color: Colors.primary }]}>
                    {item.customization.garmentType}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Bottom Action Row: Price & Quantity Stepper */}
          <View style={styles.bottomRow}>
            <View style={styles.priceCol}>
              <Text style={styles.totalPriceText}>
                ₦{itemTotal.toLocaleString()}
              </Text>
              {item.quantity > 1 && (
                <Text style={styles.unitPriceText}>
                  ₦{item.price.toLocaleString()} each
                </Text>
              )}
              {hasDiscount && (
                <Text style={styles.originalPriceText}>
                  ₦{(item.originalPrice! * item.quantity).toLocaleString()}
                </Text>
              )}
            </View>

            {/* Stepper Controls */}
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDecrement}
                style={styles.stepperBtn}
              >
                <Ionicons
                  name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                  size={13}
                  color={item.quantity === 1 ? Colors.danger : Colors.textPrimary}
                />
              </TouchableOpacity>

              <View style={styles.stepperQtyBox}>
                <Text style={styles.stepperQtyText}>{item.quantity}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleIncrement}
                disabled={item.quantity >= (item.maxStock || 99)}
                style={[
                  styles.stepperBtn,
                  item.quantity >= (item.maxStock || 99) && styles.stepperBtnDisabled,
                ]}
              >
                <Ionicons
                  name="add"
                  size={13}
                  color={
                    item.quantity >= (item.maxStock || 99)
                      ? Colors.textMuted
                      : Colors.textPrimary
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const CartItemRow = memo(CartItemRowComponent);

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm + 2,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  mainRow: {
    flexDirection: 'row',
    padding: Spacing.sm + 4,
    gap: Spacing.sm + 4,
  },
  thumbnailBox: {
    width: 82,
    height: 94,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSubtle,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.15)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  bespokeBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  productTitle: {
    flex: 1,
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  removeBtn: {
    padding: 2,
  },
  artisanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  artisanText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
  },
  variantPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  variantPill: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.2)',
  },
  bespokePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  variantPillText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Spacing.xs + 2,
  },
  priceCol: {
    flex: 1,
  },
  totalPriceText: {
    fontSize: Typography.fontSize.sm + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
  },
  unitPriceText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  originalPriceText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.25)',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperQtyBox: {
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
});
