import { create } from 'zustand';
import { User } from '../types';
// Fix: Import useMapStore to resolve circular dependency with an ES module import.
import { useMapStore } from './mapStore';

export type View = 'home' | 'map' | 'grid' | 'inbox' | 'profile' | 'agora';

interface UiState {
  activeView: View;
  chatUser: User | null;
  isSubscriptionModalOpen: boolean;
  isDonationModalOpen: boolean; // Adicionado para o modal de doação
  setActiveView: (view: View) => void;
  setChatUser: (user: User | null) => void;
  setSubscriptionModalOpen: (isOpen: boolean) => void;
  setDonationModalOpen: (isOpen: boolean) => void; // Adicionado
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'home',
  chatUser: null,
  isSubscriptionModalOpen: false,
  isDonationModalOpen: false, // Estado inicial
  setActiveView: (view) => set({ activeView: view }),
  setChatUser: (user) => {
      // Se estamos abrindo um chat com um usuário, fechamos o modal de perfil se estiver aberto
      if (user) {
          // Fix: Replaced require with a top-level ES import to avoid 'require is not defined' error.
          useMapStore.getState().setSelectedUser(null);
      }
      set({ chatUser: user })
  },
  setSubscriptionModalOpen: (isOpen) => set({ isSubscriptionModalOpen: isOpen }),
  setDonationModalOpen: (isOpen) => set({ isDonationModalOpen: isOpen }), // Função para alterar o estado
}));