# 🎨 蜥日日記 — 顏色變體設定文件

本文件為 Figma 設計系統中「顏色 / 標準色」變數的對照參考，  
對應程式碼 [`src/theme/themeColorSettings.ts`](file:///C:/%E6%9A%AB%E5%AD%98/Antigravity/%E8%9C%A5%E6%97%A5%E6%97%A5%E8%A8%98/src/theme/themeColorSettings.ts)。

---

## 色票 (Palette Swatches)

所有 UI 色彩由以下 8 個色票組成，不直接在頁面中引用，  
而是透過**變體 Token** 間接對映。

| 色票名稱 | 常數名 | HEX | 色塊 |
|---------|--------|-----|------|
| 日初 | `RI_CHU` | `#FFFEFA` | 🟫⬜ |
| 晨曦 | `CHEN_XI` | `#FFF7D7` | 🟨 淡黃 |
| 暖陽 | `NUAN_YANG` | `#FFE691` | 🟨 暖黃 |
| 午金 | `WU_JIN` | `#FFD239` | 🟡 金黃 |
| 烈日 | `LIE_RI` | `#FFC500` | 🟠 亮金 |
| 暮橙 | `MU_CHENG` | `#FFAA1E` | 🟠 深橙 |
| 霞日 | `XIA_RI` | `#FF7300` | 🟠 橘紅 |
| 玄日 | `XUAN_RI` | `#5F5F5F` | ⬛ 深灰 |

額外色彩：  
- **白日** `BAI_RI` → `#FFFFFF`  
- **警示色** `warning` → `#FF0000`  
- **核可色** `success` → `#0BDA00`

---

## 變體設定 — 顏色 / 標準色

兩種主題根據 Figma Variables 面板的「顏色 / 標準色」群組定義：

| Figma 變數名稱 | 程式 Token | 日初 (ri-chu-theme) | 澄日 (cheng-ri-theme) |
|---------------|-----------|--------------------|-----------------------|
| **主色** | `primary` | 色票/霞日 `#FF7300` | 色票/日初 `#FFFEFA` |
| **次主色** | `secondary` | 色票/暮橙 `#FFAA1E` | 色票/晨曦 `#FFF7D7` |
| **輔色 -烈日** | `accentHot` | 色票/烈日 `#FFC500` | 色票/暖陽 `#FFE691` |
| **輔色 -晨曦** | `accentDawn` | 色票/晨曦 `#FFF7D7` | 色票/霞日 `#FF7300` |
| **輔色 -午金** | `accentNoon` | 色票/午金 `#FFD239` | 色票/午金 `#FFD239` |
| **底色** | `background` | 色票/日初 `#FFFEFA` | 色票/暮橙 `#FFAA1E` |
| **面板 -圖樣 字樣** | `panelPatternText` | 色票/日初 `#FFFEFA` | 色票/日初 `#FFFEFA` |
| **面板 -底色** | `panelBackground` | 色票/暖陽 `#FFE691` | 色票/午金 `#FFD239` |
| **內文** | `text` | 色票/玄日 `#5F5F5F` | `#FFFFFF` |

---

## 使用規範

### 取得 Theme Tokens

```tsx
import { useTheme } from '../src/theme/ThemeContext';
import { getThemeTokens } from '../src/theme/themeSettings';

const { themeId } = useTheme();
const theme = getThemeTokens(themeId);

// 使用方式
<Text style={{ color: theme.primary }}>標題</Text>
<View style={{ backgroundColor: theme.background }}>卡片</View>
```

### 元件對應 Token 速查

| UI 元素 | 對應 Token | 說明 |
|---------|-----------|------|
| 頁面/面板底色 | `theme.background` | 由 `_layout.tsx` 統一處理 |
| 卡片底色 | `theme.background` | 與頁面底色相同，靠陰影區分 |
| 標題文字 | `theme.primary` | 日初=橘, 澄日=白 |
| 內文/段落 | `theme.text` | 日初=深灰, 澄日=白 |
| 寵物標籤底色 | `theme.accentDawn` | 日初=淡黃, 澄日=橘 |
| 寵物標籤文字 | `theme.primary` | 與標題同色 |
| 月份/年份選擇器底色 | `theme.panelBackground` | 面板底色 |
| 月份/年份選擇器文字 | `theme.panelPatternText` | 面板字樣（兩主題皆白） |
| 可編輯數據值 | `theme.accentHot` | 日初=金黃, 澄日=暖黃 |
| Header 圖標 (☰🔍) | `theme.primary` | 與標題同色 |
| 狀態紀錄標籤 | `theme.primary` | 溫度：、濕度：等標籤 |
| 下拉選單背景 | `theme.background` | 底色 |
| 下拉選單文字 | `theme.primary` | 與標題同色 |

### 禁止事項

> [!CAUTION]
> - **禁止**在頁面元件中直接引用 `paletteColors`（如 `paletteColors.XIA_RI`）。
> - **禁止**在 `StyleSheet.create()` 中硬編碼 hex 色碼作為主題色。
> - **禁止**在 `StyleSheet.create()` 中引用 `theme.*`（因為它是動態值，StyleSheet 是靜態的）。

### 正確做法

```tsx
// ✅ 正確：在 JSX 中以 inline style 套用 theme token
<View style={[styles.card, { backgroundColor: theme.background }]}>

// ✅ 正確：StyleSheet 只放不變的結構樣式
const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 6,
  },
});

// ❌ 錯誤：在 StyleSheet 中放主題色
const styles = StyleSheet.create({
  card: {
    backgroundColor: paletteColors.RI_CHU,  // ← 不會隨主題切換！
  },
});
```

---

## 其他變體設定

| Figma 變數名稱 | 日初 | 澄日 | 說明 |
|---------------|------|------|------|
| **畫布** | `False` | `True` | Figma 顯示用 |
| **手機外殼** | `True` | `True` | Figma 顯示用 |

---

## 檔案參照

| 檔案 | 說明 |
|------|------|
| [`themeColorSettings.ts`](file:///C:/%E6%9A%AB%E5%AD%98/Antigravity/%E8%9C%A5%E6%97%A5%E6%97%A5%E8%A8%98/src/theme/themeColorSettings.ts) | 色票定義 + 變體 Token 映射 |
| [`themeSettings.ts`](file:///C:/%E6%9A%AB%E5%AD%98/Antigravity/%E8%9C%A5%E6%97%A5%E6%97%A5%E8%A8%98/src/theme/themeSettings.ts) | 彙整並匯出 `getThemeTokens()` |
| [`ThemeContext.tsx`](file:///C:/%E6%9A%AB%E5%AD%98/Antigravity/%E8%9C%A5%E6%97%A5%E6%97%A5%E8%A8%98/src/theme/ThemeContext.tsx) | React Context，提供 `themeId` |
| [`_layout.tsx`](file:///C:/%E6%9A%AB%E5%AD%98/Antigravity/%E8%9C%A5%E6%97%A5%E6%97%A5%E8%A8%98/app/_layout.tsx) | 根佈局，設定面板底色 `overlayColor` |
