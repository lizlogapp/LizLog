import React, { createContext, useContext, useMemo, useState } from "react";

import { ThemeId, themeLabels } from "./themeColorSettings";

type ThemeContextValue = {
  themeId: ThemeId;
  // 之後若你要做「使用者可切換主題」，這裡就是切換入口
  setThemeId: (next: ThemeId) => void;
  themeLabel: string;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(ThemeId.RI_CHU_THEME);

  const value = useMemo<ThemeContextValue>(() => {
    return {
      themeId,
      setThemeId,
      themeLabel: themeLabels[themeId],
    };
  }, [themeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

