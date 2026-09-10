// Base API URL with environment variable support
// Default is set to the live Ethnikraft backend on Railway
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://ethnikraft-be-production.up.railway.app/api/v1';

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    googleLogin: '/auth/google-login',
    logout: '/auth/logout',
    profile: '/auth/profile',
    vendorProfile: '/auth/vendor/profile',
    
    // Customer Registration Flow
    initiateRegister: '/auth/initiate-registration',
    verifyOtp: '/auth/verify-otp',
    completeRegister: '/auth/complete-registration',
    
    // Vendor Registration Flow
    initiateVendorRegister: '/auth/initiate-vendor-registration',
    verifyVendorOtp: '/auth/verify-vendor-otp',
    completeVendorRegister: '/auth/complete-vendor-registration',
    
    // Password Reset
    initiatePasswordReset: '/auth/password-reset/initiate',
    verifyPasswordResetOtp: '/auth/password-reset/verify-otp',
    completePasswordReset: '/auth/password-reset/complete',
  },

  // Products & Collections
  products: {
    list: '/products',
    details: (id: string) => `/products/${id}`,
    collections: {
      bestsellers: '/products/collections/bestsellers',
      trending: '/products/collections/trending',
      deals: '/products/collections/deals',
      newArrivals: '/products/collections/new-arrivals',
      clearance: '/products/collections/clearance',
      landing: '/products/collections/landing',
      topPicks: '/products/collections/top-picks-week',
      paintings: '/products/collections/african-paintings',
      bestsellersMenswear: '/products/collections/bestsellers-menswear',
      bestsellersAccessories: '/products/collections/bestsellers-accessories',
      bestsellersDecorations: '/products/collections/bestsellers-decorations',
      inspiredByCulture: '/products/collections/inspired-by-culture',
    },
    artisanSpotlight: {
      heritageMasters: '/products/artisan-spotlight/heritage-masters',
      womenInCraft: '/products/artisan-spotlight/women-in-craft',
      mixedMediaInnovators: '/products/artisan-spotlight/mixed-media-innovators',
      featuredCreators: '/products/artisan-spotlight/featured-creators',
    },
    byOccasion: (tags: string) => `/products/by-occasion/${encodeURIComponent(tags)}`,
    byArtStyle: (tags: string) => `/products/by-art-style/${encodeURIComponent(tags)}`,
    homeFilters: '/products/filters/metadata',
    categories: '/product-categories',
  },

  // Reviews
  reviews: {
    list: '/reviews',
    details: (id: string) => `/reviews/${id}`,
    vendorStats: (vendorId: string) => `/reviews/vendor/${vendorId}/stats`,
  },

  // Orders
  orders: {
    customerOrders: '/orders',
    vendorOrders: '/orders/vendor',
    details: (id: string) => `/orders/${id}`,
    updateStatus: (id: string) => `/orders/${id}/status`,
  },

  // Custom Studio
  studio: {
    requests: '/custom-requests',
    vendorRequests: '/vendors/product-requests',
    details: (id: string) => `/custom-requests/${id}`,
    submitBid: (id: string) => `/custom-requests/${id}/bids`,
  },

  // Vendor Ops & Payouts
  vendor: {
    myProducts: '/products/my-products',
    createProduct: '/products',
    updateProduct: (id: string) => `/products/${id}`,
    payoutSummary: '/vendors/payouts/summary',
    requestPayout: '/vendors/payouts/request',
  },
} as const;
