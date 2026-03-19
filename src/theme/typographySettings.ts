/**
 * 字體與字級設定
 *
 * 字體：
 * - 暇日：Noto Sans
 * - 余白：Kurewa Gothic CJK TC
 *
 * 字級大小（中級）：
 * 14 / 16 / 18 / 20 / 24 / 28 / 32 / 44 / 48 / 54
 *
 * 小/大字級映射：
 * - small：14->10、16->12（其餘依偏移延伸）
 * - large：以 +4 推定（14->18、16->20 ...）
 *
 * 文字排版：
 * - line height：150%
 * - letter spacing：0
 */

export const fontFamilies = {
  // Noto Sans
  HAXI_RI: "暇日",
  // Kurewa Gothic CJK TC
  YU_BAI: "余白",
} as const;

export type FontFamilyKey = keyof typeof fontFamilies;

export const textScale = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
} as const;

export type TextScale = (typeof textScale)[keyof typeof textScale];

export const baseTextSizes = [14, 16, 18, 20, 24, 28, 32, 44, 48, 54] as const;

export const fontSizeScale = {
  // 中級：原始字級
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
  // 小字：14->10、16->12（推定偏移 -4）
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
  // 大字：此處先依 +4 推定
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
  return typeof mapped === "number" ? mapped : baseSize;
};

export const typographyDefaults = {
  lineHeightRatio: 1.5,
  letterSpacing: 0,
} as const;

export const buildLineHeight = (fontSize: number) => Math.round(fontSize * typographyDefaults.lineHeightRatio);

