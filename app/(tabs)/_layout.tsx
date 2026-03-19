import React from 'react';
import { Tabs } from 'expo-router';
import { getThemeTokens, ThemeId } from '../../src/theme/themeSettings';

const theme = getThemeTokens(ThemeId.RI_CHU_THEME);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.text,
        tabBarStyle: {
          backgroundColor: theme.panelBackground,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '首頁' }} />
      <Tabs.Screen name="records" options={{ title: '紀錄' }} />
      <Tabs.Screen name="analytics" options={{ title: '分析' }} />
      <Tabs.Screen name="pets" options={{ title: '寵物' }} />
      <Tabs.Screen name="settings" options={{ title: '設定' }} />
    </Tabs>
  );
}

