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
  cardType: 'mastercard' | 'visa' | 'verve';
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

export interface ProfileState {
  profile: UserProfileDetails;
  savedAddresses: SavedAddress[];
  savedCards: SavedPaymentCard[];
  measurements: CustomMeasurements;
  preferences: ProfilePreferences;
  favoritesCount: number;
  ordersCount: number;
  recentlyViewedCount: number;
  recentlySearchedCount: number;
  profileCompletionPercentage: number;
}

const initialProfile: UserProfileDetails = {
  firstName: 'Kwame',
  lastName: 'Mensah',
  profileName: 'KwameArt',
  email: 'kwame@artisan.com',
  phoneNumber: '+2348012345678',
  address: '14 Admiralty Way, Lekki Phase 1',
  city: 'Lagos',
  country: 'Nigeria',
  gender: 'MALE',
  birthDate: '1992-05-18',
};

const initialAddresses: SavedAddress[] = [
  {
    id: 'addr_1',
    addressType: 'HOME',
    street: '14 Admiralty Way, Lekki Phase 1',
    buildingName: 'Palm Terraces',
    aptNoOrCompany: 'Suite 4B',
    floor: '2nd Floor',
    phoneNumber: '+2348012345678',
    additionalDirections: 'Opposite Ebeano Supermarket',
    additionalLabel: 'Primary Residence',
    isDefault: true,
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
  },
  {
    id: 'addr_2',
    addressType: 'OFFICE',
    street: '72 Campbell Street, Victoria Island',
    buildingName: 'Heritage Arts Pavilion',
    aptNoOrCompany: 'Studio 12',
    floor: '3rd Floor',
    phoneNumber: '+2348098765432',
    additionalDirections: 'Beside Silverbird Galleria',
    additionalLabel: 'Creative Workshop',
    isDefault: false,
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
  },
];

const initialMeasurements: CustomMeasurements = {
  unit: 'cm',
  shoulder: '48',
  bustOrChest: '102',
  topLength: '76',
  sleeveLength: '64',
  waist: '86',
  hips: '100',
  pantLength: '104',
  ankleFit: '38',
  shoeSize: '43',
  sandalsSize: '43',
  ringSize: '9',
  braceletSize: '20',
  personalInitials: 'KM',
  additionalNotes: 'Prefers relaxed fit on linen tunics with traditional embroidery.',
};

const initialCards: SavedPaymentCard[] = [
  {
    id: 'card_1',
    cardType: 'mastercard',
    bankName: 'Access Bank',
    cardNumberMasked: '5399 83•• •••• 4242',
    last4: '4242',
    expiryMonth: '08',
    expiryYear: '28',
    cardholderName: 'KWAME MENSAH',
    isDefault: true,
  },
  {
    id: 'card_2',
    cardType: 'visa',
    bankName: 'GTBank',
    cardNumberMasked: '4242 42•• •••• 1099',
    last4: '1099',
    expiryMonth: '11',
    expiryYear: '27',
    cardholderName: 'KWAME MENSAH',
    isDefault: false,
  },
];

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
  savedAddresses: initialAddresses,
  savedCards: initialCards,
  measurements: initialMeasurements,
  preferences: {
    pushNotifications: true,
    orderUpdates: true,
    promotions: false,
    newsletter: true,
    theme: 'system',
  },
  favoritesCount: 12,
  ordersCount: 4,
  recentlyViewedCount: 18,
  recentlySearchedCount: 6,
  profileCompletionPercentage: 75,
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
  },
});

export const {
  syncUserFromAuth,
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
} = profileSlice.actions;

export default profileSlice.reducer;
