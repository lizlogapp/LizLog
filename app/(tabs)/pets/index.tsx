import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { useAuth } from '../../../src/contexts/AuthContext';
import { petService, PetDoc } from '../../../src/services/firestoreService';
// @ts-ignore
import LogoIcon from '../../../assets/branding/logos/logo-icon.svg';

// 模擬寵物資料（未來從 Supabase 取得）
interface PetData {
  id: string;
  name: string;
  species: string;
  birthDate: Date;
  imageUri: any | null; // null 表示無照片，顯示預設 logo
}

const mockPets: PetData[] = [
  {
    id: '1',
    name: 'DELETE',
    species: '鬆獅蜥',
    birthDate: new Date('2022-07-01'),
    imageUri: require('../../../assets/user-uploads/lizard-001.jpg'),
  },
  {
    id: '2',
    name: 'CTRL',
    species: '鬆獅蜥',
    birthDate: new Date('2024-12-01'),
    imageUri: require('../../../assets/user-uploads/lizard-003.jpg'),
  },
  {
    id: '3',
    name: 'ENTER',
    species: '鬆獅蜥',
    birthDate: new Date('2024-02-01'),
    imageUri: require('../../../assets/user-uploads/lizard-005.jpg'),
  },
  {
    id: '4',
    name: 'ALT',
    species: '鬆獅蜥',
    birthDate: new Date('2023-10-01'),
    imageUri: require('../../../assets/user-uploads/lizard-007.jpg'),
  },
];

/**
 * 計算年齡，回傳格式：「2歲 10個月」或「5個月」
 */
function calcAge(birthDate: Date): string {
  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years > 0 && months > 0) return `${years}歲 ${months}個月`;
  if (years > 0) return `${years}歲`;
  return `${months}個月`;
}

export default function PetsScreen() {
  const router = useRouter();
  const { themeId, fontFamilyName, isDemoMode } = useTheme();
  const theme = getThemeTokens(themeId);
  const { user } = useAuth();

  // Firestore 即時寵物列表
  const [firestorePets, setFirestorePets] = useState<(PetDoc & { id: string })[]>([]);

  useEffect(() => {
    if (isDemoMode || !user) return;
    const unsubscribe = petService.onPetsChanged(user.uid, (pets) => {
      setFirestorePets(pets);
    });
    return () => unsubscribe();
  }, [isDemoMode, user]);

  // 將 Firestore 資料轉換為畫面所需格式
  const firestorePetData: PetData[] = firestorePets.map(p => ({
    id: p.id,
    name: p.name,
    species: p.species,
    birthDate: new Date(p.birthDate.replace(/\//g, '-')),
    imageUri: p.imageUrl ? { uri: p.imageUrl } : null,
  }));

  const petsToShow = isDemoMode ? mockPets : firestorePetData;

  return (
    <BaseScreen scrollable={false}>

      {/* 寵物列表 */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {petsToShow.map((pet) => (
          <Pressable
            key={pet.id}
            style={({ pressed }) => [
              styles.petCard,
              { backgroundColor: theme.background },
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => {
              router.push({ pathname: '/(tabs)/pets/view', params: { id: pet.id } });
            }}
          >
            {/* 左側拖曳圖示 */}
            <View style={styles.dragHandle}>
              <Image 
                source={require('../../../assets/icons/icon-drag.png')} 
                style={{ width: 20, height: 20, tintColor: theme.primary }} 
                resizeMode="contain"
              />
            </View>

            {/* 寵物圖片 */}
            <View style={styles.petImageWrapper}>
              {pet.imageUri ? (
                <Image
                  source={pet.imageUri}
                  style={styles.petImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.petImagePlaceholder}>
                  <LogoIcon width={40} height={40} />
                </View>
              )}
            </View>

            {/* 寵物資訊 */}
            <View style={styles.petInfo}>
              <Text style={[styles.petName, { color: theme.primary, fontFamily: fontFamilyName }]}>
                {pet.name}
              </Text>
              <Text style={[styles.petDetail, { color: theme.primary, fontFamily: fontFamilyName }]}>
                {pet.species}　{calcAge(pet.birthDate)}
              </Text>
            </View>

            {/* 右側箭頭 */}
            <Text style={[styles.arrow, { color: theme.primary }]}>›</Text>
          </Pressable>
        ))}

        {/* 新增寵物按鈕 */}
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: theme.background },
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => router.push('/(tabs)/pets/add')}
        >
          <Text style={[styles.addButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
            新增寵物　＋
          </Text>
        </Pressable>
      </ScrollView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: 12,
    paddingTop: 8,
    paddingBottom: 32,
  },
  petCard: {
    width: '96%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  dragHandle: {
    padding: 4,
  },
  petImageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: paletteColors.CHEN_XI,
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  petImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paletteColors.CHEN_XI,
  },
  petInfo: {
    flex: 1,
    gap: 4,
  },
  petName: {
    fontSize: getFontSize(18, 'medium'),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  petDetail: {
    fontSize: getFontSize(13, 'small'),
    opacity: 0.8,
  },
  arrow: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
    opacity: 0.6,
  },
  addButton: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  addButtonText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
    letterSpacing: 1,
  },
});
