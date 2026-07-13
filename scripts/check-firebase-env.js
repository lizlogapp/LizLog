const required = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Firebase 設定尚缺：${missing.join(', ')}`);
  process.exit(1);
}

console.log('Firebase 必要設定名稱皆已提供；未輸出任何設定值。');
