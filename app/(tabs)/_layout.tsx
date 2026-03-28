import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { getThemeTokens } from '../../src/theme/themeSettings';
import { useTheme } from '../../src/theme/ThemeContext';
import { TAB_BAR_HEIGHT } from '../../src/theme/layoutSettings';

/** 頁籤圖示：default 預設、active 當前頁（有陰影） */
const tabIcons = {
  analytics: {
    default: require('../../assets/tab-bar/analytics-default.png'),
    active: require('../../assets/tab-bar/analytics-active.png'),
  },
  diary: {
    default: require('../../assets/tab-bar/records-default.png'),
    active: require('../../assets/tab-bar/records-active.png'),
  },
  index: {
    default: require('../../assets/tab-bar/home-default.png'),
    active: require('../../assets/tab-bar/home-active.png'),
  },
  pets: {
    default: require('../../assets/tab-bar/pets-default.png'),
    active: require('../../assets/tab-bar/pets-active.png'),
  },
  settings: {
    default: require('../../assets/tab-bar/settings-default.png'),
    active: require('../../assets/tab-bar/settings-active.png'),
  },
} as const;

function TabsLayoutInner() {
  const { themeId } = useTheme();
  const theme = getThemeTokens(themeId);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.text,
        tabBarStyle: {
          backgroundColor: 'transparent',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          borderTopWidth: 0,
          zIndex: 100,
          height: TAB_BAR_HEIGHT,
          paddingTop: 11,    // (70 - 48) / 2 = 11 -> 強制置中
          paddingBottom: 11, // 覆蓋手機預設的安全距離推擠，強制置中
          paddingHorizontal: 28,
        },
        tabBarItemStyle: {
          height: 48, // 限縮單一按鈕可點擊高度與 icon 一致
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="analytics"
        options={{
          title: '分析',
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? tabIcons.analytics.active : tabIcons.analytics.default}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: '日記',
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? tabIcons.diary.active : tabIcons.diary.default}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '首頁',
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? tabIcons.index.active : tabIcons.index.default}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: '寵物',
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? tabIcons.pets.active : tabIcons.pets.default}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? tabIcons.settings.active : tabIcons.settings.default}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      {/* 隱藏 records 畫面，避免 Expo Router 自動生成第 6 個未配置的無效頁籤 */}
      <Tabs.Screen name="records" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabsLayout() {
  return <TabsLayoutInner />;
}
