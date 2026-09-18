import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { CartItem, CartSummaryData } from './types';
import { CartItemRow } from './CartItemRow';
import { CartSummary } from './CartSummary';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onExploreCatalog?: () => void;
  onPressItem?: (item: CartItem) => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  visible,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onExploreCatalog,
  onPressItem,
}) => {
  const summary: CartSummaryData = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    // Shipping is calculated at checkout or estimated
    const shippingEstimate = itemCount > 0 ? 3500 : 0;
    const estimatedTax = 0;
    const total = subtotal + shippingEstimate + estimatedTax;

    return {
      subtotal,
      itemCount,
      estimatedTax,
      shippingEstimate,
      total,
    };
  }, [items]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const handleExplore = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    if (onExploreCatalog) {
      onExploreCatalog();
    }
  }, [onClose, onExploreCatalog]);

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <CartItemRow
        item={item}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemoveItem}
        onPressItem={onPressItem}
      />
    ),
    [onUpdateQuantity, onRemoveItem, onPressItem]
  );

  const keyExtractor = useCallback((item: CartItem) => item.id, []);

  const ListEmpty = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="bag-handle-outline" size={38} color={Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Your Craft Bag is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Discover authentic African textiles, hand-carved artifacts, and artisan
          jewelry ready to ship directly from heritage guilds.
        </Text>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleExplore}
          style={styles.exploreBtn}
        >
          <Text style={styles.exploreBtnText}>Explore Marketplace</Text>
          <Ionicons name="arrow-forward" size={15} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>
    ),
    [handleExplore]
  );

  const ListFooter = useMemo(() => {
    if (items.length === 0) return null;
    return (
      <CartSummary
        summary={summary}
        onCheckout={onCheckout}
      />
    );
  }, [items.length, summary, onCheckout]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.headerPretitle}>MY BAG</Text>
            <View style={styles.mainTitleRow}>
              <Text style={styles.headerTitle}>Shopping Bag</Text>
              {summary.itemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleClose}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={ListEmpty}
          ListFooterComponent={ListFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  titleRow: {
    flex: 1,
  },
  headerPretitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  mainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  headerTitle: {
    fontSize: Typography.fontSize.base + 2,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.25)',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl + 10,
    paddingHorizontal: Spacing.lg,
  },
  emptyIconBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.25)',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.base + 2,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  exploreBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md - 3,
    borderRadius: Radius.full,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  exploreBtnText: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
});
