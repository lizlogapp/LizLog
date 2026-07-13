/**
 * LizLog 色彩與主題 token。
 *
 * - `paletteColors`：基礎色票
 * - `themeTokens`：依主題組合出的 UI token
 */

export const baseColors = {
  warning: '#FF0000',
  success: '#0BDA00',
  textBlack: '#5F5F5F',
  textWhite: '#FFFFFF',
} as const;

export type BaseColorKey = keyof typeof baseColors;

export const ThemeId = {
  RI_CHU_THEME: 'ri-chu-theme',
  CHENG_RI_THEME: 'cheng-ri-theme',
} as const;

export type ThemeId = (typeof ThemeId)[keyof typeof ThemeId];

export const themeLabels: Record<ThemeId, string> = {
  [ThemeId.RI_CHU_THEME]: '日初',
  [ThemeId.CHENG_RI_THEME]: '澄日',
};

export const paletteColors = {
  RI_CHU: '#FFFEFA',
  CHEN_XI: '#FFF7D7',
  NUAN_YANG: '#FFE691',
  WU_JIN: '#FFD239',
  LIE_RI: '#FFC500',
  MU_CHENG: '#FFAA1E',
  XIA_RI: '#FF7300',
  XUAN_RI: '#5F5F5F',
  BAI_RI: '#FFFFFF',
} as const;

export type ThemeTokens = {
  primary: string;
  secondary: string;
  accentHot: string;
  accentDawn: string;
  accentNoon: string;
  background: string;
  panelPatternText: string;
  panelBackground: string;
  text: string;
};

export const themeTokens: Record<ThemeId, ThemeTokens> = {
  [ThemeId.RI_CHU_THEME]: {
    primary: paletteColors.XIA_RI,
    secondary: paletteColors.MU_CHENG,
    accentHot: paletteColors.LIE_RI,
    accentDawn: paletteColors.CHEN_XI,
    accentNoon: paletteColors.WU_JIN,
    background: paletteColors.RI_CHU,
    panelPatternText: paletteColors.RI_CHU,
    panelBackground: paletteColors.NUAN_YANG,
    text: paletteColors.XUAN_RI,
  },
  [ThemeId.CHENG_RI_THEME]: {
    primary: paletteColors.RI_CHU,
    secondary: paletteColors.CHEN_XI,
    accentHot: paletteColors.NUAN_YANG,
    accentDawn: paletteColors.XIA_RI,
    accentNoon: paletteColors.WU_JIN,
    background: paletteColors.MU_CHENG,
    panelPatternText: paletteColors.RI_CHU,
    panelBackground: paletteColors.WU_JIN,
    text: baseColors.textWhite,
  },
};
