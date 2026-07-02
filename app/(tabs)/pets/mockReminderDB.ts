export const mockReminderDB: Record<string, any> = {
  '1': {
    id: '1',
    type: '餵食',
    freq: '每天',
    frequencyType: 'daily',
    time: '12:00',
    pets: ['1', '2'], // IDs from petList ['DELETE', 'CTRL']
    note: '食物添加維生素',
    isOn: true,
    tagColor: '#FFD239'
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
    tagColor: '#5CD85A'
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
    tagColor: '#FF6B6B'
  },
};
