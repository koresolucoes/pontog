import React, { useEffect, useState } from 'react';
import { useUserActionsStore, BlockedUser } from '../stores/userActionsStore';
import { ConfirmationModal } from './ConfirmationModal';
import { getPublicImageUrl } from '../lib/supabase';

interface BlockedUsersModalProps {
    onClose: () => void;
}

export const BlockedUsersModal: React.FC<BlockedUsersModalProps> = ({ onClose }) => {
    const { blockedUsers, isFetchingBlocked, fetchBlockedUsers, unblockUser } = useUserActionsStore();
    const [userToUnblock, setUserToUnblock] = useState<BlockedUser | null>(null);

    useEffect(() => {
        fetchBlockedUsers();
    }, [fetchBlockedUsers]);

    const handleConfirmUnblock = () => {
        if (userToUnblock) {
            unblockUser(userToUnblock.blocked_id);
            setUserToUnblock(null);
        }
    };
    
    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
                <div 
                    className="bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col h-full sm:h-auto sm:max-h-[80vh]" 
                    onClick={(e) => e.stopPropagation()}
                >
                    <header className="p-6 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                        <h2 className="text-xl font-bold text-white">Usuários Bloqueados</h2>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                    </header>
                    <main className="flex-1 overflow-y-auto p-4">
                        {isFetchingBlocked ? (
                            <p className="text-slate-400 text-center py-8">Carregando...</p>
                        ) : blockedUsers.length === 0 ? (
                            <p className="text-slate-400 text-center py-8">Você não bloqueou ninguém.</p>
                        ) : (
                            <div className="divide-y divide-slate-700">
                                {blockedUsers.map(user => (
                                    <div key={user.blocked_id} className="py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img src={getPublicImageUrl(user.avatar_url)} alt={user.username} className="w-10 h-10 rounded-full object-cover"/>
                                            <span className="font-semibold">{user.username}</span>
                                        </div>
                                        <button 
                                            onClick={() => setUserToUnblock(user)}
                                            className="bg-slate-700 text-white text-sm font-semibold py-1 px-3 rounded-lg hover:bg-slate-600 transition-colors"
                                        >
                                            Desbloquear
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
            {userToUnblock && (
                <ConfirmationModal
                    isOpen={!!userToUnblock}
                    title={`Desbloquear ${userToUnblock.username}`}
                    message={`Tem certeza que deseja desbloquear ${userToUnblock.username}? Você voltará a ver o perfil dele e ele o seu.`}
                    onConfirm={handleConfirmUnblock}
                    onCancel={() => setUserToUnblock(null)}
                    confirmText="Desbloquear"
                />
            )}
        </>
    );
};