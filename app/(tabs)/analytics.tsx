import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { getThemeTokens } from '../../src/theme/themeSettings';

import { getFontSize } from '../../src/theme/typographySettings';
import { BaseScreen } from '../../src/components/common/BaseScreen';
import { useAuth } from '../../src/contexts/AuthContext';
import { diaryService, petService, DiaryDoc } from '../../src/services/firestoreService';

// 引入從 temp 新增進來的 SVG 圖示
// 引入從 temp 新增進來並翻成英文避免組件撞名的 SVG 圖示
import IconTemp from '../../assets/icons/icon-temp.svg';
import IconHumid from '../../assets/icons/icon-humid.svg';
import IconBask from '../../assets/icons/icon-bask.svg';
import IconWeight from '../../assets/icons/icon-weight.svg';
import IconLength from '../../assets/icons/icon-length.svg';
import IconPoop from '../../assets/icons/icon-poop.svg';
import IconMolt from '../../assets/icons/icon-molt.svg';
import IconBath from '../../assets/icons/icon-bath.svg';
import IconFeed from '../../assets/icons/icon-feed.svg';

export default function AnalyticsScreen() {
  const { themeId, fontFamilyName, isDemoMode } = useTheme();
  const theme = getThemeTokens(themeId);
  const router = useRouter();
  const { user } = useAuth();

  // 延用與首頁相同的寵物切換狀態
  const [availablePets, setAvailablePets] = useState<string[]>([]);
  const [currentPetName, setCurrentPetName] = useState<string>('未設定');
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
  const [isRecordsExpanded, setIsRecordsExpanded] = useState<boolean>(false);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<string>('週');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [diaryEntries, setDiaryEntries] = useState<(DiaryDoc & { id: string })[]>([]);

  React.useEffect(() => {
    if (!user) return;
    petService.getAll(user.uid).then(pets => {
      setAvailablePets(pets.map(p => p.name));
      if (pets.length > 0) {
        setCurrentPetName(pets[0].name);
      } else {
        setCurrentPetName('未設定');
      }

      diaryService.getAll(user.uid).then(entries => {
        setDiaryEntries(entries);
      });
    });
  }, [user]);

  // 從日記資料運算最新狀態
  const computeLatestStatus = () => {
    const petEntries = diaryEntries.filter(e => 
      e.pets?.some(p => p.name === currentPetName)
    );
    if (petEntries.length === 0) {
      return {
        temp: { current: '-', avg: '-', high: '-', low: '-', updatedAt: '-' },
        humid: { current: '-', avg: '-', high: '-', low: '-', updatedAt: '-' },
        bask: { value: '-', updatedAt: '-' },
        feed: { value: '-', updatedAt: '-' },
        bath: { value: '-', updatedAt: '-' },
        poop: { value: '-', updatedAt: '-' },
        weight: { value: '-', updatedAt: '-' },
        length: { value: '-', updatedAt: '-' },
      };
    }
    const latest = petEntries[0]; // 已依 date desc 排序
    const petData = latest.pets?.find(p => p.name === currentPetName);
    const temps = petEntries.map(e => parseFloat(e.pets?.find(p => p.name === currentPetName)?.temp || '0')).filter(v => v > 0);
    const humids = petEntries.map(e => parseFloat(e.pets?.find(p => p.name === currentPetName)?.humid || '0')).filter(v => v > 0);
    return {
      temp: {
        current: petData?.temp || '-',
        avg: temps.length > 0 ? (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1) : '-',
        high: temps.length > 0 ? Math.max(...temps).toString() : '-',
        low: temps.length > 0 ? Math.min(...temps).toString() : '-',
        updatedAt: latest.date || '-',
      },
      humid: {
        current: petData?.humid || '-',
        avg: humids.length > 0 ? (humids.reduce((a,b)=>a+b,0)/humids.length).toFixed(1) : '-',
        high: humids.length > 0 ? Math.max(...humids).toString() : '-',
        low: humids.length > 0 ? Math.min(...humids).toString() : '-',
        updatedAt: latest.date || '-',
      },
      bask: { value: petData?.states?.bask ? '已曬曬' : '未曬曬', updatedAt: latest.date || '-' },
      feed: { value: petData?.states?.feed ? '已餵食' : '未餵食', updatedAt: latest.date || '-' },
      bath: { value: petData?.states?.bath ? '已泡澡' : '未泡澡', updatedAt: latest.date || '-' },
      poop: { value: petData?.states?.poop ? '已排便' : '未排便', updatedAt: latest.date || '-' },
      weight: { value: latest.records?.weight || '-', updatedAt: latest.date || '-' },
      length: { value: latest.records?.length || '-', updatedAt: latest.date || '-' },
    };
  };

  const latestStatus = computeLatestStatus();

  const buildChartData = (chartName: string, period: string) => {
    const keyMap: Record<string, keyof NonNullable<DiaryDoc['records']>> = {
      '溫度變化圖': 'temp',
      '濕度變化圖': 'humid',
      '日照變化圖': 'bask',
      '泡澡變化圖': 'bath',
      '飲食變化圖': 'appetite',
      '體重變化圖': 'weight',
      '身長變化圖': 'length',
    };
    const key = keyMap[chartName];
    if (!key) return [];

    const maxPoints = period === '日' ? 7 : period === '週' ? 7 : period === '月' ? 10 : 12;
    return diaryEntries
      .filter(entry => entry.pets?.some(pet => pet.name === currentPetName))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(entry => {
        const pet = entry.pets.find(item => item.name === currentPetName);
        const fallback = key === 'temp' ? pet?.temp : key === 'humid' ? pet?.humid : undefined;
        const raw = entry.records?.[key] ?? fallback;
        const val = typeof raw === 'number' ? raw : Number.parseFloat(raw || '');
        const date = new Date(entry.date);
        return {
          label: Number.isNaN(date.getTime()) ? entry.date : `${date.getMonth() + 1}/${date.getDate()}`,
          val,
        };
      })
      .filter(point => Number.isFinite(point.val))
      .slice(-maxPoints);
  };

  const chartButtons = [
    { text: '溫度變化圖', Icon: IconTemp },
    { text: '濕度變化圖', Icon: IconHumid },
    { text: '日照變化圖', Icon: IconBask },
    { text: '泡澡變化圖', Icon: IconBath },
    { text: '飲食變化圖', Icon: IconFeed },
    { text: '體重變化圖', Icon: IconWeight },
    { text: '身長變化圖', Icon: IconLength },
    { text: '排便日曆', Icon: IconPoop },
    { text: '蛻皮日曆', Icon: IconMolt },
  ];

  return (
    <View style={styles.container}>
      {/* 開啟 scrollable，因為按鈕數量已經超過畫面高度 */}
      <BaseScreen scrollable={true} floatingAction={null}>

        {/* 透明遮罩，點擊關閉選單 */}
        {isDropdownVisible && (
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 90,
              elevation: 9,
            }}
            onPress={() => setIsDropdownVisible(false)}
          />
        )}

        {/* 第一個卡片容器：當前顯示 (包含寵物選單) */}
        <View style={[styles.cardHeader, isDropdownVisible ? { zIndex: 100 } : { zIndex: 1 }, { backgroundColor: theme.background }]}>
          <Text style={[styles.headerLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>當前顯示</Text>
          <Pressable 
            onPress={() => {
              if (availablePets.length === 0) {
                router.push('/(tabs)/pets/add?from=analytics');
              } else {
                setIsDropdownVisible(!isDropdownVisible);
              }
            }}
          >
            <Text style={[styles.headerValue, { color: theme.text, fontFamily: fontFamilyName }]}>
              {currentPetName || '未設定'}
            </Text>
          </Pressable>

          {/* 懸浮下拉選單 */}
          {isDropdownVisible && availablePets.length > 0 && (
            <View style={[styles.dropdownModal, { backgroundColor: theme.background }]}>
              <View style={styles.dropdownTail} />
              <ScrollView
                style={styles.dropdownScroll}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
              >
                {availablePets.map((pet, idx) => (
                  <Pressable
                    key={pet}
                    style={[
                      styles.dropdownItem,
                      idx === availablePets.length - 1 && { marginBottom: 0 }
                    ]}
                    onPress={() => {
                      setCurrentPetName(pet);
                      setIsDropdownVisible(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                      {pet}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 第二個卡片：最新狀態紀錄 (點擊可展開詳細卡片，常保外陰影) */}
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.background }]}
          onPress={() => setIsRecordsExpanded(!isRecordsExpanded)}
        >
          <Text style={[styles.headerLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>最新狀態紀錄</Text>
        </Pressable>

        {/* 展開的子卡片區塊 */}
        {isRecordsExpanded && (
          <View style={styles.recordsContainer}>
            {/* 溫度卡片 */}
            <View style={[styles.recordCard, { backgroundColor: theme.background }]}>
              <View style={styles.recordTitleRow}>
                <IconTemp width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>溫度</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>現在温度 {latestStatus.temp.current}</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>平均温度 {latestStatus.temp.avg}</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>今日最高温度 {latestStatus.temp.high}</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>今日最低温度 {latestStatus.temp.low}</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  {latestStatus.temp.updatedAt}</Text>
            </View>

            {/* 濕度卡片 */}
            <View style={[styles.recordCard, { backgroundColor: theme.background }]}>
              <View style={styles.recordTitleRow}>
                <IconHumid width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>濕度</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>現在濕度 {latestStatus.humid.current}</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>平均濕度 {latestStatus.humid.avg}</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>今日最高濕度 {latestStatus.humid.high}</Text>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>今日最低濕度 {latestStatus.humid.low}</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  {latestStatus.humid.updatedAt}</Text>
            </View>

            {/* 日照卡片 */}
            <View style={[styles.recordCard, { backgroundColor: theme.background }]}>
              <View style={styles.recordTitleRow}>
                <IconBask width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>日照</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>{latestStatus.bask.value}</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  {latestStatus.bask.updatedAt}</Text>
            </View>

            {/* 飲食卡片 */}
            <View style={[styles.recordCard, { backgroundColor: theme.background }]}>
              <View style={styles.recordTitleRow}>
                <IconFeed width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>飲食</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>{latestStatus.feed.value}</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  {latestStatus.feed.updatedAt}</Text>
            </View>

            {/* 泡澡卡片 */}
            <View style={[styles.recordCard, { backgroundColor: theme.background }]}>
              <View style={styles.recordTitleRow}>
                <IconBath width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>泡澡</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>{latestStatus.bath.value}</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  {latestStatus.bath.updatedAt}</Text>
            </View>

            {/* 排便卡片 */}
            <View style={[styles.recordCard, { backgroundColor: theme.background }]}>
              <View style={styles.recordTitleRow}>
                <IconPoop width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>排便</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>{latestStatus.poop.value}</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  {latestStatus.poop.updatedAt}</Text>
            </View>

            {/* 體重卡片 */}
            <View style={[styles.recordCard, { backgroundColor: theme.background }]}>
              <View style={styles.recordTitleRow}>
                <IconWeight width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>體重</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>{latestStatus.weight.value}</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  {latestStatus.weight.updatedAt}</Text>
            </View>

            {/* 身長卡片 */}
            <View style={[styles.recordCard, { backgroundColor: theme.background }]}>
              <View style={styles.recordTitleRow}>
                <IconLength width={24} height={24} color={theme.primary} style={styles.recordIcon} />
                <Text style={[styles.recordTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>身長</Text>
              </View>
              <View style={styles.recordContent}>
                <Text style={[styles.recordText, { color: theme.primary, fontFamily: fontFamilyName }]}>{latestStatus.length.value}</Text>
              </View>
              <Text style={[styles.recordFooter, { color: theme.primary, fontFamily: fontFamilyName }]}>更新時間  {latestStatus.length.updatedAt}</Text>
            </View>
          </View>
        )}

        {/* 新增的 7 個按鈕，使用新的帶外陰影卡片設計 */}
        {chartButtons.map((btn, index) => {
          const IconComponent = btn.Icon;
          const isExpanded = expandedChart === btn.text;
          
          let yAxisLabels = ['100', '80', '60', '40', '20', '0'];
          let availableTabs = ['日', '週', '月', '年'];
          
          if (btn.text === '溫度變化圖') {
            yAxisLabels = ['40', '35', '30', '25', '20', '15', '10'];
          } else if (btn.text === '濕度變化圖') {
            yAxisLabels = ['100%', '80%', '60%', '40%', '20%', '0%'];
          } else if (btn.text === '日照變化圖') {
            yAxisLabels = ['12h', '10h', '8h', '6h', '4h', '2h', '0h'];
          } else if (btn.text === '泡澡變化圖') {
            yAxisLabels = ['60m', '50m', '40m', '30m', '20m', '10m', '0m'];
          } else if (btn.text === '飲食變化圖') {
            yAxisLabels = ['好', '偏好', '普通', '偏差', '差'];
            availableTabs = ['週', '月', '年'];
          } else if (btn.text === '體重變化圖') {
            yAxisLabels = ['500g', '400g', '300g', '200g', '100g', '0g'];
            availableTabs = ['週', '月', '年']; // 拿掉日
          } else if (btn.text === '身長變化圖') {
            yAxisLabels = ['50cm', '40cm', '30cm', '20cm', '10cm', '0cm'];
            availableTabs = ['週', '月', '年']; // 拿掉日
          }

          // 如果當前的 tab 不在可用的 tabs 內，退回 '週'
          const displayTab = availableTabs.includes(activeChartTab) ? activeChartTab : '週';
          
          const currentMockData = buildChartData(btn.text, displayTab);

          // 預先計算每個點的高度比例，用於折線圖或長條圖
          const processedData = currentMockData.map((data: any) => {
            let heightPercent = 0;
            if (btn.text === '溫度變化圖') {
              heightPercent = ((data.val - 10) / 30) * 100;
            } else if (btn.text === '體重變化圖') {
              heightPercent = (data.val / 500) * 100;
            } else if (btn.text === '身長變化圖') {
              heightPercent = (data.val / 50) * 100;
            } else if (btn.text === '日照變化圖') {
              heightPercent = (data.val / 12) * 100;
            } else if (btn.text === '泡澡變化圖') {
              heightPercent = (data.val / 60) * 100;
            } else if (btn.text === '飲食變化圖') {
              heightPercent = ((data.val - 1) / 4) * 100;
            } else {
              heightPercent = data.val;
            }
            heightPercent = Math.max(0, Math.min(100, heightPercent));
            return { ...data, heightPercent };
          });

          // 如果是折線圖，準備 SVG points
          let polylinePoints = '';
          const isLineChart = btn.text === '體重變化圖' || btn.text === '身長變化圖' || btn.text === '飲食變化圖';
          if (isLineChart) {
            const len = processedData.length;
            polylinePoints = processedData.map((d, i) => {
              // X: space-around 對齊的中心點 X 座標比例
              const x = ((2 * i + 1) / (2 * len)) * 100;
              // Y: SVg viewBox 從上到下 0~100，所以 100 - heightPercent
              // 但圖表內有 margin/padding 留白 (chartBarWrapper height 85%)
              // 上下各留 7.5%? SVG 高度為 100% 蓋在 chartBarsContainer 上
              // 我們只要精準映射 0-100，因為 chartArea 是 100%。但是 X 軸標籤在裡面，我們需要微調
              // Wait, chartBarsContainer 高度是 100%，然後 xAxisLabel 是 Text。
              // 折線圖我們將 SVG 放在 chartArea 裡面。
              // Y 範圍：底部位於是 100%，對應 heightPercent=0。
              // 所以 Y = 100 - heightPercent。但為了避開 xAxisLabel，我們實際只佔用 height: 85% 的空間。
              // 我們後續將 SVG 的 bottom 設為 24 (避開文字)，這樣 viewBox 的 Y 就剛好吻合了！
              const y = 100 - d.heightPercent;
              return `${x},${y}`;
            }).join(' ');
          }
          
          return (
            <React.Fragment key={index}>
              <Pressable
                style={[
                  styles.actionButton,
                  isExpanded && {
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    marginBottom: 0,
                    elevation: 0, // 展開時取消底部陰影，與下方內容卡片相連
                  },
                  { backgroundColor: theme.background }
                ]}
                onPress={() => {
                  setExpandedChart(isExpanded ? null : btn.text);
                }}
              >
                <View style={styles.buttonContent}>
                  <IconComponent width={24} height={24} color={theme.primary} />
                  <Text style={[styles.headerLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>
                    {btn.text}
                  </Text>
                </View>
              </Pressable>

              {/* 展開後的圖表卡片區塊 */}
              {isExpanded && (
                <View style={[styles.chartCard, { backgroundColor: theme.background }]}>
                  {(btn.text === '排便日曆' || btn.text === '蛻皮日曆') ? (
                    (() => {
                      const calYear = calendarDate.getFullYear();
                      const calMonth = calendarDate.getMonth() + 1;
                      const daysInMonth = new Date(calYear, calMonth, 0).getDate();
                      const firstDayOffset = new Date(calYear, calMonth - 1, 1).getDay(); // 0:日, 1:一
                      const totalCells = daysInMonth + firstDayOffset;
                      const rows = Math.ceil(totalCells / 7);
                      
                      const today = new Date();
                      const isCurrentMonth = today.getFullYear() === calYear && today.getMonth() + 1 === calMonth;
                      const currentDay = today.getDate();

                      // 從共用資料中心取得事件日期
                      // 從日記數據計算事件日期
                      const eventDays: number[] = [];
                      const stateKey = btn.text === '排便日曆' ? 'poop' : null;
                      diaryEntries.forEach(entry => {
                        const petData = entry.pets?.find(p => p.name === currentPetName);
                        if (stateKey && petData?.states?.[stateKey]) {
                          // 解析日期字串
                          const dateMatch = entry.date?.match(/(\d{4})\/(\d{2})\/(\d{2})/);
                          if (dateMatch) {
                            const [, yr, mo, dy] = dateMatch;
                            if (parseInt(yr) === calYear && parseInt(mo) === calMonth) {
                              eventDays.push(parseInt(dy));
                            }
                          }
                        }
                      });
                      const bgColor = theme.secondary;

                      return (
                        <View style={{ paddingVertical: 16, paddingHorizontal: 8 }}>
                          {/* 月份切換列 */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 16 }}>
                            <Pressable 
                              onPress={() => setCalendarDate(new Date(calYear, calMonth - 2, 1))} 
                              style={({ pressed }) => [{ padding: 8, borderRadius: 16, opacity: pressed ? 0.5 : 1 }]}
                            >
                              <Text style={{ fontSize: getFontSize(16, 'medium'), color: theme.primary, fontFamily: fontFamilyName }}>{'< 上月'}</Text>
                            </Pressable>
                            <Text style={{ fontSize: getFontSize(18, 'medium'), fontWeight: '600', color: theme.primary, textAlign: 'center', fontFamily: fontFamilyName }}>
                              {calYear} 年 {calMonth} 月
                            </Text>
                            <Pressable 
                              onPress={() => setCalendarDate(new Date(calYear, calMonth, 1))} 
                              style={({ pressed }) => [{ padding: 8, borderRadius: 16, opacity: pressed ? 0.5 : 1 }]}
                            >
                              <Text style={{ fontSize: getFontSize(16, 'medium'), color: theme.primary, fontFamily: fontFamilyName }}>{'下月 >'}</Text>
                            </Pressable>
                          </View>

                          {/* 星期標題 */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}>
                            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                              <Text key={d} style={{ color: '#999999', fontSize: getFontSize(12, 'small'), width: 36, textAlign: 'center', fontFamily: fontFamilyName }}>{d}</Text>
                            ))}
                          </View>

                          {/* 日期網格 */}
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {Array.from({ length: rows * 7 }).map((_, i) => {
                              const dayNum = i - firstDayOffset + 1;
                              const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                              
                              // 判斷是否為未來日期
                              const isFuture = calYear > today.getFullYear() || 
                                               (calYear === today.getFullYear() && calMonth > today.getMonth() + 1) || 
                                               (calYear === today.getFullYear() && calMonth === today.getMonth() + 1 && dayNum > currentDay);
                                               
                              const hasEvent = isValid && !isFuture && eventDays.includes(dayNum);
                              const isToday = isCurrentMonth && dayNum === currentDay;

                              return (
                                <View key={i} style={{ width: '14.28%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                                  {isValid && (
                                    <View style={[
                                      { 
                                        width: 32, 
                                        height: 32, 
                                        borderRadius: 16, 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        borderWidth: 1.5,
                                        borderColor: hasEvent ? bgColor : 'transparent', // 固定 border寬度，只切換顏色
                                        backgroundColor: isToday ? '#FFF0D4' : 'transparent' // 固定屬性，只切換顏色
                                      }
                                    ]}>
                                      <Text style={[
                                        { fontSize: getFontSize(14, 'medium'), color: '#333333', fontFamily: fontFamilyName },
                                        isToday && { color: bgColor, fontWeight: 'bold' }
                                      ]}>{dayNum}</Text>
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })()
                  ) : (
                    <>
                      {/* 圖表實作： Segmented Control */}
                  <View style={styles.chartTabsRow}>
                    {availableTabs.map((tab) => (
                      <Pressable
                        key={tab}
                        style={[styles.chartTab, displayTab === tab && [styles.chartTabActive, { backgroundColor: theme.panelBackground }]]}
                        onPress={() => setActiveChartTab(tab)}
                      >
                        <Text style={[styles.chartTabText, { color: theme.primary, fontFamily: fontFamilyName }]}>{tab}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* 圖表主體與 Y 軸外框 */}
                  <View style={styles.chartMainContainer}>
                    {/* 左側 Y 軸標籤 */}
                    <View style={styles.yAxisContainer}>
                      {yAxisLabels.map((val, i) => (
                        <Text key={i} style={[styles.yAxisLabel, { color: theme.primary }, { fontFamily: fontFamilyName }]}>{val}</Text>
                      ))}
                    </View>

                    {/* 圖表主體 */}
                    <View style={styles.chartArea}>
                      {/* 背景水平格線 */}
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 24 }}>
                        {yAxisLabels.map((_, i) => (
                          <View key={i} style={[styles.chartGridLine, { borderColor: theme.primary, top: `${(i / (yAxisLabels.length - 1)) * 100}%` }]} />
                        ))}
                      </View>
                      
                      {/* 背景垂直格線 (與 X 軸對齊) */}
                      {processedData.map((_: any, i: number) => (
                        <View key={`v-${i}`} style={[styles.chartGridLineVertical, { borderColor: theme.primary, left: `${((2 * i + 1) / (2 * processedData.length)) * 100}%` }]} />
                      ))}
                      
                      {/* 圖表內容區：長條圖 或 折線圖 */}
                      <View style={styles.chartBarsContainer}>
                        {isLineChart && (
                          <Svg 
                            width="100%" 
                            height="100%"
                            viewBox="0 0 100 100" 
                            preserveAspectRatio="none" 
                            style={{ position: 'absolute', top: 0, bottom: 24, left: 0, right: 0 }}
                          >
                            <Polyline 
                              points={polylinePoints} 
                              fill="none" 
                              stroke={theme.primary} 
                              strokeWidth="2" 
                              vectorEffect="non-scaling-stroke" 
                            />
                          </Svg>
                        )}

                        {processedData.map((data: any, idx: number) => {
                          return (
                            <View key={idx} style={styles.chartBarCol}>
                              <View style={[styles.chartBarWrapper, isLineChart && { backgroundColor: 'transparent', boxShadow: 'none', overflow: 'visible' }, !isLineChart && { backgroundColor: theme.panelBackground }]}>
                                 {isLineChart ? (
                                   // 折線圖的圓點
                                     <>
                                       <View 
                                         style={{
                                           width: 10,
                                           height: 10,
                                           borderRadius: 5,
                                           backgroundColor: theme.background,
                                           borderWidth: 2,
                                           borderColor: theme.primary,
                                           position: 'absolute',
                                           bottom: `${data.heightPercent}%`,
                                           marginBottom: -5 // 對齊圓心
                                         }}
                                       />
                                       <Text style={{
                                         position: 'absolute',
                                         bottom: `${data.heightPercent}%`, 
                                         transform: [{ translateY: 20 }], // 向下位移
                                         color: theme.primary,
                                         fontSize: getFontSize(12, 'small'),
                                         fontFamily: fontFamilyName,
                                         textAlign: 'center',
                                         width: 40,
                                         left: -15,
                                       }}>
                                         {data.val}
                                       </Text>
                                     </>
                                 ) : (
                                   // 一般的長條圖
                                   <View 
                                     style={[
                                       styles.chartBarFilled, 
                                       { height: `${data.heightPercent}%`, backgroundColor: theme.primary },
                                       data.isAbnormal === 'high' && { backgroundColor: '#FF3B30' },
                                       data.isAbnormal === 'low' && { backgroundColor: '#32ADE6' }
                                     ]} 
                                   />
                                 )}
                              </View>
                              <Text style={[styles.xAxisLabel, { color: theme.primary }, { fontFamily: fontFamilyName }]}>{data.label}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </>
              )}

                  {/* 底部按鈕 */}
                  <Pressable 
                    style={[styles.chartFooterButton, { backgroundColor: theme.background, borderColor: 'transparent', shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 7, elevation: 4 }]}
                    onPress={() => Alert.alert('版本範圍', '詳細數據清單與報表排入 0.2.0；0.1.0 先提供趨勢圖與核心照護數據。')}
                  >
                    <Text style={[styles.chartFooterButtonText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                      {btn.text.includes('變化圖') ? `查看${btn.text.replace('變化圖', '')}詳細數據` : `查看${btn.text.replace('日曆', '')}詳細紀錄`}
                    </Text>
                  </Pressable>
                </View>
              )}
            </React.Fragment>
          );
        })}

      </BaseScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cardHeader: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: '#FFFEFA',
    borderRadius: 16,
    height: 55,
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: 'inset 2px 2px 7px rgba(0, 0, 0, 0.25)',
  },
  actionButton: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: '#FFFEFA',
    borderRadius: 16,
    height: 55,
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  headerLabel: {
    fontSize: getFontSize(18, 'medium'),
  },
  headerValue: {
    fontSize: getFontSize(18, 'medium'),
  },
  dropdownModal: {
    position: 'absolute',
    top: 55,
    right: 4,
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  dropdownTail: {
    display: 'none',
  },
  dropdownScroll: {
    maxHeight: 280,
  },
  dropdownItem: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    marginHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: getFontSize(18, 'medium'),
    fontWeight: '600',
    letterSpacing: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordsContainer: {
    width: '100%',
    paddingBottom: 8,
  },
  recordCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: '#FFFEFA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  recordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordIcon: {
    marginRight: 8,
  },
  recordTitle: {
    fontSize: getFontSize(18, 'medium'),
  },
  recordContent: {
    paddingLeft: 32,
    marginBottom: 16,
    gap: 6,
  },
  recordText: {
    fontSize: getFontSize(16, 'medium'),
  },
  recordFooter: {
    paddingLeft: 32,
    fontSize: getFontSize(16, 'medium'),
  },

  // ===== 圖表展開卡片樣式 =====
  chartCard: {
    width: '96%',
    alignSelf: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 24,
    paddingTop: 16,
    marginBottom: 16,
    boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.25), inset -2px -2px 4px rgba(255, 255, 255, 0.2)',
  },
  chartTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  chartTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  chartTabActive: {
    boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.25), inset -2px -2px 4px rgba(255, 255, 255, 0.25)',
  },
  chartTabText: {
    fontSize: getFontSize(16, 'medium'),
    color: '#999999',
  },
  chartTabTextActive: {
    // 讓其跟隨 theme.primary（此屬性改為使用 inline style 處理較佳，但若定義在這可用 transparent 避免覆蓋）
  },
  chartMainContainer: {
    flexDirection: 'row',
    height: 200, // 增加一點高度容納 X 軸文字
    marginBottom: 24,
  },
  yAxisContainer: {
    width: 45, // 加寬以容納 '100%' 等標籤，避免斷行
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingBottom: 24, // 預留空間給 X 軸，與長條圖對齊
    marginTop: -7, // 向上位移半行高，讓文字垂直中心精準對齊格線
  },
  yAxisLabel: {
    fontSize: getFontSize(13, 'medium'), // 稍微放大一點點提升辨識度
    color: '#999999',
    lineHeight: 14, // 調整行高讓文字更居中舒適
    textAlign: 'right', // 確保文字靠右對齊
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  chartGridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 24, // 預留給 X 軸的空間
    width: 1,
    borderRightWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  chartBarsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 0,
  },
  chartBarCol: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarWrapper: {
    width: 10, // 模擬 SVG 細長條
    flex: 1, // 自動填滿剩餘高度 (取代原本的 85%)，讓長條能完美頂到最上方 100% 處
    borderRadius: 5,
    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.15)', // 空白進度條內陰影
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8, // 距離下方文字的空間
  },
  chartBarFilled: {
    width: '100%',
    borderRadius: 5,
  },
  xAxisLabel: {
    fontSize: getFontSize(12, 'medium'),
    color: '#999999',
    height: 16,
  },
  chartFooterButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFAA1E',
  },
  chartFooterButtonText: {
    color: '#FFAA1E',
    fontSize: getFontSize(16, 'medium'),
  },
});

