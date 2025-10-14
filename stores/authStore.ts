import { create } from 'zustand';
import { supabase, getPublicImageUrl } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { Profile, User } from '../types';
import { calculateAge } from '../lib/utils';
import { usePwaStore } from './pwaStore';
import toast from 'react-hot-toast';

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
            distance_km: null, // Distance is not relevant for the auth user's own profile
            subscription_tier: data.subscription_tier || 'free',
        };
        delete (profileData as any).profile_tribes; // Clean up joined data
        
        const userData: User = {
            ...profileData,
            age: calculateAge(profileData.date_of_birth),
        };

        set({ profile: profileData, user: userData });
      } else {
        // FIX: Profile not found, so create it. This handles new OAuth sign-ups.
        console.log('No profile found for user, creating a new one.');
        const newProfileData = {
          id: supabaseUser.id,
          username: supabaseUser.email!.split('@')[0],
          display_name: supabaseUser.user_metadata?.full_name || supabaseUser.email!.split('@')[0],
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          subscription_tier: 'free', // Default to free on creation
        };

        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfileData)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }

        if (insertedProfile) {
          const profileData: Profile = {
            ...(insertedProfile as unknown as Profile),
            avatar_url: getPublicImageUrl(insertedProfile.avatar_url),
            public_photos: [],
            tribes: [],
            distance_km: null,
            subscription_tier: 'free',
          };
  
          const userData: User = {
            ...profileData,
            age: calculateAge(profileData.date_of_birth),
          };

          set({ profile: profileData, user: userData });
        }
      }
    } catch (error) {
      console.error('Error fetching/creating profile:', error);
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (error) {
        toast.error('Erro ao sair.');
        console.error(error);
        set({ loading: false });
    }
    // The onAuthStateChange listener will handle all state cleanup.
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
supabase.auth.onAuthStateChange(async (_event, session) => {
  useAuthStore.getState().setSession(session);
  if (session?.user) {
    // User signed in
    useAuthStore.getState().fetchProfile(session.user);
    usePwaStore.getState().relinkSubscriptionOnLogin();
  } else {
    // User signed out, reset all application state.
    useAuthStore.setState({ session: null, user: null, profile: null, loading: false });

    // Use dynamic imports to prevent circular dependencies and reset all stores.
    // This is the single source of truth for a logout event.
    (await import('./pwaStore')).usePwaStore.getState().unlinkSubscriptionOnLogout();
    // Fix: Remove `replace: true` and provide the full initial data state to reset stores correctly without TypeScript errors.
    (await import('./inboxStore')).useInboxStore.setState({ conversations: [], winks: [], accessRequests: [], loadingConversations: false, loadingWinks: false, loadingRequests: false });
    (await import('./albumStore')).useAlbumStore.setState({ myAlbums: [], viewedUserAlbums: [], viewedUserAccessStatus: null, isUploading: false, isLoading: false, isFetchingViewedUserAlbums: false });
    (await import('./notificationStore')).useNotificationStore.setState({ preferences: [], loading: false });
    (await import('./mapStore')).useMapStore.getState().stopLocationWatch();
    (await import('./mapStore')).useMapStore.getState().cleanupRealtime();
    (await import('./mapStore')).useMapStore.setState({ users: [], myLocation: null, selectedUser: null, onlineUsers: [], loading: true, error: null, filters: { onlineOnly: false } });
    (await import('./agoraStore')).useAgoraStore.setState({ posts: [], agoraUserIds: [], isLoading: false, isActivating: false });
    (await import('./homeStore')).useHomeStore.setState({ popularUsers: [], loading: true, error: null });
    (await import('./uiStore')).useUiStore.setState({ chatUser: null, activeView: 'home', isSubscriptionModalOpen: false });
  }
});