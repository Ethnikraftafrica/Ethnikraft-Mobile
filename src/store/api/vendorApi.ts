import { baseApi } from './baseApi';
import { API_ENDPOINTS } from '@/constants/api';

export type VendorOverviewPeriod =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'all_time';

export interface VendorOverviewQueryParams {
  period?: VendorOverviewPeriod;
  startDate?: string;
  endDate?: string;
}

export interface VendorOverviewData {
  vendor: {
    id: string;
    businessName: string;
    businessLogo?: string;
    status: string;
    createdAt: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    categories?: Array<{ id: string; name: string }>;
    rating?: number;
    reviewCount?: number;
  };
  metrics: {
    vendorId: string;
    totalBids: number;
    acceptedBids: number;
    successRate: number;
    totalRevenue: number;
    averageBidValue: number;
    averageResponseTime: number;
    completionRate: number;
    rating: number;
    reviewCount: number;
    categoryPerformance?: Array<{
      category: string;
      bids: number;
      success: number;
      revenue: number;
    }>;
    trendData?: Array<{
      period: string;
      bids: number;
      revenue: number;
    }>;
    topSellingProducts?: Array<{
      productId: string;
      productName: string;
      timesSold: number;
      totalQuantity: number;
      revenue: number;
    }>;
  };
  orders: {
    pending: number;
    processing: number;
    delivered: number;
  };
  ranking?: {
    position: number;
    score: number;
  };
  unreadMessages?: number;
}

export interface VendorOrderCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  deliveryAddress?: string;
  city?: string;
  country?: string;
}

export interface VendorOrderCustomRequest {
  id: string;
  title: string;
  description?: string;
  budget?: number;
  timeline?: string;
}

export interface VendorOrderCustomBid {
  id: string;
  price: number;
  proposedTimeline?: string;
  notes?: string;
  status?: string;
}

export interface VendorOrderItemProduct {
  id: string;
  name: string;
  mainImage?: string;
  price?: number;
  productCategory?: string;
  vendor?: {
    id: string;
    businessName: string;
    rating?: number;
    businessLogo?: string;
  };
}

export interface VendorOrderItem {
  id: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
  product?: VendorOrderItemProduct;
  variantSnapshot?: {
    size?: string;
    color?: string;
    material?: string;
  };
}

export interface VendorOrder {
  id: string;
  orderNumber?: string;
  total: number;
  agreedPrice?: number;
  itemsSubtotal?: number;
  shippingCost?: number;
  shippingProvider?: string;
  shippingCostPaid?: boolean;
  shippingTrackingNumber?: string;
  shippingBookingId?: string;
  estimatedDeliveryDate?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  proposedTimeline?: string;
  user?: VendorOrderCustomer;
  customRequest?: VendorOrderCustomRequest;
  customBid?: VendorOrderCustomBid;
  orderItems?: VendorOrderItem[];
  notes?: string;
}

export interface UpdateOrderStatusPayload {
  orderId: string;
  status: string;
}

export interface VendorProductItem {
  id: string;
  name: string;
  productCategory: string;
  price: number;
  basePrice?: number;
  stockQuantity: number;
  condition: string;
  mainImage: string;
  imageList: string[];
  description: string;
  details?: Record<string, any>;
  isCustomizable: boolean;
  isRequestable: boolean;
  estimatedProductionDays?: number;
  sku?: string;
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  material?: string;
  origin?: string;
  era?: string;
  weight?: number;
  weightUnit?: string;
  packageSize?: string;
  createdAt: string;
  updatedAt?: string;
  vendor?: {
    id: string;
    businessName: string;
    rating?: number;
    businessLogo?: string;
  };
}

export interface GetVendorProductsParams {
  skip?: number;
  take?: number;
  search?: string;
  productCategory?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface GetVendorProductsResponse {
  products: VendorProductItem[];
  total: number;
  skip: number;
  take: number;
}

export interface CreateProductPayload {
  name: string;
  productCategory: string;
  price: number;
  basePrice?: number;
  stockQuantity?: number;
  condition: string;
  mainImage: string;
  imageList?: string[];
  description: string;
  details?: Record<string, any>;
  isCustomizable?: boolean;
  isRequestable?: boolean;
  estimatedProductionDays?: number;
  weight?: number;
  weightUnit?: string;
  packageSize?: string;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {}

export interface CustomBidItem {
  id: string;
  customRequestId: string;
  vendorId?: string;
  price: number;
  proposedTimeline: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  notes?: string;
  sampleImage?: string;
  submittedAt: string;
  createdAt?: string;
  updatedAt?: string;
  customRequest?: {
    id: string;
    title: string;
    description: string;
    budget: number;
    timeline: string;
    status: string;
    categoryType?: string;
    inspirationImages?: string[];
    colors?: string[];
    materialType?: string;
    materialQuality?: string;
    quantity?: number;
    measurements?: any;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      location?: string;
      city?: string;
      state?: string;
      country?: string;
    };
  };
}

export interface CustomRequestItem {
  id: string;
  userId: string;
  chatId?: string | null;
  title: string;
  description: string;
  budget: number;
  timeline: string;
  materialType?: string;
  materialQuality?: string;
  colors?: string[];
  quantity?: number;
  measurements?: any;
  inspirationImages?: string[];
  categoryType: string;
  status: string;
  selectedBidId?: string | null;
  createdAt: string;
  updatedAt?: string;
  location?: string;
  deliveryAddress?: any;
  shippingAddress?: any;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    location?: string;
    city?: string;
    state?: string;
    country?: string;
    savedAddresses?: any[];
  };
  bids?: CustomBidItem[];
  _count?: {
    bids?: number;
  };
}

export interface CreateCustomBidPayload {
  customRequestId: string;
  price: number;
  proposedTimeline: string;
  notes?: string;
  sampleImage?: string;
}

export interface UpdateCustomBidPayload {
  price?: number;
  proposedTimeline?: string;
  notes?: string;
  sampleImage?: string;
}

export interface VendorProductRequestItem {
  id: string;
  productId: string;
  orderId?: string;
  userId: string;
  vendorId: string;
  status: 'PENDING' | 'PAYMENT_PENDING' | 'PAID' | 'PRODUCTION_PENDING' | 'IN_PRODUCTION' | 'COMPLETED' | 'SHIPPED' | 'CANCELLED';
  customizationData?: {
    schemaVersion?: string;
    category?: string;
    fields?: Record<string, any>;
    specialInstructions?: string;
    referenceImages?: string[];
  };
  vendorNotes?: string;
  progressUpdates?: Array<{
    date: string;
    message: string;
    imageUrl?: string | null;
  }>;
  estimatedReadyDate?: string | null;
  productionStartedAt?: string | null;
  actualReadyDate?: string | null;
  shippedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  product?: {
    id?: string;
    name: string;
    mainImage?: string;
    price?: number;
    category?: string;
    estimatedProductionDays?: number;
  };
  user?: {
    id?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  order?: {
    id: string;
    total: number;
    status?: string;
  };
  shippingBooking?: any;
  daysRemaining?: number | null;
}

export interface StartProductionPayload {
  estimatedReadyDate: string;
  notes?: string;
}

export interface UpdateProductionProgressPayload {
  message: string;
  imageUrl?: string;
}

export interface VendorCatalogItem {
  id: string;
  vendorId?: string;
  name: string;
  image: string;
  description?: string;
  categoryType: string;
  price?: number;
  productIds?: string[];
  createdAt: string;
  updatedAt?: string;
  tags?: Array<{ id: string; name: string }>;
}

export interface CreateVendorCatalogPayload {
  name: string;
  image: string;
  description?: string;
  categoryType: string;
  price?: number;
  productIds?: string[];
  tags?: string[];
}

export interface UpdateVendorCatalogPayload extends Partial<CreateVendorCatalogPayload> {}

export interface ChatMessageItem {
  id: string;
  chatId: string;
  senderId: string;
  content: string | null;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  attachments?: any;
  sentAt: string;
  deliveredAt?: string;
  readBy?: string[];
  sender?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  };
}

export interface ChatParticipantItem {
  id: string;
  chatId: string;
  userId: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  joinedAt: string;
  lastReadAt?: string;
  isMuted: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    profileImage?: string;
    role: string;
  };
}

export interface ChatRoomData {
  id: string;
  customRequestId: string;
  title: string;
  status: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipantItem[];
  messages: ChatMessageItem[];
  customRequest?: {
    id: string;
    title: string;
    description?: string;
    budget?: number;
    timeline?: string;
    status?: string;
    categoryType?: string;
    inspirationImages?: string[];
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      profileImage?: string;
      email?: string;
      phone?: string;
      location?: string;
      city?: string;
      country?: string;
    };
  };
}

export interface VendorMessageListItem {
  chatId: string;
  customRequestId: string;
  requestTitle?: string;
  lastMessage?: {
    id: string;
    content: string;
    createdAt?: string;
    sentAt?: string;
    sender?: {
      firstName: string;
      lastName: string;
    };
  } | null;
  participants: ChatParticipantItem[];
  updatedAt: string;
  isRead: boolean;
}

export interface VendorMessagesResponse {
  messages: VendorMessageListItem[];
  total: number;
  unread: number;
  page: number;
  limit: number;
}

export interface SendMessagePayload {
  customRequestId: string;
  content?: string;
  attachments?: any[];
}

export interface VendorBusinessAddressItem {
  id: string;
  vendorId?: string;
  address: string;
  addressType?: string;
  buildingName?: string;
  aptNoOrCompany?: string;
  floor?: string;
  street?: string;
  city: string;
  state: string;
  country: string;
  countryCode?: string;
  postalCode?: string;
  additionalDirections?: string;
  phoneNumber?: string;
  additionalLabel?: string;
  isDefault: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorProfileData {
  id: string;
  businessName: string;
  businessEmail?: string;
  businessPhone?: string;
  description?: string;
  businessLogo?: string;
  businessBanner?: string;
  notificationsEnabled?: boolean;
  city?: string;
  country?: string;
  businessAddresses?: VendorBusinessAddressItem[];
  catalogs?: VendorCatalogItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateVendorSettingsPayload {
  notificationsEnabled?: boolean;
  city?: string;
  country?: string;
}

export interface UpdateVendorBrandingPayload {
  businessLogo?: string;
  businessBanner?: string;
  description?: string;
}

export interface CreateVendorAddressPayload {
  address: string;
  addressType?: 'OFFICE' | 'HOME' | 'APARTMENT' | 'WAREHOUSE' | string;
  buildingName?: string;
  aptNoOrCompany?: string;
  floor?: string;
  street?: string;
  city: string;
  state: string;
  country: string;
  countryCode?: string;
  postalCode?: string;
  additionalDirections?: string;
  phoneNumber?: string;
  additionalLabel?: string;
  isDefault?: boolean;
  status?: string;
}

export interface UpdateVendorAddressPayload extends Partial<CreateVendorAddressPayload> {
  id: string;
}

export const vendorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get vendor dashboard overview with time-period filtering
    getVendorOverview: builder.query<VendorOverviewData, VendorOverviewPeriod | VendorOverviewQueryParams | void>({
      query: (arg) => {
        let params: Record<string, string> = {};
        if (typeof arg === 'string') {
          params.period = arg;
        } else if (arg && typeof arg === 'object') {
          if (arg.period) params.period = arg.period;
          if (arg.startDate) params.startDate = arg.startDate;
          if (arg.endDate) params.endDate = arg.endDate;
        }

        return {
          url: API_ENDPOINTS.vendor.overview,
          method: 'GET',
          params,
        };
      },
      providesTags: ['VendorOverview'],
      transformResponse: (response: any): VendorOverviewData => {
        const data = response?.data || response;
        return {
          vendor: data?.vendor || {
            id: '',
            businessName: '',
            status: '',
            createdAt: new Date().toISOString(),
            user: { firstName: '', lastName: '', email: '', phone: '' },
            categories: [],
            rating: typeof data?.vendor?.rating === 'number' ? data.vendor.rating : undefined,
            reviewCount: typeof data?.vendor?.reviewCount === 'number' ? data.vendor.reviewCount : undefined,
          },
          metrics: {
            vendorId: data?.metrics?.vendorId || '',
            totalBids: data?.metrics?.totalBids ?? 0,
            acceptedBids: data?.metrics?.acceptedBids ?? 0,
            successRate: data?.metrics?.successRate ?? 0,
            totalRevenue: data?.metrics?.totalRevenue ?? 0,
            averageBidValue: data?.metrics?.averageBidValue ?? 0,
            averageResponseTime: data?.metrics?.averageResponseTime ?? 0,
            completionRate: data?.metrics?.completionRate ?? 0,
            rating: data?.metrics?.rating ?? 0,
            reviewCount: data?.metrics?.reviewCount ?? 0,
            categoryPerformance: data?.metrics?.categoryPerformance || [],
            trendData: data?.metrics?.trendData || [],
            topSellingProducts: data?.metrics?.topSellingProducts || [],
          },
          orders: {
            pending: data?.orders?.pending ?? 0,
            processing: data?.orders?.processing ?? 0,
            delivered: data?.orders?.delivered ?? 0,
          },
          ranking: data?.ranking || { position: 0, score: 0 },
          unreadMessages: data?.unreadMessages ?? 0,
        };
      },
    }),

    // 2. Get vendor orders (with robust normalizer for user, items, and logistics)
    getVendorOrders: builder.query<VendorOrder[], { limit?: number } | void>({
      query: (params) => ({
        url: API_ENDPOINTS.vendor.orders,
        method: 'GET',
        params: params ? { limit: params.limit } : undefined,
      }),
      providesTags: ['VendorOrders'],
      transformResponse: (response: any): VendorOrder[] => {
        const rawList = response?.data?.orders || response?.data || response || [];
        if (!Array.isArray(rawList)) return [];

        return rawList.map((ord: any) => ({
          id: ord.id || '',
          orderNumber: ord.orderNumber || `#VORD-${(ord.id || '').slice(-4).toUpperCase()}`,
          total: Number(ord.total ?? ord.agreedPrice ?? 0),
          agreedPrice: ord.agreedPrice ? Number(ord.agreedPrice) : undefined,
          itemsSubtotal: ord.itemsSubtotal ? Number(ord.itemsSubtotal) : undefined,
          shippingCost: ord.shippingCost ? Number(ord.shippingCost) : 0,
          shippingProvider: ord.shippingProvider || 'Courier Express',
          shippingCostPaid: Boolean(ord.shippingCostPaid ?? true),
          shippingTrackingNumber: ord.shippingTrackingNumber || undefined,
          shippingBookingId: ord.shippingBookingId || undefined,
          estimatedDeliveryDate: ord.estimatedDeliveryDate || undefined,
          status: ord.status || 'PENDING',
          createdAt: ord.createdAt || new Date().toISOString(),
          updatedAt: ord.updatedAt || ord.createdAt || new Date().toISOString(),
          proposedTimeline: ord.proposedTimeline || undefined,
          user: ord.user
            ? {
                id: ord.user.id || '',
                firstName: ord.user.firstName || '',
                lastName: ord.user.lastName || '',
                email: ord.user.email || '',
                phone: ord.user.phone || '',
                profileImage: ord.user.profileImage || undefined,
                deliveryAddress: ord.user.deliveryAddress || ord.deliveryAddress || undefined,
                city: ord.user.city || ord.city || undefined,
                country: ord.user.country || ord.country || undefined,
              }
            : undefined,
          customRequest: ord.customRequest
            ? {
                id: ord.customRequest.id || '',
                title: ord.customRequest.title || 'Custom Atelier Commission',
                description: ord.customRequest.description || '',
                budget: ord.customRequest.budget ? Number(ord.customRequest.budget) : undefined,
                timeline: ord.customRequest.timeline || undefined,
              }
            : undefined,
          customBid: ord.customBid
            ? {
                id: ord.customBid.id || '',
                price: Number(ord.customBid.price || 0),
                proposedTimeline: ord.customBid.proposedTimeline || undefined,
                notes: ord.customBid.notes || '',
                status: ord.customBid.status || '',
              }
            : undefined,
          orderItems: Array.isArray(ord.orderItems)
            ? ord.orderItems.map((item: any) => ({
                id: item.id || '',
                productId: item.productId || item.product?.id || '',
                quantity: Number(item.quantity || 1),
                unitPrice: Number(item.unitPrice || item.price || 0),
                product: item.product
                  ? {
                      id: item.product.id || '',
                      name: item.product.name || 'Artisanal Piece',
                      mainImage: item.product.mainImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
                      price: Number(item.product.price || 0),
                      productCategory: item.product.productCategory || 'CRAFTS',
                      vendor: item.product.vendor,
                    }
                  : undefined,
                variantSnapshot: item.variantSnapshot || (item.variant ? {
                  size: item.variant.size,
                  color: item.variant.color,
                  material: item.variant.material,
                } : undefined),
              }))
            : [],
          notes: ord.notes || undefined,
        }));
      },
    }),

    // 2b. Update order status
    updateOrderStatus: builder.mutation<VendorOrder, UpdateOrderStatusPayload>({
      query: ({ orderId, status }) => ({
        url: API_ENDPOINTS.vendor.updateOrderStatus(orderId),
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['VendorOrders', 'VendorOverview'],
      transformResponse: (response: any): VendorOrder => {
        return response?.data || response;
      },
    }),

    // 3. Get vendor own products (with full filtering, pagination, and search)
    getVendorProducts: builder.query<GetVendorProductsResponse, GetVendorProductsParams | void>({
      query: (params) => {
        const queryParams: Record<string, any> = {
          take: params?.take !== undefined ? params.take : 100,
        };
        if (params) {
          if (params.skip !== undefined) queryParams.skip = params.skip;
          if (params.search?.trim()) queryParams.search = params.search.trim();
          if (params.productCategory && params.productCategory !== 'ALL') {
            queryParams.productCategory = params.productCategory;
          }
          if (params.condition && params.condition !== 'ALL') {
            queryParams.condition = params.condition;
          }
          if (params.minPrice !== undefined) queryParams.minPrice = params.minPrice;
          if (params.maxPrice !== undefined) queryParams.maxPrice = params.maxPrice;
        }

        return {
          url: API_ENDPOINTS.vendor.myProducts,
          method: 'GET',
          params: queryParams,
        };
      },
      providesTags: (result) =>
        result?.products
          ? [
              ...result.products.map(({ id }) => ({ type: 'Products' as const, id })),
              { type: 'Products' as const, id: 'LIST' },
            ]
          : [{ type: 'Products' as const, id: 'LIST' }],
      transformResponse: (response: any): GetVendorProductsResponse => {
        const payload = response?.data || response || {};
        const rawProducts = payload?.products || (Array.isArray(payload) ? payload : []);
        const total = typeof payload?.total === 'number' ? payload.total : rawProducts.length;
        const skip = typeof payload?.skip === 'number' ? payload.skip : 0;
        const take = typeof payload?.take === 'number' ? payload.take : rawProducts.length;

        const products: VendorProductItem[] = rawProducts.map((p: any) => ({
          id: p.id,
          name: p.name || 'Untitled Craft',
          productCategory: p.productCategory || 'CRAFTS',
          price: Number(p.price) || 0,
          basePrice: p.basePrice ? Number(p.basePrice) : undefined,
          stockQuantity: Number(p.stockQuantity) || 0,
          condition: p.condition || 'new',
          mainImage: p.mainImage || '',
          imageList: Array.isArray(p.imageList) ? p.imageList : p.mainImage ? [p.mainImage] : [],
          description: p.description || '',
          details: p.details || {},
          isCustomizable: Boolean(p.isCustomizable),
          isRequestable: Boolean(p.isRequestable),
          estimatedProductionDays: p.estimatedProductionDays ? Number(p.estimatedProductionDays) : undefined,
          sku: p.sku || `ETH-${(p.id || '').slice(-4).toUpperCase()}`,
          rating: typeof p.rating === 'number' ? p.rating : typeof p.vendor?.rating === 'number' ? p.vendor.rating : 0,
          reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
          salesCount: typeof p.salesCount === 'number' ? p.salesCount : 0,
          material: p.details?.material || p.material,
          origin: p.details?.origin || p.origin,
          era: p.details?.era || p.era,
          weight: p.weight ? Number(p.weight) : undefined,
          weightUnit: p.weightUnit || 'kg',
          packageSize: p.packageSize || p.packageSizeEnum,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt,
          vendor: p.vendor,
        }));

        return { products, total, skip, take };
      },
    }),

    // 4. Create new product
    createProduct: builder.mutation<VendorProductItem, CreateProductPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.vendor.createProduct,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }, 'VendorOverview'],
      transformResponse: (response: any): VendorProductItem => {
        return response?.data || response;
      },
    }),

    // 5. Update existing product
    updateProduct: builder.mutation<VendorProductItem, { id: string; data: UpdateProductPayload }>({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.vendor.updateProduct(id),
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Products', id },
        { type: 'Products', id: 'LIST' },
        'VendorOverview',
      ],
      transformResponse: (response: any): VendorProductItem => {
        return response?.data || response;
      },
    }),

    // 6. Delete product
    deleteProduct: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: API_ENDPOINTS.vendor.deleteProduct(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Products', id },
        { type: 'Products', id: 'LIST' },
        'VendorOverview',
      ],
      transformResponse: (response: any, meta, id): { success: boolean; id: string } => {
        return { success: response?.success ?? true, id };
      },
    }),

    // 7. Get marketplace custom commission requests for vendors
    getMarketplaceRequests: builder.query<{ requests: CustomRequestItem[]; count: number }, void>({
      query: () => ({
        url: API_ENDPOINTS.studio.marketplace,
        method: 'GET',
      }),
      providesTags: (result) =>
        result?.requests
          ? [
              ...result.requests.map(({ id }) => ({ type: 'CustomRequests' as const, id })),
              { type: 'CustomRequests', id: 'LIST' },
            ]
          : [{ type: 'CustomRequests', id: 'LIST' }],
      transformResponse: (response: any): { requests: CustomRequestItem[]; count: number } => {
        const rawList = response?.requests || response?.data?.requests || response?.data || response || [];
        const requests: CustomRequestItem[] = Array.isArray(rawList) ? rawList : [];
        const count = typeof response?.count === 'number' ? response.count : requests.length;
        return { requests, count };
      },
    }),

    // 8. Get vendor custom bids
    getVendorBids: builder.query<CustomBidItem[], void>({
      query: () => ({
        url: API_ENDPOINTS.studio.vendorBids,
        method: 'GET',
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'VendorBids' as const, id })),
              { type: 'VendorBids', id: 'LIST' },
            ]
          : [{ type: 'VendorBids', id: 'LIST' }],
      transformResponse: (response: any): CustomBidItem[] => {
        const rawList = response?.customBids || response?.data?.customBids || response?.data || response || [];
        return Array.isArray(rawList) ? rawList : [];
      },
    }),

    // 9. Submit a bid on a custom request
    createCustomBid: builder.mutation<CustomBidItem, CreateCustomBidPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.studio.bids,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'CustomRequests', id: 'LIST' },
        { type: 'VendorBids', id: 'LIST' },
        'VendorOverview',
      ],
      transformResponse: (response: any): CustomBidItem => {
        return response?.customBid || response?.data?.customBid || response?.data || response;
      },
    }),

    // 10. Update a custom bid
    updateCustomBid: builder.mutation<CustomBidItem, { id: string; data: UpdateCustomBidPayload }>({
      query: ({ id, data }) => ({
        url: `${API_ENDPOINTS.studio.bids}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'VendorBids', id },
        { type: 'VendorBids', id: 'LIST' },
        { type: 'CustomRequests', id: 'LIST' },
      ],
      transformResponse: (response: any): CustomBidItem => {
        return response?.customBid || response?.data?.customBid || response?.data || response;
      },
    }),

    // 11. Delete a custom bid
    deleteCustomBid: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `${API_ENDPOINTS.studio.bids}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'VendorBids', id },
        { type: 'VendorBids', id: 'LIST' },
        { type: 'CustomRequests', id: 'LIST' },
      ],
      transformResponse: (response: any, meta, id): { success: boolean; id: string } => {
        return { success: response?.success ?? true, id };
      },
    }),

    // 12. Get vendor product requests (Active Workbench)
    getVendorProductRequests: builder.query<VendorProductRequestItem[], { status?: string } | void>({
      query: (arg) => {
        const status = arg && typeof arg === 'object' && arg.status ? arg.status : undefined;
        return {
          url: API_ENDPOINTS.studio.vendorRequests,
          method: 'GET',
          params: status ? { status } : undefined,
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'CustomRequests' as const, id })),
              { type: 'CustomRequests', id: 'WORKBENCH_LIST' },
            ]
          : [{ type: 'CustomRequests', id: 'WORKBENCH_LIST' }],
      transformResponse: (response: any): VendorProductRequestItem[] => {
        const rawList = response?.data || response || [];
        return Array.isArray(rawList) ? rawList : [];
      },
    }),

    // 13. Start production on a product request
    startProduction: builder.mutation<VendorProductRequestItem, { id: string; data: StartProductionPayload }>({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.studio.startProduction(id),
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CustomRequests', id },
        { type: 'CustomRequests', id: 'WORKBENCH_LIST' },
        'VendorOverview',
      ],
      transformResponse: (response: any): VendorProductRequestItem => {
        return response?.data || response;
      },
    }),

    // 14. Update production progress
    updateProductionProgress: builder.mutation<VendorProductRequestItem, { id: string; data: UpdateProductionProgressPayload }>({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.studio.updateProgress(id),
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CustomRequests', id },
        { type: 'CustomRequests', id: 'WORKBENCH_LIST' },
      ],
      transformResponse: (response: any): VendorProductRequestItem => {
        return response?.data || response;
      },
    }),

    // 15. Mark ready for shipping
    markProductReady: builder.mutation<any, { id: string; data?: { notes?: string } }>({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.studio.markReady(id),
        method: 'POST',
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CustomRequests', id },
        { type: 'CustomRequests', id: 'WORKBENCH_LIST' },
        'VendorOrders',
        'VendorOverview',
      ],
      transformResponse: (response: any): any => {
        return response?.data || response;
      },
    }),

    // 16. Get all vendor catalogs (Lookbooks)
    getVendorCatalogs: builder.query<VendorCatalogItem[], void>({
      query: () => ({
        url: API_ENDPOINTS.vendor.catalogs,
        method: 'GET',
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'VendorCatalogs' as const, id })),
              { type: 'VendorCatalogs' as const, id: 'LIST' },
            ]
          : [{ type: 'VendorCatalogs' as const, id: 'LIST' }],
      transformResponse: (response: any): VendorCatalogItem[] => {
        const rawList = response?.data || response || [];
        if (!Array.isArray(rawList)) return [];
        return rawList.map((c: any) => ({
          id: c.id || c._id || '',
          vendorId: c.vendorId,
          name: c.name || c.title || 'Untitled Lookbook',
          image: c.image || c.coverImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
          description: c.description || '',
          categoryType: c.categoryType || 'CRAFTS',
          price: c.price ? Number(c.price) : undefined,
          productIds: Array.isArray(c.productIds) ? c.productIds : Array.isArray(c.products) ? c.products.map((p: any) => p.id || p) : [],
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
          tags: Array.isArray(c.tags) ? c.tags : [],
        }));
      },
    }),

    // 17. Create new catalog lookbook
    createVendorCatalog: builder.mutation<VendorCatalogItem, CreateVendorCatalogPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.vendor.createCatalog,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'VendorCatalogs', id: 'LIST' }, 'VendorOverview'],
      transformResponse: (response: any): VendorCatalogItem => {
        return response?.data || response;
      },
    }),

    // 18. Update existing catalog lookbook
    updateVendorCatalog: builder.mutation<VendorCatalogItem, { id: string; body: UpdateVendorCatalogPayload }>({
      query: ({ id, body }) => ({
        url: API_ENDPOINTS.vendor.updateCatalog(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'VendorCatalogs', id },
        { type: 'VendorCatalogs', id: 'LIST' },
      ],
      transformResponse: (response: any): VendorCatalogItem => {
        return response?.data || response;
      },
    }),

    // 19. Delete catalog lookbook
    deleteVendorCatalog: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: API_ENDPOINTS.vendor.deleteCatalog(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'VendorCatalogs', id },
        { type: 'VendorCatalogs', id: 'LIST' },
      ],
      transformResponse: (response: any, meta, arg): { success: boolean; id: string } => {
        return { success: true, id: arg };
      },
    }),
    // 20. Get vendor messages/conversations list
    getVendorMessages: builder.query<VendorMessagesResponse, { page?: number; limit?: number; status?: string } | void>({
      query: (params) => ({
        url: API_ENDPOINTS.vendor.messages,
        method: 'GET',
        params: params || { page: 1, limit: 20 },
      }),
      providesTags: (result) =>
        result?.messages
          ? [
              ...result.messages.map(({ chatId }) => ({ type: 'VendorMessages' as const, id: chatId })),
              { type: 'VendorMessages' as const, id: 'LIST' },
            ]
          : [{ type: 'VendorMessages' as const, id: 'LIST' }],
      transformResponse: (response: any): VendorMessagesResponse => {
        const payload = response?.data || response || {};
        const rawList = payload?.messages || (Array.isArray(payload) ? payload : []);
        return {
          messages: Array.isArray(rawList) ? rawList : [],
          total: typeof payload?.total === 'number' ? payload.total : rawList.length,
          unread: typeof payload?.unread === 'number' ? payload.unread : 0,
          page: typeof payload?.page === 'number' ? payload.page : 1,
          limit: typeof payload?.limit === 'number' ? payload.limit : 20,
        };
      },
    }),

    // 21. Get vendor message stats
    getVendorMessageStats: builder.query<{ total: number; unread: number; responseRate: number; averageResponseTime: number }, void>({
      query: () => ({
        url: API_ENDPOINTS.vendor.messageStats,
        method: 'GET',
      }),
      providesTags: ['VendorMessages'],
      transformResponse: (response: any) => {
        const data = response?.data || response || {};
        return {
          total: data.total || 0,
          unread: data.unread || 0,
          responseRate: data.responseRate || 0,
          averageResponseTime: data.averageResponseTime || 0,
        };
      },
    }),

    // 22. Get specific chat room by custom request ID
    getChatRoom: builder.query<ChatRoomData, string>({
      query: (customRequestId) => ({
        url: API_ENDPOINTS.chats.get(customRequestId),
        method: 'GET',
      }),
      providesTags: (result, error, customRequestId) => [
        { type: 'Chats', id: customRequestId },
      ],
      transformResponse: (response: any): ChatRoomData => {
        const data = response?.data || response;
        return {
          id: data?.id || '',
          customRequestId: data?.customRequestId || '',
          title: data?.title || 'Chat',
          status: data?.status || 'ACTIVE',
          lastMessageAt: data?.lastMessageAt,
          createdAt: data?.createdAt || new Date().toISOString(),
          updatedAt: data?.updatedAt || new Date().toISOString(),
          participants: Array.isArray(data?.participants) ? data.participants : [],
          messages: Array.isArray(data?.messages) ? data.messages : [],
          customRequest: data?.customRequest,
        };
      },
    }),

    // 23. Send message via REST API
    sendChatMessage: builder.mutation<ChatMessageItem, SendMessagePayload>({
      query: ({ customRequestId, content, attachments }) => ({
        url: API_ENDPOINTS.chats.sendMessage(customRequestId),
        method: 'POST',
        body: { content, attachments },
      }),
      invalidatesTags: (result, error, { customRequestId }) => [
        { type: 'Chats', id: customRequestId },
        { type: 'VendorMessages', id: 'LIST' },
      ],
      transformResponse: (response: any): ChatMessageItem => {
        return response?.data || response;
      },
    }),

    // 24. Get complete vendor profile and settings
    getVendorProfile: builder.query<VendorProfileData, void>({
      query: () => ({
        url: API_ENDPOINTS.vendor.profile,
        method: 'GET',
      }),
      providesTags: ['VendorProfile'],
      transformResponse: (response: any): VendorProfileData => {
        const payload = response?.data || response || {};
        const vendor = payload?.vendor || payload;
        return {
          id: vendor?.id || '',
          businessName: vendor?.businessName || '',
          businessEmail: vendor?.businessEmail,
          businessPhone: vendor?.businessPhone,
          description: vendor?.description,
          businessLogo: vendor?.businessLogo,
          businessBanner: vendor?.businessBanner,
          notificationsEnabled: typeof vendor?.notificationsEnabled === 'boolean' ? vendor.notificationsEnabled : true,
          city: vendor?.city || vendor?.cityOfOperation,
          country: vendor?.country || vendor?.countryOfOperation,
          businessAddresses: Array.isArray(payload?.addresses)
            ? payload.addresses
            : Array.isArray(vendor?.businessAddresses)
            ? vendor.businessAddresses
            : [],
          catalogs: Array.isArray(payload?.catalogs)
            ? payload.catalogs
            : Array.isArray(vendor?.catalogs)
            ? vendor.catalogs
            : [],
          createdAt: vendor?.createdAt,
          updatedAt: vendor?.updatedAt,
        };
      },
    }),

    // 25. Update vendor profile settings (notifications, city, country)
    updateVendorSettings: builder.mutation<VendorProfileData, UpdateVendorSettingsPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.vendor.updateProfileSettings,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['VendorProfile', 'VendorOverview'],
      transformResponse: (response: any): VendorProfileData => {
        const payload = response?.data || response || {};
        return payload?.vendor || payload;
      },
    }),

    // 26. Update vendor branding (logo, banner, description)
    updateVendorBranding: builder.mutation<VendorProfileData, UpdateVendorBrandingPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.vendor.branding,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['VendorProfile', 'VendorOverview'],
      transformResponse: (response: any): VendorProfileData => {
        const payload = response?.data || response || {};
        return payload?.vendor || payload;
      },
    }),

    // 27. Get vendor business addresses
    getVendorAddresses: builder.query<VendorBusinessAddressItem[], void>({
      query: () => ({
        url: API_ENDPOINTS.vendor.addresses,
        method: 'GET',
      }),
      providesTags: ['VendorProfile', 'Addresses'],
      transformResponse: (response: any): VendorBusinessAddressItem[] => {
        const payload = response?.data || response;
        return Array.isArray(payload) ? payload : [];
      },
    }),

    // 28. Add new vendor business address
    createVendorAddress: builder.mutation<VendorBusinessAddressItem, CreateVendorAddressPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.vendor.createAddress,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['VendorProfile', 'Addresses'],
      transformResponse: (response: any): VendorBusinessAddressItem => {
        const payload = response?.data || response;
        return payload;
      },
    }),

    // 29. Update existing vendor business address
    updateVendorAddress: builder.mutation<VendorBusinessAddressItem, UpdateVendorAddressPayload>({
      query: ({ id, ...body }) => ({
        url: API_ENDPOINTS.vendor.updateAddress(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['VendorProfile', 'Addresses'],
      transformResponse: (response: any): VendorBusinessAddressItem => {
        const payload = response?.data || response;
        return payload;
      },
    }),

    // 30. Delete vendor business address
    deleteVendorAddress: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: API_ENDPOINTS.vendor.deleteAddress(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['VendorProfile', 'Addresses'],
      transformResponse: (response: any) => {
        const payload = response?.data || response;
        return payload || { success: true };
      },
    }),

    // 31. Set vendor default address
    setVendorDefaultAddress: builder.mutation<VendorBusinessAddressItem, string>({
      query: (id) => ({
        url: API_ENDPOINTS.vendor.setDefaultAddress(id),
        method: 'PATCH',
      }),
      invalidatesTags: ['VendorProfile', 'Addresses'],
      transformResponse: (response: any): VendorBusinessAddressItem => {
        const payload = response?.data || response;
        return payload;
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetVendorOverviewQuery,
  useGetVendorOrdersQuery,
  useGetVendorProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUpdateOrderStatusMutation,
  useGetMarketplaceRequestsQuery,
  useGetVendorBidsQuery,
  useCreateCustomBidMutation,
  useUpdateCustomBidMutation,
  useDeleteCustomBidMutation,
  useGetVendorProductRequestsQuery,
  useStartProductionMutation,
  useUpdateProductionProgressMutation,
  useMarkProductReadyMutation,
  useGetVendorCatalogsQuery,
  useCreateVendorCatalogMutation,
  useUpdateVendorCatalogMutation,
  useDeleteVendorCatalogMutation,
  useGetVendorMessagesQuery,
  useGetVendorMessageStatsQuery,
  useGetChatRoomQuery,
  useSendChatMessageMutation,
  useGetVendorProfileQuery,
  useUpdateVendorSettingsMutation,
  useUpdateVendorBrandingMutation,
  useGetVendorAddressesQuery,
  useCreateVendorAddressMutation,
  useUpdateVendorAddressMutation,
  useDeleteVendorAddressMutation,
  useSetVendorDefaultAddressMutation,
} = vendorApi;
