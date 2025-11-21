
import { create } from 'zustand';
import { User } from '../types';

export type View = 'home' | 'map' | 'grid' | 'inbox' | 'profile' | 'agora';

interface UiState {
  activeView: View;
  chatUser: User | null;
  isSubscriptionModalOpen: boolean;
  isDonationModalOpen: boolean;
  isSidebarOpen: boolean; // New state for Sidebar
  setActiveView: (view: View) => void;
  setChatUser: (user: User | null) => void;
  setSubscriptionModalOpen: (isOpen: boolean) => void;
  setDonationModalOpen: (isOpen: boolean) => void;
  setSidebarOpen: (isOpen: boolean) => void; // New action
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'home',
  chatUser: null,
  isSubscriptionModalOpen: false,
  isDonationModalOpen: false,
  isSidebarOpen: false,
  setActiveView: (view) => set({ activeView: view }),
  setChatUser: (user) => {
      if (user) {
          import('./mapStore').then(({ useMapStore }) => {
            useMapStore.getState().setSelectedUser(null);
          });
      }
      set({ chatUser: user })
  },
  setSubscriptionModalOpen: (isOpen) => set({ isSubscriptionModalOpen: isOpen }),
  setDonationModalOpen: (isOpen) => set({ isDonationModalOpen: isOpen }),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
