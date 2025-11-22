
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, Coordinates } from '../types';
import { useAuthStore } from './authStore';
import { transformProfileToUser } from '../lib/utils';
import toast from 'react-hot-toast';

interface MapState {
  users: User[];
  myLocation: Coordinates | null; // A localização do GPS do usuário
  onlineUsers: string[];
  loading: boolean;
  error: string | null;
  selectedUser: User | null;
  watchId: number | null; // This will now hold an interval ID
  realtimeChannel: any | null; // Supabase Realtime Channel
  presenceChannel: any | null; // Supabase Presence Channel
  filters: {
    onlineOnly: boolean;
    minAge: number | null;
    maxAge: number | null;
    positions: string[];
    tribes: string[];
  };
  setUsers: (users: User[]) => void;
  setMyLocation: (coords: Coordinates) => void;
  setSelectedUser: (user: User | null) => void;
  setFilters: (newFilters: Partial<MapState['filters']>) => void;
  requestLocationPermission: () => void;
  stopLocationWatch: () => void;
  updateMyLocationInDb: (coords: Coordinates) => Promise<void>;
  fetchNearbyUsers: (coords: Coordinates) => Promise<void>;
  setupRealtime: () => void;
  cleanupRealtime: () => void;
  enableTravelMode: (coords: Coordinates) => Promise<void>;
  disableTravelMode: () => Promise<void>;
}

export const useMapStore = create<MapState>((set, get) => ({
  users: [],
  myLocation: null,
  onlineUsers: [],
  loading: true,
  error: null,
  selectedUser: null,
  watchId: null,
  realtimeChannel: null,
  presenceChannel: null,
  filters: {
    onlineOnly: false,
    minAge: 18,
    maxAge: 99,
    positions: [],
    tribes: [],
  },
  setUsers: (users) => set({ users }),
  setMyLocation: (coords) => set({ myLocation: coords }),
  setSelectedUser: (user) => set({ selectedUser: user }),
  setFilters: (newFilters) => set(state => ({ filters: { ...state.filters, ...newFilters } })),

  requestLocationPermission: () => {
    const authUser = useAuthStore.getState().user;
    
    // Se o usuário estiver em modo viajante, NÃO iniciamos o GPS.
    // Usamos a localização salva no banco.
    if (authUser?.is_traveling && authUser.lat && authUser.lng) {
        console.log("Modo Viajante detectado. Usando coordenadas salvas.", { lat: authUser.lat, lng: authUser.lng });
        const travelLocation = { lat: authUser.lat, lng: authUser.lng };
        
        // Define a localização imediatamente
        set({ myLocation: travelLocation, loading: false, error: null });
        
        // Busca usuários com base na localização de viagem
        get().fetchNearbyUsers(travelLocation);
        
        // Inicia o Realtime para manter os dados atualizados
        get().setupRealtime();
        return;
    }

    // Se não estiver em modo viajante, limpa watchers antigos e inicia GPS
    if (get().watchId) {
      get().stopLocationWatch();
    }

    if (navigator.geolocation) {
      const updateLocation = () => {
        // Verifica novamente se entrou em modo viagem durante o intervalo para evitar conflito
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.is_traveling) {
            get().stopLocationWatch();
            return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newLocation = { lat: latitude, lng: longitude };
            
            const oldLocation = get().myLocation;
            // Apenas atualiza se a localização mudou significativamente ou se é a primeira vez
            if (!oldLocation || 
                Math.abs(oldLocation.lat - newLocation.lat) > 0.0005 || 
                Math.abs(oldLocation.lng - newLocation.lng) > 0.0005) {
                
              set({ myLocation: newLocation, loading: false, error: null });
              get().updateMyLocationInDb(newLocation);
              get().fetchNearbyUsers(newLocation);
            } else if (get().loading) {
              set({ loading: false });
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            // Se houver erro no GPS, não sobrescreva se já tivermos uma localização válida (ex: modo viajante acabou de ser desativado)
            if (!get().myLocation) {
                set({ 
                  loading: false, 
                  error: "Não foi possível obter sua localização. Verifique as permissões do seu navegador e tente novamente." 
                });
            }
            get().stopLocationWatch();
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      };

      updateLocation();
      const intervalId = setInterval(updateLocation, 30000);
      set({ watchId: intervalId as any });
      get().setupRealtime();

    } else {
      set({ loading: false, error: "Geolocalização não é suportada por este navegador." });
    }
  },

  stopLocationWatch: () => {
    const { watchId } = get();
    if (watchId !== null) {
      clearInterval(watchId);
      set({ watchId: null });
    }
  },

  updateMyLocationInDb: async (coords: Coordinates) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    // Se estiver viajando, não atualiza com GPS para não sobrescrever o ponto fixo
    if (user.is_traveling) return;

    const { lat, lng } = coords;
    await supabase.rpc('update_my_location', {
        new_lat: lat,
        new_lng: lng
    });
  },

  fetchNearbyUsers: async (coords: Coordinates) => {
    // const user = useAuthStore.getState().user; // Removido check desnecessário que poderia causar race conditions
    
    const { lat, lng } = coords;
    const { data, error } = await supabase.rpc('get_nearby_profiles', {
        p_lat: lat,
        p_lng: lng
    });

    if (error) {
        console.error("Error fetching nearby users:", error);
        set({ error: "Erro ao buscar usuários próximos." });
        return;
    }

    if (data) {
        const transformedUsers = data.map(transformProfileToUser);
        set({ users: transformedUsers });
    }
  },

  setupRealtime: () => {
    // Garante que só existe uma conexão ativa
    get().cleanupRealtime();

    const profile = useAuthStore.getState().profile;
    if (!profile) return;

    // Canal de Presença (Online/Offline)
    const presenceChannel = supabase.channel('online-users');
    presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const newState = presenceChannel.presenceState();
            const userIds = Object.keys(newState).map(key => (newState[key][0] as any).user_id);
            set({ onlineUsers: userIds });
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await presenceChannel.track({ user_id: profile.id, online_at: new Date().toISOString() });
            }
        });

    // Canal de Dados (Atualizações de Perfil/Localização)
    const realtimeChannel = supabase
        .channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' },
            (payload) => {
                // Quando houver qualquer mudança na tabela de perfis (alguém moveu, mudou foto, etc.)
                // Recarregamos os usuários próximos baseados na MINHA localização atual.
                // A 'myLocation' aqui já estará correta (GPS ou Viajante) graças ao requestLocationPermission.
                const currentLocation = get().myLocation;
                if (currentLocation) {
                    console.log("Realtime update received. Refreshing map for location:", currentLocation);
                    get().fetchNearbyUsers(currentLocation);
                }
            }
        )
        .subscribe();

    set({ presenceChannel, realtimeChannel });
  },

  cleanupRealtime: () => {
    const { realtimeChannel, presenceChannel } = get();
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
    }
    if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
    }
    set({ realtimeChannel: null, presenceChannel: null });
  },

  enableTravelMode: async (coords: Coordinates) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      get().stopLocationWatch();
      
      // Atualização Otimista da UI
      set({ myLocation: coords, loading: true });
      
      // Atualiza a store de Auth para que a persistência funcione se o usuário der F5 imediatamente
      useAuthStore.setState({ 
          user: { ...user, lat: coords.lat, lng: coords.lng, is_traveling: true },
          profile: { ...useAuthStore.getState().profile!, lat: coords.lat, lng: coords.lng, is_traveling: true }
      });

      const { error } = await supabase
          .from('profiles')
          .update({ 
              lat: coords.lat, 
              lng: coords.lng, 
              is_traveling: true 
          })
          .eq('id', user.id);

      if (error) {
          console.error("Error enabling travel mode:", error);
          toast.error("Erro ao ativar Modo Viajante.");
          get().requestLocationPermission(); // Fallback to GPS
          
          // Reverte store de Auth em caso de erro
          useAuthStore.getState().fetchProfile(user);
      } else {
          get().fetchNearbyUsers(coords);
          get().setupRealtime(); // Garante que o realtime continua ativo na nova coordenada
          toast.success("Modo Viajante ativado! ✈️");
      }
      set({ loading: false });
  },

  disableTravelMode: async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      set({ loading: true });

      const { error } = await supabase
          .from('profiles')
          .update({ is_traveling: false })
          .eq('id', user.id);

      if (error) {
          toast.error("Erro ao desativar Modo Viajante.");
          set({ loading: false });
      } else {
          useAuthStore.setState({ 
              user: { ...user, is_traveling: false },
              profile: { ...useAuthStore.getState().profile!, is_traveling: false }
          });
          toast.success("Bem-vindo de volta!");
          
          // Reinicia GPS limpo
          set({ myLocation: null }); 
          get().requestLocationPermission();
      }
  }
}));
