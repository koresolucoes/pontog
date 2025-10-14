import { create } from 'zustand';
import { supabase, getPublicImageUrl } from '../lib/supabase';
import { AgoraPost } from '../types';
import { useAuthStore } from './authStore';
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

interface AgoraState {
  posts: AgoraPost[];
  agoraUserIds: string[];
  isLoading: boolean;
  isActivating: boolean;
  fetchAgoraPosts: () => Promise<void>;
  activateAgoraMode: (photoFile: File, statusText: string) => Promise<void>;
  deactivateAgoraMode: () => Promise<void>;
}

export const useAgoraStore = create<AgoraState>((set, get) => ({
  posts: [],
  agoraUserIds: [],
  isLoading: false,
  isActivating: false,

  fetchAgoraPosts: async () => {
    set({ isLoading: true });
    // Usamos uma RPC para buscar os posts e já fazer o join com os perfis
    const { data, error } = await supabase.rpc('get_active_agora_posts');
    
    if (error) {
      console.error('Error fetching Agora posts:', error);
      set({ isLoading: false });
      return;
    }
    
    const formattedPosts = data.map((p: any) => ({
        ...p,
        photo_url: getPublicImageUrl(p.photo_url),
        avatar_url: getPublicImageUrl(p.avatar_url), // o RPC retorna o avatar_url do perfil
        age: calculateAge(p.date_of_birth),
    }));

    set({ 
        posts: formattedPosts, 
        agoraUserIds: formattedPosts.map((p: AgoraPost) => p.user_id),
        isLoading: false 
    });
  },

  activateAgoraMode: async (photoFile: File, statusText: string) => {
    set({ isActivating: true });
    const user = useAuthStore.getState().user;
    if (!user) {
      toast.error('Você precisa estar logado.');
      set({ isActivating: false });
      return;
    }

    const toastId = toast.loading('Ativando modo Agora...');

    // 1. Upload da foto
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `agora_${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('user_uploads')
      .upload(filePath, photoFile);

    if (uploadError) {
      toast.error('Falha ao enviar a foto.', { id: toastId });
      set({ isActivating: false });
      return;
    }

    // 2. Insere ou atualiza o post na tabela
    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora a partir de agora

    const { error: upsertError } = await supabase
      .from('agora_posts')
      .upsert({
        user_id: user.id,
        photo_url: filePath,
        status_text: statusText,
        expires_at: expires_at,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      toast.error('Erro ao ativar o modo Agora.', { id: toastId });
      console.error(upsertError);
    } else {
      toast.success('Modo Agora ativado por 1 hora!', { id: toastId });
      await get().fetchAgoraPosts(); // Re-fetch para atualizar a UI
    }
    
    set({ isActivating: false });
  },

  deactivateAgoraMode: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    const { error } = await supabase
      .from('agora_posts')
      .delete()
      .eq('user_id', user.id);
      
    if (error) {
      toast.error('Erro ao desativar.');
    } else {
      toast.success('Modo Agora desativado.');
      await get().fetchAgoraPosts();
    }
  },
}));

// Adiciona uma chamada inicial para carregar os posts
useAgoraStore.getState().fetchAgoraPosts();