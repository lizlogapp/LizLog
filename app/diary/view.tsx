import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Pressable,
  Modal,
} from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import { getThemeTokens } from '../../src/theme/themeSettings';
import { getFontSize } from '../../src/theme/typographySettings';
import { FloatingActionBar } from '../../src/components/FloatingActionBar';
import { BaseScreen } from '../../src/components/common/BaseScreen';
import { paletteColors } from '../../src/theme/themeColorSettings';
import type { DiarySubView } from '../(tabs)/diary';

// SVG Icons
// @ts-ignore
import IconTemp from '../../assets/icons/icon-temp.svg';
// @ts-ignore
import IconHumid from '../../assets/icons/icon-humid.svg';
// @ts-ignore
import IconBask from '../../assets/icons/icon-bask.svg';
// @ts-ignore
import IconFeed from '../../assets/icons/icon-feed.svg';
// @ts-ignore
import IconBath from '../../assets/icons/icon-bath.svg';
// @ts-ignore
import IconPoop from '../../assets/icons/icon-poop.svg';
// @ts-ignore
import IconWeight from '../../assets/icons/icon-weight.svg';
// @ts-ignore
import IconLength from '../../assets/icons/icon-length.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * 日記檢視頁面（唯讀）
 * 從日記列表點擊卡片後進入
 * 包含：照片輪播、寵物標籤、日期資訊、日記全文、狀態紀錄、附件照片
 */
export default function DiaryViewScreen({
  onNavigate,
  diaryId,
}: {
  onNavigate: (view: DiarySubView, diaryId?: number) => void;
  diaryId: number | null;
}) {
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);
  const labelColor = theme.primary;
  const valueColor = paletteColors.LIE_RI;

  // 模擬日記資料（未來從資料庫根據 diaryId 取得）
  const mockDiary = {
    id: 1,
    dateStr: 'THU  7/17/2025',
    weatherIcon: require('../../assets/icons/weather-sunny.png'),
    title: '初次探索！家旁邊的新公園草地',
    content: `今天天氣真的太棒了，萬里無雲！看著窗外的陽光，突然有個念頭，想帶Delete 去體驗一下真正的草地是什麼感覺，而不是總待在飼養箱裡。\n\n我們去了家旁邊剛落成的小公園，找了一塊乾淨的草坪。剛把他放下來的時候，他還有些小緊張，小心翼翼地，那個小表情真的太可愛了！\n大概過了五分鐘，他就完全放開了，開始好奇地四處聞聞、到處探索。看著他在陽光下，鱗片閃閃發光的樣子，滿足地樣子，真的太可愛了！\n\n回家後，他的食慾也變得特別好，看來今天的探險消耗了不少體力。這會成為我們最珍貴的回憶！`,
    petName: 'DELETE',
    carouselImages: [
      require('../../assets/user-uploads/lizard-001.jpg'),
      require('../../assets/user-uploads/lizard-002.jpg'),
      require('../../assets/user-uploads/lizard-003.jpg'),
    ],
    sensorData: {
      temp: '31℃',
      humid: '30%',
      bask: '30分鐘',
      feed: '蟋蟀10隻+高麗菜0.5片',
      bath: '溫水泡澡15分鐘',
      poop: '無',
      weight: '415公克',
      length: '44公分',
    },
    statusIcons: {
      bask: false,
      feed: true,
      bath: false,
      poop: true,
    },
    attachments: [
      require('../../assets/user-uploads/lizard-004.jpg'),
      require('../../assets/user-uploads/lizard-005.jpg'),
      require('../../assets/user-uploads/lizard-006.jpg'),
    ],
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<any>(null);
  const carouselRef = useRef<ScrollView>(null);

  // 輪播寬度（去掉左右 padding 各 16）
  const cardWidth = SCREEN_WIDTH - 64;

  const handleCarouselScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / cardWidth);
    setCurrentImageIndex(index);
  };

  const handleImageTap = () => {
    const nextIndex = (currentImageIndex + 1) % mockDiary.carouselImages.length;
    carouselRef.current?.scrollTo({ x: nextIndex * cardWidth, animated: true });
  };

  const recordItems = [
    { icon: IconTemp, label: '溫度', value: mockDiary.sensorData.temp },
    { icon: IconHumid, label: '濕度', value: mockDiary.sensorData.humid },
    { icon: IconBask, label: '日照', value: mockDiary.sensorData.bask },
    { icon: IconFeed, label: '飲食', value: mockDiary.sensorData.feed },
    { icon: IconBath, label: '泡澡', value: mockDiary.sensorData.bath },
    { icon: IconPoop, label: '排便', value: mockDiary.sensorData.poop },
    { icon: IconWeight, label: '體重', value: mockDiary.sensorData.weight },
    { icon: IconLength, label: '身長', value: mockDiary.sensorData.length },
  ];

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => onNavigate('list') },
            { id: 'edit', onPress: () => { /* TODO: 進入編輯模式 */ } },
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
          <View style={styles.mainCard}>
            <View style={styles.carouselContainer}>
              <ScrollView
                ref={carouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleCarouselScroll}
                scrollEventThrottle={16}
              >
                {mockDiary.carouselImages.map((img, idx) => (
                  <Pressable key={idx} onPress={handleImageTap} style={{ width: cardWidth }}>
                    <Image source={img} style={styles.carouselImage} />
                  </Pressable>
                ))}
              </ScrollView>

              {/* 分頁指示點 */}
              <View style={styles.dotsContainer}>
                {mockDiary.carouselImages.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      currentImageIndex === idx ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>

              {/* 寵物標籤 */}
              <View style={styles.petTagsContainer}>
                <View style={styles.petTag}>
                  <Text style={[styles.petTagText, { color: labelColor, fontFamily: fontFamilyName }]}>{mockDiary.petName}</Text>
                </View>
              </View>
            </View>

            {/* 日期 + 天氣 + 標題 + 數據列 */}
            <View style={styles.infoContainer}>
              <View style={styles.dateRow}>
                <Text style={[styles.dateText, { color: valueColor, fontFamily: fontFamilyName }]}>{mockDiary.dateStr}</Text>
                <Image source={mockDiary.weatherIcon} style={[styles.weatherIcon, { tintColor: valueColor }]} />
              </View>
              <Text style={[styles.titleText, { color: valueColor, fontFamily: fontFamilyName }]}>{mockDiary.title}</Text>
              <View style={styles.metricRow}>
                <Text style={[styles.metricText, { color: valueColor, fontFamily: fontFamilyName }]}>{mockDiary.sensorData.temp}</Text>
                <Text style={[styles.metricText, { color: valueColor, fontFamily: fontFamilyName }]}>{mockDiary.sensorData.humid}</Text>
                <View style={styles.metricIconsBlock}>
                  <Image source={mockDiary.statusIcons.bask ? require('../../assets/icons/category-basking-active.png') : require('../../assets/icons/category-basking-default.png')} style={styles.stateIcon} />
                  <Image source={mockDiary.statusIcons.feed ? require('../../assets/icons/category-food-active.png') : require('../../assets/icons/category-food-default.png')} style={styles.stateIcon} />
                  <Image source={mockDiary.statusIcons.bath ? require('../../assets/icons/category-bath-active.png') : require('../../assets/icons/category-bath-default.png')} style={styles.stateIcon} />
                  <Image source={mockDiary.statusIcons.poop ? require('../../assets/icons/category-poop-active.png') : require('../../assets/icons/category-poop-default.png')} style={styles.stateIcon} />
                </View>
              </View>
            </View>
          </View>

          {/* ===== 卡片二：日記全文 ===== */}
          <View style={styles.contentCard}>
            <Text style={[styles.contentTitle, { color: labelColor, fontFamily: fontFamilyName }]}>{mockDiary.title}</Text>
            <Text style={[styles.contentBody, { color: theme.text, fontFamily: fontFamilyName }]}>{mockDiary.content}</Text>
          </View>

          {/* ===== 卡片三：狀態紀錄 ===== */}
          <View style={styles.detailCard}>
            {recordItems.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <View key={idx} style={styles.recordRow}>
                  <IconComp width={20} height={20} color={labelColor} />
                  <Text style={[styles.recordLabel, { color: labelColor, fontFamily: fontFamilyName }]}>
                    {item.label}：
                  </Text>
                  <Text style={[styles.recordValue, { color: valueColor, fontFamily: fontFamilyName }]}>
                    {item.value}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ===== 卡片四：附件照片 ===== */}
          <View style={styles.attachmentCard}>
            <View style={styles.attachmentRow}>
              {mockDiary.attachments.map((img, idx) => (
                <Pressable key={idx} onPress={() => setFullscreenImage(img)} style={styles.thumbnailWrapper}>
                  <Image source={img} style={styles.thumbnail} />
                </Pressable>
              ))}
            </View>
          </View>

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
            {fullscreenImage && (
              <Image source={fullscreenImage} style={styles.fullscreenImage} />
            )}
          </Pressable>
        </Modal>
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
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
  petTag: {
    backgroundColor: '#FFF1D0',
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
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
    fontSize: getFontSize(15, 'medium'),
    lineHeight: 24,
  },

  // ===== 狀態紀錄卡片 =====
  detailCard: {
    width: '100%',
    backgroundColor: paletteColors.RI_CHU,
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
    flex: 1,
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
    width: '92%',
    height: '70%',
    resizeMode: 'contain',
  },
});
