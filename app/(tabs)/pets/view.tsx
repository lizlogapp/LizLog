import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';

// 模擬寵物詳細資料（未來從 Supabase 取得）
const petDetails: Record<string, {
  name: string;
  species: string;
  birthDate: Date;
  tag: string;
  imageUri: any;
  weight: string;
  length: string;
  nextReminder: string;
  reminderNote: string;
  lastVisit: string;
}> = {
  '1': {
    name: 'DELETE',
    species: '鬆獅蜥',
    birthDate: new Date('2022-07-01'),
    tag: '睡姿奇葩',
    imageUri: require('../../../assets/user-uploads/lizard-001.jpg'),
    weight: '415 g',
    length: '44 cm',
    nextReminder: '明天　10:00',
    reminderNote: '食物添加維生素',
    lastVisit: '5個月前',
  },
  '2': {
    name: 'CTRL',
    species: '鬆獅蜥',
    birthDate: new Date('2024-12-01'),
    tag: '吃貨擔當',
    imageUri: require('../../../assets/user-uploads/lizard-003.jpg'),
    weight: '280 g',
    length: '32 cm',
    nextReminder: '後天　09:00',
    reminderNote: '驅蟲藥',
    lastVisit: '2個月前',
  },
  '3': {
    name: 'ENTER',
    species: '鬆獅蜥',
    birthDate: new Date('2024-02-01'),
    tag: '小太陽',
    imageUri: require('../../../assets/user-uploads/lizard-005.jpg'),
    weight: '320 g',
    length: '35 cm',
    nextReminder: '下週一　14:00',
    reminderNote: '健檢',
    lastVisit: '1個月前',
  },
  '4': {
    name: 'ALT',
    species: '鬆獅蜥',
    birthDate: new Date('2023-10-01'),
    tag: '探險家',
    imageUri: require('../../../assets/user-uploads/lizard-007.jpg'),
    weight: '350 g',
    length: '38 cm',
    nextReminder: '週五　11:00',
    reminderNote: '補鈣粉',
    lastVisit: '3個月前',
  },
};

function calcAge(birthDate: Date): string {
  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years > 0 && months > 0) return `${years} 歲 ${months} 個月`;
  if (years > 0) return `${years} 歲`;
  return `${months} 個月`;
}

// 功能按鈕清單
const menuItems = [
  { id: 'reminder', label: '提醒設定', icon: require('../../../assets/icons/icon-alert.png') },
  { id: 'medical', label: '醫護資訊', icon: require('../../../assets/icons/icon-medical.png') },
  { id: 'coparent', label: '共同飼育', icon: require('../../../assets/icons/icon-co-care.png') },
  { id: 'edit', label: '編輯檔案', icon: require('../../../assets/icons/icon-edit.png') },
  { id: 'delete', label: '刪除資料', icon: require('../../../assets/icons/icon-delete.png') },
];

export default function PetViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);

  const pet = petDetails[id || '1'];
  if (!pet) return null;

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 主卡片 */}
        <View style={styles.mainCard}>
          {/* 寵物照片 */}
          <View style={styles.photoWrapper}>
            <Image
              source={pet.imageUri}
              style={styles.petPhoto}
              resizeMode="cover"
            />
          </View>

          {/* 名字 & 資訊 */}
          <View style={styles.infoSection}>
            <Text style={[styles.petName, { color: theme.primary, fontFamily: fontFamilyName }]}>
              {pet.name}
            </Text>
            <Text style={[styles.petSpeciesAge, { color: theme.primary, fontFamily: fontFamilyName }]}>
              {pet.species}　·　{calcAge(pet.birthDate)}
            </Text>
            <Text style={[styles.petTag, { color: theme.primary, fontFamily: fontFamilyName }]}>
              {pet.tag}
            </Text>
          </View>

          {/* 數值資訊區 */}
          <View style={styles.statsSection}>
            <Text style={[styles.statLine, { color: paletteColors.XUAN_RI, fontFamily: fontFamilyName }]}>
              最新體重：{pet.weight}
            </Text>
            <Text style={[styles.statLine, { color: paletteColors.XUAN_RI, fontFamily: fontFamilyName }]}>
              最新身長：{pet.length}
            </Text>
            <Text style={[styles.statLine, { color: paletteColors.XUAN_RI, fontFamily: fontFamilyName }]}>
              下次提醒：{pet.nextReminder}
            </Text>
            <Text style={[styles.statLine, { color: paletteColors.XUAN_RI, fontFamily: fontFamilyName }]}>
              {'　　　　　'}{pet.reminderNote}
            </Text>
            <Text style={[styles.statLine, { color: paletteColors.XUAN_RI, fontFamily: fontFamilyName }]}>
              上次就診：{pet.lastVisit}
            </Text>
          </View>
        </View>

        {/* 功能按鈕列表 */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.menuButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => {
                if (item.id === 'reminder') {
                  router.push({ pathname: '/(tabs)/pets/reminder', params: { id } });
                } else if (item.id === 'medical') {
                  router.push({ pathname: '/(tabs)/pets/medical', params: { id } });
                }
                // TODO: 其他功能頁面導航
              }}
            >
              <Image
                source={item.icon}
                style={[styles.menuIcon, { tintColor: theme.primary }]}
                resizeMode="contain"
              />
              <Text style={[styles.menuLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
    paddingTop: 8,
  },

  // 主卡片
  mainCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // 照片
  photoWrapper: {
    width: '75%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
  },
  petPhoto: {
    width: '100%',
    height: '100%',
  },

  // 資訊區
  infoSection: {
    alignItems: 'center',
    gap: 4,
  },
  petName: {
    fontSize: getFontSize(24, 'medium'),
    fontWeight: '700',
    letterSpacing: 2,
  },
  petSpeciesAge: {
    fontSize: getFontSize(15, 'medium'),
    fontWeight: '500',
  },
  petTag: {
    fontSize: getFontSize(14, 'small'),
    fontWeight: '400',
    opacity: 0.8,
  },

  // 數值區
  statsSection: {
    width: '75%',
    alignSelf: 'center',
    gap: 4,
    paddingTop: 8,
  },
  statLine: {
    fontSize: getFontSize(14, 'medium'),
    lineHeight: 24,
  },

  // 功能按鈕
  menuSection: {
    width: '75%',
    alignSelf: 'center',
    marginTop: 20,
    gap: 10,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  menuIcon: {
    width: 24,
    height: 24,
  },
  menuLabel: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
    letterSpacing: 1,
  },
});
