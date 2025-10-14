import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { useAuthStore } from './authStore';
import { getPublicImageUrl } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Helper to calculate age from date of birth
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

interface Filters {
  onlineOnly: boolean;
}

interface MapState {
  users: User[];
  onlineUsers: string[];
  filters: Filters;
  selectedUser: User | null;
  currentLocation: { lat: number; lng: number } | null;
  locationWatcherId: number | null;
  realtimeChannel: RealtimeChannel | null;
  setUsers: (users: User[]) => void;
  setOnlineUsers: (users: string[]) => void;
  setFilters: (newFilters: Partial<Filters>) => void;
  setSelectedUser: (user: User | null) => void;
  requestLocationPermission: () => void;
  stopLocationWatch: () => void;
  cleanupRealtime: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  users: [],
  onlineUsers: [],
  filters: { onlineOnly: false },
  selectedUser: null,
  currentLocation: null,
  locationWatcherId: null,
  realtimeChannel: null,

  setUsers: (users) => set({ users }),
  setOnlineUsers: (onlineUserIds) => set({ onlineUsers: onlineUserIds }),
  setFilters: (newFilters) => set(state => ({ filters: { ...state.filters, ...newFilters } })),
  setSelectedUser: (user) => set({ selectedUser: user }),

  requestLocationPermission: () => {
    if (get().locationWatcherId !== null) return; // Already watching

    if (navigator.geolocation) {
      const watcherId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          
          const previousLocation = get().currentLocation;
          set({ currentLocation: newLocation });

          const currentUser = useAuthStore.getState().user;
          if (!currentUser) return;

          // Only update and fetch if location changed significantly
          const locationChanged = !previousLocation || 
            Math.abs(previousLocation.lat - latitude) > 0.0001 || 
            Math.abs(previousLocation.lng - longitude) > 0.0001;

          if (locationChanged) {
            // Update user's own location
            await supabase.from('profiles').update({ lat: latitude, lng: longitude, last_seen: new Date().toISOString() }).eq('id', currentUser.id);
            
            // Fetch nearby users
            const { data, error } = await supabase.rpc('get_nearby_users_with_details', {
              p_lat: latitude,
              p_lng: longitude,
            });

            if (error) {
              console.error("Error fetching nearby users:", error);
            } else if (data) {
              const usersWithAgeAndUrls = data.map((profile: any) => ({
                  ...profile,
                  age: calculateAge(profile.date_of_birth),
                  avatar_url: getPublicImageUrl(profile.avatar_url),
                  public_photos: (profile.public_photos || []).map(getPublicImageUrl),
              }));
              set({ users: usersWithAgeAndUrls });
            }
          }
          
          // Setup realtime if not already
          if (!get().realtimeChannel) {
            const channel = supabase.channel('public:profiles');
            
            channel
              .on('presence', { event: 'sync' }, () => {
                const presenceState = channel.presenceState();
                const onlineUserIds = Object.keys(presenceState);
                set({ onlineUsers: onlineUserIds });
              })
              .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                  await channel.track({ online_at: new Date().toISOString() });
                }
              });

            set({ realtimeChannel: channel });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
      set({ locationWatcherId: watcherId });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  },

  stopLocationWatch: () => {
    const { locationWatcherId } = get();
    if (locationWatcherId !== null) {
      navigator.geolocation.clearWatch(locationWatcherId);
      set({ locationWatcherId: null });
    }
  },
  
  cleanupRealtime: async () => {
      const { realtimeChannel } = get();
      if (realtimeChannel) {
          await supabase.removeChannel(realtimeChannel);
          set({ realtimeChannel: null, onlineUsers: [] });
      }
  }
}));
