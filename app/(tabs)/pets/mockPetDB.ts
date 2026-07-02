// 模擬寵物詳細資料庫
export interface PetData {
  id: string;
  name: string;
  species: string;
  birthDate: string; // ISO string 或 YYYY/MM/DD
  homeDate?: string;
  gender?: string;
  tag: string;
  imageUri: any;
  weight: string;
  length: string;
  nextReminder: string;
  reminderNote: string;
  lastVisit: string;
}

export const mockPetDB: Record<string, PetData> = {
  '1': {
    id: '1',
    name: 'DELETE',
    species: '鬆獅蜥',
    birthDate: '2022/07/01',
    homeDate: '2022/08/01',
    gender: '男生',
    tag: '睡姿奇葩',
    imageUri: require('../../../assets/user-uploads/lizard-001.jpg'),
    weight: '415 g',
    length: '44 cm',
    nextReminder: '明天　10:00',
    reminderNote: '食物添加維生素',
    lastVisit: '5個月前',
  },
  '2': {
    id: '2',
    name: 'CTRL',
    species: '鬆獅蜥',
    birthDate: '2024/12/01',
    homeDate: '2024/12/15',
    gender: '女生',
    tag: '吃貨擔當',
    imageUri: require('../../../assets/user-uploads/lizard-003.jpg'),
    weight: '280 g',
    length: '32 cm',
    nextReminder: '後天　09:00',
    reminderNote: '驅蟲藥',
    lastVisit: '2個月前',
  },
  '3': {
    id: '3',
    name: 'ENTER',
    species: '鬆獅蜥',
    birthDate: '2024/02/01',
    homeDate: '2024/02/20',
    gender: '男生',
    tag: '小太陽',
    imageUri: require('../../../assets/user-uploads/lizard-005.jpg'),
    weight: '320 g',
    length: '35 cm',
    nextReminder: '下週一　14:00',
    reminderNote: '健檢',
    lastVisit: '1個月前',
  },
  '4': {
    id: '4',
    name: 'ALT',
    species: '鬆獅蜥',
    birthDate: '2023/10/01',
    homeDate: '2023/11/01',
    gender: '未知',
    tag: '探險家',
    imageUri: require('../../../assets/user-uploads/lizard-007.jpg'),
    weight: '350 g',
    length: '38 cm',
    nextReminder: '週五　11:00',
    reminderNote: '補鈣粉',
    lastVisit: '3個月前',
  },
};

export const updatePetData = (id: string, updates: Partial<PetData>) => {
  if (mockPetDB[id]) {
    mockPetDB[id] = { ...mockPetDB[id], ...updates };
  }
};

export const deletePetData = (id: string) => {
  delete mockPetDB[id];
};
