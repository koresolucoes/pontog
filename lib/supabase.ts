import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente são injetadas pelo Vercel (ou seu bundler como o Vite)
// Use VITE_ para variáveis que precisam ser expostas ao cliente (navegador)
// FIX: Cast import.meta to any to resolve TypeScript error in environments where `vite/client` types are not loaded.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // This provides a clear error during development if variables are missing.
    console.error("Supabase URL and Anon Key must be provided in environment variables.");
    // In a real app, you might want to show a more user-friendly error screen.
}


export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

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
        // Mesmo se for uma URL completa, adiciona cache busting se não tiver
        if (path.includes('?t=')) return path;
        return `${path}?t=${new Date().getTime()}`;
    }
    
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

    // FIX: Adiciona um timestamp para cache-busting.
    // Isso força o navegador a buscar a imagem novamente em vez de usar uma versão
    // antiga e quebrada do cache, garantindo que a imagem sempre apareça.
    return `${data.publicUrl}?t=${new Date().getTime()}`;
};
