import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions, ScrollView, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { getThemeTokens } from '../../src/theme/themeSettings';
import { getFontSize } from '../../src/theme/typographySettings';
import { FloatingActionBar } from '../../src/components/FloatingActionBar';
import { BaseScreen } from '../../src/components/common/BaseScreen';
import { STATUS_BAR_HEIGHT } from '../../src/theme/layoutSettings';

/**
 * 空日記畫面元件
 * 包含月份選擇器與尚無資料的提示內容
 */
export default function EmptyDiaryScreen() {
  const router = useRouter();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);
  const colorOrange = theme.primary;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const isDropdownVisibleRef = useRef(isDropdownVisible);

  // 確保全域手勢隨時能讀取到最新的開啟狀態
  useEffect(() => {
    isDropdownVisibleRef.current = isDropdownVisible;
  }, [isDropdownVisible]);

  const scrollRef = useRef<ScrollView>(null);

  // 用於跟蹤手勢捲動的起始位置
  const startScrollY = useRef(0);
  // 本地嚴格追蹤 Y 軸數值，避免 scrollTo 與 Native onScroll 之間的非同步衝突
  const currentScrollY = useRef(0);

  /**
   * 建立全螢幕手勢傳感器
   */
  const panResponder = useRef(
    PanResponder.create({
      // 放棄初次點擊觸發，讓底下的項目可以被點選
      onStartShouldSetPanResponder: () => false,
      // 僅在選單打開且手指滑動超過 5px 時攔截手勢權限
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return isDropdownVisibleRef.current && Math.abs(gestureState.dy) > 5;
      },
      // 當成功攔截手勢時，同步最新的滾軸位置
      onPanResponderGrant: () => {
        startScrollY.current = currentScrollY.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isDropdownVisibleRef.current && scrollRef.current) {
          // 向下滑動 = DY為正 = scrollY變小 = 往上滾
          let newY = startScrollY.current - gestureState.dy;
          
          const maxScroll = (12 * 40) - 200; // = 280
          if (newY < 0) newY = 0;
          if (newY > maxScroll) newY = maxScroll;
          
          currentScrollY.current = newY;
          scrollRef.current.scrollTo({ y: newY, animated: false });
        }
      },
      onPanResponderRelease: () => {},
      onPanResponderTerminate: () => {},
    })
  ).current;

  const currentMonth = selectedDate.getMonth() + 1;
  const currentYear = selectedDate.getFullYear();

  useEffect(() => {
    if (isDropdownVisible && scrollRef.current) {
      const monthIndex = selectedDate.getMonth();
      const scrollY = Math.max(0, (monthIndex - 2) * 40);

      currentScrollY.current = scrollY;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: scrollY, animated: false });
      }, 50);
    }
  }, [isDropdownVisible]);

  const generateMonths = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, i, 1);
      months.push({
        label: `${i + 1}月`,
        date: date
      });
    }
    return months;
  };

  const handleMonthSelect = (date: Date) => {
    setSelectedDate(date);
    setIsDropdownVisible(false);
  };

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'calendar', onPress: () => { } },
            { id: 'add', onPress: () => { } }
          ]}
        />
      }
    >
      {/* 頂層 PanResponder 容器包覆全域，以捕獲滑動 */}
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        {/* 背景點擊攔截，用來關閉選單 */}
        {isDropdownVisible && (
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 900, backgroundColor: 'transparent' }]}
            onPress={() => setIsDropdownVisible(false)}
          />
        )}

      {/* 頂部標題列 (Header) */}
      <View style={[styles.header, { zIndex: 1000 }]}>
        <Pressable onPress={() => { }}>
          <Image source={require('../../assets/icons/icon-menu.png')} style={[styles.headerIcon, { tintColor: theme.panelBackground }]} />
        </Pressable>

        <View style={[styles.selectorContainer, { zIndex: 1100 }]}>
          <Pressable
            style={[styles.monthSelector, { backgroundColor: theme.panelBackground, zIndex: 1200 }]}
            onPress={() => setIsDropdownVisible(!isDropdownVisible)}
          >
            <Text style={[styles.monthText, { fontFamily: fontFamilyName }]}>{currentMonth}月</Text>
          </Pressable>

          {/* 下拉選單：顯示前後各兩月，且支援全域滑動 */}
          {isDropdownVisible && (
            <View style={[styles.dropdownContainer, { backgroundColor: theme.panelBackground, zIndex: 1100 }]}>
              <ScrollView
                ref={scrollRef}
                style={styles.dropdownScroll}
                contentContainerStyle={{ flexGrow: 1 }}
                scrollEnabled={false} // 完全關閉原生滾動，徹底交由 PanResponder 掌控，避免衝突及卡頓
                showsVerticalScrollIndicator={false}
                bounces={false}
                nestedScrollEnabled={true}
              >
                {generateMonths().map((item, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.dropdownItem,
                      item.date.getMonth() === selectedDate.getMonth() && styles.activeItem
                    ]}
                    onPress={() => handleMonthSelect(item.date)}
                  >
                    <Text style={[styles.dropdownItemText, { fontFamily: fontFamilyName }]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <Pressable onPress={() => { }}>
          <Image source={require('../../assets/icons/icon-search.png')} style={[styles.headerIcon, { tintColor: theme.panelBackground }]} />
        </Pressable>
      </View>

      {/* 主要內容區塊：居中顯示「尚無日記」插圖與標題 */}
      <View style={styles.centerContent}>
        <Text style={[styles.title, { color: colorOrange, fontFamily: fontFamilyName }]}>尚無日記</Text>
        <Image
          source={require('../../assets/illustrations/illustration-lizard-02.png')}
          style={styles.illustration}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  selectorContainer: {
    alignItems: 'center',
    zIndex: 100,
  },
  monthSelector: {
    width: 150,
    height: 28,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE17B', // 模擬內陰影與背景色
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.1)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.05)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  monthText: {
    color: '#FFFFFF',
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
    textAlign: 'center',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 32,
    width: 150,
    height: 200, // 改為固定高度以確保捲動區域穩定
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  dropdownScroll: {
    width: '100%',
  },
  dropdownItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '500',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    paddingBottom: 20,
  },
  title: {
    fontSize: getFontSize(26, 'large'),
    marginBottom: 60,
    fontWeight: '500',
  },
  illustration: {
    width: Dimensions.get('window').width * 0.85,
    height: Dimensions.get('window').width * 0.85,
  }
});



