export interface Profile {
  id: string;
  updated_at?: string;
  username: string;
  avatar_url: string;
  status_text: string | null;
  date_of_birth?: string | null;
}

export interface User {
  id: string;
  username: string;
  avatar_url: string;
  status_text: string | null;
  date_of_birth: string | null;
  lat: number;
  lng: number;
  distance_meters: number;
  age: number;
  online?: boolean; // Temporário, até termos presença real
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
