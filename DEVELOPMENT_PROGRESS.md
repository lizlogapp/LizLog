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

### Phase 9：文件與測試驗證流程落地（確保可穩定迭代）
- 狀態：未開始
- 完成時間：--
- 完成內容：建立最低限度的開發驗證清單（例如：Local 啟動成功、關鍵頁面可用、Firebase/Firestore 寫入可行、基本錯誤處理）。
- 驗證方式：依清單在每次階段完成後能重現同等結果

