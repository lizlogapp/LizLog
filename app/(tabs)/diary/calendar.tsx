import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Image } from 'react-native';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { useAuth } from '../../../src/contexts/AuthContext';
import { diaryService, DiaryDoc } from '../../../src/services/firestoreService';

export default function CalendarFilterScreen() {
  const router = useRouter();
  const { themeId, fontFamilyName, isDemoMode } = useTheme();
  const theme = getThemeTokens(themeId);
  const colorOrange = theme.primary;
  const { user } = useAuth();

  const [firestoreDiaries, setFirestoreDiaries] = useState<(DiaryDoc & { id: string })[]>([]);

  useEffect(() => {
    if (isDemoMode || !user) {
      setFirestoreDiaries([]);
      return;
    }
    const unsubscribeDiaries = diaryService.onDiariesChanged(user.uid, (diaries) => {
      setFirestoreDiaries(diaries);
    });
    return () => unsubscribeDiaries();
  }, [isDemoMode, user]);

  const currentYearInt = new Date().getFullYear();
  let availableYears = [currentYearInt];
  if (isDemoMode) {
    availableYears = [currentYearInt - 1, currentYearInt];
  } else if (firestoreDiaries.length > 0) {
    let oldestYear = currentYearInt;
    firestoreDiaries.forEach(d => {
      const y = new Date(d.date).getFullYear();
      if (y < oldestYear) oldestYear = y;
    });
    availableYears = [];
    for (let y = oldestYear; y <= currentYearInt; y++) {
      availableYears.push(y);
    }
  }

  const [selectedYear, setSelectedYear] = useState<number>(currentYearInt);
  const [isYearDropdownVisible, setIsYearDropdownVisible] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const getMonthDiaryCount = (month: number): number => {
    if (isDemoMode) {
      const mockCount: Record<number, number> = {
        1: 3, 2: 0, 3: 5, 4: 2, 5: 0, 6: 8,
        7: 12, 8: 4, 9: 0, 10: 1, 11: 0, 12: 0,
      };
      return selectedYear === currentYearInt ? (mockCount[month] || 0) : 0;
    }
    return firestoreDiaries.filter(d => {
      const date = new Date(d.date);
      return date.getFullYear() === selectedYear && (date.getMonth() + 1) === month;
    }).length;
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const getDiaryDays = (month: number): number[] => {
    if (isDemoMode && selectedYear === currentYearInt) {
      if (month === 7) return [1, 5, 13, 17, 20, 25, 28, 30];
      if (month === 6) return [3, 8, 12, 15, 22, 26, 28, 30];
      if (month === 1) return [5, 15, 28];
      if (month === 3) return [2, 10, 14, 20, 30];
      if (month === 4) return [8, 22];
      if (month === 8) return [1, 12, 18, 25];
      if (month === 10) return [15];
      return [];
    }
    
    const days = new Set<number>();
    firestoreDiaries.forEach(d => {
      const date = new Date(d.date);
      if (date.getFullYear() === selectedYear && (date.getMonth() + 1) === month) {
        days.add(date.getDate());
      }
    });
    return Array.from(days);
  };

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => router.navigate('/(tabs)/diary') },
          ]}
        />
      }
    >
      <View style={{ flex: 1 }}>
        {isYearDropdownVisible && (
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 900, backgroundColor: 'transparent' }]}
            onPress={() => setIsYearDropdownVisible(false)}
          />
        )}

        <View style={[styles.header, { zIndex: 1000 }]}>
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
                <Text style={[styles.yearText, { color: theme.panelPatternText, fontFamily: fontFamilyName }]}>{selectedYear}年</Text>
              </Pressable>

              {isYearDropdownVisible && (
                <View style={[styles.dropdownContainer, { backgroundColor: theme.panelBackground, zIndex: 1100 }]}>
                  <ScrollView
                    style={styles.dropdownScroll}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    {availableYears.map((year) => (
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
                        <Text style={[styles.dropdownItemText, { color: theme.panelPatternText, fontFamily: fontFamilyName }]}>
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
            <Image source={require('../../../assets/icons/icon-search.png')} style={[styles.headerIcon, { tintColor: theme.primary }]} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.calendarContent}
          showsVerticalScrollIndicator={false}
        >
          {months.map((month) => {
            const daysInMonth = getDaysInMonth(selectedYear, month);
            const firstDay = getFirstDayOfMonth(selectedYear, month);
            const diaryDays = getDiaryDays(month);
            const monthCount = getMonthDiaryCount(month);
            const totalCells = firstDay + daysInMonth;
            const rows = Math.ceil(totalCells / 7);

            return (
              <View key={month} style={[styles.monthBlock, { backgroundColor: theme.background }]}>
                <View style={styles.monthHeader}>
                  <Text style={[styles.monthTitle, { color: colorOrange, fontFamily: fontFamilyName }]}>
                    {month}月
                  </Text>
                  {monthCount > 0 && (
                    <Text style={[styles.monthCount, { color: colorOrange, fontFamily: fontFamilyName }]}>
                      {monthCount}篇
                    </Text>
                  )}
                </View>

                <View style={styles.weekRow}>
                  {weekDays.map((day) => (
                    <Text key={day} style={[styles.weekDayText, { color: colorOrange, fontFamily: fontFamilyName }]}>
                      {day}
                    </Text>
                  ))}
                </View>

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
                                  ? { color: colorOrange }
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
    backgroundColor: 'rgba(255, 150, 0, 0.15)',
  },
  dayText: {
    fontSize: getFontSize(13, 'small'),
  },
});
