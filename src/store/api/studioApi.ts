import { baseApi } from './baseApi';

export interface BackendCustomBid {
  id: string;
  customRequestId: string;
  vendorId: string;
  price: number;
  proposedTimeline: string;
  notes?: string;
  sampleImage?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    businessName: string;
    businessEmail?: string;
    businessTagline?: string;
    profileImage?: string;
    rating?: number;
    reviewCount?: number;
    cityOfOperation?: string;
    countryOfOperation?: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface BackendCustomRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  budget: number;
  timeline: string;
  materialType?: string;
  materialQuality?: string;
  colors?: string[];
  quantity?: number;
  measurements?: string;
  inspirationImages: string[];
  categoryType: string;
  status: 'OPEN' | 'CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  selectedBidId?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    bids: number;
  };
  bids?: BackendCustomBid[];
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateCustomRequestPayload {
  title: string;
  description: string;
  budget: number;
  timeline: string;
  categoryType: string;
  materialType?: string;
  materialQuality?: string;
  colors?: string[];
  quantity?: number;
  measurements?: string;
  inspirationImages: string[];
}

export interface UpdateCustomRequestPayload {
  id: string;
  budget?: number;
  timeline?: string;
  description?: string;
  colors?: string[];
  materialType?: string;
  materialQuality?: string;
}

export interface SearchVendorsPayload {
  requestId: string;
  categoryId?: string;
  search?: string;
}

export interface AcceptCustomBidPayload {
  requestId: string;
  bidId: string;
  initiatePayment?: boolean;
  currency?: string;
}

export interface UpdateCustomBidPayload {
  bidId: string;
  requestId?: string;
  price?: number;
  proposedTimeline?: string;
  notes?: string;
}

export const studioApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get all custom requests for authenticated user
    getUserCustomRequests: builder.query<BackendCustomRequest[], void>({
      query: () => '/custom-requests',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'CustomRequests' as const, id })),
              { type: 'CustomRequests', id: 'LIST' },
            ]
          : [{ type: 'CustomRequests', id: 'LIST' }],
      transformResponse: (response: any): BackendCustomRequest[] => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data?.customRequests)) return response.data.customRequests;
        if (Array.isArray(response?.customRequests)) return response.customRequests;
        if (Array.isArray(response?.data?.requests)) return response.data.requests;
        if (Array.isArray(response?.requests)) return response.requests;
        if (Array.isArray(response?.data)) return response.data;
        return [];
      },
    }),

    // 2. Get single custom request details by ID
    getCustomRequestById: builder.query<BackendCustomRequest, string>({
      query: (id) => `/custom-requests/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'CustomRequests', id }],
      transformResponse: (response: any): BackendCustomRequest => {
        return (
          response?.data?.customRequest ||
          response?.customRequest ||
          response?.data ||
          response
        );
      },
    }),

    // 3. Get all artisan bids for a specific request
    getCustomRequestBids: builder.query<BackendCustomBid[], string>({
      query: (requestId) => `/custom-requests/${requestId}/bids`,
      providesTags: (_result, _error, requestId) => [
        { type: 'VendorBids', id: requestId },
      ],
      transformResponse: (response: any): BackendCustomBid[] => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data?.bids)) return response.data.bids;
        if (Array.isArray(response?.bids)) return response.bids;
        if (Array.isArray(response?.data)) return response.data;
        return [];
      },
    }),

    // 4. Create a new custom request
    createCustomRequest: builder.mutation<BackendCustomRequest, CreateCustomRequestPayload>({
      query: (body) => ({
        url: '/custom-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'CustomRequests', id: 'LIST' }],
      transformResponse: (response: any): BackendCustomRequest => {
        return (
          response?.customRequest ||
          response?.data?.customRequest ||
          response?.data ||
          response
        );
      },
    }),

    // 5. Update an existing custom request
    updateCustomRequest: builder.mutation<BackendCustomRequest, UpdateCustomRequestPayload>({
      query: ({ id, ...body }) => ({
        url: `/custom-requests/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'CustomRequests', id },
        { type: 'CustomRequests', id: 'LIST' },
      ],
      transformResponse: (response: any): BackendCustomRequest => {
        return (
          response?.customRequest ||
          response?.data?.customRequest ||
          response?.data ||
          response
        );
      },
    }),

    // 6. Delete a custom request
    deleteCustomRequest: builder.mutation<void, string>({
      query: (id) => ({
        url: `/custom-requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'CustomRequests', id },
        { type: 'CustomRequests', id: 'LIST' },
      ],
    }),

    // 7. Trigger vendor search / notifications
    searchVendorsForRequest: builder.mutation<any, SearchVendorsPayload>({
      query: ({ requestId, categoryId, search }) => ({
        url: `/custom-requests/${requestId}/search-vendors`,
        method: 'POST',
        body: {
          ...(categoryId ? { categoryId } : {}),
          ...(search ? { search } : {}),
        },
      }),
      invalidatesTags: (_result, _error, { requestId }) => [
        { type: 'CustomRequests', id: requestId },
      ],
    }),

    // 8. Accept an artisan's bid
    acceptCustomBid: builder.mutation<any, AcceptCustomBidPayload>({
      query: ({ requestId, bidId, initiatePayment, currency }) => ({
        url: `/custom-bids/${requestId}/${bidId}/accept`,
        method: 'PUT',
        body: {
          initiatePayment: !!initiatePayment,
          currency: currency || 'NGN',
        },
      }),
      invalidatesTags: (_result, _error, { requestId }) => [
        { type: 'CustomRequests', id: requestId },
        { type: 'CustomRequests', id: 'LIST' },
        { type: 'VendorBids', id: requestId },
        { type: 'Orders', id: 'LIST' },
      ],
    }),

    // 9. Update a custom bid or send a counter-offer
    updateCustomBid: builder.mutation<BackendCustomBid, UpdateCustomBidPayload>({
      query: ({ bidId, requestId, ...body }) => ({
        url: requestId
          ? `/custom-bids/${requestId}/${bidId}`
          : `/custom-bids/${bidId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { requestId }) => [
        ...(requestId ? [{ type: 'VendorBids' as const, id: requestId }] : []),
        { type: 'CustomRequests', id: 'LIST' },
      ],
      transformResponse: (response: any): BackendCustomBid => {
        return (
          response?.customBid ||
          response?.data?.customBid ||
          response?.data ||
          response
        );
      },
    }),

    // 10. Reject a custom bid
    rejectCustomBid: builder.mutation<void, { bidId: string; requestId?: string }>({
      query: ({ bidId }) => ({
        url: `/custom-bids/${bidId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { requestId }) => [
        ...(requestId ? [{ type: 'VendorBids' as const, id: requestId }] : []),
        { type: 'CustomRequests', id: 'LIST' },
      ],
    }),

    // 11. Get matching registered vendors by category from live catalog
    getMatchingVendors: builder.query<
      Array<{
        id: string;
        name: string;
        businessName: string;
        category: string;
        rating: number;
        reviewCount: number;
        location: string;
        specialty: string;
        avatar: string;
        isAvailable: boolean;
        startingPrice?: number;
        deliverySpeed?: string;
      }>,
      { category?: string } | void
    >({
      query: (params) => ({
        url: '/products',
        params: {
          take: 50,
          ...(params?.category && params.category !== 'ALL'
            ? { productCategory: params.category.toUpperCase() }
            : {}),
        },
      }),
      transformResponse: (response: any) => {
        const products = Array.isArray(response?.data?.products)
          ? response.data.products
          : Array.isArray(response?.products)
          ? response.products
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];

        const vendorMap = new Map<string, any>();

        products.forEach((p: any) => {
          const v = p.vendor;
          if (v && (v.id || v._id) && !vendorMap.has(v.id || v._id)) {
            const vendorId = (v.id || v._id).toString();
            const bName = v.businessName || v.name || 'Master Artisan';
            vendorMap.set(vendorId, {
              id: vendorId,
              name: bName,
              businessName: bName,
              category: p.productCategory || 'WEARS',
              rating: v.rating || 4.9,
              reviewCount: p.reviewCount || 16,
              location: v.cityOfOperation ? `${v.cityOfOperation}, Nigeria` : 'Lagos, Nigeria',
              specialty: `Master Specialist • ${p.name || p.productCategory || 'Bespoke Regalia'}`,
              avatar:
                v.businessLogo ||
                v.profileImage ||
                p.mainImage ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
              isAvailable: true,
              startingPrice: typeof p.price === 'number' ? p.price : parseInt(p.price || '25000', 10) || 25000,
              deliverySpeed: `${p.estimatedProductionDays || 7} - ${(p.estimatedProductionDays || 7) + 7} Days`,
            });
          }
        });

        return Array.from(vendorMap.values());
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetUserCustomRequestsQuery,
  useGetCustomRequestByIdQuery,
  useGetCustomRequestBidsQuery,
  useCreateCustomRequestMutation,
  useUpdateCustomRequestMutation,
  useDeleteCustomRequestMutation,
  useSearchVendorsForRequestMutation,
  useAcceptCustomBidMutation,
  useUpdateCustomBidMutation,
  useRejectCustomBidMutation,
  useGetMatchingVendorsQuery,
} = studioApi;
