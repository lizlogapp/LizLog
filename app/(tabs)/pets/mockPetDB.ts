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

export const mockPetDB: Record<string, PetData> = {};

export const updatePetData = (id: string, updates: Partial<PetData>) => {
  if (mockPetDB[id]) {
    mockPetDB[id] = { ...mockPetDB[id], ...updates };
  }
};

export const deletePetData = (id: string) => {
  delete mockPetDB[id];
};
