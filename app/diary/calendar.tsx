import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Image } from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import { getThemeTokens } from '../../src/theme/themeSettings';
import { getFontSize } from '../../src/theme/typographySettings';
import { FloatingActionBar } from '../../src/components/FloatingActionBar';
import { BaseScreen } from '../../src/components/common/BaseScreen';
import { paletteColors } from '../../src/theme/themeColorSettings';
import type { DiarySubView } from '../(tabs)/diary';

/**
 * 年份篩選月曆頁面
 * 點擊日記浮動按鈕 calendar 後進入
 * 包含年份選擇器（類似月份篩選器）與搜尋欄
 */
export default function CalendarFilterScreen({ onNavigate }: { onNavigate: (view: DiarySubView, diaryId?: number) => void }) {
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);
  const colorOrange = theme.primary;

  // 模擬可用年份（依數據資料動態新增）
  const availableYears = [2025, 2026];
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isYearDropdownVisible, setIsYearDropdownVisible] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // 月份資料
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 模擬每月有日記的天數資料（未來從資料庫取得）
  const monthDiaryCount: Record<number, number> = {
    1: 3, 2: 0, 3: 5, 4: 2, 5: 0, 6: 8,
    7: 12, 8: 4, 9: 0, 10: 1, 11: 0, 12: 0,
  };

  // 星期標題
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // 取得指定年月的天數
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // 取得指定年月第一天是星期幾
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  // 模擬有日記的日期（未來從資料庫取得）
  const getDiaryDays = (month: number): number[] => {
    if (month === 7) return [1, 5, 13, 17, 20, 25, 28, 30];
    if (month === 6) return [3, 8, 12, 15, 22, 26, 28, 30];
    if (month === 1) return [5, 15, 28];
    if (month === 3) return [2, 10, 14, 20, 30];
    if (month === 4) return [8, 22];
    if (month === 8) return [1, 12, 18, 25];
    if (month === 10) return [15];
    return [];
  };

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => onNavigate('list') },
          ]}
        />
      }
    >
      <View style={{ flex: 1 }}>
        {/* 背景點擊攔截 */}
        {isYearDropdownVisible && (
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 900, backgroundColor: 'transparent' }]}
            onPress={() => setIsYearDropdownVisible(false)}
          />
        )}

        {/* Header：年份選擇器 + 搜尋 */}
        <View style={[styles.header, { zIndex: 1000 }]}>
          {/* 左側佔位 */}
          <View style={{ width: 24 }} />

          {isSearchVisible ? (
            <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
              <TextInput
                style={[styles.searchInput, { color: theme.text, fontFamily: fontFamilyName }]}
                placeholder="搜尋"
                placeholderTextColor={theme.text + '80'}
                autoFocus
              />
            </View>
          ) : (
            <View style={[styles.selectorContainer, { zIndex: 1100 }]}>
              <Pressable
                style={[styles.yearSelector, { backgroundColor: theme.panelBackground, zIndex: 1200 }]}
                onPress={() => setIsYearDropdownVisible(!isYearDropdownVisible)}
              >
                <Text style={[styles.yearText, { fontFamily: fontFamilyName }]}>{selectedYear}年</Text>
              </Pressable>

              {/* 年份下拉選單 */}
              {isYearDropdownVisible && (
                <View style={[styles.dropdownContainer, { backgroundColor: theme.panelBackground, zIndex: 1100 }]}>
                  <ScrollView
                    style={styles.dropdownScroll}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    {availableYears.map((year, index) => (
                      <Pressable
                        key={year}
                        style={[
                          styles.dropdownItem,
                          year === selectedYear && styles.activeItem
                        ]}
                        onPress={() => {
                          setSelectedYear(year);
                          setIsYearDropdownVisible(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { fontFamily: fontFamilyName }]}>
                          {year}年
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          <Pressable onPress={() => setIsSearchVisible(!isSearchVisible)} style={{ zIndex: 1300 }}>
            <Image source={require('../../assets/icons/icon-search.png')} style={[styles.headerIcon, { tintColor: theme.panelBackground }]} />
          </Pressable>
        </View>

        {/* 月曆主體 */}
        <ScrollView
          contentContainerStyle={styles.calendarContent}
          showsVerticalScrollIndicator={false}
        >
          {months.map((month) => {
            const daysInMonth = getDaysInMonth(selectedYear, month);
            const firstDay = getFirstDayOfMonth(selectedYear, month);
            const diaryDays = getDiaryDays(month);
            const totalCells = firstDay + daysInMonth;
            const rows = Math.ceil(totalCells / 7);

            return (
              <View key={month} style={styles.monthBlock}>
                {/* 月份標題 */}
                <View style={styles.monthHeader}>
                  <Text style={[styles.monthTitle, { color: colorOrange, fontFamily: fontFamilyName }]}>
                    {month}月
                  </Text>
                  {monthDiaryCount[month] > 0 && (
                    <Text style={[styles.monthCount, { color: colorOrange, fontFamily: fontFamilyName }]}>
                      {monthDiaryCount[month]}篇
                    </Text>
                  )}
                </View>

                {/* 星期標題列 */}
                <View style={styles.weekRow}>
                  {weekDays.map((day) => (
                    <Text key={day} style={[styles.weekDayText, { color: colorOrange, fontFamily: fontFamilyName }]}>
                      {day}
                    </Text>
                  ))}
                </View>

                {/* 日期格子 */}
                {Array.from({ length: rows }).map((_, rowIdx) => (
                  <View key={rowIdx} style={styles.weekRow}>
                    {Array.from({ length: 7 }).map((_, colIdx) => {
                      const cellIdx = rowIdx * 7 + colIdx;
                      const dayNum = cellIdx - firstDay + 1;
                      const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                      const hasDiary = isValid && diaryDays.includes(dayNum);

                      return (
                        <View key={colIdx} style={styles.dayCell}>
                          {isValid && (
                            <Pressable
                              style={[
                                styles.dayButton,
                                hasDiary && styles.dayButtonActive,
                              ]}
                              onPress={() => {
                                if (hasDiary) {
                                  // TODO: 導航到該日日記
                                }
                              }}
                            >
                              <Text style={[
                                styles.dayText,
                                { fontFamily: fontFamilyName },
                                hasDiary
                                  ? { color: '#FFFFFF' }
                                  : { color: colorOrange + '60' }, // 淡色表示無日記
                              ]}>
                                {dayNum}
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
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
  yearSelector: {
    width: 150,
    height: 28,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  yearText: {
    color: '#FFFFFF',
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
    textAlign: 'center',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 32,
    width: 150,
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
  searchContainer: {
    width: 250,
    height: 40,
    borderRadius: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 1200,
  },
  searchInput: {
    flex: 1,
    fontSize: getFontSize(16, 'medium'),
    padding: 0,
  },
  calendarContent: {
    paddingHorizontal: 8,
    paddingBottom: 120,
    gap: 24,
  },
  monthBlock: {
    width: '100%',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: getFontSize(20, 'medium'),
    fontWeight: '600',
  },
  monthCount: {
    fontSize: getFontSize(14, 'small'),
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#F5A623',
  },
  dayText: {
    fontSize: getFontSize(13, 'small'),
  },
});
