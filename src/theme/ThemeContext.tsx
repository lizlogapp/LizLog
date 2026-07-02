import React, { createContext, useContext, useMemo, useState } from "react";

import { ThemeId, themeLabels } from "./themeColorSettings";

import { FontFamilyKey, fontFamilies } from "./typographySettings";

type ThemeContextValue = {
  themeId: ThemeId;
  setThemeId: (next: ThemeId) => void;
  themeLabel: string;
  fontFamilyId: FontFamilyKey;
  setFontFamilyId: (next: FontFamilyKey) => void;
  fontFamilyName: string;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(ThemeId.RI_CHU_THEME);
  const [fontFamilyId, setFontFamilyId] = useState<FontFamilyKey>("HAXI_RI"); // 預設：暇日
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false); // 預設關閉 Demo 模式

  const value = useMemo<ThemeContextValue>(() => {
    return {
      themeId,
      setThemeId,
      themeLabel: themeLabels[themeId],
      fontFamilyId,
      setFontFamilyId,
      fontFamilyName: fontFamilies[fontFamilyId],
      isDemoMode,
      setIsDemoMode,
    };
  }, [themeId, fontFamilyId, isDemoMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

