import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/ThemeContext';
import { getThemeTokens } from '../src/theme/themeSettings';
import {
  STATUS_BAR_HEIGHT,
  TAB_BAR_HEIGHT,
  PANEL_CONTENT_MARGIN,
  CONTENT_PAGE_MARGIN,
  borderRadius,
} from '../src/theme/layoutSettings';
import { paletteColors } from '../src/theme/themeColorSettings';
import { getFontSize } from '../src/theme/typographySettings';

const { width: W, height: H } = Dimensions.get('window');
const PAGE_LEFT = PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN;
const PAGE_TOP = STATUS_BAR_HEIGHT + PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN;
const PAGE_WIDTH = W - (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;
const PAGE_HEIGHT = H - STATUS_BAR_HEIGHT - TAB_BAR_HEIGHT - (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;

const onboardingSteps = [
  {
    title: '歡迎來到蜥日日記',
    subtitle: '清晰紀錄，自信守護。',
    image: require('../assets/illustrations/onboarding-01-lizard.png'),
  },
  {
    title: '從感覺到洞察',
    subtitle: '將溫濕度、體重與飲食數據轉化為清晰圖表，\n科學化照護，讓愛更有依據。',
    image: require('../assets/illustrations/onboarding-02-chart.png'),
  },
  {
    title: '與家人共同守護',
    subtitle: '邀請您的家人或伴侶，同步所有照護紀錄，\n讓愛從不錯過，也從不重複。',
    image: require('../assets/illustrations/onboarding-03-chat.png'),
  },
];

export default function OnboardingScreen() {
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);

  const handleNext = () => {
    if (stepIndex < onboardingSteps.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      router.replace('/login');
    }
  };

  const currentStep = onboardingSteps[stepIndex];

  const pageStyle = {
    backgroundColor: paletteColors.RI_CHU,
    left: PAGE_LEFT,
    top: PAGE_TOP,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  };

  return (
    <Pressable style={styles.container} onPress={handleNext}>
      <View style={[styles.page, pageStyle]}>

        {/* 標題區 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.primary, fontFamily: fontFamilyName }]}>
            {currentStep.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
            {currentStep.subtitle}
          </Text>
        </View>

        {/* 插圖 */}
        <View style={styles.imageContainer}>
          <Image
            source={currentStep.image}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* 底部小圓點佈局 */}
        <View style={styles.pagination}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === stepIndex ? theme.primary : theme.accentNoon
                }
              ]}
            />
          ))}
        </View>

      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  page: {
    position: 'absolute',
    borderRadius: borderRadius.md,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 7,
    alignItems: 'center',
    paddingVertical: 50,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: getFontSize(32, 'medium'),
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: getFontSize(18, 'medium'),
    textAlign: 'center',
    lineHeight: 28,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '90%',
    height: '90%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
});
