import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { getThemeTokens } from '../../src/theme/themeSettings';
import { useTheme } from '../../src/theme/ThemeContext';
import { TAB_BAR_HEIGHT } from '../../src/theme/layoutSettings';
import { NeumorphicButton } from '../../src/components/common/NeumorphicButton';

import AnalyticsIcon from '../../assets/tab-bar/analytics-default.svg';
import DiaryIcon from '../../assets/tab-bar/records-default.svg';
import HomeIcon from '../../assets/tab-bar/home-default.svg';
import PetsIcon from '../../assets/tab-bar/pets-default.svg';
import SettingsIcon from '../../assets/tab-bar/settings-default.svg';

function TabsLayoutInner() {
  const { themeId } = useTheme();
  const theme = getThemeTokens(themeId);

  // Helper renderer to encapsulate active logic
  const renderIcon = (IconComponent: React.FC<any>, focused: boolean) => {
    if (focused) {
      return (
        <View style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
          <NeumorphicButton variant="tab-active" style={{ width: 50, height: 50, padding: 12 }}>
            <IconComponent width="100%" height="100%" preserveAspectRatio="xMidYMid meet" color={theme.primary} />
          </NeumorphicButton>
        </View>
      );
    }
    return (
      <View style={{ width: 50, height: 50, padding: 12, justifyContent: 'center', alignItems: 'center' }}>
        <IconComponent width="100%" height="100%" preserveAspectRatio="xMidYMid meet" color={theme.text} />
      </View>
    );
  };

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
          paddingTop: 11,
          paddingBottom: 11,
          paddingHorizontal: 28,
        },
        tabBarItemStyle: {
          height: 48,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="analytics"
        options={{
          title: '?��?',
          tabBarIcon: ({ focused }) => renderIcon(AnalyticsIcon, focused),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: '?��?',
          tabBarIcon: ({ focused }) => renderIcon(DiaryIcon, focused),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '首�?',
          tabBarIcon: ({ focused }) => renderIcon(HomeIcon, focused),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: '寵物',
          tabBarIcon: ({ focused }) => renderIcon(PetsIcon, focused),
        }}
      />
      {/* ?��? records ?�面，避??Expo Router ?��??��?�?6 ?�未?�置?�無?��?�?*/}
      <Tabs.Screen name="records" options={{ href: null }} />
      {/* ?��??��??�面（�??��??��?籤可見�? */}
    </Tabs>
  );
}

export default function TabsLayout() {
  return <TabsLayoutInner />;
}

