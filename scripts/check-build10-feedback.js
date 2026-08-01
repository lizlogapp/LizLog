const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

const files = {
  layout: read('app/_layout.tsx'),
  onboarding: read('app/index.tsx'),
  addReminder: read('app/(tabs)/pets/add-reminder.tsx'),
  reminder: read('app/(tabs)/pets/reminder.tsx'),
  settings: read('app/(tabs)/settings.tsx'),
  notification: read('src/services/notificationService.ts'),
  addDiary: read('app/(tabs)/diary/add.tsx'),
  diaryView: read('app/(tabs)/diary/view.tsx'),
  diaryIndex: read('app/(tabs)/diary/index.tsx'),
  medicalDetail: read('app/(tabs)/pets/medical-detail.tsx'),
  analytics: read('app/(tabs)/analytics.tsx'),
  coParent: read('app/(tabs)/pets/co-parent.tsx'),
  firestore: read('src/services/firestoreService.ts'),
  imageService: read('src/services/imageService.ts'),
  accessibility: read('src/theme/accessibilitySettings.ts'),
  firebase: read('src/config/firebase.ts'),
};

const checks = [
  ['1 歡迎頁只顯示一次', files.onboarding.includes("setItem(ONBOARDING_SEEN_KEY, 'true')") && files.layout.includes('setHasSeenOnboarding(true)')],
  ['2 提醒事項預設空白', files.addReminder.includes("const [note, setNote] = useState('')") && files.addReminder.includes('placeholder=""')],
  ['3 通知協助設定只顯示一次', files.notification.includes('GUIDE_SHOWN_KEY') && files.notification.includes('claimNotificationSetupGuide') && !files.settings.includes("'通知同步未完成'")],
  ['5 通知顯示寵物與事項', files.notification.includes('buildReminderNotificationBody') && files.notification.includes('`${petLabel}的${reminderItem}時間到囉！`')],
  ['6 自訂提醒選項持久保存', files.addReminder.includes('CUSTOM_TYPES_KEY') && files.addReminder.includes('rememberedCustomTypes') && files.addReminder.includes('AsyncStorage.setItem')],
  ['7 寵物選單使用獨立可捲動 Modal', files.addDiary.includes('visible={isPetDropdownVisible}') && files.addDiary.includes('nestedScrollEnabled')],
  ['8 筆記展開時隱藏 icon 卡', files.addDiary.includes('{!isDiaryExpanded && <Pressable')],
  ['9 筆記 1.5 倍行高與標題同色', files.addDiary.includes('buildLineHeight(getFontSize(16') && files.addDiary.includes('color: titleValueColor') && files.diaryView.includes('lineHeight: 24')],
  ['10 筆記避開鍵盤', files.addDiary.includes('KeyboardAvoidingView') && files.addDiary.includes('scrollContentWithKeyboard') && files.addDiary.includes('scrollToEnd')],
  ['11 日記與醫護支援長按複製', files.diaryView.includes('<Text selectable') && files.medicalDetail.includes('<Text selectable')],
  ['12 空白紀錄統一為橫線且不沿用體重身長', files.addDiary.includes("value?.trim() || '-'") && !files.addDiary.includes('previousWeight') && !files.addDiary.includes('previousLength')],
  ['13 新增照片只保留置中加號', files.addDiary.includes('>＋</Text>') && !files.addDiary.includes('>add</Text>')],
  ['14 新增日記寵物可多選', files.addDiary.includes('setSelectedPetIds') && files.addDiary.includes('[...current, petId]')],
  ['15 字級保留縮放並限制極端倍率', files.layout.includes('configureTextScaling()') && files.accessibility.includes('MAX_FONT_SIZE_MULTIPLIER = 1.35') && files.accessibility.includes('allowFontScaling: true')],
  ['16 照片卡與刪除卡分離', files.diaryView.includes('styles.attachmentCard') && files.diaryView.includes('styles.deleteCard') && files.diaryView.includes('displayDiary.attachments.length > 0')],
  ['17 日記圖片可下載到相簿', files.diaryView.includes('saveRemoteImageToLibrary') && files.imageService.includes('MediaLibrary.saveToLibraryAsync')],
  ['18 搜尋包含紀錄且跨月份', files.diaryIndex.includes('Object.values(diary.records || {})') && files.diaryIndex.includes('!exactDate && !normalizedQuery')],
  ['19 澄日當日日期維持黑色', files.analytics.includes("isToday && { color: '#333333'")],
  ['20 澄日共同飼育邀請按鈕可見', files.coParent.includes('backgroundColor: theme.background') && files.coParent.includes('color: theme.background')],
  ['21 邀請碼加入不再預先讀取受保護 pet', files.firestore.includes('coParents: arrayUnion(member)') && !/consumeInvite[\s\S]*transaction\.get\(petRef\)/.test(files.firestore)],
  ['22 login session persists after app restart', files.firebase.includes('initializeAuth(app') && files.firebase.includes('getReactNativePersistence(AsyncStorage)')],
];

let failed = 0;
for (const [name, passed] of checks) {
  if (passed) console.log(`PASS ${name}`);
  else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

console.log(`${checks.length - failed}/${checks.length} checks passed`);
if (failed > 0) process.exit(1);
