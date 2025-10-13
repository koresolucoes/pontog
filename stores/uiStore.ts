import { create } from 'zustand';

export type View = 'map' | 'grid';

interface UiState {
  activeView: View;
  setActiveView: (view: View) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'map',
  setActiveView: (view) => set({ activeView: view }),
}));
