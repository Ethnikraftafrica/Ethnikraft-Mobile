import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, VendorProfile, AuthResponse, AuthTokens } from '../api/authApi';
import { StorageService } from '@/services/storage.service';

export type UserRole = 'user' | 'vendor';

interface AuthState {
  activeRole: UserRole;
  accessToken: string | null;
  user: UserProfile | null;
  vendor: VendorProfile | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  hasVendorAccount: boolean;
}

const initialState: AuthState = {
  activeRole: 'user',
  accessToken: null,
  user: null,
  vendor: null,
  isAuthenticated: false,
  isHydrated: false,
  hasVendorAccount: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRole: (state, action: PayloadAction<UserRole>) => {
      state.activeRole = action.payload;
      // Non-blocking fire-and-forget storage write
      StorageService.setActiveRole(action.payload).catch((e) =>
        console.warn('Storage active role save failed', e)
      );
    },
    toggleRole: (state) => {
      const nextRole: UserRole = state.activeRole === 'user' ? 'vendor' : 'user';
      state.activeRole = nextRole;
      StorageService.setActiveRole(nextRole).catch((e) =>
        console.warn('Storage active role toggle save failed', e)
      );
    },
    setAuthSuccess: (state, action: PayloadAction<AuthResponse>) => {
      const { user, tokens, vendor } = action.payload;
      state.accessToken = tokens.access_token;
      state.user = user;
      state.vendor = vendor || null;
      state.isAuthenticated = true;
      state.hasVendorAccount = user.role === 'VENDOR' || !!vendor;

      if (state.hasVendorAccount && !state.activeRole) {
        state.activeRole = 'vendor';
      }

      // Non-blocking asynchronous storage persistence to prevent any frame drops/lag
      StorageService.setTokens(tokens.access_token, tokens.refresh_token).catch((e) =>
        console.warn('Failed to persist secure tokens', e)
      );
      StorageService.setUserProfile(user).catch((e) =>
        console.warn('Failed to persist user profile', e)
      );
      if (vendor) {
        StorageService.setVendorProfile(vendor).catch((e) =>
          console.warn('Failed to persist vendor profile', e)
        );
      }
      StorageService.setActiveRole(state.activeRole).catch((e) =>
        console.warn('Failed to persist active role', e)
      );
    },
    updateTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.accessToken = action.payload.access_token;
      StorageService.setTokens(
        action.payload.access_token,
        action.payload.refresh_token
      ).catch((e) => console.warn('Failed to update tokens in storage', e));
    },
    hydrateSession: (
      state,
      action: PayloadAction<{
        token: string | null;
        user: UserProfile | null;
        vendor: VendorProfile | null;
        activeRole: UserRole | null;
      }>
    ) => {
      state.accessToken = action.payload.token;
      state.user = action.payload.user;
      state.vendor = action.payload.vendor;
      state.isAuthenticated = !!action.payload.token;
      state.hasVendorAccount =
        action.payload.user?.role === 'VENDOR' || !!action.payload.vendor;
      if (action.payload.activeRole) {
        state.activeRole = action.payload.activeRole;
      }
      state.isHydrated = true;
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.vendor = null;
      state.isAuthenticated = false;
      state.hasVendorAccount = false;
      state.activeRole = 'user';
      StorageService.clearAll().catch((e) =>
        console.warn('Failed to clear storage on logout', e)
      );
    },
  },
});

export const {
  setRole,
  toggleRole,
  setAuthSuccess,
  updateTokens,
  hydrateSession,
  logout,
} = authSlice.actions;
export default authSlice.reducer;
