import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { useAuth } from '../../../src/contexts/AuthContext';
import { reminderService, petService, PetDoc } from '../../../src/services/firestoreService';
import {
  ReminderNotificationInput,
  synchronizeEligibleReminderNotifications,
} from '../../../src/services/notificationService';

const defaultTypes = ['餵食', '換水', '清掃', '用藥', '驅蟲', '回診'];
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
type Frequency = 'once' | 'daily' | 'everyN' | 'weekly';

const tagColors = ['#FF6B6B', '#FF9F43', '#FFD239', '#5CD85A', '#4DB8FF', '#B072FF', '#8E8E93'];

const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m - 1, 1).getDay();

export default function AddReminderScreen() {
  const router = useRouter();
  const { id, petId, reminderId, ownerId } = useLocalSearchParams<{
    id?: string;
    petId?: string;
    reminderId?: string;
    ownerId?: string;
  }>();
  const targetPetId = id || petId || '';
  const { themeId, fontFamilyName, isDemoMode } = useTheme();
  const theme = getThemeTokens(themeId);
  const { user } = useAuth();

  // 寵物名單
  const [petList, setPetList] = useState<{ id: string; name: string }[]>([]);
  const [selectedPets, setSelectedPets] = useState<string[]>(targetPetId ? [targetPetId] : []);
  const [isPetListReady, setIsPetListReady] = useState(false);

  useEffect(() => {
    if (user) {
      setIsPetListReady(false);
      petService.getAll(user.uid).then(pets => {
        if (pets.length === 0) {
          Alert.alert('提示', '目前尚無寵物資料，請先新增寵物', [
            { text: '確定', onPress: () => router.replace('/(tabs)/pets') }
          ]);
        } else {
          const resolvedOwnerId = ownerId || user.uid;
          const writablePets = pets.filter(p => {
            const role = p.coParents?.find(cp => cp.uid === user.uid);
            return (p.ownerId || user.uid) === resolvedOwnerId
              && !!role
              && (role.isMainOwner || role.permission !== 'view');
          });
          setPetList(writablePets.map(p => ({ id: p.id, name: p.name })));
          if (writablePets.length === 0) {
            Alert.alert('無法新增提醒', '目前沒有可編輯的寵物，請先新增寵物或請主飼主調整共同飼育權限。', [
              { text: '確定', onPress: () => router.replace('/(tabs)/pets') }
            ]);
          } else {
            setSelectedPets(current => {
              const writableIds = new Set(writablePets.map(p => p.id));
              const validSelection = current.filter(petIdValue => writableIds.has(petIdValue));
              if (validSelection.length > 0) return validSelection;
              const defaultPet = writablePets.find(p => p.id === targetPetId) || writablePets[0];
              return [defaultPet.id];
            });
          }
        }
      }).catch(() => {
        Alert.alert('無法讀取寵物', '請確認網路連線後再試。', [
          { text: '確定', onPress: () => router.replace('/(tabs)/pets') }
        ]);
      }).finally(() => setIsPetListReady(true));
    }
  }, [user, targetPetId, ownerId]);

  const togglePet = (petId: string) => {
    setSelectedPets(prev =>
      prev.includes(petId)
        ? prev.filter(p => p !== petId)
        : [...prev, petId]
    );
  };

  // 類型
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['餵食']);
  const [customType, setCustomType] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const toggleType = (type: string) => {
    setSelectedTypes(previous =>
      previous.includes(type)
        ? previous.filter(value => value !== type)
        : [...previous, type],
    );
  };

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

  // 事項
  const [note, setNote] = useState('餵食');

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
    if (reminderId && user) {
      reminderService.getById(ownerId || user.uid, reminderId).then(data => {
        if (!data) return;
        setSelectedPets(data.pets?.length ? data.pets : [data.petId]);
        
        const dataWithTypes = data as typeof data & { types?: string[] };
        const storedTypes = dataWithTypes.types?.length
          ? dataWithTypes.types
          : (data.type || '').split(/[、,，]/);
        const normalizedTypes = Array.from(
          new Set(storedTypes.map(type => type.trim()).filter(Boolean)),
        );
        const presetTypes = normalizedTypes.filter(type => defaultTypes.includes(type));
        const customTypes = normalizedTypes.filter(type => !defaultTypes.includes(type));
        setSelectedTypes(presetTypes);
        setIsAddingCustom(customTypes.length > 0);
        setCustomType(customTypes.join('、'));

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
      });
    }
  }, [reminderId, user, ownerId]);

  const handleSave = async () => {
    if (!user || !isPetListReady) return;
    if (petList.length === 0 || selectedPets.length === 0) {
      Alert.alert('尚未新增寵物', '請先新增寵物，再建立提醒。', [
        { text: '前往寵物頁', onPress: () => router.replace('/(tabs)/pets') },
      ]);
      return;
    }
    const writablePetIds = new Set(petList.map(pet => pet.id));
    if (selectedPets.some(petIdValue => !writablePetIds.has(petIdValue))) {
      Alert.alert('寵物資料已變更', '部分寵物已刪除或不再具有編輯權限，請重新選擇。');
      return;
    }

    const customTypes = isAddingCustom
      ? customType.split(/[、,，]/).map(type => type.trim()).filter(Boolean)
      : [];
    const finalTypes = Array.from(new Set([...selectedTypes, ...customTypes]));
    if (finalTypes.length === 0) {
      Alert.alert('提示', '請選擇或輸入提醒類型。');
      return;
    }
    if (frequency === 'weekly' && selectedWeekDays.length === 0) {
      Alert.alert('提示', '請至少選擇一個星期。');
      return;
    }
    if (frequency === 'everyN' && (!Number.isFinite(Number(everyNDays)) || Number(everyNDays) < 1)) {
      Alert.alert('提示', '提醒間隔必須大於 0 天。');
      return;
    }
    const numericHour = Number(hour);
    const numericMinute = Number(minute);
    if (!Number.isInteger(numericHour) || numericHour < 0 || numericHour > 23
      || !Number.isInteger(numericMinute) || numericMinute < 0 || numericMinute > 59) {
      Alert.alert('提示', '請輸入有效的提醒時間。');
      return;
    }
    const finalTime = `${String(numericHour).padStart(2, '0')}:${String(numericMinute).padStart(2, '0')}`;
    let effectiveStartDate = startDate;
    if ((frequency === 'once' || frequency === 'everyN') && !effectiveStartDate) {
      const today = new Date();
      effectiveStartDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('/');
    }
    if (frequency === 'once') {
      const match = effectiveStartDate?.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
      const scheduledAt = match
        ? new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
            numericHour,
            numericMinute,
            0,
            0,
          )
        : new Date(Number.NaN);
      if (Number.isNaN(scheduledAt.getTime())
        || !match
        || scheduledAt.getFullYear() !== Number(match[1])
        || scheduledAt.getMonth() !== Number(match[2]) - 1
        || scheduledAt.getDate() !== Number(match[3])) {
        Alert.alert('提示', '請選擇有效的提醒日期。');
        return;
      }
      if (scheduledAt.getTime() <= Date.now()) {
        Alert.alert('提醒時間已過', '單次提醒不會自動延到明天，請選擇稍後的日期或時間。');
        return;
      }
    }
    let finalFreq = '';
    if (frequency === 'once') finalFreq = '單次';
    else if (frequency === 'daily') finalFreq = '每天';
    else if (frequency === 'everyN') finalFreq = `每${everyNDays}天`;
    else if (frequency === 'weekly') {
      const wDays = selectedWeekDays.map(d => weekDays[d]).join('、');
      finalFreq = `每週(${wDays})`;
    }

    const newData = {
      petId: selectedPets[0],
      type: finalTypes.join('、'),
      types: finalTypes,
      freq: finalFreq,
      frequencyType: frequency,
      everyNDays,
      startDate: effectiveStartDate,
      selectedWeekDays,
      time: finalTime,
      pets: selectedPets,
      note,
      isOn: true,
      tagColor,
    };

    const resolvedOwnerId = ownerId || user.uid;
    try {
      const savedId = reminderId || await reminderService.add(resolvedOwnerId, newData);
      if (reminderId) await reminderService.update(resolvedOwnerId, reminderId, newData);
      const [allReminders, allPets] = await Promise.all([
        reminderService.getAll(user.uid),
        petService.getAll(user.uid),
      ]);
      const syncResult = await synchronizeEligibleReminderNotifications(
        user.uid,
        allReminders as ReminderNotificationInput[],
        allPets,
      ).catch(() => null);
      const scheduled = Boolean(syncResult
        && !syncResult.failedReminderIds.includes(savedId)
        && syncResult.permissionGranted
        && syncResult.preferencesEnabled);
      const navigateToReminderList = () => router.navigate({
        pathname: '/(tabs)/pets/reminder',
        params: { id: selectedPets[0], ownerId: resolvedOwnerId },
      });
      if (!scheduled) {
        Alert.alert(
          '提醒已儲存',
          '通知尚未成功排程，請確認提醒開關與手機通知權限。',
          [
            { text: '稍後', onPress: navigateToReminderList },
            {
              text: '前往設定',
              onPress: () => {
                navigateToReminderList();
                void Linking.openSettings();
              },
            },
          ],
        );
        return;
      }
      navigateToReminderList();
    } catch (error) {
      Alert.alert('錯誤', error instanceof Error ? error.message : '提醒儲存或通知排程失敗，請稍後再試。');
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
            { id: 'back', onPress: () => router.navigate({ pathname: '/(tabs)/pets/reminder', params: { id: targetPetId, ownerId } }) },
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
                    backgroundColor: selectedTypes.includes(t) ? theme.primary : 'transparent',
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => toggleType(t)}
              >
                <Text style={[styles.chipText, {
                  color: selectedTypes.includes(t) ? theme.background : theme.primary,
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
              onPress={() => setIsAddingCustom(previous => !previous)}
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

          {/* 單次／每 N 天都需要可選日期；每 N 天另顯示間隔。 */}
          {(frequency === 'once' || frequency === 'everyN') && (
            <View style={styles.subSection}>
              {frequency === 'everyN' && (
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
              )}

              <View style={styles.dateRow}>
                <Text style={[styles.subLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  {frequency === 'once' ? '提醒日期' : '起始日期'}
                </Text>
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

          {/* ========== 事項 ========== */}
          <View style={styles.noteRow}>
            <Text style={labelStyle}>事項</Text>
            <TextInput
              style={[styles.noteInput, { color: theme.text, fontFamily: fontFamilyName, borderBottomColor: theme.text + '20' }]}
              placeholder="餵食"
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
              const rows = 6;
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
    minHeight: 362,
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
