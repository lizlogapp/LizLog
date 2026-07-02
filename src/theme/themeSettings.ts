import { ThemeId, themeLabels, themeTokens } from "./themeColorSettings";
import { baseColors } from "./themeColorSettings";
import {
  fontFamilies,
  textScale,
  type TextScale,
  baseTextSizes,
  fontSizeScale,
  getFontSize,
  typographyDefaults,
  buildLineHeight,
} from "./typographySettings";
import { borderRadius, spacing } from "./layoutSettings";

export {
  baseColors,
  ThemeId,
  themeLabels,
  themeTokens,
  fontFamilies,
  textScale,
  baseTextSizes,
  fontSizeScale,
  getFontSize,
  typographyDefaults,
  buildLineHeight,
  borderRadius,
  spacing,
};

export type { TextScale };

export const themeSettings = {
  baseColors,
  themeLabels,
  themeTokens,
  typography: {
    fontFamilies,
    textScale,
    baseTextSizes,
    fontSizeScale,
    getFontSize,
    typographyDefaults,
    buildLineHeight,
  },
  layout: {
    borderRadius,
    spacing,
  },
};

export const getThemeTokens = (themeId: ThemeId) => themeTokens[themeId];

