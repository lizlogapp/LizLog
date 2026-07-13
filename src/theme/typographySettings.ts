/**
 * 字體與字級 token。
 */

export const fontFamilies = {
  HAXI_RI: 'Noto Sans TC',
  YU_BAI: 'Kurewa Gothic CJK TC',
} as const;

export type FontFamilyKey = keyof typeof fontFamilies;

export const textScale = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;

export type TextScale = (typeof textScale)[keyof typeof textScale];

export const baseTextSizes = [14, 16, 18, 20, 24, 28, 32, 44, 48, 54] as const;

export const fontSizeScale = {
  [textScale.MEDIUM]: {
    14: 14,
    16: 16,
    18: 18,
    20: 20,
    24: 24,
    28: 28,
    32: 32,
    44: 44,
    48: 48,
    54: 54,
  },
  [textScale.SMALL]: {
    14: 10,
    16: 12,
    18: 14,
    20: 16,
    24: 20,
    28: 24,
    32: 28,
    44: 40,
    48: 44,
    54: 50,
  },
  [textScale.LARGE]: {
    14: 18,
    16: 20,
    18: 22,
    20: 24,
    24: 28,
    28: 32,
    32: 36,
    44: 48,
    48: 52,
    54: 58,
  },
} as const;

export const getFontSize = (baseSize: number, scale: TextScale) => {
  const mapped = (fontSizeScale as Record<string, Record<number, number>>)[scale]?.[baseSize];
  return typeof mapped === 'number' ? mapped : baseSize;
};

export const typographyDefaults = {
  lineHeightRatio: 1.5,
  letterSpacing: 0,
} as const;

export const buildLineHeight = (fontSize: number) =>
  Math.round(fontSize * typographyDefaults.lineHeightRatio);
