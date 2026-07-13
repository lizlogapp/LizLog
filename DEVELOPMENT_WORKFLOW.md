# LizLog APP 開發流程

## 開發順序

1. 先閱讀根目錄 `README.md`、`01_notion/project-context.md` 與目前任務。
2. 保持 Expo Router 路由檔名穩定，不任意重新命名 `app/` 下的公開頁面。
3. 功能資料先定義 TypeScript 型別，再串接 Firestore 或 demo 資料。
4. 每次修改後執行 `npm run typecheck`；必要時啟動 Expo 做畫面驗證。
5. 更新 `01_notion/tasks/`、決策與交接紀錄。

## 程式規範

- 使用 TypeScript strict mode，避免新增 `any` 或 `@ts-ignore`。
- UI 使用既有的 theme 與 layout token，不直接散落硬編色碼與尺寸。
- demo 資料只能放在明確的 demo 層，不可混入 production service。
- Firebase 設定由建置環境注入；原始碼、README 與任務紀錄不得保存憑證。

## 發版前

- `npm run typecheck` 無阻塞錯誤。
- 完成登入、首頁、日記、寵物、分析、設定、主題、提醒與共照護 smoke test。
- 確認 APK 使用的 Firebase 建置變數正確。
- 確認 Git 與 Notion 不含個資研究原文或憑證。
