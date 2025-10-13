// lib/utils.ts
import { format, formatDistanceToNow, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
