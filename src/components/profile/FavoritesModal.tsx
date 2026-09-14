import React, { useEffect } from 'react';
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
import * as Haptics from 'expo-haptics';
import { useAppDispatch } from '@/store';
import { syncFavoritesCount } from '@/store/slices/profileSlice';
import {
  useGetFavoritesQuery,
  useRemoveFromFavoritesMutation,
  FavoriteItem,
} from '@/store/api/profileApi';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const FALLBACK_FAVORITES = [
  {
    id: 'fav_1',
    productId: 'prod_1',
    product: {
      id: 'prod_1',
      name: 'Royal Ashanti Kente Cloth (Ahenfie)',
      productCategory: 'WEARS',
      price: 85000,
      artisan: 'Master Kwame Mensah',
      description: 'Handcrafted luxury Ghanaian silk',
      mainImage: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=800',
      vendor: {
        id: 'v_1',
        businessName: 'Ashanti Heritage Looms',
        rating: 4.9,
      },
    },
  },
  {
    id: 'fav_2',
    productId: 'prod_2',
    product: {
      id: 'prod_2',
      name: 'Hand-Tooled Fulani Leather Satchel',
      productCategory: 'BAGS',
      price: 42000,
      artisan: 'Ogunlesi Guild',
      description: 'Vegetable-tanned full-grain leather',
      mainImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800',
      vendor: {
        id: 'v_2',
        businessName: 'Oyo Leather Guild',
        rating: 4.8,
      },
    },
  },
];

export default function FavoritesModal({ visible, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { data: remoteFavorites, isLoading, refetch } = useGetFavoritesQuery(undefined, {
    skip: !visible,
  });
  const [removeFromFavoritesApi] = useRemoveFromFavoritesMutation();

  const favoritesList = (remoteFavorites && remoteFavorites.length > 0)
    ? remoteFavorites
    : (remoteFavorites !== undefined ? [] : FALLBACK_FAVORITES);

  // Sync favorites count to Redux store
  useEffect(() => {
    if (remoteFavorites) {
      dispatch(syncFavoritesCount(remoteFavorites.length));
    }
  }, [remoteFavorites, dispatch]);

  const handleRemove = async (productId: string, favoriteId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await removeFromFavoritesApi(productId).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn('Failed to remove favorite from server', e);
    }
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
                {favoritesList.length} artisan masterpiece{favoritesList.length === 1 ? '' : 's'} saved
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#341B00" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {isLoading && !remoteFavorites ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#C46C27" />
                <Text style={styles.loadingText}>Loading wishlist...</Text>
              </View>
            ) : favoritesList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="heart-dislike-outline" size={48} color="#C46C27" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
                <Text style={styles.emptySubtitle}>
                  Explore authentic African luxury crafts and tap the heart icon to curate your collection.
                </Text>
              </View>
            ) : (
              favoritesList.map((item) => {
                const prod = (item as any).product || item;
                const formattedPrice = typeof prod.price === 'number'
                  ? prod.price.toLocaleString()
                  : Number(prod.price || 0).toLocaleString();

                const imageSource = prod.mainImage
                  ? { uri: prod.mainImage }
                  : require('../../../assets/revamp/ready-to-wear.webp');

                const vendorName = prod.vendor?.businessName || prod.artisan || 'Ethnikraft Artisan';

                return (
                  <View key={item.id} style={[styles.productCard, Shadows.sm]}>
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
                          onPress={() => handleRemove(item.productId || prod.id, item.id)}
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
                      <Text style={styles.productPrice}>₦{formattedPrice}</Text>

                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.addBagBtn}
                          onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            onClose();
                          }}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="bag-handle-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.addBagText}>Add to Bag</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
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
