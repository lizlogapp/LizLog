import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, TextInput } from 'react-native';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { paletteColors } from '../../../src/theme/themeColorSettings';

// SVG Icons
// @ts-ignore
import IconTemp from '../../../assets/icons/icon-temp.svg';
// @ts-ignore
import IconHumid from '../../../assets/icons/icon-humid.svg';
// @ts-ignore
import IconBask from '../../../assets/icons/icon-bask.svg';
// @ts-ignore
import IconFeed from '../../../assets/icons/icon-feed.svg';
// @ts-ignore
import IconBath from '../../../assets/icons/icon-bath.svg';
// @ts-ignore
import IconPoop from '../../../assets/icons/icon-poop.svg';
// @ts-ignore
import IconWeight from '../../../assets/icons/icon-weight.svg';
// @ts-ignore
import IconLength from '../../../assets/icons/icon-length.svg';
// @ts-ignore
import IconDiaryWrite from '../../../assets/icons/icon-diary.svg';
// @ts-ignore
import IconUploadSvg from '../../../assets/icons/icon-upload.svg';

// 取得當日日期格式化字串
const getTodayString = () => {
  const now = new Date();
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dayName = days[now.getDay()];
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const y = now.getFullYear();
  return `${dayName}  ${m}/${d}/${y}`;
};

/**
 * 新增日記頁面
 * 包含：照片區域、寵物標籤選擇、日期/天氣、標題編輯、數據紀錄、寫日記與上傳按鈕
 */
export default function AddDiaryScreen() {
  const router = useRouter();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);

  // 色彩定義
  const labelColor = theme.primary;           // 色票/主色 用於標籤文字（溫度：、濕度：等）
  const valueColor = paletteColors.LIE_RI;    // 色票/輔色-烈日 用於可編輯數據

  // 寵物選單狀態
  const [availablePets] = useState<string[]>(['DELETE', 'CTRL', 'ENTER', 'ALT']);
  const [selectedPets, setSelectedPets] = useState<string[]>(['DELETE']);
  const [isPetDropdownVisible, setIsPetDropdownVisible] = useState(false);

  // 可編輯欄位
  const [title, setTitle] = useState('未命名標題');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [diaryContent, setDiaryContent] = useState('');
  const [isDiaryExpanded, setIsDiaryExpanded] = useState(false);
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);

  // 預設帶入當日日期
  const currentDate = getTodayString();

  // 模擬當日資料（未來從 IOT 設備 / 資料庫取得）
  const sensorData = {
    temp: '31℃',
    humid: '30%',
    bask: '無',
    feed: '無',
    bath: '無',
    poop: '無',
    weight: '415公克',
    length: '44公分',
  };

  const togglePet = (pet: string) => {
    if (selectedPets.includes(pet)) {
      if (selectedPets.length > 1) {
        setSelectedPets(selectedPets.filter(p => p !== pet));
      }
    } else {
      setSelectedPets([...selectedPets, pet]);
    }
  };

  const recordItems = [
    { icon: IconTemp, label: '溫度', value: sensorData.temp },
    { icon: IconHumid, label: '濕度', value: sensorData.humid },
    { icon: IconBask, label: '日照', value: sensorData.bask },
    { icon: IconFeed, label: '飲食', value: sensorData.feed },
    { icon: IconBath, label: '泡澡', value: sensorData.bath },
    { icon: IconPoop, label: '排便', value: sensorData.poop },
    { icon: IconWeight, label: '體重', value: sensorData.weight },
    { icon: IconLength, label: '身長', value: sensorData.length },
  ];

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => router.back() },
            { id: 'confirm', onPress: () => { /* TODO: 儲存日記 */ router.back(); } },
          ]}
        />
      }
    >
      <View style={{ flex: 1 }}>
        {/* 背景點擊攔截 */}
        {isPetDropdownVisible && (
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 900, backgroundColor: 'transparent' }]}
            onPress={() => setIsPetDropdownVisible(false)}
          />
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ===== 卡片一：照片 + 寵物標籤 + 日期資訊 ===== */}
          <View style={styles.mainCard}>
            {/* 照片區域 */}
            <View style={styles.photoArea}>
              {/* 新增照片按鈕 */}
              <Pressable style={styles.addPhotoButton} onPress={() => { /* TODO: 開啟相簿 */ }}>
                <Image
                  source={require('../../../assets/icons/icon-image.png')}
                  style={[styles.addPhotoIcon, { tintColor: '#FFFFFF' }]}
                />
              </Pressable>

              {/* 寵物標籤（浮動在照片底部左側） */}
              <View style={[styles.petTagsContainer, { zIndex: 1000 }]}>
                <Pressable onPress={() => setIsPetDropdownVisible(!isPetDropdownVisible)}>
                  {selectedPets.map((pet, idx) => (
                    <View key={idx} style={styles.petTag}>
                      <Text style={[styles.petTagText, { color: theme.primary, fontFamily: fontFamilyName }]}>{pet}</Text>
                    </View>
                  ))}
                </Pressable>

                {/* 寵物選擇下拉選單 */}
                {isPetDropdownVisible && (
                  <View style={styles.petDropdownModal}>
                    <ScrollView
                      style={styles.petDropdownScroll}
                      showsVerticalScrollIndicator={false}
                      bounces={false}
                    >
                      {availablePets.map((pet, idx) => (
                        <Pressable
                          key={pet}
                          style={[
                            styles.petDropdownItem,
                            selectedPets.includes(pet) && styles.petDropdownItemActive,
                            idx === availablePets.length - 1 && { marginBottom: 0 },
                          ]}
                          onPress={() => togglePet(pet)}
                        >
                          <Text style={[styles.petDropdownItemText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                            {pet}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* 資訊區域：日期 + 標題 + 數據列 */}
            <View style={styles.infoContainer}>
              {/* 日期 + 天氣 */}
              <View style={styles.dateRow}>
                <Text style={[styles.dateText, { color: valueColor, fontFamily: fontFamilyName }]}>{currentDate}</Text>
                <Image
                  source={require('../../../assets/icons/weather-sunny.png')}
                  style={[styles.weatherIcon, { tintColor: valueColor }]}
                />
              </View>

              {/* 標題（可編輯，與寫日記卡片連動） */}
              {isEditingTitle ? (
                <TextInput
                  style={[styles.titleInput, { color: valueColor, fontFamily: fontFamilyName, borderColor: valueColor }]}
                  value={title}
                  onChangeText={setTitle}
                  onBlur={() => setIsEditingTitle(false)}
                  autoFocus
                  selectTextOnFocus
                />
              ) : (
                <Pressable onPress={() => setIsEditingTitle(true)}>
                  <Text style={[styles.titleText, { color: valueColor, fontFamily: fontFamilyName }]}>{title}</Text>
                </Pressable>
              )}

              {/* 簡化數據列（溫度 + 濕度 + 狀態圖標） */}
              <View style={styles.metricRow}>
                <Text style={[styles.metricText, { color: valueColor, fontFamily: fontFamilyName }]}>{sensorData.temp}</Text>
                <Text style={[styles.metricText, { color: valueColor, fontFamily: fontFamilyName }]}>{sensorData.humid}</Text>
                <View style={styles.metricIconsBlock}>
                  <Image source={require('../../../assets/icons/category-basking-default.png')} style={[styles.stateIcon, { tintColor: valueColor + '60' }]} />
                  <Image source={require('../../../assets/icons/category-food-default.png')} style={[styles.stateIcon, { tintColor: valueColor + '60' }]} />
                  <Image source={require('../../../assets/icons/category-bath-default.png')} style={[styles.stateIcon, { tintColor: valueColor + '60' }]} />
                  <Image source={require('../../../assets/icons/category-poop-default.png')} style={[styles.stateIcon, { tintColor: valueColor + '60' }]} />
                </View>
              </View>
            </View>
          </View>

          {/* ===== 卡片二：詳細狀態紀錄 ===== */}
          <View style={styles.detailCard}>
            {recordItems.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <View key={idx} style={styles.recordRow}>
                  <IconComp width={20} height={20} color={labelColor} />
                  <Text style={[styles.recordLabel, { color: labelColor, fontFamily: fontFamilyName }]}>
                    {item.label}：
                  </Text>
                  <Text style={[styles.recordValue, { color: valueColor, fontFamily: fontFamilyName }]}>
                    {item.value}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ===== 卡片三：寫日記（可展開） ===== */}
          <Pressable
            style={styles.actionCard}
            onPress={() => setIsDiaryExpanded(!isDiaryExpanded)}
          >
            <IconDiaryWrite width={28} height={28} color={theme.primary} />
          </Pressable>

          {isDiaryExpanded && (
            <View style={styles.diaryEditCard}>
              {/* 標題編輯 */}
              <TextInput
                style={[styles.diaryTitleInput, { color: valueColor, fontFamily: fontFamilyName }]}
                value={title}
                onChangeText={setTitle}
                placeholder="未命名標題"
                placeholderTextColor={valueColor}
              />
              {/* 內容編輯 */}
              <TextInput
                style={[styles.diaryContentInput, { color: valueColor, fontFamily: fontFamilyName }]}
                value={diaryContent}
                onChangeText={setDiaryContent}
                placeholder="編輯..."
                placeholderTextColor={valueColor}
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

          {/* ===== 卡片四：上傳（可展開新增照片/檔案） ===== */}
          <Pressable
            style={styles.actionCard}
            onPress={() => setIsUploadExpanded(!isUploadExpanded)}
          >
            <IconUploadSvg width={28} height={28} color={theme.primary} />
          </Pressable>

          {isUploadExpanded && (
            <View style={styles.uploadExpandedCard}>
              <Pressable style={styles.uploadAddButton} onPress={() => { /* TODO: 開啟檔案選擇器 */ }}>
                <Image
                  source={require('../../../assets/icons/icon-image.png')}
                  style={[styles.uploadAddIcon, { tintColor: theme.primary }]}
                />
                <Text style={[styles.uploadAddText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  新增照片 / 檔案
                </Text>
              </Pressable>
              <Text style={[styles.uploadHint, { color: theme.primary + '80', fontFamily: fontFamilyName }]}>
                可上傳多個檔案（建議單檔不超過 10MB）
              </Text>
            </View>
          )}

        </ScrollView>
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 120,
    gap: 16,
  },

  // ===== 主卡片（照片 + 資訊） =====
  mainCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'visible',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  photoArea: {
    width: '100%',
    height: 200,
    backgroundColor: paletteColors.WU_JIN,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
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
    resizeMode: 'contain',
  },
  petTagsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    gap: 8,
  },
  petTag: {
    backgroundColor: '#FFF1D0',
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 6,
  },
  petTagText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
  },
  petDropdownModal: {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2000,
  },
  petDropdownScroll: {
    maxHeight: 280,
  },
  petDropdownItem: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 237, 204, 0.6)',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 8,
  },
  petDropdownItemActive: {
    backgroundColor: 'rgba(255, 195, 0, 0.3)',
    borderWidth: 1.5,
    borderColor: paletteColors.LIE_RI,
  },
  petDropdownItemText: {
    fontSize: getFontSize(16, 'medium'),
  },

  // ===== 資訊區 =====
  infoContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  dateText: {
    fontSize: getFontSize(18, 'medium'),
  },
  weatherIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  titleText: {
    fontSize: getFontSize(16, 'medium'),
    marginBottom: 16,
  },
  titleInput: {
    fontSize: getFontSize(16, 'medium'),
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 4,
    textAlign: 'center',
    minWidth: 120,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  metricText: {
    fontSize: getFontSize(14, 'medium'),
    minWidth: 42,
    textAlign: 'left',
  },
  metricIconsBlock: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 'auto',
  },
  stateIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  // ===== 詳細紀錄卡片 =====
  detailCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    padding: 20,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordLabel: {
    fontSize: getFontSize(16, 'medium'),
  },
  recordValue: {
    fontSize: getFontSize(16, 'medium'),
  },

  // ===== 操作按鈕卡片 =====
  actionCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // ===== 寫日記展開卡片 =====
  diaryEditCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    minHeight: 280,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  diaryTitleInput: {
    fontSize: getFontSize(20, 'medium'),
    fontWeight: '600',
    marginBottom: 16,
    padding: 0,
  },
  diaryContentInput: {
    fontSize: getFontSize(16, 'medium'),
    flex: 1,
    minHeight: 200,
    padding: 0,
  },

  // ===== 上傳展開卡片 =====
  uploadExpandedCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: paletteColors.XIA_RI,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  uploadAddIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  uploadAddText: {
    fontSize: getFontSize(16, 'medium'),
  },
  uploadHint: {
    fontSize: getFontSize(12, 'small'),
  },
});
