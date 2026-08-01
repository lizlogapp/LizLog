import { Text, TextInput } from 'react-native';

/**
 * 保留 Android／iOS 系統字級縮放，同時避免極端字級把固定卡片與按鈕擠出畫面。
 * 內容區仍應搭配換行、彈性高度與捲動，不以此取代響應式版面。
 */
export const MAX_FONT_SIZE_MULTIPLIER = 1.35;

type ComponentWithDefaults = {
  defaultProps?: Record<string, unknown>;
};

let configured = false;

export function configureTextScaling() {
  if (configured) return;
  configured = true;

  [Text, TextInput].forEach(component => {
    const target = component as unknown as ComponentWithDefaults;
    target.defaultProps = {
      ...target.defaultProps,
      allowFontScaling: true,
      maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER,
    };
  });
}
