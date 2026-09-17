import { BackendOrder } from '@/store/api/ordersApi';

export type OrderTopLevelTab = 'ORDERS' | 'REQUESTS';

export type OrderStatusFilter =
  | 'ALL'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderStatusStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
  dot: string;
}

export const ORDER_STATUS_CONFIG: Record<string, OrderStatusStyle> = {
  PENDING: {
    label: 'Pending Payment',
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A',
    icon: 'time-outline',
    dot: '#F59E0B',
  },
  PAYMENT_PENDING: {
    label: 'Payment Pending',
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A',
    icon: 'time-outline',
    dot: '#F59E0B',
  },
  OPEN: {
    label: 'Open for Bids',
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A',
    icon: 'hourglass-outline',
    dot: '#F59E0B',
  },
  BIDDING: {
    label: 'Bids Received',
    bg: '#EDE9FE',
    text: '#5B21B6',
    border: '#DDD6FE',
    icon: 'people-outline',
    dot: '#8B5CF6',
  },
  SELECTED: {
    label: 'Artisan Selected',
    bg: '#EFF6FF',
    text: '#1E40AF',
    border: '#BFDBFE',
    icon: 'checkmark-circle-outline',
    dot: '#3B82F6',
  },
  CONFIRMED: {
    label: 'Order Confirmed',
    bg: '#EFF6FF',
    text: '#1E40AF',
    border: '#BFDBFE',
    icon: 'checkmark-circle-outline',
    dot: '#3B82F6',
  },
  IN_PROGRESS: {
    label: 'In Crafting',
    bg: '#EDE9FE',
    text: '#5B21B6',
    border: '#DDD6FE',
    icon: 'hammer-outline',
    dot: '#8B5CF6',
  },
  PRODUCTION_PENDING: {
    label: 'Production Queue',
    bg: '#EDE9FE',
    text: '#5B21B6',
    border: '#DDD6FE',
    icon: 'hourglass-outline',
    dot: '#8B5CF6',
  },
  SHIPPED: {
    label: 'In Transit',
    bg: '#E0F2FE',
    text: '#0369A1',
    border: '#BAE6FD',
    icon: 'airplane-outline',
    dot: '#0EA5E9',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    bg: '#E0E7FF',
    text: '#3730A3',
    border: '#C7D2FE',
    icon: 'bicycle-outline',
    dot: '#6366F1',
  },
  DELIVERED: {
    label: 'Delivered',
    bg: '#DCFCE7',
    text: '#166534',
    border: '#BBF7D0',
    icon: 'shield-checkmark-outline',
    dot: '#22C55E',
  },
  COMPLETED: {
    label: 'Completed',
    bg: '#DCFCE7',
    text: '#166534',
    border: '#BBF7D0',
    icon: 'sparkles-outline',
    dot: '#22C55E',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: '#FEE2E2',
    text: '#991B1B',
    border: '#FECACA',
    icon: 'close-circle-outline',
    dot: '#EF4444',
  },
  REFUNDED: {
    label: 'Refunded',
    bg: '#F1F5F9',
    text: '#475569',
    border: '#CBD5E1',
    icon: 'refresh-circle-outline',
    dot: '#64748B',
  },
  DISPUTED: {
    label: 'Under Review',
    bg: '#FFF7ED',
    text: '#C2410C',
    border: '#FFEDD5',
    icon: 'alert-circle-outline',
    dot: '#EA580C',
  },
};

export const ORDER_FILTER_TABS: Array<{ key: OrderStatusFilter; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'IN_PROGRESS', label: 'Crafting' },
  { key: 'SHIPPED', label: 'In Transit' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];
