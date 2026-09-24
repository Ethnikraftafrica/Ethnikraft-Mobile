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
  background: '#FFFCF4',
  backgroundSecondary: '#FCF4E1',
  card: '#FCF4E1',
  cardElevated: '#FFFFFF',
  cardMuted: '#F5EBD5',
  border: 'rgba(54, 19, 0, 0.25)',
  borderSubtle: 'rgba(54, 19, 0, 0.12)',
  borderAccent: '#662502',
  textPrimary: '#341B00',
  textSecondary: '#57534E',
  textMuted: '#808080',
  textInverse: '#FFFFFF',
  textGold: '#B87B2E',
  textAccent: '#C46C27',
  primary: '#662502',
  primaryDark: '#361300',
  primaryLight: '#C46C27',
  secondary: '#556B2F',
  accentGold: '#D1995A',
  navBackgroundGradient: ['#FFFCF4', '#FCF4E1', '#F5EBD5'],
  navBorder: 'rgba(54, 19, 0, 0.15)',
  navActiveText: '#662502',
  navActiveIcon: '#662502',
  navActiveIndicator: '#662502',
  navInactiveText: '#808080',
  navInactiveIcon: '#808080',
  headerBackground: '#FFFCF4',
  headerText: '#341B00',
  drawerBackgroundGradient: ['#FFFCF4', '#FCF4E1', '#F5EBD5'],
  drawerBorder: 'rgba(54, 19, 0, 0.15)',
  success: '#009D1A',
  danger: '#C92929',
  warning: '#F59E0B',
  info: '#0799C1',
  userBadgeBg: '#FEF3C7',
  userBadgeText: '#92400E',
  vendorBadgeBg: '#E8EDE0',
  vendorBadgeText: '#556B2F',
};

export const DarkTheme: ThemeColors = {
  background: '#17120F',
  backgroundSecondary: '#120E0C',
  card: '#191919',
  cardElevated: '#221C18',
  cardMuted: '#14100E',
  border: 'rgba(255, 255, 255, 0.12)',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderAccent: '#D1995A',
  textPrimary: '#FFFFFF',
  textSecondary: '#CBD2CF',
  textMuted: '#808080',
  textInverse: '#17120F',
  textGold: '#FFD79E',
  textAccent: '#C46C27',
  primary: '#C46C27',
  primaryDark: '#662502',
  primaryLight: '#D1995A',
  secondary: '#6B8E23',
  accentGold: '#FFD79E',
  navBackgroundGradient: ['#1E1916', '#17120F', '#120E0C'],
  navBorder: 'rgba(255, 255, 255, 0.12)',
  navActiveText: '#FFFFFF',
  navActiveIcon: '#D1995A',
  navActiveIndicator: '#C46C27',
  navInactiveText: '#808080',
  navInactiveIcon: '#808080',
  headerBackground: '#17120F',
  headerText: '#FFFFFF',
  drawerBackgroundGradient: ['#1E1916', '#17120F', '#120E0C'],
  drawerBorder: 'rgba(255, 255, 255, 0.12)',
  success: '#0AD24F',
  danger: '#C92929',
  warning: '#F59E0B',
  info: '#0799C1',
  userBadgeBg: '#2A1F0D',
  userBadgeText: '#FFD79E',
  vendorBadgeBg: '#1C2612',
  vendorBadgeText: '#A3D963',
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
  xs: 4,
  sm: 5,
  md: 7, // Exact Figma Card Radius (7px)
  lg: 13, // Exact Figma Pill/Dropdown Radius (13px)
  xl: 17, // Exact Figma Hero Banner Radius (17px)
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
