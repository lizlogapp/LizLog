/**
 * 主題背景底圖（應用在所有畫面底層）
 *
 * 需求：
 * - 主題「日初」：背景圖底圖使用 `background-ri-chu.png`
 * - 主題「澄日」：背景圖底圖使用 `background-cheng-ri.png`
 *
 * 後續若要新增「底圖上層圖片」，可在對應頁面（或元件）再疊加 Image 層。
 */

import { ThemeId } from "./themeColorSettings";

export const backgroundImages: Record<ThemeId, number> = {
  [ThemeId.RI_CHU_THEME]: require("../../assets/branding/backgrounds/background-ri-chu.png"),
  [ThemeId.CHENG_RI_THEME]: require("../../assets/branding/backgrounds/background-cheng-ri.png"),
};

