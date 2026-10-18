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

export interface FormattedPriceResult {
  display: string;
  full: string;
  isAbbreviated: boolean;
  convertedPrice: number;
}

/**
 * Abbreviates price when it is bound to exceed available space (e.g. KPI summary cards).
 * Returns both the compact display string and the full unabbreviated amount.
 */
export const formatAbbreviatedPrice = (
  price: number | string | undefined | null,
  currencyCode: string = 'NGN',
  exchangeRate: number = 1
): FormattedPriceResult => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : (price ?? 0);
  const full = formatPrice(numPrice, currencyCode, exchangeRate);

  if (isNaN(numPrice) || numPrice === 0) {
    return { display: full, full, isAbbreviated: false, convertedPrice: 0 };
  }

  const convertedPrice = Math.abs(numPrice * (exchangeRate || 1));
  const symbol = SUPPORTED_CURRENCIES[currencyCode]?.symbol || currencyCode;

  // Available card width in 2-column KPI grid fits approx 10-11 bold 24px characters.
  // Whenever the formatted string exceeds 11 characters or the converted amount is >= 100,000,
  // abbreviate into standard financial shorthand (K, M, B) to prevent cutting to a new line.
  if (convertedPrice >= 1_000_000_000) {
    const formattedNum = (convertedPrice / 1_000_000_000)
      .toFixed(2)
      .replace(/\.00$/, '')
      .replace(/(\.[1-9])0$/, '$1');
    const display = currencyCode === 'NGN' ? `NGN ${formattedNum}B` : `${symbol}${formattedNum}B`;
    return { display, full, isAbbreviated: true, convertedPrice };
  } else if (convertedPrice >= 1_000_000) {
    const formattedNum = (convertedPrice / 1_000_000)
      .toFixed(2)
      .replace(/\.00$/, '')
      .replace(/(\.[1-9])0$/, '$1');
    const display = currencyCode === 'NGN' ? `NGN ${formattedNum}M` : `${symbol}${formattedNum}M`;
    return { display, full, isAbbreviated: true, convertedPrice };
  } else if (convertedPrice >= 100_000 || full.length > 11) {
    if (convertedPrice >= 1_000) {
      const formattedNum = (convertedPrice / 1_000)
        .toFixed(1)
        .replace(/\.0$/, '');
      const display = currencyCode === 'NGN' ? `NGN ${formattedNum}K` : `${symbol}${formattedNum}K`;
      return { display, full, isAbbreviated: true, convertedPrice };
    }
  }

  return { display: full, full, isAbbreviated: false, convertedPrice };
};
