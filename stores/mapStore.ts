import { create } from 'zustand';
import { User, Coordinates } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useUiStore } from './uiStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Função para calcular a idade a partir da data de nascimento
const calculateAge = (dob: string | null): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};


interface MapState {
  users: User[];
  myLocation: Coordinates | null;
  onlineUsers: string[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  locationWatchId: number | null;
  presenceChannel: RealtimeChannel | null;
  profilesChannel: RealtimeChannel | null;
  requestLocationPermission: () => Promise<void>;
  stopLocationWatch: () => void;
  fetchNearbyUsers: (radius: number) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  startChatWithUser: (user: User) => void;
  sendWink: (receiverId: string) => Promise<{ success: boolean; message: string; }>;
  initializeRealtime: () => void;
  cleanupRealtime: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  users: [],
  myLocation: null,
  onlineUsers: [],
  selectedUser: null,
  loading: false,
  error: null,
  locationWatchId: null,
  presenceChannel: null,
  profilesChannel: null,

  requestLocationPermission: async () => {
    set({ loading: true, error: null });
    if (!navigator.geolocation) {
      set({ error: "Geolocalização não é suportada por este navegador.", loading: false });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        
        const firstTime = !get().myLocation;
        set({ myLocation: location, loading: false, error: null });
        
        // Atualiza a localização no banco de dados
        const { error: rpcError } = await supabase.rpc('update_my_location', { lat: latitude, lon: longitude });
        if (rpcError) {
            console.error("Error updating location:", rpcError);
        } else if (firstTime) {
            // Na primeira vez que obtemos a localização, buscamos os usuários próximos
            await get().fetchNearbyUsers(10000); // Raio de 10km
            get().initializeRealtime();
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        set({ error: "Permissão de localização negada. Por favor, habilite-a para usar o mapa.", loading: false });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    set({ locationWatchId: watchId });
  },

  stopLocationWatch: () => {
      const watchId = get().locationWatchId;
      if (watchId) {
          navigator.geolocation.clearWatch(watchId);
          set({ locationWatchId: null });
      }
  },

  fetchNearbyUsers: async (radius: number = 10000) => {
    set({ loading: true });
    const { data, error } = await supabase.rpc('get_nearby_users', { radius_meters: radius });
    
    if (error) {
        console.error("Error fetching nearby users:", error);
        set({ users: [], loading: false, error: "Erro ao buscar usuários." });
    } else {
        const usersWithAge = data.map(u => ({...u, age: calculateAge(u.date_of_birth)}));
        set({ users: usersWithAge, loading: false });
    }
  },

  setSelectedUser: (user) => set({ selectedUser: user }),
  startChatWithUser: (user) => {
      useUiStore.getState().setChatUser(user);
  },
  
  sendWink: async (receiverId: string) => {
      const authUser = useAuthStore.getState().user;
      if (!authUser) return { success: false, message: 'Você precisa estar logado.' };
      
      const { error } = await supabase.from('winks').insert({
          sender_id: authUser.id,
          receiver_id: receiverId
      });
      
      if (error) {
          if (error.code === '23505') { // unique_violation
            return { success: false, message: 'Você já chamou essa pessoa!' };
          }
          console.error("Error sending wink:", error);
          return { success: false, message: 'Não foi possível enviar o chamado.' };
      }
      return { success: true, message: 'Chamado enviado com sucesso!' };
  },

  initializeRealtime: () => {
      console.log('Initializing realtime subscriptions...');
      const presenceChannel = supabase.channel('online-users');
      const profilesChannel = supabase.channel('public:profiles');

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const newState = presenceChannel.presenceState();
          const userIds = Object.keys(newState).map(id => id);
          set({ onlineUsers: userIds });
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ user_id: useAuthStore.getState().user?.id });
          }
        });
      
      profilesChannel
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
            const updatedUser = payload.new as User;
            updatedUser.age = calculateAge(updatedUser.date_of_birth);
            
            set(state => ({
                users: state.users.map(user => 
                    user.id === updatedUser.id ? { ...user, ...updatedUser } : user
                )
            }));
        })
        .subscribe();
      
      set({ presenceChannel, profilesChannel });
  },

  cleanupRealtime: () => {
      console.log('Cleaning up realtime subscriptions...');
      get().presenceChannel?.unsubscribe();
      get().profilesChannel?.unsubscribe();
      set({ presenceChannel: null, profilesChannel: null, onlineUsers: [] });
  }

}));
