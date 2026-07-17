import React, { createContext, useContext, useMemo, useState } from 'react';

export type QuickPetStates = {
  bask: boolean;
  feed: boolean;
  bath: boolean;
  poop: boolean;
};

export type PetSnapshot = {
  petId: string;
  ownerId: string;
  hasIotDevice: boolean;
  temp: string;
  humid: string;
  states: QuickPetStates;
};

type PetSnapshotContextValue = {
  snapshot: PetSnapshot | null;
  setSnapshot: React.Dispatch<React.SetStateAction<PetSnapshot | null>>;
};

const PetSnapshotContext = createContext<PetSnapshotContextValue | null>(null);

export function PetSnapshotProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<PetSnapshot | null>(null);
  const value = useMemo(() => ({ snapshot, setSnapshot }), [snapshot]);

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
