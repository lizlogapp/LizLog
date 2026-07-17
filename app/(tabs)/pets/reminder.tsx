import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Image,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { useAuth } from '../../../src/contexts/AuthContext';
import { petService, PetDoc, reminderService } from '../../../src/services/firestoreService';
import {
  getNotificationPermissionState,
  getNotificationPreferences,
  getReminderTypes,
  ReminderNotificationInput,
  requestNotificationPermission,
  saveNotificationPreferences,
  synchronizeEligibleReminderNotifications,
} from '../../../src/services/notificationService';

export default function ReminderScreen() {
  const router = useRouter();
  const { id, ownerId, canEdit: canEditStr, from, reminderId } = useLocalSearchParams<{
    id?: string;
    ownerId?: string;
    canEdit?: string;
    from?: string;
    reminderId?: string;
  }>();
  const canEdit = canEditStr !== 'false';
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);
  const { user } = useAuth();
  const [reminders, setReminders] = useState<ReminderNotificationInput[]>([]);
  const [petsById, setPetsById] = useState<Record<string, PetDoc & { id: string }>>({});
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const permissionPromptedRef = useRef(false);
  const awaitingSettingsRef = useRef(false);

  React.useEffect(() => {
    if (!user) {
      setReminders([]);
      setPetsById({});
      return;
    }

    const unsubscribePets = petService.onPetsChanged(user.uid, pets => {
      setPetsById(Object.fromEntries(pets.map(pet => [pet.id, pet])));
    });
    const unsubscribeReminders = reminderService.onRemindersChanged(user.uid, firestoreReminders => {
      const allReminders = firestoreReminders as ReminderNotificationInput[];
      const isNotificationTarget = (reminder: ReminderNotificationInput) => (
        reminder.id === reminderId
        && (!ownerId || (reminder.ownerId || user.uid) === ownerId)
      );
      const visibleReminders = id
        ? allReminders.filter(reminder =>
            isNotificationTarget(reminder)
            || reminder.petId === id
            || reminder.pets?.includes(id),
          )
        : allReminders;
      setReminders(
        reminderId
          ? [...visibleReminders].sort((left, right) => (
              Number(isNotificationTarget(right)) - Number(isNotificationTarget(left))
            ))
          : visibleReminders,
      );

    });

    return () => {
      unsubscribePets();
      unsubscribeReminders();
    };
  }, [user, id, ownerId, reminderId]);

  const resolveOwnerId = useCallback((reminder: ReminderNotificationInput) => {
    return reminder.ownerId || petsById[reminder.petId]?.ownerId || ownerId || user?.uid || '';
  }, [ownerId, petsById, user?.uid]);

  const reminderKey = useCallback((reminder: ReminderNotificationInput) => {
    return `${resolveOwnerId(reminder)}:${reminder.id}`;
  }, [resolveOwnerId]);

  const isReminderEditable = useCallback((reminder: ReminderNotificationInput) => {
    if (!canEdit || !user) return false;
    const pet = petsById[reminder.petId];
    const resolvedOwnerId = resolveOwnerId(reminder);
    if (resolvedOwnerId === user.uid) return true;
    const role = pet?.coParents?.find(member => member.uid === user.uid);
    return !!role && (role.isMainOwner || role.permission !== 'view');
  }, [canEdit, petsById, resolveOwnerId, user]);

  const getPetNames = useCallback((reminder: ReminderNotificationInput) => {
    const petIds = reminder.pets?.length ? reminder.pets : [reminder.petId];
    return petIds.map(petId => petsById[petId]?.name || '已刪除的寵物');
  }, [petsById]);

  const setPending = useCallback((key: string, pending: boolean) => {
    setPendingIds(previous => {
      const next = new Set(previous);
      if (pending) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const openNotificationSettings = useCallback(() => {
    awaitingSettingsRef.current = true;
    Linking.openSettings().catch(() => {
      awaitingSettingsRef.current = false;
      Alert.alert('無法開啟設定', '請手動前往手機設定，開啟蜥日日記的通知權限。');
    });
  }, []);

  const showNotificationSettingsGuide = useCallback(() => {
    Alert.alert(
      '尚未開啟通知',
      '請到手機設定開啟蜥日日記的通知權限，提醒才能在 App 關閉時顯示。',
      [
        { text: '稍後', style: 'cancel' },
        { text: '前往設定', onPress: openNotificationSettings },
      ],
    );
  }, [openNotificationSettings]);

  const enableNotificationsAndSynchronize = useCallback(async () => {
    if (!user) return;
    const granted = await requestNotificationPermission();
    if (!granted) {
      showNotificationSettingsGuide();
      return;
    }

    const preferences = await getNotificationPreferences();
    const nextPreferences = {
      ...preferences,
      systemEnabled: true,
      systemConfigured: true,
    };
    await saveNotificationPreferences(nextPreferences);
    if (!nextPreferences.reminderEnabled) return;

    const [allReminders, allPets] = await Promise.all([
      reminderService.getAll(user.uid),
      petService.getAll(user.uid),
    ]);
    const result = await synchronizeEligibleReminderNotifications(
      user.uid,
      allReminders as ReminderNotificationInput[],
      allPets,
    );
    if (result.failedReminderIds.length > 0) {
      Alert.alert('部分提醒未排程', '部分提醒的時間或頻率設定不完整，請逐筆檢查。');
    }
  }, [showNotificationSettingsGuide, user]);

  const synchronizeFreshNotifications = useCallback(async () => {
    if (!user) return null;
    const [allReminders, allPets] = await Promise.all([
      reminderService.getAll(user.uid),
      petService.getAll(user.uid),
    ]);
    return synchronizeEligibleReminderNotifications(
      user.uid,
      allReminders as ReminderNotificationInput[],
      allPets,
    );
  }, [user]);

  const promptForNotificationAccess = useCallback(async () => {
    if (!user || permissionPromptedRef.current) return;
    const [preferences, permission] = await Promise.all([
      getNotificationPreferences(),
      getNotificationPermissionState(),
    ]);
    const userTurnedNotificationsOff = preferences.systemConfigured && !preferences.systemEnabled;
    if (!preferences.reminderEnabled || userTurnedNotificationsOff) return;
    if (preferences.systemEnabled && permission.granted) return;

    permissionPromptedRef.current = true;
    Alert.alert(
      '開啟提醒通知',
      '開啟通知後，即使沒有開啟 App，也能在設定時間收到照護提醒。',
      [
        { text: '稍後', style: 'cancel' },
        { text: '開啟通知', onPress: () => void enableNotificationsAndSynchronize() },
      ],
    );
  }, [enableNotificationsAndSynchronize, user]);

  useFocusEffect(useCallback(() => {
    void promptForNotificationAccess();
  }, [promptForNotificationAccess]));

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active' && awaitingSettingsRef.current) {
        awaitingSettingsRef.current = false;
        void enableNotificationsAndSynchronize();
      }
    });
    return () => subscription.remove();
  }, [enableNotificationsAndSynchronize]);

  const toggleReminder = async (reminder: ReminderNotificationInput) => {
    if (!user) return;
    const key = reminderKey(reminder);
    if (pendingIds.has(key)) return;

    const previousIsOn = !!reminder.isOn;
    const nextIsOn = !previousIsOn;
    const resolvedOwnerId = resolveOwnerId(reminder);
    setPending(key, true);
    setReminders(previous =>
      previous.map(item => reminderKey(item) === key ? { ...item, isOn: nextIsOn } : item),
    );

    let persisted = false;
    try {
      await reminderService.update(resolvedOwnerId, reminder.id, { isOn: nextIsOn });
      persisted = true;
      const result = await synchronizeFreshNotifications();
      if (nextIsOn) {
        const scheduled = Boolean(result
          && !result.failedReminderIds.includes(reminder.id)
          && result.permissionGranted
          && result.preferencesEnabled);
        if (!scheduled) {
          Alert.alert(
            '提醒已開啟，但通知尚未排程',
            '請確認提醒時間尚未過期，並開啟 App 與手機的通知設定。',
            [
              { text: '稍後', style: 'cancel' },
              { text: '前往設定', onPress: openNotificationSettings },
            ],
          );
        }
      }
    } catch (error) {
      if (!persisted) {
        setReminders(previous =>
          previous.map(item => reminderKey(item) === key ? { ...item, isOn: previousIsOn } : item),
        );
      }
      Alert.alert(
        persisted ? '提醒已更新，但通知未同步' : '無法切換提醒',
        persisted
          ? '請確認通知權限後再試；下次同步會重新排程。'
          : (error instanceof Error ? error.message : '請確認網路連線後再試。'),
      );
    } finally {
      setPending(key, false);
    }
  };

  const deleteReminder = (reminder: ReminderNotificationInput) => {
    if (!user) return;
    const key = reminderKey(reminder);
    const resolvedOwnerId = resolveOwnerId(reminder);
    Alert.alert('刪除提醒', '確定要刪除這筆提醒嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setPending(key, true);
            try {
              await reminderService.delete(resolvedOwnerId, reminder.id);
              await synchronizeFreshNotifications();
              setReminders(previous => previous.filter(item => reminderKey(item) !== key));
            } catch {
              await synchronizeFreshNotifications().catch(() => undefined);
              Alert.alert('無法刪除提醒', '請確認網路連線後再試。');
            } finally {
              setPending(key, false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back' as const, onPress: () => {
              if (!id || from === 'home') {
                router.navigate('/(tabs)');
              } else {
                router.navigate({ pathname: '/(tabs)/pets/view', params: { id, ownerId } });
              }
            }},
            { id: 'add' as const, onPress: () => {
              if (!canEdit) return;
              router.push({
                pathname: '/(tabs)/pets/add-reminder',
                params: id ? { id, ownerId } : {},
              });
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
            {reminders.map(reminder => {
              const key = reminderKey(reminder);
              const editable = isReminderEditable(reminder);
              const pending = pendingIds.has(key);
              const resolvedOwnerId = resolveOwnerId(reminder);
              const isNotificationTarget = reminder.id === reminderId
                && (!ownerId || resolvedOwnerId === ownerId);
              return (
              <View
                key={key}
                style={[
                  styles.reminderCard,
                  !reminder.isOn && styles.reminderCardOff,
                  {
                    backgroundColor: theme.background,
                    borderColor: isNotificationTarget ? theme.primary : 'transparent',
                    borderWidth: isNotificationTarget ? 3 : 0,
                  },
                ]}
              >
                {/* 左側動態顏色裝飾條 */}
                <View style={[styles.cardSideBar, { backgroundColor: reminder.isOn ? reminder.tagColor : '#CCCCCC' }]} />

                <View style={styles.cardContent}>
                  {isNotificationTarget && (
                    <Text style={[styles.notificationTargetLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
                      通知提醒
                    </Text>
                  )}
                  {/* 標題與開關 */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
                      {getReminderTypes(reminder).join('、') || reminder.type}
                    </Text>
                    <Switch
                      value={!!reminder.isOn}
                      onValueChange={() => void toggleReminder(reminder)}
                      trackColor={{ false: '#d9d9d9', true: theme.primary }}
                      thumbColor="#FFFFFF"
                      disabled={!editable || pending}
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
                        對象：{getPetNames(reminder).join('、')}
                      </Text>
                      {!!reminder.note && (
                        <Text style={[styles.cardNote, { color: theme.text, fontFamily: fontFamilyName, opacity: 0.8 }]} numberOfLines={1}>
                          {reminder.note}
                        </Text>
                      )}
                    </View>
                    
                    {/* 操作按鈕 */}
                    <View style={styles.cardActions}>
                      {editable && (
                        <>
                          <Pressable 
                            style={[styles.actionButton, !reminder.isOn && styles.actionButtonOff, { backgroundColor: theme.background }]} 
                            onPress={() => router.push({
                              pathname: '/(tabs)/pets/add-reminder',
                              params: {
                                reminderId: reminder.id,
                                petId: reminder.petId,
                                ownerId: resolvedOwnerId,
                              },
                            })}
                            disabled={pending}
                          >
                            <Image source={require('../../../assets/icons/icon-edit.png')} style={[styles.actionIcon, { tintColor: theme.primary }]} />
                          </Pressable>
                          <Pressable 
                            style={[styles.actionButton, !reminder.isOn && styles.actionButtonOff, { backgroundColor: theme.background }]} 
                            onPress={() => deleteReminder(reminder)}
                            disabled={pending}
                          >
                            <Image source={require('../../../assets/icons/icon-delete.png')} style={[styles.actionIcon, { tintColor: '#FF6B6B' }]} />
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>
              );
            })}
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
  notificationTargetLabel: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    fontSize: getFontSize(12, 'small'),
    fontWeight: '700',
    letterSpacing: 1,
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
