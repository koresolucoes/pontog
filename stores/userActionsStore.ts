// stores/userActionsStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useMapStore } from './mapStore';
import { useHomeStore } from './homeStore';
import { useInboxStore } from './inboxStore';
import { useUiStore } from './uiStore';

// The same reasons from the DB enum
export const reportReasons = [
    { key: 'spam', label: 'Spam ou publicidade' },
    { key: 'inappropriate_photos', label: 'Fotos inapropriadas' },
    { key: 'harassment', label: 'Assédio ou discurso de ódio' },
    { key: 'impersonation', label: 'Perfil falso / Impersonificação' },
    { key: 'underage', label: 'Menor de idade' },
    { key: 'scam_or_fraud', label: 'Golpe ou fraude' },
    { key: 'other', label: 'Outro' },
];

interface UserActionsState {
    blockUser: (userToBlock: { id: string, username: string }) => Promise<void>;
    reportUser: (reportedId: string, reason: string, comments: string) => Promise<boolean>;
}

export const useUserActionsStore = create<UserActionsState>((set, get) => ({
    blockUser: async (userToBlock) => {
        const { id: blocked_id, username } = userToBlock;
        
        const { error } = await supabase.from('blocks').insert({ blocked_id });

        if (error) {
            toast.error(`Erro ao bloquear ${username}.`);
            console.error('Error blocking user:', error);
            return;
        }

        toast.success(`${username} foi bloqueado.`);

        // Close any open modals/chat windows for the blocked user
        const { chatUser, setChatUser } = useUiStore.getState();
        const { selectedUser, setSelectedUser } = useMapStore.getState();

        if (chatUser?.id === blocked_id) {
            setChatUser(null);
        }
        if (selectedUser?.id === blocked_id) {
            setSelectedUser(null);
        }
        
        // Refresh all user lists to remove the blocked user
        const { myLocation, fetchNearbyUsers } = useMapStore.getState();
        if (myLocation) {
            fetchNearbyUsers(myLocation); // for map and grid
        }
        useHomeStore.getState().fetchPopularUsers(); // for home
        useInboxStore.getState().fetchConversations(); // for inbox
    },

    reportUser: async (reportedId: string, reason: string, comments: string) => {
        const { error } = await supabase.from('reports').insert({
            reported_id: reportedId,
            reason: reason,
            comments: comments || null,
        });

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                toast.error('Você já denunciou este perfil.');
            } else {
                toast.error('Ocorreu um erro ao enviar a denúncia.');
            }
            console.error('Error reporting user:', error);
            return false;
        }
        
        toast.success('Denúncia enviada. Nossa equipe irá analisar.');
        return true;
    },
}));
