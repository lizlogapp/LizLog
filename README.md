# LizLog 行動 APP

## Stack

- React Native with Expo and Expo Router.
- Firebase Auth, Firestore, Realtime Database, and Storage.
- TypeScript in strict mode.

## 本機指令

```bash
npm install
npm run typecheck
npm start
```

Android bundle 驗證：`npx expo export --platform android`。可安裝 APK 必須使用
EAS `preview` profile，bundle 匯出不能當作 APK 完成證據。

## Configuration

Firebase configuration is injected through Expo build variables, not committed
to source code. Set the required `EXPO_PUBLIC_FIREBASE_*` values in the secure
local or CI environment before starting the APP. See `app.config.js` for the
required variable names.

## MVP 範圍

`0.1.0` 包含 onboarding、登入、首頁、日記、寵物、分析、設定、提醒與共育。
IoT 硬體、配對及感測器資料不在本版本範圍。

## 目前品質門檻

- 已通過：TypeScript、Expo Doctor 18/18、Android bundle 匯出。
- 尚未通過：Firebase 實機驗證、APK 安裝、核心流程 smoke test、五人測試。
- 不可提交研究個資、`.env`、憑證或 token。
- 詳細狀態：`../mvp-audit.md`；測試步驟：`../../qa/mvp-test-plan.md`。
