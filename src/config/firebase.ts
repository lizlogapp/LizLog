import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import type { Auth, Persistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

type FirebaseExtra = Partial<FirebaseOptions>;

const requiredFields: Array<keyof FirebaseOptions> = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

function getFirebaseConfig(): FirebaseOptions {
  const firebase = (Constants.expoConfig?.extra?.firebase ?? {}) as FirebaseExtra;
  const missing = requiredFields.filter((field) => !firebase[field]);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase build configuration: ${missing.join(', ')}. ` +
        'Set EXPO_PUBLIC_FIREBASE_* variables before starting the APP.',
    );
  }

  return firebase as FirebaseOptions;
}

const app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApp();
const { getAuth, initializeAuth } = FirebaseAuth;
const getReactNativePersistence = (
  FirebaseAuth as typeof FirebaseAuth & {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
  }
).getReactNativePersistence;
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // Fast refresh can encounter an Auth instance that was already initialized.
  if ((error as { code?: string }).code !== 'auth/already-initialized') throw error;
  auth = getAuth(app);
}
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);

export { app, auth, db, storage, rtdb };
