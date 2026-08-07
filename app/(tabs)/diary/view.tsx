import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import { appetiteToLabel } from '../../../src/data/mockDiaryData';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getWeatherOption } from '../../../src/data/weatherOptions';
import { diaryService, DiaryDoc } from '../../../src/services/firestoreService';
import { saveRemoteImageToLibrary } from '../../../src/services/imageService';
import { formatDiaryDate } from '../../../src/utils/diaryDate';

// SVG Icons
import IconTemp from '../../../assets/icons/icon-temp.svg';
import IconHumid from '../../../assets/icons/icon-humid.svg';
import IconBask from '../../../assets/icons/icon-bask.svg';
import IconFeed from '../../../assets/icons/icon-feed.svg';
import IconBath from '../../../assets/icons/icon-bath.svg';
import IconPoop from '../../../assets/icons/icon-poop.svg';
import IconMolt from '../../../assets/icons/icon-molt.svg';
import IconWeight from '../../../assets/icons/icon-weight.svg';
import IconLength from '../../../assets/icons/icon-length.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * 日記檢視頁面（唯讀）
 * 從日記列表點擊卡片後進入
 * 包含：照片輪播、寵物標籤、日期資訊、日記全文、狀態紀錄、附件照片
 */
export default function DiaryViewScreen() {
  const router = useRouter();
  const { id, ownerId } = useLocalSearchParams<{ id: string; ownerId?: string; from?: string }>();
  const { user } = useAuth();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);
  const labelColor = theme.primary;
  const valueColor = theme.accentHot;

  const [diary, setDiary] = useState<(DiaryDoc & { id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isActive = true;
    if (!user || !id) {
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);
    diaryService
      .getById(ownerId || user.uid, id)
      .then(result => {
        if (isActive) setDiary(result);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [id, ownerId, user]);

  const dateStr = formatDiaryDate(diary?.date);
  const primaryPet = diary?.pets?.[0];
  const records = diary?.records ?? {};
  const diaryImageUrls = diary?.imageUrls?.length
    ? diary.imageUrls
    : (diary?.imageUrl ? [diary.imageUrl] : []);
  const diaryImages = diaryImageUrls.map(uri => ({ uri }));
  const displayDiary = {
    id: diary?.id || '',
    dateStr,
    weatherIcon: getWeatherOption(diary?.weatherIcon).source,
    title: diary?.title?.trim() === '標題' ? '' : (diary?.title?.trim() || ''),
    content: diary?.content || '',
    petName: diary?.pets?.map(pet => pet.name).join('、') || '未指定寵物',
    carouselImages: diaryImages,
    sensorData: {
      temp: records.temp && records.temp !== '-' ? records.temp : (primaryPet?.temp || '-'),
      humid: records.humid && records.humid !== '-' ? records.humid : (primaryPet?.humid || '-'),
      bask: records.bask || '-',
      feed: records.feed || '-',
      appetite: records.appetite || 0,
      bath: records.bath || '-',
      poop: records.poop || '-',
      molt: records.molt || (primaryPet?.states?.molt ? '有' : '無'),
      weight: records.weight || '-',
      length: records.length || '-',
    },
    statusIcons: {
      bask: Boolean(primaryPet?.states?.bask || Number.parseFloat(records.bask || '') > 0),
      feed: Boolean(primaryPet?.states?.feed || (records.feed && records.feed !== '無')),
      bath: Boolean(primaryPet?.states?.bath || Number.parseFloat(records.bath || '') > 0),
      poop: Boolean(primaryPet?.states?.poop || records.poop === '有'),
    },
    attachments: diaryImageUrls.map(uri => ({ uri })),
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<{ uri: string } | null>(null);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const carouselRef = useRef<ScrollView>(null);
  const canEdit = Boolean(
    user && diary && (
      (diary.ownerId || ownerId || user.uid) === user.uid
      || diary.editorIds?.includes(user.uid)
    ),
  );

  // 輪播寬度（去掉左右 padding 各 16）
  const cardWidth = SCREEN_WIDTH - 64;

  const handleCarouselScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / cardWidth);
    setCurrentImageIndex(index);
  };

  const handleImageTap = () => {
    if (displayDiary.carouselImages.length === 0) return;
    const nextIndex = (currentImageIndex + 1) % displayDiary.carouselImages.length;
    carouselRef.current?.scrollTo({ x: nextIndex * cardWidth, animated: true });
  };

  const confirmDelete = () => {
    if (!user || !diary || !canEdit || isDeleting) return;
    Alert.alert('刪除日記', '確定要刪除這篇日記嗎？此動作無法復原。', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await diaryService.delete(diary.ownerId || ownerId || user.uid, diary.id);
            router.replace('/(tabs)/diary');
          } catch {
            Alert.alert('刪除失敗', '日記尚未刪除，請確認網路後再試一次。');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const downloadImage = async (uri: string) => {
    if (isDownloadingImage) return;
    setIsDownloadingImage(true);
    try {
      await saveRemoteImageToLibrary(uri);
      Alert.alert('下載完成', '照片已儲存到手機相簿。');
    } catch (error) {
      Alert.alert('下載失敗', error instanceof Error ? error.message : '請稍後再試。');
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const buildRecordItems = (pet: NonNullable<DiaryDoc['pets']>[number], petIndex: number) => {
    const petRecords = pet.records || (petIndex === 0 ? records : {});
    return [
      { icon: IconTemp, label: '溫度', value: petRecords.temp && petRecords.temp !== '-' ? petRecords.temp : (pet.temp || '-') },
      { icon: IconHumid, label: '濕度', value: petRecords.humid && petRecords.humid !== '-' ? petRecords.humid : (pet.humid || '-') },
      { icon: IconBask, label: '日照', value: petRecords.bask || '-' },
      { icon: IconFeed, label: '飲食', value: petRecords.feed || '-', appetite: petRecords.appetite || 0 },
      { icon: IconBath, label: '泡澡', value: petRecords.bath || '-' },
      { icon: IconPoop, label: '排便', value: petRecords.poop || '-' },
      { icon: IconMolt, label: '蛻皮', value: petRecords.molt || (pet.states?.molt ? '有' : '無') },
      { icon: IconWeight, label: '體重', value: petRecords.weight || '-' },
      { icon: IconLength, label: '身長', value: petRecords.length || '-' },
    ];
  };

  if (isLoading) {
    return (
      <BaseScreen scrollable={false}>
        <View style={styles.stateContainer}>
          <ActivityIndicator color={theme.primary} />
          <Text style={[styles.stateText, { color: theme.primary, fontFamily: fontFamilyName }]}>讀取日記中…</Text>
        </View>
      </BaseScreen>
    );
  }

  if (!diary) {
    return (
      <BaseScreen scrollable={false}>
        <View style={styles.stateContainer}>
          <Text style={[styles.stateText, { color: theme.primary, fontFamily: fontFamilyName }]}>找不到這篇日記。</Text>
          <Pressable onPress={() => router.navigate('/(tabs)/diary')}>
            <Text style={[styles.stateLink, { color: theme.accentHot, fontFamily: fontFamilyName }]}>返回日記列表</Text>
          </Pressable>
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
            { id: 'back', onPress: () => {
              // 返回層級：日記檢視 -> 日記列表
              router.navigate('/(tabs)/diary');
            }},
            ...(canEdit ? [{ id: 'edit' as const, onPress: () => router.push({
              pathname: '/(tabs)/diary/add',
              params: { id, ownerId: diary?.ownerId || ownerId },
            }) }] : []),
          ]}
        />
      }
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ===== 卡片一：照片輪播 + 資訊 ===== */}
          <View style={[styles.mainCard, { backgroundColor: theme.background }]}>
            <View
              style={[
                styles.carouselContainer,
                diaryImageUrls.length === 0 && {
                  height: 48,
                  backgroundColor: theme.accentDawn,
                },
              ]}
            >
              {diaryImageUrls.length > 0 ? (
                <ScrollView
                  ref={carouselRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleCarouselScroll}
                  scrollEventThrottle={16}
                >
                  {displayDiary.carouselImages.map((img, idx) => (
                    <Pressable key={idx} onPress={handleImageTap} style={{ width: cardWidth }}>
                      <Image source={img} style={styles.carouselImage} />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}

              {/* 分頁指示點 */}
              {diaryImageUrls.length > 1 ? <View style={styles.dotsContainer}>
                {displayDiary.carouselImages.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      currentImageIndex === idx ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View> : null}

              {/* 寵物標籤 */}
              <View style={[
                styles.petTagsContainer,
                diaryImageUrls.length === 0 && styles.noImagePetTagsContainer,
              ]}>
                <View style={[
                  styles.petTag,
                  { backgroundColor: theme.accentDawn },
                  diaryImageUrls.length === 0 && styles.noImagePetTag,
                ]}>
                  <Text selectable style={[styles.petTagText, { color: theme.primary, fontFamily: fontFamilyName }]}>{displayDiary.petName}</Text>
                </View>
              </View>
            </View>

            {/* 日期 + 天氣 + 標題 + 數據列 */}
            <View style={styles.infoContainer}>
              <View style={styles.dateRow}>
                <Text selectable style={[styles.dateText, { color: labelColor, fontFamily: fontFamilyName }]}>{displayDiary.dateStr}</Text>
                <Image source={displayDiary.weatherIcon} style={[styles.weatherIcon, { tintColor: labelColor }]} />
              </View>
              {displayDiary.title ? <Text selectable style={[styles.titleText, { color: labelColor, fontFamily: fontFamilyName }]}>{displayDiary.title}</Text> : null}
              <View style={styles.metricRow}>
                <Text style={[styles.metricText, { color: valueColor, fontFamily: fontFamilyName }]}>{displayDiary.sensorData.temp}</Text>
                <Text style={[styles.metricText, { color: valueColor, fontFamily: fontFamilyName }]}>{displayDiary.sensorData.humid}</Text>
                <View style={styles.metricIconsBlock}>
                  <Image source={displayDiary.statusIcons.bask ? require('../../../assets/icons/category-basking-active.png') : require('../../../assets/icons/category-basking-default.png')} style={styles.stateIcon} />
                  <Image source={displayDiary.statusIcons.feed ? require('../../../assets/icons/category-food-active.png') : require('../../../assets/icons/category-food-default.png')} style={styles.stateIcon} />
                  <Image source={displayDiary.statusIcons.bath ? require('../../../assets/icons/category-bath-active.png') : require('../../../assets/icons/category-bath-default.png')} style={styles.stateIcon} />
                  <Image source={displayDiary.statusIcons.poop ? require('../../../assets/icons/category-poop-active.png') : require('../../../assets/icons/category-poop-default.png')} style={styles.stateIcon} />
                </View>
              </View>
            </View>
          </View>

          {/* ===== 卡片二：狀態紀錄 ===== */}
          {(diary?.pets || []).map((pet, petIndex) => (
          <View key={`records-${pet.petId || pet.name}-${petIndex}`} style={[styles.detailCard, { backgroundColor: theme.background }]}>
            {(diary?.pets?.length || 0) > 1 && (
              <Text style={[styles.recordLabel, { color: labelColor, fontFamily: fontFamilyName, marginBottom: 8 }]}>{pet.name}</Text>
            )}
            {buildRecordItems(pet, petIndex).map((item, idx) => {
              const IconComp = item.icon;
              return (
                <View key={idx} style={{ gap: 8, width: '100%' }}>
                  <View style={styles.recordRow}>
                    <IconComp width={20} height={20} color={labelColor} />
                    <Text selectable style={[styles.recordLabel, { color: labelColor, fontFamily: fontFamilyName }]}>
                      {item.label}：
                    </Text>
                    {['排便', '蛻皮'].includes(item.label) ? (
                      <View style={{ flexDirection: 'row', gap: 6, flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
                        {['無', '有'].map((opt) => (
                          <View
                            key={opt}
                            style={[
                              { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, width: 64, alignItems: 'center' },
                              item.value === opt
                                ? { backgroundColor: theme.accentHot + '15', borderColor: theme.accentHot }
                                : { backgroundColor: theme.primary + '05', borderColor: theme.primary + '20' }
                            ]}
                          >
                            <Text style={{ fontSize: getFontSize(13, 'medium'), fontFamily: fontFamilyName, color: item.value === opt ? theme.accentHot : theme.primary + 'A0', fontWeight: item.value === opt ? '600' : '500' }}>
                              {opt}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : item.label === '飲食' ? (
                      <Text selectable
                        style={[styles.recordValue, { color: valueColor, fontFamily: fontFamilyName, flex: 1, textAlign: 'left', paddingLeft: 24, minHeight: 24 }]}
                      >
                        {item.value}
                      </Text>
                    ) : ['泡澡', '日照', '體重', '身長', '溫度', '濕度'].includes(item.label) ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text selectable
                          style={[styles.recordValue, { color: valueColor, fontFamily: fontFamilyName, width: 64, textAlign: 'center', marginRight: 6 }]}
                        >
                          {item.value}
                        </Text>
                        <Text selectable style={[styles.recordValue, { color: labelColor, fontFamily: fontFamilyName }]}>
                          {item.label === '泡澡' || item.label === '日照' ? '分鐘' :
                           item.label === '體重' ? '公克' :
                           item.label === '身長' ? '公分' :
                           item.label === '溫度' ? '℃' :
                           '%'}
                        </Text>
                      </View>
                    ) : (
                      <Text selectable style={[styles.recordValue, { color: valueColor, fontFamily: fontFamilyName }]}>
                        {item.value}
                      </Text>
                    )}
                  </View>

                  {/* 如果是飲食，新增食慾選項拉霸 */}
                  {item.label === '飲食' && (
                    <View style={[styles.recordRow, { marginTop: 4, marginBottom: 4, width: '100%', paddingRight: 0, marginRight: -16 }]}>
                      {/* Icon 佔位 */}
                      <View style={{ width: 20 }} />
                      <Text style={[styles.recordLabel, { color: labelColor, fontFamily: fontFamilyName }]}>食慾：</Text>
                      <View style={styles.sliderRow}>
                        <Slider
                          style={{ flex: 1, height: 40, marginLeft: 16, marginRight: 16 }}
                          minimumValue={1}
                          maximumValue={5}
                          step={1}
                          value={(item.appetite ?? 0) > 0 ? item.appetite : 3}
                          disabled={true}
                          minimumTrackTintColor={(item.appetite ?? 0) <= 0 ? '#CCCCCC' : item.appetite === 1 ? '#FF3B30' : item.appetite === 2 ? '#FF9500' : '#34C759'}
                          maximumTrackTintColor={theme.primary + '30'}
                          thumbTintColor={(item.appetite ?? 0) <= 0 ? '#CCCCCC' : item.appetite === 1 ? '#FF3B30' : item.appetite === 2 ? '#FF9500' : '#34C759'}
                        />
                        <Text style={[styles.recordLabel, { color: (item.appetite ?? 0) <= 0 ? labelColor + '80' : labelColor, fontFamily: fontFamilyName, width: 52, textAlign: 'center' }]}>
                          {(item.appetite ?? 0) <= 0 ? '未檢測' : item.appetite === 1 ? '差' : item.appetite === 2 ? '偏差' : item.appetite === 3 ? '普通' : item.appetite === 4 ? '偏好' : '好'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          ))}

          {/* ===== 卡片三：日記全文／筆記 ===== */}
          {(displayDiary.title || displayDiary.content.trim()) ? (
            <View style={[styles.contentCard, { backgroundColor: theme.background }]}>
              {displayDiary.title ? <Text selectable style={[styles.contentTitle, { color: labelColor, fontFamily: fontFamilyName }]}>{displayDiary.title}</Text> : null}
              {displayDiary.content.trim() ? <Text selectable style={[styles.contentBody, { color: labelColor, fontFamily: fontFamilyName }]}>{displayDiary.content}</Text> : null}
            </View>
          ) : null}

          {/* ===== 最下方：附件與刪除 ===== */}
          {displayDiary.attachments.length > 0 ? (
            <View style={[styles.attachmentCard, { backgroundColor: theme.background }]}>
              <View style={styles.attachmentRow}>
                {displayDiary.attachments.map((img, idx) => (
                  <Pressable key={idx} onPress={() => setFullscreenImage(img)} style={styles.thumbnailWrapper}>
                    <Image source={img} style={styles.thumbnail} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {canEdit ? (
            <View style={[styles.deleteCard, { backgroundColor: theme.background }]}>
              <Pressable
                disabled={isDeleting}
                onPress={confirmDelete}
                style={[styles.deleteButton, { borderColor: '#D84A4A', opacity: isDeleting ? 0.55 : 1 }]}
              >
                <Text style={[styles.deleteButtonText, { fontFamily: fontFamilyName }]}>
                  {isDeleting ? '刪除中…' : '刪除日記'}
                </Text>
              </Pressable>
            </View>
          ) : null}

        </ScrollView>

        {/* 全螢幕照片檢視 Modal */}
        <Modal
          visible={fullscreenImage !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setFullscreenImage(null)}
        >
          <Pressable
            style={styles.fullscreenOverlay}
            onPress={() => setFullscreenImage(null)}
          >
            {fullscreenImage && <View style={styles.fullscreenContent}>
              <Image source={fullscreenImage} style={styles.fullscreenImage} />
              <Pressable
                disabled={isDownloadingImage}
                onPress={event => {
                  event.stopPropagation();
                  void downloadImage(fullscreenImage.uri);
                }}
                style={[styles.downloadButton, { backgroundColor: theme.background, opacity: isDownloadingImage ? 0.6 : 1 }]}
              >
                <Text style={[styles.downloadButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                  {isDownloadingImage ? '下載中…' : '下載圖片'}
                </Text>
              </Pressable>
            </View>}
          </Pressable>
        </Modal>
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    fontSize: getFontSize(16, 'medium'),
  },
  stateLink: {
    fontSize: getFontSize(14, 'medium'),
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 16,
  },

  // ===== 主卡片 =====
  mainCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 6,
  },
  carouselContainer: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  petTagsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    gap: 8,
  },
  noImagePetTagsContainer: {
    top: 0,
    bottom: 0,
    right: 0,
    justifyContent: 'center',
  },
  petTag: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  noImagePetTag: {
    flex: 1,
    justifyContent: 'center',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 20,
  },
  petTagText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
  },

  // ===== 資訊區 =====
  infoContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  dateText: {
    fontSize: getFontSize(18, 'medium'),
  },
  weatherIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  titleText: {
    fontSize: getFontSize(16, 'medium'),
    marginBottom: 16,
    textAlign: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
    gap: 6,
  },
  metricText: {
    fontSize: getFontSize(14, 'medium'),
    minWidth: 42,
    textAlign: 'left',
  },
  metricIconsBlock: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 'auto',
  },
  stateIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  // ===== 日記全文卡片 =====
  contentCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 6,
  },
  contentTitle: {
    fontSize: getFontSize(20, 'medium'),
    fontWeight: '600',
    marginBottom: 16,
  },
  contentBody: {
    fontSize: getFontSize(16, 'medium'),
    lineHeight: 24,
    textAlign: 'justify',
  },

  // ===== 狀態紀錄卡片 =====
  detailCard: {
    width: '100%',

    borderRadius: 16,
    padding: 20,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 6,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordLabel: {
    fontSize: getFontSize(16, 'medium'),
  },
  recordValue: {
    fontSize: getFontSize(16, 'medium'),
  },
  sliderRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ===== 附件照片卡片 =====
  attachmentCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 6,
  },
  attachmentRow: {
    flexDirection: 'row',
    gap: 16,
  },
  deleteCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 6,
  },
  deleteButton: {
    width: '100%',
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#D84A4A',
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
  },
  thumbnailWrapper: {
    flex: 1,
  },
  thumbnail: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },

  // ===== 全螢幕照片檢視 =====
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    flex: 1,
    resizeMode: 'contain',
  },
  fullscreenContent: {
    width: '92%',
    height: '78%',
    alignItems: 'center',
    gap: 18,
  },
  downloadButton: {
    minWidth: 160,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  downloadButtonText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
  },
});
