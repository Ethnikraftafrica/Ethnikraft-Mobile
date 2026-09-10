import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '@/store/slices/authSlice';

// Secure Storage Keys (Encrypted on device)
const ACCESS_TOKEN_KEY = 'ethnikraft_access_token';
const REFRESH_TOKEN_KEY = 'ethnikraft_refresh_token';

// AsyncStorage Keys
const ACTIVE_ROLE_KEY = '@ethnikraft/active_role';
const USER_PROFILE_KEY = '@ethnikraft/user_profile';
const VENDOR_PROFILE_KEY = '@ethnikraft/vendor_profile';
const CURRENCY_KEY = '@ethnikraft/user_currency';

export const StorageService = {
  // === Secure Tokens ===
  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (e) {
      console.error('Error storing secure tokens', e);
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.error('Error clearing secure tokens', e);
    }
  },

  // === Active Dashboard Role ===
  async setActiveRole(role: UserRole): Promise<void> {
    try {
      await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
    } catch (e) {
      console.error('Error saving active role', e);
    }
  },

  async getActiveRole(): Promise<UserRole | null> {
    try {
      const role = await AsyncStorage.getItem(ACTIVE_ROLE_KEY);
      if (role === 'user' || role === 'vendor') {
        return role;
      }
      return null;
    } catch {
      return null;
    }
  },

  // === User & Vendor Profile Cache ===
  async setUserProfile(profile: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving user profile', e);
    }
  },

  async getUserProfile(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setVendorProfile(profile: any): Promise<void> {
    try {
      await AsyncStorage.setItem(VENDOR_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving vendor profile', e);
    }
  },

  async getVendorProfile(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(VENDOR_PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // === Currency Selection ===
  async setCurrency(code: string): Promise<void> {
    try {
      await AsyncStorage.setItem(CURRENCY_KEY, code);
    } catch (e) {
      console.error('Error saving user currency', e);
    }
  },

  async getCurrency(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CURRENCY_KEY);
    } catch {
      return null;
    }
  },

  async clearAll(): Promise<void> {
    await this.clearTokens();
    try {
      await AsyncStorage.multiRemove([
        ACTIVE_ROLE_KEY,
        USER_PROFILE_KEY,
        VENDOR_PROFILE_KEY,
      ]);
    } catch (e) {
      console.error('Error clearing AsyncStorage', e);
    }
  },
};
