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
  temp: { current: '31℃', avg: '31℃', high: '33℃', low: '30℃', updatedAt: '2025/07/30' },
  humid: { current: '30%', avg: '30%', high: '31%', low: '28%', updatedAt: '2025/07/30' },
  bask: { description: '日照', value: '30分鐘', updatedAt: '2025/07/17' },
  feed: { description: '飲食', value: '蟋蟀10隻+高麗菜0.5片', updatedAt: '2025/07/17' },
  bath: { description: '泡澡', value: '溫水泡澡15分鐘', updatedAt: '2025/07/17' },
  poop: { description: '排便', value: '正常排便', updatedAt: '2025/07/13' },
  weight: { description: '體重', value: '415公克', updatedAt: '2025/07/05' },
  length: { description: '身長', value: '44公分', updatedAt: '2025/07/01' },
};

// ===== 日記檢視頁面的假日記資料 =====
export const mockDiaryRecord: DiaryRecord = {
  id: 1,
  petName: 'DELETE',
  date: '2025-07-17',
  dateStr: 'THU  7/17/2025',
  temp: '31',
  humid: '30',
  bask: '30',
  feed: '蟋蟀10隻+高麗菜0.5片',
  appetite: 3,
  bath: '15',
  poop: '無',
  weight: '415',
  length: '44',
};

// ===== 圖表假資料 =====

// 1. 溫度資料 (單位：度C，合理範圍 25-35，Y軸範圍 10-40)
export const mockTempDataMap: ChartDataMap = {
  '日': [
    { label: '00', val: 26 },
    { label: '04', val: 25 },
    { label: '08', val: 28 },
    { label: '12', val: 38, isAbnormal: 'high' },
    { label: '16', val: 32 },
    { label: '20', val: 29 },
    { label: '24', val: 18, isAbnormal: 'low' },
  ],
  '週': [
    { label: '一', val: 30 },
    { label: '二', val: 31 },
    { label: '三', val: 22, isAbnormal: 'low' },
    { label: '四', val: 30 },
    { label: '五', val: 36, isAbnormal: 'high' },
    { label: '六', val: 32 },
    { label: '日', val: 31 },
  ],
  '月': [
    { label: '1', val: 30 },
    { label: '5', val: 31 },
    { label: '10', val: 32 },
    { label: '15', val: 28 },
    { label: '20', val: 29 },
    { label: '25', val: 30 },
    { label: '30', val: 33 },
  ],
  '年': [
    { label: '1月', val: 22, isAbnormal: 'low' },
    { label: '3月', val: 25 },
    { label: '5月', val: 30 },
    { label: '7月', val: 36, isAbnormal: 'high' },
    { label: '9月', val: 32 },
    { label: '11月', val: 26 },
  ],
};

// 2. 濕度資料 (單位：%，合理範圍 40-70)
export const mockHumidDataMap: ChartDataMap = {
  '日': [
    { label: '00', val: 65 },
    { label: '04', val: 70 },
    { label: '08', val: 60 },
    { label: '12', val: 45 },
    { label: '16', val: 40 },
    { label: '20', val: 55 },
    { label: '24', val: 65 },
  ],
  '週': [
    { label: '一', val: 55 },
    { label: '二', val: 50 },
    { label: '三', val: 90, isAbnormal: 'high' },
    { label: '四', val: 60 },
    { label: '五', val: 55 },
    { label: '六', val: 45 },
    { label: '日', val: 25, isAbnormal: 'low' },
  ],
  '月': [
    { label: '1', val: 50 },
    { label: '5', val: 55 },
    { label: '10', val: 60 },
    { label: '15', val: 55 },
    { label: '20', val: 50 },
    { label: '25', val: 45 },
    { label: '30', val: 50 },
  ],
  '年': [
    { label: '1月', val: 45 },
    { label: '3月', val: 55 },
    { label: '5月', val: 80, isAbnormal: 'high' },
    { label: '7月', val: 65 },
    { label: '9月', val: 55 },
    { label: '11月', val: 50 },
  ],
};

// 3. 日照資料 (單位：小時，每日合理範圍 2-8小時)
export const mockBaskDataMap: ChartDataMap = {
  '日': [
    { label: '00', val: 0 },
    { label: '04', val: 0 },
    { label: '08', val: 1.5 },
    { label: '12', val: 2.5 },
    { label: '16', val: 2 },
    { label: '20', val: 0 },
    { label: '24', val: 0 },
  ],
  '週': [
    { label: '一', val: 4 },
    { label: '二', val: 3.5 },
    { label: '三', val: 1, isAbnormal: 'low' },
    { label: '四', val: 5 },
    { label: '五', val: 4.5 },
    { label: '六', val: 6 },
    { label: '日', val: 5.5 },
  ],
  '月': [
    { label: '1', val: 4 },
    { label: '5', val: 4.5 },
    { label: '10', val: 3 },
    { label: '15', val: 5 },
    { label: '20', val: 4 },
    { label: '25', val: 5.5 },
    { label: '30', val: 4 },
  ],
  '年': [
    { label: '1月', val: 2.5 },
    { label: '3月', val: 4 },
    { label: '5月', val: 3 },
    { label: '7月', val: 6 },
    { label: '9月', val: 5 },
    { label: '11月', val: 3 },
  ],
};

// 4. 體重資料 (單位：克，合理範圍 300-500)
export const mockWeightDataMap: ChartDataMap = {
  '日': [
    { label: '00', val: 410 },
    { label: '04', val: 410 },
    { label: '08', val: 412 },
    { label: '12', val: 415 },
    { label: '16', val: 418 },
    { label: '20', val: 415 },
    { label: '24', val: 412 },
  ],
  '週': [
    { label: '一', val: 410 },
    { label: '二', val: 412 },
    { label: '三', val: 415 },
    { label: '四', val: 416 },
    { label: '五', val: 414 },
    { label: '六', val: 415 },
    { label: '日', val: 418 },
  ],
  '月': [
    { label: '1', val: 405 },
    { label: '5', val: 408 },
    { label: '10', val: 410 },
    { label: '15', val: 412 },
    { label: '20', val: 415 },
    { label: '25', val: 418 },
    { label: '30', val: 420 },
  ],
  '年': [
    { label: '1月', val: 350 },
    { label: '3月', val: 370 },
    { label: '5月', val: 390 },
    { label: '7月', val: 410 },
    { label: '9月', val: 425 },
    { label: '11月', val: 440 },
  ],
};

// 5. 身長資料 (單位：公分，合理範圍 0-50cm)
export const mockLengthDataMap: ChartDataMap = {
  '週': [
    { label: '一', val: 45.0 },
    { label: '二', val: 45.0 },
    { label: '三', val: 45.1 },
    { label: '四', val: 45.1 },
    { label: '五', val: 45.1 },
    { label: '六', val: 45.2 },
    { label: '日', val: 45.2 },
  ],
  '月': [
    { label: '1', val: 44.5 },
    { label: '5', val: 44.6 },
    { label: '10', val: 44.8 },
    { label: '15', val: 45.0 },
    { label: '20', val: 45.1 },
    { label: '25', val: 45.2 },
    { label: '30', val: 45.5 },
  ],
  '年': [
    { label: '1月', val: 30 },
    { label: '3月', val: 35 },
    { label: '5月', val: 40 },
    { label: '7月', val: 43 },
    { label: '9月', val: 45 },
    { label: '11月', val: 48 },
  ],
};

// 6. 泡澡資料 (單位：分鐘)
export const mockBathDataMap: ChartDataMap = {
  '日': [
    { label: '00', val: 0 },
    { label: '04', val: 0 },
    { label: '08', val: 15 },
    { label: '12', val: 0 },
    { label: '16', val: 0 },
    { label: '20', val: 10 },
    { label: '24', val: 0 },
  ],
  '週': [
    { label: '一', val: 15 },
    { label: '二', val: 0 },
    { label: '三', val: 20 },
    { label: '四', val: 0 },
    { label: '五', val: 15 },
    { label: '六', val: 30 },
    { label: '日', val: 25 },
  ],
  '月': [
    { label: '1', val: 15 },
    { label: '5', val: 20 },
    { label: '10', val: 10 },
    { label: '15', val: 15 },
    { label: '20', val: 30 },
    { label: '25', val: 15 },
    { label: '30', val: 20 },
  ],
  '年': [
    { label: '1月', val: 15 },
    { label: '3月', val: 20 },
    { label: '5月', val: 15 },
    { label: '7月', val: 30 },
    { label: '9月', val: 20 },
    { label: '11月', val: 15 },
  ],
};

// 7. 飲食資料 (食慾變化圖，Y軸範圍1-5，X軸為日期)
export const mockFeedDataMap: ChartDataMap = {
  '週': [
    { label: '4/1', val: 3 },
    { label: '4/5', val: 5 },
    { label: '4/15', val: 2, isAbnormal: 'low' },
    { label: '4/18', val: 4 },
    { label: '4/25', val: 4 },
    { label: '4/28', val: 5 },
    { label: '4/30', val: 3 },
  ],
  '月': [
    { label: '1月', val: 3 },
    { label: '2月', val: 4 },
    { label: '3月', val: 5 },
    { label: '4月', val: 4 },
    { label: '5月', val: 2, isAbnormal: 'low' },
    { label: '6月', val: 5 },
    { label: '7月', val: 4 },
  ],
  '年': [
    { label: '2023', val: 4 },
    { label: '2024', val: 3 },
    { label: '2025', val: 5 },
  ],
};

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
  if (month % 2 === 0) {
    return [3, 7, 14, 19, 21, 28];
  } else {
    return [2, 5, 8, 12, 15, 18, 22, 25, 28];
  }
};

// 9. 蛻皮日曆事件
export const getMockMoltEvents = (month: number): number[] => {
  if (month % 2 === 0) {
    return [5, 20];
  } else {
    return [10, 25];
  }
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

export const mockReminderDB: Record<string, ReminderDBItem> = {
  '1': {
    id: '1',
    type: '餵食',
    freq: '每天',
    frequencyType: 'daily',
    time: '12:00',
    pets: ['1', '2'],
    note: '食物添加維生素',
    isOn: true,
    tagColor: '#FFD239',
  },
  '2': {
    id: '2',
    type: '換水',
    freq: '每3天',
    frequencyType: 'everyN',
    everyNDays: '3',
    startDate: '2025/05/11',
    time: '08:30',
    pets: ['1'],
    note: '',
    isOn: true,
    tagColor: '#5CD85A',
  },
  '3': {
    id: '3',
    type: '驅蟲',
    freq: '每週(六)',
    frequencyType: 'weekly',
    selectedWeekDays: [6],
    time: '20:00',
    pets: ['3'],
    note: '注意劑量',
    isOn: false,
    tagColor: '#FF6B6B',
  },
  '4': {
    id: '4',
    type: '泡澡',
    freq: '每天',
    frequencyType: 'daily',
    time: '10:00',
    pets: ['1'],
    note: '溫水15分鐘',
    isOn: true,
    tagColor: '#32ADE6',
  },
  '5': {
    id: '5',
    type: '日照',
    freq: '每天',
    frequencyType: 'daily',
    time: '14:00',
    pets: ['1', '2'],
    note: '30分鐘',
    isOn: true,
    tagColor: '#FFCA29',
  },
  '6': {
    id: '6',
    type: '量體重',
    freq: '每週(日)',
    frequencyType: 'weekly',
    selectedWeekDays: [0],
    time: '09:00',
    pets: ['2'],
    note: '',
    isOn: true,
    tagColor: '#AF52DE',
  },
  '7': {
    id: '7',
    type: '清理飼養箱',
    freq: '每週(六)',
    frequencyType: 'weekly',
    selectedWeekDays: [6],
    time: '16:00',
    pets: ['3', '4'],
    note: '',
    isOn: true,
    tagColor: '#FF3B30',
  },
};

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
