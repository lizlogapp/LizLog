import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import LogoIcon from '../../assets/branding/logos/logo-image.svg';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { auth } from '../../src/config/firebase';
import { GOOGLE_WEB_CLIENT_ID } from '../../src/config/googleAuth';
import { useTheme } from '../../src/theme/ThemeContext';
import { getThemeTokens, ThemeId } from '../../src/theme/themeSettings';
import { paletteColors } from '../../src/theme/themeColorSettings';
import { getFontSize } from '../../src/theme/typographySettings';
import { BaseScreen } from '../../src/components/common/BaseScreen';
import {
  cancelAllLizLogNotifications,
  getNotificationPermissionState,
  getNotificationPreferences,
  ReminderNotificationInput,
  requestNotificationPermissionState,
  saveNotificationPreferences,
  synchronizeEligibleReminderNotifications,
} from '../../src/services/notificationService';
import { petService, reminderService } from '../../src/services/firestoreService';

WebBrowser.maybeCompleteAuthSession();

export default function SettingsScreen() {
  const { themeId, setThemeId, fontFamilyName, fontFamilyId, setFontFamilyId, isDemoMode, setIsDemoMode } = useTheme();
  const theme = getThemeTokens(themeId);
  const router = useRouter();

  const [sysNotifyEnabled, setSysNotifyEnabled] = useState(false);
  const [notificationSettingsBusy, setNotificationSettingsBusy] = useState(false);
  const awaitingNotificationSettingsRef = useRef(false);
  const completedNotificationSettingsRoundTripRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  
  const [nickname, setNickname] = useState(isDemoMode ? '鴉小姐' : (auth.currentUser?.displayName || '未設定'));
  const [tempNickname, setTempNickname] = useState('');
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isGoogleLinked, setIsGoogleLinked] = useState(
    () => auth.currentUser?.providerData.some(provider => provider.providerId === 'google.com') ?? false,
  );
  const [googleRequest, googleResponse, promptGoogleLink] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
  });
  const appVersion = Constants.expoConfig?.version ?? '0.1.0';
  const demoModeEnabled = Constants.expoConfig?.extra?.enableDemoMode === true;

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.params.id_token;
      const currentUser = auth.currentUser;
      if (!currentUser || !idToken) {
        setIsLinkingGoogle(false);
        Alert.alert('無法綁定', '登入狀態已變更，請重新登入後再試。');
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      void linkWithCredential(currentUser, credential).then(() => {
        setIsGoogleLinked(true);
        Alert.alert('綁定完成', '原帳號已可使用 Google 登入，既有寵物、提醒與日記仍保留在同一帳號。');
      }).catch((error: { code?: string }) => {
        if (error.code === 'auth/provider-already-linked') {
          setIsGoogleLinked(true);
          Alert.alert('已完成', '這個帳號已綁定 Google。');
        } else if (error.code === 'auth/credential-already-in-use') {
          Alert.alert('無法自動合併', '這個 Google 帳號已綁定另一個蜥日日記帳號。為避免資料錯置，請先聯絡支援人員處理。');
        } else {
          Alert.alert('綁定失敗', '請確認 Google 帳號與目前登入信箱一致後再試。');
        }
      }).finally(() => setIsLinkingGoogle(false));
    } else if (googleResponse?.type === 'error' || googleResponse?.type === 'dismiss') {
      setIsLinkingGoogle(false);
      if (googleResponse.type === 'error') Alert.alert('綁定失敗', 'Google 驗證未完成，請稍後再試。');
    }
  }, [googleResponse]);

  async function synchronizeAllEnabledReminders() {
    if (!auth.currentUser) return;
    const [reminders, pets] = await Promise.all([
      reminderService.getAll(auth.currentUser.uid),
      petService.getAll(auth.currentUser.uid),
    ]);
    const result = await synchronizeEligibleReminderNotifications(
      auth.currentUser.uid,
      reminders as ReminderNotificationInput[],
      pets,
    );
    if (result.failedReminderIds.length > 0) {
      const hasLocalScheduleFailure = Object.values(result.failureReasons).some(
        reason => reason === 'schedule-failed' || reason === 'verification-failed',
      );
      Alert.alert(
        '部分提醒未排程',
        hasLocalScheduleFailure
          ? '手機通知權限已開啟，但部分本機排程未完成。請稍後再切換提醒開關重試。'
          : '部分提醒的時間或頻率設定不完整，請逐筆檢查。',
      );
    }
  }

  function openNotificationSettings() {
    awaitingNotificationSettingsRef.current = true;
    completedNotificationSettingsRoundTripRef.current = false;
    Linking.openSettings().catch(() => {
      awaitingNotificationSettingsRef.current = false;
      Alert.alert('無法開啟設定', '請手動前往手機設定，開啟蜥日日記的通知權限。');
    });
  }

  function showNotificationSettingsGuide(channelDisabled = false) {
    Alert.alert(
      channelDisabled ? '照護提醒通知已關閉' : '未開啟通知',
      channelDisabled
        ? 'App 通知權限已開啟，但「照護提醒」通知類別仍為關閉，請到手機設定開啟該類別。'
        : '請到手機設定開啟蜥日日記的通知權限。',
      [
        { text: '稍後', style: 'cancel' },
        { text: '前往設定', onPress: openNotificationSettings },
      ],
    );
  }

  async function refreshNotificationSettings(
    synchronizeIfReady = false,
    showSettingsResult = false,
  ) {
    const [storedPreferences, permission] = await Promise.all([
      getNotificationPreferences(),
      getNotificationPermissionState(),
    ]);
    let preferences = storedPreferences;
    const shouldAdoptGrantedPermission = permission.granted
      && !storedPreferences.systemConfigured;
    if (!storedPreferences.reminderEnabled
      || (shouldAdoptGrantedPermission && !storedPreferences.systemEnabled)) {
      preferences = {
        ...storedPreferences,
        reminderEnabled: true,
        reminderConfigured: true,
        ...(shouldAdoptGrantedPermission ? {
          systemEnabled: true,
          systemConfigured: true,
        } : {}),
      };
      await saveNotificationPreferences(preferences);
    }
    setSysNotifyEnabled(preferences.systemEnabled && permission.granted);
    if (showSettingsResult && permission.appGranted && !permission.channelEnabled) {
      showNotificationSettingsGuide(true);
      return;
    }
    if (synchronizeIfReady
      && preferences.systemEnabled
      && permission.granted) {
      await synchronizeAllEnabledReminders();
    }
  }

  useEffect(() => {
    void refreshNotificationSettings();
    const subscription = AppState.addEventListener('change', nextState => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;
      if (awaitingNotificationSettingsRef.current && nextState !== 'active') {
        completedNotificationSettingsRoundTripRef.current = true;
      }
      if (nextState === 'active' && previousState !== 'active') {
        const returnedFromSettings = awaitingNotificationSettingsRef.current
          && completedNotificationSettingsRoundTripRef.current;
        if (returnedFromSettings) {
          awaitingNotificationSettingsRef.current = false;
          completedNotificationSettingsRoundTripRef.current = false;
        }
        // 任何從背景回到 App 的路徑都重新確認並補排程；只有確定是本頁
        // 開啟系統設定時，才額外顯示頻道仍關閉的引導。
        // 背景同步失敗不應在每次開啟 App 時打斷使用者；只有使用者主動切換設定時才顯示錯誤。
        void refreshNotificationSettings(true, returnedFromSettings).catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, []);

  const handleSystemNotificationToggle = async (value: boolean) => {
    if (notificationSettingsBusy) return;
    setNotificationSettingsBusy(true);
    setSysNotifyEnabled(value);
    let previous: Awaited<ReturnType<typeof getNotificationPreferences>> | null = null;
    let next: Awaited<ReturnType<typeof getNotificationPreferences>> | null = null;
    try {
      previous = await getNotificationPreferences();
      next = {
        ...previous,
        reminderEnabled: true,
        reminderConfigured: true,
        systemEnabled: value,
        systemConfigured: true,
      };
      // systemEnabled 表示使用者期望；OS 尚未授權時保留 true，返回設定後即可自動同步。
      await saveNotificationPreferences(next);
    } catch {
      if (previous) {
        await saveNotificationPreferences(previous).catch(() => undefined);
        setSysNotifyEnabled(previous.systemEnabled);
      } else {
        await refreshNotificationSettings().catch(() => undefined);
      }
      Alert.alert('無法更新通知設定', '請稍後再試。');
      setNotificationSettingsBusy(false);
      return;
    }

    try {
      if (!value) {
        await cancelAllLizLogNotifications();
        return;
      }

      const permission = await requestNotificationPermissionState();
      setSysNotifyEnabled(permission.granted);
      if (!permission.granted) {
        showNotificationSettingsGuide(permission.appGranted && !permission.channelEnabled);
        return;
      }
      await synchronizeAllEnabledReminders();
    } catch {
      await refreshNotificationSettings().catch(() => undefined);
      Alert.alert(
        '系統通知設定已儲存',
        '目前無法完成本機通知排程；已授權通知時不需要再次開啟權限，請稍後重試。',
      );
    } finally {
      setNotificationSettingsBusy(false);
    }
  };

  const handleNicknameUpdate = async () => {
    const value = tempNickname.trim();
    if (!value) {
      Alert.alert('提示', '暱稱不可為空白');
      return;
    }
    if (!auth.currentUser) {
      Alert.alert('錯誤', '目前沒有已登入帳號');
      return;
    }

    setIsSavingAccount(true);
    try {
      await updateProfile(auth.currentUser, { displayName: value });
      setNickname(value);
      setShowNicknameModal(false);
      Alert.alert('完成', '暱稱已更新');
    } catch {
      Alert.alert('錯誤', '暱稱更新失敗，請稍後再試');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handlePasswordUpdate = async () => {
    const user = auth.currentUser;
    if (!user?.email) {
      Alert.alert('提示', '此登入方式不支援在 APP 內更改密碼');
      return;
    }
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('提示', '請完整填寫密碼欄位');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('提示', '新密碼至少需要 6 個字元');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '兩次輸入的新密碼不一致');
      return;
    }

    setIsSavingAccount(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      Alert.alert('完成', '密碼已更新');
    } catch {
      Alert.alert('錯誤', '舊密碼不正確，或密碼更新失敗');
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Toggle theme (for demonstration, cycle through available themes if needed, or just toggle between RI_CHU and CHENG_RI)
  const toggleTheme = () => {
    setThemeId(themeId === ThemeId.RI_CHU_THEME ? ThemeId.CHENG_RI_THEME : ThemeId.RI_CHU_THEME);
  };

  const toggleFont = () => {
    setFontFamilyId(fontFamilyId === 'HAXI_RI' ? 'YU_BAI' : 'HAXI_RI');
  };

  return (
    <BaseScreen scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          
          {/* Section: 帳號管理 */}
          <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
            帳號管理
          </Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.primary, fontFamily: fontFamilyName }]}>使用者</Text>
            <Pressable onPress={() => { setTempNickname(nickname); setShowNicknameModal(true); }}>
              <Text style={[styles.value, { color: theme.primary, fontFamily: fontFamilyName }]}>{nickname}</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.primary, fontFamily: fontFamilyName }]}>帳號</Text>
            <Text style={[styles.value, { color: theme.primary, fontFamily: fontFamilyName }]}>{isDemoMode ? 'Nov****@gmail.com' : (auth.currentUser?.email || '未設定')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.primary, fontFamily: fontFamilyName }]}>密碼</Text>
            <Pressable onPress={() => setShowPasswordModal(true)}>
              <Text style={[styles.value, { color: theme.primary, fontFamily: fontFamilyName }]}>更改密碼</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.primary, fontFamily: fontFamilyName }]}>Google</Text>
            <Pressable
              disabled={!googleRequest || isLinkingGoogle || isGoogleLinked}
              onPress={() => {
                setIsLinkingGoogle(true);
                void promptGoogleLink();
              }}
            >
              <Text style={[styles.value, { color: theme.primary, fontFamily: fontFamilyName, opacity: isLinkingGoogle ? 0.5 : 1 }]}>
                {isGoogleLinked ? '已綁定' : isLinkingGoogle ? '綁定中…' : '綁定 Google 帳號'}
              </Text>
            </Pressable>
          </View>

          {/* Section: 個人化設定 */}
          <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: fontFamilyName, marginTop: 16 }]}>
            個人化設定
          </Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.primary, fontFamily: fontFamilyName }]}>系統通知</Text>
            <Switch
              trackColor={{ false: '#E0E0E0', true: theme.primary }}
              thumbColor={'#FFFFFF'}
              onValueChange={handleSystemNotificationToggle}
              value={sysNotifyEnabled}
              disabled={notificationSettingsBusy}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.primary, fontFamily: fontFamilyName }]}>外觀設定</Text>
            <Pressable style={styles.valueGroup} onPress={toggleTheme}>
              <Text style={[styles.value, { color: theme.primary, fontFamily: fontFamilyName }]}>
                {themeId === ThemeId.RI_CHU_THEME ? '日初' : '澄日'}
              </Text>
              <View style={[styles.colorBox, { backgroundColor: theme.primary }]} />
            </Pressable>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.primary, fontFamily: fontFamilyName }]}>文字字體</Text>
            <Pressable onPress={toggleFont}>
              <Text style={[styles.value, { color: theme.primary, fontFamily: fontFamilyName }]}>
                {fontFamilyId === 'HAXI_RI' ? '暇日' : '余白'}
              </Text>
            </Pressable>
          </View>
          {/* 只對官方帳號顯示 Demo 模式切換 */}
          {demoModeEnabled && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.primary, fontFamily: fontFamilyName }]}>演示數據模式</Text>
              <Switch
                trackColor={{ false: '#E0E0E0', true: theme.primary }}
                thumbColor={'#FFFFFF'}
                onValueChange={setIsDemoMode}
                value={isDemoMode}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable 
              style={[styles.actionButton, { backgroundColor: theme.background }]}
              onPress={() => router.push('/(tabs)/pets')}
            >
              <Text style={[styles.actionButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                寵物管理
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.actionButton, { backgroundColor: theme.background }]}
              onPress={() => router.push('/(tabs)/iot')}
            >
              <Text style={[styles.actionButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                IoT 設備管理
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.actionButton, { backgroundColor: theme.background }]}
              onPress={() => setIsAboutExpanded(!isAboutExpanded)}
            >
              <Text style={[styles.actionButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                關於蜥日日記
              </Text>
            </Pressable>
            
            {isAboutExpanded && (
              <View style={styles.aboutExpandedContainer}>
                <Pressable style={[styles.aboutLinkButton, { backgroundColor: theme.background }]} onPress={() => setShowTermsModal(true)}>
                  <Text style={[styles.aboutLinkText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                    服務條款
                  </Text>
                </Pressable>
                
                <Pressable style={[styles.aboutLinkButton, { backgroundColor: theme.background }]} onPress={() => setShowPrivacyModal(true)}>
                  <Text style={[styles.aboutLinkText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                    隱私權政策
                  </Text>
                </Pressable>
                
                <View style={styles.aboutInfoSection}>
                  <LogoIcon width={60} height={60} style={styles.aboutLogo} />
                  <Text style={[styles.aboutAppName, { color: theme.primary, fontFamily: fontFamilyName }]}>
                    蜥日日記
                  </Text>
                  <Text style={[styles.aboutAppVersion, { color: theme.primary, fontFamily: fontFamilyName }]}>
                    版本 {appVersion}
                  </Text>
                  <Text style={[styles.aboutCopyright, { color: theme.primary, fontFamily: fontFamilyName }]}>
                    © 2026 LizLog
                  </Text>
                </View>
              </View>
            )}

            <Pressable 
              style={[styles.actionButton, { backgroundColor: theme.background }]}
              onPress={() => {
                Alert.alert(
                  '申請刪除測試資料',
                  '0.1.0 封閉測試版由專案負責人手動清除登入帳號、寵物、日記、圖片與共育關聯。自助刪除會在公開測試前完成，現在不執行可能遺留資料的不完整刪除。'
                );
              }}
            >
              <Text style={[styles.actionButtonText, { color: '#FF3B30', fontFamily: fontFamilyName }]}>
                申請刪除帳號
              </Text>
            </Pressable>

            <Pressable 
              style={[styles.actionButton, { backgroundColor: theme.background }]}
              onPress={async () => {
                try {
                  await signOut(auth);
                  // 由於 _layout.tsx 有監聽 auth 狀態，自動會把我們導回 /login
                } catch (error) {
                  import('react-native').then(({ Alert }) => {
                    Alert.alert('錯誤', '登出失敗，請稍後再試');
                  });
                }
              }}
            >
              <Text style={[styles.actionButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                登出
              </Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>

      {/* 服務條款 Modal */}
      <Modal visible={showTermsModal} transparent animationType="fade" onRequestClose={() => setShowTermsModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowTermsModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
              服務條款
            </Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalText, { color: theme.text, fontFamily: fontFamilyName }]}>
                歡迎使用蜥日日記（以下簡稱「本服務」）。{'\n\n'}
                1. 服務內容{'\n'}
                本服務提供寵物健康追蹤、提醒與日記功能。使用者需確保所提供之資料真實性。{'\n\n'}
                2. 使用限制{'\n'}
                請勿利用本服務進行任何非法、侵權或破壞性之行為。我們保留終止違規帳號之權利。{'\n\n'}
                3. 免責聲明{'\n'}
                本應用程式所提供之醫護與提醒功能僅供參考，不能替代專業獸醫師之診斷與建議。若寵物有任何異常，請立即就醫。{'\n\n'}
                4. 服務變更與終止{'\n'}
                我們保留隨時修改或終止服務的權利，恕不另行通知。
              </Text>
            </ScrollView>
            <Pressable style={[styles.modalCloseButton, { backgroundColor: theme.primary }]} onPress={() => setShowTermsModal(false)}>
              <Text style={[styles.modalCloseText, { color: theme.background, fontFamily: fontFamilyName }]}>關閉</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 隱私權政策 Modal */}
      <Modal visible={showPrivacyModal} transparent animationType="fade" onRequestClose={() => setShowPrivacyModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPrivacyModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
              隱私權政策
            </Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalText, { color: theme.text, fontFamily: fontFamilyName }]}>
                蜥日日記非常重視您的隱私權。{'\n\n'}
                1. 資料蒐集{'\n'}
                我們將收集您於註冊及使用過程中主動提供的個人資料（如信箱）與寵物相關資訊。{'\n\n'}
                2. 資料使用{'\n'}
                所蒐集之資料僅用於提供及優化本服務、發送相關通知，不會未經同意分享給第三方。{'\n\n'}
                3. 資料安全{'\n'}
                我們致力於使用合理的技術與程序來保護您的資料安全，防止未經授權之存取。{'\n\n'}
                4. 您的權利{'\n'}
                您可以隨時在應用程式中查閱、修改或刪除您的帳號及寵物資料。
              </Text>
            </ScrollView>
            <Pressable style={[styles.modalCloseButton, { backgroundColor: theme.primary }]} onPress={() => setShowPrivacyModal(false)}>
              <Text style={[styles.modalCloseText, { color: theme.background, fontFamily: fontFamilyName }]}>關閉</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* 更改暱稱 Modal */}
      <Modal visible={showNicknameModal} transparent animationType="fade" onRequestClose={() => setShowNicknameModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowNicknameModal(false)} />
          <View style={styles.formModalContainer}>
            <View style={[styles.formCard, { backgroundColor: theme.background }]}>
              <View style={styles.inputRow}>
                <Text style={[styles.inputLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>請輸入暱稱</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, fontFamily: fontFamilyName }]}
                  value={tempNickname}
                  onChangeText={setTempNickname}
                />
              </View>
              <Pressable 
                style={[styles.formSubmitButton, { backgroundColor: theme.background }]} 
                onPress={handleNicknameUpdate}
                disabled={isSavingAccount}
              >
                <Text style={[styles.formSubmitText, { color: theme.primary, fontFamily: fontFamilyName }]}>確認</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 更改密碼 Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPasswordModal(false)} />
          <View style={styles.formModalContainer}>
            <View style={[styles.formCard, { backgroundColor: theme.background }]}>
              <View style={styles.inputRow}>
                <Text style={[styles.inputLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>請輸入舊密碼</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, fontFamily: fontFamilyName }]}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={[styles.inputLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>請輸入新密碼</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, fontFamily: fontFamilyName }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={[styles.inputLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>確認新密碼</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, fontFamily: fontFamilyName }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
              <Pressable 
                style={[styles.formSubmitButton, { backgroundColor: theme.background }]} 
                onPress={handlePasswordUpdate}
                disabled={isSavingAccount}
              >
                <Text style={[styles.formSubmitText, { color: theme.primary, fontFamily: fontFamilyName }]}>確認</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 100, // Leave space for tab bar
  },
  pageTitle: {
    fontSize: getFontSize(18, 'large'),
    fontWeight: '300',
    color: '#BDBDBD',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  card: {
    width: '96%',
    alignSelf: 'center',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    boxShadow: '2px 2px 7px rgba(0, 0, 0, 0.25)',
  },
  sectionTitle: {
    fontSize: getFontSize(20, 'large'),
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '300',
  },
  value: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '300',
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 16,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '2px 2px 7px rgba(0, 0, 0, 0.25)',
  },
  actionButtonText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '400',
  },
  aboutExpandedContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    gap: 12,
  },
  aboutLinkButton: {
    width: 200,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
  },
  aboutLinkText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '400',
  },
  aboutInfoSection: {
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  aboutLogo: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  aboutAppName: {
    fontSize: getFontSize(22, 'large'),
    fontWeight: '300',
  },
  aboutAppVersion: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '300',
  },
  aboutCopyright: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '300',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '75%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    alignItems: 'center',
    flexShrink: 1,
  },
  modalTitle: {
    fontSize: getFontSize(22, 'large'),
    fontWeight: '400',
    marginBottom: 16,
  },
  modalScroll: {
    width: '100%',
    marginBottom: 20,
    flexShrink: 1,
  },
  modalText: {
    fontSize: getFontSize(16, 'medium'),
    lineHeight: 24,
    fontWeight: '300',
  },
  modalCloseButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
  },
  
  // Form Modal (Password/Nickname) styles
  formModalContainer: {
    width: '85%',
    alignItems: 'flex-start',
  },
  formModalTitle: {
    fontSize: getFontSize(14, 'small'),
    color: '#BDBDBD',
    marginBottom: 8,
    marginLeft: 8,
  },
  formCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    gap: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '400',
    width: 100,
  },
  inputField: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 0, // Fix vertical alignment/clipping
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  formSubmitButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  formSubmitText: {
    fontSize: getFontSize(18, 'large'),
    fontWeight: '400',
  },
});
