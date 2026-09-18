import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  setCartOpen,
  setCheckoutOpen,
  setLastCompletedOrderNumber,
} from '@/store/slices/cartSlice';
import { CartItem, CartItemVariant, CartItemCustomization } from '@/components/cart/types';
import { Product } from '@/store/api/productApi';

export function useCart() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, isCartOpen, isCheckoutOpen, lastCompletedOrderNumber } =
    useAppSelector((state) => state.cart);
  const savedAddresses = useAppSelector((state) => state.profile.savedAddresses);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const openCart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setCartOpen(true));
  }, [dispatch]);

  const closeCart = useCallback(() => {
    dispatch(setCartOpen(false));
  }, [dispatch]);

  const openCheckout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(setCartOpen(false));
    dispatch(setCheckoutOpen(true));
  }, [dispatch]);

  const closeCheckout = useCallback(() => {
    dispatch(setCheckoutOpen(false));
  }, [dispatch]);

  const addProductToCart = useCallback(
    (
      product: Product,
      quantity = 1,
      variant?: CartItemVariant,
      customization?: CartItemCustomization
    ) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const parsedPrice =
        typeof product.price === 'string'
          ? parseFloat(product.price) || 0
          : product.price || 0;

      const parsedBasePrice = product.basePrice
        ? typeof product.basePrice === 'string'
          ? parseFloat(product.basePrice) || undefined
          : product.basePrice
        : undefined;

      const mainImage =
        product.mainImage ||
        (product.imageList && product.imageList[0]) ||
        'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1781276755/ethnikraft/products/dmfjyrvvk6iaiydrtmsx.jpg';

      const cartItem: CartItem = {
        id: `cart-${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: parsedPrice,
        originalPrice: parsedBasePrice,
        image: mainImage,
        quantity,
        maxStock: product.stockQuantity ?? 10,
        artisanName: product.vendor?.businessName || 'Heritage Guild Artisan',
        artisanLocation: 'West Africa',
        category: product.productCategory || 'ARTISANAL',
        isRequestable: product.isRequestable,
        selectedVariant: variant,
        customization,
      };

      dispatch(addToCart(cartItem));
    },
    [dispatch]
  );

  const updateItemQuantity = useCallback(
    (id: string, quantity: number) => {
      dispatch(updateCartItemQuantity({ id, quantity }));
    },
    [dispatch]
  );

  const removeItem = useCallback(
    (id: string) => {
      dispatch(removeFromCart(id));
    },
    [dispatch]
  );

  const clearAllCart = useCallback(() => {
    dispatch(clearCart());
  }, [dispatch]);

  const onTrackOrderNavigation = useCallback(() => {
    dispatch(setCheckoutOpen(false));
    dispatch(setCartOpen(false));
    router.push('/(user)/orders');
  }, [dispatch, router]);

  const onOrderCompleted = useCallback(
    (orderData: {
      orderNumber: string;
      addressId: string;
      quoteId: string;
      paymentOption: any;
    }) => {
      dispatch(setLastCompletedOrderNumber(orderData.orderNumber));
      // In presentation mode, clear cart after confirmed order
      dispatch(clearCart());
    },
    [dispatch]
  );

  return {
    items,
    itemCount,
    subtotal,
    isCartOpen,
    isCheckoutOpen,
    savedAddresses,
    lastCompletedOrderNumber,
    openCart,
    closeCart,
    openCheckout,
    closeCheckout,
    addProductToCart,
    updateItemQuantity,
    removeItem,
    clearAllCart,
    onTrackOrderNavigation,
    onOrderCompleted,
  };
}
