// stores/userActionsStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useMapStore } from './mapStore';
import { useHomeStore } from './homeStore';
import { useInboxStore } from './inboxStore';
import { useUiStore } from './uiStore';
import { useAuthStore } from './authStore';

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

export interface BlockedUser {
    blocked_id: string;
    username: string;
    avatar_url: string;
}

interface UserActionsState {
    blockedUsers: BlockedUser[];
    isFetchingBlocked: boolean;
    blockUser: (userToBlock: { id: string, username: string }) => Promise<void>;
    reportUser: (reportedId: string, reason: string, comments: string) => Promise<boolean>;
    fetchBlockedUsers: () => Promise<void>;
    unblockUser: (userId: string) => Promise<void>;
}

export const useUserActionsStore = create<UserActionsState>((set, get) => ({
    blockedUsers: [],
    isFetchingBlocked: false,
    
    blockUser: async (userToBlock) => {
        const { id: blocked_id, username } = userToBlock;
        const currentUser = useAuthStore.getState().user;

        if (!currentUser) {
            toast.error("Você precisa estar logado para bloquear usuários.");
            return;
        }
        
        // FIX: Pass blocker_id explicitly to satisfy RLS policy (auth.uid() = blocker_id)
        const { error } = await supabase.from('blocks').insert({ 
            blocker_id: currentUser.id,
            blocked_id: blocked_id 
        });

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
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
            toast.error("Você precisa estar logado para denunciar.");
            return false;
        }

        // FIX: Pass reporter_id explicitly
        const { error } = await supabase.from('reports').insert({
            reporter_id: currentUser.id,
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

    fetchBlockedUsers: async () => {
        set({ isFetchingBlocked: true });
        const { data, error } = await supabase.rpc('get_my_blocked_users');
        if (error) {
            // Don't show toast on 404 or empty, just log
            console.error('Error fetching blocked users:', error);
        } else {
            set({ blockedUsers: data || [] });
        }
        set({ isFetchingBlocked: false });
    },

    unblockUser: async (userId: string) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        // FIX: Match both blocker_id and blocked_id for safety and RLS
        const { error } = await supabase.from('blocks').delete().match({
            blocker_id: currentUser.id,
            blocked_id: userId
        });

        if (error) {
            toast.error('Erro ao desbloquear usuário.');
            console.error('Error unblocking user:', error);
            return;
        }

        toast.success('Usuário desbloqueado.');
        set(state => ({
            blockedUsers: state.blockedUsers.filter(u => u.blocked_id !== userId)
        }));
        
        // Refresh user lists as this user should now be visible again
        const { myLocation, fetchNearbyUsers } = useMapStore.getState();
        if (myLocation) {
            fetchNearbyUsers(myLocation);
        }
        useHomeStore.getState().fetchPopularUsers();
        useInboxStore.getState().fetchConversations();
    },
}));