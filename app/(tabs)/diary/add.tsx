import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, TextInput } from 'react-native';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import Slider from '@react-native-community/slider';
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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);

  // 色彩定義
  const labelColor = theme.primary;           // 色票/主色 用於標籤文字（溫度：、濕度：等）
  const valueColor = theme.accentHot;    // 顏色/標準色/輔色-烈日 用於可編輯數據

  // 寵物選單狀態
  const [availablePets] = useState<string[]>(['DELETE', 'CTRL', 'ENTER', 'ALT']);
  const [selectedPets, setSelectedPets] = useState<string[]>(['DELETE']);
  const [isPetDropdownVisible, setIsPetDropdownVisible] = useState(false);

  // 可編輯欄位
  const [title, setTitle] = useState(isEditing ? '初次探索！家旁邊的新公園草地' : '未命名標題');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [diaryContent, setDiaryContent] = useState(isEditing ? '今天第一次帶 Delete 還有 Enter 去家裡旁邊剛整修好的新公園，沒想到兩隻都對草地超級好奇！原本以為 Delete 會比較膽小，結果牠竟然主動往前爬，反而是一向活潑的 Enter 一直躲在我的陰影下不肯出來。天氣雖然有點熱，但看到牠們在陽光下顏色變得好鮮豔，覺得這趟出門真的太值得了。下次也許可以帶點小點心來試試看牠們在戶外的食慾。' : '');
  const [isDiaryExpanded, setIsDiaryExpanded] = useState(false);
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);
  const [appetite, setAppetite] = useState(3); // 食慾狀態，預設 3
  const [poopState, setPoopState] = useState('無'); // 排便狀態，預設 '無'
  const [feedState, setFeedState] = useState('無'); // 飲食狀態，預設 '無'
  const [baskMinutes, setBaskMinutes] = useState('0'); // 日照分鐘，預設 0
  const [bathMinutes, setBathMinutes] = useState('0'); // 泡澡分鐘，預設 0

  const [temp, setTemp] = useState('31'); // 溫度預設
  const [humid, setHumid] = useState('30'); // 濕度預設
  const [weight, setWeight] = useState('415'); // 體重預設
  const [length, setLength] = useState('44'); // 身長預設

  // 預設帶入當日日期
  const currentDate = getTodayString();

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
    { icon: IconTemp, label: '溫度', value: temp },
    { icon: IconHumid, label: '濕度', value: humid },
    { icon: IconBask, label: '日照', value: baskMinutes },
    { icon: IconFeed, label: '飲食', value: feedState },
    { icon: IconBath, label: '泡澡', value: bathMinutes },
    { icon: IconPoop, label: '排便', value: poopState },
    { icon: IconWeight, label: '體重', value: weight },
    { icon: IconLength, label: '身長', value: length },
  ];

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => {
              if (isEditing && id) {
                router.navigate({ pathname: '/(tabs)/diary/view', params: { id } });
              } else {
                router.navigate('/(tabs)/diary');
              }
            }},
            { id: 'confirm', onPress: () => { 
              // TODO: 儲存日記
              if (isEditing && id) {
                router.navigate({ pathname: '/(tabs)/diary/view', params: { id } });
              } else {
                router.navigate('/(tabs)/diary');
              }
            }},
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
          <View style={[styles.mainCard, { backgroundColor: theme.background }]}>
            {/* 照片區域 */}
            <View style={[styles.photoArea, { backgroundColor: theme.accentNoon }]}>
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
                    <View key={idx} style={[styles.petTag, { backgroundColor: theme.accentDawn }]}>
                      <Text style={[styles.petTagText, { color: theme.primary, fontFamily: fontFamilyName }]}>{pet}</Text>
                    </View>
                  ))}
                </Pressable>

                {/* 寵物選擇下拉選單 */}
                {isPetDropdownVisible && (
                  <View style={[styles.petDropdownModal, { backgroundColor: theme.background }]}>
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
                            selectedPets.includes(pet) && { backgroundColor: 'rgba(255, 195, 0, 0.3)', borderWidth: 1.5, borderColor: theme.accentHot },
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
                <Text style={[styles.metricText, { color: valueColor, fontFamily: fontFamilyName }]}>{temp}℃</Text>
                <Text style={[styles.metricText, { color: valueColor, fontFamily: fontFamilyName }]}>{humid}%</Text>
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
          <View style={[styles.detailCard, { backgroundColor: theme.background }]}>
            {recordItems.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <View key={idx} style={{ gap: 8, width: '100%' }}>
                  <View style={styles.recordRow}>
                    <IconComp width={20} height={20} color={labelColor} />
                    <Text style={[styles.recordLabel, { color: labelColor, fontFamily: fontFamilyName }]}>
                      {item.label}：
                    </Text>
                    {item.label === '排便' ? (
                      <View style={{ flexDirection: 'row', gap: 6, flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
                        {['無', '有'].map((opt) => (
                          <Pressable
                            key={opt}
                            style={[
                              { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, width: 64, alignItems: 'center' },
                              poopState === opt
                                ? { backgroundColor: theme.accentHot + '15', borderColor: theme.accentHot }
                                : { backgroundColor: theme.primary + '05', borderColor: theme.primary + '20' }
                            ]}
                            onPress={() => setPoopState(opt)}
                          >
                            <Text style={{ fontSize: getFontSize(13, 'medium'), fontFamily: fontFamilyName, color: poopState === opt ? theme.accentHot : theme.primary + 'A0', fontWeight: poopState === opt ? '600' : '500' }}>
                              {opt}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : item.label === '飲食' ? (
                      <TextInput
                        style={[styles.recordValue, { color: valueColor, fontFamily: fontFamilyName, flex: 1, textAlign: 'left', padding: 0, paddingLeft: 24, margin: 0, minHeight: 24 }]}
                        value={feedState}
                        onChangeText={setFeedState}
                        multiline
                        selectTextOnFocus
                      />
                    ) : ['泡澡', '日照', '體重', '身長', '溫度', '濕度'].includes(item.label) ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <TextInput
                          style={[styles.recordValue, { color: valueColor, fontFamily: fontFamilyName, width: 64, textAlign: 'center', padding: 0, margin: 0, marginRight: 6 }]}
                          value={
                            item.label === '泡澡' ? bathMinutes :
                            item.label === '日照' ? baskMinutes :
                            item.label === '體重' ? weight :
                            item.label === '身長' ? length :
                            item.label === '溫度' ? temp :
                            humid
                          }
                          onChangeText={
                            item.label === '泡澡' ? setBathMinutes :
                            item.label === '日照' ? setBaskMinutes :
                            item.label === '體重' ? setWeight :
                            item.label === '身長' ? setLength :
                            item.label === '溫度' ? setTemp :
                            setHumid
                          }
                          keyboardType="numeric"
                          selectTextOnFocus
                        />
                        <Text style={[styles.recordValue, { color: labelColor, fontFamily: fontFamilyName }]}>
                          {item.label === '泡澡' || item.label === '日照' ? '分鐘' :
                           item.label === '體重' ? '公克' :
                           item.label === '身長' ? '公分' :
                           item.label === '溫度' ? '℃' :
                           '%'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.recordValue, { color: valueColor, fontFamily: fontFamilyName }]}>
                        {item.value}
                      </Text>
                    )}
                  </View>

                  {/* 如果是飲食，新增食慾選項拉霸 */}
                  {item.label === '飲食' && (
                    <View style={[styles.recordRow, { marginTop: 4, marginBottom: 4, width: '100%', paddingRight: 0, marginRight: -16 }]}>
                      {/* Icon 佔位 */}
                      <View style={{ width: 20 }} />
                      <Text style={[styles.recordLabel, { color: labelColor, fontFamily: fontFamilyName }]}>食慾：</Text>
                      <View style={styles.sliderRow}>
                        <Slider
                          style={{ flex: 1, height: 40, marginLeft: 16, marginRight: 16 }}
                          minimumValue={1}
                          maximumValue={5}
                          step={1}
                          value={appetite}
                          onValueChange={setAppetite}
                          minimumTrackTintColor={appetite === 1 ? '#FF3B30' : appetite === 2 ? '#FF9500' : '#34C759'}
                          maximumTrackTintColor={theme.primary + '30'}
                          thumbTintColor={appetite === 1 ? '#FF3B30' : appetite === 2 ? '#FF9500' : '#34C759'}
                        />
                        <Text style={[styles.recordLabel, { color: labelColor, fontFamily: fontFamilyName, width: 42, textAlign: 'center' }]}>
                          {appetite === 1 ? '差' : appetite === 2 ? '偏差' : appetite === 3 ? '普通' : appetite === 4 ? '偏好' : '好'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* ===== 卡片三：寫日記（可展開） ===== */}
          <Pressable
            style={[styles.actionCard, { backgroundColor: theme.background }]}
            onPress={() => setIsDiaryExpanded(!isDiaryExpanded)}
          >
            <IconDiaryWrite width={28} height={28} color={theme.primary} />
          </Pressable>

          {isDiaryExpanded && (
            <View style={[styles.diaryEditCard, { backgroundColor: theme.background }]}>
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
            style={[styles.actionCard, { backgroundColor: theme.background }]}
            onPress={() => setIsUploadExpanded(!isUploadExpanded)}
          >
            <IconUploadSvg width={28} height={28} color={theme.primary} />
          </Pressable>

          {isUploadExpanded && (
            <View style={[styles.uploadExpandedCard, { backgroundColor: theme.background }]}>
              <Pressable style={[styles.uploadAddButton, { borderColor: theme.primary }]} onPress={() => { /* TODO: 開啟檔案選擇器 */ }}>
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
    borderColor: '#FFC500',
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
  appetiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 30, // 縮排對齊
    marginTop: 4,
    marginBottom: 4,
  },
  appetiteLabel: {
    fontSize: getFontSize(14, 'medium'),
    marginRight: 16,
  },
  sliderRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderText: {
    fontSize: getFontSize(14, 'medium'),
  },
  sliderTrackContainer: {
    flex: 1,
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginHorizontal: 8,
  },
  sliderTrack: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 4,
    borderRadius: 2,
    top: '50%',
    marginTop: -2,
  },
  sliderPoint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // ===== 操作按鈕卡片 =====
  actionCard: {
    width: '96%',
    alignSelf: 'center',

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
    textAlign: 'justify',
  },

  // ===== 上傳展開卡片 =====
  uploadExpandedCard: {
    width: '96%',
    alignSelf: 'center',

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
    borderColor: '#FF7300',
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
