import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { StorageService } from '@/services/storage.service';
import { logout, updateTokens } from '../slices/authSlice';

// Base fetch query with automatic Authorization header injection
const rawBaseQuery = fetchBaseQuery({
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
});

// Mutex lock to prevent duplicate refresh attempts when multiple calls return 401 concurrently
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

const onTokenRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback);
};

// Custom base query with seamless automatic token refresh
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = await StorageService.getRefreshToken();

    if (!refreshToken) {
      api.dispatch(logout());
      return result;
    }

    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshResult = await rawBaseQuery(
          {
            url: API_ENDPOINTS.auth.refresh,
            method: 'POST',
            body: { refresh_token: refreshToken },
          },
          api,
          extraOptions
        );

        const data = refreshResult.data as any;
        const newTokens = data?.tokens || data?.data?.tokens || data;

        if (newTokens?.access_token) {
          api.dispatch(
            updateTokens({
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token || refreshToken,
            })
          );
          onTokenRefreshed(newTokens.access_token);
          // Retry original request with newly acquired access token
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          onTokenRefreshed(null);
          api.dispatch(logout());
        }
      } catch (err) {
        onTokenRefreshed(null);
        api.dispatch(logout());
      } finally {
        isRefreshing = false;
      }
    } else {
      // Wait for ongoing refresh to complete
      const retryPromise = new Promise<any>((resolve) => {
        addRefreshSubscriber((newToken) => {
          if (newToken) {
            resolve(rawBaseQuery(args, api, extraOptions));
          } else {
            resolve(result);
          }
        });
      });
      return await retryPromise;
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
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
