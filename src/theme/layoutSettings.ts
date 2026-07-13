/**
 * 版面與尺寸 token。
 *
 * 只放可重複使用的全域數值，頁面專屬數值請留在頁面樣式內。
 */

export const STATUS_BAR_HEIGHT = 70;
export const TAB_BAR_HEIGHT = 70;

export const FLOATING_BAR_HEIGHT = 114;
export const FLOATING_BAR_MARGIN_BOTTOM = 16;
export const FLOATING_BAR_PADDING = 32;
export const FLOATING_BAR_GAP = 16;

export const FLOATING_SPACE =
  FLOATING_BAR_HEIGHT + FLOATING_BAR_MARGIN_BOTTOM;

export const PANEL_CONTENT_MARGIN = 8;
export const CONTENT_PAGE_MARGIN = 8;
export const CONTENT_PADDING = 16;

export const LOAD_ANIMATION_ACCELERATE_MS = 300;

export const borderRadius = {
  sm: 4,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const spacing = {
  s4: 4,
  s8: 8,
  s16: 16,
  s32: 32,
  s48: 48,
  s96: 96,
  s154: 154,
  s202: 202,
} as const;
