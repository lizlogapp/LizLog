import React from 'react';
import { Stack } from 'expo-router';
import { ImageBackground, StyleSheet, View } from 'react-native';

import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { backgroundImages } from '../src/theme/backgroundImageSettings';
import { ThemeId, paletteColors } from '../src/theme/themeColorSettings';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT } from '../src/theme/layoutSettings';

/** 中間內容區底色：日初 #FFFEFA、澄日 #FFAA1E，上下各留 70 讓背景圖露出 */
function RootLayoutInner() {
  const { themeId } = useTheme();
  const bg = backgroundImages[themeId];
  const overlayColor =
    themeId === ThemeId.RI_CHU_THEME ? paletteColors.RI_CHU : paletteColors.MU_CHENG;

  return (
    <ImageBackground source={bg} style={styles.background} resizeMode="cover">
      <View
        style={[
          styles.overlay,
          {
            top: STATUS_BAR_HEIGHT,
            bottom: TAB_BAR_HEIGHT,
            backgroundColor: overlayColor,
          },
        ]}
        pointerEvents="box-none"
      />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </ImageBackground>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});

