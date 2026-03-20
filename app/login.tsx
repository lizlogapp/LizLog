import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
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

const { width: W, height: H } = Dimensions.get('window');
const PAGE_LEFT = PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN;
const PAGE_TOP = STATUS_BAR_HEIGHT + PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN;
const PAGE_WIDTH = W - (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;
const PAGE_HEIGHT = H - STATUS_BAR_HEIGHT - TAB_BAR_HEIGHT - (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;

export default function LoginScreen() {
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // 稍後實接 Firebase Auth，目前暫時引導至主畫面
    router.replace('/(tabs)');
  };

  const pageStyle = {
    backgroundColor: paletteColors.RI_CHU,
    left: PAGE_LEFT,
    top: PAGE_TOP,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.page, pageStyle]}>
        
        {/* Logo 區塊 */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/branding/logos/logo-square-with-text.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* 帳密登入卡片 (Inner Card) */}
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
            />
          </View>

          {/* 密碼 */}
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
              密碼
            </Text>
            <TextInput
              style={[styles.textInput, { fontFamily: fontFamilyName }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* 忘記密碼 */}
          <View style={styles.forgotPasswordRow}>
            <Pressable>
              <Text style={[styles.forgotText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                忘記密碼？
              </Text>
            </Pressable>
          </View>

          {/* 登入按鈕 */}
          <View style={styles.loginButtonRow}>
            <Pressable
              style={({ pressed }) => [styles.pillButton, pressed && { opacity: 0.8 }]}
              onPress={handleLogin}
            >
              <Text style={[styles.pillButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                登入
              </Text>
            </Pressable>
          </View>

          {/* 註冊帳號按鈕 */}
          <View style={styles.registerRow}>
            <Pressable
              style={({ pressed }) => [styles.pillButton, pressed && { opacity: 0.8 }]}
            >
              <Text style={[styles.pillButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                註冊帳號
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 快速登入卡片 (SSO Card) */}
        <View style={[styles.innerCard, styles.ssoCard]}>
          <View style={styles.ssoButtonsRow}>
            <Pressable style={styles.ssoIconButton}>
              <Image
                source={require('../assets/icons/icon-google.png')}
                style={styles.ssoIconImage}
                resizeMode="contain"
              />
            </Pressable>
            <Pressable style={styles.ssoIconButton}>
              <Image
                source={require('../assets/icons/icon-line.png')}
                style={styles.ssoIconImage}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </View>

      </View>
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
    alignItems: 'center',
    paddingVertical: 20, // 再次縮減 padding 以節省垂直空間
  },
  logoContainer: {
    width: '100%',
    height: 80, 
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,    // 明確增加 Logo 頂部到螢幕的呼吸空間
    marginBottom: 36, // 大幅撐開 Logo 和下方帳號區塊的距離，達成「帳號往下移」效果
  },
  logoImage: {
    width: 90, // 縮小圖片尺寸
    height: 90,
  },
  innerCard: {
    width: '85%',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 12,
    padding: 20, // 卡片內部留白縮緊
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16, // 縮小卡片間距
    // 微小邊界營造擬物/浮動感
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16, // 縮小輸入框列距
  },
  inputLabel: {
    fontSize: getFontSize(18, 'medium'), // 原本 20，降至 18，與登入鍵同字級
    width: 60,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: getFontSize(16, 'medium'),
    color: '#333333',
    backgroundColor: '#FAFAFA',
  },
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginBottom: 16, // 縮小間距
    marginRight: 4,
  },
  loginButtonRow: {
    alignItems: 'center', // 保證 W (水平) 絕對置中
    marginBottom: 16, // 縮小間距
  },
  pillButton: {
    minWidth: 140, // 強制保證最小寬度，讓短字數的「登入」與長字數的「註冊帳號」寬高完全一致
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: paletteColors.RI_CHU,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillButtonText: {
    fontSize: getFontSize(18, 'medium'),
  },
  forgotText: {
    fontSize: getFontSize(14, 'medium'), // 要求調降忘記密碼字級
  },
  registerRow: {
    alignItems: 'center',
  },
  ssoCard: {
    padding: 20, // 配合 innerCard 同步縮小留白
    alignItems: 'center',
  },
  ssoButtonsRow: {
    flexDirection: 'row',
    gap: 16, // 縮短圖示間距
  },
  ssoIconButton: {
    width: 50,
    height: 50,
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ssoIconImage: {
    width: 32,
    height: 32,
  },
});
