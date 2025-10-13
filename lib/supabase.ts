import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwmiqdovqgysncmqnmvp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bWlxZG92cWd5c25jbXFubXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzODU2MzEsImV4cCI6MjA3NTk2MTYzMX0.fVUzmHHZORcdI5SSm1HwSjEcDw_VZKyApw-qEi-kRkU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = 'user_uploads';

/**
 * Constrói a URL pública para um arquivo no Supabase Storage.
 * @param path O caminho do arquivo no bucket (ex: user_id/image.png)
 * @returns A URL pública completa para a imagem.
 */
export const getPublicImageUrl = (path: string | null | undefined): string => {
    // Retorna um placeholder elegante se não houver caminho
    if (!path) return 'https://placehold.co/400x400/1f2937/d1d5db/png?text=G'; 
    
    // Se já for uma URL completa, retorna ela mesma para evitar erros.
    if (path.startsWith('http')) {
        return path;
    }
    
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
};