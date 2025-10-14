// lib/utils.ts
import { format, formatDistanceToNow, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPublicImageUrl } from './supabase';
import { User } from '../types';

/**
 * Formata um timestamp para uma string de "visto por último" legível.
 * Considera um usuário online se esteve ativo nos últimos 5 minutos.
 * @param timestamp A string de data/hora ISO.
 * @returns Uma string formatada como "Online", "Visto hoje às 14:30", etc.
 */
export const formatLastSeen = (timestamp: string | null | undefined): string => {
    if (!timestamp) return 'Offline';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // Considera online se a última atividade foi há menos de 5 minutos
    if (differenceInMinutes(now, date) < 5) {
        return 'Online';
    }

    if (isToday(date)) {
        return `Visto hoje às ${format(date, 'HH:mm', { locale: ptBR })}`;
    }
    if (isYesterday(date)) {
        return `Visto ontem às ${format(date, 'HH:mm', { locale: ptBR })}`;
    }
    return `Visto ${formatDistanceToNow(date, { addSuffix: true, locale: ptBR })}`;
};

/**
 * Calculates age from a date of birth string.
 * @param dob Date of birth string (e.g., 'YYYY-MM-DD').
 * @returns The calculated age as a number.
 */
export const calculateAge = (dob: string | null): number => {
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

/**
 * Transforms a raw profile object from a Supabase RPC into a typed User object.
 * Processes image URLs and calculates age.
 * @param profile The raw profile data from the database.
 * @returns A formatted User object.
 */
export const transformProfileToUser = (profile: any): User => {
  const user = {
    ...profile,
    age: calculateAge(profile.date_of_birth),
    avatar_url: getPublicImageUrl(profile.avatar_url),
    public_photos: (profile.public_photos || []).map(getPublicImageUrl),
    // The RPC joins tribes and returns them in a nested structure.
    tribes: profile.profile_tribes?.map((pt: any) => pt.tribes.name) || [],
  };
  delete user.profile_tribes; // Clean up the raw joined data to match the User type.
  return user as User;
};
