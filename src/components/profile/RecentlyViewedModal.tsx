import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearRecentlyViewed } from '@/store/slices/profileSlice';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function RecentlyViewedModal({ visible, onClose }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { recentlyViewed } = useAppSelector((state) => state.profile);

  const handleClearHistory = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch(clearRecentlyViewed());
  };

  const handleNavigateToProduct = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push({
      pathname: '/(user)/product/[id]',
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
              <Text style={styles.modalTitle}>Recently Viewed</Text>
              <Text style={styles.modalSub}>
                {recentlyViewed.length} item{recentlyViewed.length === 1 ? '' : 's'} in your local browsing history
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#341B00" />
            </TouchableOpacity>
          </View>

          {recentlyViewed.length > 0 && (
            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearHistory}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={13} color="#C92929" style={{ marginRight: 4 }} />
                <Text style={styles.clearBtnText}>Clear History</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {recentlyViewed.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={48} color="#A8998A" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No Browsing History</Text>
                <Text style={styles.emptySubtitle}>
                  Items and artisan craft stories you explore will automatically appear here for fast re-discovery.
                </Text>
              </View>
            ) : (
              recentlyViewed.map((item) => {
                const formattedPrice = typeof item.price === 'number'
                  ? item.price.toLocaleString()
                  : Number(item.price || 0).toLocaleString();

                const imageSource = item.image
                  ? (typeof item.image === 'string' && item.image.startsWith('http') ? { uri: item.image } : item.image)
                  : require('../../../assets/revamp/crafts-card.webp');

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
                          <Text style={styles.categoryText}>{item.category || 'CRAFT'}</Text>
                        </View>
                        <Text style={styles.timeText}>{item.viewedAt}</Text>
                      </View>

                      <Text style={styles.productName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {item.artisan ? (
                        <Text style={styles.artisanName}>By {item.artisan}</Text>
                      ) : null}
                      <Text style={styles.productPrice}>₦{formattedPrice}</Text>

                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.viewBtn}
                          onPress={() => handleNavigateToProduct(item.productId)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.viewBtnText}>View Item »</Text>
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
  topActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.sm,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C92929',
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
    width: 85,
    height: 85,
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
  timeText: {
    fontSize: 10,
    color: '#A8998A',
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#341B00',
    marginTop: 2,
  },
  artisanName: {
    fontSize: 11,
    color: '#662502',
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C46C27',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  viewBtn: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#C46C27',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  viewBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C46C27',
  },
});
