// stores/inboxStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ConversationPreview, WinkWithProfile, User, AlbumAccessRequest, ProfileViewWithProfile } from '../types';
import { getPublicImageUrl } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuthStore } from './authStore';

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

interface InboxState {
  conversations: ConversationPreview[];
  winks: WinkWithProfile[];
  accessRequests: AlbumAccessRequest[];
  profileViews: ProfileViewWithProfile[];
  totalUnreadCount: number;
  loadingConversations: boolean;
  loadingWinks: boolean;
  loadingRequests: boolean;
  loadingProfileViews: boolean;
  realtimeChannel: any | null; // Adicionado para a inscrição realtime
  fetchConversations: () => Promise<void>;
  fetchWinks: () => Promise<void>;
  fetchAccessRequests: () => Promise<void>;
  fetchProfileViews: () => Promise<void>;
  respondToRequest: (requestId: number, status: 'granted' | 'denied') => Promise<void>;
  deleteConversation: (conversationId: number) => Promise<void>;
  clearWinks: () => void; // Adicionado para zerar notificações
  clearAccessRequests: () => void; // Adicionado para zerar notificações
  clearUnreadCountForConversation: (conversationId: number) => void;
  subscribeToInboxChanges: () => void;
  cleanupRealtime: () => void;
}

export const useInboxStore = create<InboxState>((set, get) => {
    
    const updateTotalUnreadCount = () => {
        const { conversations, winks, accessRequests } = get();
        const unreadMessages = conversations.reduce((sum, convo) => sum + (convo.unread_count || 0), 0);
        // A contagem agora reflete o estado atual dos arrays
        const newWinks = winks.length; 
        const newRequests = accessRequests.length;
        set({ totalUnreadCount: unreadMessages + newWinks + newRequests });
    };

    return {
        conversations: [],
        winks: [],
        accessRequests: [],
        profileViews: [],
        totalUnreadCount: 0,
        loadingConversations: false,
        loadingWinks: false,
        loadingRequests: false,
        loadingProfileViews: false,
        realtimeChannel: null,

        fetchConversations: async () => {
            set({ loadingConversations: true });
            const { data, error } = await supabase.rpc('get_my_conversations');
            
            if (error) {
                console.error('Error fetching conversations:', error);
                set({ loadingConversations: false });
                return;
            }
            
            const processedConversations = data.map((convo: any) => ({
                ...convo,
                other_participant_avatar_url: getPublicImageUrl(convo.other_participant_avatar_url)
            }))

            set({ conversations: processedConversations, loadingConversations: false });
            updateTotalUnreadCount();
        },

        fetchWinks: async () => {
            set({ loadingWinks: true });
            const { data, error } = await supabase.rpc('get_my_winks');

            if (error) {
                console.error('Error fetching winks:', error);
                set({ loadingWinks: false });
                return;
            }
            
            if (!data) {
                set({ winks: [], loadingWinks: false });
                updateTotalUnreadCount();
                return;
            }

            const winksWithAgeAndUrls = data.map((wink: any) => ({
                ...(wink as User),
                wink_created_at: wink.wink_created_at,
                age: calculateAge(wink.date_of_birth),
                avatar_url: getPublicImageUrl(wink.avatar_url),
                public_photos: (wink.public_photos || []).map(getPublicImageUrl),
            }));

            set({ winks: winksWithAgeAndUrls, loadingWinks: false });
            updateTotalUnreadCount();
        },

        fetchAccessRequests: async () => {
            set({ loadingRequests: true });
            const { data, error } = await supabase.rpc('get_my_album_access_requests');

            if (error) {
                console.error('Error fetching access requests:', error);
                set({ loadingRequests: false });
                return;
            }

            const processedRequests = data.map((req: any) => ({
                ...req,
                avatar_url: getPublicImageUrl(req.avatar_url)
            }));

            set({ accessRequests: processedRequests, loadingRequests: false });
            updateTotalUnreadCount();
        },

        fetchProfileViews: async () => {
            set({ loadingProfileViews: true });
            const { data, error } = await supabase.rpc('get_my_profile_viewers');

            if (error) {
                console.error('Error fetching profile views:', error);
                set({ loadingProfileViews: false });
                return;
            }
            
            if (!data) {
                set({ profileViews: [], loadingProfileViews: false });
                return;
            }

            const viewsWithAgeAndUrls = data.map((view: any) => ({
                ...(view as User),
                viewed_at: view.viewed_at,
                age: calculateAge(view.date_of_birth),
                avatar_url: getPublicImageUrl(view.avatar_url),
                public_photos: (view.public_photos || []).map(getPublicImageUrl),
            }));

            set({ profileViews: viewsWithAgeAndUrls, loadingProfileViews: false });
        },
        
        respondToRequest: async (requestId: number, status: 'granted' | 'denied') => {
            const { error } = await supabase
                .from('private_album_access')
                .update({ status: status, updated_at: new Date().toISOString() })
                .eq('id', requestId);
            
            if (error) {
                toast.error('Erro ao responder à solicitação.');
                console.error('Error responding to request:', error);
            } else {
                toast.success(`Solicitação ${status === 'granted' ? 'aceita' : 'recusada'}.`);
                set(state => ({
                    accessRequests: state.accessRequests.filter(req => req.id !== requestId)
                }));
                updateTotalUnreadCount();
            }
        },

        deleteConversation: async (conversationId: number) => {
            set(state => ({
                conversations: state.conversations.filter(c => c.conversation_id !== conversationId)
            }));
            updateTotalUnreadCount();

            const { error } = await supabase.rpc('delete_conversation', { p_conversation_id: conversationId });

            if (error) {
                toast.error('Erro ao apagar a conversa.');
                console.error('Error deleting conversation:', error);
                get().fetchConversations(); // Re-fetch para reverter
            } else {
                toast.success('Conversa apagada.');
            }
        },

        clearWinks: () => {
            set({ winks: [] });
            updateTotalUnreadCount();
        },

        clearAccessRequests: () => {
            set({ accessRequests: [] });
            updateTotalUnreadCount();
        },
        
        clearUnreadCountForConversation: (conversationId: number) => {
            set(state => ({
                conversations: state.conversations.map(c => 
                    c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c
                )
            }));
            updateTotalUnreadCount();
        },

        subscribeToInboxChanges: () => {
            if (get().realtimeChannel) {
                return;
            }

            const user = useAuthStore.getState().user;
            if (!user) {
                console.error("Cannot subscribe to inbox changes without a user.");
                return;
            }

            const channel = supabase
                .channel(`inbox:${user.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
                    get().fetchConversations();
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'winks', filter: `receiver_id=eq.${user.id}` }, payload => {
                    get().fetchWinks();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'private_album_access', filter: `owner_id=eq.${user.id}` }, payload => {
                    get().fetchAccessRequests();
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profile_views', filter: `viewed_id=eq.${user.id}` }, payload => {
                    get().fetchProfileViews();
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`Subscribed to inbox channel for user ${user.id}`);
                    }
                });
            
            set({ realtimeChannel: channel });
        },

        cleanupRealtime: () => {
            const { realtimeChannel } = get();
            if (realtimeChannel) {
                supabase.removeChannel(realtimeChannel);
                set({ realtimeChannel: null });
            }
        },
    }
});