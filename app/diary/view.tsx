import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Pressable,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { paletteColors } from '../../src/theme/themeColorSettings';
import { useTheme } from '../../src/theme/ThemeContext';
import { getThemeTokens } from '../../src/theme/themeSettings';
import { getFontSize } from '../../src/theme/typographySettings';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT, PANEL_CONTENT_MARGIN, CONTENT_PAGE_MARGIN } from '../../src/theme/layoutSettings';
import DatePickerModal from '../../src/components/DatePickerModal';

const { width: W, height: H } = Dimensions.get('window');
const PAGE_LEFT = PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN;
const PAGE_TOP = STATUS_BAR_HEIGHT + PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN;
const PAGE_WIDTH = W - (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;
const PAGE_HEIGHT = H - STATUS_BAR_HEIGHT - TAB_BAR_HEIGHT - (PANEL_CONTENT_MARGIN + CONTENT_PAGE_MARGIN) * 2;

export default function DiaryViewScreen() {
  const router = useRouter();
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);

  // Mock data representing the latest diary
  const mockDiaryData = {
    dateStr: 'THU 7/17/2025',
    weatherIcon: require('../../assets/icons/weather-sunny.png'),
    title: '初次探索！家旁邊的新公園草地',
    content: `今天天氣真的太棒了，萬里無雲！看著窗外的陽光，突然有個念頭，想帶 Delete 去體驗一下真正的草地是什麼感覺，而不是總待在飼養箱裡。\n\n我們去了家旁邊剛落成的小公園，找了一塊乾淨的草坪。剛把他放下來的時候，他還有些小緊張，小心翼翼地，那個小表情真的太可愛了！\n大概過了五分鐘，他就完全放開了，開始好奇地四處聞聞、到處探索。看著他在陽光下，鱗片閃閃發光的樣子，滿足地樣子，真的太可愛了！\n\n回家後，他的食慾也變得特別好，看來今天的探險消耗了不少體力。這會成為我們最珍貴的回憶！`,
    carouselImages: [
      require('../../assets/user-uploads/lizard-001.jpg'),
      require('../../assets/user-uploads/lizard-002.jpg'),
      require('../../assets/user-uploads/lizard-003.jpg'),
    ],
    petName: 'DELETE',
    sensorData: {
      temperature: '31°C',
      humidity: '30%',
      baskingTime: '30分鐘',
      food: '蟋蟀10隻+高麗菜0.5片',
      bathTime: '溫水泡澡15分鐘',
      poop: '無',
      weight: '415公克',
      length: '44公分',
      showBasking: false,
      showFood: true,
      showBath: false,
      showPoop: true,
    },
    thumbnails: [
      require('../../assets/user-uploads/lizard-001.jpg'),
      require('../../assets/user-uploads/lizard-002.jpg'),
      require('../../assets/user-uploads/lizard-003.jpg'),
    ]
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showWeatherMenu, setShowWeatherMenu] = useState(false);
  const [selectedWeather, setSelectedWeather] = useState(require('../../assets/icons/weather-sunny.png'));
  const carouselRef = useRef<ScrollView>(null);

  const [petName, setPetName] = useState(mockDiaryData.petName);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const availablePets = ['ALL', 'DELETE', 'CTRL', 'ENTER', 'ALT'];

  const [diaryTitle, setDiaryTitle] = useState(mockDiaryData.title);
  const [diaryContent, setDiaryContent] = useState(mockDiaryData.content);
  const [sensorValues, setSensorValues] = useState({
    temperature: mockDiaryData.sensorData.temperature,
    humidity: mockDiaryData.sensorData.humidity,
    baskingTime: mockDiaryData.sensorData.baskingTime,
    food: mockDiaryData.sensorData.food,
    bathTime: mockDiaryData.sensorData.bathTime,
    poop: mockDiaryData.sensorData.poop,
    weight: mockDiaryData.sensorData.weight,
    length: mockDiaryData.sensorData.length,
  });

  const updateSensorValue = (key: string, value: string) => {
    setSensorValues(prev => ({ ...prev, [key]: value }));
  };

  const weatherIconsList = [
    require('../../assets/icons/weather-snow.png'),
    require('../../assets/icons/weather-partly-cloudy.png'),
    require('../../assets/icons/weather-moon.png'),
    require('../../assets/icons/weather-wind.png'),
    require('../../assets/icons/weather-cloudy.png'),
    require('../../assets/icons/weather-sunny.png'),
    require('../../assets/icons/weather-rain.png'),
    require('../../assets/icons/weather-thunder.png'),
  ];

  // Formatting date string: "THU 7/17/2025"
  const getFormattedDate = (date: Date) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const d = days[date.getDay()];
    const m = date.getMonth() + 1;
    const day = date.getDate();
    const y = date.getFullYear();
    return `${d} ${m}/${day}/${y}`;
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const viewWidth = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(offsetX / viewWidth);
    setCurrentImageIndex(index);
  };

  const handleImagePress = () => {
    const nextIndex = (currentImageIndex + 1) % mockDiaryData.carouselImages.length;
    carouselRef.current?.scrollTo({ x: nextIndex * (PAGE_WIDTH * 0.98), animated: true });
  };

  const pageStyle = {
    backgroundColor: paletteColors.RI_CHU,
    left: PAGE_LEFT,
    top: PAGE_TOP,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={[styles.scrollContainer, pageStyle]}
        contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 卡片 1: 照片與摘要 */}
        <View style={[styles.cardBlock, { zIndex: 100, elevation: 10 }]}>
          <View style={styles.heroImageContainer}>
            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={{ flex: 1, width: '100%', height: '100%' }}
            >
              {mockDiaryData.carouselImages.map((img, idx) => (
                <Pressable key={idx} style={{ width: PAGE_WIDTH * 0.98, height: 250 }} onPress={handleImagePress}>
                  <Image source={img} style={[styles.heroImage, { width: '100%', height: '100%' }]} />
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={styles.petNameTag}
              onPress={() => setShowPetDropdown(!showPetDropdown)}
            >
              <Text style={[styles.petNameText, { fontFamily: fontFamilyName }]}>{petName}</Text>
            </Pressable>

            <View style={styles.paginationDots} pointerEvents="none">
              {mockDiaryData.carouselImages.map((_, idx) => (
                <View key={idx} style={[styles.dot, currentImageIndex === idx ? styles.dotActive : styles.dotInactive]} />
              ))}
            </View>
          </View>

          {showPetDropdown && (
            <View style={styles.petDropdownModal}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {availablePets.map((pet, idx) => (
                  <Pressable
                    key={pet}
                    style={[
                      styles.dropdownItem,
                      idx === availablePets.length - 1 && { marginBottom: 0 }
                    ]}
                    onPress={() => {
                      setPetName(pet);
                      setShowPetDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { fontFamily: fontFamilyName, color: paletteColors.MU_CHENG }]}>
                      {pet}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.heroInfoBlock}>
            <View style={styles.dateRow}>
              <Pressable onPress={() => setShowCalendar(true)}>
                <Text style={[styles.dateText, { fontFamily: fontFamilyName }]}>{getFormattedDate(selectedDate)}</Text>
              </Pressable>
              <Pressable onPress={() => setShowWeatherMenu(!showWeatherMenu)}>
                <Image source={selectedWeather} style={[styles.weatherIcon, { tintColor: paletteColors.MU_CHENG }]} />
              </Pressable>
            </View>

            {showWeatherMenu && (
              <View style={styles.weatherMenuContainer}>
                {weatherIconsList.map((icon, idx) => (
                  <Pressable
                    key={idx}
                    style={styles.weatherOption}
                    onPress={() => {
                      setSelectedWeather(icon);
                      setShowWeatherMenu(false);
                    }}
                  >
                    <Image source={icon} style={[styles.weatherOptionIcon, { tintColor: paletteColors.MU_CHENG }]} />
                  </Pressable>
                ))}
              </View>
            )}

            <TextInput
              style={[styles.heroTitle, { fontFamily: fontFamilyName, color: paletteColors.MU_CHENG, padding: 0 }]}
              value={diaryTitle}
              onChangeText={setDiaryTitle}
              multiline
            />
            <View style={styles.heroSubRow}>
              <TextInput style={[styles.heroSubText, { fontFamily: fontFamilyName, padding: 0, minWidth: 40, textAlign: 'center' }]} value={sensorValues.temperature} onChangeText={(val) => updateSensorValue('temperature', val)} />
              <TextInput style={[styles.heroSubText, { fontFamily: fontFamilyName, padding: 0, minWidth: 40, textAlign: 'center' }]} value={sensorValues.humidity} onChangeText={(val) => updateSensorValue('humidity', val)} />
              <Image source={mockDiaryData.sensorData.showBasking ? require('../../assets/icons/category-basking-active.png') : require('../../assets/icons/category-basking-default.png')} style={styles.miniIcon} />
              <Image source={mockDiaryData.sensorData.showFood ? require('../../assets/icons/category-food-active.png') : require('../../assets/icons/category-food-default.png')} style={styles.miniIcon} />
              <Image source={mockDiaryData.sensorData.showBath ? require('../../assets/icons/category-bath-active.png') : require('../../assets/icons/category-bath-default.png')} style={styles.miniIcon} />
              <Image source={mockDiaryData.sensorData.showPoop ? require('../../assets/icons/category-poop-active.png') : require('../../assets/icons/category-poop-default.png')} style={styles.miniIcon} />
            </View>
          </View>
        </View>

        {/* 卡片 2: 日記內文 */}
        <View style={styles.cardBlock}>
          <TextInput
            style={[styles.contentTitle, { fontFamily: fontFamilyName, color: paletteColors.MU_CHENG, padding: 0 }]}
            value={diaryTitle}
            onChangeText={setDiaryTitle}
            multiline
          />
          <TextInput
            style={[styles.contentText, { fontFamily: fontFamilyName, color: theme.text, padding: 0 }]}
            value={diaryContent}
            onChangeText={setDiaryContent}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* 卡片 3: 量測數據列表 */}
        <View style={styles.cardBlock}>
          <View style={styles.sensorList}>
            <SensorListItem icon={require('../../assets/icons/category-temperature-default.png')} label="溫度" value={sensorValues.temperature} onChangeText={(val) => updateSensorValue('temperature', val)} fontFamilyName={fontFamilyName} />
            <SensorListItem icon={require('../../assets/icons/category-humidity-default.png')} label="濕度" value={sensorValues.humidity} onChangeText={(val) => updateSensorValue('humidity', val)} fontFamilyName={fontFamilyName} />
            <SensorListItem icon={require('../../assets/icons/category-basking-default.png')} label="日照" value={sensorValues.baskingTime} onChangeText={(val) => updateSensorValue('baskingTime', val)} fontFamilyName={fontFamilyName} />
            <SensorListItem icon={require('../../assets/icons/category-food-default.png')} label="飲食" value={sensorValues.food} onChangeText={(val) => updateSensorValue('food', val)} fontFamilyName={fontFamilyName} />
            <SensorListItem icon={require('../../assets/icons/category-bath-default.png')} label="泡澡" value={sensorValues.bathTime} onChangeText={(val) => updateSensorValue('bathTime', val)} fontFamilyName={fontFamilyName} />
            <SensorListItem icon={require('../../assets/icons/category-poop-default.png')} label="排便" value={sensorValues.poop} onChangeText={(val) => updateSensorValue('poop', val)} fontFamilyName={fontFamilyName} />
            <SensorListItem icon={require('../../assets/icons/category-weight-active.png')} label="體重" value={sensorValues.weight} onChangeText={(val) => updateSensorValue('weight', val)} fontFamilyName={fontFamilyName} />
            <SensorListItem icon={require('../../assets/icons/category-length-active.png')} label="身長" value={sensorValues.length} onChangeText={(val) => updateSensorValue('length', val)} fontFamilyName={fontFamilyName} />
          </View>
        </View>

        {/* 卡片 4: 縮圖列表 */}
        <View style={styles.cardBlockImageRow}>
          {mockDiaryData.thumbnails.map((img, idx) => (
            <Image key={idx} source={img} style={styles.thumbnail} />
          ))}
        </View>

        {/* Fill empty space at bottom so floating buttons don't block content */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 浮動按鈕群 - 右下角 */}
      <View style={styles.floatingActionContainer} pointerEvents="box-none">
        <Pressable style={styles.fabBtn}>
          <Image source={require('../../assets/icons/icon-diary.png')} style={styles.fabIcon} />
        </Pressable>
        <Pressable style={styles.fabBtn}>
          <Image source={require('../../assets/icons/icon-add.png')} style={styles.fabIcon} />
        </Pressable>
        <Pressable style={styles.fabBtn}>
          <Image source={require('../../assets/icons/icon-edit.png')} style={styles.fabIcon} />
        </Pressable>
      </View>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showCalendar}
        currentDate={selectedDate}
        onClose={() => setShowCalendar(false)}
        onSelectDate={setSelectedDate}
      />
    </View>
  );
}

function SensorListItem({ icon, label, value, fontFamilyName, onChangeText }: { icon: any, label: string, value: string, fontFamilyName: string, onChangeText: (val: string) => void }) {
  return (
    <View style={styles.sensorListItem}>
      <Image source={icon} style={[styles.sensorListIcon, { tintColor: paletteColors.MU_CHENG }]} />
      <Text style={[styles.sensorListLabel, { fontFamily: fontFamilyName }]}>{label}：</Text>
      <TextInput
        style={[styles.sensorListValue, { fontFamily: fontFamilyName }]}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContainer: {
    position: 'absolute',
  },
  cardBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 4px 7px rgba(0, 0, 0, 0.1)',
    alignSelf: 'center',
    width: '98%',
  },
  cardBlockImageRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    boxShadow: '0px 4px 7px rgba(0, 0, 0, 0.1)',
    alignSelf: 'center',
    width: '98%',
  },

  // Hero Image
  heroImageContainer: {
    margin: -16,       // negate padding to make image full-width inside card
    marginBottom: 16,  // space below image
    height: 250,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  petNameTag: {
    position: 'absolute',
    bottom: 36, // float above dots
    left: 0,
    backgroundColor: '#FFF5D9', // slightly richer creamy yellow
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 10,
  },
  petNameText: {
    color: '#FA9215', // orange
    fontSize: getFontSize(18, 'medium'), // significantly smaller size exactly like the design
    // removed bold to match the image cleanly
  },
  petDropdownModal: {
    position: 'absolute',
    top: 202, // Exactly below the tag (198 px + 4px gap) relative to cardBlock
    left: -16, // Align with the left edge of hero container
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 200,
    maxHeight: 220,
  },
  dropdownItem: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFF8E7', // richer pale yellow aesthetic
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 8, // 拉開按鈕間隔
  },
  dropdownItemText: {
    fontSize: getFontSize(22, 'medium'),
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },

  // Hero Info
  heroInfoBlock: {
    alignItems: 'center',
    gap: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: getFontSize(22, 'medium'),
    color: paletteColors.MU_CHENG,
  },
  weatherIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  heroTitle: {
    fontSize: getFontSize(18, 'medium'),
    textAlign: 'center',
  },
  weatherMenuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  weatherOption: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  weatherOptionIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  heroSubText: {
    fontSize: getFontSize(16, 'medium'),
    color: paletteColors.MU_CHENG,
  },
  miniIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },

  // Content Block
  contentTitle: {
    fontSize: getFontSize(20, 'medium'),
    marginBottom: 16,
  },
  contentText: {
    fontSize: getFontSize(16, 'medium'),
    lineHeight: 26,
    color: '#666666',
    textAlign: 'justify', // 加入左右對齊
  },

  // Sensor List
  sensorList: {
    gap: 12,
  },
  sensorListItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorListIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 12,
  },
  sensorListLabel: {
    fontSize: getFontSize(16, 'medium'),
    color: '#666666',
  },
  sensorListValue: {
    flex: 1,
    fontSize: getFontSize(16, 'medium'),
    color: '#666666',
    padding: 0,
    margin: 0,
  },

  // Thumbnails
  thumbnail: {
    width: '32%',
    height: 80,
    resizeMode: 'cover',
    borderRadius: 8,
  },

  // FAB
  floatingActionContainer: {
    position: 'absolute',
    bottom: PAGE_TOP + 20, // keep it inside page boundaries
    right: PAGE_LEFT + 20, // stick to the right edge
    flexDirection: 'row',
    gap: 12,
    zIndex: 100,
  },
  fabBtn: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 237, 204, 0.9)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6C687',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  fabIcon: {
    width: 24,
    height: 24,
    tintColor: paletteColors.MU_CHENG,
    resizeMode: 'contain',
  },
});
