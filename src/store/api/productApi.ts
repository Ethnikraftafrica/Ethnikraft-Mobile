import { baseApi } from './baseApi';
import { API_ENDPOINTS } from '@/constants/api';

export type ProductCategoryType =
  | 'ALL'
  | 'WEARS'
  | 'SHOES'
  | 'BAGS'
  | 'ACCESSORIES'
  | 'CRAFTS'
  | 'PAINTINGS'
  | 'ANTIQUES';

export interface ProductVendor {
  id: string;
  businessName: string;
  rating: number;
  businessLogo?: string;
}

export interface ProductDetails {
  size?: string;
  color?: string[];
  sizeOptions?: string[];
  colorOptions?: string[];
  materialList?: string[];
  subCategory?: string;
  materialType?: string;
  craftType?: string;
  accessoryType?: string;
  shoeType?: string;
  bagType?: string;
  artworkType?: string;
  [key: string]: any;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string | number;
  basePrice?: string | number;
  stockQuantity: number;
  condition: string;
  productCategory: string;
  mainImage: string;
  imageList: string[];
  isCustomizable: boolean;
  isRequestable: boolean;
  requiresCustomization?: boolean;
  estimatedProductionDays?: number;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isOnDeals?: boolean;
  isClearanceSale?: boolean;
  isTrending?: boolean;
  isHeritagemaster?: boolean;
  isWomenInCraft?: boolean;
  isMixedMediaInnovator?: boolean;
  isFeaturedCreator?: boolean;
  details?: ProductDetails;
  vendor?: ProductVendor;
  vendorId?: string;
  rating?: number;
  reviewCount?: number;
  dimensions?: string;
  occasionTags?: string[];
  artStyleTags?: string[];
  tags?: any[];
  height?: number | null;
  length?: number | null;
  width?: number | null;
  weight?: number | null;
  weightUnit?: string;
  hasVariants?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerifiedPurchase?: boolean;
  helpfulCount?: number;
  reviewer?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  request?: {
    size?: string;
    color?: string;
  };
}

export interface ProductReviewsResponse {
  success: boolean;
  data?: {
    reviews: ProductReview[];
    total: number;
    averageRating: number;
  };
  reviews?: ProductReview[];
  total?: number;
  averageRating?: number;
}

export interface ProductQueryParams {
  skip?: number;
  take?: number;
  search?: string;
  productCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  vendorId?: string;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isOnDeals?: boolean;
  isClearanceSale?: boolean;
  isHeritagemaster?: boolean;
  isWomenInCraft?: boolean;
  isMixedMediaInnovator?: boolean;
  isFeaturedCreator?: boolean;
}

export interface ProductListResponse {
  success: boolean;
  message?: string;
  data: {
    products: Product[];
    total: number;
    skip: number;
    take: number;
  };
}

export interface SingleProductResponse {
  success: boolean;
  message?: string;
  product?: Product;
  data?: Product;
}

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ProductListResponse, ProductQueryParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              searchParams.append(key, String(value));
            }
          });
        }
        const queryString = searchParams.toString();
        return `${API_ENDPOINTS.products.list}${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result) =>
        result?.data?.products
          ? [
              ...result.data.products.map(({ id }) => ({ type: 'Products' as const, id })),
              { type: 'Products', id: 'LIST' },
            ]
          : [{ type: 'Products', id: 'LIST' }],
    }),

    getProductById: builder.query<Product, string>({
      query: (id) => API_ENDPOINTS.products.details(id),
      transformResponse: (response: any) => {
        // Backend returns either { success: true, product: { ... } } or { data: { ... } }
        return response?.product || response?.data || response;
      },
      providesTags: (_result, _error, id) => [{ type: 'Products', id }],
    }),

    getProductCategories: builder.query<any, void>({
      query: () => API_ENDPOINTS.products.categories,
      providesTags: [{ type: 'Categories', id: 'LIST' }],
    }),

    getProductReviews: builder.query<{ reviews: ProductReview[]; total: number; averageRating: number }, { productId: string; limit?: number }>({
      query: ({ productId, limit = 10 }) => `${API_ENDPOINTS.reviews.list}?productId=${productId}&limit=${limit}`,
      transformResponse: (response: any) => {
        const data = response?.data || response;
        const reviews = data?.reviews || (Array.isArray(data) ? data : []);
        const total = data?.total ?? reviews.length;
        const averageRating = data?.averageRating ?? 0;
        return { reviews, total, averageRating };
      },
      providesTags: (_result, _error, { productId }) => [{ type: 'Reviews' as const, id: productId }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductCategoriesQuery,
  useGetProductReviewsQuery,
} = productApi;
