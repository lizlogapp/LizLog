import Constants from 'expo-constants';
import { FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);

export { app, auth, db, storage, rtdb };
