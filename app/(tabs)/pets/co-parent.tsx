import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Image,
} from 'react-native';
import Svg, { Path, Defs, Filter, FeDropShadow } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { paletteColors } from '../../../src/theme/themeColorSettings';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';

const mockPets: Record<string, string> = {
  '1': 'DELETE',
  '2': 'CTRL',
  '3': 'ENTER',
  '4': 'ALT',
};

// 模擬當前登入使用者
const CURRENT_USER_ID = 'ya_lady';

// 模擬每個寵物的飼育名單庫 (鴉小姐是 DELETE/CTRL 的主人，是 ENTER/ALT 的共同飼育者)
const initialMockData: Record<string, any[]> = {
  '1': [ // DELETE
    { id: 'ya_lady', name: '鴉小姐', isMainOwner: true },
    { id: 'duck_lady', name: '鴨小姐', isMainOwner: false },
  ],
  '2': [ // CTRL
    { id: 'ya_lady', name: '鴉小姐', isMainOwner: true },
    { id: 'magpie_sir', name: '鵲先生', isMainOwner: false },
    { id: 'goose_lady', name: '鵝小姐', isMainOwner: false },
  ],
  '3': [ // ENTER
    { id: 'goose_lady', name: '鵝小姐', isMainOwner: true },
    { id: 'ya_lady', name: '鴉小姐', isMainOwner: false },
  ],
  '4': [ // ALT
    { id: 'magpie_sir', name: '鵲先生', isMainOwner: true },
    { id: 'ya_lady', name: '鴉小姐', isMainOwner: false },
  ]
};

export default function CoParentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);

  const currentPetId = id || '1';
  const currentPetName = mockPets[currentPetId] || 'DELETE';

  const [members, setMembers] = useState(initialMockData[currentPetId] || []);

  const currentUserRole = members.find(m => m.id === CURRENT_USER_ID);
  const amIMainOwner = currentUserRole?.isMainOwner;

  // 邀請成員彈窗 (顯示 QR / URL)
  const [showInviteModal, setShowInviteModal] = useState(false);

  // 刪除成員彈窗
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  // 退出飼育彈窗
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const confirmDelete = () => {
    if (memberToDelete) {
      setMembers(prev => prev.filter(m => m.id !== memberToDelete));
      setMemberToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const confirmLeave = () => {
    setMembers(prev => prev.filter(m => m.id !== CURRENT_USER_ID));
    setShowLeaveModal(false);
    // 實務上可能會導回首頁或寵物列表
    router.replace('/');
  };

  const renderCard = (member: typeof members[0]) => {
    const isMe = member.id === CURRENT_USER_ID;
    
    let actionButton = null;

    if (isMe && amIMainOwner) {
      // 我是主飼主，在我的卡片顯示新增 (+)
      actionButton = (
        <Pressable 
          style={[styles.actionButton, { backgroundColor: paletteColors.MU_CHENG }]} 
          onPress={() => setShowInviteModal(true)}
        >
          <Text style={styles.addIconText}>+</Text>
        </Pressable>
      );
    } else if (isMe && !amIMainOwner) {
      // 我是共同飼育者，在我的卡片顯示退出按鈕
      actionButton = (
        <Pressable 
          style={[styles.actionButton, { backgroundColor: '#FFFEFA' }]} 
          onPress={() => setShowLeaveModal(true)}
        >
          <Image source={require('../../../assets/icons/icon-delete.png')} style={[styles.deleteIcon, { tintColor: paletteColors.XUAN_RI }]} />
        </Pressable>
      );
    } else if (!isMe && amIMainOwner) {
      // 我是主飼主，看別人的卡片可以刪除
      actionButton = (
        <Pressable 
          style={[styles.actionButton, { backgroundColor: paletteColors.MU_CHENG }]} 
          onPress={() => {
            setMemberToDelete(member.id);
            setShowDeleteModal(true);
          }}
        >
          <Image source={require('../../../assets/icons/icon-delete.png')} style={[styles.deleteIcon, { tintColor: '#FFFEFA' }]} />
        </Pressable>
      );
    }
    // 如果 (!isMe && !amIMainOwner) -> 我是共同飼育，看別人的卡片 -> 不顯示任何按鈕

    return (
      <View key={member.id} style={styles.cardContainer}>
        {/* SVG 形狀背景 (包含精確設定的 drop shadow) */}
        <Svg width="100%" height="100%" viewBox="0 0 358 208" style={StyleSheet.absoluteFill}>
          <Defs>
            <Filter id={`card-shadow-${member.id}`} x="-20" y="-20" width="400" height="250">
              <FeDropShadow dx="0" dy="4" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
            </Filter>
          </Defs>
          <Path d="M339 0C347.284 0 354 6.71573 354 15V85C354 93.2843 347.284 100 339 100H269C260.716 100 254 106.716 254 115V185C254 185.129 253.998 185.258 253.995 185.387C253.79 193.492 247.155 200 239 200H19C10.7157 200 4 193.284 4 185V15C4 6.71573 10.7157 0 19 0H339Z" fill="#FFFEFA" filter={`url(#card-shadow-${member.id})`} />
        </Svg>

        {/* 卡片文字區 */}
        <View style={styles.cardTextContent}>
          <Text style={[styles.cardName, { color: paletteColors.MU_CHENG, fontFamily: fontFamilyName }]}>
            {member.name}
          </Text>
          <Text style={[styles.cardRole, { color: paletteColors.MU_CHENG, fontFamily: fontFamilyName }]}>
            {member.isMainOwner ? `${currentPetName}的主人` : `共同照顧 ${currentPetName}`}
          </Text>
        </View>

        {/* 懸浮按鈕 */}
        {actionButton}
      </View>
    );
  };

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => router.navigate({ pathname: '/(tabs)/pets/view', params: { id } }) },
          ]}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.listContainer}>
          {members.map(member => renderCard(member))}
        </View>
      </ScrollView>

      {/* ========== 邀請成員 Modal (URL/QRCode) ========== */}
      <Modal visible={showInviteModal} transparent animationType="fade" onRequestClose={() => setShowInviteModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowInviteModal(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
              邀請共同飼育人
            </Text>
            <Text style={[styles.modalSubtitle, { color: paletteColors.XUAN_RI + '80', fontFamily: fontFamilyName }]}>
              邀請親友一起照顧 {currentPetName}！請分享以下連結或讓對方掃描條碼加入。
            </Text>
            
            <View style={styles.qrCodePlaceholder}>
              <Text style={[styles.qrCodeText, { color: paletteColors.XUAN_RI + '50', fontFamily: fontFamilyName }]}>
                [ QR Code 佔位圖 ]
              </Text>
            </View>

            <View style={styles.urlBox}>
              <Text style={[styles.urlText, { color: theme.primary, fontFamily: fontFamilyName }]} numberOfLines={1}>
                https://lizard.app/invite/abc123xyz
              </Text>
            </View>

            <View style={styles.modalButtonRow}>
              <Pressable style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.primary }]} onPress={() => setShowInviteModal(false)}>
                <Text style={[styles.modalButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  關閉
                </Text>
              </Pressable>
              <Pressable style={[styles.modalButton, { backgroundColor: theme.primary }]} onPress={() => setShowInviteModal(false)}>
                <Text style={[styles.modalButtonText, { color: '#FFFFFF', fontFamily: fontFamilyName }]}>
                  複製連結
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ========== 刪除成員確認 Modal ========== */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDeleteModal(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
              確定要移除此成員嗎？
            </Text>
            <Text style={[styles.modalSubtitle, { color: paletteColors.XUAN_RI + '80', fontFamily: fontFamilyName }]}>
              移除後，該成員將無法再查看或編輯此寵物的紀錄。
            </Text>

            <View style={styles.modalButtonRow}>
              <Pressable style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.primary }]} onPress={() => setShowDeleteModal(false)}>
                <Text style={[styles.modalButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  取消
                </Text>
              </Pressable>
              <Pressable style={[styles.modalButton, { backgroundColor: '#FF6B6B' }]} onPress={confirmDelete}>
                <Text style={[styles.modalButtonText, { color: '#FFFFFF', fontFamily: fontFamilyName }]}>
                  移除
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ========== 退出飼育確認 Modal ========== */}
      <Modal visible={showLeaveModal} transparent animationType="fade" onRequestClose={() => setShowLeaveModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLeaveModal(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>
              確定要退出共同飼育嗎？
            </Text>
            <Text style={[styles.modalSubtitle, { color: paletteColors.XUAN_RI + '80', fontFamily: fontFamilyName }]}>
              退出後，您將無法再查看或編輯 {currentPetName} 的紀錄。
            </Text>

            <View style={styles.modalButtonRow}>
              <Pressable style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.primary }]} onPress={() => setShowLeaveModal(false)}>
                <Text style={[styles.modalButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  取消
                </Text>
              </Pressable>
              <Pressable style={[styles.modalButton, { backgroundColor: '#FF6B6B' }]} onPress={confirmLeave}>
                <Text style={[styles.modalButtonText, { color: '#FFFFFF', fontFamily: fontFamilyName }]}>
                  退出
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
    alignItems: 'center',
  },
  listContainer: {
    width: '92%',
    gap: 24,
    marginTop: 16,
  },
  
  // Card styles mimicking the exact SVG cutout reference image
  cardContainer: {
    width: '100%',
    aspectRatio: 358 / 208,
  },
  cardTextContent: {
    position: 'absolute',
    top: '18%',
    left: '8%',
    height: '64%',
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: getFontSize(28, 'large'),
    fontWeight: '400',
  },
  cardRole: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '300',
    marginTop: 'auto',
  },
  actionButton: {
    position: 'absolute',
    right: '1%',
    bottom: '4%',
    width: '25%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  addIconText: {
    color: '#FFFEFA',
    fontSize: 48,
    fontWeight: '200',
    lineHeight: 52,
  },
  deleteIcon: {
    width: 32,
    height: 32,
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
    width: 320,
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
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: getFontSize(14, 'medium'),
    fontWeight: '300',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  qrCodePlaceholder: {
    width: 160,
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  qrCodeText: {
    fontSize: getFontSize(14, 'medium'),
  },
  urlBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  urlText: {
    fontSize: getFontSize(14, 'medium'),
    fontWeight: '300',
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
