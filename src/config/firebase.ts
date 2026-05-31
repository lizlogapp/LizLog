import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 您提供的 Firebase 設定檔
const firebaseConfig = {
  apiKey: "AIzaSyCziIlp_CfOgDRrSUTkI390tvL06d8D0U8",
  authDomain: "lizlog-e4ebc.firebaseapp.com",
  projectId: "lizlog-e4ebc",
  storageBucket: "lizlog-e4ebc.firebasestorage.app",
  messagingSenderId: "670714384705",
  appId: "1:670714384705:web:815c9bbf90e4ec533451c0",
  // 由於在 React Native (Expo) 原生環境中不支援網頁版 Analytics，因此先註解
  // measurementId: "G-SD7V88STKJ"
};

// 避免在 Expo 開發過程中因熱更新 (Hot Reload) 導致重複初始化 App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 初始化 Firebase 服務
// 為了在 React Native 環境中能記住使用者的登入狀態，我們使用 AsyncStorage 作為資料持久化機制
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);

export { app, auth, db, storage, rtdb };
