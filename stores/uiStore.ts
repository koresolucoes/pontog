import { create } from 'zustand';
import { User, ChatUser } from '../types';

export type View = 'home' | 'map' | 'grid' | 'inbox' | 'profile' | 'agora';

interface UiState {
  activeView: View;
  chatUser: (User | ChatUser) | null;
  isSubscriptionModalOpen: boolean;
  isDonationModalOpen: boolean; // Adicionado para o modal de doação
  setActiveView: (view: View) => void;
  setChatUser: (user: (User | ChatUser) | null) => void;
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
          // FIX: Use a dynamic import to break the circular dependency cycle
          // between stores, which can cause "Cannot access before initialization" errors.
          import('./mapStore').then(({ useMapStore }) => {
            useMapStore.getState().setSelectedUser(null);
          });
      }
      set({ chatUser: user })
  },
  setSubscriptionModalOpen: (isOpen) => set({ isSubscriptionModalOpen: isOpen }),
  setDonationModalOpen: (isOpen) => set({ isDonationModalOpen: isOpen }), // Função para alterar o estado
}));