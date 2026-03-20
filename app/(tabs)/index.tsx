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
import { paletteColors } from '../../src/theme/themeColorSettings';
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
  const { isReady } = useAppLoad();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);

  const [loadingComplete, setLoadingComplete] = useState(false);

  // 動畫相關
  const img1Opacity = useRef(new Animated.Value(0)).current;
  const img2Opacity = useRef(new Animated.Value(0)).current;
  const img3Opacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasAcceleratedRef = useRef(false);

  const finishLoading = () => {
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start(() => setLoadingComplete(true));
  };

  useEffect(() => {
    if (!isReady || hasAcceleratedRef.current) return;
    hasAcceleratedRef.current = true;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    Animated.parallel([
      Animated.timing(img1Opacity, {
        toValue: 0,
        duration: LOAD_ANIMATION_ACCELERATE_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(img2Opacity, {
        toValue: 0,
        duration: LOAD_ANIMATION_ACCELERATE_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(img3Opacity, {
        toValue: 1,
        duration: LOAD_ANIMATION_ACCELERATE_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 短暫停留 Logo 後淡入首頁
      setTimeout(finishLoading, 800);
    });
  }, [isReady, img1Opacity, img2Opacity, img3Opacity, overlayOpacity]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      Animated.timing(img1Opacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, 800);

    const t2 = setTimeout(() => {
      Animated.timing(img2Opacity, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, 2000);

    const t3 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(img1Opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.timing(img2Opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.timing(img3Opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(finishLoading, 1000);
      });
    }, 4400);

    timersRef.current = [t1, t2, t3];
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const pageStyle = {
    backgroundColor: paletteColors.RI_CHU,
    left: PAGE_LEFT,
    top: PAGE_TOP,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  };

  // State：首頁打卡項目列表
  const [reminders, setReminders] = useState([
    { id: '1', pet: '', title: '新增第一筆提醒', tagColor: '#FFCA29', checked: false },
  ]);

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
      {/* ===== 真實首頁內容 ===== */}
      <ScrollView
        style={[styles.homeContainer, { left: PAGE_LEFT, top: PAGE_TOP, width: PAGE_WIDTH, height: PAGE_HEIGHT }]}
        contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 卡片 1：當前顯示 / 未設定 */}
        <View style={styles.cardHeader}>
          <Text style={[styles.headerLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>當前顯示</Text>
          <Text style={[styles.headerValue, { color: theme.text, fontFamily: fontFamilyName }]}>未設定</Text>
        </View>

        {/* 卡片 2：未連接感測器 & 快速紀錄 (四功能) */}
        <View style={styles.sensorCardBlock}>
          <Text style={[styles.sensorText, { color: theme.text, fontFamily: fontFamilyName }]}>未連接感測器</Text>
          <View style={styles.actionIconsRow}>
            <Pressable onPress={() => toggleIcon('basking')}>
              <Image source={activeIcons.basking ? require('../../assets/icons/category-basking-active.png') : require('../../assets/icons/category-basking-default.png')} style={styles.actionIcon} />
            </Pressable>
            <Pressable onPress={() => toggleIcon('food')}>
              <Image source={activeIcons.food ? require('../../assets/icons/category-food-active.png') : require('../../assets/icons/category-food-default.png')} style={styles.actionIcon} />
            </Pressable>
            <Pressable onPress={() => toggleIcon('bath')}>
              <Image source={activeIcons.bath ? require('../../assets/icons/category-bath-active.png') : require('../../assets/icons/category-bath-default.png')} style={styles.actionIcon} />
            </Pressable>
            <Pressable onPress={() => toggleIcon('poop')}>
              <Image source={activeIcons.poop ? require('../../assets/icons/category-poop-active.png') : require('../../assets/icons/category-poop-default.png')} style={styles.actionIcon} />
            </Pressable>
          </View>
        </View>

        {/* 卡片 3：提醒事項 */}
        <View style={styles.reminderCardBlock}>
          {reminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderItem}>
              {/* 拖拉與打卡 */}
              <View style={styles.reminderLeft}>
                <Image source={require('../../assets/icons/icon-drag.png')} style={styles.dragIcon} />
                <Pressable onPress={() => toggleReminder(reminder.id)} style={styles.checkboxContainer}>
                  <Image
                    source={
                      reminder.checked
                        ? require('../../assets/icons/checkbox-checked.png')
                        : require('../../assets/icons/checkbox-unchecked.png')
                    }
                    style={styles.checkboxIcon}
                  />
                </Pressable>
              </View>

              {/* 寵物名與標題 */}
              <View style={styles.reminderContent}>
                {!!reminder.pet && (
                  <Text style={[styles.reminderPet, { color: theme.primary, fontFamily: fontFamilyName }]}>
                    {reminder.pet}
                  </Text>
                )}
                <Text style={[styles.reminderTitle, { color: theme.text, fontFamily: fontFamilyName }]} numberOfLines={1}>
                  {reminder.title}
                </Text>
              </View>

              {/* 右側顏色標籤 */}
              <Pressable onPress={() => handleTagPress(reminder.id)} style={styles.tagContainer}>
                <Image 
                  source={require('../../assets/icons/tag-base.png')} 
                  style={[styles.reminderBarImage, { tintColor: reminder.tagColor === '#FFCA29' ? undefined : reminder.tagColor }]} 
                  resizeMode="contain"
                />
              </Pressable>
            </View>
          ))}
        </View>

        {/* 卡片 4：新增日記 */}
        <View style={styles.diaryBlock}>
          <Text style={[styles.diaryText, { color: theme.primary, fontFamily: fontFamilyName }]}>
            新增第一篇日記
          </Text>
          <Image source={require('../../assets/illustrations/lizard-head-light.png')} style={styles.diaryImage} resizeMode="contain" />
        </View>

      </ScrollView>

      {/* ===== 載入過場動畫覆蓋層 ===== */}
      {!loadingComplete && (
        <Animated.View style={[styles.page, pageStyle, { opacity: overlayOpacity }]} pointerEvents={loadingComplete ? 'none' : 'auto'}>
          <View style={styles.imageWrapper}>
            <Animated.View style={[styles.imageAnimated, styles.layerLight, { opacity: img1Opacity }]}>
              <Image source={require('../../assets/illustrations/lizard-head-light.png')} style={styles.image} resizeMode="contain" />
            </Animated.View>
            <Animated.View style={[styles.imageAnimated, styles.layerDark, { opacity: img2Opacity }]}>
              <Image source={require('../../assets/illustrations/lizard-head-dark.png')} style={styles.image} resizeMode="contain" />
            </Animated.View>
            <Animated.View style={[styles.imageAnimated, styles.layerLogo, { opacity: img3Opacity }]}>
              <Image source={require('../../assets/branding/logos/logo-square-with-text.png')} style={styles.image} resizeMode="contain" />
            </Animated.View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  homeContainer: {
    position: 'absolute',
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
  cardBlock: {
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: 'inset 2px 2px 7px rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  
  // Header 專用 (對話框)
  cardHeader: {
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
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  headerLabel: {
    fontSize: getFontSize(18, 'medium'),
  },
  headerValue: {
    fontSize: getFontSize(18, 'medium'),
    // 移除 fontWeight，統一樣式跟未連接感測器一致
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -8,
    right: 48,
    width: 16,
    height: 16,
    backgroundColor: paletteColors.RI_CHU,
    transform: [{ rotate: '45deg' }],
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#FCFAF4',
    borderBottomRightRadius: 4,
  },

  // Sensor 卡片
  sensorCardBlock: {
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    height: 160, // 應要求恢復至 160
    marginBottom: 16, // 統一間距為 16
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32, // 配合 160 的高度加大圖文距離
    // React Native 0.74+ 支援 boxShadow inset
    boxShadow: 'inset 2px 2px 7px rgba(0, 0, 0, 0.25)',
    // Fallback: 針對尚未支援的舊環境，加個內縮邊框擬合內陰影感
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  sensorText: {
    fontSize: getFontSize(18, 'medium'),
    textAlign: 'center',
  },
  actionIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  actionIcon: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },

  // Reminder 大框
  reminderCardBlock: {
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    paddingVertical: 8, 
    paddingHorizontal: 5,
    marginBottom: 16, // 統一間距為 16
    gap: 8, 
    boxShadow: 'inset 2px 2px 7px rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  // Reminder 單一項目
  reminderItem: {
    height: 55,
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
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragIcon: {
    width: 24,
    height: 24,
    marginRight: 6,
    tintColor: paletteColors.MU_CHENG, // 拖拉把手通常與主題橘色搭配
  },
  checkboxContainer: {
    padding: 4,
    marginRight: 10,
  },
  checkboxIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  reminderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderPet: {
    fontSize: getFontSize(16, 'medium'),
    marginRight: 10,
    fontWeight: 'bold',
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

  // Diary 卡片
  diaryBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flex: 1, 
    minHeight: 160, 
    width: '98%',
    alignSelf: 'center',
    padding: 12, 
    marginBottom: 0, // 設為 0，讓底部距離僅吃 ScrollView 的 16 padding，保持等距
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center', 
    gap: 12, 
    boxShadow: '0px 4px 7px rgba(0, 0, 0, 0.25)',
  },
  diaryText: {
    fontSize: getFontSize(18, 'medium'),
    textAlign: 'center', // 確保內部文字也完美置中
    zIndex: 2,
  },
  diaryImage: {
    width: 150,
    height: 150, // 必須要有明確高度或比例，否則圖片會塌縮導致文字位置跑掉
    resizeMode: 'contain',
    zIndex: 1,
  },
});
