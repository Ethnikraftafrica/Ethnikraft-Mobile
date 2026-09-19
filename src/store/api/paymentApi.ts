import { baseApi } from './baseApi';
import { API_ENDPOINTS } from '@/constants/api';

export interface VerifyPaymentResult {
  orderIds?: string[];
  status: 'successful' | 'completed' | 'pending' | 'failed' | 'cancelled';
  transactionId?: string;
  amount?: number;
  currency?: string;
  message?: string;
  paymentMethod?: string;
  paidAt?: string;
}

export interface PaymentStatusData {
  id: string;
  status: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  createdAt: string;
  order?: {
    id: string;
    amount: number;
  };
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface PaymentHistoryResponse {
  transactions: PaymentHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Verify payment with Flutterwave reference and settle order
    verifyPayment: builder.mutation<VerifyPaymentResult, string>({
      query: (txRef: string) => ({
        url: API_ENDPOINTS.payments.verify(txRef),
        method: 'POST',
      }),
      transformResponse: (response: any): VerifyPaymentResult => {
        const payload = response?.data || response;
        const statusStr = (payload?.status || response?.status || 'successful').toLowerCase();
        
        const normalizedStatus =
          ['successful', 'completed', 'already_processed', 'already-processed', 'reprocessed'].includes(statusStr)
            ? 'successful'
            : statusStr === 'cancelled'
            ? 'cancelled'
            : statusStr === 'pending'
            ? 'pending'
            : 'failed';

        return {
          orderIds: Array.isArray(payload?.orderIds) ? payload.orderIds : payload?.orderId ? [payload.orderId] : [],
          status: normalizedStatus,
          transactionId: payload?.transactionId || payload?.id || '',
          amount: typeof payload?.amount === 'number' ? payload.amount : undefined,
          currency: payload?.currency || 'NGN',
          message: response?.message || payload?.message || 'Payment verified successfully',
          paymentMethod: payload?.paymentMethod || 'FLUTTERWAVE',
          paidAt: payload?.paidAt || new Date().toISOString(),
        };
      },
      invalidatesTags: [
        { type: 'Orders', id: 'LIST' },
        { type: 'Cart', id: 'LIST' },
        { type: 'Payments' },
      ],
    }),

    // 2. Query status of specific transaction
    getPaymentStatus: builder.query<PaymentStatusData, string>({
      query: (transactionId: string) => API_ENDPOINTS.payments.status(transactionId),
      transformResponse: (response: any): PaymentStatusData => {
        return response?.data || response;
      },
      providesTags: (_result, _error, id) => [{ type: 'Payments', id }],
    }),

    // 3. User payment history
    getPaymentHistory: builder.query<PaymentHistoryResponse, { page?: number; limit?: number } | void>({
      query: (params) => {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        return `${API_ENDPOINTS.payments.history}?page=${page}&limit=${limit}`;
      },
      transformResponse: (response: any): PaymentHistoryResponse => {
        const data = response?.data || response;
        return {
          transactions: Array.isArray(data?.transactions) ? data.transactions : [],
          total: data?.total || 0,
          page: data?.page || 1,
          limit: data?.limit || 20,
          totalPages: data?.totalPages || 1,
        };
      },
      providesTags: [{ type: 'Payments', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useVerifyPaymentMutation,
  useGetPaymentStatusQuery,
  useGetPaymentHistoryQuery,
} = paymentApi;
