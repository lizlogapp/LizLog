import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
// @ts-ignore
import LizardIllustration from '../../../assets/illustrations/lizard-6.svg';
import { useAuth } from '../../../src/contexts/AuthContext';
import { reminderService } from '../../../src/services/firestoreService';

export default function ReminderScreen() {
  const router = useRouter();
  const { id, ownerId, canEdit: canEditStr } = useLocalSearchParams<{ id: string, ownerId?: string, canEdit?: string }>();
  const canEdit = canEditStr !== 'false';
  const { themeId, fontFamilyName, isDemoMode } = useTheme();
  const theme = getThemeTokens(themeId);
  const { user } = useAuth();

  // 提醒資料（從共用資料中心讀取）
  const [reminders, setReminders] = useState<any[]>([]);

  React.useEffect(() => {
    if (!user || !id) return;
    const resolvedOwnerId = ownerId || user.uid;
    const unsubscribe = reminderService.onRemindersChanged([resolvedOwnerId], (firestoreReminders) => {
      // 過濾出屬於目前這隻寵物的提醒
      const petReminders = firestoreReminders.filter(r => r.petId === id || (r.pets && r.pets.includes(id)));
      setReminders(petReminders.map(r => ({
        ...r,
        petsListDisplay: r.pets || [],
      })));
    });
    return () => unsubscribe();
  }, [user, id, ownerId]);

  const toggleReminder = (rId: string) => {
    if (user) {
      const reminder = reminders.find(r => r.id === rId);
      if (reminder) {
        const newIsOn = !reminder.isOn;
        const resolvedOwnerId = ownerId || user.uid;
        reminderService.update(resolvedOwnerId, rId, { isOn: newIsOn });
        setReminders(prev => prev.map(r => r.id === rId ? { ...r, isOn: newIsOn } : r));
      }
    }
  };

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => {
              // 返回層級：寵物提醒 -> 寵物詳情
              router.navigate({ pathname: '/(tabs)/pets/view', params: { id } });
            }},
            { id: 'add', onPress: () => {
              if (canEdit) router.push({ pathname: '/(tabs)/pets/add-reminder', params: { id } });
            }},
          ].filter(action => action.id !== 'add' || canEdit)}
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
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: theme.primary + '60', fontFamily: fontFamilyName, fontSize: getFontSize(20, 'medium'), marginBottom: 8 }}>
              尚無提醒設定
            </Text>
            <Text style={{ color: theme.primary + '40', fontFamily: fontFamilyName, fontSize: getFontSize(14, 'medium'), marginBottom: 40 }}>
              點擊右下角按鈕開始新增
            </Text>
            <Image 
              source={require('../../../assets/illustrations/illustration-lizard-03.png')} 
              style={{ width: 120, height: 120, resizeMode: 'contain', opacity: 0.6, marginTop: 20 }} 
              fadeDuration={0}
            />
          </View>
        ) : (
          /* 有資料時的列表 */
          <View style={styles.listContainer}>
            {reminders.map(reminder => (
              <View key={reminder.id} style={[styles.reminderCard, !reminder.isOn && styles.reminderCardOff, { backgroundColor: theme.background }]}>
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
                      disabled={!canEdit}
                    />
                  </View>

                  {/* 時間與頻率 */}
                  <View style={styles.cardInfoRow}>
                    <Text style={[styles.cardTime, { color: theme.text, fontFamily: fontFamilyName }]}>
                      {reminder.time}
                    </Text>
                    <Text style={[styles.cardFreq, { color: theme.primary, fontFamily: fontFamilyName }]}>
                      {reminder.freq}
                    </Text>
                  </View>

                  {/* 寵物與備註 */}
                  <View style={styles.cardDetailRow}>
                    <View style={styles.cardDetailLeft}>
                      <Text style={[styles.cardPets, { color: theme.text, fontFamily: fontFamilyName }]} numberOfLines={1}>
                        對象：{reminder.petsListDisplay?.join(', ')}
                      </Text>
                      {!!reminder.note && (
                        <Text style={[styles.cardNote, { color: theme.text, fontFamily: fontFamilyName, opacity: 0.8 }]} numberOfLines={1}>
                          {reminder.note}
                        </Text>
                      )}
                    </View>
                    
                    {/* 操作按鈕 */}
                    <View style={styles.cardActions}>
                      {canEdit && (
                        <>
                          <Pressable 
                            style={[styles.actionButton, !reminder.isOn && styles.actionButtonOff, { backgroundColor: theme.background }]} 
                            onPress={() => router.push({ pathname: '/(tabs)/pets/add-reminder', params: { reminderId: reminder.id, petId: id } })}
                          >
                            <Image source={require('../../../assets/icons/icon-edit.png')} style={[styles.actionIcon, { tintColor: theme.primary }]} />
                          </Pressable>
                          <Pressable 
                            style={[styles.actionButton, !reminder.isOn && styles.actionButtonOff, { backgroundColor: theme.background }]} 
                            onPress={() => {
                              if (user) {
                                reminderService.delete(user.uid, reminder.id);
                              }
                              setReminders(prev => prev.filter(r => r.id !== reminder.id));
                            }}
                          >
                            <Image source={require('../../../assets/icons/icon-delete.png')} style={[styles.actionIcon, { tintColor: '#FF6B6B' }]} />
                          </Pressable>
                        </>
                      )}
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
    backgroundColor: '#FFFEFA',
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
    backgroundColor: '#FFFEFA',
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
    backgroundColor: '#FFFEFA',
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
