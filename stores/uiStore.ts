import { create } from 'zustand';
import { User } from '../types';
// Fix: Import useMapStore to resolve circular dependency with an ES module import.
import { useMapStore } from './mapStore';

export type View = 'home' | 'map' | 'grid' | 'inbox' | 'profile' | 'agora';

interface UiState {
  activeView: View;
  chatUser: User | null;
  isSubscriptionModalOpen: boolean; // Adicionado para controlar o modal premium
  setActiveView: (view: View) => void;
  setChatUser: (user: User | null) => void;
  setSubscriptionModalOpen: (isOpen: boolean) => void; // Adicionado
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'home',
  chatUser: null,
  isSubscriptionModalOpen: false, // Estado inicial
  setActiveView: (view) => set({ activeView: view }),
  setChatUser: (user) => {
      // Se estamos abrindo um chat com um usuário, fechamos o modal de perfil se estiver aberto
      if (user) {
          // Fix: Replaced require with a top-level ES import to avoid 'require is not defined' error.
          useMapStore.getState().setSelectedUser(null);
      }
      set({ chatUser: user })
  },
  setSubscriptionModalOpen: (isOpen) => set({ isSubscriptionModalOpen: isOpen }), // Função para alterar o estado
}));