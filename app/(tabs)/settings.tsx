import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Modal, TextInput } from 'react-native';
import LogoIcon from '../../assets/branding/logos/logo-icon.svg';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { getThemeTokens, ThemeId } from '../../src/theme/themeSettings';
import { paletteColors } from '../../src/theme/themeColorSettings';
import { getFontSize } from '../../src/theme/typographySettings';
import { BaseScreen } from '../../src/components/common/BaseScreen';

export default function SettingsScreen() {
  const { themeId, setThemeId, fontFamilyName, fontFamilyId, setFontFamilyId } = useTheme();
  const theme = getThemeTokens(themeId);
  const router = useRouter();

  // Mock states for switches
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [sysNotifyEnabled, setSysNotifyEnabled] = useState(true);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  
  const [nickname, setNickname] = useState('鴉小姐');
  const [tempNickname, setTempNickname] = useState('');
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
            <Text style={[styles.value, { color: theme.primary, fontFamily: fontFamilyName }]}>Nov****@gmail.com</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.primary, fontFamily: fontFamilyName }]}>密碼</Text>
            <Pressable onPress={() => setShowPasswordModal(true)}>
              <Text style={[styles.value, { color: theme.primary, fontFamily: fontFamilyName }]}>更改密碼</Text>
            </Pressable>
          </View>

          {/* Section: 通知設定 */}
          <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: fontFamilyName, marginTop: 16 }]}>
            通知設定
          </Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.primary, fontFamily: fontFamilyName }]}>提醒</Text>
            <Switch
              trackColor={{ false: '#E0E0E0', true: theme.primary }}
              thumbColor={'#FFFFFF'}
              onValueChange={setReminderEnabled}
              value={reminderEnabled}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.primary, fontFamily: fontFamilyName }]}>系統通知</Text>
            <Switch
              trackColor={{ false: '#E0E0E0', true: theme.primary }}
              thumbColor={'#FFFFFF'}
              onValueChange={setSysNotifyEnabled}
              value={sysNotifyEnabled}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>

          {/* Section: 個人化設定 */}
          <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: fontFamilyName, marginTop: 16 }]}>
            個人化設定
          </Text>
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
                {fontFamilyId === 'HAXI_RI' ? '暇日' : '魚白'}
              </Text>
            </Pressable>
          </View>

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
            <Pressable style={[styles.actionButton, { backgroundColor: theme.background }]}>
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
                    版本 1.0.0
                  </Text>
                  <Text style={[styles.aboutCopyright, { color: theme.primary, fontFamily: fontFamilyName }]}>
                    © 2026 LizLog
                  </Text>
                </View>
              </View>
            )}

            <Pressable 
              style={[styles.actionButton, { backgroundColor: theme.background }]}
              onPress={() => router.replace('/login')}
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
                onPress={() => { setNickname(tempNickname); setShowNicknameModal(false); }}
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
                onPress={() => { 
                  // TODO: handle password change logic
                  setOldPassword(''); setNewPassword(''); setConfirmPassword('');
                  setShowPasswordModal(false); 
                }}
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
