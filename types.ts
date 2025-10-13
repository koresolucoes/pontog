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
  public_photos?: string[] | null;
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
  online?: boolean;

  // Novos campos detalhados para exibição
  display_name?: string | null;
  tribes?: string[] | null;
  position?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  hiv_status?: string | null;
  public_photos?: string[] | null;
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