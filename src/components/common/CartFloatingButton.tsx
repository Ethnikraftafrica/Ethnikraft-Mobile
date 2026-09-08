import React, { useState } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { DraggableFAB } from './DraggableFAB';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppSelector } from '@/store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CartFloatingButtonProps {
  onRequireAuth?: () => void;
}

export const CartFloatingButton: React.FC<CartFloatingButtonProps> = ({
  onRequireAuth,
}) => {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [expanded, setExpanded] = useState(false);

  const itemCount: number = 0;
  const totalPrice = 'NGN 0.00';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isAuthenticated) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        router.push('/(auth)/login');
      }
      return;
    }
    router.push('/(user)/orders');
  };

  return (
    <DraggableFAB
      initialX={16}
      initialY={SCREEN_HEIGHT - 175}
      onPress={handlePress}
      zIndex={120}
    >
      <View style={[styles.floatingPill, Shadows.lg]}>
        {/* Cart Icon Bubble with Badge */}
        <View style={styles.cartBubble}>
          <Ionicons name="cart" size={17} color="#FFF5DE" />
          <View style={styles.cartBadgeMini}>
            <Text style={styles.cartBadgeText}>{itemCount}</Text>
          </View>
        </View>

        {/* Bag Summary Info */}
        <View style={styles.infoCol}>
          <Text style={styles.floatingCartLabel}>YOUR BAG</Text>
          <Text style={styles.floatingCartSub}>
            {itemCount} {itemCount === 1 ? 'Item' : 'Items'} • {totalPrice}
          </Text>
        </View>
      </View>
    </DraggableFAB>
  );
};

const styles = StyleSheet.create({
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1006',
    borderWidth: 1.2,
    borderColor: 'rgba(232, 186, 122, 0.45)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  cartBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#C46C27',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadgeMini: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#271100',
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.2,
    borderColor: '#E8BA7A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },
  infoCol: {
    paddingRight: 6,
  },
  floatingCartLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#E8BA7A',
    letterSpacing: 0.8,
  },
  floatingCartSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF5DE',
    marginTop: 1,
  },
});
