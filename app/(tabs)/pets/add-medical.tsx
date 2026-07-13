import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { useAuth } from '../../../src/contexts/AuthContext';
import { medicalService } from '../../../src/services/firestoreService';
import * as ImagePicker from 'expo-image-picker';

const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m - 1, 1).getDay();

export default function AddMedicalScreen() {
  const router = useRouter();
  const { petId, id, ownerId } = useLocalSearchParams<{ petId: string; id?: string; ownerId?: string }>();
  const { themeId, fontFamilyName, isDemoMode } = useTheme();
  const theme = getThemeTokens(themeId);
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  // Visit section
  const [visitDate, setVisitDate] = useState('');
  const [hospital, setHospital] = useState('');
  const [doctor, setDoctor] = useState('');
  const [reason, setReason] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');

  // Image section
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Medication section
  const [medStartDate, setMedStartDate] = useState('');
  const [medEndDate, setMedEndDate] = useState('');
  const [medicine, setMedicine] = useState('');
  const [method, setMethod] = useState('');
  const [frequency, setFrequency] = useState('');
  const [dosage, setDosage] = useState('');
  const [medNote, setMedNote] = useState('');

  // Calendar Modal State
  const [showCalendar, setShowCalendar] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth() + 1);
  const [calendarTarget, setCalendarTarget] = useState<'visit' | 'medStart' | 'medEnd'>('visit');

  useEffect(() => {
    if (id && user) {
      const resolvedOwnerId = ownerId || user.uid;
      medicalService.getById(resolvedOwnerId, id).then(doc => {
        if (doc) {
          setTitle(doc.title);
          setVisitDate(doc.visit?.date || '');
          setHospital(doc.visit?.hospital || '');
          setDoctor(doc.visit?.doctor || '');
          setReason(doc.visit?.reason || '');
          setDiagnosis(doc.visit?.diagnosis || '');
          setAdvice(doc.visit?.advice?.join('\n') || '');
          setSelectedImages(doc.visit?.imageUrls || []);
          setMedStartDate(doc.medication?.startDate || '');
          setMedEndDate(doc.medication?.endDate || '');
          setMedicine(doc.medication?.medicine || '');
          setMethod(doc.medication?.method || '');
          setFrequency(doc.medication?.frequency || '');
          setDosage(doc.medication?.dosage || '');
          setMedNote(doc.medication?.note?.join('\n') || '');
        }
      });
    }
  }, [id, user]);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('需要相簿權限', '請允許蜥日日記讀取相簿，才能加入醫療照片。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 5 - selectedImages.length),
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelectedImages(current => [
        ...current,
        ...result.assets.map(asset => asset.uri),
      ].slice(0, 5));
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    const newData = {
      petId: petId || '1',
      title,
      date: visitDate,
      type: '就診',
      hospital,
      note: reason,
      tagColor: paletteColors.NUAN_YANG,
      visit: {
        date: visitDate,
        hospital,
        doctor,
        reason,
        diagnosis,
        advice: advice.split('\n').filter(Boolean),
          imageUrls: selectedImages.filter(uri => uri.startsWith('http')),
      },
      medication: {
        startDate: medStartDate,
        endDate: medEndDate,
        medicine,
        method,
        frequency,
        dosage,
        note: medNote.split('\n').filter(Boolean),
      },
    };

    const resolvedOwnerId = ownerId || user?.uid;
    if (!resolvedOwnerId) {
      Alert.alert('錯誤', '請重新登入後再試。');
      return;
    }

    setIsSaving(true);
    try {
      const medicalId = id || await medicalService.add(resolvedOwnerId, newData);
      if (id) await medicalService.update(resolvedOwnerId, id, newData);

      const remoteImages = selectedImages.filter(uri => uri.startsWith('http'));
      const localImages = selectedImages.filter(uri => !uri.startsWith('http'));
      const uploadedImages = await Promise.all(
        localImages.map((uri, index) => medicalService.uploadImage(resolvedOwnerId, medicalId, uri, index)),
      );
      if (localImages.length > 0) {
        await medicalService.update(resolvedOwnerId, medicalId, {
          visit: { ...newData.visit, imageUrls: [...remoteImages, ...uploadedImages] },
        });
      }

      if (petId) {
        router.navigate({ pathname: '/(tabs)/pets/medical', params: { id: petId, ownerId } });
      } else {
        router.back();
      }
    } catch {
      Alert.alert('錯誤', '醫療紀錄儲存失敗，請確認網路與圖片權限後再試。');
    } finally {
      setIsSaving(false);
    }
  };

  const openCalendar = (target: 'visit' | 'medStart' | 'medEnd') => {
    setCalendarTarget(target);
    setShowCalendar(true);
  };

  const handleDateSelect = (year: number, month: number, day: number) => {
    const yyyy = String(year);
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${yyyy}年${mm}月${dd}日`;

    if (calendarTarget === 'visit') setVisitDate(dateStr);
    else if (calendarTarget === 'medStart') setMedStartDate(dateStr);
    else if (calendarTarget === 'medEnd') setMedEndDate(dateStr);

    setShowCalendar(false);
  };

  const labelStyle = [styles.fieldLabel, { color: theme.primary, fontFamily: fontFamilyName }];
  const inputStyle = [styles.input, { borderColor: theme.primary, color: paletteColors.XUAN_RI, fontFamily: fontFamilyName }];
  const multiInputStyle = [styles.multiInput, { borderColor: theme.primary, color: paletteColors.XUAN_RI, fontFamily: fontFamilyName }];
  const dateInputStyle = [
    styles.dateInputButton,
    { borderColor: theme.primary, backgroundColor: theme.background },
  ];

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => router.navigate({ pathname: '/(tabs)/pets/medical', params: { id: petId || '1', ownerId } }) },
            { id: 'confirm', onPress: handleSave },
          ]}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.formCard, { backgroundColor: theme.background }]}>
          {/* Title */}
          <Text style={labelStyle}>標題</Text>
          <TextInput
            style={inputStyle}
            placeholder="例如：皮膚問題就診及用藥"
            placeholderTextColor={theme.text + '50'}
            value={title}
            onChangeText={setTitle}
          />

          <View style={[styles.divider, { backgroundColor: theme.primary }]} />

          {/* Visit Section */}
          <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>就診</Text>
          
          <Text style={labelStyle}>日期</Text>
          <Pressable style={dateInputStyle} onPress={() => openCalendar('visit')}>
            <Text style={{ color: visitDate ? theme.text : theme.text + '50', fontFamily: fontFamilyName, fontSize: getFontSize(16, 'medium'), fontWeight: '300' }}>
              {visitDate || '選擇就診日期'}
            </Text>
          </Pressable>

          <Text style={labelStyle}>地點</Text>
          <TextInput
            style={inputStyle}
            placeholder="動物醫院名稱"
            placeholderTextColor={theme.text + '50'}
            value={hospital}
            onChangeText={setHospital}
          />

          <Text style={labelStyle}>醫師</Text>
          <TextInput
            style={inputStyle}
            placeholder="醫師名稱"
            placeholderTextColor={theme.text + '50'}
            value={doctor}
            onChangeText={setDoctor}
          />

          <Text style={labelStyle}>原因</Text>
          <TextInput
            style={multiInputStyle}
            placeholder="請輸入就診原因..."
            placeholderTextColor={theme.text + '50'}
            multiline
            value={reason}
            onChangeText={setReason}
          />

          <Text style={labelStyle}>診斷</Text>
          <TextInput
            style={multiInputStyle}
            placeholder="請輸入診斷結果..."
            placeholderTextColor={theme.text + '50'}
            multiline
            value={diagnosis}
            onChangeText={setDiagnosis}
          />

          <Text style={labelStyle}>醫囑</Text>
          <TextInput
            style={multiInputStyle}
            placeholder="請輸入醫囑..."
            placeholderTextColor={theme.text + '50'}
            multiline
            value={advice}
            onChangeText={setAdvice}
          />

          {/* Image Picker */}
          <Text style={labelStyle}>相關照片</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagePickerContainer}>
            {selectedImages.map((img, idx) => (
              <Pressable key={idx} style={styles.previewImageWrapper} onPress={() => setSelectedImages(images => images.filter((_, imageIndex) => imageIndex !== idx))}>
                <Image source={typeof img === 'string' ? { uri: img } : img} style={styles.previewImage} />
                <View style={[styles.editImageOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                  <Text style={[styles.editImageText, { fontFamily: fontFamilyName }]}>點擊移除</Text>
                </View>
              </Pressable>
            ))}
            
            {selectedImages.length < 5 && <Pressable style={[styles.imageAddButton, { borderColor: theme.primary }]} onPress={pickImages}>
              <Text style={[styles.imageAddText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                + 選擇照片
              </Text>
            </Pressable>}
          </ScrollView>

          <View style={[styles.divider, { backgroundColor: theme.primary }]} />

          {/* Medication Section */}
          <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>用藥</Text>

          <Text style={labelStyle}>起始</Text>
          <Pressable style={dateInputStyle} onPress={() => openCalendar('medStart')}>
            <Text style={{ color: medStartDate ? theme.text : theme.text + '50', fontFamily: fontFamilyName, fontSize: getFontSize(16, 'medium'), fontWeight: '300' }}>
              {medStartDate || '選擇起始日期'}
            </Text>
          </Pressable>

          <Text style={labelStyle}>結束</Text>
          <Pressable style={dateInputStyle} onPress={() => openCalendar('medEnd')}>
            <Text style={{ color: medEndDate ? theme.text : theme.text + '50', fontFamily: fontFamilyName, fontSize: getFontSize(16, 'medium'), fontWeight: '300' }}>
              {medEndDate || '選擇結束日期'}
            </Text>
          </Pressable>

          <Text style={labelStyle}>藥品</Text>
          <TextInput
            style={inputStyle}
            placeholder="藥品名稱"
            placeholderTextColor={theme.text + '50'}
            value={medicine}
            onChangeText={setMedicine}
          />

          <Text style={labelStyle}>方式</Text>
          <TextInput
            style={inputStyle}
            placeholder="例如：外部塗抹"
            placeholderTextColor={theme.text + '50'}
            value={method}
            onChangeText={setMethod}
          />

          <Text style={labelStyle}>頻率</Text>
          <TextInput
            style={inputStyle}
            placeholder="例如：每日 2 次"
            placeholderTextColor={theme.text + '50'}
            value={frequency}
            onChangeText={setFrequency}
          />

          <Text style={labelStyle}>劑量</Text>
          <TextInput
            style={inputStyle}
            placeholder="例如：取約一顆米粒大小"
            placeholderTextColor={theme.text + '50'}
            value={dosage}
            onChangeText={setDosage}
          />

          <Text style={labelStyle}>備註</Text>
          <TextInput
            style={multiInputStyle}
            placeholder="用藥備註..."
            placeholderTextColor={theme.text + '50'}
            multiline
            value={medNote}
            onChangeText={setMedNote}
          />

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
                            onPress={() => handleDateSelect(pickerYear, pickerMonth, dayNum)}
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
    paddingBottom: 120,
    paddingTop: 16,
  },
  formCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: '#FFFEFA',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: getFontSize(18, 'medium'),
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '300',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '300',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dateInputButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    marginBottom: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  multiInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '300',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imagePickerContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  imageAddButton: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  imageAddText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '300',
  },
  previewImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageText: {
    color: '#FFFFFF',
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '300',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.3,
    marginVertical: 16,
  },

  // Modal styles
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
  },
  calWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calWeekText: {
    fontSize: getFontSize(14, 'medium'),
    width: 32,
    textAlign: 'center',
    fontWeight: '600',
  },
  calDayCell: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  calDayText: {
    fontSize: getFontSize(15, 'medium'),
    fontWeight: '500',
  },
});
