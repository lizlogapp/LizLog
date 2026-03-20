# 蜥日日記 開發進度紀錄

本文件用於記錄「階段性任務」的完成狀態。每完成一個階段，請同時同步更新 `README.md` 的 `Roadmap`（把對應項目標為 `[x]`）。

## 使用規則（與 README Roadmap 同步）
1. 在此文件新增/更新該階段的完成紀錄（包含完成時間、完成內容、驗證方式）。
2. 回到 `README.md` 將該階段對應的 Roadmap 條目標成已完成。

## Phase 對應表（對應 README Roadmap）
- Phase 0：專案安全初始化
- Phase 1：.cursorignore 與 Rules 防火牆設定
- Phase 2：確認文件（README 與 DEVELOPMENT_WORKFLOW）
- Phase 3：基本視覺系統設定
- Phase 4：App 骨架與 Expo Router 路由建立
- Phase 5：Firebase 初始化、Auth 與 Firestore 讀寫層
- Phase 6：今日狀態（提醒/快速紀錄）實作
- Phase 7：寵物管理（寵物檔案）實作
- Phase 8：分析（體重曲線/環境監測）實作
- Phase 9：文件與測試驗證流程落地（確保可穩定迭代）

## 記錄區

### Phase 0：專案安全初始化
- 狀態：已完成（依 README 標示）
- 完成時間：未填寫
- 完成內容：完成專案環境安全初始化
- 驗證方式：依既有流程（請在確定後補上具體驗證步驟）

### Phase 1：.cursorignore 與 Rules 防火牆設定
- 狀態：已完成（依 README 標示）
- 完成時間：未填寫
- 完成內容：設定 `.cursorignore` 與 `.cursorrules`，限定操作範圍
- 驗證方式：檢查 `.cursorrules` 是否符合團隊安全規則

### Phase 2：確認文件（README 與 DEVELOPMENT_WORKFLOW）
- 狀態：已完成（本次確認）
- 完成時間：2026-03-19
- 完成內容：確認 README 與 DEVELOPMENT_WORKFLOW 的開發/安全/規範一致
- 驗證方式：人工檢查文件內容符合專案目標

### Phase 3：基本視覺系統設定
- 狀態：已完成
- 完成時間：2026-03-19
- 完成內容：建立基礎/主題/字體三份設定檔，包含日初/澄日兩主題色彩 token、黑階/白階文字 token，以及暇日/余白字體與字級（含中級/小/大映射）。
- 驗證方式：依流程在首次實作頁面後以 `npx expo start` 進行主題視覺一致性檢查

### Phase 4：App 骨架與 Expo Router 路由建立
- 狀態：已完成（骨架/路由已建立，尚待視覺驗證）
- 完成時間：2026-03-19
- 完成內容：
  - 更新入口設定：`package.json` 改為 `expo-router/entry`，並新增 `babel.config.js`（`expo-router/babel`）
  - 建立路由檔案：`app/_layout.tsx`、`app/(tabs)/_layout.tsx`
  - 建立底部 5 分頁 tabs placeholder：`index`（首頁）、`records`（紀錄）、`analytics`（分析）、`pets`（寵物）、`settings`（設定）
- 驗證方式：請於實機/模擬器執行 `npx expo start`，確認 tabs 可切換且畫面顏色符合 Day 主題

### 工作階段：首頁載入動畫與版面優化（2026-03-19）
- 狀態：已完成
- 完成時間：2026-03-19
- 完成內容：
  - 載入頁動畫（1→2→3→4）：light 蜥蜴 → dark 疊加 → logo，僅圖片淡入淡出、頁面固定
  - 動畫邏輯：light 不淡出、dark 疊加淡入；轉 logo 時 light+dark 同時淡出；圖層 zIndex 確保 dark 在上
  - 動畫規格：1→2 延遲 800ms、400ms Ease out；2→3 延遲 800ms、1600ms Ease in-out；3→4 延遲 800ms、800ms Ease in-out
  - 版面：內容/頁面邊距改為 W8 H8（`PANEL_CONTENT_MARGIN`、`CONTENT_PAGE_MARGIN`）
  - AppLoadContext：依實際載入完成時間調整動畫，載入快則加速至 logo，載入慢則完整播放
  - 新增 `src/contexts/AppLoadContext.tsx`、`layoutSettings` 動畫常數
- 驗證方式：`npx expo start` 於首頁確認載入動畫流程與版面邊距

### Phase 9：文件與測試驗證流程落地（確保可穩定迭代）
- 狀態：未開始
- 完成時間：--
- 完成內容：建立最低限度的開發驗證清單（例如：Local 啟動成功、關鍵頁面可用、Firebase/Firestore 寫入可行、基本錯誤處理）。
- 驗證方式：依清單在每次階段完成後能重現同等結果

