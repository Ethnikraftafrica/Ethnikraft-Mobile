export interface ThemeColors {
  // Base App Canvas
  background: string;
  backgroundSecondary: string;
  
  // Surfaces & Cards
  card: string;
  cardElevated: string;
  cardMuted: string;
  
  // Borders & Dividers
  border: string;
  borderSubtle: string;
  borderAccent: string;
  
  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textGold: string;
  textAccent: string;
  
  // Brand Core
  primary: string; // #C46C27 Terracotta
  primaryDark: string; // #361300 African Coffee
  primaryLight: string; // #D1995A Gold Ochre
  secondary: string; // #556B2F Olive Earth
  accentGold: string; // #FFD79E
  
  // Navigation & Toolbars
  navBackgroundGradient: [string, string, string];
  navBorder: string;
  navActiveText: string;
  navActiveIcon: string;
  navActiveIndicator: string;
  navInactiveText: string;
  navInactiveIcon: string;
  headerBackground: string;
  headerText: string;
  drawerBackgroundGradient: [string, string, string];
  drawerBorder: string;
  
  // Status Colors
  success: string;
  danger: string;
  warning: string;
  info: string;

  // Role Badges
  userBadgeBg: string;
  userBadgeText: string;
  vendorBadgeBg: string;
  vendorBadgeText: string;
}

export const LightTheme: ThemeColors = {
  background: '#FAF6F0',
  backgroundSecondary: '#FCF4E1',
  card: '#FFFFFF',
  cardElevated: '#FFFDF9',
  cardMuted: '#F5EBD5',
  border: '#E7E0D3',
  borderSubtle: 'rgba(209, 153, 90, 0.2)',
  borderAccent: '#C46C27',
  textPrimary: '#101213',
  textSecondary: '#57534E',
  textMuted: '#8A7A6A',
  textInverse: '#FFFFFF',
  textGold: '#B87B2E',
  textAccent: '#C46C27',
  primary: '#C46C27',
  primaryDark: '#361300',
  primaryLight: '#D1995A',
  secondary: '#556B2F',
  accentGold: '#D1995A',
  navBackgroundGradient: ['#FCF4E1', '#F7EBD2', '#EFE1C3'],
  navBorder: 'rgba(209, 153, 90, 0.35)',
  navActiveText: '#361300',
  navActiveIcon: '#C46C27',
  navActiveIndicator: '#C46C27',
  navInactiveText: '#8A7A6A',
  navInactiveIcon: '#8A7A6A',
  headerBackground: '#FAF6F0',
  headerText: '#361300',
  drawerBackgroundGradient: ['#FAF6F0', '#FCF4E1', '#F5EBD5'],
  drawerBorder: 'rgba(209, 153, 90, 0.3)',
  success: '#0AD24F',
  danger: '#C92929',
  warning: '#F59E0B',
  info: '#0799C1',
  userBadgeBg: '#FEF3C7',
  userBadgeText: '#92400E',
  vendorBadgeBg: '#E0E7FF',
  vendorBadgeText: '#3730A3',
};

export const DarkTheme: ThemeColors = {
  background: '#120701',
  backgroundSecondary: '#1A0B02',
  card: '#1F0E04',
  cardElevated: '#281306',
  cardMuted: '#190A02',
  border: '#3D1E08',
  borderSubtle: 'rgba(209, 153, 90, 0.22)',
  borderAccent: '#FFD79E',
  textPrimary: '#FFF3D6',
  textSecondary: '#D1995A',
  textMuted: '#A8998A',
  textInverse: '#101213',
  textGold: '#FFD79E',
  textAccent: '#C46C27',
  primary: '#C46C27',
  primaryDark: '#361300',
  primaryLight: '#D1995A',
  secondary: '#556B2F',
  accentGold: '#FFD79E',
  navBackgroundGradient: ['#2A1203', '#1A0B02', '#100501'],
  navBorder: 'rgba(209, 153, 90, 0.35)',
  navActiveText: '#FFF3D6',
  navActiveIcon: '#FFF3D6',
  navActiveIndicator: '#FFD79E',
  navInactiveText: '#A8998A',
  navInactiveIcon: '#A8998A',
  headerBackground: '#2A1203',
  headerText: '#FFF3D6',
  drawerBackgroundGradient: ['#2A1203', '#1A0B02', '#100501'],
  drawerBorder: 'rgba(209, 153, 90, 0.35)',
  success: '#0AD24F',
  danger: '#C92929',
  warning: '#F59E0B',
  info: '#0799C1',
  userBadgeBg: '#FEF3C7',
  userBadgeText: '#92400E',
  vendorBadgeBg: '#E0E7FF',
  vendorBadgeText: '#3730A3',
};

// Backwards-compatible default Colors alias (defaults to Light Theme)
export const Colors = {
  ...LightTheme,
  surface: LightTheme.card,
  surfaceSubtle: LightTheme.backgroundSecondary,
  surfaceMuted: LightTheme.cardMuted,
  borderDark: '#D6D3D1',
} as const;

export const FontFamily = {
  // Editorial African Luxury (Headings, quotes, numbers, accents)
  cormorantSemiBold: 'CormorantGaramond_600SemiBold',
  cormorantBold: 'CormorantGaramond_700Bold',
  cormorantItalic: 'CormorantGaramond_700Bold_Italic',

  // Modern African Craft Identity (Buttons, brand labels, tabs, badges)
  poppinsRegular: 'Poppins_400Regular',
  poppinsMedium: 'Poppins_500Medium',
  poppinsSemiBold: 'Poppins_600SemiBold',
  poppinsBold: 'Poppins_700Bold',
  poppinsExtraBold: 'Poppins_800ExtraBold',

  // Clean Editorial Body (Descriptions, metadata, specs)
  latoRegular: 'Lato_400Regular',
  latoBold: 'Lato_700Bold',

  // Semantic Typography Aliases
  bodyRegular: 'Lato_400Regular',
  bodyBold: 'Lato_700Bold',
  displayBold: 'CormorantGaramond_700Bold',
  displaySemiBold: 'CormorantGaramond_600SemiBold',
  headingBold: 'Poppins_700Bold',
  headingMedium: 'Poppins_500Medium',
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
  fontFamily: FontFamily,
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
