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
  prepareHeaders: async (headers, { endpoint }) => {
    const token = await StorageService.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const isFormData =
      headers.has('x-is-formdata') ||
      endpoint === 'uploadVendorDocuments' ||
      headers.get('Content-Type') === 'multipart/form-data';

    if (isFormData) {
      // In React Native fetch, NEVER manually set Content-Type for FormData.
      // Setting Content-Type overrides the boundary parameter and causes native OkHttp
      // to fail immediately with FETCH_ERROR.
      headers.delete('Content-Type');
      headers.delete('x-is-formdata');
    } else if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

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

// Custom base query with seamless automatic token refresh and transparent Expo terminal error logging
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let adjustedArgs = args;
  const isFormData =
    typeof args !== 'string' &&
    args.body &&
    (args.body instanceof FormData ||
      (typeof args.body === 'object' && '_parts' in (args.body as any)));

  if (isFormData && typeof args !== 'string') {
    const headers = new Headers(args.headers as any);
    headers.set('x-is-formdata', 'true');
    headers.delete('Content-Type');
    adjustedArgs = { ...args, headers };
  }

  const url = typeof adjustedArgs === 'string' ? adjustedArgs : adjustedArgs.url;
  const method = typeof adjustedArgs === 'string' ? 'GET' : adjustedArgs.method || 'GET';
  const reqBody = typeof adjustedArgs === 'string' ? undefined : adjustedArgs.body;

  let result = await rawBaseQuery(adjustedArgs, api, extraOptions);

  // If there's an error from the backend, print formatted details to the Expo terminal logs
  if (result.error) {
    const status = result.error.status;
    const errorData = result.error.data;
    console.error(
      `\n======================================================\n` +
      `🚨 [EXPO API ERROR] ${method} ${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}\n` +
      `📊 HTTP Status: ${status}\n` +
      (reqBody ? `📦 Request Body: ${JSON.stringify(reqBody, null, 2)}\n` : '') +
      `❌ Error Response: ${JSON.stringify(errorData, null, 2)}\n` +
      `======================================================\n`
    );
  }

  // Handle 401 Unauthorized with automatic refresh token exchange
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
    'Profile',
    'Addresses',
    'Favorites',
    'Products',
    'Categories',
    'Orders',
    'VendorOrders',
    'CustomRequests',
    'VendorBids',
    'Payouts',
    'Reviews',
    'Cart',
    'Payments',
  ],
  endpoints: () => ({}),
});
