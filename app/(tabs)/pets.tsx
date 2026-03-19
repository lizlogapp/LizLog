import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import { getThemeTokens } from '../../src/theme/themeSettings';
import { FLOATING_SPACE } from '../../src/theme/layoutSettings';

export default function PetsScreen() {
  const { themeId } = useTheme();
  const theme = getThemeTokens(themeId);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Text style={[styles.title, { color: theme.text }]}>寵物（待實作）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: FLOATING_SPACE,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});

