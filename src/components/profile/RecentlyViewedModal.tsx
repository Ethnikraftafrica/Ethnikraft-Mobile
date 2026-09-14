import React, { useState } from 'react';
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
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SAMPLE_RECENT_ITEMS = [
  {
    id: 'rec_1',
    name: 'Benin Bronze King Head Replica',
    category: 'ANTIQUES',
    price: 145000,
    viewedAt: '2 hours ago',
    image: require('../../../assets/revamp/crafts-card.webp'),
  },
  {
    id: 'rec_2',
    name: 'Handcrafted Tuareg Silver Bracelet',
    category: 'ACCESSORIES',
    price: 28000,
    viewedAt: 'Yesterday',
    image: require('../../../assets/revamp/accessories-card.webp'),
  },
  {
    id: 'rec_3',
    name: 'Aso-Oke Handwoven Ceremonial Agbada',
    category: 'WEARS',
    price: 110000,
    viewedAt: '2 days ago',
    image: require('../../../assets/revamp/ready-to-wear.webp'),
  },
];

export default function RecentlyViewedModal({ visible, onClose }: Props) {
  const [items, setItems] = useState(SAMPLE_RECENT_ITEMS);

  const handleClearHistory = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setItems([]);
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
              <Text style={styles.modalSub}>Items you explored in the boutique</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#341B00" />
            </TouchableOpacity>
          </View>

          {items.length > 0 && (
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
            {items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={48} color="#A8998A" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No Browsing History</Text>
                <Text style={styles.emptySubtitle}>
                  Items and artisan craft stories you view will appear here for fast re-discovery.
                </Text>
              </View>
            ) : (
              items.map((item) => (
                <View key={item.id} style={[styles.productCard, Shadows.sm]}>
                  <Image source={item.image} style={styles.productImage} contentFit="cover" />
                  <View style={styles.productDetails}>
                    <View style={styles.tagRow}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                      </View>
                      <Text style={styles.timeText}>{item.viewedAt}</Text>
                    </View>

                    <Text style={styles.productName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.productPrice}>₦{item.price.toLocaleString()}</Text>

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onClose();
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.viewBtnText}>View Item »</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
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
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl + 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
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
    alignItems: 'flex-end',
    marginBottom: Spacing.xs,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C92929',
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#341B00',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#662502',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FAF7F2',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E4DACB',
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  productImage: {
    width: 80,
    height: 90,
    borderRadius: Radius.md,
    backgroundColor: '#E8DCCB',
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
    marginBottom: 2,
  },
  categoryBadge: {
    backgroundColor: '#EFE7DA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#662502',
  },
  timeText: {
    fontSize: 10,
    color: '#8A7A68',
  },
  productName: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '800',
    color: '#341B00',
  },
  productPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '900',
    color: '#C46C27',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  viewBtn: {
    backgroundColor: '#341B00',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  viewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
