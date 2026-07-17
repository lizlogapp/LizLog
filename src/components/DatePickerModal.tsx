import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import { paletteColors } from '../theme/themeColorSettings';
import { useTheme } from '../theme/ThemeContext';
import { getFontSize } from '../theme/typographySettings';

type CalendarCell = {
  day: number;
  isCurrentMonth: boolean;
  date: Date;
};

interface Props {
  visible: boolean;
  currentDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function DatePickerModal({ visible, currentDate, onClose, onSelectDate }: Props) {
  const { fontFamilyName } = useTheme();
  const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth()); // 0-11
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');

  // Update internal calendar view if visible gets toggled or currentDate changes
  useEffect(() => {
    if (visible) {
      setDisplayYear(currentDate.getFullYear());
      setDisplayMonth(currentDate.getMonth());
      setViewMode('days');
    }
  }, [visible, currentDate]);

  const generateDays = (): CalendarCell[] => {
    const days: CalendarCell[] = [];
    const firstDayIndex = new Date(displayYear, displayMonth, 1).getDay();
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(displayYear, displayMonth, 0).getDate();

    // Fill previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(displayYear, displayMonth - 1, daysInPrevMonth - i)
      });
    }
    // Fill current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(displayYear, displayMonth, i)
      });
    }
    // Fill next month leading days
    let nextDay = 1;
    while (days.length % 7 !== 0 || days.length < 42) {
      days.push({
        day: nextDay++,
        isCurrentMonth: false,
        date: new Date(displayYear, displayMonth + 1, nextDay - 1)
      });
    }
    return days;
  };

  const calendarDays = generateDays();

  const handleDayPress = (item: CalendarCell) => {
    onSelectDate(item.date);
    onClose();
  };

  const handlePrevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  const isSameDate = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.calendarContainer} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setViewMode(viewMode === 'years' ? 'days' : 'years')} style={styles.headerBtn}>
              <Text style={[styles.headerYear, { fontFamily: fontFamilyName }]}>{displayYear}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setViewMode(viewMode === 'months' ? 'days' : 'months')} style={styles.headerBtn}>
              <Text style={[styles.headerMonth, { fontFamily: fontFamilyName }]}>{displayMonth + 1}月</Text>
            </TouchableOpacity>
          </View>

          {viewMode === 'days' && (
            <>
              {/* Days of Week Row */}
              <View style={styles.weekRow}>
                {DAYS_OF_WEEK.map((day, idx) => (
                  <Text key={idx} style={[styles.weekText, { fontFamily: fontFamilyName }]}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {calendarDays.map((item, idx) => {
                  const selected = isSameDate(item.date, currentDate);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.dayCell, selected && styles.dayCellSelected]}
                      onPress={() => handleDayPress(item)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { fontFamily: fontFamilyName },
                          !item.isCurrentMonth && styles.dayTextFaded
                        ]}
                      >
                        {item.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {viewMode === 'months' && (
            <View style={styles.monthsGrid}>
              {Array.from({ length: 12 }).map((_, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.monthCell, displayMonth === i && styles.monthCellSelected]} 
                  onPress={() => { setDisplayMonth(i); setViewMode('days'); }}
                >
                  <Text style={[styles.monthText, { fontFamily: fontFamilyName }]}>{i + 1}月</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {viewMode === 'years' && (
            <ScrollView style={styles.yearsScroll} contentContainerStyle={styles.yearsGrid} showsVerticalScrollIndicator={false}>
              {Array.from({ length: 21 }).map((_, i) => {
                const y = new Date().getFullYear() - 10 + i;
                return (
                  <TouchableOpacity 
                    key={y} 
                    style={[styles.yearCell, displayYear === y && styles.yearCellSelected]} 
                    onPress={() => { setDisplayYear(y); setViewMode('days'); }}
                  >
                    <Text style={[styles.yearText, { fontFamily: fontFamilyName }]}>{y}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // slight dim over page
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    width: 320,
    minHeight: 410,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerYear: {
    fontSize: getFontSize(24, 'medium'),
    color: paletteColors.MU_CHENG,
  },
  headerMonth: {
    fontSize: getFontSize(24, 'medium'),
    color: paletteColors.MU_CHENG,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekText: {
    width: 36,
    textAlign: 'center',
    fontSize: getFontSize(14, 'medium'),
    color: paletteColors.MU_CHENG,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 18, // pure circle
  },
  dayCellSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    // Provide a subtle border mimicking the faint circle matching user spec
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  dayText: {
    fontSize: getFontSize(16, 'medium'),
    color: paletteColors.MU_CHENG,
  },
  dayTextFaded: {
    opacity: 0.5,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  monthCell: {
    width: '30%',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
  },
  monthCellSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  monthText: {
    fontSize: getFontSize(18, 'medium'),
    color: paletteColors.MU_CHENG,
  },
  yearsScroll: {
    maxHeight: 250,
    marginTop: 10,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  yearCell: {
    width: '30%',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
  },
  yearCellSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  yearText: {
    fontSize: getFontSize(18, 'medium'),
    color: paletteColors.MU_CHENG,
  },
});
