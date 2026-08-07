import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'lizlog.pet-snapshots.v2';

export type QuickPetStates = {
  bask: boolean;
  feed: boolean;
  bath: boolean;
  poop: boolean;
};

export const EMPTY_QUICK_PET_STATES: QuickPetStates = {
  bask: false,
  feed: false,
  bath: false,
  poop: false,
};

export type PetSnapshot = {
  petId: string;
  ownerId: string;
  dateKey: string;
  hasIotDevice: boolean;
  temp: string;
  humid: string;
  states: QuickPetStates;
};

type StoredSnapshots = {
  dateKey: string;
  snapshots: Record<string, PetSnapshot>;
};

type PetSnapshotContextValue = {
  activePetId: string | null;
  setActivePetId: React.Dispatch<React.SetStateAction<string | null>>;
  getSnapshot: (petId: string) => PetSnapshot | null;
  setPetSnapshot: (snapshot: Omit<PetSnapshot, 'dateKey'>) => void;
};

const PetSnapshotContext = createContext<PetSnapshotContextValue | null>(null);

function todayKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function PetSnapshotProvider({ children }: { children: React.ReactNode }) {
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Record<string, PetSnapshot>>({});
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then(value => {
      if (!active || !value) return;
      try {
        const parsed = JSON.parse(value) as StoredSnapshots;
        if (parsed.dateKey === todayKey() && parsed.snapshots && typeof parsed.snapshots === 'object') {
          setSnapshots(parsed.snapshots);
        }
      } catch {
        // 舊版或損壞快取直接忽略；首頁會建立當日新狀態。
      }
    }).finally(() => {
      if (active) setHasLoaded(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    const payload: StoredSnapshots = { dateKey: todayKey(), snapshots };
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [hasLoaded, snapshots]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnightReset = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(() => {
        setSnapshots({});
        void AsyncStorage.removeItem(STORAGE_KEY);
        scheduleMidnightReset();
      }, Math.max(1000, nextMidnight.getTime() - now.getTime()));
    };
    scheduleMidnightReset();
    return () => clearTimeout(timer);
  }, []);

  const getSnapshot = useCallback((petId: string) => {
    const snapshot = snapshots[petId];
    return snapshot?.dateKey === todayKey() ? snapshot : null;
  }, [snapshots]);

  const setPetSnapshot = useCallback((snapshot: Omit<PetSnapshot, 'dateKey'>) => {
    setSnapshots(current => {
      const dateKey = todayKey();
      const previous = current[snapshot.petId];
      if (previous?.dateKey === dateKey
        && previous.ownerId === snapshot.ownerId
        && previous.hasIotDevice === snapshot.hasIotDevice
        && previous.temp === snapshot.temp
        && previous.humid === snapshot.humid
        && previous.states.bask === snapshot.states.bask
        && previous.states.feed === snapshot.states.feed
        && previous.states.bath === snapshot.states.bath
        && previous.states.poop === snapshot.states.poop) {
        return current;
      }
      return {
        ...current,
        [snapshot.petId]: { ...snapshot, dateKey },
      };
    });
  }, []);

  const value = useMemo(() => ({
    activePetId,
    setActivePetId,
    getSnapshot,
    setPetSnapshot,
  }), [activePetId, getSnapshot, setPetSnapshot]);

  return (
    <PetSnapshotContext.Provider value={value}>
      {children}
    </PetSnapshotContext.Provider>
  );
}

export function usePetSnapshot() {
  const context = useContext(PetSnapshotContext);
  if (!context) throw new Error('usePetSnapshot 必須在 PetSnapshotProvider 內使用');
  return context;
}
