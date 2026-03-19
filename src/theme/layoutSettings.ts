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

