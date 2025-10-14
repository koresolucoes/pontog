import { create } from 'zustand';
import { supabase, getPublicImageUrl } from '../lib/supabase';
import { AgoraPost, AgoraComment } from '../types';
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
  toggleLikePost: (postId: number) => Promise<void>;
  addComment: (postId: number, content: string) => Promise<void>;
  fetchCommentsForPost: (postId: number) => Promise<AgoraComment[]>;
  toggleLikeComment: (commentId: number, hasLiked: boolean) => Promise<void>;
}

export const useAgoraStore = create<AgoraState>((set, get) => ({
  posts: [],
  agoraUserIds: [],
  isLoading: false,
  isActivating: false,

  fetchAgoraPosts: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase.rpc('get_active_agora_posts_with_details');
    
    if (error) {
      console.error('Error fetching Agora posts:', error);
      set({ isLoading: false });
      return;
    }
    
    const formattedPosts = data.map((p: any) => ({
        ...p,
        photo_url: getPublicImageUrl(p.photo_url),
        avatar_url: getPublicImageUrl(p.avatar_url),
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

    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();

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
      await get().fetchAgoraPosts();
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

  toggleLikePost: async (postId: number) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const post = get().posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update
    const hasLiked = post.user_has_liked;
    set(state => ({
      posts: state.posts.map(p => 
        p.id === postId 
        ? { ...p, user_has_liked: !hasLiked, likes_count: hasLiked ? p.likes_count - 1 : p.likes_count + 1 } 
        : p
      )
    }));

    if (hasLiked) {
      await supabase.from('agora_post_likes').delete().match({ post_id: postId, user_id: user.id });
    } else {
      await supabase.from('agora_post_likes').insert({ post_id: postId, user_id: user.id });
    }
  },

  addComment: async (postId: number, content: string) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      toast.error('Você precisa estar logado para comentar.');
      return;
    }
    const { error } = await supabase.from('agora_post_comments').insert({ post_id: postId, user_id: user.id, content });

    if (error) {
        toast.error('Erro ao enviar comentário.');
    } else {
        set(state => ({
            posts: state.posts.map(p =>
                p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
            )
        }));
    }
  },

  fetchCommentsForPost: async (postId: number): Promise<AgoraComment[]> => {
    const { data, error } = await supabase.rpc('get_comments_for_post_with_details', { p_post_id: postId });

    if (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
    
    return data.map((comment: any) => ({
        ...comment,
        profiles: {
            ...comment.profiles,
            avatar_url: getPublicImageUrl(comment.profiles.avatar_url),
        }
    }));
  },

  toggleLikeComment: async (commentId: number, hasLiked: boolean) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    if (hasLiked) {
      // User has liked, so we need to delete the like
      await supabase.from('agora_comment_likes').delete().match({ comment_id: commentId, user_id: user.id });
    } else {
      // User has not liked, so we insert a like
      await supabase.from('agora_comment_likes').insert({ comment_id: commentId, user_id: user.id });
    }
    // The component handles the optimistic update, so no need to refetch here.
  },

}));

useAgoraStore.getState().fetchAgoraPosts();