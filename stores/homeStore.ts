// stores/homeStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { useMapStore } from './mapStore';
import { transformProfileToUser } from '../lib/utils';

interface HomeState {
  popularUsers: User[];
  loading: boolean;
  error: string | null;
  fetchPopularUsers: () => Promise<void>;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  popularUsers: [],
  loading: true,
  error: null,
  fetchPopularUsers: async () => {
    set({ loading: true, error: null });

    const myLocation = useMapStore.getState().myLocation;
    if (!myLocation) {
        console.warn("Cannot fetch popular users without location.");
        set({ loading: false, error: "Sua localização é necessária para ver os perfis." });
        return;
    }
    
    const { data, error } = await supabase.rpc('get_popular_profiles', {
        p_lat: myLocation.lat,
        p_lng: myLocation.lng
    });

    if (error) {
        console.error("Error fetching popular users:", error);
        set({ error: "Erro ao buscar perfis populares.", loading: false });
        return;
    }

    if (data) {
        const transformedUsers = data.map(transformProfileToUser);
        set({ popularUsers: transformedUsers, loading: false });
    }
  },
}));
