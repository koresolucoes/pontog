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
  lat: number;
  lng: number;
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