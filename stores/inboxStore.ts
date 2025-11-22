
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
  realtimeChannel: any | null;
  
  winksHaveBeenSeen: boolean;
  requestsHaveBeenSeen: boolean;
  
  fetchConversations: () => Promise<void>;
  fetchWinks: () => Promise<void>;
  fetchAccessRequests: () => Promise<void>;
  fetchProfileViews: () => Promise<void>;
  respondToRequest: (requestId: number, status: 'granted' | 'denied') => Promise<void>;
  deleteConversation: (conversationId: number) => Promise<void>;
  clearWinks: () => void;
  clearAccessRequests: () => void;
  clearUnreadCountForConversation: (conversationId: number) => void;
  subscribeToInboxChanges: () => void;
  cleanupRealtime: () => void;
}

export const useInboxStore = create<InboxState>((set, get) => {
    
    const updateTotalUnreadCount = () => {
        const { conversations, winks, accessRequests, winksHaveBeenSeen, requestsHaveBeenSeen } = get();
        const unreadMessages = conversations.reduce((sum, convo) => sum + (convo.unread_count || 0), 0);
        
        // A contagem depende da flag 'seen'
        const newWinksCount = winksHaveBeenSeen ? 0 : winks.length;
        const newRequestsCount = requestsHaveBeenSeen ? 0 : accessRequests.length;

        set({ totalUnreadCount: unreadMessages + newWinksCount + newRequestsCount });
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
        winksHaveBeenSeen: true, // Default true, atualizado no fetch
        requestsHaveBeenSeen: true,

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

            // LÓGICA DE PERSISTÊNCIA
            // Verifica o localStorage para ver a última vez que o usuário abriu a aba de winks
            const lastViewedTime = localStorage.getItem('ponto_g_last_viewed_winks');
            let hasNewItems = false;

            if (winksWithAgeAndUrls.length > 0) {
                // Se nunca viu ou se o wink mais recente é mais novo que o último visto
                const newestWinkDate = new Date(winksWithAgeAndUrls[0].wink_created_at); // Assumindo que vem ordenado por data desc
                if (!lastViewedTime || newestWinkDate > new Date(lastViewedTime)) {
                    hasNewItems = true;
                }
            }

            set({ 
                winks: winksWithAgeAndUrls, 
                loadingWinks: false, 
                winksHaveBeenSeen: !hasNewItems // Se tem novos itens, não foi visto. Se não tem, foi visto.
            });
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

            // Lógica de persistência para pedidos também
            const lastViewedTime = localStorage.getItem('ponto_g_last_viewed_requests');
            let hasNewItems = false;

            if (processedRequests.length > 0) {
                // Assumindo que a query retorna ordenado por created_at DESC
                const newestRequestDate = new Date(processedRequests[0].created_at); 
                if (!lastViewedTime || newestRequestDate > new Date(lastViewedTime)) {
                    hasNewItems = true;
                }
            }

            set({ 
                accessRequests: processedRequests, 
                loadingRequests: false, 
                requestsHaveBeenSeen: !hasNewItems 
            });
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
            if (get().winksHaveBeenSeen) return;
            
            const { winks } = get();
            
            if (winks.length > 0) {
                // Salva a data de criação do wink mais recente + 1 segundo
                // Isso garante que ao recarregar, a comparação (newest > last_viewed) seja falsa
                // evitando problemas de diferença de relógio entre cliente/servidor
                const newestWinkDate = new Date(winks[0].wink_created_at).getTime() + 1000;
                localStorage.setItem('ponto_g_last_viewed_winks', new Date(newestWinkDate).toISOString());
            } else {
                localStorage.setItem('ponto_g_last_viewed_winks', new Date().toISOString());
            }
            
            set({ winksHaveBeenSeen: true });
            updateTotalUnreadCount();
        },

        clearAccessRequests: () => {
            if (get().requestsHaveBeenSeen) return;
            
            const { accessRequests } = get();

            if (accessRequests.length > 0) {
                // Mesma lógica de timestamp do servidor para requests
                const newestRequestDate = new Date(accessRequests[0].created_at).getTime() + 1000;
                localStorage.setItem('ponto_g_last_viewed_requests', new Date(newestRequestDate).toISOString());
            } else {
                localStorage.setItem('ponto_g_last_viewed_requests', new Date().toISOString());
            }
            
            set({ requestsHaveBeenSeen: true });
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
