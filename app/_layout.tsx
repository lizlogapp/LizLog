import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import {
  ImageBackground,
  Platform,
  StyleSheet,
  View,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { AppLoadProvider } from '../src/contexts/AppLoadContext';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { backgroundImages } from '../src/theme/backgroundImageSettings';
import { ThemeId, paletteColors } from '../src/theme/themeColorSettings';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT } from '../src/theme/layoutSettings';
import { SplashAnimation } from '../src/components/common/SplashAnimation';
import { petService, reminderService } from '../src/services/firestoreService';
import {
  ReminderNotificationInput,
  synchronizeEligibleReminderNotifications,
} from '../src/services/notificationService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ONBOARDING_SEEN_KEY = 'lizlog:onboarding-seen:v1';

type PendingReminderRoute = {
  ownerId?: string;
  reminderId: string;
  petId?: string;
};

function reminderRouteFromResponse(
  response: Notifications.NotificationResponse | null,
): PendingReminderRoute | null {
  const data = response?.notification.request.content.data;
  if (!data || typeof data !== 'object') return null;
  const reminderId = typeof data.reminderId === 'string' ? data.reminderId : '';
  if (!reminderId) return null;
  return {
    reminderId,
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : undefined,
    petId: typeof data.petId === 'string' ? data.petId : undefined,
  };
}

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
  const [showSplash, setShowSplash] = React.useState(true);
  const handleSplashFinish = React.useCallback(() => setShowSplash(false), []);
  const [hasSeenOnboarding, setHasSeenOnboarding] = React.useState<boolean | null>(null);
  const [hasCheckedNotificationResponse, setHasCheckedNotificationResponse] = React.useState(false);
  const [pendingReminderRoute, setPendingReminderRoute] = React.useState<PendingReminderRoute | null>(null);
  const [isBootRouting, setIsBootRouting] = React.useState(true);
  const resolvedBootKey = React.useRef<string | null>(null);
  const resolvedHasPets = React.useRef<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY)
      .then(value => {
        if (active) setHasSeenOnboarding(value === 'true');
      })
      .catch(() => {
        if (active) setHasSeenOnboarding(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (segments[0] !== 'login' || hasSeenOnboarding !== false) return;
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY)
      .then(value => {
        if (value === 'true') setHasSeenOnboarding(true);
      })
      .catch(() => undefined);
  }, [hasSeenOnboarding, segments]);

  useEffect(() => {
    const receiveResponse = (response: Notifications.NotificationResponse | null) => {
      const route = reminderRouteFromResponse(response);
      if (route) setPendingReminderRoute(route);
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(receiveResponse);
    Notifications.getLastNotificationResponseAsync()
      .then(response => {
        receiveResponse(response);
        if (response) return Notifications.clearLastNotificationResponseAsync();
        return undefined;
      })
      .catch(() => undefined)
      .finally(() => setHasCheckedNotificationResponse(true));

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (isLoading || !user?.emailVerified) return;
    let petsReady = false;
    let remindersReady = false;
    let pets: Awaited<ReturnType<typeof petService.getAll>> = [];
    let reminders: ReminderNotificationInput[] = [];
    let lastSignature = '';

    const synchronize = () => {
      if (!petsReady || !remindersReady) return;
      const signature = JSON.stringify({
        mutedPetIds: pets
          .filter(pet => pet.coParents?.some(member => member.uid === user.uid && member.muteReminders))
          .map(pet => pet.id)
          .sort(),
        reminders: reminders.map(reminder => ({
        id: reminder.id,
        ownerId: reminder.ownerId,
        petId: reminder.petId,
        pets: reminder.pets,
        type: reminder.type,
        types: reminder.types,
        frequencyType: reminder.frequencyType,
        everyNDays: reminder.everyNDays,
        startDate: reminder.startDate,
        selectedWeekDays: reminder.selectedWeekDays,
        time: reminder.time,
        note: reminder.note,
          isOn: reminder.isOn,
        })).sort((left, right) => left.id.localeCompare(right.id)),
      });
      if (signature === lastSignature) return;
      lastSignature = signature;
      void synchronizeEligibleReminderNotifications(user.uid, reminders, pets).catch(() => undefined);
    };

    const unsubscribePets = petService.onPetsChanged(user.uid, nextPets => {
      pets = nextPets;
      petsReady = true;
      synchronize();
    });
    const unsubscribeReminders = reminderService.onRemindersChanged(user.uid, nextReminders => {
      reminders = nextReminders as ReminderNotificationInput[];
      remindersReady = true;
      synchronize();
    });
    return () => {
      unsubscribePets();
      unsubscribeReminders();
    };
  }, [isLoading, user?.emailVerified, user?.uid]);

  useEffect(() => {
    if (isLoading || hasSeenOnboarding === null || !hasCheckedNotificationResponse) return;

    const isRoot = (segments.length as number) === 0 || segments[0] === '' || segments[0] === 'index';
    const isLogin = segments[0] === 'login';
    const isPublicScreen = isRoot || isLogin;

    // Auth guard 必須在每次路由變更時執行；不能被一次性的 boot cache 略過。
    // 否則登出後仍可能透過 deep link 回到受保護的 tabs。
    if (!user?.emailVerified) {
      resolvedBootKey.current = 'guest';
      setIsBootRouting(false);
      if (!isPublicScreen) {
        router.replace(hasSeenOnboarding ? '/login' : '/');
      } else if (isRoot && hasSeenOnboarding) {
        router.replace('/login');
      }
      return;
    }

    const bootKey = user.uid;
    if (resolvedBootKey.current === bootKey) {
      setIsBootRouting(false);
      if (isPublicScreen) {
        router.replace(resolvedHasPets.current === false ? '/(tabs)/pets' : '/(tabs)');
      }
      return;
    }

    let active = true;
    setIsBootRouting(true);
    petService.getAll(user.uid)
      .then(pets => {
        if (!active) return;
        resolvedBootKey.current = bootKey;
        resolvedHasPets.current = pets.length > 0;
        setIsBootRouting(false);
        if (isPublicScreen) {
          if (!hasSeenOnboarding && pets.length === 0) {
            // 第一次開啟且沒有寵物資料才顯示歡迎頁。
            if (!isRoot) router.replace('/');
            return;
          }
          if (!hasSeenOnboarding && pets.length > 0) {
            // 舊版升級後已有資料時略過歡迎頁，並補記狀態避免登出後又出現。
            void AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
            setHasSeenOnboarding(true);
          }
          router.replace(pets.length > 0 ? '/(tabs)' : '/(tabs)/pets');
        }
      })
      .catch(() => {
        if (!active) return;
        // 離線時不把「查詢失敗」誤判為無寵物；先進首頁，Tabs 的即時監聽恢復後會再判斷。
        resolvedBootKey.current = bootKey;
        resolvedHasPets.current = null;
        setIsBootRouting(false);
        if (isPublicScreen) router.replace('/(tabs)');
      });

    return () => {
      active = false;
    };
  }, [
    hasCheckedNotificationResponse,
    hasSeenOnboarding,
    isLoading,
    router,
    segments,
    user,
  ]);

  useEffect(() => {
    if (isLoading || isBootRouting || !user?.emailVerified || !pendingReminderRoute) return;
    const route = pendingReminderRoute;
    setPendingReminderRoute(null);
    router.push({
      pathname: '/(tabs)/pets/reminder',
      params: {
        from: 'notification',
        reminderId: route.reminderId,
        ...(route.petId ? { id: route.petId } : {}),
        ...(route.ownerId ? { ownerId: route.ownerId } : {}),
      },
    });
  }, [isBootRouting, isLoading, pendingReminderRoute, router, user]);

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
        {!isLoading && (
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'none',
              contentStyle: { backgroundColor: "transparent", flex: 1 },
            }}
          />
        )}
        {showSplash && (
          <SplashAnimation
            isLoading={isLoading || hasSeenOnboarding === null || !hasCheckedNotificationResponse || isBootRouting}
            onFinish={handleSplashFinish}
          />
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
