import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';

// 模擬詳細資料
const mockDetails: Record<string, any> = {
  '1': {
    id: '1',
    title: '皮膚問題就診及用藥',
    visit: {
      date: '2025年5月4日 SUN',
      hospital: '侏羅紀野生動物專科醫院',
      doctor: '朱哲助 院長',
      reason: '最近發現 Delete 的下巴和前肢連接處，出現小範圍的皮屑和泛紅，且有輕微抓癢的行為。食慾和活動力正常，但為求謹慎就診檢查。',
      diagnosis: '經過皮膚鏡檢後，初步判斷為輕微的黴菌感染，可能是由於近期梅雨季節，環境濕度偏高所引起。狀況不嚴重，透過外用藥物治療即可。',
      advice: [
        '1. 每日使用開立的藥膏，早晚各一次，薄擦於患部，持續一週。',
        '2. 保持飼養箱環境絕對乾燥、通風，建議增加除濕機使用頻率。',
        '3. 暫停泡澡，避免患部擴散。',
        '4. 密切觀察皮膚範圍是否有擴大或顏色加深的狀況。',
        '5. 預約 10 天後回診，追蹤復原狀況。'
      ],
      images: [require('../../../assets/user-uploads/lizard-007.jpg')],
    },
    medication: {
      startDate: '2025年5月4日',
      endDate: '2025年5月11日',
      medicine: '黴菌靈外用藥膏',
      method: '外部塗抹',
      frequency: '每日 2 次',
      dosage: '取約一顆米粒大小，薄擦於患部皮膚。',
      note: [
        '1. 塗抹後 15 分鐘內，盡量避免寵物舔舐患部。',
        '2. 請存放於陰涼乾燥處，避免陽光直射。',
        '3. 此為外用藥，切勿口服。'
      ]
    }
  },
  '2': {
    id: '2',
    title: '年度健康檢查',
    visit: {
      date: '2024年10月1日 TUE',
      hospital: '侏羅紀野生動物專科醫院',
      doctor: '朱哲助 院長',
      reason: '例行性年度健康檢查。',
      diagnosis: 'X光檢查骨骼發育正常，血檢數值皆在標準範圍內。整體健康狀況良好。',
      advice: [
        '1. 繼續保持目前的飲食與光照計畫。',
        '2. 注意冬季保溫。'
      ],
      images: [],
    },
    medication: {
      startDate: '',
      endDate: '',
      medicine: '無',
      method: '-',
      frequency: '-',
      dosage: '-',
      note: []
    }
  }
};

export default function MedicalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // In real app, fetch based on id.
  const data = mockDetails[id || '1'] || mockDetails['1'];

  const renderRow = (label: string, content: React.ReactNode) => (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
        {label}
      </Text>
      <View style={styles.rowContent}>
        {typeof content === 'string' ? (
          <Text style={[styles.rowText, { color: paletteColors.XUAN_RI, fontFamily: fontFamilyName }]}>
            {content}
          </Text>
        ) : (
          content
        )}
      </View>
    </View>
  );

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
        <View style={styles.mainCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
              {data.title}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.primary }]} />

          {/* Visit Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>就診</Text>

            {renderRow('日期', data.visit.date)}
            {renderRow('地點', data.visit.hospital)}
            {renderRow('醫師', data.visit.doctor)}
            {renderRow('原因', data.visit.reason)}
            {renderRow('診斷', data.visit.diagnosis)}
            {renderRow('醫囑', (
              <View>
                {data.visit.advice.map((item, index) => (
                  <Text key={index} style={[styles.rowText, { color: paletteColors.XUAN_RI, fontFamily: fontFamilyName, marginBottom: 4 }]}>
                    {item}
                  </Text>
                ))}
              </View>
            ))}

            {/* Images */}
            {data.visit.images && data.visit.images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScrollContainer}>
                {data.visit.images.map((img: any, idx: number) => (
                  <View key={idx} style={styles.imageContainer}>
                    <Image source={img} style={styles.attachedImage} resizeMode="cover" />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.primary }]} />

          {/* Medication Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>用藥</Text>

            {renderRow('起始', data.medication.startDate)}
            {renderRow('結束', data.medication.endDate)}
            {renderRow('藥品', data.medication.medicine)}
            {renderRow('方式', data.medication.method)}
            {renderRow('頻率', data.medication.frequency)}
            {renderRow('劑量', data.medication.dosage)}
            {renderRow('備註', (
              <View>
                {data.medication.note.map((item, index) => (
                  <Text key={index} style={[styles.rowText, { color: paletteColors.XUAN_RI, fontFamily: fontFamilyName, marginBottom: 4 }]}>
                    {item}
                  </Text>
                ))}
              </View>
            ))}
          </View>

          {/* Bottom Actions */}
          <View style={styles.actionSection}>
            <Pressable style={styles.actionButton} onPress={() => router.push({ pathname: '/(tabs)/pets/add-medical', params: { id: id || '1' } })}>
              <Image source={require('../../../assets/icons/icon-edit.png')} style={[styles.actionIcon, { tintColor: theme.primary }]} />
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => setShowDeleteModal(true)}>
              <Image source={require('../../../assets/icons/icon-delete.png')} style={[styles.actionIcon, { tintColor: theme.primary }]} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* ========== 刪除確認 Modal ========== */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDeleteModal(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
              確定要刪除嗎？
            </Text>
            
            <View style={styles.modalButtonRow}>
              <Pressable style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.primary }]} onPress={() => setShowDeleteModal(false)}>
                <Text style={[styles.modalButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  取消
                </Text>
              </Pressable>
              
              <Pressable style={[styles.modalButton, { backgroundColor: theme.primary }]} onPress={() => {
                // TODO: 執行刪除邏輯
                setShowDeleteModal(false);
                router.back();
              }}>
                <Text style={[styles.modalButtonText, { color: '#FFFFFF', fontFamily: fontFamilyName }]}>
                  確認
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
    paddingTop: 16,
  },
  mainCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: getFontSize(22, 'large'),
    fontWeight: '300',
  },
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.3,
    marginVertical: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: getFontSize(18, 'medium'),
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  rowLabel: {
    width: 48,
    fontSize: getFontSize(15, 'medium'),
    fontWeight: '300',
    marginRight: 12,
    marginTop: 2,
  },
  rowContent: {
    flex: 1,
  },
  rowText: {
    fontSize: getFontSize(15, 'medium'),
    fontWeight: '300',
    lineHeight: 22,
  },
  imageScrollContainer: {
    marginTop: 16,
    gap: 12,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 8,
  },
  attachedImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 24,
  },
  actionButton: {
    width: 48,
    height: 48,
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    backgroundColor: paletteColors.RI_CHU,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: getFontSize(22, 'large'),
    fontWeight: '300',
    marginBottom: 32,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  modalButtonText: {
    fontSize: getFontSize(18, 'medium'),
    fontWeight: '300',
  },
});
