import { create } from 'zustand';
import { User } from '../types';
// Fix: Import useMapStore to resolve circular dependency with an ES module import.
import { useMapStore } from './mapStore';

export type View = 'map' | 'grid' | 'inbox' | 'profile' | 'interest' | 'agora';

interface UiState {
  activeView: View;
  chatUser: User | null;
  setActiveView: (view: View) => void;
  setChatUser: (user: User | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'grid',
  chatUser: null,
  setActiveView: (view) => set({ activeView: view }),
  setChatUser: (user) => {
      // Se estamos abrindo um chat com um usuário, fechamos o modal de perfil se estiver aberto
      if (user) {
          // Fix: Replaced require with a top-level ES import to avoid 'require is not defined' error.
          useMapStore.getState().setSelectedUser(null);
      }
      set({ chatUser: user })
  },
}));