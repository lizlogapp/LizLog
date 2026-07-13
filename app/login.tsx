import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth } from '../src/config/firebase';
import { useTheme } from '../src/theme/ThemeContext';
import { getThemeTokens } from '../src/theme/themeSettings';
import {
  STATUS_BAR_HEIGHT,
  TAB_BAR_HEIGHT,
  PANEL_CONTENT_MARGIN,
  CONTENT_PAGE_MARGIN,
  borderRadius,
} from '../src/theme/layoutSettings';
import { paletteColors } from '../src/theme/themeColorSettings';
import { fontFamilies, getFontSize } from '../src/theme/typographySettings';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// 確保 OAuth 重導向後能正確關閉瀏覽器視窗
WebBrowser.maybeCompleteAuthSession();

const { width: W, height: H } = Dimensions.get('window');
const PAGE_LEFT = PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN;
const PAGE_TOP = STATUS_BAR_HEIGHT + PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN;
const PAGE_WIDTH = W - (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;
const PAGE_HEIGHT = H - STATUS_BAR_HEIGHT - TAB_BAR_HEIGHT - (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;

// Google OAuth Web Client ID (從 Firebase 控制台取得)
const GOOGLE_WEB_CLIENT_ID = '670714384705-co1kq6ahjop7ussdp6ve0h9ug6kv69am.apps.googleusercontent.com';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const DYNAMIC_PAGE_HEIGHT = H - STATUS_BAR_HEIGHT - TAB_BAR_HEIGHT - insets.bottom - (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;

  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // 密碼顯示/隱藏狀態
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // 註冊 Modal 狀態
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);

  // Google OAuth 設定（使用 useIdTokenAuthRequest 取得 id_token 來搭配 Firebase）
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
  });

  // 監聽 Google 登入結果
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleFirebaseSignIn(id_token);
    } else if (response?.type === 'error') {
      setIsGoogleLoading(false);
      Alert.alert('錯誤', 'Google 登入失敗，請稍後再試');
    } else if (response?.type === 'dismiss') {
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleFirebaseSignIn = async (idToken: string) => {
    try {
      setIsGoogleLoading(true);
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      // 成功後 _layout.tsx 會監聽 auth state 改變並自動導航
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      Alert.alert('錯誤', 'Google 帳號登入失敗，請稍後再試');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAuthError = (error: any) => {
    console.error('Auth error detail:', error);
    let errorMessage = '發生錯誤，請稍後再試';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = '該電子郵件已被註冊過';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '電子郵件格式錯誤';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = '帳號或密碼錯誤';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = '密碼強度太弱 (至少需要 6 個字元)';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Firebase 尚未啟用「電子郵件/密碼」登入方式，請至 Firebase 控制台啟用它！';
    } else if (error.code) {
      errorMessage = `${errorMessage} (${error.code})`;
    } else if (error.message) {
      errorMessage = `${errorMessage} (${error.message})`;
    }
    Alert.alert('錯誤', errorMessage);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('提示', '請輸入帳號與密碼');
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 檢查信箱是否驗證
      if (!user.emailVerified) {
        try {
          await sendEmailVerification(user);
        } catch {
          // Firebase 可能因寄送頻率限制拒絕重寄；仍需立即登出未驗證帳號。
        }
        await signOut(auth);
        Alert.alert('需要驗證電子郵件', '驗證信已寄出。請完成信箱驗證後再登入。');
        return;
      }
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      Alert.alert('提示', '請先輸入註冊信箱');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      Alert.alert('已發送', '密碼重設信已寄出，請檢查您的收件匣。');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePerformRegister = async () => {
    if (!regEmail || !regPassword || !regConfirmPassword) {
      Alert.alert('提示', '請完整填寫所有註冊欄位');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      Alert.alert('提示', '兩次輸入的密碼不一致');
      return;
    }
    setIsRegLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const user = userCredential.user;
      
      // 寄送驗證信
      await sendEmailVerification(user);
      
      // 立即登出防止導向進入 App
      await signOut(auth);
      
      setRegisterModalVisible(false);
      
      Alert.alert(
        '註冊成功！',
        '驗證郵件已寄出。請至您的信箱「收信並點擊驗證連結」，完成後即可回到此頁面登入！'
      );
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsRegLoading(false);
    }
  };

  const pageStyle = {
    backgroundColor: paletteColors.RI_CHU,
    left: PAGE_LEFT,
    top: PAGE_TOP,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  };

  const anyLoading = isLoading || isGoogleLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.page, pageStyle]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo 區塊 */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/branding/logos/logo-text-square.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* 帳密登入卡片 */}
          <View style={styles.innerCard}>
            {/* 帳號 */}
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
                帳號
              </Text>
              <TextInput
                style={[styles.textInput, { fontFamily: fontFamilyName }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!anyLoading}
                placeholder="請輸入 Email"
                placeholderTextColor="#C0C0C0"
              />
            </View>

            {/* 密碼 */}
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
                密碼
              </Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.passwordInput, { fontFamily: fontFamilyName }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!anyLoading}
                  placeholder="請輸入密碼"
                  placeholderTextColor="#C0C0C0"
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={[styles.eyeText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                    {showPassword ? '隱藏' : '顯示'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 忘記密碼 */}
            <View style={styles.forgotPasswordRow}>
              <Pressable disabled={anyLoading} onPress={handleForgotPassword}>
                <Text style={[styles.forgotText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  忘記密碼？
                </Text>
              </Pressable>
            </View>

            {/* 登入 & 註冊按鈕 */}
            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.pillButton,
                  pressed && { opacity: 0.8 },
                  anyLoading && { opacity: 0.5 }
                ]}
                onPress={handleLogin}
                disabled={anyLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <Text style={[styles.pillButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                    登入
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.pillButton,
                  pressed && { opacity: 0.8 },
                  anyLoading && { opacity: 0.5 }
                ]}
                onPress={() => {
                  setRegEmail(email); // 帶入已輸入的信箱
                  setRegPassword('');
                  setRegConfirmPassword('');
                  setShowRegPassword(false);
                  setShowRegConfirmPassword(false);
                  setRegisterModalVisible(true);
                }}
                disabled={anyLoading}
              >
                <Text style={[styles.pillButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  註冊帳號
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 快速登入區塊 (符合截圖) */}
          <View style={styles.quickLoginCard}>
            <Text style={[styles.quickLoginLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
              快速登入
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.googleSquareButton,
                pressed && { opacity: 0.85 },
                anyLoading && { opacity: 0.5 },
              ]}
              onPress={() => {
                setIsGoogleLoading(true);
                promptAsync();
              }}
              disabled={!request || anyLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <Image
                  source={require('../assets/icons/icon-google.png')}
                  style={styles.googleIconOnly}
                  resizeMode="contain"
                />
              )}
            </Pressable>
          </View>

        </ScrollView>
      </View>

      {/* 註冊 Modal 視窗 */}
      <Modal
        visible={registerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRegisterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardAvoid}
          >
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
                建立新帳號
              </Text>

              {/* 註冊信箱 */}
              <View style={styles.inputRow}>
                <Text style={[styles.inputLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  信箱
                </Text>
                <TextInput
                  style={[styles.textInput, { fontFamily: fontFamilyName }]}
                  value={regEmail}
                  onChangeText={setRegEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isRegLoading}
                  placeholder="請輸入 Email"
                  placeholderTextColor="#C0C0C0"
                />
              </View>

              {/* 註冊密碼 */}
              <View style={styles.inputRow}>
                <Text style={[styles.inputLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  密碼
                </Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.passwordInput, { fontFamily: fontFamilyName }]}
                    value={regPassword}
                    onChangeText={setRegPassword}
                    secureTextEntry={!showRegPassword}
                    editable={!isRegLoading}
                    placeholder="請輸入密碼"
                    placeholderTextColor="#C0C0C0"
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowRegPassword(!showRegPassword)}
                  >
                    <Text style={[styles.eyeText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                      {showRegPassword ? '隱藏' : '顯示'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* 確認密碼 */}
              <View style={styles.inputRow}>
                <Text style={[styles.inputLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  確認
                </Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.passwordInput, { fontFamily: fontFamilyName }]}
                    value={regConfirmPassword}
                    onChangeText={setRegConfirmPassword}
                    secureTextEntry={!showRegConfirmPassword}
                    editable={!isRegLoading}
                    placeholder="再次輸入密碼"
                    placeholderTextColor="#C0C0C0"
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  >
                    <Text style={[styles.eyeText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                      {showRegConfirmPassword ? '隱藏' : '顯示'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={[styles.actionRow, { marginTop: 20 }]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.pillButton,
                    { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
                    pressed && { opacity: 0.8 },
                    isRegLoading && { opacity: 0.5 }
                  ]}
                  onPress={() => setRegisterModalVisible(false)}
                  disabled={isRegLoading}
                >
                  <Text style={[styles.pillButtonText, { color: '#888888', fontFamily: fontFamilyName }]}>
                    取消
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.pillButton,
                    pressed && { opacity: 0.8 },
                    isRegLoading && { opacity: 0.5 }
                  ]}
                  onPress={handlePerformRegister}
                  disabled={isRegLoading}
                >
                  {isRegLoading ? (
                    <ActivityIndicator color={theme.primary} />
                  ) : (
                    <Text style={[styles.pillButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                      完成註冊
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  page: {
    position: 'absolute',
    borderRadius: borderRadius.md,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 7,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 32,
  },
  logoContainer: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  innerCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: getFontSize(18, 'medium'),
    width: 60,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: getFontSize(16, 'medium'),
    color: '#333333',
    backgroundColor: '#FCFCFC',
  },
  passwordInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    backgroundColor: '#FCFCFC',
    height: 42,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: getFontSize(16, 'medium'),
    color: '#333333',
  },
  eyeButton: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  eyeText: {
    fontSize: getFontSize(14, 'medium'),
  },
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginBottom: 18,
    marginRight: 4,
  },
  forgotText: {
    fontSize: getFontSize(14, 'medium'),
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  pillButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillButtonText: {
    fontSize: getFontSize(18, 'medium'),
  },
  quickLoginCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  quickLoginLabel: {
    fontSize: getFontSize(14, 'medium'),
    marginBottom: 10,
    textAlign: 'center',
  },
  googleSquareButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  googleIconOnly: {
    width: 26,
    height: 26,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeyboardAvoid: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    fontSize: getFontSize(20, 'medium'),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
});
