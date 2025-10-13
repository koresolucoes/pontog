import { create } from 'zustand';
import { supabase, getPublicImageUrl } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { Profile, User } from '../types';

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

interface AuthState {
  session: Session | null;
  user: User | null; // This will be the combined user + profile object
  profile: Profile | null; // This is the raw profile from the DB
  loading: boolean;
  setSession: (session: Session | null) => void;
  fetchProfile: (user: SupabaseUser) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  setSession: (session) => set({ session }),

  fetchProfile: async (supabaseUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          profile_tribes (
            tribes (
              id,
              name
            )
          )
        `)
        .eq('id', supabaseUser.id)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116: single row not found, which is fine on first login
        throw error;
      }
      
      if (data) {
        // Transform the raw profile data into the User object
        const profileData: Profile = {
            ...data,
            avatar_url: getPublicImageUrl(data.avatar_url),
            public_photos: (data.public_photos || []).map(getPublicImageUrl),
            tribes: data.profile_tribes?.map((pt: any) => pt.tribes.name) || [],
        };
        delete (profileData as any).profile_tribes; // Clean up joined data
        
        const userData: User = {
            ...profileData,
            age: calculateAge(profileData.date_of_birth),
        };

        set({ profile: profileData, user: userData });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will handle setting state to null
  },
}));

// Initial check for session on app load
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setSession(session);
  if (session?.user) {
    useAuthStore.getState().fetchProfile(session.user);
  } else {
    // If no session, we're done loading
    useAuthStore.setState({ loading: false });
  }
});

// Listen to auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session);
  if (session?.user) {
    useAuthStore.getState().fetchProfile(session.user);
  } else {
    // User signed out
    useAuthStore.setState({ session: null, user: null, profile: null });
  }
});
