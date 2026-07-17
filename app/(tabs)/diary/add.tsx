import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Animated, View, Text, StyleSheet, Pressable, ScrollView, Image, TextInput, Alert, Modal, PanResponder } from 'react-native';
import { useTheme } from '../../../src/theme/ThemeContext';
import { getThemeTokens } from '../../../src/theme/themeSettings';
import { getFontSize } from '../../../src/theme/typographySettings';
import { FloatingActionBar } from '../../../src/components/FloatingActionBar';
import { BaseScreen } from '../../../src/components/common/BaseScreen';
import Slider from '@react-native-community/slider';
import { useAuth } from '../../../src/contexts/AuthContext';
import { diaryService, petService, DiaryDoc, PetDoc } from '../../../src/services/firestoreService';
import { createImageVariants, IMAGE_POLICY } from '../../../src/services/imageService';
import * as ImagePicker from 'expo-image-picker';
import { sensorService } from '../../../src/services/sensorService';
import { usePetSnapshot } from '../../../src/contexts/PetSnapshotContext';
import DatePickerModal from '../../../src/components/DatePickerModal';
import { getWeatherOption, WEATHER_OPTIONS } from '../../../src/data/weatherOptions';
import { formatDiaryDate, normalizeDiaryDate, parseDiaryDate, toDiaryDateKey } from '../../../src/utils/diaryDate';
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
import IconDiaryWrite from '../../../assets/icons/icon-diary.svg';

type SelectedAttachment = { uri?: string; name: string; mimeType?: string; url?: string };
type SelectedDiaryImage = { key: string; uri: string; thumbnailUrl?: string };

type DraggableDiaryImageProps = {
  image: SelectedDiaryImage;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  onDragStateChange: (isDragging: boolean) => void;
};

function DraggableDiaryImage({ image, index, total, onMove, onRemove, onDragStateChange }: DraggableDiaryImageProps) {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const dragArmed = React.useRef(false);
  const responderClaimed = React.useRef(false);

  const finishDrag = React.useCallback((dx: number) => {
    const target = Math.max(0, Math.min(total - 1, index + Math.round(dx / 72)));
    if (target !== index) onMove(index, target);
    dragArmed.current = false;
    responderClaimed.current = false;
    onDragStateChange(false);
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
  }, [index, onDragStateChange, onMove, total, translateX]);

  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => dragArmed.current && Math.abs(gesture.dx) > 4,
    onPanResponderGrant: () => {
      responderClaimed.current = true;
    },
    onPanResponderMove: (_, gesture) => translateX.setValue(gesture.dx),
    onPanResponderRelease: (_, gesture) => finishDrag(gesture.dx),
    onPanResponderTerminate: (_, gesture) => finishDrag(gesture.dx),
    onPanResponderTerminationRequest: () => false,
  }), [finishDrag, translateX]);

  return (
    <Animated.View
      style={[styles.diaryImagePreviewWrapper, { transform: [{ translateX }], zIndex: dragArmed.current ? 10 : 0 }]}
      {...panResponder.panHandlers}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        delayLongPress={300}
        onLongPress={() => {
          dragArmed.current = true;
          onDragStateChange(true);
        }}
        onPressOut={() => {
          if (!responderClaimed.current) {
            dragArmed.current = false;
            onDragStateChange(false);
          }
        }}
      >
        <Image source={{ uri: image.thumbnailUrl || image.uri }} style={styles.diaryImagePreview} />
        <Image source={require('../../../assets/icons/icon-drag.png')} style={styles.diaryImageDragHandle} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="刪除這張照片" style={styles.diaryImageRemoveBadge} onPress={onRemove}>
        <Text style={styles.diaryImageRemoveText}>×</Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * 新增日記頁面
 * 包含：照片區域、寵物標籤選擇、日期/天氣、標題編輯、數據紀錄、寫日記與上傳按鈕
 */
export default function AddDiaryScreen() {
  const router = useRouter();
  const { id, ownerId } = useLocalSearchParams<{ id?: string; ownerId?: string }>();
  const isEditing = !!id;
  const { themeId, fontFamilyName } = useTheme();
  const theme = getThemeTokens(themeId);
  const { user } = useAuth();
  const { snapshot } = usePetSnapshot();

  // 色彩定義
  const labelColor = theme.primary;           // 色票/主色 用於標籤文字（溫度：、濕度：等）
  const valueColor = theme.accentHot;    // 顏色/標準色/輔色-烈日 用於可編輯數據
  const titleValueColor = theme.primary;
  const titlePlaceholderColor = theme.accentHot;

  // 寵物選單狀態
  const [petDocuments, setPetDocuments] = useState<(PetDoc & { id: string })[]>([]);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [isPetDropdownVisible, setIsPetDropdownVisible] = useState(false);

  // 可編輯欄位
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [diaryContent, setDiaryContent] = useState('');
  const [isDiaryExpanded, setIsDiaryExpanded] = useState(false);
  const [diaryImages, setDiaryImages] = useState<SelectedDiaryImage[]>([]);
  const originalDiaryImageUrlsRef = React.useRef<string[]>([]);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [attachments, setAttachments] = useState<SelectedAttachment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [contentInputHeight, setContentInputHeight] = useState(44);
  const [appetite, setAppetite] = useState(0); // 食慾狀態，預設 0 (未檢測)
  const [poopState, setPoopState] = useState('無'); // 排便狀態，預設 '無'
  const [moltState, setMoltState] = useState('無');
  const [feedState, setFeedState] = useState('無'); // 飲食狀態，預設 '無'
  const [baskMinutes, setBaskMinutes] = useState('');
  const [bathMinutes, setBathMinutes] = useState('');

  const [temp, setTemp] = useState('-');
  const [humid, setHumid] = useState('-');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [hasIotDevice, setHasIotDevice] = useState(false);
  const [baskActive, setBaskActive] = useState(false);
  const [feedActive, setFeedActive] = useState(false);
  const [bathActive, setBathActive] = useState(false);
  const [poopActive, setPoopActive] = useState(false);
  const [moltActive, setMoltActive] = useState(false);
  const weightDirtyRef = React.useRef(false);
  const lengthDirtyRef = React.useRef(false);

  // 預設帶入當日日期
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(formatDiaryDate(new Date()));
  const [dateKey, setDateKey] = useState(toDiaryDateKey(new Date()));
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [weatherIcon, setWeatherIcon] = useState('weather-sunny');
  const [isWeatherPickerVisible, setIsWeatherPickerVisible] = useState(false);

  const selectedPetDocuments = selectedPetIds
    .map(petId => petDocuments.find(pet => pet.id === petId))
    .filter((pet): pet is PetDoc & { id: string } => Boolean(pet));

  const currentOwnerGroup = selectedPetDocuments[0]?.ownerId
    || petDocuments.find(pet => (pet.ownerId || user?.uid) === user?.uid)?.ownerId
    || petDocuments[0]?.ownerId
    || user?.uid;
  const ownerGroupPets = petDocuments.filter(pet => (pet.ownerId || user?.uid) === currentOwnerGroup);
  const allOwnerGroupPetsSelected = ownerGroupPets.length > 0
    && ownerGroupPets.every(pet => selectedPetIds.includes(pet.id));

  React.useEffect(() => {
    if (!user) return;
    let active = true;

    const load = async () => {
      const pets = await petService.getAll(user.uid);
      const writablePets = pets.filter(p => {
        const myRole = p.coParents?.find(cp => cp.uid === user.uid);
        return (p.ownerId || user.uid) === user.uid
          || Boolean(p.editorIds?.includes(user.uid))
          || Boolean(myRole && (myRole.isMainOwner || myRole.permission !== 'view'));
      });
      if (!active) return;
      setPetDocuments(writablePets);

      if (!isEditing && writablePets.length > 0) {
        const defaultPet = writablePets.find(p => p.id === snapshot?.petId) || writablePets[0];
        setSelectedPetIds([defaultPet.id]);
      } else if (!isEditing && writablePets.length === 0) {
        router.replace('/(tabs)/pets');
        return;
      }

      if (isEditing && id && typeof id === 'string') {
        const doc = await diaryService.getById(ownerId || user.uid, id);
        if (active && doc) {
          setTitle(doc.title === '標題' ? '' : (doc.title || ''));
          setDiaryContent(doc.content || '');
          setIsDiaryExpanded(!!doc.content);
          const existingImages = doc.imageUrls?.length ? doc.imageUrls : (doc.imageUrl ? [doc.imageUrl] : []);
          const existingThumbnails = doc.thumbnailUrls?.length
            ? doc.thumbnailUrls
            : (doc.thumbnailUrl ? [doc.thumbnailUrl] : []);
          originalDiaryImageUrlsRef.current = Array.from(new Set([
            ...existingImages,
            ...existingThumbnails,
          ].filter(Boolean)));
          setDiaryImages(existingImages.map((uri, index) => ({
            key: `remote-${index}-${uri}`,
            uri,
            thumbnailUrl: existingThumbnails[index],
          })));
          setAttachments((doc.attachments || []).map(file => ({ ...file })));
          setWeatherIcon(doc.weatherIcon || 'weather-sunny');
          const normalizedDate = normalizeDiaryDate(doc.date) || toDiaryDateKey(new Date());
          setDateKey(normalizedDate);
          const dDate = parseDiaryDate(normalizedDate);
          if (dDate) {
            setSelectedDate(dDate);
            setCurrentDate(formatDiaryDate(dDate));
          }

          if (doc.pets && doc.pets.length > 0) {
            const resolvedPetIds = (doc.petIds?.length ? doc.petIds : doc.pets.map(entry => (
              entry.petId || writablePets.find(pet => pet.name === entry.name)?.id
            ))).filter((petId): petId is string => Boolean(petId));
            setSelectedPetIds(resolvedPetIds);
            const primaryPet = doc.pets[0];
            setBaskActive(Boolean(primaryPet.states?.bask || Number.parseFloat(doc.records?.bask || '') > 0));
            setFeedActive(Boolean(primaryPet.states?.feed || (doc.records?.feed && doc.records.feed !== '無')));
            setBathActive(Boolean(primaryPet.states?.bath || Number.parseFloat(doc.records?.bath || '') > 0));
            setPoopActive(Boolean(primaryPet.states?.poop || doc.records?.poop === '有'));
            setMoltActive(Boolean(primaryPet.states?.molt || doc.records?.molt === '有'));
            const savedTemp = doc.records?.temp;
            const savedHumid = doc.records?.humid;
            setTemp(savedTemp && savedTemp !== '-' ? savedTemp : (primaryPet.temp || '-'));
            setHumid(savedHumid && savedHumid !== '-' ? savedHumid : (primaryPet.humid || '-'));
          }
          if (doc.records) {
            if (doc.records.weight !== undefined) setWeight(doc.records.weight);
            if (doc.records.length !== undefined) setLength(doc.records.length);
            if (doc.records.bask !== undefined) setBaskMinutes(doc.records.bask);
            if (doc.records.bath !== undefined) setBathMinutes(doc.records.bath);
            if (doc.records.poop !== undefined) setPoopState(doc.records.poop);
            if (doc.records.molt !== undefined) setMoltState(doc.records.molt);
            if (doc.records.feed !== undefined) setFeedState(doc.records.feed);
            if (doc.records.appetite !== undefined) setAppetite(doc.records.appetite);
          }
        }
      }
    };

    void load().catch(error => {
      if (active) Alert.alert('讀取失敗', error instanceof Error ? error.message : '無法讀取日記資料。');
    });
    return () => { active = false; };
  }, [user, isEditing, id, ownerId, snapshot?.petId]);

  React.useEffect(() => {
    const selectedPet = petDocuments.find(pet => pet.id === selectedPetIds[0]);
    if (!selectedPet) return;

    let active = true;
    const hydrateSnapshot = async () => {
      const sensorId = await sensorService.resolveSensorId(selectedPet, petDocuments);
      if (!active) return;
      setHasIotDevice(Boolean(sensorId));
      if (isEditing) return;

      if (snapshot?.petId === selectedPet.id) {
        setTemp(snapshot.temp);
        setHumid(snapshot.humid);
        setBaskActive(snapshot.states.bask);
        setFeedActive(snapshot.states.feed);
        setBathActive(snapshot.states.bath);
        setPoopActive(snapshot.states.poop);
        return;
      }

      if (!sensorId) {
        setTemp('-');
        setHumid('-');
        setBaskActive(false);
        setFeedActive(false);
        setBathActive(false);
        setPoopActive(false);
        return;
      }

      const data = await sensorService.getSensorData(sensorId);
      if (!active) return;
      setTemp(data ? data.temperature.toFixed(1) : '-');
      setHumid(data ? data.humidity.toFixed(0) : '-');
    };

    void hydrateSnapshot().catch(() => {
      if (!isEditing && active) {
        setTemp('-');
        setHumid('-');
      }
    });
    return () => { active = false; };
  }, [isEditing, petDocuments, selectedPetIds, snapshot]);

  React.useEffect(() => {
    if (!user || isEditing) return;
    if (selectedPetIds.length !== 1) {
      weightDirtyRef.current = false;
      lengthDirtyRef.current = false;
      setWeight('');
      setLength('');
      return;
    }
    const petId = selectedPetIds[0];
    const selectedPet = petDocuments.find(pet => pet.id === petId);
    if (!selectedPet) return;

    let active = true;
    weightDirtyRef.current = false;
    lengthDirtyRef.current = false;
    setWeight('');
    setLength('');

    void diaryService.getAll(user.uid).then(entries => {
      if (!active) return;
      const matchesPet = (entry: DiaryDoc) => entry.petIds?.includes(petId)
        || entry.pets?.some((pet, index) => pet.petId === petId
          || (!pet.petId && entry.petIds?.[index] === petId)
          || (!pet.petId && pet.name === selectedPet.name));
      const relevant = entries.filter(matchesPet).sort((a, b) => (
        (parseDiaryDate(b.date)?.getTime() || 0) - (parseDiaryDate(a.date)?.getTime() || 0)
      ));
      const previousWeight = relevant.find(entry => {
        const value = entry.records?.weight?.trim();
        return value && value !== '0';
      })?.records?.weight || '';
      const previousLength = relevant.find(entry => {
        const value = entry.records?.length?.trim();
        return value && value !== '0';
      })?.records?.length || '';
      if (!weightDirtyRef.current) setWeight(previousWeight);
      if (!lengthDirtyRef.current) setLength(previousLength);
    }).catch(() => undefined);

    return () => { active = false; };
  }, [isEditing, petDocuments, selectedPetIds, user]);

  const togglePet = (petId: string) => {
    const pet = petDocuments.find(item => item.id === petId);
    if (!pet) return;
    setSelectedPetIds(current => {
      if (current.includes(petId)) return current.filter(idValue => idValue !== petId);
      const currentPet = petDocuments.find(item => item.id === current[0]);
      const currentOwner = currentPet?.ownerId || user?.uid;
      const nextOwner = pet.ownerId || user?.uid;
      return current.length > 0 && currentOwner !== nextOwner ? [petId] : [...current, petId];
    });
  };

  const toggleAllPets = () => {
    setSelectedPetIds(allOwnerGroupPetsSelected ? [] : ownerGroupPets.map(pet => pet.id));
  };

  const recordItems = [
    { icon: IconTemp, label: '溫度', value: temp },
    { icon: IconHumid, label: '濕度', value: humid },
    { icon: IconBask, label: '日照', value: baskMinutes },
    { icon: IconFeed, label: '飲食', value: feedState },
    { icon: IconBath, label: '泡澡', value: bathMinutes },
    { icon: IconPoop, label: '排便', value: poopState },
    { icon: IconMolt, label: '蛻皮', value: moltState },
    { icon: IconWeight, label: '體重', value: weight },
    { icon: IconLength, label: '身長', value: length },
  ];

  const moveDiaryImage = React.useCallback((from: number, to: number) => {
    setDiaryImages(current => {
      if (from === to || !current[from] || to < 0 || to >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const pickDiaryImages = async () => {
    if (diaryImages.length >= IMAGE_POLICY.diaryImageLimit) {
      Alert.alert('圖片已達上限', `最多上傳 ${IMAGE_POLICY.diaryImageLimit} 張圖片。`);
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('需要相簿權限', '請允許蜥日日記讀取相簿，才能加入日記照片。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: IMAGE_POLICY.diaryImageLimit - diaryImages.length,
      quality: 1,
    });
    if (!result.canceled) {
      const remaining = IMAGE_POLICY.diaryImageLimit - diaryImages.length;
      const acceptedAssets: SelectedDiaryImage[] = [];
      const rejectedMessages: string[] = [];
      for (let index = 0; index < Math.min(result.assets.length, remaining); index += 1) {
        const asset = result.assets[index];
        try {
          const variants = await createImageVariants(asset.uri);
          acceptedAssets.push({
            key: `local-${Date.now()}-${asset.assetId || index}`,
            uri: variants.displayUri,
            thumbnailUrl: variants.thumbnailUri,
          });
        } catch (error) {
          rejectedMessages.push(error instanceof Error ? error.message : '圖片無法處理');
        }
      }
      setDiaryImages(current => [
        ...current,
        ...acceptedAssets,
      ].slice(0, IMAGE_POLICY.diaryImageLimit));
      if (result.assets.length > remaining) {
        Alert.alert('圖片已達上限', `最多上傳 ${IMAGE_POLICY.diaryImageLimit} 張圖片。`);
      } else if (rejectedMessages.length > 0) {
        Alert.alert('部分圖片未加入', rejectedMessages[0]);
      }
    }
  };

  const handleSave = async () => {
    if (!user || isSaving) return;
    if (selectedPetIds.length === 0 || selectedPetDocuments.length !== selectedPetIds.length) {
      Alert.alert('提示', '請至少選擇一隻寵物。');
      return;
    }

    const selectedOwners = Array.from(new Set(selectedPetDocuments.map(pet => pet.ownerId || user.uid)));
    if (selectedOwners.length > 1) {
      Alert.alert('請分開建立日記', '為避免共育資料跨飼主混在一起，同一篇日記只能選擇相同主人的寵物。');
      return;
    }

    const targetOwnerId = isEditing ? ownerId || user.uid : selectedOwners[0] || user.uid;
    const hasSinglePet = selectedPetDocuments.length === 1;
    const remoteDiaryImages = diaryImages.filter(image => image.uri.startsWith('http'));
    const originalRemoteImageUrls = [...originalDiaryImageUrlsRef.current];
    const remoteAttachments = attachments
      .filter(file => file.url)
      .map(file => ({ name: file.name, url: file.url as string, mimeType: file.mimeType }));
    const newData: Omit<DiaryDoc, 'id'> = {
      status: 'published',
      date: dateKey,
      title: title.trim(),
      weatherIcon,
      content: diaryContent.trim() ? diaryContent : '',
      imageUrl: remoteDiaryImages[0]?.uri || null,
      thumbnailUrl: remoteDiaryImages[0]?.thumbnailUrl || null,
      imageUrls: remoteDiaryImages.map(image => image.uri),
      thumbnailUrls: remoteDiaryImages.map(image => image.thumbnailUrl || ''),
      attachments: remoteAttachments,
      petIds: selectedPetIds,
      pets: selectedPetDocuments.map(pet => ({
        petId: pet.id,
        name: pet.name,
        temp: hasSinglePet ? temp : '-',
        humid: hasSinglePet ? humid : '-',
        states: {
          bask: baskActive,
          feed: feedActive,
          bath: bathActive,
          poop: poopActive,
          molt: moltActive,
        },
      })),
      records: {
        temp: hasSinglePet ? temp : '',
        humid: hasSinglePet ? humid : '',
        weight: hasSinglePet ? weight : '',
        length: hasSinglePet ? length : '',
        bask: baskMinutes,
        bath: bathMinutes,
        poop: poopState,
        molt: moltState,
        feed: feedState,
        appetite,
      },
    };

    setIsSaving(true);
    let createdDiaryId: string | null = null;
    try {
      const diaryId = isEditing && typeof id === 'string'
        ? id
        : await diaryService.add(targetOwnerId, newData);
      if (!isEditing) createdDiaryId = diaryId;

      const uploadedImages: { imageUrl: string; thumbnailUrl: string }[] = [];
      for (let index = 0; index < diaryImages.length; index += 1) {
        const image = diaryImages[index];
        uploadedImages.push(image.uri.startsWith('http')
          ? { imageUrl: image.uri, thumbnailUrl: image.thumbnailUrl || image.uri }
          : await diaryService.uploadImage(targetOwnerId, diaryId, image.uri, index, user.uid));
      }

      await diaryService.update(targetOwnerId, diaryId, {
        ...newData,
        imageUrl: uploadedImages[0]?.imageUrl || null,
        thumbnailUrl: uploadedImages[0]?.thumbnailUrl || null,
        imageUrls: uploadedImages.map(image => image.imageUrl),
        thumbnailUrls: uploadedImages.map(image => image.thumbnailUrl),
        attachments: remoteAttachments,
      });
      if (isEditing) {
        const retainedUrls = uploadedImages.flatMap(image => [image.imageUrl, image.thumbnailUrl]);
        await diaryService.pruneImages(targetOwnerId, diaryId, retainedUrls).catch(() => undefined);
      }

      if (isEditing) {
        router.navigate({ pathname: '/(tabs)/diary/view', params: { id: diaryId, ownerId: targetOwnerId } });
      } else {
        router.navigate('/(tabs)/diary');
      }
    } catch (error) {
      if (createdDiaryId) {
        try {
          await diaryService.rollbackCreate(targetOwnerId, createdDiaryId);
        } catch {
          // rollbackCreate 會優先刪除文件；此處保留原始錯誤給使用者。
        }
      } else if (isEditing && typeof id === 'string') {
        // 編輯上傳中途失敗時，文件仍指向原圖；移除本次未被引用的新檔。
        await diaryService.pruneImages(targetOwnerId, id, originalRemoteImageUrls).catch(() => undefined);
      }
      Alert.alert('錯誤', error instanceof Error
        ? error.message
        : '日記儲存或附件上傳失敗，請確認網路後再試。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseScreen
      scrollable={false}
      floatingAction={
        <FloatingActionBar
          actions={[
            { id: 'back', onPress: () => {
              if (isEditing && id) {
                router.navigate({ pathname: '/(tabs)/diary/view', params: { id, ownerId } });
              } else {
                router.navigate('/(tabs)/diary');
              }
            }},
            { id: 'confirm', onPress: handleSave },
          ]}
        />
      }
    >
      <View style={{ flex: 1 }}>
        {/* 背景點擊攔截 */}
        {isPetDropdownVisible && (
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 900, backgroundColor: 'transparent' }]}
            onPress={() => setIsPetDropdownVisible(false)}
          />
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isDraggingImage}
        >
          {/* ===== 卡片一：照片 + 寵物標籤 + 日期資訊 ===== */}
          <View style={[styles.mainCard, { backgroundColor: theme.background }]}>
            {/* 照片區域 */}
            <View style={[styles.photoArea, { backgroundColor: theme.accentNoon }]}>
              {diaryImages[0] ? <Image source={{ uri: diaryImages[0].uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
              {/* 新增照片按鈕 */}
              {diaryImages.length === 0 && <Pressable style={styles.addPhotoButton} onPress={pickDiaryImages}>
                <Image
                  source={require('../../../assets/icons/icon-image.png')}
                  style={[styles.addPhotoIcon, { tintColor: '#FFFFFF' }]}
                />
              </Pressable>}

              {/* 寵物標籤（浮動在照片底部左側） */}
              <View style={[styles.petTagsContainer, { zIndex: 1000 }]}>
                <Pressable onPress={() => setIsPetDropdownVisible(!isPetDropdownVisible)}>
                  {(selectedPetDocuments.length > 0 ? selectedPetDocuments : [null]).map((pet, idx) => (
                    <View key={pet?.id || `empty-${idx}`} style={[styles.petTag, { backgroundColor: theme.accentDawn }]}>
                      <Text style={[styles.petTagText, { color: theme.primary, fontFamily: fontFamilyName }]}>{pet?.name || '選擇寵物'}</Text>
                    </View>
                  ))}
                </Pressable>

                {/* 寵物選擇下拉選單 */}
                {isPetDropdownVisible && (
                  <View style={[styles.petDropdownModal, { backgroundColor: theme.background }]}>
                    <ScrollView
                      style={styles.petDropdownScroll}
                      showsVerticalScrollIndicator={false}
                      bounces={false}
                    >
                      <Pressable
                        style={[
                          styles.petDropdownItem,
                          allOwnerGroupPetsSelected && { backgroundColor: 'rgba(255, 195, 0, 0.3)', borderWidth: 1.5, borderColor: theme.accentHot },
                        ]}
                        onPress={toggleAllPets}
                      >
                        <Text style={[styles.petDropdownItemText, { color: theme.primary, fontFamily: fontFamilyName }]}>全部</Text>
                      </Pressable>
                      {petDocuments.map((pet, idx) => (
                        <Pressable
                          key={pet.id}
                          style={[
                            styles.petDropdownItem,
                            selectedPetIds.includes(pet.id) && { backgroundColor: 'rgba(255, 195, 0, 0.3)', borderWidth: 1.5, borderColor: theme.accentHot },
                            idx === petDocuments.length - 1 && { marginBottom: 0 },
                          ]}
                          onPress={() => togglePet(pet.id)}
                        >
                          <Text style={[styles.petDropdownItemText, { color: theme.primary, fontFamily: fontFamilyName }]}>
                            {pet.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {diaryImages.length > 0 && <View style={styles.diaryImageSection}>
              <ScrollView horizontal scrollEnabled={!isDraggingImage} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.diaryImageStrip}>
                {diaryImages.map((image, index) => (
                  <DraggableDiaryImage
                    key={image.key}
                    image={image}
                    index={index}
                    total={diaryImages.length}
                    onMove={moveDiaryImage}
                    onRemove={() => setDiaryImages(current => current.filter(item => item.key !== image.key))}
                    onDragStateChange={setIsDraggingImage}
                  />
                ))}
                <Pressable accessibilityRole="button" accessibilityLabel="新增日記照片" style={[styles.diaryImageAddButton, { borderColor: theme.primary }]} onPress={pickDiaryImages}>
                  <Text style={[styles.diaryImageAddText, { color: theme.primary }]}>＋</Text>
                  <Text style={[styles.diaryImageAddLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>add</Text>
                </Pressable>
              </ScrollView>
            </View>}

            {/* 資訊區域：日期 + 標題 + 數據列 */}
            <View style={styles.infoContainer}>
              {/* 日期 + 天氣 */}
              <View style={styles.dateRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="更改日記日期"
                  onPress={() => setIsDatePickerVisible(true)}
                >
                  <Text style={[styles.dateText, { color: titleValueColor, fontFamily: fontFamilyName }]}>{currentDate}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="更改天氣"
                  onPress={() => setIsWeatherPickerVisible(true)}
                >
                  <Image
                    source={getWeatherOption(weatherIcon).source}
                    style={[styles.weatherIcon, { tintColor: titleValueColor }]}
                  />
                </Pressable>
              </View>

              {/* 標題（可編輯，與寫日記卡片連動） */}
              {isEditingTitle ? (
                <TextInput
                  style={[styles.titleInput, { color: titleValueColor, fontFamily: fontFamilyName }]}
                  value={title}
                  onChangeText={setTitle}
                  onBlur={() => setIsEditingTitle(false)}
                  placeholder="標題"
                  placeholderTextColor={titlePlaceholderColor}
                  autoFocus
                  selectTextOnFocus
                />
              ) : (
                <Pressable onPress={() => setIsEditingTitle(true)}>
                  <Text style={[styles.titleText, { color: title ? titleValueColor : titlePlaceholderColor, fontFamily: fontFamilyName }]}>
                    {title || '標題'}
                  </Text>
                </Pressable>
              )}

              {/* 簡化數據列（溫度 + 濕度 + 狀態圖標） */}
              <View style={styles.metricRow}>
                {(hasIotDevice || (isEditing && (temp !== '-' || humid !== '-'))) && (
                  <>
                    <Text style={[styles.metricText, { color: valueColor, fontFamily: fontFamilyName }]}>{temp}℃</Text>
                    <Text style={[styles.metricText, { color: valueColor, fontFamily: fontFamilyName }]}>{humid}%</Text>
                  </>
                )}
                <View style={styles.metricIconsBlock}>
                  <Pressable style={styles.stateIconButton} accessibilityRole="button" accessibilityLabel="切換日照狀態" onPress={() => setBaskActive(value => !value)}>
                    <Image source={baskActive ? require('../../../assets/icons/category-basking-active.png') : require('../../../assets/icons/category-basking-default.png')} style={[styles.stateIcon, { tintColor: baskActive ? theme.primary : valueColor + '60' }]} />
                  </Pressable>
                  <Pressable style={styles.stateIconButton} accessibilityRole="button" accessibilityLabel="切換飲食狀態" onPress={() => setFeedActive(value => !value)}>
                    <Image source={feedActive ? require('../../../assets/icons/category-food-active.png') : require('../../../assets/icons/category-food-default.png')} style={[styles.stateIcon, { tintColor: feedActive ? theme.primary : valueColor + '60' }]} />
                  </Pressable>
                  <Pressable style={styles.stateIconButton} accessibilityRole="button" accessibilityLabel="切換泡澡狀態" onPress={() => setBathActive(value => !value)}>
                    <Image source={bathActive ? require('../../../assets/icons/category-bath-active.png') : require('../../../assets/icons/category-bath-default.png')} style={[styles.stateIcon, { tintColor: bathActive ? theme.primary : valueColor + '60' }]} />
                  </Pressable>
                  <Pressable style={styles.stateIconButton} accessibilityRole="button" accessibilityLabel="切換排便狀態" onPress={() => setPoopActive(value => !value)}>
                    <Image source={poopActive ? require('../../../assets/icons/category-poop-active.png') : require('../../../assets/icons/category-poop-default.png')} style={[styles.stateIcon, { tintColor: poopActive ? theme.primary : valueColor + '60' }]} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* ===== 卡片二：詳細狀態紀錄 ===== */}
          <View style={[styles.detailCard, { backgroundColor: theme.background }]}>
            {recordItems.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <View key={idx} style={{ gap: 8, width: '100%' }}>
                  <View style={styles.recordRow}>
                    <IconComp width={20} height={20} color={labelColor} />
                    <Text style={[styles.recordLabel, { color: labelColor, fontFamily: fontFamilyName }]}>
                      {item.label}：
                    </Text>
                    {['排便', '蛻皮'].includes(item.label) ? (
                      <View style={{ flexDirection: 'row', gap: 6, flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
                        {['無', '有'].map((opt) => (
                          <Pressable
                            key={opt}
                            style={[
                              { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, width: 64, alignItems: 'center' },
                              (item.label === '排便' ? poopState : moltState) === opt
                                ? { backgroundColor: theme.accentHot + '15', borderColor: theme.accentHot }
                                : { backgroundColor: theme.primary + '05', borderColor: theme.primary + '20' }
                            ]}
                            onPress={() => {
                              if (item.label === '排便') {
                                setPoopState(opt);
                                setPoopActive(opt === '有');
                              } else {
                                setMoltState(opt);
                                setMoltActive(opt === '有');
                              }
                            }}
                          >
                            <Text style={{ fontSize: getFontSize(13, 'medium'), fontFamily: fontFamilyName, color: (item.label === '排便' ? poopState : moltState) === opt ? theme.accentHot : theme.primary + 'A0', fontWeight: (item.label === '排便' ? poopState : moltState) === opt ? '600' : '500' }}>
                              {opt}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : item.label === '飲食' ? (
                      <TextInput
                        style={[styles.recordValue, { color: valueColor, fontFamily: fontFamilyName, flex: 1, textAlign: 'left', padding: 0, paddingLeft: 24, margin: 0, minHeight: 24 }]}
                        value={feedState}
                        onChangeText={value => {
                          setFeedState(value);
                          setFeedActive(Boolean(value.trim() && value.trim() !== '無'));
                        }}
                        multiline
                        selectTextOnFocus
                      />
                    ) : ['泡澡', '日照', '體重', '身長', '溫度', '濕度'].includes(item.label) ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <TextInput
                          style={[styles.recordValue, { color: valueColor, fontFamily: fontFamilyName, width: 64, textAlign: 'center', padding: 0, margin: 0, marginRight: 6 }]}
                          value={
                            item.label === '泡澡' ? bathMinutes :
                            item.label === '日照' ? baskMinutes :
                            item.label === '體重' ? weight :
                            item.label === '身長' ? length :
                            item.label === '溫度' ? temp :
                            humid
                          }
                          onChangeText={value => {
                            if (item.label === '泡澡') {
                              setBathMinutes(value);
                              setBathActive(Number.parseFloat(value) > 0);
                            } else if (item.label === '日照') {
                              setBaskMinutes(value);
                              setBaskActive(Number.parseFloat(value) > 0);
                            } else if (item.label === '體重') {
                              weightDirtyRef.current = true;
                              setWeight(value);
                            } else if (item.label === '身長') {
                              lengthDirtyRef.current = true;
                              setLength(value);
                            } else if (item.label === '溫度') {
                              setTemp(value);
                            } else {
                              setHumid(value);
                            }
                          }}
                          keyboardType="numeric"
                          selectTextOnFocus
                        />
                        <Text style={[styles.recordValue, { color: labelColor, fontFamily: fontFamilyName }]}>
                          {item.label === '泡澡' || item.label === '日照' ? '分鐘' :
                           item.label === '體重' ? '公克' :
                           item.label === '身長' ? '公分' :
                           item.label === '溫度' ? '℃' :
                           '%'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.recordValue, { color: valueColor, fontFamily: fontFamilyName }]}>
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
                          value={appetite === 0 ? 3 : appetite}
                          onValueChange={setAppetite}
                          minimumTrackTintColor={appetite === 0 ? '#CCCCCC' : appetite === 1 ? '#FF3B30' : appetite === 2 ? '#FF9500' : '#34C759'}
                          maximumTrackTintColor={theme.primary + '30'}
                          thumbTintColor={appetite === 0 ? '#CCCCCC' : appetite === 1 ? '#FF3B30' : appetite === 2 ? '#FF9500' : '#34C759'}
                        />
                        <Text style={[styles.recordLabel, { color: appetite === 0 ? labelColor + '80' : labelColor, fontFamily: fontFamilyName, width: 52, textAlign: 'center' }]}>
                          {appetite === 0 ? '未檢測' : appetite === 1 ? '差' : appetite === 2 ? '偏差' : appetite === 3 ? '普通' : appetite === 4 ? '偏好' : '好'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* ===== 卡片三：寫日記（可展開） ===== */}
          <Pressable
            style={[styles.actionCard, { backgroundColor: theme.background }]}
            onPress={() => setIsDiaryExpanded(!isDiaryExpanded)}
          >
            <IconDiaryWrite width={28} height={28} color={theme.primary} />
          </Pressable>

          {isDiaryExpanded && (
            <View style={[styles.diaryEditCard, { backgroundColor: theme.background }]}>
              {/* 標題編輯 */}
              <TextInput
                style={[styles.diaryTitleInput, { color: titleValueColor, fontFamily: fontFamilyName }]}
                value={title}
                onChangeText={setTitle}
                placeholder="標題"
                placeholderTextColor={titlePlaceholderColor}
              />
              {/* 內容編輯 */}
              <TextInput
                style={[styles.diaryContentInput, { color: valueColor, fontFamily: fontFamilyName, height: contentInputHeight }]}
                value={diaryContent}
                onChangeText={setDiaryContent}
                onContentSizeChange={event => setContentInputHeight(Math.max(44, event.nativeEvent.contentSize.height))}
                placeholder="..."
                placeholderTextColor={theme.primary + '80'}
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

        </ScrollView>

        <DatePickerModal
          visible={isDatePickerVisible}
          currentDate={selectedDate}
          onClose={() => setIsDatePickerVisible(false)}
          onSelectDate={date => {
            setSelectedDate(date);
            setCurrentDate(formatDiaryDate(date));
            setDateKey(toDiaryDateKey(date));
          }}
        />

        <Modal
          visible={isWeatherPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsWeatherPickerVisible(false)}
        >
          <Pressable style={styles.weatherModalOverlay} onPress={() => setIsWeatherPickerVisible(false)}>
            <Pressable style={[styles.weatherModalCard, { backgroundColor: theme.background }]} onPress={event => event.stopPropagation()}>
              <Text style={[styles.weatherModalTitle, { color: theme.primary, fontFamily: fontFamilyName }]}>選擇天氣</Text>
              <View style={styles.weatherGrid}>
                {WEATHER_OPTIONS.map(option => (
                  <Pressable
                    key={option.key}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    style={[
                      styles.weatherOption,
                      { borderColor: weatherIcon === option.key ? valueColor : theme.primary + '20' },
                    ]}
                    onPress={() => {
                      setWeatherIcon(option.key);
                      setIsWeatherPickerVisible(false);
                    }}
                  >
                    <Image source={option.source} style={[styles.weatherOptionIcon, { tintColor: valueColor }]} />
                    <Text style={[styles.weatherOptionLabel, { color: theme.primary, fontFamily: fontFamilyName }]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 120,
    gap: 16,
  },

  // ===== 主卡片（照片 + 資訊） =====
  mainCard: {
    width: '96%',
    alignSelf: 'center',

    borderRadius: 16,
    overflow: 'visible',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  photoArea: {
    width: '100%',
    height: 200,

    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  addPhotoButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  addPhotoIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  diaryImageSection: {
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  diaryImageStrip: {
    gap: 8,
    paddingBottom: 4,
  },
  diaryImagePreviewWrapper: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
  },
  diaryImagePreview: {
    width: '100%',
    height: '100%',
  },
  diaryImageDragHandle: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    width: 18,
    height: 18,
    tintColor: '#FFFFFF',
  },
  diaryImageRemoveBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  diaryImageRemoveText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 18,
  },
  diaryImageAddButton: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaryImageAddText: {
    fontSize: 26,
    lineHeight: 27,
  },
  diaryImageAddLabel: {
    fontSize: getFontSize(11, 'small'),
  },
  petTagsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    gap: 8,
  },
  petTag: {

    paddingVertical: 4,
    paddingHorizontal: 14,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 6,
  },
  petTagText: {
    fontSize: getFontSize(16, 'medium'),
    fontWeight: '600',
  },
  petDropdownModal: {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2000,
  },
  petDropdownScroll: {
    maxHeight: 280,
  },
  petDropdownItem: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 237, 204, 0.6)',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 8,
  },
  petDropdownItemActive: {
    backgroundColor: 'rgba(255, 195, 0, 0.3)',
    borderWidth: 1.5,
    borderColor: '#FFC500',
  },
  petDropdownItemText: {
    fontSize: getFontSize(16, 'medium'),
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
  },
  titleInput: {
    fontSize: getFontSize(16, 'medium'),
    marginBottom: 16,
    paddingBottom: 4,
    textAlign: 'center',
    minWidth: 120,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 6,
  },
  stateIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  // ===== 詳細紀錄卡片 =====
  detailCard: {
    width: '96%',
    alignSelf: 'center',

    borderRadius: 16,
    padding: 20,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
  appetiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 30, // 縮排對齊
    marginTop: 4,
    marginBottom: 4,
  },
  appetiteLabel: {
    fontSize: getFontSize(14, 'medium'),
    marginRight: 16,
  },
  sliderRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderText: {
    fontSize: getFontSize(14, 'medium'),
  },
  sliderTrackContainer: {
    flex: 1,
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginHorizontal: 8,
  },
  sliderTrack: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 4,
    borderRadius: 2,
    top: '50%',
    marginTop: -2,
  },
  sliderPoint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // ===== 操作按鈕卡片 =====
  actionCard: {
    width: '96%',
    alignSelf: 'center',

    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // ===== 寫日記展開卡片 =====
  diaryEditCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    minHeight: 104,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  diaryTitleInput: {
    fontSize: getFontSize(20, 'medium'),
    fontWeight: '600',
    marginBottom: 8,
    padding: 0,
  },
  diaryContentInput: {
    fontSize: getFontSize(16, 'medium'),
    minHeight: 44,
    padding: 0,
    textAlign: 'justify',
  },

  // ===== 上傳展開卡片 =====
  uploadExpandedCard: {
    width: '96%',
    alignSelf: 'center',

    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: '#FF7300',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  uploadAddIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  uploadAddText: {
    fontSize: getFontSize(16, 'medium'),
  },
  uploadHint: {
    fontSize: getFontSize(12, 'small'),
  },
  weatherModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherModalCard: {
    width: '86%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  weatherModalTitle: {
    fontSize: getFontSize(18, 'medium'),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  weatherOption: {
    width: '47%',
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  weatherOptionIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  weatherOptionLabel: {
    fontSize: getFontSize(13, 'small'),
  },
});
