import React, { createContext, useContext, useState, useEffect } from 'react';

/** 載入動畫最短顯示時間（避免閃爍） */
export const MIN_LOAD_DISPLAY_MS = 600;

export type AppInitFn = () => Promise<void>;

const AppLoadContext = createContext<{
  isReady: boolean;
}>({
  isReady: false,
});

type AppLoadProviderProps = {
  children: React.ReactNode;
  /** 初始化任務（字型、Firebase 等），與最短顯示時間一併等待。可延伸此陣列加入更多任務 */
  init?: AppInitFn | AppInitFn[];
};

/**
 * 可依實際載入完成時間調整載入動畫。
 * - 載入快：動畫可加速或提早完成
 * - 載入慢：動畫依原時序進行
 */
export function AppLoadProvider({ children, init }: AppLoadProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const minDelay = new Promise<void>((resolve) =>
      setTimeout(resolve, MIN_LOAD_DISPLAY_MS)
    );

    const tasks = Array.isArray(init) ? init : init ? [init] : [];
    const initPromise =
      tasks.length > 0
        ? Promise.all(tasks.map((t) => t().catch(() => {}))).then(() => {})
        : Promise.resolve();

    Promise.all([minDelay, initPromise]).then(() => setIsReady(true));
  }, []);

  return (
    <AppLoadContext.Provider value={{ isReady }}>
      {children}
    </AppLoadContext.Provider>
  );
}

export function useAppLoad() {
  const ctx = useContext(AppLoadContext);
  if (!ctx) {
    throw new Error('useAppLoad must be used within AppLoadProvider');
  }
  return ctx;
}
