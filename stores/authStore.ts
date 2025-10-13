import { create } from 'zustand';
import { supabase, getPublicImageUrl } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { Profile } from '../types';

interface AuthState {
  session: Session | null;
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, 'tribes'>> & { tribe_ids: number[] }) => Promise<boolean>;
  updateAvatar: (avatarPath: string) => Promise<boolean>;
  updatePublicPhotos: (photoPaths: string[]) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  setSession: (session) => {
    set({ session, user: session?.user ?? null });
    if (session) {
      get().fetchProfile();
    } else {
      set({ profile: null });
    }
  },
  setProfile: (profile) => set({ profile }),
  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          profile_tribes(
            tribes(name)
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const transformedData = {
          ...data,
          tribes: data.profile_tribes.map((pt: any) => pt.tribes.name),
          avatar_url: getPublicImageUrl(data.avatar_url),
          public_photos: (data.public_photos || []).map(getPublicImageUrl),
        };
        delete transformedData.profile_tribes;
        set({ profile: transformedData as Profile });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },
  
  updateProfile: async (updates) => {
    const { tribe_ids, ...profileUpdates } = updates;
    
    const { error } = await supabase.rpc('update_profile_with_tribes', {
        p_username: profileUpdates.username,
        p_status_text: profileUpdates.status_text,
        p_date_of_birth: profileUpdates.date_of_birth,
        p_height_cm: profileUpdates.height_cm,
        p_weight_kg: profileUpdates.weight_kg,
        p_position: profileUpdates.position,
        p_hiv_status: profileUpdates.hiv_status,
        p_tribe_ids: tribe_ids
    });

    if (error) {
        console.error('Error updating profile via RPC:', error);
        return false;
    }
    
    await get().fetchProfile();
    return true;
  },

  updateAvatar: async (avatarPath: string) => {
      const user = get().user;
      if (!user) return false;

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarPath })
        .eq('id', user.id);
      
      if (error) {
        console.error("Error updating avatar path", error);
        return false;
      }

      await get().fetchProfile();
      return true;
  },

  updatePublicPhotos: async (photoPaths: string[]) => {
    const user = get().user;
    if (!user) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ public_photos: photoPaths })
      .eq('id', user.id);

    if (error) {
      console.error("Error updating public photos:", error);
      return false;
    }

    await get().fetchProfile();
    return true;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));

// Initialize store with session
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setSession(session);
  useAuthStore.setState({ loading: false });
});

supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session);
  useAuthStore.setState({ loading: false });
});