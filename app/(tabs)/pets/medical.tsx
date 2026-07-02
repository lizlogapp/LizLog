import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import LizardIllustration from '../../../assets/illustrations/lizard-6.svg';
import { mockMedicalDB } from './mockMedicalDB';

export default function MedicalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);

  const [records, setRecords] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      // 轉換 DB 物件為陣列供列表顯示
      const dataArray = Object.values(mockMedicalDB);
      setRecords(dataArray);
    }, [])
  );

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => router.navigate({ pathname: '/(tabs)/pets/view', params: { id } }) },
            { id: 'add', onPress: () => router.push('/(tabs)/pets/add-medical') },
          ]}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {records.length === 0 ? (
          /* 空狀態 */
          <View style={[styles.emptyCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.emptyTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
              尚無醫護紀錄
            </Text>
            <View style={styles.illustrationWrapper}>
              <LizardIllustration width={220} height={220} />
            </View>
          </View>
        ) : (
          /* 有資料時的列表 */
          <View style={styles.listContainer}>
            {records.map(record => (
              <Pressable
                key={record.id}
                style={[styles.recordCard, { backgroundColor: theme.background }]}
                onPress={() => router.push({ pathname: '/(tabs)/pets/medical-detail', params: { id: record.id, petId: id } })}
              >
                {/* 左側動態顏色裝飾條 */}
                <View style={[styles.cardSideBar, { backgroundColor: record.tagColor }]} />

                <View style={styles.cardContent}>
                  {/* 標題 */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
                      {record.title}
                    </Text>
                  </View>

                  {/* 日期與醫院 */}
                  <View style={styles.cardSubHeaderRow}>
                    <Text style={[styles.cardDate, { color: theme.primary, fontFamily: fontFamilyName }]}>
                      {record.date}
                    </Text>
                    <Text style={[styles.cardHospital, { color: theme.text, fontFamily: fontFamilyName }]}>
                      {record.hospital}
                    </Text>
                  </View>

                  {/* 備註 */}
                  <View style={styles.cardDetailRow}>
                    <Text style={[styles.cardNote, { color: theme.text, fontFamily: fontFamilyName, opacity: 0.9 }]} numberOfLines={2}>
                      {record.note}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 120,
  },
  emptyCard: {
    backgroundColor: '#FFFEFA',
    borderRadius: 20,
    width: '90%',
    alignSelf: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: getFontSize(20, 'medium'),
    fontWeight: '600',
    letterSpacing: 2,
    opacity: 0.6,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    width: '96%',
    alignSelf: 'center',
    gap: 16,
  },
  recordCard: {
    backgroundColor: '#FFFEFA',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    paddingRight: 16,
    paddingVertical: 16,
  },
  cardSideBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 16,
  },
  cardContent: {
    flex: 1,
    paddingLeft: 32,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: getFontSize(20, 'large'),
    fontWeight: '300',
  },
  cardSubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 8,
  },
  cardDate: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '300',
  },
  cardHospital: {
    fontSize: getFontSize(14, 'medium'),
    fontWeight: '300',
  },
  cardDetailRow: {
    marginBottom: 0,
  },
  cardNote: {
    fontSize: getFontSize(14, 'medium'),
    fontWeight: '300',
    lineHeight: 20,
  },
});
