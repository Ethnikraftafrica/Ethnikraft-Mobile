import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '@/constants/api';
import { StorageService } from '@/services/storage.service';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: async (headers) => {
      const token = await StorageService.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  // Bounded cache retention to prevent memory leaks as defined in architecture plan
  keepUnusedDataFor: 60,
  tagTypes: [
    'Auth',
    'UserProfile',
    'VendorProfile',
    'Products',
    'Categories',
    'Orders',
    'VendorOrders',
    'CustomRequests',
    'VendorBids',
    'Payouts',
    'Reviews',
  ],
  endpoints: () => ({}),
});
