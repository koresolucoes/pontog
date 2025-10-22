import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, Coordinates } from '../types';
import { useAuthStore } from './authStore';
import { transformProfileToUser } from '../lib/utils';

interface MapState {
  users: User[];
  myLocation: Coordinates | null; // A localização efetiva (real ou simulada)
  gpsLocation: Coordinates | null; // A localização real do GPS
  simulatedLocation: { name: string; coords: Coordinates } | null; // A localização buscada pelo usuário
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
  setSimulatedLocation: (location: { name: string; coords: Coordinates } | null) => void;
  requestLocationPermission: () => void;
  stopLocationWatch: () => void;
  updateMyLocationInDb: (coords: Coordinates) => Promise<void>;
  fetchNearbyUsers: (coords: Coordinates) => Promise<void>;
  setupRealtime: () => void;
  cleanupRealtime: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  users: [],
  myLocation: null,
  gpsLocation: null,
  simulatedLocation: null,
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

  setSimulatedLocation: (location) => {
    set({ simulatedLocation: location });
    if (location === null) {
      const gpsLoc = get().gpsLocation;
      set({ myLocation: gpsLoc });
    } else {
      set({ myLocation: location.coords });
    }
  },

  requestLocationPermission: () => {
    if (get().watchId) {
      get().stopLocationWatch();
    }

    if (navigator.geolocation) {
      const updateLocation = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newGpsLocation = { lat: latitude, lng: longitude };
            set({ gpsLocation: newGpsLocation });
            
            // Apenas atualiza myLocation se não houver simulação ativa
            if (!get().simulatedLocation) {
              const oldLocation = get().myLocation;
              if (!oldLocation || 
                  Math.abs(oldLocation.lat - newGpsLocation.lat) > 0.0005 || 
                  Math.abs(oldLocation.lng - newGpsLocation.lng) > 0.0005) {
                  
                set({ myLocation: newGpsLocation, loading: false, error: null });
                get().updateMyLocationInDb(newGpsLocation);
                get().fetchNearbyUsers(newGpsLocation);
              } else if (get().loading) {
                set({ loading: false });
              }
            } else if (get().loading) {
                 set({loading: false});
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
    if (!user || get().simulatedLocation) return; // Não atualiza o DB com localização simulada
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
}));
