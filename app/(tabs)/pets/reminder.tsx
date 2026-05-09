import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
// @ts-ignore
import LizardIllustration from '../../../assets/illustrations/lizard-6.svg';

export default function ReminderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);

  // 模擬提醒資料
  const [reminders, setReminders] = useState([
    { id: '1', type: '餵食', freq: '每天', time: '12:00', pets: ['DELETE', 'CTRL'], note: '食物添加維生素', isOn: true, tagColor: '#FFD239' },
    { id: '2', type: '換水', freq: '每3天', time: '08:30', pets: ['DELETE'], note: '', isOn: true, tagColor: '#5CD85A' },
    { id: '3', type: '驅蟲', freq: '每週(六)', time: '20:00', pets: ['ENTER'], note: '注意劑量', isOn: false, tagColor: '#FF6B6B' },
  ]);

  const toggleReminder = (id: string) => {
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, isOn: !r.isOn } : r)
    );
  };

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => router.back() },
            { id: 'add', onPress: () => {
              router.push({ pathname: '/(tabs)/pets/add-reminder', params: { id } });
            }},
          ]}
        />
      }
    >
      {/* 內容區 */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {reminders.length === 0 ? (
          /* 空狀態 */
          <View style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
              尚無提醒設定
            </Text>

            {/* 蜥蜴插圖 */}
            <View style={styles.illustrationWrapper}>
              <LizardIllustration width={220} height={220} />
            </View>
          </View>
        ) : (
          /* 有資料時的列表 */
          <View style={styles.listContainer}>
            {reminders.map(reminder => (
              <View key={reminder.id} style={[styles.reminderCard, !reminder.isOn && styles.reminderCardOff]}>
                {/* 左側動態顏色裝飾條 */}
                <View style={[styles.cardSideBar, { backgroundColor: reminder.isOn ? reminder.tagColor : '#CCCCCC' }]} />

                <View style={styles.cardContent}>
                  {/* 標題與開關 */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
                      {reminder.type}
                    </Text>
                    <Switch
                      value={reminder.isOn}
                      onValueChange={() => toggleReminder(reminder.id)}
                      trackColor={{ false: '#d9d9d9', true: theme.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  {/* 時間與頻率 */}
                  <View style={styles.cardInfoRow}>
                    <Text style={[styles.cardTime, { color: paletteColors.XUAN_RI, fontFamily: fontFamilyName }]}>
                      {reminder.time}
                    </Text>
                    <Text style={[styles.cardFreq, { color: theme.primary, fontFamily: fontFamilyName }]}>
                      {reminder.freq}
                    </Text>
                  </View>

                  {/* 寵物與備註 */}
                  <View style={styles.cardDetailRow}>
                    <View style={styles.cardDetailLeft}>
                      <Text style={[styles.cardPets, { color: paletteColors.XUAN_RI, fontFamily: fontFamilyName }]} numberOfLines={1}>
                        對象：{reminder.pets.join(', ')}
                      </Text>
                      {!!reminder.note && (
                        <Text style={[styles.cardNote, { color: paletteColors.XUAN_RI + '80', fontFamily: fontFamilyName }]} numberOfLines={1}>
                          {reminder.note}
                        </Text>
                      )}
                    </View>
                    
                    {/* 操作按鈕 */}
                    <View style={styles.cardActions}>
                      <Pressable style={[styles.actionButton, !reminder.isOn && styles.actionButtonOff]} onPress={() => {}}>
                        <Image source={require('../../../assets/icons/icon-edit.png')} style={[styles.actionIcon, { tintColor: theme.primary }]} />
                      </Pressable>
                      <Pressable style={[styles.actionButton, !reminder.isOn && styles.actionButtonOff]} onPress={() => {}}>
                        <Image source={require('../../../assets/icons/icon-delete.png')} style={[styles.actionIcon, { tintColor: '#FF6B6B' }]} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 120,
  },

  // 空狀態卡片
  emptyCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: getFontSize(20, 'medium'),
    fontWeight: '600',
    letterSpacing: 2,
    opacity: 0.6,
  },

  // 列表區塊
  listContainer: {
    width: '96%',
    alignSelf: 'center',
    gap: 16,
  },
  reminderCard: {
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    paddingRight: 16,
    paddingVertical: 16,
  },
  reminderCardOff: {
    opacity: 0.6,
  },
  cardSideBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 16,
  },
  cardContent: {
    flex: 1,
    paddingLeft: 32, // 避開左側邊條
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: getFontSize(20, 'large'),
    fontWeight: '600',
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 8,
  },
  cardTime: {
    fontSize: getFontSize(28, 'large'),
    fontWeight: '300',
  },
  cardFreq: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
  },
  cardDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  cardDetailLeft: {
    flex: 1,
    gap: 4,
  },
  cardPets: {
    fontSize: getFontSize(14, 'medium'),
  },
  cardNote: {
    fontSize: getFontSize(13, 'small'),
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonOff: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
});
