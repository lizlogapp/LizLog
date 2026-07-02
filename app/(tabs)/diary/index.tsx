import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions, ScrollView, PanResponder, TextInput } from 'react-native';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { STATUS_BAR_HEIGHT } from '../../../src/theme/layoutSettings';
import { useAuth } from '../../../src/contexts/AuthContext';
import { diaryService, petService, DiaryDoc } from '../../../src/services/firestoreService';

/**
 * 有資料時的日記首頁
 * 包含月份選擇器與動態生成的日記卡片
 */
export default function DiaryScreen() {
                        {pet}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

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
              style={[styles.monthSelector, { backgroundColor: theme.panelBackground, zIndex: 1200 }]}
              onPress={() => setIsDropdownVisible(!isDropdownVisible)}
            >
              <Text style={[styles.monthText, { color: theme.panelPatternText, fontFamily: fontFamilyName }]}>{currentMonth}月</Text>
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
                      <Text style={[styles.dropdownItemText, { color: theme.panelPatternText, fontFamily: fontFamilyName }]}>
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
          <Image source={require('../../../assets/icons/icon-search.png')} style={[styles.headerIcon, { tintColor: theme.primary }]} />
        </Pressable>
      </View>

      {/* 主要內容區塊 */}
      {isDemoMode ? (
      <ScrollView 
        contentContainerStyle={styles.centerContent}
        showsVerticalScrollIndicator={false}
      >
        {mockDiaries.map((diary) => (
          <Pressable key={diary.id} onPress={() => router.push({ pathname: '/diary/view', params: { id: diary.id } } as any)} style={[styles.diaryCard, { backgroundColor: theme.background }]}>
            
            {/* 照片區與重疊的寵物標籤 / 無照片時的頂部標籤 */}
            {diary.image ? (
              <View style={styles.diaryImageContainer}>
                <Image source={diary.image} style={styles.diaryImage} />
                <View style={styles.petTagsContainer}>
                  {diary.pets.map((pet, idx) => (
                    <View key={idx} style={[styles.petTag, { backgroundColor: theme.accentDawn }]}>
                      <Text style={[styles.petTagText, { color: theme.primary, fontFamily: fontFamilyName }]}>{pet.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={[styles.noImageTagsContainer, { backgroundColor: theme.accentDawn }]}>
                <Text style={[styles.noImageTagText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  {diary.pets.map(p => p.name).join(' ')}
                </Text>
              </View>
            )}

            {/* 資訊區塊：日期、天氣、標題 */}
            <View style={styles.diaryInfoContainer}>
              <View style={styles.diaryHeaderRow}>
                <Text style={[styles.diaryDateText, { color: theme.primary, fontFamily: fontFamilyName }]}>{diary.dateStr}</Text>
                <Image source={diary.weatherIcon} style={[styles.weatherIcon, { tintColor: theme.primary }]} />
              </View>
              {diary.title ? (
                <Text style={[styles.diaryTitleText, { color: theme.primary, fontFamily: fontFamilyName }]}>{diary.title}</Text>
              ) : null}

              {/* 寵物數據列 (依照標記數量渲染) */}
              <View style={styles.metricsWrapper}>
                {diary.pets.map((pet, idx) => (
                  <View key={idx} style={styles.metricRow}>
                    <Text style={[styles.metricText, { color: theme.primary, fontFamily: fontFamilyName }]}>{pet.temp}</Text>
                    <Text style={[styles.metricText, { color: theme.primary, fontFamily: fontFamilyName }]}>{pet.humid}</Text>
                    
                    <View style={styles.metricIconsBlock}>
                      <Image source={pet.states.bask ? require('../../../assets/icons/category-basking-active.png') : require('../../../assets/icons/category-basking-default.png')} style={[styles.stateIcon, { tintColor: theme.primary }]} />
                      <Image source={pet.states.feed ? require('../../../assets/icons/category-food-active.png') : require('../../../assets/icons/category-food-default.png')} style={[styles.stateIcon, { tintColor: theme.primary }]} />
                      <Image source={pet.states.bath ? require('../../../assets/icons/category-bath-active.png') : require('../../../assets/icons/category-bath-default.png')} style={[styles.stateIcon, { tintColor: theme.primary }]} />
                      <Image source={pet.states.poop ? require('../../../assets/icons/category-poop-active.png') : require('../../../assets/icons/category-poop-default.png')} style={[styles.stateIcon, { tintColor: theme.primary }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colorOrange + '60', fontFamily: fontFamilyName, fontSize: getFontSize(20, 'medium'), marginBottom: 8 }}>
            {currentMonth}月尚無日記
          </Text>
          <Text style={{ color: colorOrange + '40', fontFamily: fontFamilyName, fontSize: getFontSize(14, 'medium'), marginBottom: 40 }}>
            點擊右下角按鈕開始新增
          </Text>
          <Image 
            source={require('../../../assets/illustrations/illustration-lizard-02.png')} 
            style={{ width: 120, height: 120, resizeMode: 'contain', opacity: 0.6, marginTop: 20 }} 
          />
        </View>
      )}
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
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '500',
  },
  centerContent: {
    paddingTop: 16,
    paddingBottom: 120, // 避開底部按鈕
    gap: 20, // 卡片之間的距離
  },
  diaryCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  diaryImageContainer: {
    width: '100%',
    height: 180, // 照片微調小一點
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  diaryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  petTagsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    gap: 8, // 標籤之間距離微調
  },
  petTag: {
    backgroundColor: '#FFF1D0',
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-start', // 確保不強制拉伸
  },
  petTagText: {
    fontSize: getFontSize(16, 'medium'), // 再小一號
  },
  noImageTagsContainer: {
    width: '100%',
    backgroundColor: '#FFF1D0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageTagText: {
    fontSize: getFontSize(16, 'medium'), // 再小一號
  },
  diaryInfoContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  diaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  diaryDateText: {
    fontSize: getFontSize(18, 'medium'), // 再小一號
  },
  weatherIcon: {
    width: 18, // 再小一號
    height: 18,
    resizeMode: 'contain',
  },
  diaryTitleText: {
    fontSize: getFontSize(16, 'medium'), // 再小一號
    marginBottom: 16,
  },
  metricsWrapper: {
    width: '100%',
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6, // 溫度與濕度之間的基礎間距
  },
  metricText: {
    fontSize: getFontSize(14, 'medium'),
    minWidth: 42,
    textAlign: 'left',
  },
  metricIconsBlock: {
    flexDirection: 'row',
    gap: 12, // ICON 之間稍微收緊以避免太散
    marginLeft: 'auto', // 推到右側，形成左文字右圖標的平衡佈局
  },
  stateIcon: {
    width: 18, // 再小一號
    height: 18,
    resizeMode: 'contain',
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
    top: 36,
    left: -8, // 稍微左移以視覺平衡
    width: 150,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  petDropdownScroll: {
    maxHeight: 280,
  },
  petDropdownItem: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 237, 204, 0.6)', // 淡黃色背景，與首頁一致
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 8,
  },
  petDropdownItemText: {
    fontSize: getFontSize(18, 'medium'),
  }
});



