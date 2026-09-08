import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { DraggableFAB } from './DraggableFAB';
import { Colors, FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppSelector } from '@/store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLLAPSED_WIDTH = 54;
const EXPANDED_WIDTH = Math.min(SCREEN_WIDTH - 48, 280);

export interface CartFloatingButtonRef {
  collapse: () => void;
  expand: () => void;
  isExpanded: boolean;
}

export interface CartFloatingButtonProps {
  onRequireAuth?: () => void;
  onExpandChange?: (expanded: boolean) => void;
}

export const CartFloatingButton = forwardRef<
  CartFloatingButtonRef,
  CartFloatingButtonProps
>(({ onRequireAuth, onExpandChange }, ref) => {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [isExpanded, setIsExpanded] = useState(false);

  const itemCount: number = 0;
  const totalPrice = 'NGN 0.00';

  // Animation values
  const expandAnim = useRef(new Animated.Value(0)).current; // 0 = collapsed, 1 = expanded
  const autoCollapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCollapseTimer = () => {
    if (autoCollapseTimer.current) {
      clearTimeout(autoCollapseTimer.current);
      autoCollapseTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearCollapseTimer();
    };
  }, []);

  const expandBag = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsExpanded(true);
    onExpandChange?.(true);
    clearCollapseTimer();

    Animated.spring(expandAnim, {
      toValue: 1,
      friction: 7,
      tension: 50,
      useNativeDriver: false,
    }).start();

    // Auto collapse after 5.5 seconds of inactivity
    autoCollapseTimer.current = setTimeout(() => {
      collapseBag();
    }, 5500);
  };

  const collapseBag = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearCollapseTimer();

    Animated.spring(expandAnim, {
      toValue: 0,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start(() => {
      setIsExpanded(false);
      onExpandChange?.(false);
    });
  };

  useImperativeHandle(ref, () => ({
    collapse: collapseBag,
    expand: expandBag,
    isExpanded,
  }));

  const handlePress = () => {
    if (isExpanded) {
      collapseBag();
      return;
    }
    // Quick tap direct action
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

  const handleCheckoutPress = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearCollapseTimer();
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

  // Interpolated animated width
  const animatedWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED_WIDTH, EXPANDED_WIDTH],
  });

  // Interpolated content opacity
  const contentOpacity = expandAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <DraggableFAB
      initialX={16}
      initialY={SCREEN_HEIGHT - 170}
      onPress={handlePress}
      zIndex={120}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onLongPress={expandBag}
        delayLongPress={350}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            styles.fabContainer,
            Shadows.lg,
            { width: animatedWidth },
          ]}
        >
          {/* Main Bubble / Left Anchor (overflow visible so counter stacks without clipping) */}
          <View style={styles.cartBubble}>
            <Ionicons name="cart" size={19} color="#FFF5DE" />
            <View
              style={[
                styles.badgeMini,
                itemCount > 9 && styles.badgeMiniWide,
              ]}
            >
              <Text style={styles.badgeMiniText}>{itemCount}</Text>
            </View>
          </View>

          {/* Fluid Extended Info & Checkout Pill */}
          <Animated.View
            pointerEvents={isExpanded ? 'auto' : 'none'}
            style={[
              styles.expandedBody,
              {
                opacity: contentOpacity,
              },
            ]}
          >
            <View style={styles.expandedTextCol}>
              <Text style={styles.bagTitle}>YOUR BAG</Text>
              <Text style={styles.bagDetails}>
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'} • {totalPrice}
              </Text>
            </View>

            {/* Checkout Action Pill */}
            <TouchableOpacity
              onPress={handleCheckoutPress}
              activeOpacity={0.85}
              style={styles.checkoutPillBtn}
            >
              <Text style={styles.checkoutPillText}>Checkout</Text>
              <Ionicons name="arrow-forward" size={12} color="#180C04" />
            </TouchableOpacity>

            {/* Mini Close Button */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                collapseBag();
              }}
              style={styles.closeCollapseBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={14} color="#A8998A" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </DraggableFAB>
  );
});

CartFloatingButton.displayName = 'CartFloatingButton';

const styles = StyleSheet.create({
  fabContainer: {
    height: 54,
    backgroundColor: '#1C0D05',
    borderWidth: 1.5,
    borderColor: 'rgba(232, 186, 122, 0.45)',
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 3.5,
    overflow: 'visible', // Ensure counter badge stacks properly without any clipping
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  cartBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C46C27',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible', // Stacks counter outside boundary
  },
  badgeMini: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#1C0D05',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#E8BA7A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    elevation: 8,
  },
  badgeMiniWide: {
    width: undefined,
    minWidth: 20,
    paddingHorizontal: 4,
  },
  badgeMiniText: {
    fontSize: 9.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFFFFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  expandedBody: {
    position: 'absolute',
    left: 52,
    right: 6,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  expandedTextCol: {
    justifyContent: 'center',
  },
  bagTitle: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsBold,
    color: '#E8BA7A',
    letterSpacing: 0.8,
  },
  bagDetails: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#FFF5DE',
    marginTop: 1,
  },
  checkoutPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8BA7A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    gap: 4,
    marginLeft: 6,
  },
  checkoutPillText: {
    fontSize: 10.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#180C04',
  },
  closeCollapseBtn: {
    padding: 4,
    marginLeft: 2,
  },
});
