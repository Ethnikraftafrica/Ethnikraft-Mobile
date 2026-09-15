import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppSelector } from '@/store';
import { useFavorites } from '@/hooks/useFavorites';
import { formatPrice } from '@/utils/price';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function FavoritesModal({ visible, onClose }: Props) {
  const router = useRouter();
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);
  const { favorites, isLoading, toggleFavorite } = useFavorites();

  const handleRemove = async (productId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await toggleFavorite(productId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn('Failed to remove favorite from server', e);
    }
  };

  const handleProductPress = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push({
      pathname: '/product/[id]',
      params: { id: productId },
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, Shadows.lg]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Saved Favorites</Text>
              <Text style={styles.modalSub}>
                {favorites.length} artisan masterpiece{favorites.length === 1 ? '' : 's'} saved
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#341B00" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {isLoading && favorites.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#C46C27" />
                <Text style={styles.loadingText}>Loading wishlist...</Text>
              </View>
            ) : favorites.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="heart-dislike-outline" size={48} color="#C46C27" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
                <Text style={styles.emptySubtitle}>
                  Explore authentic African luxury crafts and tap the heart icon to curate your collection.
                </Text>
              </View>
            ) : (
              favorites.map((item) => {
                const prod = (item as any).product || item;
                const productId = item.productId || prod.id;
                const formattedPrice = formatPrice(prod.price, currencyCode, exchangeRate);

                const imageSource = prod.mainImage
                  ? { uri: prod.mainImage }
                  : require('../../../assets/revamp/ready-to-wear.webp');

                const vendorName = prod.vendor?.businessName || prod.artisan || 'Ethnikraft Artisan';

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.productCard, Shadows.sm]}
                    activeOpacity={0.92}
                    onPress={() => handleProductPress(productId)}
                  >
                    <Image
                      source={imageSource}
                      style={styles.productImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={150}
                    />
                    <View style={styles.productDetails}>
                      <View style={styles.tagRow}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{prod.productCategory || 'CRAFT'}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleRemove(productId);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="heart" size={18} color="#DC2626" />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.productName} numberOfLines={2}>
                        {prod.name}
                      </Text>
                      <Text style={styles.artisanName}>
                        By {vendorName}
                      </Text>
                      <Text style={styles.productPrice}>{formattedPrice}</Text>

                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.addBagBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleProductPress(productId);
                          }}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="bag-handle-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.addBagText}>View Details</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 14, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl + 10,
    maxHeight: '92%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7D9',
    paddingBottom: Spacing.sm + 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#341B00',
  },
  modalSub: {
    fontSize: 11,
    color: '#662502',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#662502',
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 1.5,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#341B00',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#662502',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FAF7F2',
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E8DCCB',
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: Radius.md,
    backgroundColor: '#EAE0D2',
  },
  productDetails: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#EFE5D5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#662502',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#341B00',
    marginTop: 3,
  },
  artisanName: {
    fontSize: 11,
    color: '#662502',
    marginTop: 1,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C46C27',
    marginTop: 3,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  addBagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#341B00',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  addBagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
