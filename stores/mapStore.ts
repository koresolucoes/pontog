
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
        console.log("User is in travel mode. Skipping GPS.");
        const travelLocation = { lat: authUser.lat, lng: authUser.lng };
        set({ myLocation: travelLocation, loading: false, error: null });
        get().fetchNearbyUsers(travelLocation);
        get().setupRealtime();
        return;
    }

    if (get().watchId) {
      get().stopLocationWatch();
    }

    if (navigator.geolocation) {
      const updateLocation = () => {
        // Verifica novamente se entrou em modo viagem durante o intervalo
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
              // Se a localização não mudou, mas ainda estávamos carregando, para de carregar.
              set({ loading: false });
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            set({ 
              loading: false, 
              error: "Não foi possível obter sua localização. Verifique as permissões do seu navegador e tente novamente." 
            });
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
    // Se estiver viajando, não atualiza com GPS
    if (user.is_traveling) return;

    const { lat, lng } = coords;
    await supabase.rpc('update_my_location', {
        new_lat: lat,
        new_lng: lng
    });
  },

  fetchNearbyUsers: async (coords: Coordinates) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
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
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    
    get().cleanupRealtime();

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

    const realtimeChannel = supabase
        .channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' },
            (payload) => {
                if (get().myLocation) {
                    get().fetchNearbyUsers(get().myLocation!);
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
      set({ myLocation: coords, loading: true });

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
      } else {
          // Update local auth store
          useAuthStore.setState({ 
              user: { ...user, lat: coords.lat, lng: coords.lng, is_traveling: true } 
          });
          get().fetchNearbyUsers(coords);
          toast.success("Modo Viajante ativado! ✈️");
      }
      set({ loading: false });
  },

  disableTravelMode: async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const { error } = await supabase
          .from('profiles')
          .update({ is_traveling: false })
          .eq('id', user.id);

      if (error) {
          toast.error("Erro ao desativar Modo Viajante.");
      } else {
          useAuthStore.setState({ 
              user: { ...user, is_traveling: false } 
          });
          toast.success("Bem-vindo de volta!");
          // Reinicia GPS
          get().requestLocationPermission();
      }
  }
}));
