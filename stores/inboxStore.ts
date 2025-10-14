// stores/inboxStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ConversationPreview, WinkWithProfile, User, AlbumAccessRequest, ProfileViewWithProfile } from '../types';
import { getPublicImageUrl } from '../lib/supabase';
import toast from 'react-hot-toast';

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
  loadingConversations: boolean;
  loadingWinks: boolean;
  loadingRequests: boolean;
  loadingProfileViews: boolean;
  fetchConversations: () => Promise<void>;
  fetchWinks: () => Promise<void>;
  fetchAccessRequests: () => Promise<void>;
  fetchProfileViews: () => Promise<void>;
  respondToRequest: (requestId: number, status: 'granted' | 'denied') => Promise<void>;
  deleteConversation: (conversationId: number) => Promise<void>;
}

export const useInboxStore = create<InboxState>((set, get) => ({
  conversations: [],
  winks: [],
  accessRequests: [],
  profileViews: [],
  loadingConversations: false,
  loadingWinks: false,
  loadingRequests: false,
  loadingProfileViews: false,

  fetchConversations: async () => {
    set({ loadingConversations: true });
    // A RPC get_my_conversations foi atualizada para retornar `unread_count` e `last_seen`
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
        return;
    }

    // O RPC já retorna o perfil completo, só precisamos adicionar a idade e processar URLs
    const winksWithAgeAndUrls = data.map((wink: any) => ({
        ...(wink as User),
        wink_created_at: wink.wink_created_at,
        age: calculateAge(wink.date_of_birth),
        avatar_url: getPublicImageUrl(wink.avatar_url),
        public_photos: (wink.public_photos || []).map(getPublicImageUrl),
    }));

    set({ winks: winksWithAgeAndUrls, loadingWinks: false });
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
        // Remove from list optimistically
        set(state => ({
            accessRequests: state.accessRequests.filter(req => req.id !== requestId)
        }));
    }
  },

  deleteConversation: async (conversationId: number) => {
    // Optimistic update
    set(state => ({
        conversations: state.conversations.filter(c => c.conversation_id !== conversationId)
    }));

    const { error } = await supabase.rpc('delete_conversation', { p_conversation_id: conversationId });

    if (error) {
        toast.error('Erro ao apagar a conversa.');
        console.error('Error deleting conversation:', error);
        // Re-fetch to revert optimistic update
        get().fetchConversations();
    } else {
        toast.success('Conversa apagada.');
    }
  },
}));