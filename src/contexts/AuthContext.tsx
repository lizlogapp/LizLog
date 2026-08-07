import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const INSTALLED_BINARY_KEY = 'lizlog.security.installed-binary.v1';

function installedBinarySignature(): string {
  return [
    Constants.expoConfig?.version || 'unknown-version',
    Constants.nativeBuildVersion || Constants.expoConfig?.android?.versionCode || 'unknown-build',
  ].join(':');
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let binaryChecked = false;
    let cancelled = false;
    // 同一個 APK 日常重開保留 Firebase session；安裝不同 build 時清除 App 快取並強制重新登入。
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!binaryChecked) {
        binaryChecked = true;
        try {
          const signature = installedBinarySignature();
          const previousSignature = await AsyncStorage.getItem(INSTALLED_BINARY_KEY);
          if (previousSignature !== signature) {
            await AsyncStorage.clear();
            await AsyncStorage.setItem(INSTALLED_BINARY_KEY, signature);
            if (currentUser) {
              await signOut(auth);
              return;
            }
          }
        } catch {
          // 無法確認 build 或清除快取時採 fail-closed，不讓可能殘留的 session 直接進入 App。
          await signOut(auth).catch(() => undefined);
          if (!cancelled) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }
      }
      if (cancelled) return;
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
