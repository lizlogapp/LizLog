import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { useAuth } from '../../../src/contexts/AuthContext';
import { medicalService, MedicalDoc } from '../../../src/services/firestoreService';



export default function MedicalDetailScreen() {
  const router = useRouter();
  const { id, petId, ownerId, canEdit: canEditStr } = useLocalSearchParams<{
    id: string;
    petId?: string;
    ownerId?: string;
    canEdit?: string;
  }>();
  const canEdit = canEditStr !== 'false';
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { user } = useAuth();
  const [data, setData] = useState<(MedicalDoc & { id: string }) | null>(null);
  const [tagColor, setTagColor] = useState('#FF6B6B');
  const availableColors = ['#FF6B6B', '#FF9F43', '#FFD239', '#5CD85A', '#4DB8FF', '#B072FF', '#8E8E93'];

  useEffect(() => {
    if (!user || !id) return;
    medicalService.getById(ownerId || user.uid, id).then(doc => {
      if (doc) {
        setData(doc);
        setTagColor(doc.tagColor || '#FF6B6B');
      }
    });
  }, [user, id, ownerId]);

  useEffect(() => {
    if (data && user && canEdit && tagColor !== data.tagColor) {
      medicalService.update(ownerId || user.uid, id, { tagColor }).catch(() => {
        setTagColor(data.tagColor);
      });
      setData(prev => prev ? { ...prev, tagColor } : null);
    }
  }, [tagColor, data, user, id, ownerId, canEdit]);

  const handleTagClick = () => {
    if (!canEdit) return;
    const idx = availableColors.indexOf(tagColor);
    setTagColor(availableColors[(idx + 1) % availableColors.length]);
  };

  const renderRow = (label: string, content: React.ReactNode) => (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
        {label}
      </Text>
      <View style={styles.rowContent}>
        {typeof content === 'string' ? (
          <Text style={[styles.rowText, { color: theme.text, fontFamily: fontFamilyName }]}>
            {content}
          </Text>
        ) : (
          content
        )}
      </View>
    </View>
  );

  if (!data) {
    return (
      <BaseScreen
        scrollable={false}
        floatingAction={
          <FloatingActionBar
            actions={[{ id: 'back', onPress: () => router.navigate({ pathname: '/(tabs)/pets/medical', params: { id: petId || '1', ownerId, canEdit: canEdit.toString() } }) }]}
          />
        }
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.primary, fontFamily: fontFamilyName }}>載入中...</Text>
        </View>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => router.navigate({ pathname: '/(tabs)/pets/medical', params: { id: petId || '1', ownerId, canEdit: canEdit.toString() } }) },
          ]}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.mainCard, { backgroundColor: theme.background }]}>
          {/* Tag Ribbon */}
          <Pressable 
            style={[styles.tagRibbon, { backgroundColor: tagColor }]} 
            onPress={handleTagClick}
          />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
              {data.title}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.primary }]} />

          {/* Visit Section */}
          {data.visit && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>就診</Text>

              {renderRow('日期', data.visit.date)}
              {renderRow('地點', data.visit.hospital)}
              {renderRow('醫師', data.visit.doctor)}
              {renderRow('原因', data.visit.reason)}
              {renderRow('診斷', data.visit.diagnosis)}
              {data.visit.advice && data.visit.advice.length > 0 && renderRow('醫囑', (
                <View>
                  {data.visit.advice.map((item: string, index: number) => (
                    <Text key={index} style={[styles.rowText, { color: theme.text, fontFamily: fontFamilyName, marginBottom: 4 }]}>
                      {item}
                    </Text>
                  ))}
                </View>
              ))}

              {/* Images */}
              {data.visit.imageUrls && data.visit.imageUrls.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScrollContainer}>
                  {data.visit.imageUrls.map((imgUrl: string, idx: number) => (
                    <View key={idx} style={styles.imageContainer}>
                      <Image source={{ uri: imgUrl }} style={styles.attachedImage} resizeMode="cover" />
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {data.visit && data.medication && (
            <View style={[styles.divider, { backgroundColor: theme.primary }]} />
          )}

          {/* Medication Section */}
          {data.medication && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>用藥</Text>

              {renderRow('起始', data.medication.startDate)}
              {renderRow('結束', data.medication.endDate)}
              {renderRow('藥品', data.medication.medicine)}
              {renderRow('方式', data.medication.method)}
              {renderRow('頻率', data.medication.frequency)}
              {renderRow('劑量', data.medication.dosage)}
              {data.medication.note && data.medication.note.length > 0 && renderRow('備註', (
                <View>
                  {data.medication.note.map((item: string, index: number) => (
                    <Text key={index} style={[styles.rowText, { color: theme.text, fontFamily: fontFamilyName, marginBottom: 4 }]}>
                      {item}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Bottom Actions */}
          <View style={styles.actionSection}>
            {canEdit && <Pressable style={[styles.actionButton, { backgroundColor: theme.background }]} onPress={() => router.push({ pathname: '/(tabs)/pets/add-medical', params: { id, petId, ownerId } })}>
              <Image source={require('../../../assets/icons/icon-edit.png')} style={[styles.actionIcon, { tintColor: theme.primary }]} />
            </Pressable>}
            {canEdit && <Pressable style={[styles.actionButton, { backgroundColor: theme.background }]} onPress={() => setShowDeleteModal(true)}>
              <Image source={require('../../../assets/icons/icon-delete.png')} style={[styles.actionIcon, { tintColor: theme.primary }]} />
            </Pressable>}
          </View>
        </View>
      </ScrollView>

      {/* ========== 刪除確認 Modal ========== */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDeleteModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.background }]} onPress={e => e.stopPropagation()}>
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
                if (user && id) {
                  medicalService.delete(ownerId || user.uid, id).then(() => {
                    setShowDeleteModal(false);
                    router.navigate({ pathname: '/(tabs)/pets/medical', params: { id: petId || '1', ownerId, canEdit: canEdit.toString() } });
                  }).catch(() => {
                    Alert.alert('刪除失敗', '無法完整刪除醫療照片與紀錄，請確認網路後再試。');
                  });
                }
              }}>
                <Text style={[styles.modalButtonText, { color: theme.background, fontFamily: fontFamilyName }]}>
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
    backgroundColor: '#FFFEFA',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden', // Added to keep ribbon inside if needed, or don't use it to let it hang
  },
  tagRibbon: {
    position: 'absolute',
    top: 0,
    right: 16,
    width: 20,
    height: 44,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 10,
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
    backgroundColor: '#FFFEFA',
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
    backgroundColor: '#FFFEFA',
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
