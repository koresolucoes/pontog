export interface Profile {
  id: string;
  updated_at?: string;
  username: string;
  avatar_url: string;
  status_text: string | null;
  date_of_birth?: string | null;
  
  // Novos campos detalhados
  display_name?: string | null;
  tribes?: string[] | null;
  position?: string | null; // e.g., 'Ativo', 'Passivo', 'Versátil'
  height_cm?: number | null;
  weight_kg?: number | null;
  hiv_status?: string | null; // e.g., 'Negativo', 'Em PrEP', 'Indetectável'
  public_photos?: string[] | null; // Armazenará os PATHS das fotos no storage
}

export interface User extends Profile {
  lat: number;
  lng: number;
  distance_meters: number;
  age: number;
  online?: boolean;
}

export interface Message {
  id: number;
  sender_id: string;
  conversation_id: number;
  content: string;
  created_at: string;
}

export type Coordinates = {
  lat: number;
  lng: number;
};

export interface PrivateAlbum {
    id: number;
    user_id: string;
    name: string;
    created_at: string;
    photos?: PrivateAlbumPhoto[]; // Opcional, para carregar fotos junto com o álbum
}

export interface PrivateAlbumPhoto {
    id: number;
    album_id: number;
    user_id: string;
    photo_path: string;
    created_at: string;
}
