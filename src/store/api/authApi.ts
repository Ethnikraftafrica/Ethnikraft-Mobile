import { baseApi } from './baseApi';
import { API_ENDPOINTS } from '@/constants/api';

export interface LoginPayload {
  email: string;
  password?: string;
  ip?: string;
}

export interface GoogleLoginPayload {
  idToken: string;
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
  businessSubmittedAt?: string | null;
  verifiedAt?: string | null;
  approvedAt?: string | null;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
  vendor?: VendorProfile;
  locationDetected?: boolean;
}

export interface InitiateRegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
}

export interface InitiateRegisterResponse {
  registrationToken: string;
  message: string;
  expiresIn?: number;
}

export interface VerifyOtpPayload {
  registrationToken: string;
  otp: string;
}

export interface VerifyOtpResponse {
  verificationToken: string;
  message: string;
  isVerified?: boolean;
}

export interface CompleteRegisterPayload {
  verificationToken: string;
  password: string;
  ip?: string;
}

export interface InitiateVendorRegisterPayload {
  email: string;
}

export interface CompleteVendorRegisterPayload {
  verificationToken: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  ip?: string;
}

export interface InitiatePasswordResetPayload {
  email: string;
}

export interface InitiatePasswordResetResponse {
  message: string;
  email: string;
}

export interface VerifyPasswordResetOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyPasswordResetOtpResponse {
  verificationToken: string;
  message: string;
}

export interface CompletePasswordResetPayload {
  email: string;
  newPassword: string;
  verificationToken: string;
}

export interface GenericMessageResponse {
  message: string;
  success?: boolean;
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

    googleLogin: builder.mutation<AuthResponse, GoogleLoginPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.googleLogin,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'UserProfile', 'VendorProfile'],
    }),

    logout: builder.mutation<GenericMessageResponse, void>({
      query: () => ({
        url: API_ENDPOINTS.auth.logout,
        method: 'POST',
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

    initiateVendorRegister: builder.mutation<InitiateRegisterResponse, InitiateVendorRegisterPayload>({
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

    completeVendorRegister: builder.mutation<AuthResponse, CompleteVendorRegisterPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.completeVendorRegister,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'UserProfile', 'VendorProfile'],
    }),

    initiatePasswordReset: builder.mutation<InitiatePasswordResetResponse, InitiatePasswordResetPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.initiatePasswordReset,
        method: 'POST',
        body,
      }),
    }),

    verifyPasswordResetOtp: builder.mutation<VerifyPasswordResetOtpResponse, VerifyPasswordResetOtpPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.verifyPasswordResetOtp,
        method: 'POST',
        body,
      }),
    }),

    completePasswordReset: builder.mutation<GenericMessageResponse, CompletePasswordResetPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.completePasswordReset,
        method: 'POST',
        body,
      }),
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
  useGoogleLoginMutation,
  useLogoutMutation,
  useInitiateRegisterMutation,
  useVerifyOtpMutation,
  useCompleteRegisterMutation,
  useInitiateVendorRegisterMutation,
  useVerifyVendorOtpMutation,
  useCompleteVendorRegisterMutation,
  useInitiatePasswordResetMutation,
  useVerifyPasswordResetOtpMutation,
  useCompletePasswordResetMutation,
  useGetProfileQuery,
  useGetVendorProfileQuery,
} = authApi;
