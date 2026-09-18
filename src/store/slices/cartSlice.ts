import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from '@/components/cart/types';

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  lastCompletedOrderNumber: string | null;
}

const INITIAL_MOCK_ITEMS: CartItem[] = [
  {
    id: 'cart-item-1',
    productId: 'cbe34120-83ef-4318-93bd-53b018598ef1',
    name: 'Ankara Relaxed Shirt',
    price: 32400,
    originalPrice: 38000,
    image: 'https://res.cloudinary.com/dyt4wqv3o/image/upload/v1731671239/ethnikraft/wk79ofiyzsnju9ggmhwa.jpg',
    quantity: 1,
    maxStock: 12,
    artisanName: 'Kente Heritage House',
    artisanLocation: 'Kumasi, Ghana',
    category: 'WEARS',
    selectedVariant: {
      id: 'var-1',
      name: 'Size L / Earth Tone',
      size: 'L',
      color: 'Earth Tone',
    },
  },
  {
    id: 'cart-item-2',
    productId: 'd63eaef9-a7eb-47f6-bc90-676f9d8bdde8',
    name: 'Unisex Aso oke Jorts (Loose-fit pants)',
    price: 54000,
    originalPrice: 60000,
    image: 'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1781276755/ethnikraft/products/dmfjyrvvk6iaiydrtmsx.jpg',
    quantity: 1,
    maxStock: 8,
    artisanName: 'Faustaze Studio',
    artisanLocation: 'Ibadan, Nigeria',
    category: 'WEARS',
    selectedVariant: {
      id: 'var-2',
      name: 'Custom Free Size / Indigo',
      size: 'Custom Free Size',
      color: 'Indigo',
    },
    customization: {
      category: 'WEARS',
      garmentType: 'Jorts',
      specialInstructions: 'Frayed hem with personalized copper bead accents.',
    },
  },
];

const initialState: CartState = {
  items: INITIAL_MOCK_ITEMS,
  isCartOpen: false,
  isCheckoutOpen: false,
  lastCompletedOrderNumber: null,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.productId === action.payload.productId &&
          item.selectedVariant?.id === action.payload.selectedVariant?.id
      );

      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += action.payload.quantity;
      } else {
        state.items.unshift(action.payload);
      }
    },
    updateCartItemQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((i) => i.id !== action.payload.id);
        } else {
          item.quantity = Math.min(action.payload.quantity, item.maxStock || 99);
        }
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isCartOpen = action.payload;
    },
    setCheckoutOpen: (state, action: PayloadAction<boolean>) => {
      state.isCheckoutOpen = action.payload;
    },
    setLastCompletedOrderNumber: (state, action: PayloadAction<string | null>) => {
      state.lastCompletedOrderNumber = action.payload;
    },
  },
});

export const {
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  setCartOpen,
  setCheckoutOpen,
  setLastCompletedOrderNumber,
} = cartSlice.actions;

export default cartSlice.reducer;
