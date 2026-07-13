import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { BaseScreen } from '../src/components/common/BaseScreen';
import { useTheme } from '../src/theme/ThemeContext';
import { getThemeTokens } from '../src/theme/themeSettings';
import { getFontSize } from '../src/theme/typographySettings';
import { useAuth } from '../src/contexts/AuthContext';
import { petService, PetDoc } from '../src/services/firestoreService';
import { sensorService } from '../src/services/sensorService';

export default function IotManagementScreen() {
  const router = useRouter();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);
  const { user } = useAuth();

  const [pets, setPets] = useState<(PetDoc & { id: string })[]>([]);
  const [showBindModal, setShowBindModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState<(PetDoc & { id: string }) | null>(null);
  const [sensorInput, setSensorInput] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsubscribe = petService.onPetsChanged(user.uid, (data) => {
      setPets(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleBind = async () => {
    if (!user || !selectedPet) return;
    if (!sensorInput.trim()) {
      Alert.alert('錯誤', '請輸入感測器 ID');
      return;
    }
    try {
      await sensorService.bindSensor(user.uid, selectedPet.id, sensorInput.trim());
      setShowBindModal(false);
      setSensorInput('');
    } catch (error) {
      Alert.alert('錯誤', '綁定失敗，請重試');
    }
  };

  const handleShare = async (targetPetId: string) => {
    if (!user || !selectedPet) return;
    try {
      await sensorService.shareSensor(user.uid, selectedPet.id, targetPetId);
      setShowShareModal(false);
    } catch (error) {
      Alert.alert('錯誤', '設定共用失敗，請重試');
    }
  };

  const handleUnbind = (pet: PetDoc & { id: string }) => {
    if (!user) return;
    Alert.alert('確認解除', `確定要解除 ${pet.name} 的感測器綁定嗎？`, [
      { text: '取消', style: 'cancel' },
      { text: '確定', style: 'destructive', onPress: () => sensorService.unbindSensor(user.uid, pet.id) }
    ]);
  };

  return (
    <View style={styles.container}>
      <BaseScreen scrollable={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backIcon, { color: theme.primary, fontFamily: fontFamilyName }]}>‹</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.primary, fontFamily: fontFamilyName }]}>IoT 設備管理</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {pets.length === 0 && (
            <Text style={[styles.emptyText, { color: theme.text, fontFamily: fontFamilyName }]}>
              請先新增寵物再管理感測器
            </Text>
          )}

          {pets.map(pet => {
            const isShared = !!pet.sharedSensorPetId;
            let statusText = '未綁定';
            if (pet.sensorId) {
              statusText = `已綁定: ${pet.sensorId}`;
            } else if (isShared) {
              const target = pets.find(p => p.id === pet.sharedSensorPetId);
              statusText = `共用 ${target?.name || '未知'} 的感測器`;
            }

            return (
              <View key={pet.id} style={[styles.card, { backgroundColor: theme.background }]}>
                <Text style={[styles.petName, { color: theme.primary, fontFamily: fontFamilyName }]}>{pet.name}</Text>
                <Text style={[styles.statusText, { color: theme.text, fontFamily: fontFamilyName }]}>{statusText}</Text>
                
                <View style={styles.buttonRow}>
                  {(!pet.sensorId && !isShared) ? (
                    <>
                      <Pressable 
                        style={[styles.btn, { borderColor: theme.primary }]}
                        onPress={() => { setSelectedPet(pet); setShowBindModal(true); }}
                      >
                        <Text style={[styles.btnText, { color: theme.primary, fontFamily: fontFamilyName }]}>綁定感測器</Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.btn, { borderColor: theme.primary, marginLeft: 10 }]}
                        onPress={() => { setSelectedPet(pet); setShowShareModal(true); }}
                      >
                        <Text style={[styles.btnText, { color: theme.primary, fontFamily: fontFamilyName }]}>共用感測器</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable 
                      style={[styles.btn, { borderColor: '#FF3B30' }]}
                      onPress={() => handleUnbind(pet)}
                    >
                      <Text style={[styles.btnText, { color: '#FF3B30', fontFamily: fontFamilyName }]}>解除設定</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </BaseScreen>

      {/* Bind Modal */}
      <Modal visible={showBindModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>輸入感測器 ID</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.primary, fontFamily: fontFamilyName }]}
              value={sensorInput}
              onChangeText={setSensorInput}
              placeholder="例如：SENSOR-001"
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtn} onPress={() => { setShowBindModal(false); setSensorInput(''); }}>
                <Text style={[{ color: '#999', fontFamily: fontFamilyName, fontSize: getFontSize(16, 'medium') }]}>取消</Text>
              </Pressable>
              <Pressable style={styles.modalBtn} onPress={handleBind}>
                <Text style={[{ color: theme.primary, fontFamily: fontFamilyName, fontSize: getFontSize(16, 'medium') }]}>確定</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal visible={showShareModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowShareModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>選擇要共用的寵物感測器</Text>
            <ScrollView style={{ maxHeight: 200, width: '100%' }}>
              {pets.filter(p => p.id !== selectedPet?.id && p.sensorId).map(p => (
                <Pressable 
                  key={p.id} 
                  style={styles.shareItem}
                  onPress={() => handleShare(p.id)}
                >
                  <Text style={[{ color: theme.text, fontFamily: fontFamilyName, fontSize: getFontSize(16, 'medium') }]}>
                    {p.name} ({p.sensorId})
                  </Text>
                </Pressable>
              ))}
              {pets.filter(p => p.id !== selectedPet?.id && p.sensorId).length === 0 && (
                <Text style={[{ color: '#999', fontFamily: fontFamilyName, textAlign: 'center', marginTop: 20 }]}>沒有可共用的感測器</Text>
              )}
            </ScrollView>
            <Pressable style={{ marginTop: 20, alignSelf: 'center' }} onPress={() => setShowShareModal(false)}>
              <Text style={[{ color: '#999', fontFamily: fontFamilyName, fontSize: getFontSize(16, 'medium') }]}>取消</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  title: {
    fontSize: getFontSize(22, 'medium'),
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    fontSize: 40,
    lineHeight: 44,
    marginTop: -8,
  },
  list: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: getFontSize(16, 'medium'),
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  petName: {
    fontSize: getFontSize(18, 'medium'),
    marginBottom: 8,
  },
  statusText: {
    fontSize: getFontSize(14, 'medium'),
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: {
    fontSize: getFontSize(14, 'medium'),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: getFontSize(18, 'medium'),
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: getFontSize(16, 'medium'),
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  modalBtn: {
    padding: 10,
  },
  shareItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  }
});
