import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type GenderType = 'MALE' | 'FEMALE' | 'OTHER';
export type AddressType = 'HOME' | 'OFFICE' | 'OTHER';
export type AppearanceTheme = 'system' | 'light' | 'dark';

export interface SavedAddress {
  id: string;
  addressType: AddressType;
  street: string;
  buildingName?: string;
  aptNoOrCompany?: string;
  floor?: string;
  additionalDirections?: string;
  phoneNumber: string;
  additionalLabel?: string;
  isDefault: boolean;
  city?: string;
  state?: string;
  country?: string;
}

export interface CustomMeasurements {
  unit: 'cm' | 'inches';
  // Top
  shoulder?: string;
  bustOrChest?: string;
  topLength?: string;
  sleeveLength?: string;
  // Pants / Bottoms
  waist?: string;
  hips?: string;
  pantLength?: string;
  ankleFit?: string;
  // Footwear & Accessories
  shoeSize?: string;
  sandalsSize?: string;
  ringSize?: string;
  braceletSize?: string;
  personalInitials?: string;
  additionalNotes?: string;
}

export interface UserProfileDetails {
  firstName: string;
  lastName: string;
  profileName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
  gender: GenderType | '';
  birthDate: string;
  avatarUrl?: string;
}

export interface SavedPaymentCard {
  id: string;
  cardType: 'mastercard' | 'visa' | 'verve' | 'amex';
  bankName: string;
  cardNumberMasked: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isDefault: boolean;
}

export interface ProfilePreferences {
  pushNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
  theme: AppearanceTheme;
}

export interface RecentlyViewedItem {
  id: string;
  productId: string;
  name: string;
  category: string;
  price: number | string;
  image?: string;
  viewedAt: string;
  artisan?: string;
}

export interface ProfileState {
  profile: UserProfileDetails;
  savedAddresses: SavedAddress[];
  savedCards: SavedPaymentCard[];
  measurements: CustomMeasurements;
  preferences: ProfilePreferences;
  favoritesCount: number;
  ordersCount: number;
  recentlyViewed: RecentlyViewedItem[];
  recentlyViewedCount: number;
  recentlySearchedCount: number;
  profileCompletionPercentage: number;
}

const initialProfile: UserProfileDetails = {
  firstName: '',
  lastName: '',
  profileName: '',
  email: '',
  phoneNumber: '',
  address: '',
  city: '',
  country: '',
  gender: '',
  birthDate: '',
  avatarUrl: undefined,
};

const initialMeasurements: CustomMeasurements = {
  unit: 'cm',
};

const calculateCompletion = (profile: UserProfileDetails, measurements: CustomMeasurements, addresses: SavedAddress[]) => {
  let score = 0;
  let total = 6;

  if (profile.firstName && profile.lastName) score += 1;
  if (profile.phoneNumber) score += 1;
  if (profile.city && profile.country) score += 1;
  if (addresses.length > 0) score += 1;
  if (measurements.shoulder || measurements.bustOrChest || measurements.waist) score += 1;
  if (measurements.shoeSize || measurements.personalInitials) score += 1;

  return Math.round((score / total) * 100);
};

const initialState: ProfileState = {
  profile: initialProfile,
  savedAddresses: [],
  savedCards: [],
  measurements: initialMeasurements,
  preferences: {
    pushNotifications: true,
    orderUpdates: true,
    promotions: false,
    newsletter: true,
    theme: 'system',
  },
  favoritesCount: 0,
  ordersCount: 0,
  recentlyViewed: [],
  recentlyViewedCount: 0,
  recentlySearchedCount: 0,
  profileCompletionPercentage: 0,
};

export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    syncUserFromAuth: (
      state,
      action: PayloadAction<{
        firstName?: string;
        lastName?: string;
        email?: string;
        phoneNumber?: string;
      }>
    ) => {
      if (action.payload.firstName) state.profile.firstName = action.payload.firstName;
      if (action.payload.lastName) state.profile.lastName = action.payload.lastName;
      if (action.payload.email) state.profile.email = action.payload.email;
      if (action.payload.phoneNumber) state.profile.phoneNumber = action.payload.phoneNumber;
      state.profileCompletionPercentage = calculateCompletion(state.profile, state.measurements, state.savedAddresses);
    },

    syncFromFullProfile: (state, action: PayloadAction<any>) => {
      const p = action.payload;
      if (!p) return;
      if (p.firstName) state.profile.firstName = p.firstName;
      if (p.lastName) state.profile.lastName = p.lastName;
      if (p.email) state.profile.email = p.email;
      if (p.phoneNumber) state.profile.phoneNumber = p.phoneNumber;
      if (p.profileName) state.profile.profileName = p.profileName;
      if (p.address) state.profile.address = p.address;
      if (p.city) state.profile.city = p.city;
      if (p.country) state.profile.country = p.country;
      if (p.gender) state.profile.gender = p.gender;
      if (p.birthDate) state.profile.birthDate = p.birthDate;
      if (p.notificationsEnabled !== undefined) {
        state.preferences.pushNotifications = p.notificationsEnabled;
        state.preferences.orderUpdates = p.notificationsEnabled;
      }
      if (Array.isArray(p.savedAddresses) && p.savedAddresses.length > 0) {
        state.savedAddresses = p.savedAddresses;
      }
      state.profileCompletionPercentage = calculateCompletion(state.profile, state.measurements, state.savedAddresses);
    },

    syncAddresses: (state, action: PayloadAction<SavedAddress[]>) => {
      if (Array.isArray(action.payload)) {
        state.savedAddresses = action.payload;
        state.profileCompletionPercentage = calculateCompletion(state.profile, state.measurements, state.savedAddresses);
      }
    },

    syncFavoritesCount: (state, action: PayloadAction<number>) => {
      state.favoritesCount = action.payload;
    },

    syncOrdersCount: (state, action: PayloadAction<number>) => {
      state.ordersCount = action.payload;
    },

    updatePersonalDetails: (state, action: PayloadAction<Partial<UserProfileDetails>>) => {
      state.profile = { ...state.profile, ...action.payload };
      state.profileCompletionPercentage = calculateCompletion(state.profile, state.measurements, state.savedAddresses);
    },

    addSavedAddress: (state, action: PayloadAction<Omit<SavedAddress, 'id'>>) => {
      const newId = `addr_${Date.now()}`;
      const newAddress: SavedAddress = {
        ...action.payload,
        id: newId,
      };

      if (newAddress.isDefault || state.savedAddresses.length === 0) {
        state.savedAddresses.forEach((addr) => (addr.isDefault = false));
        newAddress.isDefault = true;
      }

      state.savedAddresses.unshift(newAddress);
      state.profileCompletionPercentage = calculateCompletion(state.profile, state.measurements, state.savedAddresses);
    },

    updateSavedAddress: (state, action: PayloadAction<SavedAddress>) => {
      const index = state.savedAddresses.findIndex((addr) => addr.id === action.payload.id);
      if (index !== -1) {
        if (action.payload.isDefault) {
          state.savedAddresses.forEach((addr) => (addr.isDefault = false));
        }
        state.savedAddresses[index] = action.payload;
      }
    },

    deleteSavedAddress: (state, action: PayloadAction<string>) => {
      const wasDefault = state.savedAddresses.find((addr) => addr.id === action.payload)?.isDefault;
      state.savedAddresses = state.savedAddresses.filter((addr) => addr.id !== action.payload);
      if (wasDefault && state.savedAddresses.length > 0) {
        state.savedAddresses[0].isDefault = true;
      }
      state.profileCompletionPercentage = calculateCompletion(state.profile, state.measurements, state.savedAddresses);
    },

    setDefaultAddress: (state, action: PayloadAction<string>) => {
      state.savedAddresses.forEach((addr) => {
        addr.isDefault = addr.id === action.payload;
      });
    },

    addPaymentCard: (state, action: PayloadAction<Omit<SavedPaymentCard, 'id'>>) => {
      const newId = `card_${Date.now()}`;
      const newCard: SavedPaymentCard = {
        ...action.payload,
        id: newId,
      };
      if (newCard.isDefault || state.savedCards.length === 0) {
        state.savedCards.forEach((c) => (c.isDefault = false));
        newCard.isDefault = true;
      }
      state.savedCards.unshift(newCard);
    },

    deletePaymentCard: (state, action: PayloadAction<string>) => {
      const wasDefault = state.savedCards.find((c) => c.id === action.payload)?.isDefault;
      state.savedCards = state.savedCards.filter((c) => c.id !== action.payload);
      if (wasDefault && state.savedCards.length > 0) {
        state.savedCards[0].isDefault = true;
      }
    },

    setDefaultPaymentCard: (state, action: PayloadAction<string>) => {
      state.savedCards.forEach((c) => {
        c.isDefault = c.id === action.payload;
      });
    },

    updateMeasurements: (state, action: PayloadAction<Partial<CustomMeasurements>>) => {
      state.measurements = { ...state.measurements, ...action.payload };
      state.profileCompletionPercentage = calculateCompletion(state.profile, state.measurements, state.savedAddresses);
    },

    updatePreferences: (state, action: PayloadAction<Partial<ProfilePreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    setTheme: (state, action: PayloadAction<AppearanceTheme>) => {
      state.preferences.theme = action.payload;
    },

    addRecentlyViewed: (
      state,
      action: PayloadAction<Omit<RecentlyViewedItem, 'id' | 'viewedAt'>>
    ) => {
      const existingIndex = state.recentlyViewed.findIndex(
        (item) => item.productId === action.payload.productId
      );
      if (existingIndex !== -1) {
        state.recentlyViewed.splice(existingIndex, 1);
      }
      const newItem: RecentlyViewedItem = {
        ...action.payload,
        id: `rec_${Date.now()}`,
        viewedAt: 'Just now',
      };
      state.recentlyViewed.unshift(newItem);
      if (state.recentlyViewed.length > 30) {
        state.recentlyViewed.pop();
      }
      state.recentlyViewedCount = state.recentlyViewed.length;
    },

    clearRecentlyViewed: (state) => {
      state.recentlyViewed = [];
      state.recentlyViewedCount = 0;
    },
  },
});

export const {
  syncUserFromAuth,
  syncFromFullProfile,
  syncAddresses,
  syncFavoritesCount,
  syncOrdersCount,
  updatePersonalDetails,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  setDefaultAddress,
  addPaymentCard,
  deletePaymentCard,
  setDefaultPaymentCard,
  updateMeasurements,
  updatePreferences,
  setTheme,
  addRecentlyViewed,
  clearRecentlyViewed,
} = profileSlice.actions;

export default profileSlice.reducer;
