import { create } from 'zustand';
import { supabase, getPublicImageUrl } from '../lib/supabase';
import { User, Coordinates } from '../types';
import { useAuthStore } from './authStore';

// Helper function to calculate age from date of birth
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

// Helper to transform raw profile data into a User object
const transformProfileToUser = (profile: any): User => {
  const user = {
    ...profile,
    age: calculateAge(profile.date_of_birth),
    avatar_url: getPublicImageUrl(profile.avatar_url),
    public_photos: (profile.public_photos || []).map(getPublicImageUrl),
    tribes: profile.profile_tribes?.map((pt: any) => pt.tribes.name) || [],
  };
  delete user.profile_tribes; // Clean up joined data
  return user as User;
};


interface MapState {
  users: User[];
  myLocation: Coordinates | null;
  onlineUsers: string[];
  loading: boolean;
  error: string | null;
  selectedUser: User | null;
  watchId: number | null;
  realtimeChannel: any | null; // Supabase Realtime Channel
  presenceChannel: any | null; // Supabase Presence Channel
  filters: {
    onlineOnly: boolean;
  };
  setUsers: (users: User[]) => void;
  setMyLocation: (coords: Coordinates) => void;
  setSelectedUser: (user: User | null) => void;
  setFilters: (newFilters: Partial<{ onlineOnly: boolean }>) => void;
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
  onlineUsers: [],
  loading: true,
  error: null,
  selectedUser: null,
  watchId: null,
  realtimeChannel: null,
  presenceChannel: null,
  filters: {
    onlineOnly: false,
  },
  setUsers: (users) => set({ users }),
  setMyLocation: (coords) => set({ myLocation: coords }),
  setSelectedUser: (user) => set({ selectedUser: user }),
  setFilters: (newFilters) => set(state => ({ filters: { ...state.filters, ...newFilters } })),


  requestLocationPermission: () => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          
          const oldLocation = get().myLocation;
          // Only fetch/update if it's the first time or location changed significantly
          if (!oldLocation || 
              Math.abs(oldLocation.lat - newLocation.lat) > 0.001 || 
              Math.abs(oldLocation.lng - newLocation.lng) > 0.001) {
                
            set({ myLocation: newLocation, loading: false, error: null });
            get().updateMyLocationInDb(newLocation);
            get().fetchNearbyUsers(newLocation);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          set({ 
            loading: false, 
            error: "Não foi possível obter sua localização. Verifique as permissões do seu navegador e tente novamente." 
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      set({ watchId });
      get().setupRealtime();
    } else {
      set({ loading: false, error: "Geolocalização não é suportada por este navegador." });
    }
  },

  stopLocationWatch: () => {
    const { watchId } = get();
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      set({ watchId: null });
    }
  },

  updateMyLocationInDb: async (coords: Coordinates) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
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
    
    // Cleanup existing channels before creating new ones
    get().cleanupRealtime();

    // --- Presence Channel for Online Status ---
    const presenceChannel = supabase.channel('online-users');
    presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const newState = presenceChannel.presenceState();
            const userIds = Object.keys(newState).map(key => newState[key][0].user_id);
            set({ onlineUsers: userIds });
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await presenceChannel.track({ user_id: profile.id, online_at: new Date().toISOString() });
            }
        });

    // --- Realtime Channel for Profile/Location Updates ---
    const realtimeChannel = supabase
        .channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, 
            (payload) => {
                // Re-fetch users when any profile changes
                // A more optimized approach would be to update/add/remove a single user
                // but re-fetching is simpler and safer for now.
                const { myLocation } = get();
                if (myLocation) {
                    get().fetchNearbyUsers(myLocation);
                }
            }
        )
        .subscribe();

    set({ presenceChannel, realtimeChannel });
  },

  cleanupRealtime: () => {
    const { presenceChannel, realtimeChannel } = get();
    if (presenceChannel) supabase.removeChannel(presenceChannel);
    if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    set({ presenceChannel: null, realtimeChannel: null, onlineUsers: [] });
  }
}));