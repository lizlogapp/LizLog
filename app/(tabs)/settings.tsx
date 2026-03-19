import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getThemeTokens, ThemeId } from '../../src/theme/themeSettings';

const theme = getThemeTokens(ThemeId.RI_CHU_THEME);

export default function SettingsScreen() {
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>設定（待實作）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});

