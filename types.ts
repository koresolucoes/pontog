// types.ts

export interface Coordinates {
  lat: number;
  lng: number;
}

// This represents a user profile as fetched from the database
export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  status_text: string | null;
  date_of_birth: string | null;
  height: number | null;
  weight: number | null;
  tribe: string | null;
  position: string | null;
  hiv_status: string | null;
  updated_at: string;
  lat: number;
  lng: number;
}

// The User type can be an extension of Profile with calculated fields like 'age'
export interface User extends Profile {
  age: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string;
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
    // This comes from the join query in albumStore, and Supabase uses the table name
    private_album_photos: PrivateAlbumPhoto[];
}
