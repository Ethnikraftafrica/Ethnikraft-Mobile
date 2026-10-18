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

export type VendorPalettePreset = 'warm_obsidian' | 'midnight_gold' | 'sahara_slate' | 'baseline';

// ─── 0. BASELINE PRESET (Current Original Theme — 100% Reversible) ───────────
export const BaselineLightTheme: ThemeColors = {
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

export const BaselineDarkTheme: ThemeColors = {
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
  drawerBackgroundGradient: ['#191919', '#191919', '#191919'],
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

// ─── OPTION 1: WARM OBSIDIAN & EARTHEN TERRACOTTA (Authentic Warm Artisan) ────
export const WarmObsidianLightTheme: ThemeColors = {
  ...BaselineLightTheme,
  background: '#FAF7F2',
  backgroundSecondary: '#F4EFE6',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  cardMuted: '#F4EFE6',
  border: 'rgba(54, 19, 0, 0.14)',
  borderSubtle: 'rgba(54, 19, 0, 0.08)',
  borderAccent: '#8E3E0B',
  textPrimary: '#2A1608',
  textSecondary: '#57534E',
  textMuted: '#72665B',
  primary: '#8E3E0B',
  primaryDark: '#421A03',
  primaryLight: '#B85D19',
  accentGold: '#D1995A',
  navBackgroundGradient: ['#FAF7F2', '#F4EFE6', '#EDE5D8'],
  headerBackground: '#FAF7F2',
  headerText: '#2A1608',
  drawerBackgroundGradient: ['#FAF7F2', '#F4EFE6', '#EDE5D8'],
  drawerBorder: 'rgba(54, 19, 0, 0.12)',
};

export const WarmObsidianDarkTheme: ThemeColors = {
  ...BaselineDarkTheme,
  background: '#120E0B',
  backgroundSecondary: '#18120E',
  card: '#1B1511',
  cardElevated: '#241C16',
  cardMuted: '#15100C',
  border: 'rgba(209, 153, 90, 0.18)',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderAccent: '#D1995A',
  textPrimary: '#FFF6ED',
  textSecondary: '#CBD2CF',
  textMuted: '#8D8074',
  textGold: '#FFD79E',
  textAccent: '#B85D19',
  primary: '#B85D19',
  primaryDark: '#5C2807',
  primaryLight: '#D1995A',
  accentGold: '#D1995A',
  navBackgroundGradient: ['#1E1612', '#15100C', '#100C09'],
  navBorder: 'rgba(209, 153, 90, 0.16)',
  headerBackground: '#120E0B',
  headerText: '#FFF6ED',
  drawerBackgroundGradient: ['#17120E', '#140F0C', '#100C0A'],
  drawerBorder: 'rgba(209, 153, 90, 0.20)',
  danger: '#E05252',
};

// ─── OPTION 2: MIDNIGHT ESPRESSO & ROYAL GOLD (High-End African Gallery) ─────
export const MidnightGoldLightTheme: ThemeColors = {
  ...BaselineLightTheme,
  background: '#F9F7F4',
  backgroundSecondary: '#F2ECE1',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  cardMuted: '#F2ECE1',
  border: 'rgba(80, 50, 20, 0.14)',
  borderSubtle: 'rgba(80, 50, 20, 0.08)',
  borderAccent: '#9C7026',
  textPrimary: '#1C1309',
  textSecondary: '#595147',
  textMuted: '#696056',
  primary: '#9C7026',
  primaryDark: '#5C4113',
  primaryLight: '#C2913A',
  accentGold: '#D4A359',
  navBackgroundGradient: ['#F9F7F4', '#F2ECE1', '#E8E0D2'],
  headerBackground: '#F9F7F4',
  headerText: '#1C1309',
  drawerBackgroundGradient: ['#F9F7F4', '#F2ECE1', '#E8E0D2'],
  drawerBorder: 'rgba(80, 50, 20, 0.12)',
};

export const MidnightGoldDarkTheme: ThemeColors = {
  ...BaselineDarkTheme,
  background: '#0F0D0C',
  backgroundSecondary: '#151210',
  card: '#171412',
  cardElevated: '#211C19',
  cardMuted: '#120F0D',
  border: 'rgba(226, 186, 118, 0.22)',
  borderSubtle: 'rgba(255, 255, 255, 0.07)',
  borderAccent: '#D4A359',
  textPrimary: '#FFFFFF',
  textSecondary: '#D4CEC7',
  textMuted: '#968D84',
  textGold: '#FFDDA6',
  textAccent: '#D4A359',
  primary: '#D4A359',
  primaryDark: '#7A5820',
  primaryLight: '#E8C88B',
  accentGold: '#E8C88B',
  navBackgroundGradient: ['#181412', '#120F0D', '#0D0B0A'],
  navBorder: 'rgba(226, 186, 118, 0.20)',
  headerBackground: '#0F0D0C',
  headerText: '#FFFFFF',
  drawerBackgroundGradient: ['#171412', '#120F0D', '#0F0D0C'],
  drawerBorder: 'rgba(226, 186, 118, 0.22)',
  danger: '#E05252',
};

// ─── OPTION 3: SAHARA SLATE & TERRACOTTA SILK (Modern Minimalist Studio) ─────
export const SaharaSlateLightTheme: ThemeColors = {
  ...BaselineLightTheme,
  background: '#F5F5F5',
  backgroundSecondary: '#EBEBEB',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  cardMuted: '#EBEBEB',
  border: 'rgba(0, 0, 0, 0.10)',
  borderSubtle: 'rgba(0, 0, 0, 0.05)',
  borderAccent: '#A34F1B',
  textPrimary: '#1A1A1A',
  textSecondary: '#555555',
  textMuted: '#666666',
  primary: '#A34F1B',
  primaryDark: '#572507',
  primaryLight: '#C06830',
  accentGold: '#C9975E',
  navBackgroundGradient: ['#F5F5F5', '#EBEBEB', '#E0E0E0'],
  headerBackground: '#F5F5F5',
  headerText: '#1A1A1A',
  drawerBackgroundGradient: ['#F5F5F5', '#EBEBEB', '#E0E0E0'],
  drawerBorder: 'rgba(0, 0, 0, 0.08)',
};

export const SaharaSlateDarkTheme: ThemeColors = {
  ...BaselineDarkTheme,
  background: '#111111',
  backgroundSecondary: '#161616',
  card: '#181818',
  cardElevated: '#222222',
  cardMuted: '#141414',
  border: 'rgba(255, 255, 255, 0.10)',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderAccent: '#C06830',
  textPrimary: '#F5F5F5',
  textSecondary: '#CCCCCC',
  textMuted: '#888888',
  textGold: '#E0AA70',
  textAccent: '#C06830',
  primary: '#C06830',
  primaryDark: '#6E3715',
  primaryLight: '#D98852',
  accentGold: '#C9975E',
  navBackgroundGradient: ['#181818', '#141414', '#101010'],
  navBorder: 'rgba(255, 255, 255, 0.10)',
  headerBackground: '#111111',
  headerText: '#F5F5F5',
  drawerBackgroundGradient: ['#181818', '#141414', '#111111'],
  drawerBorder: 'rgba(255, 255, 255, 0.10)',
  danger: '#E05252',
};

// ─── PRESET REGISTRY & RESOLUTION ───────────────────────────────────────────
export const PALETTE_PRESETS: Record<
  VendorPalettePreset,
  { name: string; label: string; light: ThemeColors; dark: ThemeColors }
> = {
  warm_obsidian: {
    name: 'warm_obsidian',
    label: 'Obsidian',
    light: WarmObsidianLightTheme,
    dark: WarmObsidianDarkTheme,
  },
  midnight_gold: {
    name: 'midnight_gold',
    label: 'Gold',
    light: MidnightGoldLightTheme,
    dark: MidnightGoldDarkTheme,
  },
  sahara_slate: {
    name: 'sahara_slate',
    label: 'Slate',
    light: SaharaSlateLightTheme,
    dark: SaharaSlateDarkTheme,
  },
  baseline: {
    name: 'baseline',
    label: 'Original',
    light: BaselineLightTheme,
    dark: BaselineDarkTheme,
  },
};

export function getVendorPalette(
  isDark: boolean,
  preset: VendorPalettePreset = 'baseline'
): ThemeColors {
  const chosen = PALETTE_PRESETS[preset] || PALETTE_PRESETS.baseline;
  return isDark ? chosen.dark : chosen.light;
}

// Active default themes locked to Baseline (Option 4)
export const LightTheme: ThemeColors = BaselineLightTheme;
export const DarkTheme: ThemeColors = BaselineDarkTheme;

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
