import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StudioImage {
  id: string;
  uri: string;
  name?: string;
  size?: number;
  base64?: string;
}

export interface StudioDetails {
  title: string;
  material: string;
  color: string;
  size: string;
  quantity: string;
  quality: 'Standard' | 'Premium' | 'Luxury' | string;
  measurements: string;
  useProfileMeasurements: boolean;
  budget: string;
  deliveryWeeks: string;
  deliveryDate: string;
  notes: string;
}

export interface StudioVendor {
  id: string;
  name: string;
  logo: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  isAvailable: boolean;
  location?: string;
  specialty?: string;
}

export interface StudioBid {
  id: string;
  amount: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  createdAt: string;
  vendor: {
    id: string;
    businessName: string;
    profileImage?: string;
    rating?: number;
    reviewCount?: number;
    location?: string;
  };
}

export interface StudioCustomRequest {
  id: string;
  title: string;
  description: string;
  categoryType: string;
  materialType: string;
  colors: string[];
  size?: string;
  quantity: number;
  quality?: string;
  budget: number;
  timeline: string;
  status: 'OPEN' | 'CLOSED' | 'COMPLETED' | 'CANCELLED';
  inspirationImages: string[];
  measurements?: string;
  notes?: string;
  createdAt: string;
  bids: StudioBid[];
  selectedVendorIds?: string[];
}

interface StudioState {
  wizard: {
    currentStep: number;
    selectedCategory: string;
    images: StudioImage[];
    details: StudioDetails;
    vendorSelectionMode: 'BROADCAST' | 'DIRECT';
    selectedVendorIds: string[];
    isSubmitting: boolean;
  };
  hub: {
    activeFilter: 'ALL' | 'OPEN' | 'CLOSED' | 'COMPLETED' | 'CANCELLED';
    searchQuery: string;
    requests: StudioCustomRequest[];
    selectedRequestForDetail: StudioCustomRequest | null;
    selectedRequestForEdit: StudioCustomRequest | null;
    selectedRequestForDelete: StudioCustomRequest | null;
    isWizardOpen: boolean;
    isDetailModalOpen: boolean;
    isEditModalOpen: boolean;
    isDeleteModalOpen: boolean;
  };
}

const initialDetails: StudioDetails = {
  title: '',
  material: '',
  color: '',
  size: '',
  quantity: '1',
  quality: 'Standard',
  measurements: '',
  useProfileMeasurements: false,
  budget: '20000',
  deliveryWeeks: '2',
  deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  notes: '',
};

const initialRequests: StudioCustomRequest[] = [
  {
    id: 'req-001',
    title: 'Custom Aso-Oke Agbada with Gold Filigree Embroidery',
    description: 'A 3-piece luxury royal Agbada tailored with handwoven magenta and gold Aso-Oke fabric, floor-length cape, and gold bullion thread along neckline.',
    categoryType: 'WEARS',
    materialType: 'Aso Oke',
    colors: ['#800020', '#D4AF37', '#1E1E1E'],
    size: 'XL',
    quantity: 1,
    quality: 'Luxury',
    budget: 85000,
    timeline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'OPEN',
    inspirationImages: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80',
    ],
    measurements: 'Chest: 44in, Shoulder: 20in, Agbada Length: 56in, Trouser Waist: 36in, Length: 42in',
    notes: 'Please ensure high-thread count velvet lining on the neck cuffs.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    bids: [
      {
        id: 'bid-101',
        amount: 80000,
        status: 'PENDING',
        message: 'Master tailor with 18 years experience in royal Yoruba regalia. Delivery guaranteed in 14 days.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        vendor: {
          id: 'v-01',
          businessName: 'Adeola Royal Couturiers',
          profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          rating: 4.9,
          reviewCount: 48,
          location: 'Ikeja, Lagos',
        },
      },
      {
        id: 'bid-102',
        amount: 85000,
        status: 'PENDING',
        message: 'Handwoven loom fabric included. Pure metallic embroidery.',
        createdAt: new Date().toISOString(),
        vendor: {
          id: 'v-02',
          businessName: 'Oshodi Heritage Stitches',
          profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          rating: 4.8,
          reviewCount: 32,
          location: 'Victoria Island, Lagos',
        },
      },
    ],
  },
  {
    id: 'req-002',
    title: 'Full-Grain Leather Ankara Patchwork Tote Bag',
    description: 'Structured structured tote with brass hardware, vegetable-tanned Nigerian leather, and vintage wax-print geometric insets.',
    categoryType: 'BAGS',
    materialType: 'Leather',
    colors: ['#4A2E18', '#C46C27', '#E89C35'],
    size: 'Large',
    quantity: 1,
    quality: 'Premium',
    budget: 45000,
    timeline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'CLOSED',
    inspirationImages: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    ],
    measurements: 'Width: 38cm, Height: 30cm, Depth: 16cm',
    notes: 'Include padded 15-inch laptop compartment inside.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    bids: [
      {
        id: 'bid-201',
        amount: 45000,
        status: 'ACCEPTED',
        message: 'Work commenced. Premium Kano pull-up leather selected.',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        vendor: {
          id: 'v-03',
          businessName: 'Kano Tannery & Co.',
          profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
          rating: 4.95,
          reviewCount: 112,
          location: 'Kano / Lagos Depot',
        },
      },
    ],
  },
  {
    id: 'req-003',
    title: 'Handmade Beaded Coral Choker & Royal Wristlet',
    description: 'Tiered Nigerian Edo traditional royal wedding coral necklace with authentic barrel-cut red coral beads and carved brass clasp.',
    categoryType: 'ACCESSORIES',
    materialType: 'Natural Coral Beads',
    colors: ['#DC2626', '#EAB308'],
    size: 'Adjustable',
    quantity: 2,
    quality: 'Luxury',
    budget: 120000,
    timeline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'COMPLETED',
    inspirationImages: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    ],
    measurements: 'Neck: 16in with 3in chain extension, Wrist: 7.5in',
    notes: 'Certificate of authenticity for natural coral required.',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    bids: [],
  },
];

const initialState: StudioState = {
  wizard: {
    currentStep: 0,
    selectedCategory: 'WEARS',
    images: [],
    details: initialDetails,
    vendorSelectionMode: 'BROADCAST',
    selectedVendorIds: [],
    isSubmitting: false,
  },
  hub: {
    activeFilter: 'ALL',
    searchQuery: '',
    requests: initialRequests,
    selectedRequestForDetail: null,
    selectedRequestForEdit: null,
    selectedRequestForDelete: null,
    isWizardOpen: false,
    isDetailModalOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false,
  },
};

export const studioSlice = createSlice({
  name: 'studio',
  initialState,
  reducers: {
    // Wizard actions
    openWizard: (state, action: PayloadAction<string | undefined>) => {
      state.hub.isWizardOpen = true;
      state.wizard.currentStep = 0;
      if (action.payload) {
        state.wizard.selectedCategory = action.payload;
      }
    },
    closeWizard: (state) => {
      state.hub.isWizardOpen = false;
      state.wizard.currentStep = 0;
      state.wizard.images = [];
      state.wizard.details = initialDetails;
      state.wizard.selectedVendorIds = [];
      state.wizard.vendorSelectionMode = 'BROADCAST';
    },
    setWizardStep: (state, action: PayloadAction<number>) => {
      state.wizard.currentStep = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.wizard.selectedCategory = action.payload;
    },
    addWizardImage: (state, action: PayloadAction<StudioImage>) => {
      state.wizard.images.push(action.payload);
    },
    addWizardImages: (state, action: PayloadAction<StudioImage[]>) => {
      state.wizard.images = [...state.wizard.images, ...action.payload];
    },
    removeWizardImage: (state, action: PayloadAction<number>) => {
      state.wizard.images = state.wizard.images.filter((_, idx) => idx !== action.payload);
    },
    clearWizardImages: (state) => {
      state.wizard.images = [];
    },
    updateWizardDetails: (state, action: PayloadAction<Partial<StudioDetails>>) => {
      state.wizard.details = {
        ...state.wizard.details,
        ...action.payload,
      };
    },
    setVendorSelectionMode: (state, action: PayloadAction<'BROADCAST' | 'DIRECT'>) => {
      state.wizard.vendorSelectionMode = action.payload;
    },
    toggleWizardVendor: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.wizard.selectedVendorIds.includes(id)) {
        state.wizard.selectedVendorIds = state.wizard.selectedVendorIds.filter((vId) => vId !== id);
      } else {
        state.wizard.selectedVendorIds.push(id);
      }
    },
    selectAllWizardVendors: (state, action: PayloadAction<string[]>) => {
      state.wizard.selectedVendorIds = action.payload;
    },
    clearWizardVendors: (state) => {
      state.wizard.selectedVendorIds = [];
    },
    submitWizardRequest: (state) => {
      const { selectedCategory, images, details, selectedVendorIds } = state.wizard;
      const budgetNum = parseInt(details.budget.replace(/[^0-9]/g, '')) || 20000;
      const quantityNum = parseInt(details.quantity) || 1;

      const newRequest: StudioCustomRequest = {
        id: `req-${Date.now()}`,
        title: details.title.trim() || `Bespoke ${selectedCategory.toLowerCase()} commission`,
        description: details.notes.trim() || `Custom artisan project in ${selectedCategory.toLowerCase()} category.`,
        categoryType: selectedCategory,
        materialType: details.material || 'Artisan Choice',
        colors: details.color ? [details.color] : ['#C46C27'],
        size: details.size || undefined,
        quantity: quantityNum,
        quality: details.quality,
        budget: budgetNum,
        timeline: details.deliveryDate ? new Date(details.deliveryDate).toISOString() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'OPEN',
        inspirationImages: images.map((img) => img.uri),
        measurements: details.measurements,
        notes: details.notes,
        createdAt: new Date().toISOString(),
        bids: [],
        selectedVendorIds: selectedVendorIds.length > 0 ? selectedVendorIds : undefined,
      };

      state.hub.requests.unshift(newRequest);
      state.wizard.currentStep = 4; // Move to celebration step
    },

    // Hub actions
    setActiveFilter: (state, action: PayloadAction<'ALL' | 'OPEN' | 'CLOSED' | 'COMPLETED' | 'CANCELLED'>) => {
      state.hub.activeFilter = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.hub.searchQuery = action.payload;
    },
    openDetailModal: (state, action: PayloadAction<StudioCustomRequest>) => {
      state.hub.selectedRequestForDetail = action.payload;
      state.hub.isDetailModalOpen = true;
    },
    closeDetailModal: (state) => {
      state.hub.isDetailModalOpen = false;
      state.hub.selectedRequestForDetail = null;
    },
    openEditModal: (state, action: PayloadAction<StudioCustomRequest>) => {
      state.hub.selectedRequestForEdit = action.payload;
      state.hub.isEditModalOpen = true;
    },
    closeEditModal: (state) => {
      state.hub.isEditModalOpen = false;
      state.hub.selectedRequestForEdit = null;
    },
    saveEditRequest: (
      state,
      action: PayloadAction<{ id: string; budget: number; timeline: string }>
    ) => {
      const { id, budget, timeline } = action.payload;
      const target = state.hub.requests.find((r) => r.id === id);
      if (target) {
        target.budget = budget;
        target.timeline = timeline;
      }
      if (state.hub.selectedRequestForDetail?.id === id) {
        state.hub.selectedRequestForDetail.budget = budget;
        state.hub.selectedRequestForDetail.timeline = timeline;
      }
      state.hub.isEditModalOpen = false;
      state.hub.selectedRequestForEdit = null;
    },
    openDeleteModal: (state, action: PayloadAction<StudioCustomRequest>) => {
      state.hub.selectedRequestForDelete = action.payload;
      state.hub.isDeleteModalOpen = true;
    },
    closeDeleteModal: (state) => {
      state.hub.isDeleteModalOpen = false;
      state.hub.selectedRequestForDelete = null;
    },
    confirmDeleteRequest: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.hub.requests = state.hub.requests.filter((r) => r.id !== id);
      if (state.hub.selectedRequestForDetail?.id === id) {
        state.hub.selectedRequestForDetail = null;
        state.hub.isDetailModalOpen = false;
      }
      state.hub.isDeleteModalOpen = false;
      state.hub.selectedRequestForDelete = null;
    },
  },
});

export const {
  openWizard,
  closeWizard,
  setWizardStep,
  setSelectedCategory,
  addWizardImage,
  addWizardImages,
  removeWizardImage,
  clearWizardImages,
  updateWizardDetails,
  setVendorSelectionMode,
  toggleWizardVendor,
  selectAllWizardVendors,
  clearWizardVendors,
  submitWizardRequest,
  setActiveFilter,
  setSearchQuery,
  openDetailModal,
  closeDetailModal,
  openEditModal,
  closeEditModal,
  saveEditRequest,
  openDeleteModal,
  closeDeleteModal,
  confirmDeleteRequest,
} = studioSlice.actions;

export default studioSlice.reducer;
