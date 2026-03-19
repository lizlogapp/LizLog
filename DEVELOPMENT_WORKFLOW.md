# 🦎 蜥日日記 開發工作流規範 (Workflow)

## 1. 檔案修改標準 SOP
任何檔案的修改或新增，AI 必須遵循以下順序：
1. **分析 (Analyze)**：讀取相關檔案，確認與 @README.md 的目標一致。
2. **計畫 (Plan)**：在對話框先用「繁體中文」說明預計修改的逻辑與檔案路徑。
3. **執行 (Execute)**：產出程式碼，並使用 `Apply` 進行修改。
4. **驗證 (Verify)**：提醒使用者執行 `npx expo start` 檢查畫面是否正確。

## 2. 代碼規範 (Coding Standards)
- **語言**: 必須使用 TypeScript (tsx/ts)。
- **註解**: 關鍵邏輯必須加上「繁體中文」註解。
- **UI**: 顏色必須引用 README 中的草綠色 (#8FB996)。
- **組件**: 優先使用 functional components。

## 3. 安全禁令
- 嚴禁修改 `蜥日日記` 資料夾以外的任何檔案。
- 嚴禁在未經詢問下執行 `rm` 或 `npm uninstall` 等刪除指令。