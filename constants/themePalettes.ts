export type ThemePreference = 'light' | 'dark' | 'auto';

export type AppPalette = {
  scheme: 'light' | 'dark';
  screenBg: string;
  cardBg: string;
  headerBg: string;
  tabBarBg: string;
  groupBg: string;
  accentBlue: string;
  accentRed: string;
  buttonOnAccent: string;
  headerPrimaryText: string;
  headerSecondaryText: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textMeta: string;
  tabActive: string;
  tabInactive: string;
  borderHairline: string;
  borderSubtle: string;
  progressTrack: string;
  elevatedSurface: string;
  categoryPillBg: string;
  speakerBg: string;
  speakerBorder: string;
  segmentActiveBg: string;
  segmentInactiveBg: string;
  segmentInactiveBorder: string;
  segmentActiveText: string;
  segmentInactiveText: string;
  iconMuted: string;
  shadowColor: string;
  dangerBg: string;
  outlineButtonBg: string;
  outlineButtonBorder: string;
  outlineButtonText: string;
  chapterTileBorder: string;
  phrasePinInactive: string;
  testProgressTint: string;
};

export function lightPalette(): AppPalette {
  return {
    scheme: 'light',
    screenBg: '#FFFFFF',
    cardBg: '#F5F0E8',
    headerBg: '#EDE9E3',
    tabBarBg: '#EDE9E3',
    groupBg: 'rgba(0,0,0,0.28)',
    accentBlue: '#012169',
    accentRed: '#CF142B',
    buttonOnAccent: '#FFFFFF',
    headerPrimaryText: 'rgba(0,0,0,0.28)',
    headerSecondaryText: 'rgba(0,0,0,0.38)',
    textPrimary: '#1A1A1A',
    textSecondary: '#999999',
    textMuted: '#888888',
    textMeta: 'rgba(0,0,0,0.28)',
    tabActive: '#00247D',
    tabInactive: 'rgba(0,0,0,0.28)',
    borderHairline: '#C6C6C8',
    borderSubtle: '#F0EDE8',
    progressTrack: 'rgba(0, 0, 0, 0.12)',
    elevatedSurface: '#F2F2F7',
    categoryPillBg: 'rgba(0, 0, 0, 0.06)',
    speakerBg: 'rgba(0, 0, 0, 0.05)',
    speakerBorder: 'rgba(0, 0, 0, 0.12)',
    segmentActiveBg: '#012169',
    segmentInactiveBg: 'transparent',
    segmentInactiveBorder: 'rgba(0, 0, 0, 0.22)',
    segmentActiveText: '#FFFFFF',
    segmentInactiveText: '#1A1A1A',
    iconMuted: '#8E8E93',
    shadowColor: '#000',
    dangerBg: '#CF142B',
    outlineButtonBg: '#F2F2F7',
    outlineButtonBorder: '#C6C6C8',
    outlineButtonText: '#3A3A3C',
    chapterTileBorder: '#C6C6C8',
    phrasePinInactive: '#00247D',
    testProgressTint: 'rgba(0, 36, 125, 0.15)',
  };
}

export function darkPalette(): AppPalette {
  return {
    scheme: 'dark',
    screenBg: '#1C1C1E',
    cardBg: '#2C2C2E',
    headerBg: '#1B2B6B',
    tabBarBg: '#1E1E1E',
    groupBg: '#1E1E1E',
    accentBlue: '#1B2B6B',
    accentRed: '#CF142B',
    buttonOnAccent: '#FFFFFF',
    headerPrimaryText: '#FFFFFF',
    headerSecondaryText: '#AAAAAA',
    textPrimary: '#FFFFFF',
    textSecondary: '#AAAAAA',
    textMuted: '#888888',
    textMeta: '#AAAAAA',
    tabActive: '#CF142B',
    tabInactive: 'rgba(255,255,255,0.45)',
    borderHairline: 'rgba(255,255,255,0.14)',
    borderSubtle: 'rgba(255,255,255,0.12)',
    progressTrack: 'rgba(255,255,255,0.18)',
    elevatedSurface: '#252525',
    categoryPillBg: 'rgba(255,255,255,0.08)',
    speakerBg: 'rgba(255,255,255,0.06)',
    speakerBorder: 'rgba(255,255,255,0.18)',
    segmentActiveBg: '#1B2B6B',
    segmentInactiveBg: 'transparent',
    segmentInactiveBorder: 'rgba(255,255,255,0.28)',
    segmentActiveText: '#FFFFFF',
    segmentInactiveText: '#FFFFFF',
    iconMuted: '#AAAAAA',
    shadowColor: '#000',
    dangerBg: '#CF142B',
    outlineButtonBg: '#2C2C2C',
    outlineButtonBorder: 'rgba(255,255,255,0.2)',
    outlineButtonText: '#FFFFFF',
    chapterTileBorder: 'rgba(255,255,255,0.14)',
    phrasePinInactive: '#90CAF9',
    testProgressTint: 'rgba(255, 255, 255, 0.2)',
  };
}
