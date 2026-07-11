/**
 * 共用假資料中心 (Mock Data Store)
 * 
 * 所有日記紀錄、分析圖表、最新狀態紀錄頁面都從這裡讀取數據。
 * 未來串接 Supabase / SQLite 時，只需將此檔案中的靜態資料
 * 替換為 API 呼叫，即可實現全站數據同步。
 */

// ===== 型別定義 =====
export interface ChartDataPoint {
  label: string;
  val: number;
  isAbnormal?: 'high' | 'low';
}

export type TimeRange = '日' | '週' | '月' | '年';

export interface ChartDataMap {
  [key: string]: ChartDataPoint[];
}

export interface DiaryRecord {
  id: number;
  petName: string;
  date: string;        // ISO 格式日期
  dateStr: string;     // 顯示用格式
  temp: string;        // 溫度
  humid: string;       // 濕度
  bask: string;        // 日照（分鐘）
  feed: string;        // 飲食內容
  appetite: number;    // 食慾 1-5
  bath: string;        // 泡澡（分鐘）
  poop: string;        // 排便 '無' | '有'
  weight: string;      // 體重
  length: string;      // 身長
}

export interface LatestStatus {
  temp: { current: string; avg: string; high: string; low: string; updatedAt: string };
  humid: { current: string; avg: string; high: string; low: string; updatedAt: string };
  bask: { description: string; value: string; updatedAt: string };
  feed: { description: string; value: string; updatedAt: string };
  bath: { description: string; value: string; updatedAt: string };
  poop: { description: string; value: string; updatedAt: string };
  weight: { description: string; value: string; updatedAt: string };
  length: { description: string; value: string; updatedAt: string };
}

// ===== 最新狀態紀錄（「分析」頁面的展開卡片） =====
export const mockLatestStatus: LatestStatus = {
  temp: { current: '-', avg: '-', high: '-', low: '-', updatedAt: '-' },
  humid: { current: '-', avg: '-', high: '-', low: '-', updatedAt: '-' },
  bask: { description: '日照', value: '-', updatedAt: '-' },
  feed: { description: '飲食', value: '-', updatedAt: '-' },
  bath: { description: '泡澡', value: '-', updatedAt: '-' },
  poop: { description: '排便', value: '-', updatedAt: '-' },
  weight: { description: '體重', value: '-', updatedAt: '-' },
  length: { description: '身長', value: '-', updatedAt: '-' },
};

// ===== 日記檢視頁面的假日記資料 =====
export const mockDiaryRecord: DiaryRecord = {
  id: 0,
  petName: '-',
  date: '-',
  dateStr: '-',
  temp: '-',
  humid: '-',
  bask: '-',
  feed: '-',
  appetite: 0,
  bath: '-',
  poop: '-',
  weight: '-',
  length: '-',
};

// ===== 圖表假資料 =====

// 1. 溫度資料 (單位：度C，合理範圍 25-35，Y軸範圍 10-40)
export const mockTempDataMap: ChartDataMap = { '日': [], '週': [], '月': [], '年': [] };

// 2. 濕度資料 (單位：%，合理範圍 40-70)
export const mockHumidDataMap: ChartDataMap = { '日': [], '週': [], '月': [], '年': [] };

// 3. 日照資料 (單位：小時，每日合理範圍 2-8小時)
export const mockBaskDataMap: ChartDataMap = { '日': [], '週': [], '月': [], '年': [] };

// 4. 體重資料 (單位：克，合理範圍 300-500)
export const mockWeightDataMap: ChartDataMap = { '日': [], '週': [], '月': [], '年': [] };

// 5. 身長資料 (單位：公分，合理範圍 0-50cm)
export const mockLengthDataMap: ChartDataMap = { '日': [], '週': [], '月': [], '年': [] };

// 6. 泡澡資料 (單位：分鐘)
export const mockBathDataMap: ChartDataMap = { '日': [], '週': [], '月': [], '年': [] };

// 7. 飲食資料 (食慾變化圖，Y軸範圍1-5，X軸為日期)
export const mockFeedDataMap: ChartDataMap = { '日': [], '週': [], '月': [], '年': [] };

export const addFeedData = (dateLabel: string, val: number) => {
  if (val > 0) {
    mockFeedDataMap['週'].push({ label: dateLabel, val, isAbnormal: val <= 2 ? 'low' : undefined });
    // 保持最多顯示最近的 7 筆數據，避免超出圖表範圍
    if (mockFeedDataMap['週'].length > 7) {
      mockFeedDataMap['週'].shift();
    }
  }
};

// 8. 排便日曆事件 (模擬不同月份的事件)
export const getMockPoopEvents = (month: number): number[] => {
  return [];
};

// 9. 蛻皮日曆事件
export const getMockMoltEvents = (month: number): number[] => {
  return [];
};

// ===== 食慾數值轉文字 =====
export const appetiteToLabel = (value: number): string => {
  switch (value) {
    case 1: return '差';
    case 2: return '偏差';
    case 3: return '普通';
    case 4: return '偏好';
    case 5: return '好';
    default: return '普通';
  }
};

// ===== 提醒資料庫（共用，寵物提醒頁 & 首頁提醒共讀） =====
export const petIdToName: Record<string, string> = {
  '1': 'DELETE',
  '2': 'CTRL',
  '3': 'ENTER',
  '4': 'ALT',
};

export interface ReminderDBItem {
  id: string;
  type: string;
  freq: string;
  frequencyType: string;
  time: string;
  pets: string[];       // pet IDs
  note: string;
  isOn: boolean;
  tagColor: string;
  everyNDays?: string;
  startDate?: string;
  selectedWeekDays?: number[];
}

export const mockReminderDB: Record<string, ReminderDBItem> = {};

// ===== 首頁當日提醒（從 mockReminderDB 衍生） =====
export interface ReminderItem {
  id: string;
  pets: string[];    // 寵物名稱（非 ID）
  title: string;
  date: string;
  tagColor: string;
  checked: boolean;
}

/**
 * 從 mockReminderDB 衍生出首頁可顯示的提醒列表
 * 只回傳已啟用 (isOn) 的提醒
 */
export const getTodayReminders = (): ReminderItem[] => {
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;

  return Object.values(mockReminderDB)
    .filter(r => r.isOn)
    .map(r => ({
      id: r.id,
      pets: r.pets.map(pid => petIdToName[pid] || pid),
      title: r.type + (r.note ? `（${r.note}）` : ''),
      date: dateStr,
      tagColor: r.tagColor,
      checked: false,
    }));
};

// 向下相容：靜態匯出
export const mockTodayReminders: ReminderItem[] = getTodayReminders();
