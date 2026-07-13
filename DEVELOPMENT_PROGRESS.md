# LizLog APP 開發進度

更新日期：2026-07-13。

## 已完成

- Expo Router 基礎架構與主要畫面骨架。
- onboarding、登入、首頁、日記、寵物、分析、設定、提醒與共照護頁面。
- 共用 theme、layout token 與型別修正。
- Firebase 改為由 Expo 建置環境注入，不再將設定寫入 TypeScript 原始碼。
- 登入驗證、密碼重設／變更、日記真實資料檢視、提醒週期與共育 owner routing 修正。
- 分析圖表改讀實際日記資料，移除誤導的假日曆內容。
- `npm run typecheck`、Expo Doctor 18/18 與 Android bundle 匯出通過。
- 版本定為 `0.1.0`，圖示、Expo plugins 與相依套件已校正。
- EAS 專案已轉移至 `@lizlogapp/lizlog`，並沿用原 `projectId`。
- APP Git worktree 已修復並對齊 GitHub `main` 基準。
- 圖片／附件選取與 Storage 上傳程式已完成。
- Android 本機通知權限、偏好與週期排程程式已完成。
- Firestore／Storage Rules 與共育資料隔離基線已建立。

## 進行中

- 分析詳細數據／報表與蛻皮資料。
- Firebase 真實設定、Rules 部署、實機流程與公開測試自助帳號刪除。
- 移除剩餘 mock／`any`，加入自動化測試。
- 產出可安裝 APK，完成五人實機測試。

## MVP 不包含

- IoT 硬體、配對、感測器資料與裝置整合。

## 發版阻塞項目

- 尚未完成完整 smoke test。
- Firebase 建置變數尚需在安全環境中設定與實機驗證。
- Git 已修復；待 Firebase 實機驗證後再 commit／push recovery branch。
- `npm audit` 尚有 14 個 moderate 項目；修正需要跨 Expo major 升級，不可在 MVP 前強制套用。
