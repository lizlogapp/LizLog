import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions, ScrollView, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { getThemeTokens } from '../../src/theme/themeSettings';
import { getFontSize } from '../../src/theme/typographySettings';
import { FloatingActionBar } from '../../src/components/FloatingActionBar';
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
  
  // 狀態管理：目前選中的日期與選單顯示狀態
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  
  // 用於跟蹤手勢捲動的起始位置
  const startScrollY = useRef(0);
  const currentScrollY = useRef(0);

  /**
   * 處理滾動事件以記錄目前的滾動位置
   */
  const handleScroll = (event: any) => {
    currentScrollY.current = event.nativeEvent.contentOffset.y;
  };

  /**
   * 建立全螢幕手勢傳感器
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // 紀錄手勢開始時的捲動位置
        startScrollY.current = currentScrollY.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isDropdownVisible && scrollRef.current) {
          // 根據垂直位移量的相反方向捲動 (向上滑則列表向下捲)
          const newY = startScrollY.current - gestureState.dy;
          scrollRef.current.scrollTo({ y: newY, animated: false });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // 如果幾乎沒有移動 (位移 < 10)，視為點擊事件，關閉選單
        if (Math.abs(gestureState.dy) < 10 && Math.abs(gestureState.dx) < 10) {
          setIsDropdownVisible(false);
        }
      },
      onPanResponderTerminate: () => {
        // 處理手勢中斷
      },
    })
  ).current;

  /**
   * 當選單開啟時，自動捲動到選中月份的位置
   * 前後各兩月，所以將目標月份置中於視窗 (40px * (index - 2))
   */
  useEffect(() => {
    if (isDropdownVisible && scrollRef.current) {
      const monthIndex = selectedDate.getMonth();
      const scrollY = Math.max(0, (monthIndex - 2) * 40);
      
      // 使用小延遲確保 ScrollView 已經佈局完成
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: scrollY, animated: false });
      }, 50);
    }
  }, [isDropdownVisible]);
  
  // 獲取目前選中的月份 (1-12)
  const currentMonth = selectedDate.getMonth() + 1;
  const currentYear = selectedDate.getFullYear();

  /**
   * 產生月份列表 (1月至 12月)
   */
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

  /**
   * 處理月份選擇點擊事件
   * @param date 選中的日期物件
   */
  const handleMonthSelect = (date: Date) => {
    setSelectedDate(date);
    setIsDropdownVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 全螢幕手勢擷取層 (僅在選單開啟時顯示) */}
      {isDropdownVisible && (
        <View 
          {...panResponder.panHandlers}
          style={[StyleSheet.absoluteFill, { zIndex: 900, backgroundColor: 'transparent' }]} 
        />
      )}

      {/* 頂部標題列 (Header) */}
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 16, zIndex: 1000 }]}>
        <Pressable onPress={() => {}}>
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
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  showsVerticalScrollIndicator={true}
                  bounces={true}
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
        
        <Pressable onPress={() => {}}>
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
          />
        </View>

      {/* 底部浮動操作列 (Floating Action Bar) */}
      <FloatingActionBar
        actions={[
          { id: 'calendar', onPress: () => {} },
          { id: 'add', onPress: () => {} }
        ]}
      />
    </View>
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



