const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const service = fs.readFileSync(path.join(root, 'src/services/firestoreService.ts'), 'utf8');
const imageService = fs.readFileSync(path.join(root, 'src/services/imageService.ts'), 'utf8');
const storageRules = fs.readFileSync(path.join(root, 'storage.rules'), 'utf8');
const addScreen = fs.readFileSync(path.join(root, 'app/(tabs)/pets/add.tsx'), 'utf8');
const medicalScreen = fs.readFileSync(path.join(root, 'app/(tabs)/pets/add-medical.tsx'), 'utf8');

const directImageRules = [
  'match /users/{ownerId}/pets/{petId}/{fileName}',
  'match /users/{ownerId}/diaries/{recordId}/{fileName}',
  'match /users/{ownerId}/medical/{recordId}/{fileName}',
];

const checks = [
  ['不再使用 Firebase uploadBytes/XHR Blob 路徑', !/\buploadBytes(?:Resumable)?\s*\(/.test(service)],
  ['使用 Expo 原生 fetch 與 File.bytes', service.includes("from 'expo/fetch'")
    && imageService.includes('await file.bytes()')],
  ['建立 Firebase resumable session', service.includes("'X-Goog-Upload-Protocol': 'resumable'")
    && service.includes("'X-Goog-Upload-Command': 'start'")],
  ['start metadata 同時包含 name、size、contentType',
    /body:\s*JSON\.stringify\(\{\s*name:\s*path,\s*size:\s*bytes\.byteLength,\s*contentType,\s*\}\)/s.test(service)],
  ['使用 upload, finalize 完成傳輸', service.includes("'X-Goog-Upload-Command': 'upload, finalize'")],
  ['由 Storage reference 取得正確 bucket', service.includes('const bucket = storageRef.bucket')],
  ['驗證 resumable active/final 狀態',
    service.includes("!== 'active'") && service.includes("!== 'final'")],
  ['錯誤診斷含 start/finalize、HTTP 狀態與安全分類',
    service.includes("phase: requestError?.phase ?? requestPhase")
      && service.includes('httpStatus: requestError?.httpStatus')
      && service.includes('classification: requestError?.classification')
      && imageService.includes('httpStatus')
      && imageService.includes('classification')],
  ['診斷不輸出 token、完整 URL 或 response body',
    imageService.includes('不可輸出 token、完整 URL、response body')
      && !/console\.(?:warn|error|log)\([^)]*(?:idToken|authorization|startUrl|uploadUrl|response\.text)/s.test(service)],
  ['圖片規則使用單層字串 wildcard',
    directImageRules.every(rule => storageRules.includes(rule))
      && !/match \/users\/\{ownerId\}\/(?:pets|diaries|medical)\/[^\n]*\{filePath=\*\*\}/.test(storageRules)],
  ['所有圖片規則以 fileName 驗證 JPEG',
    (storageRules.match(/validImage\(fileName\)/g) || []).length >= 6
      && !storageRules.includes('validImage(filePath)')],
  ['日記附件維持獨立規則',
    storageRules.includes('match /users/{ownerId}/diaries/{recordId}/attachments/{fileName}')
      && storageRules.includes('validAttachment(fileName)')],
  ['主圖與縮圖使用固定路徑',
    service.includes('`${folder}/${baseName}.jpg`')
      && service.includes('`${folder}/${baseName}-thumb.jpg`')],
  ['主圖與縮圖皆成功才回傳',
    service.includes("imageUrl = await uploadUri(mainPath")
      && service.includes("thumbnailUrl = await uploadUri(")
      && !service.includes('let thumbnailUrl = imageUrl')],
  ['任一圖片失敗會清理固定路徑並轉拋',
    service.includes('await cleanupImagePairAfterFailure(folder, baseName,')
      && (service.match(/throw error;/g) || []).length >= 2],
  ['成功後才記錄圖片用量',
    service.indexOf('await recordSuccessfulImageUpload(quotaUserId)')
      > service.indexOf("thumbnailUrl = await uploadUri(")],
  ['寵物 writeback 完成後才顯示成功',
    addScreen.indexOf('await petService.update(resolvedOwnerId, savedPetId, uploaded)')
      > addScreen.indexOf('await petService.uploadImage(')
      && addScreen.includes("'writeback'")],
  ['新增寵物連點確認有鎖定',
    addScreen.includes('savingLock.current || isSaving')],
  ['醫護使用相同圖片管線與固定文件 ID',
    service.includes('return uploadImagePair(')
      && service.includes('`photo-${index}`')
      && medicalScreen.includes('medicalService.reserveId(resolvedOwnerId)')
      && medicalScreen.includes('await medicalService.uploadImage(')],
  ['醫護每張圖片 writeback 完成才繼續',
    medicalScreen.indexOf('await medicalService.update(resolvedOwnerId, medicalId,')
      > medicalScreen.indexOf('await medicalService.uploadImage(')
      && medicalScreen.includes("saveStage = 'writeback'")],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
} else {
  console.log(`寵物照片管線靜態檢查通過：${checks.length}/${checks.length}`);
}
