#  蜥日日記 (LizLog) - 全方位寵物管理系統

## 1. 專案核心願景 (Vision)
根據「市場調查報告」與「使用者人物誌」，針對鬆獅蜥飼主記憶負荷過重、多成員協同困難的痛點，打造一個結合日常紀錄、數據分析與社群/醫療存檔的專業管理工具。

## 2. 技術棧 (Tech Stack)
- **前端框架:** React Native (Expo SDK 50+)
- **路由導覽:** Expo Router (基於檔案系統的路由)
- **後端服務:** Firebase (Auth, Firestore, Storage)
- **圖表視覺化:** Victory Native (處理體重與環境數據曲線)
- **圖示庫:** Lucide-react-native

## 3. 功能模組與使用者路徑
### A. 登入與寵物管理 (Onboarding)
- 快速入口: 支援 Email/密碼及 Google 登入。
- 寵物檔案: 姓名、生日、品系、性別、照片、目標體重設定。

### B. 今日狀態 (Home & Daily)
- 動態提醒: 依據餵食頻率自動產生「今日任務」（餵食、泡澡、鈣粉）。
- 快速紀錄: 一鍵紀錄當日排便、蛻皮狀態。

### C. 數據與成長趨勢 (Analytics)
- 體重曲線: 追蹤生長進度，預警異常體重下滑。
- 環境監測: 紀錄曬點與冷區溫度。

## 4. 資料結構規範 (Firestore Schema)
- `users/{userId}`: 使用者偏好、關聯寵物 ID 列表。
- `pets/{petId}`: 擁有者 UID, 體重, 身長, 餵食間隔。
- `activities/{activityId}`: type ('food'|'poop'|'molt'|'weight'), timestamp。

## 5. UI/UX 開發準則
- **大地色系設計:** 使用草綠 (#8FB996)、泥土褐 (#A59173) 與溫暖沙色。
- **單手操作優化:** 紀錄按鈕需放置於大拇指易觸及區域。
- **高對比文字:** 確保在戶外陽光下也能清晰閱讀。

## 專案設計文件索引 (References) - 開發前請必讀細節
- `docs/專案蜥日日記.txt`：專案計畫書（文件版本 2.0），包含策略藍圖、產品規格、技術與執行、以及未來發展。
- `docs/使用者研究與市場調查報告.txt`：市場調查報告（2025/09/05），整理目標用戶洞察與 MVP 功能優先級。
- `docs/使用者人物誌_V2.txt`：使用者人物誌（V2.0），包含 N 女士與 K 先生的核心概念、目標與痛點。

## 6. 當前進度 (Roadmap)
- [x] 專案安全初始化 (C:\暫存\CURSOR)
- [x] .cursorignore 與 Rules 防火牆設定
- [x] 確認 README.md 與 DEVELOPMENT_WORKFLOW.md 無誤
- [x] 基本視覺系統設定
- [ ] App 骨架與 Expo Router 路由建立
- [ ] Firebase 初始化、Auth 與 Firestore 讀寫層
- [ ] 今日狀態（提醒/快速紀錄）實作
- [ ] 寵物管理（寵物檔案）實作
- [ ] 分析（體重曲線/環境監測）實作
- [ ] 文件與測試驗證流程落地（確保可穩定迭代）

> 開發流程提醒：每完成一個階段性任務，請更新 `DEVELOPMENT_PROGRESS.md`，並在此處把對應 Roadmap 條目標記為 `[x]`。