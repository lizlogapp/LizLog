import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { useAuth } from '../../../src/contexts/AuthContext';
import { petService, PetDoc } from '../../../src/services/firestoreService';
import { createImageVariants } from '../../../src/services/imageService';
import * as ImagePicker from 'expo-image-picker';

export default function AddPetScreen() {
  const router = useRouter();
  const { id, from, ownerId } = useLocalSearchParams<{ id?: string; from?: string; ownerId?: string }>();
  const { themeId, fontFamilyName, isDemoMode } = useTheme();
  const theme = getThemeTokens(themeId);
  const { user } = useAuth();

  const isEditing = !!id;

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('鬆獅蜥');
  const [birthday, setBirthday] = useState('');
  const [homeDate, setHomeDate] = useState('');
  const [gender, setGender] = useState('');
  const [tag, setTag] = useState('');
  const [tempMin, setTempMin] = useState('25');
  const [tempMax, setTempMax] = useState('35');
  const [humidMin, setHumidMin] = useState('30');
  const [humidMax, setHumidMax] = useState('50');
  const [imageUri, setImageUri] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);

  useEffect(() => {
    if (isEditing && id && user) {
      petService.getById(ownerId || user.uid, id).then(doc => {
        if (doc) {
          setName(doc.name || '');
          setSpecies(doc.species || '鬆獅蜥');
          setBirthday(doc.birthDate || '');
          setHomeDate(doc.homeDate || '');
          setGender(doc.gender || '');
          setTag(doc.tag || '');
          setTempMin(doc.tempMin?.toString() ?? '25');
          setTempMax(doc.tempMax?.toString() ?? '35');
          setHumidMin(doc.humidMin?.toString() ?? '30');
          setHumidMax(doc.humidMax?.toString() ?? '50');
          setImageUri(doc.imageUrl || '');
        }
      });
    }
  }, [isEditing, id, user, ownerId]);

  const [showDatePicker, setShowDatePicker] = useState<{ visible: boolean; target: 'birthday' | 'homeDate' | null }>({
    visible: false,
    target: null,
  });
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth() + 1);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m - 1, 1).getDay();

  const closePicker = () => setShowDatePicker({ visible: false, target: null });

  const labelStyle = [styles.fieldLabel, { color: theme.primary, fontFamily: fontFamilyName }];
  const inputStyle = [styles.input, { color: theme.text, fontFamily: fontFamilyName }];
  const fieldTextStyle = [styles.fieldValue, { color: theme.text, fontFamily: fontFamilyName }];

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('需要相簿權限', '請允許蜥日日記讀取相簿，才能選擇寵物照片。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setIsImageProcessing(true);
      try {
        const variants = await createImageVariants(result.assets[0].uri);
        setImageUri(variants.displayUri);
      } catch (error) {
        Alert.alert('圖片處理失敗', error instanceof Error ? error.message : '無法處理選取的圖片，請改選其他圖片。');
      } finally {
        setIsImageProcessing(false);
      }
    }
  };

  const saveErrorMessage = (error: unknown) => {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code || '')
      : '';
    if (code.startsWith('storage/')) {
      return '照片上傳失敗，請確認網路連線或重新登入後再試。';
    }
    if (error instanceof Error && !error.message.startsWith('Firebase Storage:')) {
      return error.message;
    }
    return isEditing ? '更新失敗，請稍後再試。' : '新增失敗，請稍後再試。';
  };

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => {
              // 返回層級：如果是編輯模式 -> 寵物詳情；如果是新增 -> 寵物列表
              if (isEditing && id) {
                router.navigate({ pathname: '/(tabs)/pets/view', params: { id, ownerId } });
              } else {
                router.navigate('/(tabs)/pets');
              }
            }},
            {
              id: 'confirm',
              onPress: async () => {
                if (isSaving || isImageProcessing) return;
                if (!name.trim()) {
                  Alert.alert('提示', '請填寫寵物名字');
                  return;
                }
                if (!user) {
                  Alert.alert('錯誤', '請重新登入後再試');
                  return;
                }

                setIsSaving(true);
                try {
                  let savedPetId: string;
                  let createdPetId: string | null = null;
                  if (isEditing && typeof id === 'string') {
                    savedPetId = id;
                    await petService.update(ownerId || user.uid, id, {
                      name,
                      species,
                      birthDate: birthday,
                      homeDate,
                      gender,
                      tag,
                      tempMin: parseInt(tempMin) || 25,
                      tempMax: parseInt(tempMax) || 35,
                      humidMin: parseInt(humidMin) || 30,
                      humidMax: parseInt(humidMax) || 50,
                    });
                  } else {
                    savedPetId = await petService.add(user.uid, {
                      name,
                      species,
                      birthDate: birthday,
                      homeDate,
                      gender,
                      tag,
                      tempMin: parseInt(tempMin) || 25,
                      tempMax: parseInt(tempMax) || 35,
                      humidMin: parseInt(humidMin) || 30,
                      humidMax: parseInt(humidMax) || 50,
                    });
                    createdPetId = savedPetId;
                  }

                  const resolvedOwnerId = isEditing ? (ownerId || user.uid) : user.uid;
                  if (imageUri && !imageUri.startsWith('http')) {
                    try {
                      const uploaded = await petService.uploadImage(resolvedOwnerId, savedPetId, imageUri, user.uid);
                      await petService.update(resolvedOwnerId, savedPetId, uploaded);
                    } catch (error) {
                      if (createdPetId) {
                        try {
                          await petService.delete(user.uid, createdPetId);
                        } catch (rollbackError) {
                          if (__DEV__) {
                            const rollbackCode = typeof rollbackError === 'object' && rollbackError !== null && 'code' in rollbackError
                              ? String((rollbackError as { code?: string }).code || 'unknown')
                              : 'unknown';
                            console.warn('Pet rollback failed:', rollbackCode);
                          }
                          throw new Error('照片上傳失敗，且未能自動清除暫存寵物資料，請回寵物頁確認後再試。');
                        }
                      }
                      throw error;
                    }
                  }

                  Alert.alert(
                    '成功',
                    isEditing ? `已更新寵物：${name}` : `已新增寵物：${name}`,
                  );
                  router.replace('/(tabs)/pets');
                } catch (error) {
                  Alert.alert('錯誤', saveErrorMessage(error));
                } finally {
                  setIsSaving(false);
                }
              },
            },
          ]}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 主要卡片 */}
        <View style={[styles.mainCard, { backgroundColor: theme.background }]}>
          {/* 照片區 */}
          <Pressable
          style={styles.photoCard}
          onPress={pickImage}
        >
          {imageUri ? <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
          {!imageUri && (
            <View style={styles.addPhotoButton}>
              <Image
                source={require('../../../assets/icons/icon-image.png')}
                style={[styles.addPhotoIcon, { tintColor: '#FFFFFF' }]}
                resizeMode="contain"
              />
            </View>
          )}
        </Pressable>



        {/* 表單 */}
        <View style={styles.form}>
          {/* 名字 */}
          <View style={styles.fieldRow}>
            <Text style={labelStyle}>名字</Text>
            <View style={[styles.inputCard, { backgroundColor: theme.background }]}>
              <TextInput
                style={inputStyle}
                placeholder="編輯寵物名字"
                placeholderTextColor={theme.text + '50'}
                value={name}
                onChangeText={setName}
                maxLength={20}
              />
            </View>
          </View>

          {/* 物種 */}
          <View style={styles.fieldRow}>
            <Text style={labelStyle}>物種</Text>
            <View style={[styles.inputCard, { backgroundColor: theme.background }]}>
              <TextInput
                style={inputStyle}
                placeholder="鬆獅蜥"
                placeholderTextColor={theme.text + '50'}
                value={species}
                onChangeText={setSpecies}
              />
            </View>
          </View>

          {/* 生日 */}
          <View style={styles.fieldRow}>
            <Text style={labelStyle}>生日</Text>
            <Pressable
              style={[styles.inputCard, { backgroundColor: theme.background }]}
              onPress={() => setShowDatePicker({ visible: true, target: 'birthday' })}
            >
              <View style={styles.dateTextRow}>
                <Text style={[fieldTextStyle, !birthday && { opacity: 0.5 }]}>
                  {birthday || '選擇日期'}
                </Text>
                <Image 
                  source={require('../../../assets/icons/icon-down.png')} 
                  style={[styles.chevronIcon, { tintColor: theme.text }]} 
                  resizeMode="contain" 
                />
              </View>
            </Pressable>
          </View>

          {/* 到家日子 */}
          <View style={styles.fieldRow}>
            <Text style={labelStyle}>到家日子</Text>
            <Pressable
              style={[styles.inputCard, { backgroundColor: theme.background }]}
              onPress={() => setShowDatePicker({ visible: true, target: 'homeDate' })}
            >
              <View style={styles.dateTextRow}>
                <Text style={[fieldTextStyle, !homeDate && { opacity: 0.5 }]}>
                  {homeDate || '選擇日期'}
                </Text>
                <Image 
                  source={require('../../../assets/icons/icon-down.png')} 
                  style={[styles.chevronIcon, { tintColor: theme.text }]} 
                  resizeMode="contain" 
                />
              </View>
            </Pressable>
          </View>

          {/* 性別 */}
          <View style={styles.fieldRow}>
            <Text style={labelStyle}>性別</Text>
            <View style={[styles.genderRow, { backgroundColor: theme.background }]}>
              {['男生', '女生', '未知'].map((g) => (
                <Pressable
                  key={g}
                  style={[
                    styles.genderButton,
                    gender === g && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      styles.genderText,
                      { fontFamily: fontFamilyName },
                      gender === g
                        ? { color: theme.background, fontWeight: '600' }
                        : { color: theme.text },
                    ]}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 標籤綽號 */}
          <View style={styles.fieldRow}>
            <Text style={labelStyle}>標籤綽號</Text>
            <View style={[styles.inputCard, { backgroundColor: theme.background }]}>
              <TextInput
                style={inputStyle}
                placeholder="編輯標籤綽號"
                placeholderTextColor={theme.text + '50'}
                value={tag}
                onChangeText={setTag}
              />
            </View>
          </View>

          {/* IoT 感測器安全範圍 */}
          <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: fontFamilyName, marginTop: 16, marginBottom: 8 }]}>IoT 警報範圍設定</Text>
          <View style={styles.fieldRow}>
            <Text style={labelStyle}>溫度範圍 (°C)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 16 }}>
              <View style={[styles.inputCard, { backgroundColor: theme.background, flex: 1, marginLeft: 0 }]}>
                <TextInput style={inputStyle} value={tempMin} onChangeText={setTempMin} keyboardType="numeric" />
              </View>
              <Text style={{ marginHorizontal: 8, color: theme.text, fontFamily: fontFamilyName }}>~</Text>
              <View style={[styles.inputCard, { backgroundColor: theme.background, flex: 1, marginLeft: 0 }]}>
                <TextInput style={inputStyle} value={tempMax} onChangeText={setTempMax} keyboardType="numeric" />
              </View>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={labelStyle}>濕度範圍 (%)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 16 }}>
              <View style={[styles.inputCard, { backgroundColor: theme.background, flex: 1, marginLeft: 0 }]}>
                <TextInput style={inputStyle} value={humidMin} onChangeText={setHumidMin} keyboardType="numeric" />
              </View>
              <Text style={{ marginHorizontal: 8, color: theme.text, fontFamily: fontFamilyName }}>~</Text>
              <View style={[styles.inputCard, { backgroundColor: theme.background, flex: 1, marginLeft: 0 }]}>
                <TextInput style={inputStyle} value={humidMax} onChangeText={setHumidMax} keyboardType="numeric" />
              </View>
            </View>
          </View>

        </View>
        </View>
      </ScrollView>

      {/* 日曆選擇器 Modal */}
      <Modal
        visible={showDatePicker.visible}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <Pressable style={styles.modalOverlay} onPress={closePicker}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.background }]} onPress={(e) => e.stopPropagation()}>
            {/* 年月選擇列 */}
            <View style={styles.yearMonthNav}>
              {/* 左側：年份切換 */}
              <View style={styles.navGroup}>
                <Pressable onPress={() => setPickerYear(y => y - 1)}>
                  <Text style={[styles.navArrow, { color: theme.primary }]}>◀</Text>
                </Pressable>
                <Text style={[styles.yearMonthText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  {pickerYear}年
                </Text>
                <Pressable onPress={() => setPickerYear(y => y + 1)}>
                  <Text style={[styles.navArrow, { color: theme.primary }]}>▶</Text>
                </Pressable>
              </View>

              {/* 右側：月份切換 */}
              <View style={styles.navGroup}>
                <Pressable onPress={() => {
                  if (pickerMonth === 1) { setPickerYear(y => y - 1); setPickerMonth(12); }
                  else { setPickerMonth(m => m - 1); }
                }}>
                  <Text style={[styles.navArrow, { color: theme.primary }]}>◀</Text>
                </Pressable>
                <Text style={[styles.yearMonthText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  {pickerMonth}月
                </Text>
                <Pressable onPress={() => {
                  if (pickerMonth === 12) { setPickerYear(y => y + 1); setPickerMonth(1); }
                  else { setPickerMonth(m => m + 1); }
                }}>
                  <Text style={[styles.navArrow, { color: theme.primary }]}>▶</Text>
                </Pressable>
              </View>
            </View>

            {/* 星期標題 */}
            <View style={styles.weekRow}>
              {['日','一','二','三','四','五','六'].map(d => (
                <Text key={d} style={[styles.weekDayText, { color: theme.primary, fontFamily: fontFamilyName }]}>{d}</Text>
              ))}
            </View>

            {/* 日期格子 */}
            {(() => {
              const daysInMonth = getDaysInMonth(pickerYear, pickerMonth);
              const firstDay = getFirstDayOfMonth(pickerYear, pickerMonth);
              const rows = 6;
              return Array.from({ length: rows }).map((_, rowIdx) => (
                <View key={rowIdx} style={styles.weekRow}>
                  {Array.from({ length: 7 }).map((_, colIdx) => {
                    const cellIdx = rowIdx * 7 + colIdx;
                    const dayNum = cellIdx - firstDay + 1;
                    const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                    return (
                      <View key={colIdx} style={styles.dayCell}>
                        {isValid && (
                          <Pressable
                            style={styles.dayButton}
                            onPress={() => {
                              const formatted = `${pickerYear}/${String(pickerMonth).padStart(2,'0')}/${String(dayNum).padStart(2,'0')}`;
                              if (showDatePicker.target === 'birthday') setBirthday(formatted);
                              if (showDatePicker.target === 'homeDate') setHomeDate(formatted);
                              closePicker();
                            }}
                          >
                            <Text style={[styles.dayText, { color: theme.primary, fontFamily: fontFamilyName }]}>{dayNum}</Text>
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
    paddingBottom: 120,
    gap: 0,
  },

  // 主要大卡片
  mainCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: '#FFFEFA',
    borderRadius: 20,
    padding: 16,
    gap: 24, // 圖片和第一行文字間距
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },

  // 照片區塊
  photoCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: paletteColors.WU_JIN,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addPhotoButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  addPhotoIcon: {
    width: 32,
    height: 32,
  },



  // 表單
  form: {
    width: '100%',
    gap: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldLabel: {
    fontSize: getFontSize(15, 'medium'),
    fontWeight: '500',
    width: 72,
    textAlign: 'right',
  },
  inputCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFEFA',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: getFontSize(15, 'medium'),
    textAlign: 'center',
    padding: 0,
  },
  fieldValue: {
    fontSize: getFontSize(15, 'medium'),
    textAlign: 'center',
  },
  dateTextRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  chevronIcon: {
    width: 20,
    height: 20,
  },
  sectionTitle: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: 'bold',
  },

  // 性別選擇
  genderRow: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFEFA',
    borderRadius: 16,
    padding: 4,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  genderButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  genderText: {
    fontSize: getFontSize(15, 'medium'),
  },
  // Modal 日曆樣式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    minHeight: 362,
    backgroundColor: '#FFFEFA',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  yearMonthNav: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  yearMonthText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  navArrow: {
    fontSize: 14,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    width: '100%',
  },
  weekDayText: {
    width: 36,
    textAlign: 'center',
    fontSize: getFontSize(12, 'small'),
    fontWeight: '500',
  },
  dayCell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: getFontSize(13, 'small'),
  },
});
