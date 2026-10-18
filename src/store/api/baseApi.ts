import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { StorageService } from '@/services/storage.service';
import { logout, updateTokens, triggerSessionExpired } from '../slices/authSlice';

// Base fetch query with automatic Authorization header injection
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async (headers, { endpoint, getState }) => {
    // Prefer Redux state access token first, fallback to StorageService
    const state = getState() as { auth?: { accessToken?: string | null } };
    const token = state?.auth?.accessToken || (await StorageService.getAccessToken());
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

// Endpoints that are explicitly public or authentication-related where a 401 should NEVER trigger session expiration
const isAuthOrPublicUrl = (url: string): boolean => {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/google-login') ||
    url.includes('/auth/initiate-registration') ||
    url.includes('/auth/verify-otp') ||
    url.includes('/auth/complete-registration') ||
    url.includes('/auth/vendor/initiate-registration') ||
    url.includes('/auth/vendor/verify-otp') ||
    url.includes('/auth/vendor/complete-registration') ||
    url.includes('/auth/password-reset')
  );
};

// Custom base query with seamless automatic token refresh and transparent Expo terminal error logging
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const isFormData =
    typeof args !== 'string' &&
    args.body &&
    (args.body instanceof FormData ||
      (typeof args.body === 'object' && '_parts' in (args.body as any)));

  // In React Native, FormData is an Object that fetchBaseQuery's isJsonifiable mistakenly treats
  // as a plain object, causing it to call JSON.stringify(formData) and force application/json.
  // We execute FormData uploads directly with native fetch to ensure OkHttp streams the binary multipart files.
  if (isFormData && typeof args !== 'string') {
    const state = api.getState() as { auth?: { accessToken?: string | null } };
    const token = state?.auth?.accessToken || (await StorageService.getAccessToken());
    const url = args.url;
    const method = args.method || 'POST';
    const fullUrl = `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

    try {
      const response = await fetch(fullUrl, {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: 'application/json',
          // Omit Content-Type: React Native native fetch attaches multipart/form-data with boundary automatically
        },
        body: args.body as any,
      });

      const responseText = await response.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      if (!response.ok) {
        if (response.status === 401 && !isAuthOrPublicUrl(url)) {
          api.dispatch(logout());
        }

        console.error(
          `\n======================================================\n` +
          `🚨 [EXPO API ERROR] ${method} ${fullUrl}\n` +
          `📊 HTTP Status: ${response.status}\n` +
          `❌ Error Response: ${JSON.stringify(responseData, null, 2)}\n` +
          `======================================================\n`
        );

        return {
          error: {
            status: response.status,
            data: responseData,
          },
        };
      }

      return { data: responseData };
    } catch (err: any) {
      console.error(
        `\n======================================================\n` +
        `🚨 [EXPO API ERROR] ${method} ${fullUrl}\n` +
        `📊 HTTP Status: FETCH_ERROR\n` +
        `❌ Error: ${err?.message || err}\n` +
        `======================================================\n`
      );
      return {
        error: {
          status: 'FETCH_ERROR',
          error: err?.message || String(err),
        },
      };
    }
  }

  const url = typeof args === 'string' ? args : args.url;
  const method = typeof args === 'string' ? 'GET' : args.method || 'GET';
  const reqBody = typeof args === 'string' ? undefined : args.body;

  let result = await rawBaseQuery(args, api, extraOptions);

  // Handle 401 Unauthorized with atomic refresh token exchange
  if (result.error && result.error.status === 401) {
    // 1. If this is an auth credential endpoint (like /auth/login), do NOT trigger session expiration or refresh.
    // Return the 401 as a standard rejection for the UI form error handler.
    if (isAuthOrPublicUrl(url)) {
      return result;
    }

    // 2. If this is the refresh endpoint itself failing with 401, session has definitely expired.
    if (url.includes(API_ENDPOINTS.auth.refresh)) {
      api.dispatch(triggerSessionExpired());
      return result;
    }

    const refreshToken = await StorageService.getRefreshToken();
    const state = api.getState() as { auth?: { isAuthenticated?: boolean } };
    const wasAuthenticated = !!state?.auth?.isAuthenticated;

    if (!refreshToken) {
      // Only pop session expired modal if the user was actually logged in previously
      if (wasAuthenticated) {
        api.dispatch(triggerSessionExpired());
        if (!isRefreshing) {
          console.warn(`[AUTH] Session expired for ${method} ${url}. Redirecting to login.`);
        }
      }
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
          if (wasAuthenticated) {
            api.dispatch(triggerSessionExpired());
          }
        }
      } catch (err) {
        onTokenRefreshed(null);
        if (wasAuthenticated) {
          api.dispatch(triggerSessionExpired());
        }
      } finally {
        isRefreshing = false;
      }
    } else {
      // Another request is already refreshing tokens; queue this request and await the new token
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
  } else if (result.error) {
    // Only log non-401 errors or unrecoverable application errors to prevent terminal spam
    const status = result.error.status;
    const errorData = result.error.data;
    console.error(
      `\n======================================================\n` +
      `🚨 [EXPO API ERROR] ${method} ${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}\n` +
      `📊 HTTP Status: ${status}\n` +
      (reqBody ? `📦 Request Body: ${JSON.stringify(reqBody, null, 2)}\n` : '') +
      `❌ Error Response: ${errorData ? (typeof errorData === 'object' ? JSON.stringify(errorData, null, 2) : errorData) : ((result.error as any).error || 'Network or connection error')}\n` +
      `======================================================\n`
    );
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
    'VendorOverview',
    'CustomRequests',
    'VendorBids',
    'Payouts',
    'Reviews',
    'Cart',
    'Payments',
    'VendorCatalogs',
    'Chats',
    'VendorMessages',
  ],
  endpoints: () => ({}),
});
