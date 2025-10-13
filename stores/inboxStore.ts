// stores/inboxStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ConversationPreview, WinkWithProfile, User } from '../types';
import { getPublicImageUrl } from '../lib/supabase';

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
  loadingConversations: boolean;
  loadingWinks: boolean;
  fetchConversations: () => Promise<void>;
  fetchWinks: () => Promise<void>;
}

export const useInboxStore = create<InboxState>((set) => ({
  conversations: [],
  winks: [],
  loadingConversations: false,
  loadingWinks: false,

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
}));