import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar, FloatingActionItem } from '../../../src/components/FloatingActionBar';
import { useAuth } from '../../../src/contexts/AuthContext';
import { petService, PetDoc } from '../../../src/services/firestoreService';

function calcAge(birthDateStr: string): string {
  const birthDate = new Date(birthDateStr.replace(/\//g, '-'));
  if (isNaN(birthDate.getTime())) return '未知年紀';

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
  const { id, ownerId } = useLocalSearchParams<{ id: string, ownerId?: string }>();
  const { themeId, fontFamilyName, isDemoMode } = useTheme();
  const theme = getThemeTokens(themeId);
  const { user } = useAuth();

  // Firestore 寵物資料
  const [firestorePet, setFirestorePet] = useState<(PetDoc & { id: string }) | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    const resolvedOwnerId = ownerId || user.uid;
    petService.getById(resolvedOwnerId, id).then(setFirestorePet);
  }, [user, id, ownerId]);

  const canEdit = React.useMemo(() => {
    if (!user || !firestorePet) return false;
    const myRole = firestorePet.coParents?.find(cp => cp.uid === user.uid);
    return !!myRole && (myRole.isMainOwner || myRole.permission !== 'view');
  }, [user, firestorePet]);

  // 將 Firestore 資料轉換為頁面所需格式
  const pet = firestorePet ? {
    id: firestorePet.id,
    name: firestorePet.name,
    species: firestorePet.species,
    birthDate: firestorePet.birthDate,
    homeDate: firestorePet.homeDate,
    gender: firestorePet.gender,
    tag: firestorePet.tag || '',
    imageUri: firestorePet.imageUrl ? { uri: firestorePet.imageUrl } : require('../../../assets/illustrations/illustration-lizard-01.png'),
    weight: firestorePet.weight || '-',
    length: firestorePet.length || '-',
    nextReminder: firestorePet.nextReminder || '無',
    reminderNote: firestorePet.reminderNote || '',
    lastVisit: firestorePet.lastVisit || '',
    ownerId: firestorePet.ownerId || (user ? user.uid : ''),
  } : null;

  // 刪除確認狀態
  const [showDeleteScreen, setShowDeleteScreen] = useState(false);
  const [deleteInputName, setDeleteInputName] = useState('');
  const [showDeletedConfirm, setShowDeletedConfirm] = useState(false);
  const [deletedPetName, setDeletedPetName] = useState('');

  const isDeleteNameMatch = pet
    ? deleteInputName.trim().toLowerCase() === pet.name.toLowerCase()
    : false;

  const handleDeleteFinal = () => {
    if (!pet) return;
    setDeletedPetName(pet.name);
    setShowDeleteScreen(false);
    setShowDeletedConfirm(true);
    // 注意：此時先不刪除資料，等使用者關閉確認視窗後再刪除
  };

  const handleDeletedClose = () => {
    if (user && id) {
      petService.delete(user.uid, id);
    }
    setShowDeletedConfirm(false);
    router.replace('/(tabs)/pets');
  };

  // 如果 pet 不存在或已被刪除且正在顯示確認視窗
  if (!pet) {
    // 預覽數秒後自動跳轉
    React.useEffect(() => {
      if (!showDeletedConfirm) {
        const timer = setTimeout(() => {
          router.replace('/(tabs)/pets');
        }, 2000);
        return () => clearTimeout(timer);
      }
    }, [showDeletedConfirm]);

    return (
      <BaseScreen 
        scrollable={false}
        floatingAction={
          <FloatingActionBar actions={[{ id: 'back', onPress: () => router.navigate('/(tabs)/pets') }]} />
        }
      >
        {showDeletedConfirm ? (
          <Modal visible={showDeletedConfirm} transparent animationType="fade" onRequestClose={() => {}}>
            <View style={styles.modalOverlay}>
              <View style={styles.deletedCard}>
                <Text style={[styles.deletedTitle, { fontFamily: fontFamilyName }]}>
                  {deletedPetName} 已被刪除
                </Text>
                <Pressable style={styles.deletedCloseButton} onPress={handleDeletedClose}>
                  <Text style={[styles.deletedCloseText, { fontFamily: fontFamilyName }]}>
                    關閉
                  </Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: theme.primary + '60', fontFamily: fontFamilyName, fontSize: getFontSize(20, 'medium'), marginBottom: 8 }}>
              找不到寵物資料
            </Text>
          </View>
        )}
      </BaseScreen>
    );
  }

  // FloatingActionBar 動態切換
  const floatingActions: FloatingActionItem[] = showDeleteScreen
    ? [{ id: 'back' as const, onPress: () => setShowDeleteScreen(false) }]
    : [{ id: 'back' as const, onPress: () => router.navigate('/(tabs)/pets') }];

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar actions={floatingActions} />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 主卡片 */}
        <View style={[styles.mainCard, { backgroundColor: theme.background }]}>
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
            <Text style={[styles.statLine, { color: theme.primary, fontFamily: fontFamilyName }]}>
              最新體重：{pet.weight}
            </Text>
            <Text style={[styles.statLine, { color: theme.primary, fontFamily: fontFamilyName }]}>
              最新身長：{pet.length}
            </Text>
            <Text style={[styles.statLine, { color: theme.primary, fontFamily: fontFamilyName }]}>
              下次提醒：{pet.nextReminder}
            </Text>
            <Text style={[styles.statLine, { color: theme.primary, fontFamily: fontFamilyName }]}>
              {'　　　　　'}{pet.reminderNote}
            </Text>
            <Text style={[styles.statLine, { color: theme.primary, fontFamily: fontFamilyName }]}>
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
                { backgroundColor: theme.background },
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => {
                if (item.id === 'reminder') {
                  router.push({ pathname: '/(tabs)/pets/reminder', params: { id, ownerId: pet?.ownerId, canEdit: canEdit.toString() } });
                } else if (item.id === 'medical') {
                  router.push({ pathname: '/(tabs)/pets/medical', params: { id, ownerId: pet?.ownerId, canEdit: canEdit.toString() } });
                } else if (item.id === 'coparent') {
                  router.push({ pathname: '/(tabs)/pets/co-parent', params: { id, ownerId: pet?.ownerId } });
                } else if (item.id === 'edit') {
                  if (!canEdit) return;
                  router.push({ pathname: '/(tabs)/pets/add', params: { id, ownerId: pet?.ownerId } });
                } else if (item.id === 'delete') {
                  if (!canEdit) return;
                  setDeleteInputName('');
                  setShowDeleteScreen(true);
                }
              }}
              disabled={!canEdit && (item.id === 'edit' || item.id === 'delete')}
            >
              <Image
                source={item.icon}
                style={[styles.menuIcon, { tintColor: (!canEdit && (item.id === 'edit' || item.id === 'delete')) ? theme.primary + '50' : theme.primary }]}
                resizeMode="contain"
              />
              <Text style={[styles.menuLabel, { color: (!canEdit && (item.id === 'edit' || item.id === 'delete')) ? theme.primary + '50' : theme.primary, fontFamily: fontFamilyName }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* ========== 全頁橙色刪除確認畫面 ========== */}
      {showDeleteScreen && (
        <View style={styles.deleteOverlay}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.deleteScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* 垃圾桶圖示 */}
            <Image
              source={require('../../../assets/icons/icon-delete.png')}
              style={styles.deleteIcon}
              resizeMode="contain"
            />

            {/* 標題 */}
            <Text style={[styles.deleteTitle, { fontFamily: fontFamilyName }]} numberOfLines={1} adjustsFontSizeToFit>
              您確定要刪除 {pet.name} 嗎？
            </Text>

            {/* 警告列表 */}
            <View style={styles.warningList}>
              <View style={styles.warningItem}>
                <Text style={[styles.warningBullet, { fontFamily: fontFamilyName }]}>！</Text>
                <Text style={[styles.warningText, { fontFamily: fontFamilyName }]}>
                  這是一個無法復原的動作。
                </Text>
              </View>
              <View style={styles.warningItem}>
                <Text style={[styles.warningBullet, { fontFamily: fontFamilyName }]}>！</Text>
                <Text style={[styles.warningText, { fontFamily: fontFamilyName }]}>
                  所有關於 {pet.name} 的資料將會被永久刪除。
                </Text>
              </View>
              <View style={styles.warningItem}>
                <Text style={[styles.warningBullet, { fontFamily: fontFamilyName }]}>！</Text>
                <Text style={[styles.warningText, { fontFamily: fontFamilyName }]}>
                  主要飼育者刪除寵物資料，所有被邀請的共同飼育，也將同時失去對這份資料的存取權限。
                </Text>
              </View>
            </View>

            {/* 輸入確認 */}
            <Text style={[styles.deleteInputLabel, { fontFamily: fontFamilyName }]}>
              請輸入寵物的名字以進行確認
            </Text>
            <TextInput
              style={[styles.deleteInput, { fontFamily: fontFamilyName }]}
              placeholder={`請在此輸入 '${pet.name}'`}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={deleteInputName}
              onChangeText={setDeleteInputName}
              autoCapitalize="none"
            />

            {/* 確認刪除按鈕 */}
            <Pressable
              style={[styles.deleteConfirmButton, !isDeleteNameMatch && styles.deleteConfirmButtonDisabled]}
              onPress={() => {
                if (isDeleteNameMatch) handleDeleteFinal();
              }}
            >
              <Text style={[styles.deleteConfirmText, { fontFamily: fontFamilyName }]}>
                確認刪除
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* ========== 刪除成功確認 Modal ========== */}
      <Modal visible={showDeletedConfirm} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.deletedCard}>
            <Text style={[styles.deletedTitle, { fontFamily: fontFamilyName }]}>
              {deletedPetName} 已被刪除
            </Text>
            <Pressable
              style={styles.deletedCloseButton}
              onPress={handleDeletedClose}
            >
              <Text style={[styles.deletedCloseText, { fontFamily: fontFamilyName }]}>
                關閉
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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

  // 全頁橙色刪除確認畫面
  deleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: paletteColors.MU_CHENG,
    zIndex: 10,
  },
  deleteScrollContent: {
    paddingTop: 48,
    paddingBottom: 140,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  deleteIcon: {
    width: 56,
    height: 56,
    tintColor: '#FFFFFF',
    marginBottom: 20,
  },
  deleteTitle: {
    fontSize: getFontSize(18, 'large'),
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
  },
  warningList: {
    width: '100%',
    gap: 20,
    marginBottom: 32,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  warningBullet: {
    fontSize: getFontSize(14, 'medium'),
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  warningText: {
    flex: 1,
    fontSize: getFontSize(14, 'medium'),
    fontWeight: '300',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  deleteInputLabel: {
    fontSize: getFontSize(13, 'small'),
    fontWeight: '300',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 10,
  },
  deleteInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: getFontSize(14, 'medium'),
    color: '#FFFFFF',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  deleteConfirmButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  deleteConfirmButtonDisabled: {
    opacity: 0.35,
  },
  deleteConfirmText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '400',
    color: paletteColors.MU_CHENG,
  },

  // 刪除成功確認 Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletedCard: {
    width: '85%',
    backgroundColor: paletteColors.MU_CHENG,
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  deletedTitle: {
    fontSize: getFontSize(15, 'medium'),
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  deletedCloseButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  deletedCloseText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '400',
    color: paletteColors.MU_CHENG,
  },
});
