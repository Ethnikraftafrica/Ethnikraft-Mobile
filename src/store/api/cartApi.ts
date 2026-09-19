import { baseApi } from './baseApi';
import { API_ENDPOINTS } from '@/constants/api';
import { Product } from './productApi';
import { CartItem, CartItemVariant, CartItemCustomization } from '@/components/cart/types';
import { ShippingQuoteOption } from '@/components/checkout/types';

export interface ServerCartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  priceAtAdd: number;
  lineTotal?: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any> | null;
  product?: Product;
}

export interface ServerCart {
  items: ServerCartItem[];
  subtotal: number;
  total: number;
}

export interface AddCartItemPayload {
  productId: string;
  quantity: number;
  variantId?: string;
  customizationData?: Record<string, any>;
}

export interface UpdateCartItemPayload {
  id: string;
  quantity: number;
}

export interface ServerShippingQuote {
  id: string;
  providerQuoteId?: string;
  provider: 'AAJ' | 'DHL' | 'FEDEX' | 'ETHNIKRAFT' | string;
  serviceName: string;
  shippingFee: number;
  tax: number;
  surcharges?: number;
  total: number;
  currency: string;
  estimatedDays: number;
  estimatedDate: string;
  expiresAt?: string;
}

export interface CheckoutPayload {
  deliveryAddressId?: string;
  selectedQuoteId?: string;
  providerQuoteId?: string;
  paymentMethod?: string;
  currency?: string;
  paymentOption?: 'card' | 'bank_transfer' | 'ussd';
  redirectUrl?: string;
  productType?: 'REGULAR' | 'REQUESTABLE';
}

export interface CheckoutResult {
  order: {
    id: string;
    userId?: string;
    vendorId?: string | null;
    status: string;
    subtotal?: number;
    shippingCost?: number | null;
    total: number;
    shippingProvider?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  payment?: {
    transactionId: string;
    amount: number;
    currency: string;
    paymentUrl: string;
    reference: string;
    status: string;
  };
}

/**
 * Normalizes backend server cart items into frontend UI CartItem shape
 */
export function mapServerCartItemToUi(item: ServerCartItem): CartItem {
  const prod = item.product;
  const unitPrice =
    typeof item.priceAtAdd === 'number'
      ? item.priceAtAdd
      : prod?.price
      ? typeof prod.price === 'string'
        ? parseFloat(prod.price) || 0
        : prod.price
      : 0;

  const basePrice = prod?.basePrice
    ? typeof prod.basePrice === 'string'
      ? parseFloat(prod.basePrice) || undefined
      : prod.basePrice
    : undefined;

  const mainImage =
    prod?.mainImage ||
    (prod?.imageList && prod.imageList[0]) ||
    'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1781276755/ethnikraft/products/dmfjyrvvk6iaiydrtmsx.jpg';

  let variant: CartItemVariant | undefined = undefined;
  if (item.variantId) {
    variant = {
      id: item.variantId,
      name: (item.metadata as any)?.variantName || 'Selected Variant',
      size: (item.metadata as any)?.size,
      color: (item.metadata as any)?.color,
    };
  }

  let customization: CartItemCustomization | undefined = undefined;
  if (item.metadata) {
    customization = {
      schemaVersion: item.metadata.schemaVersion,
      category: item.metadata.category,
      garmentType: item.metadata.fields?.garmentType,
      measurements: item.metadata.fields,
      specialInstructions: item.metadata.specialInstructions,
      referenceImages: item.metadata.referenceImages,
      fabricColor: item.metadata.fields?.fabricColor,
    };
  }

  return {
    id: item.id,
    productId: item.productId,
    name: prod?.name || 'Artisanal Piece',
    price: unitPrice,
    originalPrice: basePrice,
    image: mainImage,
    quantity: item.quantity,
    maxStock: prod?.stockQuantity ?? 10,
    artisanName: prod?.vendor?.businessName || 'Heritage Guild Artisan',
    artisanLocation: 'West Africa',
    category: prod?.productCategory || 'ARTISANAL',
    isRequestable: prod?.isRequestable,
    selectedVariant: variant,
    customization,
    createdAt: item.createdAt,
  };
}

/**
 * Normalizes backend shipping quote into ShippingQuoteOption
 */
export function mapServerQuoteToUi(q: ServerShippingQuote): ShippingQuoteOption {
  const provider = (['AAJ', 'DHL', 'FEDEX', 'ETHNIKRAFT'].includes(q.provider?.toUpperCase())
    ? q.provider.toUpperCase()
    : 'ETHNIKRAFT') as 'AAJ' | 'DHL' | 'FEDEX' | 'ETHNIKRAFT';

  // Format estimated date string
  let dateFormatted = q.estimatedDate;
  try {
    const d = new Date(q.estimatedDate);
    if (!isNaN(d.getTime())) {
      dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  } catch {
    // Keep as is
  }

  return {
    id: q.providerQuoteId || q.id,
    provider,
    serviceName: q.serviceName || `${provider} Delivery`,
    shippingFee: q.shippingFee,
    tax: q.tax || 0,
    total: q.total || q.shippingFee + (q.tax || 0),
    currency: q.currency || 'NGN',
    estimatedDays: q.estimatedDays || 3,
    estimatedDate: dateFormatted,
    isRecommended: provider === 'AAJ' || q.serviceName?.toLowerCase().includes('standard'),
  };
}

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get user's cloud cart
    getCart: builder.query<ServerCart, void>({
      query: () => API_ENDPOINTS.cart.get,
      providesTags: ['Cart'],
      transformResponse: (response: any): ServerCart => {
        const payload = response?.data || response;
        const rawItems = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
          ? payload
          : [];

        const subtotal =
          typeof payload?.subtotal === 'number'
            ? payload.subtotal
            : rawItems.reduce(
                (sum: number, it: any) => sum + (it.priceAtAdd || 0) * (it.quantity || 1),
                0
              );

        const total = typeof payload?.total === 'number' ? payload.total : subtotal;

        return {
          items: rawItems,
          subtotal,
          total,
        };
      },
    }),

    // 2. Add item to cart
    addItemToCart: builder.mutation<ServerCartItem, AddCartItemPayload>({
      query: (payload) => ({
        url: API_ENDPOINTS.cart.addItem,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Cart'],
      transformResponse: (response: any): ServerCartItem => {
        return response?.data?.cartItem || response?.data || response;
      },
    }),

    // 3. Update item quantity in cart
    updateCartItem: builder.mutation<ServerCartItem, UpdateCartItemPayload>({
      query: ({ id, quantity }) => ({
        url: API_ENDPOINTS.cart.updateItem(id),
        method: 'PUT',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
      transformResponse: (response: any): ServerCartItem => {
        return response?.data?.cartItem || response?.data || response;
      },
    }),

    // 4. Remove item from cart
    removeCartItem: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: API_ENDPOINTS.cart.removeItem(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
      transformResponse: (response: any) => {
        return { success: response?.success !== false };
      },
    }),

    // 5. Get dynamic real-time shipping carrier quotes for address
    getShippingQuotes: builder.mutation<ShippingQuoteOption[], { deliveryAddressId: string }>({
      query: (body) => ({
        url: API_ENDPOINTS.cart.shippingQuotes,
        method: 'POST',
        body,
      }),
      transformResponse: (response: any): ShippingQuoteOption[] => {
        const rawList: ServerShippingQuote[] = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.quotes)
          ? response.quotes
          : [];

        return rawList.map(mapServerQuoteToUi);
      },
    }),

    // 6. Checkout cart and create order / Flutterwave payment initiation
    checkoutCart: builder.mutation<CheckoutResult, CheckoutPayload>({
      query: (payload) => ({
        url: API_ENDPOINTS.cart.checkout,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Cart', 'Orders'],
      transformResponse: (response: any): CheckoutResult => {
        const data = response?.data || response;
        return {
          order: data.order || data,
          payment: data.payment,
        };
      },
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddItemToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useGetShippingQuotesMutation,
  useCheckoutCartMutation,
} = cartApi;
