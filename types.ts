// types.ts

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Tribe {
    id: number;
    name: string;
}

// Representa um perfil de usuário, alinhado com o novo schema do DB
export interface Profile {
  id: string;
  username: string;
  email: string; // Adicionado para o painel admin
  display_name: string | null;
  avatar_url: string;
  public_photos: string[] | null;
  status_text: string | null;
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  tribes: string[] | null; // A RPC retorna um array de nomes para simplicidade
  position: string | null;
  hiv_status: string | null;
  updated_at: string;
  created_at: string;
  lat: number;
  lng: number;
  last_seen: string | null; // Adicionado para status de atividade
  distance_km: number | null; // Adicionado para distância
  subscription_tier: 'free' | 'plus'; // Adicionado para o plano premium
  subscription_expires_at: string | null; // Adicionado para data de expiração
  is_incognito: boolean; // Adicionado para o Modo Invisível
  has_completed_onboarding: boolean; // Adicionado para o fluxo de boas-vindas
  has_private_albums: boolean; // Adicionado para saber se o usuário tem álbuns
  status: 'active' | 'suspended' | 'banned'; // Adicionado para moderação
  suspended_until: string | null; // Adicionado para moderação
}

// O tipo User estende Profile com campos calculados como 'idade'
export interface User extends Profile {
  age: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string;
  image_url: string | null;
  is_view_once: boolean | null;
  viewed_at: string | null;
  created_at: string;
  read_at: string | null; // Adicionado para confirmação de leitura
  updated_at: string | null; // Adicionado para rastrear edições
}

export interface PrivateAlbumPhoto {
    id: number;
    album_id: number;
    user_id: string;
    photo_path: string;
    created_at: string;
}

export interface PrivateAlbum {
    id: number;
    user_id: string;
    name: string;
    created_at: string;
    // Isso vem da query com join no albumStore, e Supabase usa o nome da tabela
    private_album_photos: PrivateAlbumPhoto[];
}

// Novo tipo para a lista de conversas na caixa de entrada
export interface ConversationPreview {
    conversation_id: number;
    other_participant_id: string;
    other_participant_username: string;
    other_participant_avatar_url: string;
    other_participant_last_seen: string | null; // Adicionado para status de atividade
    last_message_content: string;
    last_message_created_at: string;
    last_message_sender_id: string;
    unread_count: number; // Adicionado para contagem de não lidas
    other_participant_subscription_tier: 'free' | 'plus';
}

// Novo tipo para os winks na caixa de entrada (basicamente um User)
export interface WinkWithProfile extends User {
    wink_created_at: string;
}

// Novo tipo para os visitantes do perfil (Quem Me Viu)
export interface ProfileViewWithProfile extends User {
    viewed_at: string;
}

// Novos tipos para acesso a álbuns privados
export type AlbumAccessStatus = 'pending' | 'granted' | 'denied' | null;

export interface AlbumAccessRequest {
    id: number;
    requester_id: string;
    created_at: string;
    username: string;
    avatar_url: string;
}

// Novo tipo para a funcionalidade 'Agora', agora com interações
export interface AgoraPost {
    id: number;
    user_id: string;
    photo_url: string;
    status_text: string | null;
    expires_at: string;
    // Campos do perfil do usuário, vindos do join
    username: string;
    avatar_url: string;
    age: number;
    // Campos de interação
    likes_count: number;
    comments_count: number;
    user_has_liked: boolean;
}

// Novo tipo para os comentários do modo 'Agora'
export interface AgoraComment {
    id: number;
    post_id: number;
    user_id: string;
    content: string;
    created_at: string;
    // Campos do perfil do autor do comentário
    profiles: {
        username: string;
        avatar_url: string;
    };
    // Campos de interação para os comentários
    likes_count: number;
    user_has_liked: boolean;
}

// Novo tipo para as preferências de notificação
export type NotificationType = 'new_message' | 'new_wink' | 'new_album_request';

export interface NotificationPreference {
    notification_type: NotificationType;
    enabled: boolean;
}