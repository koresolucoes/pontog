import { create } from 'zustand';
import { supabase, getPublicImageUrl } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { PrivateAlbum, PrivateAlbumPhoto } from '../types';

interface AlbumState {
    myAlbums: PrivateAlbum[];
    isUploading: boolean;
    isLoading: boolean;
    fetchMyAlbums: () => Promise<void>;
    uploadPhoto: (file: File) => Promise<string | null>;
    createAlbum: (name: string) => Promise<PrivateAlbum | null>;
    deleteAlbum: (albumId: number) => Promise<boolean>;
    addPhotoToAlbum: (albumId: number, photoPath: string) => Promise<PrivateAlbumPhoto | null>;
    deletePhotoFromAlbum: (photoId: number) => Promise<boolean>;
}

export const useAlbumStore = create<AlbumState>((set, get) => ({
    myAlbums: [],
    isUploading: false,
    isLoading: false,

    fetchMyAlbums: async () => {
        set({ isLoading: true });
        const user = useAuthStore.getState().user;
        if (!user) {
            set({ isLoading: false });
            return;
        }

        const { data, error } = await supabase
            .from('private_albums')
            .select('*, private_album_photos(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching albums:', error);
            set({ isLoading: false });
            return;
        }

        // Processa os caminhos das fotos para URLs públicas
        const albumsWithUrls = data.map(album => ({
            ...album,
            private_album_photos: (album.private_album_photos || []).map(photo => ({
                ...photo,
                photo_path: getPublicImageUrl(photo.photo_path)
            }))
        }));

        set({ myAlbums: albumsWithUrls, isLoading: false });
    },

    uploadPhoto: async (file: File) => {
        set({ isUploading: true });
        const user = useAuthStore.getState().user;
        if (!user) {
            set({ isUploading: false });
            return null;
        }
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error } = await supabase.storage
            .from('user_uploads')
            .upload(filePath, file);

        set({ isUploading: false });
        if (error) {
            console.error('Error uploading photo:', error);
            return null;
        }
        return filePath;
    },

    createAlbum: async (name: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return null;

        const { data, error } = await supabase
            .from('private_albums')
            .insert({ name, user_id: user.id })
            .select()
            .single();
        
        if (error) {
            console.error('Error creating album:', error);
            return null;
        }
        
        // Retorna o álbum com a lista de fotos vazia
        const newAlbum = { ...data, private_album_photos: [] };

        set(state => ({ myAlbums: [newAlbum, ...state.myAlbums] }));
        return newAlbum;
    },

    deleteAlbum: async (albumId: number) => {
        const { error } = await supabase.from('private_albums').delete().eq('id', albumId);
        if (error) {
            console.error('Error deleting album:', error);
            return false;
        }
        set(state => ({ myAlbums: state.myAlbums.filter(a => a.id !== albumId) }));
        return true;
    },

    addPhotoToAlbum: async (albumId: number, photoPath: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return null;

        const { data, error } = await supabase
            .from('private_album_photos')
            .insert({ album_id: albumId, photo_path: photoPath, user_id: user.id })
            .select()
            .single();

        if (error) {
            console.error('Error adding photo to album:', error);
            return null;
        }

        get().fetchMyAlbums(); // Re-fetch to update photo lists with correct URLs
        return data;
    },
    
    deletePhotoFromAlbum: async (photoId: number) => {
        const { error } = await supabase.from('private_album_photos').delete().eq('id', photoId);
        if (error) {
            console.error('Error deleting photo:', error);
            return false;
        }
        get().fetchMyAlbums(); // Re-fetch to update
        return true;
    }
}));