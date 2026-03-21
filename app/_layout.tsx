import React, { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ImageBackground,
  Platform,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { AppLoadProvider } from '../src/contexts/AppLoadContext';
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
  const overlayColor =
    themeId === ThemeId.RI_CHU_THEME ? paletteColors.RI_CHU : paletteColors.MU_CHENG;

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
        {/* 全域背景圖 (手機畫面 130% 置中) */}
        <ImageBackground
          source={bg}
          style={{
            position: 'absolute',
            width: SCREEN_WIDTH * 1.3,
            height: SCREEN_HEIGHT * 1.3,
            left: -(SCREEN_WIDTH * 0.3) / 2,
            top: -(SCREEN_HEIGHT * 0.3) / 2,
          }}
          resizeMode="cover"
        />
        <StatusBar style="dark" translucent backgroundColor="transparent" />
        <View
          style={[
            styles.panel,
            {
              top: STATUS_BAR_HEIGHT,
              bottom: TAB_BAR_HEIGHT,
              backgroundColor: overlayColor,
            },
          ]}
          pointerEvents="box-none"
        />
        <View style={styles.stackWrapper}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent", flex: 1 },
            }}
          />
        </View>
      </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppLoadProvider
        init={
          // 可在此加入字型、Firebase 等初始化，例：
          // async () => { await Font.loadAsync(...); await initFirebase(); }
          undefined
        }
      >
        <RootLayoutInner />
      </AppLoadProvider>
    </ThemeProvider>
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

