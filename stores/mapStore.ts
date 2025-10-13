import { create } from 'zustand';
import { User, Coordinates } from '../types';
import { supabase } from '../lib/supabase';
// Fix: Import useAuthStore to access the authenticated user's state.
import { useAuthStore } from './authStore';

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
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  requestLocationPermission: () => Promise<void>;
  fetchNearbyUsers: (radius: number) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  sendWink: (receiverId: string) => Promise<{ success: boolean; message: string; }>;
}

export const useMapStore = create<MapState>((set, get) => ({
  users: [],
  myLocation: null,
  selectedUser: null,
  loading: false,
  error: null,

  requestLocationPermission: async () => {
    set({ loading: true, error: null });
    if (!navigator.geolocation) {
      set({ error: "Geolocalização não é suportada por este navegador.", loading: false });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        set({ myLocation: location, loading: false });
        
        // Atualiza a localização no banco de dados
        const { error: rpcError } = await supabase.rpc('update_my_location', { lat: latitude, lon: longitude });
        if (rpcError) {
            console.error("Error updating location:", rpcError);
            set({ error: "Não foi possível atualizar sua localização." });
        } else {
            // Após atualizar, busca usuários próximos
            get().fetchNearbyUsers(5000); // Busca num raio de 5km
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        set({ error: "Permissão de localização negada. Por favor, habilite a localização para usar o mapa.", loading: false });
      }
    );
  },

  fetchNearbyUsers: async (radius: number = 5000) => {
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
}));