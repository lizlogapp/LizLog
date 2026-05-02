import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import { getThemeTokens } from '../../src/theme/themeSettings';
import { paletteColors } from '../../src/theme/themeColorSettings';
import { getFontSize } from '../../src/theme/typographySettings';
import { BaseScreen } from '../../src/components/common/BaseScreen';

// 引入從 temp 新增進來的 SVG 圖示
// 引入從 temp 新增進來並翻成英文避免組件撞名的 SVG 圖示
// @ts-ignore
import IconTemp from '../../assets/icons/icon-temp.svg';
// @ts-ignore
import IconHumid from '../../assets/icons/icon-humid.svg';
// @ts-ignore
import IconBask from '../../assets/icons/icon-bask.svg';
// @ts-ignore
import IconWeight from '../../assets/icons/icon-weight.svg';
// @ts-ignore
import IconLength from '../../assets/icons/icon-length.svg';
// @ts-ignore
import IconPoop from '../../assets/icons/icon-poop.svg';
// @ts-ignore
import IconMolt from '../../assets/icons/icon-molt.svg';
// @ts-ignore
import IconBath from '../../assets/icons/icon-bath.svg';
// @ts-ignore
import IconFeed from '../../assets/icons/icon-feed.svg';

export default function AnalyticsScreen() {
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);

  // 延用與首頁相同的寵物切換狀態
  const [availablePets, setAvailablePets] = useState<string[]>(['DELETE', 'CTRL', 'ENTER', 'ALT']);
  const [currentPetName, setCurrentPetName] = useState<string>('DELETE');
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
  const [isRecordsExpanded, setIsRecordsExpanded] = useState<boolean>(false);

  const chartButtons = [
    { text: '溫度變化圖', Icon: IconTemp },
    { text: '濕度變化圖', Icon: IconHumid },
    { text: '日照變化圖', Icon: IconBask },
    { text: '體重變化圖', Icon: IconWeight },
    { text: '身長變化圖', Icon: IconLength },
    { text: '排便頻率變化圖', Icon: IconPoop },
    { text: '蛻皮頻率變化圖', Icon: IconMolt },
  ];

  return (
    <View style={styles.container}>
      {/* 開啟 scrollable，因為按鈕數量已經超過畫面高度 */}
      <BaseScreen scrollable={true} floatingAction={null} contentStyle={{ overflow: 'visible' }}
      >
        
        {/* 第一個卡片容器：當前顯示 (包含寵物選單) */}
        <View style={[styles.cardHeader, isDropdownVisible ? { zIndex: 100, elevation: 10 } : { zIndex: 1 }]}>
          <Text style={[styles.headerLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>當前顯示</Text>
          <Pressable onPress={() => setIsDropdownVisible(!isDropdownVisible)}>
            <Text style={[styles.headerValue, { color: theme.text, fontFamily: fontFamilyName }]}>
              {currentPetName || '未設定'}
            </Text>
          </Pressable>

          {/* 懸浮下拉選單 */}
          {isDropdownVisible && availablePets.length > 0 && (
            <View style={styles.dropdownModal}>
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
                    <Text style={[styles.dropdownItemText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                      {pet}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 第二個卡片：最新狀態紀錄 (點擊可展開詳細卡片，常保外陰影) */}
        <Pressable 
          style={styles.actionButton}
          onPress={() => setIsRecordsExpanded(!isRecordsExpanded)}
        >
          <Text style={[styles.headerLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>最新狀態紀錄</Text>
        </Pressable>

        {/* 展開的子卡片區塊 */}
        {isRecordsExpanded && (
          <View style={styles.recordsContainer}>
            {/* 溫度卡片 */}
            <View style={styles.recordCard}>
              <View style={styles.recordTitleRow}>
                <IconTemp width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>溫度</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>現在温度 31℃</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>平均温度 31℃</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>今日最高温度 33℃</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>今日最低温度 30℃</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  2025/07/30</Text>
            </View>

            {/* 濕度卡片 */}
            <View style={styles.recordCard}>
              <View style={styles.recordTitleRow}>
                <IconHumid width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>濕度</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>現在濕度 30%</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>平均濕度 30%</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>今日最高濕度 31%</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>今日最低濕度 30℃</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  2025/07/30</Text>
            </View>

            {/* 日照卡片 */}
            <View style={styles.recordCard}>
              <View style={styles.recordTitleRow}>
                <IconBask width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>日照</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>描述</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>30分鐘</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  2025/07/17</Text>
            </View>

            {/* 飲食卡片 */}
            <View style={styles.recordCard}>
              <View style={styles.recordTitleRow}>
                <IconFeed width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>飲食</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>描述</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>蟋蟀10隻+高麗菜0.5片</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  2025/07/17</Text>
            </View>

            {/* 泡澡卡片 */}
            <View style={styles.recordCard}>
              <View style={styles.recordTitleRow}>
                <IconBath width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>泡澡</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>描述</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>温水泡澡15分鐘</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  2025/07/17</Text>
            </View>

            {/* 排便卡片 */}
            <View style={styles.recordCard}>
              <View style={styles.recordTitleRow}>
                <IconPoop width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>排便</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>描述</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>正常排便</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  2025/07/13</Text>
            </View>

            {/* 體重卡片 */}
            <View style={styles.recordCard}>
              <View style={styles.recordTitleRow}>
                <IconWeight width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>體重</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>描述</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>415公克</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  2025/07/05</Text>
            </View>

            {/* 身長卡片 */}
            <View style={styles.recordCard}>
              <View style={styles.recordTitleRow}>
                <IconLength width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>身長</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>描述</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>44公分</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  2025/07/01</Text>
            </View>
          </View>
        )}

        {/* 新增的 7 個按鈕，使用新的帶外陰影卡片設計 */}
        {chartButtons.map((btn, index) => {
          const IconComponent = btn.Icon;
          return (
            <Pressable 
              key={index}
              style={styles.actionButton}
              onPress={() => { /* TODO: 導航或動作实作 */ }}
            >
              <View style={styles.buttonContent}>
                <IconComponent width={24} height={24} color={theme.primary} />
                <Text style={[styles.headerLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  {btn.text}
                </Text>
              </View>
            </Pressable>
          );
        })}

      </BaseScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cardHeader: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    height: 55,
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.15)',
    borderLeftColor: 'rgba(0,0,0,0.15)',
    borderBottomColor: 'rgba(255,255,255,0.5)',
    borderRightColor: 'rgba(255,255,255,0.5)',
  },
  actionButton: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    height: 55,
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  headerLabel: {
    fontSize: getFontSize(18, 'medium'),
  },
  headerValue: {
    fontSize: getFontSize(18, 'medium'),
  },
  dropdownModal: {
    position: 'absolute',
    top: 65,
    right: 20,
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownScroll: {
    maxHeight: 280,
  },
  dropdownItem: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 237, 204, 0.6)',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 8,
  },
  dropdownItemText: {
    fontSize: getFontSize(18, 'medium'),
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordsContainer: {
    width: '100%',
    paddingBottom: 8,
  },
  recordCard: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  recordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordIcon: {
    marginRight: 8,
  },
  recordTitle: {
    fontSize: getFontSize(18, 'medium'),
  },
  recordContent: {
    paddingLeft: 32,
    marginBottom: 16,
    gap: 6,
  },
  recordText: {
    fontSize: getFontSize(16, 'medium'),
  },
  recordFooter: {
    paddingLeft: 32,
    fontSize: getFontSize(16, 'medium'),
  },
});

