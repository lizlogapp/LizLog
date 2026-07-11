import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { useAuth } from '../../../src/contexts/AuthContext';
import { inviteService } from '../../../src/services/firestoreService';

export default function JoinScreen() {
  const router = useRouter();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);
  const { user } = useAuth();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!user || !code.trim()) return;

    setIsLoading(true);
    try {
      const result = await inviteService.consumeInvite(
        code.trim(),
        user.uid,
        user.displayName || '飼育者'
      );

      if (result.success) {
        Alert.alert('成功', result.message, [
          { text: '確定', onPress: () => router.replace('/(tabs)/pets') },
        ]);
      } else {
        Alert.alert('失敗', result.message);
      }
    } catch (error) {
      Alert.alert('錯誤', '加入失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => router.back() },
          ]}
        />
      }
    >
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.primary, fontFamily: fontFamilyName }]}>
          輸入邀請碼
        </Text>
        <Text style={[styles.subtitle, { color: theme.primary + '80', fontFamily: fontFamilyName }]}>
          輸入主飼主分享的邀請碼，加入共同飼育
        </Text>

        <TextInput
          style={[styles.input, { 
            color: theme.primary, 
            fontFamily: fontFamilyName,
            backgroundColor: theme.background,
            borderColor: theme.primary + '30',
          }]}
          value={code}
          onChangeText={setCode}
          placeholder="請輸入 6 位邀請碼"
          placeholderTextColor={theme.primary + '40'}
          autoCapitalize="characters"
          maxLength={6}
          textAlign="center"
        />

        <Pressable
          style={({ pressed }) => [
            styles.joinButton,
            { backgroundColor: code.trim().length === 6 ? theme.primary : theme.primary + '40' },
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleJoin}
          disabled={code.trim().length !== 6 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.joinButtonText, { fontFamily: fontFamilyName }]}>
              加入共同飼育
            </Text>
          )}
        </Pressable>
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: getFontSize(24, 'large'),
    fontWeight: '300',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: getFontSize(14, 'medium'),
    fontWeight: '300',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    width: '100%',
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: getFontSize(28, 'large'),
    letterSpacing: 8,
    fontWeight: '400',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  joinButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: getFontSize(18, 'medium'),
    fontWeight: '500',
  },
});
