import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { mockReminderDB } from '../../../src/data/mockDiaryData';
import { useAuth } from '../../../src/contexts/AuthContext';
import { reminderService, petService, PetDoc } from '../../../src/services/firestoreService';

const defaultTypes = ['餵食', '換水', '清掃', '用藥', '驅蟲', '回診'];
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
type Frequency = 'once' | 'daily' | 'everyN' | 'weekly';

const tagColors = ['#FF6B6B', '#FF9F43', '#FFD239', '#5CD85A', '#4DB8FF', '#B072FF', '#8E8E93'];

// 模擬寵物名單（Demo 模式）
const mockPetList = [
  { id: '1', name: 'DELETE' },
  { id: '2', name: 'CTRL' },
  { id: '3', name: 'ENTER' },
  { id: '4', name: 'ALT' },
];

const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m - 1, 1).getDay();

export default function AddReminderScreen() {
  const router = useRouter();
  const { id, reminderId } = useLocalSearchParams<{ id: string; reminderId: string }>();
  const { themeId, fontFamilyName, isDemoMode } = useTheme();
  const theme = getThemeTokens(themeId);
  const { user } = useAuth();

  // 寵物名單
  const [petList, setPetList] = useState<{ id: string; name: string }[]>(mockPetList);

  useEffect(() => {
    if (isDemoMode) {
      setPetList(mockPetList);
    } else if (user) {
      petService.getAll(user.uid).then(pets => {
        setPetList(pets.map(p => ({ id: p.id, name: p.name })));
      });
    }
  }, [isDemoMode, user]);

  const currentPet = petList.find(p => p.id === (id || '1')) || petList[0] || { id: id || '1', name: 'Pet' };
  const [selectedPets, setSelectedPets] = useState<string[]>([currentPet.id]);

  const togglePet = (petId: string) => {
    setSelectedPets(prev =>
      prev.includes(petId)
        ? prev.filter(p => p !== petId)
        : [...prev, petId]
    );
  };

  // 類型
  const [selectedType, setSelectedType] = useState('');
  const [customType, setCustomType] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // 標籤顏色
  const [tagColor, setTagColor] = useState(tagColors[0]);

  // 頻率
  const [frequency, setFrequency] = useState<Frequency>('once');
  const [everyNDays, setEveryNDays] = useState('2');
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');

  // 時間
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');

  // 備註
  const [note, setNote] = useState('');

  // 日曆彈窗
  const [showCalendar, setShowCalendar] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth() + 1);

  const toggleWeekDay = (idx: number) => {
    setSelectedWeekDays(prev =>
      prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
    );
  };

  // 預填資料 (如果是編輯模式)
  useEffect(() => {
    if (reminderId && mockReminderDB[reminderId]) {
      const data = mockReminderDB[reminderId];
      setSelectedPets(data.pets || []);
      
      if (defaultTypes.includes(data.type)) {
        setSelectedType(data.type);
        setIsAddingCustom(false);
      } else {
        setSelectedType('');
        setIsAddingCustom(true);
        setCustomType(data.type);
      }

      setTagColor(data.tagColor || tagColors[0]);
      setFrequency((data.frequencyType as Frequency) || 'once');
      if (data.everyNDays) setEveryNDays(data.everyNDays);
      if (data.startDate) setStartDate(data.startDate);
      if (data.selectedWeekDays) setSelectedWeekDays(data.selectedWeekDays);

      if (data.time) {
        const [h, m] = data.time.split(':');
        setHour(h);
        setMinute(m);
      }
      setNote(data.note || '');
    }
  }, [reminderId]);

  const handleSave = () => {
    const finalType = isAddingCustom ? customType : selectedType;
    const finalTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    let finalFreq = '';
    if (frequency === 'once') finalFreq = '單次';
    else if (frequency === 'daily') finalFreq = '每天';
    else if (frequency === 'everyN') finalFreq = `每${everyNDays}天`;
    else if (frequency === 'weekly') {
      const wDays = selectedWeekDays.map(d => weekDays[d]).join('、');
      finalFreq = `每週(${wDays})`;
    }

    const newData = {
      petId: id || selectedPets[0] || '1',
      type: finalType,
      freq: finalFreq,
      frequencyType: frequency,
      everyNDays,
      startDate,
      selectedWeekDays,
      time: finalTime,
      pets: selectedPets,
      note,
      isOn: true,
      tagColor,
    };

    if (isDemoMode) {
      const mockData = { id: reminderId || Date.now().toString(), ...newData };
      mockReminderDB[mockData.id] = mockData;
      router.navigate({ pathname: '/(tabs)/pets/reminder', params: { id: id || '1' } });
    } else if (user) {
      if (reminderId) {
        reminderService.update(user.uid, reminderId, newData).then(() => {
          router.navigate({ pathname: '/(tabs)/pets/reminder', params: { id: id || '1' } });
        });
      } else {
        reminderService.add(user.uid, newData).then(() => {
          router.navigate({ pathname: '/(tabs)/pets/reminder', params: { id: id || '1' } });
        });
      }
    }
  };

  const freqOptions: { key: Frequency; label: string }[] = [
    { key: 'once', label: '單次' },
    { key: 'daily', label: '每天' },
    { key: 'everyN', label: '每N天' },
    { key: 'weekly', label: '每週' },
  ];

  const labelStyle = [styles.fieldLabel, { color: theme.primary, fontFamily: fontFamilyName }];

  const handleColorTabPress = () => {
    const currentIndex = tagColors.indexOf(tagColor);
    const nextIndex = (currentIndex + 1) % tagColors.length;
    setTagColor(tagColors[nextIndex]);
  };

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => router.navigate({ pathname: '/(tabs)/pets/reminder', params: { id: id || '1' } }) },
            { id: 'confirm', onPress: handleSave },
          ]}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 主表單卡片 */}
        <View style={[styles.formCard, { backgroundColor: theme.background }]}>
          {/* 左側色帶 (點擊切換顏色) */}
          <Pressable 
            style={[styles.colorTab, { backgroundColor: tagColor }]} 
            onPress={handleColorTabPress}
          />

          {/* ========== 要提醒的寵物 ========== */}
          <Text style={labelStyle}>要提醒的寵物</Text>
          <View style={styles.chipRow}>
            {petList.map(pet => (
              <Pressable
                key={pet.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selectedPets.includes(pet.id) ? theme.primary : 'transparent',
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => togglePet(pet.id)}
              >
                <Text style={[styles.chipText, {
                  color: selectedPets.includes(pet.id) ? theme.background : theme.primary,
                  fontFamily: fontFamilyName,
                }]}>{pet.name}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.divider} />

          {/* ========== 類型 ========== */}
          <Text style={labelStyle}>類型</Text>
          <View style={styles.chipRow}>
            {defaultTypes.map(t => (
              <Pressable
                key={t}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selectedType === t ? theme.primary : 'transparent',
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => { setSelectedType(t); setIsAddingCustom(false); }}
              >
                <Text style={[styles.chipText, {
                  color: selectedType === t ? theme.background : theme.primary,
                  fontFamily: fontFamilyName,
                }]}>{t}</Text>
              </Pressable>
            ))}
            {/* +新增 */}
            <Pressable
              style={[
                styles.chip,
                {
                  backgroundColor: isAddingCustom ? theme.primary : 'transparent',
                  borderColor: theme.primary,
                },
              ]}
              onPress={() => { setIsAddingCustom(true); setSelectedType(''); }}
            >
              <Text style={[styles.chipText, {
                color: isAddingCustom ? theme.background : theme.primary,
                fontFamily: fontFamilyName,
              }]}>＋新增</Text>
            </Pressable>
          </View>
          {isAddingCustom && (
            <TextInput
              style={[styles.customInput, { color: theme.text, fontFamily: fontFamilyName, borderColor: theme.primary + '40' }]}
              placeholder="輸入自定義類型"
              placeholderTextColor={paletteColors.XUAN_RI + '60'}
              value={customType}
              onChangeText={setCustomType}
              autoFocus
            />
          )}

          <View style={styles.divider} />

          {/* ========== 頻率 ========== */}
          <Text style={labelStyle}>頻率</Text>
          <View style={styles.chipRow}>
            {freqOptions.map(f => (
              <Pressable
                key={f.key}
                style={[
                  styles.chip,
                  {
                    backgroundColor: frequency === f.key ? theme.primary : 'transparent',
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => setFrequency(f.key)}
              >
                <Text style={[styles.chipText, {
                  color: frequency === f.key ? theme.background : theme.primary,
                  fontFamily: fontFamilyName,
                }]}>{f.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* 每N天 → 輸入天數 + 起始日期 */}
          {frequency === 'everyN' && (
            <View style={styles.subSection}>
              <View style={styles.everyNRow}>
                <Text style={[styles.subLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>每</Text>
                <TextInput
                  style={[styles.nInput, { color: theme.text, fontFamily: fontFamilyName, borderColor: theme.primary }]}
                  value={everyNDays}
                  onChangeText={setEveryNDays}
                  keyboardType="number-pad"
                  maxLength={3}
                  textAlign="center"
                />
                <Text style={[styles.subLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>天</Text>
              </View>

              <View style={styles.dateRow}>
                <Text style={[styles.subLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>起始日期</Text>
                <Pressable
                  style={[styles.dateButton, { borderColor: theme.primary }]}
                  onPress={() => setShowCalendar(true)}
                >
                  <Text style={[styles.dateText, {
                    color: startDate ? theme.text : theme.text + '60',
                    fontFamily: fontFamilyName,
                  }]}>
                    {startDate || '選擇日期'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* 每週 → 星期選擇 */}
          {frequency === 'weekly' && (
            <View style={styles.subSection}>
              <View style={styles.weekDaysRow}>
                {weekDays.map((day, idx) => (
                  <Pressable
                    key={idx}
                    style={[
                      styles.weekDayBtn,
                      {
                        backgroundColor: selectedWeekDays.includes(idx) ? theme.primary : 'transparent',
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => toggleWeekDay(idx)}
                  >
                    <Text style={[styles.weekDayText, {
                      color: selectedWeekDays.includes(idx) ? theme.background : theme.primary,
                      fontFamily: fontFamilyName,
                    }]}>{day}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* ========== 時間 ========== */}
          <Text style={labelStyle}>時間</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={[styles.timeInput, { color: theme.text, fontFamily: fontFamilyName, borderColor: theme.primary }]}
              value={hour}
              onChangeText={setHour}
              keyboardType="number-pad"
              maxLength={2}
              textAlign="center"
            />
            <Text style={[styles.timeColon, { color: theme.primary, fontFamily: fontFamilyName }]}>:</Text>
            <TextInput
              style={[styles.timeInput, { color: theme.text, fontFamily: fontFamilyName, borderColor: theme.primary }]}
              value={minute}
              onChangeText={setMinute}
              keyboardType="number-pad"
              maxLength={2}
              textAlign="center"
            />
          </View>

          <View style={styles.divider} />

          {/* ========== 備註 ========== */}
          <View style={styles.noteRow}>
            <Text style={labelStyle}>備註</Text>
            <TextInput
              style={[styles.noteInput, { color: theme.text, fontFamily: fontFamilyName, borderBottomColor: theme.text + '20' }]}
              placeholder="食物添加維生素"
              placeholderTextColor={theme.text + '40'}
              value={note}
              onChangeText={setNote}
            />
          </View>
        </View>
      </ScrollView>

      {/* ========== 日曆 Modal ========== */}
      <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCalendar(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.background }]} onPress={e => e.stopPropagation()}>
            {/* 年月導覽 */}
            <View style={styles.yearMonthNav}>
              <View style={styles.navGroup}>
                <Pressable onPress={() => setPickerYear(y => y - 1)}>
                  <Text style={[styles.navArrow, { color: theme.primary }]}>◀</Text>
                </Pressable>
                <Text style={[styles.ymText, { color: theme.primary, fontFamily: fontFamilyName }]}>{pickerYear}年</Text>
                <Pressable onPress={() => setPickerYear(y => y + 1)}>
                  <Text style={[styles.navArrow, { color: theme.primary }]}>▶</Text>
                </Pressable>
              </View>
              <View style={styles.navGroup}>
                <Pressable onPress={() => {
                  if (pickerMonth === 1) { setPickerYear(y => y - 1); setPickerMonth(12); }
                  else { setPickerMonth(m => m - 1); }
                }}>
                  <Text style={[styles.navArrow, { color: theme.primary }]}>◀</Text>
                </Pressable>
                <Text style={[styles.ymText, { color: theme.primary, fontFamily: fontFamilyName }]}>{pickerMonth}月</Text>
                <Pressable onPress={() => {
                  if (pickerMonth === 12) { setPickerYear(y => y + 1); setPickerMonth(1); }
                  else { setPickerMonth(m => m + 1); }
                }}>
                  <Text style={[styles.navArrow, { color: theme.primary }]}>▶</Text>
                </Pressable>
              </View>
            </View>

            {/* 星期標頭 */}
            <View style={styles.calWeekRow}>
              {['日','一','二','三','四','五','六'].map(d => (
                <Text key={d} style={[styles.calWeekText, { color: theme.primary, fontFamily: fontFamilyName }]}>{d}</Text>
              ))}
            </View>

            {/* 日期格子 */}
            {(() => {
              const daysInMonth = getDaysInMonth(pickerYear, pickerMonth);
              const firstDay = getFirstDayOfMonth(pickerYear, pickerMonth);
              const totalCells = firstDay + daysInMonth;
              const rows = Math.ceil(totalCells / 7);
              return Array.from({ length: rows }).map((_, rowIdx) => (
                <View key={rowIdx} style={styles.calWeekRow}>
                  {Array.from({ length: 7 }).map((_, colIdx) => {
                    const cellIdx = rowIdx * 7 + colIdx;
                    const dayNum = cellIdx - firstDay + 1;
                    const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                    return (
                      <View key={colIdx} style={styles.calDayCell}>
                        {isValid && (
                          <Pressable
                            style={styles.calDayBtn}
                            onPress={() => {
                              const mm = String(pickerMonth).padStart(2, '0');
                              const dd = String(dayNum).padStart(2, '0');
                              setStartDate(`${pickerYear}/${mm}/${dd}`);
                              setShowCalendar(false);
                            }}
                          >
                            <Text style={[styles.calDayText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                              {dayNum}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              ));
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },

  // 主卡片
  formCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: '#FFFEFA',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    paddingLeft: 36,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  colorTab: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },

  // 欄位標籤
  fieldLabel: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 12,
  },

  // 類型 / 頻率 chip
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: getFontSize(13, 'small'),
    fontWeight: '600',
  },
  customInput: {
    marginTop: 8,
    borderBottomWidth: 1,
    paddingVertical: 6,
    fontSize: getFontSize(15, 'medium'),
  },

  // 每N天
  subSection: {
    marginTop: 10,
    gap: 10,
  },
  everyNRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subLabel: {
    fontSize: getFontSize(15, 'medium'),
    fontWeight: '500',
  },
  nInput: {
    minWidth: 60,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: getFontSize(18, 'medium'),
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  dateText: {
    fontSize: getFontSize(15, 'medium'),
  },

  // 每週 星期
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  weekDayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  weekDayText: {
    fontSize: getFontSize(13, 'small'),
    fontWeight: '600',
  },

  // 時間
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  timeInput: {
    minWidth: 68,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: getFontSize(24, 'large'),
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  timeColon: {
    fontSize: getFontSize(24, 'large'),
    fontWeight: '600',
  },

  // 備註
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noteInput: {
    flex: 1,
    fontSize: getFontSize(15, 'medium'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 6,
  },

  // 日曆 Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFEFA',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  yearMonthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navArrow: {
    fontSize: 14,
    padding: 4,
  },
  ymText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  calWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  calWeekText: {
    width: 32,
    textAlign: 'center',
    fontSize: getFontSize(12, 'small'),
    fontWeight: '600',
  },
  calDayCell: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayText: {
    fontSize: getFontSize(13, 'small'),
  },
});
