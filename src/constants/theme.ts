export const Colors = {
  // Brand Palette
  primary: '#C46C27', // Terracotta Bronze
  primaryDark: '#361300', // Deep Earth / African Coffee
  primaryLight: '#D1995A', // Rich Ochre / Gold
  secondary: '#556B2F', // Olive Earth
  
  // Surfaces & Backgrounds
  background: '#FAF6F0', // Warm African Artisan Parchment
  surface: '#FFFFFF', // Pure White Card
  surfaceSubtle: '#FCF4E1', // Sand Warm
  surfaceMuted: '#F5EBD5', // Linen
  
  // Text
  textPrimary: '#101213', // Deep Black
  textSecondary: '#57534E', // Warm Charcoal
  textMuted: '#A8A29E', // Stone Muted
  textInverse: '#FFFFFF', // White
  
  // Accents & Functional
  accentGold: '#D1995A',
  border: '#E7E5E4',
  borderDark: '#D6D3D1',
  success: '#0AD24F',
  danger: '#C92929',
  info: '#0799C1',
  warning: '#F59E0B',

  // Role Badges
  userBadgeBg: '#FEF3C7',
  userBadgeText: '#92400E',
  vendorBadgeBg: '#E0E7FF',
  vendorBadgeText: '#3730A3',
} as const;

export const Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#361300',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#361300',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#361300',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  navBar: {
    shadowColor: '#361300',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
};

