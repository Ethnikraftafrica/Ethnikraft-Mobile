import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, VendorProfile, AuthResponse } from '../api/authApi';
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
      StorageService.setActiveRole(action.payload);
    },
    toggleRole: (state) => {
      const nextRole: UserRole = state.activeRole === 'user' ? 'vendor' : 'user';
      state.activeRole = nextRole;
      StorageService.setActiveRole(nextRole);
    },
    setAuthSuccess: (state, action: PayloadAction<AuthResponse>) => {
      const { user, tokens, vendor } = action.payload;
      state.accessToken = tokens.access_token;
      state.user = user;
      state.vendor = vendor || null;
      state.isAuthenticated = true;
      state.hasVendorAccount = user.role === 'VENDOR' || !!vendor;

      // If user is a vendor, default activeRole to vendor if not previously chosen
      if (state.hasVendorAccount && !state.activeRole) {
        state.activeRole = 'vendor';
      }

      // Persist to encrypted / async storage
      StorageService.setTokens(tokens.access_token, tokens.refresh_token);
      StorageService.setUserProfile(user);
      if (vendor) {
        StorageService.setVendorProfile(vendor);
      }
      StorageService.setActiveRole(state.activeRole);
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
      StorageService.clearAll();
    },
  },
});

export const { setRole, toggleRole, setAuthSuccess, hydrateSession, logout } =
  authSlice.actions;
export default authSlice.reducer;
