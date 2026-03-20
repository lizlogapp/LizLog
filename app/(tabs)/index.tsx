import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  Easing,
} from 'react-native';
import { paletteColors } from '../../src/theme/themeColorSettings';
import {
  STATUS_BAR_HEIGHT,
  TAB_BAR_HEIGHT,
  PANEL_CONTENT_MARGIN,
  CONTENT_PAGE_MARGIN,
  LOAD_ANIMATION_ACCELERATE_MS,
  borderRadius,
} from '../../src/theme/layoutSettings';
import { useAppLoad } from '../../src/contexts/AppLoadContext';

/**
 * 頁面尺寸與位置（螢幕座標）：
 * 內容 = 面板保留 W8 H8 邊距
 * 頁面 = 內容保留 W8 H8 邊距
 * left 16, top 86, width W-32, height H-172
 */
const { width: W, height: H } = Dimensions.get('window');
const PAGE_LEFT = PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN;
const PAGE_TOP =
  STATUS_BAR_HEIGHT + PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN;
const PAGE_WIDTH =
  W - (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;
const PAGE_HEIGHT =
  H -
  STATUS_BAR_HEIGHT -
  TAB_BAR_HEIGHT -
  (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;

/** 圖片內邊距 */
const IMAGE_PADDING = 64;

export default function HomeScreen() {
  const { isReady } = useAppLoad();
  const img1Opacity = useRef(new Animated.Value(0)).current;
  const img2Opacity = useRef(new Animated.Value(0)).current;
  const img3Opacity = useRef(new Animated.Value(0)).current;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasAcceleratedRef = useRef(false);

  // 當 app 提早載入完成：加速至 載入頁-4（logo）
  useEffect(() => {
    if (!isReady || hasAcceleratedRef.current) return;
    hasAcceleratedRef.current = true;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    Animated.parallel([
      Animated.timing(img1Opacity, {
        toValue: 0,
        duration: LOAD_ANIMATION_ACCELERATE_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(img2Opacity, {
        toValue: 0,
        duration: LOAD_ANIMATION_ACCELERATE_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(img3Opacity, {
        toValue: 1,
        duration: LOAD_ANIMATION_ACCELERATE_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isReady, img1Opacity, img2Opacity, img3Opacity]);

  // 依時序播放載入動畫；若 isReady 先觸發則會被加速邏輯取代
  useEffect(() => {
    const t1 = setTimeout(() => {
      Animated.timing(img1Opacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, 800);

    const t2 = setTimeout(() => {
      Animated.timing(img2Opacity, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, 1200 + 800);

    const t3 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(img1Opacity, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(img2Opacity, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(img3Opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, 1200 + 800 + 1600 + 800);

    timersRef.current = [t1, t2, t3];
    return () => timersRef.current.forEach(clearTimeout);
  }, [img1Opacity, img2Opacity, img3Opacity]);

  const pageStyle = {
    backgroundColor: paletteColors.BAI_RI,
    left: PAGE_LEFT,
    top: PAGE_TOP,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  };

  return (
    <View style={styles.container}>
      {/* 頁面固定不動，僅圖片淡入淡出 */}
      <View style={[styles.page, pageStyle]} pointerEvents="none">
        <View style={styles.imageWrapper}>
          {/* light 底層、dark 上層，疊加時 dark 遮住 light */}
          <Animated.View
            style={[styles.imageAnimated, styles.layerLight, { opacity: img1Opacity }]}
          >
            <Image
              source={require('../../assets/illustrations/lizard-head-light.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.View
            style={[styles.imageAnimated, styles.layerDark, { opacity: img2Opacity }]}
          >
            <Image
              source={require('../../assets/illustrations/lizard-head-dark.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.View
            style={[styles.imageAnimated, styles.layerLogo, { opacity: img3Opacity }]}
          >
            <Image
              source={require('../../assets/branding/logos/logo-square-with-text.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  /** 載入頁-1/2/3/4：依螢幕尺寸計算的「頁面」矩形 */
  page: {
    position: 'absolute',
    borderRadius: borderRadius.md,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 7,
  },
  /** 圖片容器：padding 64，圖片置於頁面高度 4/9 位置 */
  imageWrapper: {
    flex: 1,
    padding: IMAGE_PADDING,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /** 圖片動畫容器：堆疊於同一位置，與 imageWrapper padding 一致 */
  imageAnimated: {
    position: 'absolute',
    top: IMAGE_PADDING,
    left: IMAGE_PADDING,
    right: IMAGE_PADDING,
    bottom: IMAGE_PADDING,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layerLight: { zIndex: 1 },
  layerDark: { zIndex: 2 },
  layerLogo: { zIndex: 3 },
  /** 圖片：translateY 上移，使中心從 1/2 移至 4/9 */
  image: {
    width: '100%',
    height: '100%',
    transform: [{ translateY: -PAGE_HEIGHT * (1 / 2 - 4 / 9) }],
  },
});

