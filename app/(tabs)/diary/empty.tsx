import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { BaseScreen } from '../../../src/components/common/BaseScreen';

/**
 * Empty diary screen - shown when there are no diary entries for the selected month.
 */
export default function EmptyDiaryScreen() {
  const router = useRouter();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);
  const colorOrange = theme.primary;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isPetDropdownVisible, setIsPetDropdownVisible] = useState(false);
  const [availablePets] = useState<string[]>(['ALL']);

  const currentMonth = selectedDate.getMonth() + 1;
  const currentYear = selectedDate.getFullYear();

  const generateMonths = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push({ label: `${i + 1}\u6708`, date: new Date(currentYear, i, 1) });
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
            { id: 'calendar', onPress: () => router.push('/diary/calendar') },
            { id: 'add', onPress: () => router.push('/diary/add') },
          ]}
        />
      }
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop to close dropdowns */}
        {(isDropdownVisible || isPetDropdownVisible) && (
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 900, backgroundColor: 'transparent' }]}
            onPress={() => { setIsDropdownVisible(false); setIsPetDropdownVisible(false); }}
          />
        )}

        {/* Header */}
        <View style={[styles.header, { zIndex: 1000 }]}>
          {!isSearchVisible && (
            <View style={{ zIndex: 1500 }}>
              <Pressable onPress={() => setIsPetDropdownVisible(!isPetDropdownVisible)}>
                <Image
                  source={require('../../../assets/icons/icon-menu.png')}
                  style={[styles.headerIcon, { tintColor: theme.panelBackground }]}
                />
              </Pressable>
            </View>
          )}

          {isSearchVisible ? (
            <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
              <TextInput
                style={[styles.searchInput, { color: theme.text, fontFamily: fontFamilyName }]}
                placeholder="\u641c\u5c0b"
                placeholderTextColor={theme.text + '80'}
                autoFocus
              />
            </View>
          ) : (
            <View style={[styles.selectorContainer, { zIndex: 1100 }]}>
              <Pressable
                style={[styles.monthSelector, { backgroundColor: theme.panelBackground, zIndex: 1200 }]}
                onPress={() => setIsDropdownVisible(!isDropdownVisible)}
              >
                <Text style={[styles.monthText, { fontFamily: fontFamilyName }]}>{currentMonth}\u6708</Text>
              </Pressable>

              {isDropdownVisible && (
                <View style={[styles.dropdownContainer, { backgroundColor: theme.panelBackground, zIndex: 1100 }]}>
                  <ScrollView
                    style={styles.dropdownScroll}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    {generateMonths().map((item, index) => (
                      <Pressable
                        key={index}
                        style={[
                          styles.dropdownItem,
                          item.date.getMonth() === selectedDate.getMonth() && styles.activeItem,
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
          )}

          <Pressable onPress={() => setIsSearchVisible(!isSearchVisible)} style={{ zIndex: 1300 }}>
            <Image
              source={require('../../../assets/icons/icon-search.png')}
              style={[styles.headerIcon, { tintColor: theme.panelBackground }]}
            />
          </Pressable>
        </View>

        {/* Pet dropdown */}
        {isPetDropdownVisible && (
          <View style={[styles.petDropdownModal, { left: 16, top: 80, zIndex: 2000 }]}>
            <ScrollView style={styles.petDropdownScroll} showsVerticalScrollIndicator={false} bounces={false}>
              {availablePets.map((pet, idx) => (
                <Pressable
                  key={pet}
                  style={[styles.petDropdownItem, idx === availablePets.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => setIsPetDropdownVisible(false)}
                >
                  <Text style={[styles.petDropdownItemText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                    {pet}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Empty state */}
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colorOrange + '60', fontFamily: fontFamilyName }]}>
            {currentMonth}\u6708\u5c1a\u7121\u65e5\u8a18
          </Text>
          <Text style={[styles.emptyHint, { color: colorOrange + '40', fontFamily: fontFamilyName }]}>
            \u9ede\u64ca\u53f3\u4e0b\u89d2\u6309\u9215\u958b\u59cb\u65b0\u589e
          </Text>
        </View>
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
  monthSelector: {
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
    height: 200,
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
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  activeItem: {
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  petDropdownModal: {
    position: 'absolute',
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  petDropdownScroll: {
    maxHeight: 280,
  },
  petDropdownItem: {
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    marginHorizontal: 16,
  },
  petDropdownItemText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: getFontSize(20, 'medium'),
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: getFontSize(14, 'small'),
  },
});
