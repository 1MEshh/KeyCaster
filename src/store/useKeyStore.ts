import { create } from "zustand";

interface KeyState {
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
}

export const useKeyStore = create<KeyState>((set) => ({
  activeKey: null,
  setActiveKey: (activeKey) => set({ activeKey }),
}));
