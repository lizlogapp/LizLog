/**
 * 版面/元件樣式設定（圓角、間距等）
 *
 * 圓角：
 * - 4 / 16 / 32
 *
 * 間距（Spacing）：
 * - 4 / 8 / 16 / 32 / 48 / 96 / 154 / 202
 *
 * 這些 token 建議用在 React Native 的 style（例如 borderRadius、padding、margin）。
 */

/** 頂部狀態列（時間、訊號、電量）高度 */
export const STATUS_BAR_HEIGHT = 70;
/** 頁籤列的高度 */
export const TAB_BAR_HEIGHT = 70;

/** 浮動按鈕區塊：頁籤上方的按鈕空間 */
export const FLOATING_BAR_HEIGHT = 114;
/** 浮動按鈕區塊與頁籤列的間距 */
export const FLOATING_BAR_MARGIN_BOTTOM = 16;
/** 浮動按鈕區塊內邊距（Figma Padding 32） */
export const FLOATING_BAR_PADDING = 32;
/** 浮動按鈕間距（Figma Gap 16） */
export const FLOATING_BAR_GAP = 16;

/** 各頁面預留的浮動按鈕區塊總高度（含與頁籤間距） */
export const FLOATING_SPACE =
  FLOATING_BAR_HEIGHT + FLOATING_BAR_MARGIN_BOTTOM;

/** 內容與面板邊距 W8 H8 */
export const PANEL_CONTENT_MARGIN = 8;
/** 頁面與內容邊距 W8 H8 */
export const CONTENT_PAGE_MARGIN = 8;
/** 內容區內邊距（其他元件用） */
export const CONTENT_PADDING = 16;

/** 載入動畫：當 app 提早載入完成時，加速至 logo 的動畫時長 */
export const LOAD_ANIMATION_ACCELERATE_MS = 300;

export const borderRadius = {
  // 小圓角
  sm: 4,
  // 中圓角
  md: 16,
  // 大圓角
  lg: 32,
} as const;

export const spacing = {
  // 間距 token：保留你指定的數列
  s4: 4,
  s8: 8,
  s16: 16,
  s32: 32,
  s48: 48,
  s96: 96,
  s154: 154,
  s202: 202,
} as const;

