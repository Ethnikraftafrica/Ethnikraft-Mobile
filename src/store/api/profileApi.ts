import { baseApi } from './baseApi';
import { API_ENDPOINTS } from '@/constants/api';

export type AddressType = 'HOME' | 'OFFICE' | 'APARTMENT' | 'OTHER';

export interface SavedAddress {
  id: string;
  address: string;
  addressType: AddressType;
  buildingName?: string;
  aptNoOrCompany?: string;
  floor?: string;
  street: string;
  additionalDirections?: string;
  phoneNumber: string;
  additionalLabel?: string;
  city: string;
  state: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressPayload {
  address: string;
  addressType: AddressType;
  street: string;
  city: string;
  state: string;
  phoneNumber: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
  buildingName?: string;
  aptNoOrCompany?: string;
  floor?: string;
  additionalDirections?: string;
  additionalLabel?: string;
  isDefault?: boolean;
}

export interface UpdateAddressPayload {
  id: string;
  data: Partial<CreateAddressPayload>;
}

export interface FullUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'VENDOR' | 'ADMIN';
  profileName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate?: string;
  notificationsEnabled: boolean;
  isEmailVerified: boolean;
  savedAddresses?: SavedAddress[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateContactInfoPayload {
  profileName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateNotificationsPayload {
  notificationsEnabled: boolean;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    description: string;
    price: string | number;
    mainImage: string;
    productCategory: string;
    artisan?: string;
    vendor?: {
      id: string;
      businessName: string;
      rating?: number;
    };
  };
}

export interface FavoritesResponse {
  success: boolean;
  message?: string;
  data: FavoriteItem[];
  count: number;
}

export interface CustomerOrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: string | number;
  product?: {
    id: string;
    name: string;
    mainImage: string;
  };
}

export interface CustomerOrder {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount: string | number;
  currency?: string;
  createdAt: string;
  orderItems?: CustomerOrderItem[];
}

export interface CustomerOrdersResponse {
  success?: boolean;
  data: CustomerOrder[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Full Profile
    getProfile: builder.query<FullUserProfile, void>({
      query: () => API_ENDPOINTS.profile.get,
      transformResponse: (response: any) => {
        // Handle direct DTO or standard { success, data } envelope
        return response?.data ?? response;
      },
      providesTags: ['Profile'],
    }),

    // 2. Contact Info Mutation
    updateContactInfo: builder.mutation<FullUserProfile, UpdateContactInfoPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.profile.contactInfo,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Profile', 'UserProfile'],
    }),

    // 3. Notification Settings Mutation
    updateNotifications: builder.mutation<FullUserProfile, UpdateNotificationsPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.profile.notifications,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Profile'],
    }),

    // 4. Saved Addresses Queries & Mutations
    getAddresses: builder.query<SavedAddress[], void>({
      query: () => API_ENDPOINTS.profile.addresses.list,
      transformResponse: (response: any) => {
        const raw = response?.data ?? response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Addresses'],
    }),

    createAddress: builder.mutation<SavedAddress, CreateAddressPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.profile.addresses.create,
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Addresses', 'Profile'],
    }),

    updateAddress: builder.mutation<SavedAddress, UpdateAddressPayload>({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.profile.addresses.update(id),
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Addresses', 'Profile'],
    }),

    deleteAddress: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: API_ENDPOINTS.profile.addresses.delete(id),
        method: 'DELETE',
      }),
      transformResponse: (_, __, id) => ({ success: true, id }),
      invalidatesTags: ['Addresses', 'Profile'],
    }),

    setDefaultAddress: builder.mutation<SavedAddress, string>({
      query: (id) => ({
        url: API_ENDPOINTS.profile.addresses.setDefault(id),
        method: 'POST',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Addresses', 'Profile'],
    }),

    // 5. Favorites / Wishlist Queries & Mutations
    getFavorites: builder.query<FavoriteItem[], void>({
      query: () => API_ENDPOINTS.favorites.list,
      transformResponse: (response: any) => {
        const list = response?.data ?? response;
        return Array.isArray(list) ? list : [];
      },
      providesTags: ['Favorites'],
    }),

    getFavoritesCount: builder.query<number, void>({
      query: () => API_ENDPOINTS.favorites.count,
      transformResponse: (response: any) => {
        return response?.data?.count ?? response?.count ?? 0;
      },
      providesTags: ['Favorites'],
    }),

    addToFavorites: builder.mutation<{ success: boolean }, string>({
      query: (productId) => ({
        url: API_ENDPOINTS.favorites.add(productId),
        method: 'POST',
      }),
      invalidatesTags: ['Favorites'],
    }),

    removeFromFavorites: builder.mutation<{ success: boolean }, string>({
      query: (productId) => ({
        url: API_ENDPOINTS.favorites.remove(productId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Favorites'],
    }),

    // 6. Customer Orders Query (for order history badge & overview)
    getCustomerOrders: builder.query<CustomerOrder[], void>({
      query: () => API_ENDPOINTS.orders.customerOrders,
      transformResponse: (response: any) => {
        const list = response?.data ?? response;
        return Array.isArray(list) ? list : [];
      },
      providesTags: ['Orders'],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateContactInfoMutation,
  useUpdateNotificationsMutation,
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useGetFavoritesQuery,
  useGetFavoritesCountQuery,
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
  useGetCustomerOrdersQuery,
} = profileApi;
