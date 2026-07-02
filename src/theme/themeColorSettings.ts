/**
 * 主題色彩設定
 *
 * 兩種主題命名：
 * - 日初
 * - 澄日
 *
 * 你提供的規格是「主題」→「使用哪一格色票」→「對應 hex」。
 * 本檔案把色票（Palette swatch）與主題（Theme token）分離，避免日初/澄日被誤當作顏色名。
 */

/**
 * 基本色彩
 *
 */
export const baseColors = {
  // 警示色（紅）
  warning: "#FF0000",
  // 核可通過色（綠）
  success: "#0BDA00",

  // 黑階（內文）
  textBlack: "#5F5F5F",
  // 白階（內文）
  textWhite: "#FFFFFF",
} as const;

export type BaseColorKey = keyof typeof baseColors;

export const ThemeId = {
  RI_CHU_THEME: "ri-chu-theme",
  CHENG_RI_THEME: "cheng-ri-theme",
} as const;

export type ThemeId = (typeof ThemeId)[keyof typeof ThemeId];

export const themeLabels: Record<ThemeId, string> = {
  [ThemeId.RI_CHU_THEME]: "日初",
  [ThemeId.CHENG_RI_THEME]: "澄日",
};

/**
 * 參考色票（Palette swatch）hex
 * 色票圖片內的顏色名字對應 hex：
 * 日初 / 晨曦 / 暖陽 / 午金 / 烈日 / 暮橙 / 霞日 / 玄日
 */
export const paletteColors = {
  // 日初
  RI_CHU: "#FFFEFA",
  // 晨曦
  CHEN_XI: "#FFF7D7",
  // 暖陽
  NUAN_YANG: "#FFE691",
  // 午金
  WU_JIN: "#FFD239",
  // 烈日
  LIE_RI: "#FFC500",
  // 暮橙
  MU_CHENG: "#FFAA1E",
  // 霞日
  XIA_RI: "#FF7300",
  // 玄日（黑階）
  XUAN_RI: "#5F5F5F",
  // 白日（白階）
  BAI_RI: "#FFFFFF",
} as const;

export type ThemeTokens = {
  // 主色
  primary: string;
  // 次主色
  secondary: string;

  // 輔色：烈日 / 晨曦 / 午金
  accentHot: string;
  accentDawn: string;
  accentNoon: string;

  // 底色（背景）
  background: string;

  // 面板-圖樣-字樣（你提供的欄位 hex 目前有空值，我先以「日初」同 hex 延用）
  panelPatternText: string;
  // 面板-底色
  panelBackground: string;

  // 內文（主要文字色）
  text: string;
};

export const themeTokens: Record<ThemeId, ThemeTokens> = {
  // 主題：日初
  [ThemeId.RI_CHU_THEME]: {
    // 主色：霞日
    primary: paletteColors.XIA_RI,
    // 次主色：暮橙
    secondary: paletteColors.MU_CHENG,
    // 輔色-烈日：烈日
    accentHot: paletteColors.LIE_RI,
    // 輔色-晨曦：晨曦
    accentDawn: paletteColors.CHEN_XI,
    // 輔色-午金：午金
    accentNoon: paletteColors.WU_JIN,
    // 底色：日初
    background: paletteColors.RI_CHU,
    // 面板-圖樣-字樣：日初
    panelPatternText: paletteColors.RI_CHU,
    // 面板-底色：暖陽
    panelBackground: paletteColors.NUAN_YANG,
    // 內文：玄日
    text: paletteColors.XUAN_RI,
  },

  // 主題：澄日
  [ThemeId.CHENG_RI_THEME]: {
    // 主色：日初
    primary: paletteColors.RI_CHU,
    // 次主色：晨曦
    secondary: paletteColors.CHEN_XI,
    // 輔色-烈日：暖陽
    accentHot: paletteColors.NUAN_YANG,
    // 輔色-晨曦：霞日
    accentDawn: paletteColors.XIA_RI,
    // 輔色-午金：午金
    accentNoon: paletteColors.WU_JIN,
    // 底色：暮橙
    background: paletteColors.MU_CHENG,
    // 面板-圖樣-字樣：日初
    panelPatternText: paletteColors.RI_CHU,
    // 面板-底色：午金
    panelBackground: paletteColors.WU_JIN,
    // 內文：FFFFFF
    text: baseColors.textWhite,
  },
};

