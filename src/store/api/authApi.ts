import { baseApi } from './baseApi';
import { API_ENDPOINTS } from '@/constants/api';

export interface LoginPayload {
  email: string;
  password?: string;
  ip?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'VENDOR' | 'ADMIN';
  isEmailVerified: boolean;
  preferredCurrency?: string;
  timezone?: string | null;
}

export interface VendorProfile {
  id: string;
  storeName?: string;
  storeDescription?: string;
  isBusinessInfoComplete?: boolean;
  isDocumentsComplete?: boolean;
  verifiedAt?: string | null;
  approvedAt?: string | null;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
  vendor?: VendorProfile;
}

export interface InitiateRegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
}

export interface InitiateRegisterResponse {
  registrationToken: string;
  message: string;
  expiresIn: number;
}

export interface VerifyOtpPayload {
  registrationToken: string;
  otp: string;
}

export interface VerifyOtpResponse {
  verificationToken: string;
  message: string;
  isVerified: boolean;
}

export interface CompleteRegisterPayload {
  verificationToken: string;
  password: string;
  preferredCurrency?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.login,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'UserProfile', 'VendorProfile'],
    }),

    initiateRegister: builder.mutation<InitiateRegisterResponse, InitiateRegisterPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.initiateRegister,
        method: 'POST',
        body,
      }),
    }),

    verifyOtp: builder.mutation<VerifyOtpResponse, VerifyOtpPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.verifyOtp,
        method: 'POST',
        body,
      }),
    }),

    completeRegister: builder.mutation<AuthResponse, CompleteRegisterPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.completeRegister,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'UserProfile'],
    }),

    initiateVendorRegister: builder.mutation<InitiateRegisterResponse, InitiateRegisterPayload & { storeName: string }>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.initiateVendorRegister,
        method: 'POST',
        body,
      }),
    }),

    verifyVendorOtp: builder.mutation<VerifyOtpResponse, VerifyOtpPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.verifyVendorOtp,
        method: 'POST',
        body,
      }),
    }),

    completeVendorRegister: builder.mutation<AuthResponse, CompleteRegisterPayload & { storeName: string }>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.completeVendorRegister,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'UserProfile', 'VendorProfile'],
    }),

    getProfile: builder.query<UserProfile, void>({
      query: () => API_ENDPOINTS.auth.profile,
      providesTags: ['UserProfile'],
    }),

    getVendorProfile: builder.query<VendorProfile, void>({
      query: () => API_ENDPOINTS.auth.vendorProfile,
      providesTags: ['VendorProfile'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useLoginMutation,
  useInitiateRegisterMutation,
  useVerifyOtpMutation,
  useCompleteRegisterMutation,
  useInitiateVendorRegisterMutation,
  useVerifyVendorOtpMutation,
  useCompleteVendorRegisterMutation,
  useGetProfileQuery,
  useGetVendorProfileQuery,
} = authApi;
