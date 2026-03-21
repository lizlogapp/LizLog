import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { getThemeTokens } from '../../src/theme/themeSettings';
import { getFontSize } from '../../src/theme/typographySettings';

export default function EmptyDiaryScreen() {
  const router = useRouter();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text, fontFamily: fontFamilyName }]}>日記 - 月份 - 尚無紀錄</Text>
      <Text style={[styles.subtitle, { color: theme.text, fontFamily: fontFamilyName }]}>這裡未來是尚無紀錄的月份畫面</Text>
      <Pressable onPress={() => router.back()} style={styles.button}>
        <Text style={[styles.buttonText, { color: theme.primary, fontFamily: fontFamilyName }]}>返回首頁</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: getFontSize(24, 'large'),
    marginBottom: 12,
  },
  subtitle: {
    fontSize: getFontSize(16, 'medium'),
    marginBottom: 40,
    opacity: 0.6,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
  },
  buttonText: {
    fontSize: getFontSize(16, 'medium'),
  }
});
