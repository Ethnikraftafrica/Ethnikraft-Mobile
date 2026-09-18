export interface CartItemVariant {
  id: string;
  name: string;
  size?: string;
  color?: string;
  sku?: string;
}

export interface CartItemCustomization {
  schemaVersion?: string;
  category?: string;
  garmentType?: string;
  measurements?: Record<string, string | number>;
  specialInstructions?: string;
  referenceImages?: string[];
  fabricColor?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  maxStock: number;
  artisanName: string;
  artisanLocation?: string;
  category: string;
  isRequestable?: boolean;
  selectedVariant?: CartItemVariant;
  customization?: CartItemCustomization;
  createdAt?: string;
}

export interface CartSummaryData {
  subtotal: number;
  itemCount: number;
  estimatedTax: number;
  shippingEstimate: number;
  total: number;
}
