import { useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  setCartItems,
  clearCart,
  setCartOpen,
  setCheckoutOpen,
  setLastCompletedOrderNumber,
} from '@/store/slices/cartSlice';
import { CartItem, CartItemVariant, CartItemCustomization } from '@/components/cart/types';
import { Product } from '@/store/api/productApi';
import {
  useGetCartQuery,
  useAddItemToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  mapServerCartItemToUi,
} from '@/store/api/cartApi';

export function useCart() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { items, isCartOpen, isCheckoutOpen, lastCompletedOrderNumber } =
    useAppSelector((state) => state.cart);
  const savedAddresses = useAppSelector((state) => state.profile.savedAddresses);

  // Live Cloud Cart Query (Skipped if not authenticated)
  const {
    data: serverCart,
    isLoading: isCartLoading,
    isFetching: isCartFetching,
    refetch: refetchCart,
  } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [addItemApi] = useAddItemToCartMutation();
  const [updateItemApi] = useUpdateCartItemMutation();
  const [removeItemApi] = useRemoveCartItemMutation();

  // Sync server items when authenticated server cart changes
  useEffect(() => {
    if (isAuthenticated && serverCart && Array.isArray(serverCart.items)) {
      const mapped = serverCart.items.map(mapServerCartItemToUi);
      dispatch(setCartItems(mapped));
    }
  }, [isAuthenticated, serverCart, dispatch]);

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
    async (
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

      // 1. Optimistic Local Store Dispatch
      dispatch(addToCart(cartItem));

      // 2. Persistent Backend Synchronization if authenticated
      if (isAuthenticated) {
        try {
          await addItemApi({
            productId: product.id,
            quantity,
            variantId: variant?.id,
            customizationData: customization
              ? {
                  schemaVersion: customization.schemaVersion || '1.0',
                  category: customization.category || product.productCategory,
                  fields: customization.measurements || {
                    garmentType: customization.garmentType,
                    fabricColor: customization.fabricColor,
                  },
                  specialInstructions: customization.specialInstructions,
                  referenceImages: customization.referenceImages,
                }
              : undefined,
          }).unwrap();
        } catch (error) {
          console.warn('Backend cart item persistence error:', error);
        }
      }
    },
    [dispatch, isAuthenticated, addItemApi]
  );

  const updateItemQuantity = useCallback(
    async (id: string, quantity: number) => {
      // 1. Optimistic Local Store Dispatch
      dispatch(updateCartItemQuantity({ id, quantity }));

      // 2. Persistent Backend Synchronization if authenticated
      if (isAuthenticated && !id.startsWith('cart-')) {
        try {
          await updateItemApi({ id, quantity }).unwrap();
        } catch (error) {
          console.warn('Backend cart item quantity update error:', error);
        }
      }
    },
    [dispatch, isAuthenticated, updateItemApi]
  );

  const removeItem = useCallback(
    async (id: string) => {
      // 1. Optimistic Local Store Dispatch
      dispatch(removeFromCart(id));

      // 2. Persistent Backend Synchronization if authenticated
      if (isAuthenticated && !id.startsWith('cart-')) {
        try {
          await removeItemApi(id).unwrap();
        } catch (error) {
          console.warn('Backend cart item removal error:', error);
        }
      }
    },
    [dispatch, isAuthenticated, removeItemApi]
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
    isCartLoading,
    isCartFetching,
    refetchCart,
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
