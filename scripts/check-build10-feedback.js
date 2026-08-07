const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

const files = {
  layout: read('app/_layout.tsx'),
  login: read('app/login.tsx'),
  onboarding: read('app/index.tsx'),
  addReminder: read('app/(tabs)/pets/add-reminder.tsx'),
  reminder: read('app/(tabs)/pets/reminder.tsx'),
  settings: read('app/(tabs)/settings.tsx'),
  googleAuth: read('src/config/googleAuth.ts'),
  notification: read('src/services/notificationService.ts'),
  addDiary: read('app/(tabs)/diary/add.tsx'),
  diaryView: read('app/(tabs)/diary/view.tsx'),
  diaryIndex: read('app/(tabs)/diary/index.tsx'),
  medicalDetail: read('app/(tabs)/pets/medical-detail.tsx'),
  addMedical: read('app/(tabs)/pets/add-medical.tsx'),
  medical: read('app/(tabs)/pets/medical.tsx'),
  analytics: read('app/(tabs)/analytics.tsx'),
  home: read('app/(tabs)/index.tsx'),
  tabLayout: read('app/(tabs)/_layout.tsx'),
  iot: read('app/iot.tsx'),
  tabIot: read('app/(tabs)/iot.tsx'),
  snapshots: read('src/contexts/PetSnapshotContext.tsx'),
  authContext: read('src/contexts/AuthContext.tsx'),
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
  ['22 same build keeps login session after app restart', files.firebase.includes('initializeAuth(app') && files.firebase.includes('getReactNativePersistence(AsyncStorage)')],
  ['23 寵物多選只用顏色標示', !files.addDiary.includes('`✓ ${pet.name}`') && files.addDiary.includes('petDropdownItemActive')],
  ['24 中文輸入游標不使用左右對齊', !files.addDiary.includes("textAlign: 'justify'") && files.addDiary.includes("textAlign: 'left'")],
  ['25 相似提醒新增為獨立卡片', files.addReminder.includes("mode !== 'create'") && files.addReminder.includes('savedId = await reminderService.add') && files.reminder.includes("mode: 'create'") && files.reminder.includes("mode: 'edit'")],
  ['26 medical records allow separate identical creates and block double taps', files.addMedical.includes("mode !== 'create'") && files.addMedical.includes('if (saveLockRef.current) return') && files.addMedical.includes('saveWithId') && files.medical.includes("mode: 'create'") && files.medicalDetail.includes("mode: 'edit'")],
  ['27 same-date diaries use creation time as newest tie-breaker', files.firestore.includes('compareDiariesNewest') && files.firestore.includes('left.createdAt') && files.firestore.includes('.sort(compareDiariesNewest)')],
  ['28 daily quick states are stored per pet and diary renders per-pet rows', files.snapshots.includes('Record<string, PetSnapshot>') && files.snapshots.includes('scheduleMidnightReset') && files.snapshots.includes('AsyncStorage.removeItem(STORAGE_KEY)') && files.addDiary.includes('selectedPetDocuments.map') && files.addDiary.includes('metricRows')],
  ['29 diary pet selector omits multi-select helper text', files.addDiary.includes('>選擇寵物</Text>') && !files.addDiary.includes('（可多選）')],
  ['30 analytics ignores empty or sub-one values and preserves primary-pet legacy records', files.analytics.includes('isValidMetricValue') && files.analytics.includes('numeric >= 1') && files.analytics.includes('getPetRecordValue') && files.analytics.includes('petEntries.find(entry =>')],
  ['31 latest diary date and weather have airy spacing', files.home.includes('paddingVertical: 18') && files.home.includes('gap: 11') && files.home.includes('marginTop: 3')],
  ['32 IoT management stays in tabs and uses floating back action', files.tabLayout.includes('name="iot"') && files.tabIot.includes("export { default } from '../iot'") && files.iot.includes('FloatingActionBar') && files.iot.includes('listContent') && !files.iot.includes('backIcon')],
  ['33 notification tap opens reminder page without focused red target', files.layout.includes("pathname: '/(tabs)/pets/reminder'") && !files.layout.includes("from: 'notification'") && !files.reminder.includes('notificationTargetBorder') && !files.reminder.includes('notificationTargetLabel')],
  ['34 reminder card switch updates only the selected card', files.reminder.includes('reminderService.setEnabled') && files.firestore.includes('async setEnabled(') && files.firestore.includes("getUserDoc(userId, 'reminders', reminderId)")],
  ['35 settings exposes only system notifications above appearance', !files.settings.includes('通知設定</Text>') && !files.settings.includes('>提醒</Text>') && files.settings.indexOf('>系統通知</Text>') < files.settings.indexOf('>外觀設定</Text>')],
  ['36 reminder shared listener excludes owner duplicates', files.firestore.includes(".filter(item => item.ownerId !== userId)") && files.firestore.includes('舊共享快照會讓已刪除提醒復活或讓開關回跳')],
  ['37 reminder deletion hides stale snapshots and cleans native orphans', files.reminder.includes('hiddenReminderKeysRef.current.add(key)') && files.notification.includes('data?.ownerId === ownerId && data?.reminderId === reminderId')],
  ['38 reminder pending toggle cannot be overwritten by stale listener data', files.reminder.includes('pendingToggleValuesRef.current.set(key, nextIsOn)') && files.reminder.includes('pendingToggleValuesRef.current.get(key)')],
  ['39 reminders sort by minute of day', files.reminder.includes('Number(match[1]) * 60 + Number(match[2])') && files.reminder.includes('const byTime = timeValue(left.time) - timeValue(right.time)')],
  ['40 empty appetite displays as not measured', files.addDiary.includes("appetiteValue === 0 ? '未檢測'") && files.diaryView.includes("(item.appetite ?? 0) <= 0 ? '未檢測'")],
  ['41 changed APK build clears local cache and returns to login', files.authContext.includes('Constants.nativeBuildVersion') && files.authContext.includes('previousSignature !== signature') && files.authContext.includes('await AsyncStorage.clear()') && files.authContext.includes('await signOut(auth)')],
  ['42 existing account links Google without changing Firebase UID', files.settings.includes('linkWithCredential(currentUser, credential)') && files.settings.includes("provider.providerId === 'google.com'") && files.settings.includes("error.code === 'auth/credential-already-in-use'") && files.login.includes('GOOGLE_WEB_CLIENT_ID')],
  ['43 multi-pet diary stores and edits independent records', files.addDiary.includes('recordsByPetId') && files.addDiary.includes('normalizedPetRecords(pet.id, petIndex)') && files.firestore.includes('records?: DiaryRecords') && files.analytics.includes('petData.records[key]')],
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
