import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { getThemeTokens } from '../../src/theme/themeSettings';
import { useTheme } from '../../src/theme/ThemeContext';
import { TAB_BAR_HEIGHT } from '../../src/theme/layoutSettings';
import { NeumorphicButton } from '../../src/components/common/NeumorphicButton';
import { useAuth } from '../../src/contexts/AuthContext';
import { PetSnapshotProvider } from '../../src/contexts/PetSnapshotContext';
import { petService } from '../../src/services/firestoreService';

import AnalyticsIcon from '../../assets/tab-bar/analytics-default.svg';
import DiaryIcon from '../../assets/tab-bar/records-default.svg';
import HomeIcon from '../../assets/tab-bar/home-default.svg';
import PetsIcon from '../../assets/tab-bar/pets-default.svg';
import SettingsIcon from '../../assets/tab-bar/settings-default.svg';

type SvgIconProps = {
  width?: string | number;
  height?: string | number;
  preserveAspectRatio?: string;
  color?: string;
};

function TabsLayoutInner() {
  const { themeId } = useTheme();
  const theme = getThemeTokens(themeId);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const { user } = useAuth();
  const [hasPets, setHasPets] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setHasPets(false);
      return;
    }
    return petService.onPetsChanged(user.uid, pets => setHasPets(pets.length > 0));
  }, [user]);

  useEffect(() => {
    // Expo Router 在首頁可能只回傳 ['(tabs)']，此時仍應視為 index。
    const currentTab = (segments as string[])[1] ?? 'index';
    if (hasPets === false && !['pets', 'settings'].includes(currentTab)) {
      router.replace('/(tabs)/pets');
    }
  }, [hasPets, router, segments]);

  const lockedTabListeners = {
    tabPress: (event: { preventDefault: () => void }) => {
      if (hasPets !== true) {
        event.preventDefault();
        router.replace('/(tabs)/pets');
      }
    },
  };

  // Helper renderer to encapsulate active logic
  const renderIcon = (IconComponent: React.ComponentType<SvgIconProps>, focused: boolean) => {
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
        <IconComponent width="100%" height="100%" preserveAspectRatio="xMidYMid meet" color="rgba(255, 255, 255, 0.6)" />
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
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          backgroundColor: 'transparent',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          borderTopWidth: 0,
          zIndex: 100,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 11,
          paddingBottom: 11 + insets.bottom,
          paddingHorizontal: 28,
        },
        tabBarItemStyle: {
          height: 48,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
      initialRouteName="index"
    >
      <Tabs.Screen
        name="analytics"
        listeners={lockedTabListeners}
        options={{
          title: '分析',
          tabBarAccessibilityLabel: hasPets ? '分析' : '分析，請先新增寵物',
          tabBarIcon: ({ focused }) => renderIcon(AnalyticsIcon, focused),
        }}
      />
      <Tabs.Screen
        name="diary"
        listeners={lockedTabListeners}
        options={{
          title: '日記',
          tabBarAccessibilityLabel: hasPets ? '日記' : '日記，請先新增寵物',
          tabBarIcon: ({ focused }) => renderIcon(DiaryIcon, focused),
        }}
      />
      <Tabs.Screen
        name="index"
        listeners={lockedTabListeners}
        options={{
          title: '首頁',
          tabBarAccessibilityLabel: hasPets ? '首頁' : '首頁，請先新增寵物',
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
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ focused }) => renderIcon(SettingsIcon, focused),
        }}
      />

      {/* 隱藏 records 舊路由，避免顯示額外頁籤。 */}
      <Tabs.Screen name="records" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabsLayout() {
  return (
    <PetSnapshotProvider>
      <TabsLayoutInner />
    </PetSnapshotProvider>
  );
}

