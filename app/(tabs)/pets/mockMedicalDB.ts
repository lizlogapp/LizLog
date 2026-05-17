export const mockMedicalDB: Record<string, any> = {
  '1': {
    id: '1',
    title: '皮膚問題回診',
    date: '2024.11.15',
    type: '一般回診',
    hospital: '布達佩斯動物醫院',
    note: '測量體重、檢查糞便寄生蟲，開了兩週的驅蟲藥，建議每兩週回診追蹤。',
    tagColor: '#FF6B6B', // Changed to unified colors
    visit: {
      date: '2025年5月4日 SUN',
      hospital: '侏羅紀野生動物專科醫院',
      doctor: '朱哲助 院長',
      reason: '最近發現 Delete 的下巴和前肢連接處，出現小範圍的皮屑和泛紅，且有輕微抓癢的行為。食慾和活動力正常，但為求謹慎就診檢查。',
      diagnosis: '經過皮膚鏡檢後，初步判斷為輕微的黴菌感染，可能是由於近期梅雨季節，環境濕度偏高所引起。狀況不嚴重，透過外用藥物治療即可。',
      advice: [
        '1. 每日使用開立的藥膏，早晚各一次，薄擦於患部，持續一週。',
        '2. 保持飼養箱環境絕對乾燥、通風，建議增加除濕機使用頻率。',
        '3. 暫停泡澡，避免患部擴散。',
        '4. 密切觀察皮膚範圍是否有擴大或顏色加深的狀況。',
        '5. 預約 10 天後回診，追蹤復原狀況。'
      ],
      images: [require('../../../assets/user-uploads/lizard-007.jpg')],
    },
    medication: {
      startDate: '2025年5月4日',
      endDate: '2025年5月11日',
      medicine: '黴菌靈外用藥膏',
      method: '外部塗抹',
      frequency: '每日 2 次',
      dosage: '取約一顆米粒大小，薄擦於患部皮膚。',
      note: [
        '1. 塗抹後 15 分鐘內，盡量避免寵物舔舐患部。',
        '2. 請存放於陰涼乾燥處，避免陽光直射。',
        '3. 此為外用藥，切勿口服。'
      ]
    }
  },
  '2': {
    id: '2',
    title: '年度健康檢查',
    date: '2024.10.01',
    type: '健康檢查',
    hospital: '侏羅紀野生動物專科醫院',
    note: 'X光檢查骨骼發育正常，血檢數值皆在標準範圍內。',
    tagColor: '#5CD85A',
    visit: {
      date: '2024年10月1日 TUE',
      hospital: '侏羅紀野生動物專科醫院',
      doctor: '朱哲助 院長',
      reason: '例行性年度健康檢查。',
      diagnosis: 'X光檢查骨骼發育正常，血檢數值皆在標準範圍內。整體健康狀況良好。',
      advice: [
        '1. 繼續保持目前的飲食與光照計畫。',
        '2. 注意冬季保溫。'
      ],
      images: [],
    },
    medication: {
      startDate: '',
      endDate: '',
      medicine: '無',
      method: '-',
      frequency: '-',
      dosage: '-',
      note: []
    }
  }
};
