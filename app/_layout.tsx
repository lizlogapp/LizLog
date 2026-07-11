import React, { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import {
  ImageBackground,
  Platform,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { AppLoadProvider } from '../src/contexts/AppLoadContext';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { backgroundImages } from '../src/theme/backgroundImageSettings';
import { ThemeId, paletteColors } from '../src/theme/themeColorSettings';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT } from '../src/theme/layoutSettings';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 結構：
 * - 底圖：滿版 background-ri-chu
 * - 面板：W 滿版、H 滿版 上下各 -70，底色依主題
 * - 內容：面板保留 W8 H8 邊距（Tabs sceneContainerStyle）
 * - 頁面：內容保留 W8 H8 邊距（各 tab 自行實作）
 */
function RootLayoutInner() {
  const { themeId } = useTheme();
  const bg = backgroundImages[themeId];
  const insets = useSafeAreaInsets();
  const overlayColor =
    themeId === ThemeId.RI_CHU_THEME ? paletteColors.RI_CHU : paletteColors.MU_CHENG;

  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    
    const isRoot = (segments.length as number) === 0 || segments[0] === '' || segments[0] === 'index';
    const inAuthGroup = segments[0] === 'login' || isRoot;

    if (!user && !inAuthGroup) {
      router.replace('/');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const setupImmersiveNavigation = async () => {
      await NavigationBar.setBehaviorAsync('overlay-swipe');
      await NavigationBar.setVisibilityAsync('hidden');
    };

    setupImmersiveNavigation().catch(() => {
      // Android 導覽列設定失敗時不中斷畫面渲染
    });
  }, []);

  return (
    <View style={[styles.root, { minHeight: SCREEN_HEIGHT, minWidth: SCREEN_WIDTH }]}>
      <ImageBackground
        source={bg}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: -90,
        }}
        resizeMode="cover"
      />
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <View
        style={[
          styles.panel,
          {
            top: STATUS_BAR_HEIGHT,
            bottom: TAB_BAR_HEIGHT + insets.bottom,
            backgroundColor: overlayColor,
          },
        ]}
        pointerEvents="box-none"
      />
      <View style={[styles.stackWrapper, { flex: 1 }]}>
        {!isLoading ? (
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'none',
              contentStyle: { backgroundColor: "transparent", flex: 1 },
            }}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: 'transparent' }} />
        )}
      </View>
    </View>
  );
}

/** React Navigation 主題：強制所有 Navigator 場景背景透明 */
const transparentNavTheme = {
  dark: false,
  colors: {
    primary: '#FF7300',
    background: 'transparent',
    card: 'transparent',
    text: '#5F5F5F',
    border: 'transparent',
    notification: '#FF7300',
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NavigationThemeProvider value={transparentNavTheme}>
        <ThemeProvider>
          <AuthProvider>
            <AppLoadProvider
              init={
                // 可在此加入字型、Firebase 等初始化，例：
                // async () => { await Font.loadAsync(...); await initFirebase(); }
                undefined
              }
            >
              <RootLayoutInner />
            </AppLoadProvider>
          </AuthProvider>
        </ThemeProvider>
      </NavigationThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
  },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  stackWrapper: {
    flex: 1,
  },
});

