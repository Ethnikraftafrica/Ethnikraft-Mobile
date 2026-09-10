import { SUPPORTED_CURRENCIES } from '@/store/slices/currencySlice';

/**
 * Universal price formatter conforming to web parity.
 * Converts base NGN price into target currency using exchange rate and formats with currency symbol.
 */
export const formatPrice = (
  price: number | string | undefined | null,
  currencyCode: string = 'NGN',
  exchangeRate: number = 1
): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : (price ?? 0);
  if (isNaN(numPrice)) {
    const symbol = SUPPORTED_CURRENCIES[currencyCode]?.symbol || '₦';
    return `${symbol}0.00`;
  }

  const convertedPrice = numPrice * (exchangeRate || 1);

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedPrice);
  } catch {
    const symbol = SUPPORTED_CURRENCIES[currencyCode]?.symbol || '₦';
    return `${symbol}${convertedPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};
