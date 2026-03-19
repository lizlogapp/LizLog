import React from 'react';
import { Image } from 'react-native';
import { Tabs } from 'expo-router';
import { getThemeTokens } from '../../src/theme/themeSettings';
import { useTheme } from '../../src/theme/ThemeContext';
import { TAB_BAR_HEIGHT } from '../../src/theme/layoutSettings';

/** 頁籤圖示：default 預設、active 當前頁（有陰影） */
const tabIcons = {
  index: {
    default: require('../../assets/tab-bar/home-default.png'),
    active: require('../../assets/tab-bar/home-active.png'),
  },
  records: {
    default: require('../../assets/tab-bar/records-default.png'),
    active: require('../../assets/tab-bar/records-active.png'),
  },
  analytics: {
    default: require('../../assets/tab-bar/analytics-default.png'),
    active: require('../../assets/tab-bar/analytics-active.png'),
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
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.text,
        tabBarStyle: {
          backgroundColor: theme.panelBackground,
          height: TAB_BAR_HEIGHT,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首頁',
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? tabIcons.index.active : tabIcons.index.default}
              style={{ width: 36, height: 36 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '紀錄',
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? tabIcons.records.active : tabIcons.records.default}
              style={{ width: 36, height: 36 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: '分析',
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? tabIcons.analytics.active : tabIcons.analytics.default}
              style={{ width: 36, height: 36 }}
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
              style={{ width: 36, height: 36 }}
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
              style={{ width: 36, height: 36 }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabsLayout() {
  return <TabsLayoutInner />;
}

