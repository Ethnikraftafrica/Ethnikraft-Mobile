import React from 'react';
import { useRouter } from 'expo-router';
import { useCart } from '@/hooks/useCart';
import { CartModal } from './CartModal';
import { CheckoutModal } from '../checkout/CheckoutModal';

export const GlobalCartCheckoutModals: React.FC = () => {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    isCartOpen,
    isCheckoutOpen,
    savedAddresses,
    closeCart,
    openCheckout,
    closeCheckout,
    updateItemQuantity,
    removeItem,
    onTrackOrderNavigation,
    onOrderCompleted,
  } = useCart();

  return (
    <>
      <CartModal
        visible={isCartOpen}
        onClose={closeCart}
        items={items}
        onUpdateQuantity={updateItemQuantity}
        onRemoveItem={removeItem}
        onCheckout={openCheckout}
        onExploreCatalog={() => {
          closeCart();
          router.push('/(user)/explore');
        }}
        onPressItem={(item) => {
          closeCart();
          router.push(`/product/${item.productId}`);
        }}
      />

      <CheckoutModal
        visible={isCheckoutOpen}
        onClose={closeCheckout}
        subtotal={subtotal}
        itemCount={itemCount}
        savedAddresses={savedAddresses}
        onTrackOrderNavigation={onTrackOrderNavigation}
        onOrderCompleted={onOrderCompleted}
      />
    </>
  );
};
