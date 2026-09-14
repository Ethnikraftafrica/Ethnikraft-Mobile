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

const SAMPLE_FAVORITES = [
  {
    id: 'fav_1',
    name: 'Royal Ashanti Kente Cloth (Ahenfie)',
    category: 'WEARS',
    price: 85000,
    artisan: 'Master Kwame Mensah',
    location: 'Kumasi, Ghana',
    image: require('../../../assets/revamp/ready-to-wear.webp'),
  },
  {
    id: 'fav_2',
    name: 'Hand-Tooled Fulani Leather Satchel',
    category: 'BAGS',
    price: 42000,
    artisan: 'Ogunlesi Guild',
    location: 'Oyo, Nigeria',
    image: require('../../../assets/revamp/accessories-card.webp'),
  },
  {
    id: 'fav_3',
    name: 'Terracotta Nok Heritage Urn',
    category: 'CRAFTS',
    price: 68000,
    artisan: 'Amina Kinteh',
    location: 'Lamu, Kenya',
    image: require('../../../assets/revamp/crafts-card.webp'),
  },
  {
    id: 'fav_4',
    name: 'Bespoke Indigo Adire Silk Tunic',
    category: 'WEARS',
    price: 36000,
    artisan: 'Abeokuta Heritage Dyers',
    location: 'Ogun, Nigeria',
    image: require('../../../assets/revamp/main-background.webp'),
  },
];

export default function FavoritesModal({ visible, onClose }: Props) {
  const [items, setItems] = useState(SAMPLE_FAVORITES);

  const handleRemove = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((item) => item.id !== id));
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
                {items.length} artisan masterpiece{items.length === 1 ? '' : 's'} saved
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#341B00" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="heart-dislike-outline" size={48} color="#C46C27" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
                <Text style={styles.emptySubtitle}>
                  Explore authentic African luxury crafts and tap the heart icon to curate your collection.
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
                      <TouchableOpacity
                        onPress={() => handleRemove(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="heart" size={18} color="#DC2626" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.productName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.artisanName}>
                      By {item.artisan} • {item.location}
                    </Text>
                    <Text style={styles.productPrice}>₦{item.price.toLocaleString()}</Text>

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
    width: 90,
    height: 100,
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
  productName: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '800',
    color: '#341B00',
  },
  artisanName: {
    fontSize: 10,
    color: '#8A7A68',
    marginTop: 1,
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
    marginTop: 6,
  },
  addBagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#341B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  addBagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
