import { SavedAddress } from '@/store/slices/profileSlice';

export type CheckoutStep = 'address' | 'shipping' | 'payment' | 'success';

export interface ShippingQuoteOption {
  id: string;
  provider: 'AAJ' | 'DHL' | 'FEDEX' | 'ETHNIKRAFT';
  serviceName: string;
  shippingFee: number;
  tax: number;
  total: number;
  currency: string;
  estimatedDays: number;
  estimatedDate: string;
  isRecommended?: boolean;
}

export type PaymentOptionType = 'card' | 'bank_transfer' | 'ussd';

export interface CheckoutAddressForm {
  fullName: string;
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  country: string;
  additionalDirections?: string;
  addressType: 'HOME' | 'OFFICE' | 'OTHER';
}

export interface CheckoutSummaryBreakdown {
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  itemCount: number;
}
