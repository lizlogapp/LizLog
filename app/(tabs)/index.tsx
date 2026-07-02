import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  Easing,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BaseScreen } from '../../src/components/common/BaseScreen';
import { ReminderItem, petIdToName } from '../../src/data/mockDiaryData';
import { paletteColors } from '../../src/theme/themeColorSettings';
import { useAuth } from '../../src/contexts/AuthContext';
import { diaryService, petService, reminderService } from '../../src/services/firestoreService';
import {
  STATUS_BAR_HEIGHT,
  TAB_BAR_HEIGHT,
  PANEL_CONTENT_MARGIN,
  CONTENT_PAGE_MARGIN,
  LOAD_ANIMATION_ACCELERATE_MS,
  borderRadius,
} from '../../src/theme/layoutSettings';
import { useAppLoad } from '../../src/contexts/AppLoadContext';
import { getThemeTokens } from '../../src/theme/themeSettings';
import { useTheme } from '../../src/theme/ThemeContext';
import { getFontSize } from '../../src/theme/typographySettings';

const { width: W, height: H } = Dimensions.get('window');
const PAGE_LEFT = PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN;
const PAGE_TOP = STATUS_BAR_HEIGHT + PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN;
const PAGE_WIDTH = W - (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;
const PAGE_HEIGHT = H - STATUS_BAR_HEIGHT - TAB_BAR_HEIGHT - (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;

const IMAGE_PADDING = 64;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const DYNAMIC_PAGE_HEIGHT = H - STATUS_BAR_HEIGHT - TAB_BAR_HEIGHT - insets.bottom - (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;

  const { isReady } = useAppLoad();
  const { themeId, fontFamilyName, isDemoMode } = useTheme();
  const theme = getThemeTokens(themeId);
  const router = useRouter();
  const { user } = useAuth();

  const [loadingComplete, setLoadingComplete] = useState(true);
  const [availablePets, setAvailablePets] = useState<string[]>([]); // 預設空陣列
  const [currentPetName, setCurrentPetName] = useState<string>('未設定'); // 預設未設定
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false); // 控制下拉選單顯示
  const [isConnected, setIsConnected] = useState<boolean>(false); // 預設未連線

  // 模擬未來從資料庫撈取的「最新一筆日記」物件
  interface DiaryRecord {
    id: string;
    day: string;
    month: string;
    weatherIcon: any;
    imageUrl: any;
  }
  const [latestDiary, setLatestDiary] = useState<DiaryRecord | null>(null); // 預設空

  const [reminders, setReminders] = useState<ReminderItem[]>([]); // 預設空陣列

  useEffect(() => {
    if (user) {
      // Load pets
      petService.getAll(user.uid).then(pets => {
        setAvailablePets(pets.map(p => p.name));
        setCurrentPetName(pets.length > 0 ? pets[0].name : '未設定');
      });

      // Load latest diary
      diaryService.getAll(user.uid).then(diaries => {
        if (diaries.length > 0) {
          const latest = diaries[0];
          const d = new Date(latest.date);
          const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
          setLatestDiary({
            id: latest.id,
            day: String(d.getDate()).padStart(2, '0'),
            month: monthNames[d.getMonth()],
            weatherIcon: latest.weatherIcon === 'sunny' ? require('../../assets/icons/weather-sunny.png') : require('../../assets/icons/weather-cloudy.png'),
            imageUrl: latest.imageUrl ? { uri: latest.imageUrl } : null,
          });
        } else {
          setLatestDiary(null);
        }
      });

      // Load reminders
      reminderService.getAll(user.uid).then(fsReminders => {
        const active = fsReminders.filter(r => r.isOn);
        const today = new Date();
        const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;
        setReminders(active.map(r => ({
          id: r.id,
          pets: r.pets,
          title: r.type + (r.note ? `（${r.note}）` : ''),
          date: dateStr,
          tagColor: r.tagColor,
          checked: false,
        })));
      });
    } else {
      setAvailablePets([]);
      setCurrentPetName('未設定');
      setLatestDiary(null);
      setReminders([]);
      setIsConnected(false);
    }
  }, [isDemoMode, user]);



  const pageStyle = {
    backgroundColor: paletteColors.RI_CHU,
    position: 'absolute' as const,
    top: STATUS_BAR_HEIGHT + PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN,
    bottom: TAB_BAR_HEIGHT + insets.bottom + PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN,
    left: PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN,
    right: PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN,
  };

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r))
    );
  };

  // 記事本標籤 7 種常見顏色 (黃、紅、橘、綠、淺藍、深藍、紫)
  const tagColors = [
    '#FFCA29', // Default (Yellow)
    '#FF3B30', // Red
    '#FA9215', // Orange
    '#34C759', // Green
    '#32ADE6', // Light Blue
    '#007AFF', // Blue
    '#AF52DE', // Purple
  ];

  const handleTagPress = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const currentIndex = Math.max(0, tagColors.indexOf(r.tagColor));
          const nextIndex = (currentIndex + 1) % tagColors.length;
          return { ...r, tagColor: tagColors[nextIndex] };
        }
        return r;
      })
    );
  };

  const [activeIcons, setActiveIcons] = useState({
    basking: false,
    food: false,
    bath: false,
    poop: false,
  });

  const toggleIcon = (key: keyof typeof activeIcons) => {
    setActiveIcons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <BaseScreen
        scrollable={false}
        floatingAction={null}
      >
        {/* 透明遮罩，點擊關閉選單 */}
        {isDropdownVisible && (
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 90,
              elevation: 9,
            }}
            onPress={() => setIsDropdownVisible(false)}
          />
        )}

        {/* 卡片 1：當前顯示 / 寵物切換下拉選單 */}
        <View style={[styles.cardHeader, isDropdownVisible ? { zIndex: 100 } : { zIndex: 1 }, { backgroundColor: theme.background }]}>
          <Text style={[styles.headerLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>當前顯示</Text>
          <Pressable
            onPress={() => {
              if (availablePets.length === 0) {
                router.push('/(tabs)/pets');
              } else {
                setIsDropdownVisible(!isDropdownVisible);
              }
            }}
          >
            <Text style={[styles.headerValue, { color: theme.text, fontFamily: fontFamilyName }]}>
              {currentPetName || '未設定'}
            </Text>
          </Pressable>

          {/* 懸浮下拉選單 (Dropdown) */}
          {isDropdownVisible && availablePets.length > 0 && (
            <View style={[styles.dropdownModal, { backgroundColor: theme.background }]}>
              <View style={styles.dropdownTail} />
              <ScrollView
                style={styles.dropdownScroll}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
              >
                {availablePets.map((pet, idx) => (
                  <Pressable
                    key={pet}
                    style={[
                      styles.dropdownItem,
                      idx === availablePets.length - 1 && { marginBottom: 0 }
                    ]}
                    onPress={() => {
                      setCurrentPetName(pet);
                      setIsDropdownVisible(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text, fontFamily: fontFamilyName }]}>
                      {pet}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 卡片 2：未連接感測器 & 快速紀錄 (四功能) */}
        <View style={[styles.sensorCardBlock, { backgroundColor: theme.background }]}>
          <View style={styles.sensorTopHalf}>
            {!isConnected ? (
              <Pressable onPress={() => router.push('/(tabs)/settings')}>
                <Text style={[styles.sensorText, { color: theme.text, fontFamily: fontFamilyName }]}>未連接感測器</Text>
              </Pressable>
            ) : (
              <View style={styles.sensorDataRow}>
                {/* 溫度區塊 */}
                <View style={styles.sensorDataItem}>
                  <View style={styles.sensorDataVerticalText}>
                    <Text style={[styles.sensorDataChar, { color: theme.primary, fontFamily: fontFamilyName }]}>溫</Text>
                    <Text style={[styles.sensorDataChar, { color: theme.primary, fontFamily: fontFamilyName }]}>度</Text>
                  </View>
                  <Text style={[styles.sensorDataValue, { color: theme.text, fontFamily: fontFamilyName }]}>31°C</Text>
                </View>

                {/* 濕度區塊 */}
                <View style={styles.sensorDataItem}>
                  <View style={styles.sensorDataVerticalText}>
                    <Text style={[styles.sensorDataChar, { color: theme.primary, fontFamily: fontFamilyName }]}>濕</Text>
                    <Text style={[styles.sensorDataChar, { color: theme.primary, fontFamily: fontFamilyName }]}>度</Text>
                  </View>
                  <Text style={[styles.sensorDataValue, { color: theme.text, fontFamily: fontFamilyName }]}>30%</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.actionIconsRow}>
            <Pressable onPress={() => toggleIcon('basking')}>
              <Image source={activeIcons.basking ? require('../../assets/icons/category-basking-active.png') : require('../../assets/icons/category-basking-default.png')} style={[styles.actionIcon, { tintColor: activeIcons.basking ? theme.primary : theme.accentHot }]} />
            </Pressable>
            <Pressable onPress={() => toggleIcon('food')}>
              <Image source={activeIcons.food ? require('../../assets/icons/category-food-active.png') : require('../../assets/icons/category-food-default.png')} style={[styles.actionIcon, { tintColor: activeIcons.food ? theme.primary : theme.accentHot }]} />
            </Pressable>
            <Pressable onPress={() => toggleIcon('bath')}>
              <Image source={activeIcons.bath ? require('../../assets/icons/category-bath-active.png') : require('../../assets/icons/category-bath-default.png')} style={[styles.actionIcon, { tintColor: activeIcons.bath ? theme.primary : theme.accentHot }]} />
            </Pressable>
            <Pressable onPress={() => toggleIcon('poop')}>
              <Image source={activeIcons.poop ? require('../../assets/icons/category-poop-active.png') : require('../../assets/icons/category-poop-default.png')} style={[styles.actionIcon, { tintColor: activeIcons.poop ? theme.primary : theme.accentHot }]} />
            </Pressable>
          </View>
        </View>

        {/* 卡片 3：提醒事項（無資料顯示引導，有資料顯示當日提醒） */}
        {reminders.length === 0 ? (
          <Pressable
            style={[styles.reminderEmptyBlock, { backgroundColor: theme.background }]}
            onPress={() => router.push('/(tabs)/pets/reminder?from=home')}
          >
            <Text style={[styles.diaryText, { color: theme.primary, fontFamily: fontFamilyName }]}>
              新增第一筆提醒
            </Text>
          </Pressable>
        ) : (
          <View style={[styles.reminderCardBlock, { backgroundColor: theme.background }]}>
            {(() => {
              const MAX_VISIBLE = 3;
              const visible = reminders.slice(0, MAX_VISIBLE);
              const overflow = reminders.length - MAX_VISIBLE;
              return (
                <>
                  {visible.map((reminder) => (
                    <View key={reminder.id} style={[styles.reminderItem, { backgroundColor: theme.background }]}>
                      <Text style={[styles.reminderDate, { color: theme.primary, fontFamily: fontFamilyName }]}>
                        {reminder.date}
                      </Text>
                      <Pressable
                        style={styles.reminderContent}
                        onPress={() => router.push('/(tabs)/pets/reminder?from=home')}
                      >
                        <Text style={[styles.reminderTitle, { color: theme.text, fontFamily: fontFamilyName }]} numberOfLines={1}>
                          {reminder.title}
                        </Text>
                        {reminder.pets.length > 0 && (
                          <Text style={[styles.reminderPet, { color: theme.accentHot, fontFamily: fontFamilyName }]} numberOfLines={1}>
                            {reminder.pets.length > 1
                              ? `${reminder.pets.length}隻`
                              : reminder.pets[0].length > 8
                                ? reminder.pets[0].slice(0, 8) + '...'
                                : reminder.pets[0]
                            }
                          </Text>
                        )}
                      </Pressable>
                      <Pressable onPress={() => handleTagPress(reminder.id)} style={styles.tagContainer}>
                        <Image
                          source={require('../../assets/icons/tag-base.png')}
                          style={[styles.reminderBarImage, { tintColor: reminder.tagColor === '#FFCA29' ? undefined : reminder.tagColor }]}
                          resizeMode="contain"
                        />
                      </Pressable>
                    </View>
                  ))}
                  {overflow > 0 && (
                    <Pressable
                      onPress={() => router.push('/(tabs)/pets/reminder?from=home')}
                      style={{ alignItems: 'center', paddingVertical: 4 }}
                    >
                      <Text style={{ color: theme.primary, fontFamily: fontFamilyName, fontSize: getFontSize(14, 'medium'), letterSpacing: 4 }}>
                        還有 {overflow} 筆提醒
                      </Text>
                    </Pressable>
                  )}
                </>
              );
            })()}
          </View>
        )}

        {/* 卡片 4：新增/顯示最近一篇日記 */}
        {!latestDiary ? (
          <Pressable
            style={[styles.diaryBlock, { backgroundColor: theme.background }]}
            onPress={() => router.push('/(tabs)/diary')}
          >
            <Text style={[styles.diaryText, { color: theme.primary, fontFamily: fontFamilyName }]}>
              新增第一篇日記
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.diaryBlockActive, { backgroundColor: theme.background }]}
            onPress={() => router.push('/(tabs)/diary/view?from=home')}
          >
            {/* 左側：精緻雜誌風資訊區塊 (資料綁定) */}
            <View style={styles.diaryActiveLeft}>
              <Text style={[styles.diaryDateDay, { color: theme.primary, fontFamily: fontFamilyName }]}>{latestDiary.day}</Text>
              <Text style={[styles.diaryDateMonth, { color: theme.primary, fontFamily: fontFamilyName }]}>{latestDiary.month}</Text>
              <Image source={latestDiary.weatherIcon} style={styles.diaryWeatherIcon} />
            </View>
            {/* 右側：滿版使用者設定的圖片 (資料綁定) */}
            <View style={styles.diaryActiveRight}>
              <Image source={latestDiary.imageUrl} style={styles.diaryActiveImage} />
            </View>
          </Pressable>
        )}

      </BaseScreen>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  homeContainer: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  page: {
    position: 'absolute',
    borderRadius: borderRadius.md,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 7,
    zIndex: 999, // 確保蓋在 home 之上
  },
  imageWrapper: {
    flex: 1,
    padding: IMAGE_PADDING,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageAnimated: {
    position: 'absolute',
    top: IMAGE_PADDING,
    left: IMAGE_PADDING,
    right: IMAGE_PADDING,
    bottom: IMAGE_PADDING,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layerLight: { zIndex: 1 },
  layerDark: { zIndex: 2 },
  layerLogo: { zIndex: 3 },
  image: {
    width: '100%',
    height: '100%',
    transform: [{ translateY: -PAGE_HEIGHT * (1 / 2 - 4 / 9) }],
  },

  // ===== 首頁卡片共用樣式 =====
  cardBlock: { // Might not be used, but good to update
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.15)',
    borderLeftColor: 'rgba(0,0,0,0.15)',
    borderBottomColor: 'rgba(255,255,255,0.5)',
    borderRightColor: 'rgba(255,255,255,0.5)',
  },

  cardHeader: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    height: 55, // 保持小一點，讓日記有更多空間
    paddingHorizontal: 24,
    marginBottom: 16, // 統一所有間距為 16
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: 'inset 2px 2px 7px rgba(0, 0, 0, 0.25)',
  },
  headerLabel: {
    fontSize: getFontSize(18, 'medium'),
  },
  headerValue: {
    fontSize: getFontSize(18, 'medium'),
    // 移除 fontWeight，統一樣式跟未連接感測器一致
  },

  dropdownModal: {
    position: 'absolute',
    top: 55, // 放置於 header 下方，貼合卡片底部
    right: 4, // 留空間避免陰影裁切
    width: 150, 
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  dropdownScroll: {
    maxHeight: 280,
  },
  dropdownTail: {
    display: 'none', 
  },
  dropdownItem: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    marginHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: getFontSize(18, 'medium'),
    fontWeight: '600',
    letterSpacing: 1,
  },
  dropdownDivider: {
    display: 'none',
  },

  sensorCardBlock: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    height: 125,
    marginBottom: 16,
    paddingVertical: 10,
    boxShadow: 'inset 2px 2px 7px rgba(0, 0, 0, 0.25)',
  },
  sensorTopHalf: {
    flex: 1, // 獨佔上方所有可用空間
    width: '100%',
    justifyContent: 'center', // 將內容（未設定或數據）完美居中
    alignItems: 'center',
  },
  sensorText: {
    fontSize: getFontSize(18, 'medium'),
    textAlign: 'center',
  },
  sensorDataRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  sensorDataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sensorDataVerticalText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorDataChar: {
    fontSize: getFontSize(18, 'medium'),
    lineHeight: 22,
  },
  sensorDataValue: {
    fontSize: getFontSize(48, 'medium'), // 超大字型展示溫度濕度
    marginLeft: 4,
  },
  actionIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 4,
  },
  actionIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },

  reminderCardBlock: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 5,
    marginBottom: 16,
    gap: 6,
    boxShadow: 'inset 2px 2px 7px rgba(0, 0, 0, 0.25)',
  },
  reminderEmptyBlock: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 45,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 2px 2px 7px rgba(0, 0, 0, 0.25)',
  },
  // Reminder 單一項目
  reminderItem: {
    height: 45,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    paddingLeft: 12,
    paddingRight: 8,
  },
  reminderDate: {
    fontSize: getFontSize(14, 'medium'),
    fontWeight: '600',
    minWidth: 38,
    textAlign: 'center',
    marginRight: 6,
  },
  reminderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderPet: {
    fontSize: getFontSize(11, 'medium'),
    fontWeight: '600',
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: 50,
  },
  reminderTitle: {
    flex: 1,
    fontSize: getFontSize(16, 'medium'),
  },
  tagContainer: {
    paddingLeft: 4,
  },
  reminderBarImage: {
    width: 14,
    height: 36,
    borderRadius: 6,
  },

  diaryBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flex: 1,
    minHeight: 60,
    width: '96%',
    alignSelf: 'center',
    padding: 20,
    marginBottom: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 7px rgba(0, 0, 0, 0.25)',
  },
  diaryText: {
    fontSize: getFontSize(18, 'medium'),
    textAlign: 'center', // 確保內部文字也完美置中
    zIndex: 2,
  },
  diaryImage: {
    flex: 1,
    width: '100%',
    maxHeight: 150, // 避免圖片超過這個高度
    resizeMode: 'contain',
    zIndex: 1,
  },
  diaryBlockActive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flex: 1,
    minHeight: 140,
    width: '96%',
    alignSelf: 'center',
    marginBottom: 0,
    flexDirection: 'row',
    overflow: 'hidden', // 關鍵：讓滿版圖片服貼在這個元件的圓角內
    boxShadow: '0px 4px 7px rgba(0, 0, 0, 0.25)',
  },
  diaryActiveLeft: {
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  diaryActiveRight: {
    flex: 1, // 讓右側影像完全吞噬剩下的全部空間
  },
  diaryActiveImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // 完美覆蓋
  },
  diaryDateDay: {
    fontSize: getFontSize(36, 'medium'),
  },
  diaryDateMonth: {
    fontSize: getFontSize(15, 'medium'),
    letterSpacing: 2,
  },
  diaryWeatherIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginTop: 2,
  },
});
