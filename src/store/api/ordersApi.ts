import { baseApi } from './baseApi';
import { API_ENDPOINTS } from '@/constants/api';

export interface BackendOrderItem {
  id: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
  product?: {
    id: string;
    name: string;
    mainImage: string;
    price: number;
    productCategory?: string;
    vendor?: {
      id: string;
      businessName: string;
      rating?: number;
      businessLogo?: string;
    };
  };
}

export interface BackendOrder {
  id: string;
  userId: string;
  vendorId?: string;
  status:
    | 'PENDING'
    | 'PAYMENT_PENDING'
    | 'CONFIRMED'
    | 'IN_PROGRESS'
    | 'SHIPPED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED'
    | string;
  total: number;
  agreedPrice?: number;
  customRequestId?: string;
  customBidId?: string;
  proposedTimeline?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    businessName: string;
    businessLogo?: string;
    rating?: number;
    reviewCount?: number;
    cityOfOperation?: string;
    countryOfOperation?: string;
  };
  customRequest?: {
    id: string;
    title: string;
    description?: string;
    budget: number;
    timeline?: string;
    inspirationImages?: string[];
    categoryType?: string;
  };
  customBid?: {
    id: string;
    price: number;
    proposedTimeline: string;
    notes?: string;
    sampleImage?: string;
    status: string;
  };
  orderItems?: BackendOrderItem[];
  deliveryAddress?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phoneNumber?: string;
  };
}

export interface BackendTrackingEvent {
  id: string;
  status: string;
  location?: string;
  description?: string;
  timestamp: string;
  createdAt?: string;
}

export interface BackendOrderTracking {
  shipment?: {
    id: string;
    bookingId?: string;
    trackingNumber?: string;
    status: string;
    labelUrl?: string;
    estimatedDeliveryDate?: string;
    actualDeliveryDate?: string;
  };
  tracking?: {
    currentStatus: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    events: BackendTrackingEvent[];
  };
  order?: {
    id: string;
    orderNumber?: string;
    status: string;
    shippingProvider?: string;
  };
  liveTracking?: any;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get all orders for authenticated user
    getUserOrders: builder.query<BackendOrder[], void>({
      query: () => API_ENDPOINTS.orders.customerOrders,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Orders' as const, id })),
              { type: 'Orders', id: 'LIST' },
            ]
          : [{ type: 'Orders', id: 'LIST' }],
      transformResponse: (response: any): BackendOrder[] => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data?.orders)) return response.data.orders;
        if (Array.isArray(response?.orders)) return response.orders;
        if (Array.isArray(response?.data)) return response.data;
        return [];
      },
    }),

    // 2. Get single order details by ID
    getOrderById: builder.query<BackendOrder, string>({
      query: (id) => API_ENDPOINTS.orders.details(id),
      providesTags: (_result, _error, id) => [{ type: 'Orders', id }],
      transformResponse: (response: any): BackendOrder => {
        return (
          response?.data?.order ||
          response?.order ||
          response?.data ||
          response
        );
      },
    }),

    // 3. Get shipment tracking details for an order
    getOrderTracking: builder.query<BackendOrderTracking, string>({
      query: (id) => API_ENDPOINTS.orders.tracking(id),
      providesTags: (_result, _error, id) => [{ type: 'Orders', id }],
      transformResponse: (response: any): BackendOrderTracking => {
        return (
          response?.data?.trackingData ||
          response?.data ||
          response?.tracking ||
          response
        );
      },
    }),

    // 4. Update order status (Cancel / Confirm)
    updateOrderStatus: builder.mutation<
      BackendOrder,
      { id: string; status: string; notes?: string }
    >({
      query: ({ id, status, notes }) => ({
        url: API_ENDPOINTS.orders.updateStatus(id),
        method: 'PATCH',
        body: { status, notes },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Orders', id },
        { type: 'Orders', id: 'LIST' },
      ],
      transformResponse: (response: any): BackendOrder => {
        return (
          response?.data?.order ||
          response?.order ||
          response?.data ||
          response
        );
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetUserOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrderTrackingQuery,
  useUpdateOrderStatusMutation,
} = ordersApi;
