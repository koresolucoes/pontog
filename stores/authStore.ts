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
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
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
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      // Fix: Construct full public URL for the avatar.
      if (data) {
        data.avatar_url = getPublicImageUrl(data.avatar_url);
      }
      set({ profile: data });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },
  updateProfile: async (updates: Partial<Profile>) => {
    const user = get().user;
    if (!user) return false;
    
    // Do not update the lat/lng from the profile edit form.
    const { lat, lng, ...restUpdates } = updates;

    const { error } = await supabase.from('profiles').update(restUpdates).eq('id', user.id);
    
    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }
    
    // Refresh local profile data
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
