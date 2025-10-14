import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePwaStore } from '../stores/pwaStore';
import { EditProfileModal } from './EditProfileModal';
import { MyAlbumsModal } from './MyAlbumsModal';
import { BellIcon } from './icons';

export const ProfileView: React.FC = () => {
    const { user, signOut } = useAuthStore();
    const { 
        pushState, 
        checkPushSupport, 
        subscribeToPushNotifications,
        isSubscribing 
    } = usePwaStore();
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isMyAlbumsOpen, setIsMyAlbumsOpen] = useState(false);

    useEffect(() => {
        checkPushSupport();
    }, [checkPushSupport]);

    if (!user) return null;
    
    const renderPushStatus = () => {
        switch (pushState) {
            case 'granted':
                return <p className="text-sm text-green-400">Notificações ativadas.</p>;
            case 'denied':
                return <p className="text-sm text-red-400">Notificações bloqueadas. Altere nas configurações do seu navegador.</p>;
            case 'unsupported':
                return <p className="text-sm text-gray-500">Seu navegador não suporta notificações.</p>;
            case 'prompt':
            default:
                return (
                    <button 
                        onClick={subscribeToPushNotifications}
                        disabled={isSubscribing}
                        className="w-full text-left p-3 rounded-lg bg-gray-700 text-white font-semibold flex items-center gap-3 hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                        <BellIcon className="w-5 h-5" />
                        {isSubscribing ? 'Ativando...' : 'Ativar Notificações de Mensagens'}
                    </button>
                );
        }
    }

    return (
        <>
            <div className="bg-gray-900 min-h-full">
                <div className="p-4 space-y-6">
                    {/* Profile Header */}
                    <div className="flex items-center space-x-4">
                        <img src={user.avatar_url} alt={user.username} className="w-16 h-16 rounded-full object-cover" />
                        <div>
                            <p className="text-xl font-bold">{user.username}</p>
                            <p className="text-sm text-gray-400">{user.status_text || 'Sem status'}</p>
                        </div>
                    </div>

                    {/* Status Toggles */}
                    <div className="grid grid-cols-2 gap-2 text-center text-sm font-semibold">
                        <button className="bg-gray-800 p-2 rounded-lg flex items-center justify-center gap-2 border-2 border-pink-500">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Online
                        </button>
                         <button className="bg-gray-800 p-2 rounded-lg flex items-center justify-center gap-2 border-2 border-transparent text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                            Incógnito
                        </button>
                    </div>

                    {/* Menu Options */}
                     <div className="space-y-1 pt-4 border-t border-gray-700">
                        <div className="space-y-2">
                             <h3 className="text-xs font-bold uppercase text-gray-500 px-3 pt-2">Conta</h3>
                             <button onClick={() => setIsEditProfileOpen(true)} className="w-full text-left p-3 rounded-lg hover:bg-gray-800 font-semibold">
                                Editar Perfil
                            </button>
                            <button onClick={() => setIsMyAlbumsOpen(true)} className="w-full text-left p-3 rounded-lg hover:bg-gray-800 font-semibold">
                                Meus Álbuns
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase text-gray-500 px-3 pt-4">Notificações</h3>
                            <div className="p-1">
                                {renderPushStatus()}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase text-gray-500 px-3 pt-4">Sistema</h3>
                             <button className="w-full text-left p-3 rounded-lg hover:bg-gray-800 font-semibold">
                                Configurações
                            </button>
                            <button onClick={signOut} className="w-full text-left p-3 rounded-lg hover:bg-gray-800 font-semibold text-red-400">
                                Sair
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            {isEditProfileOpen && <EditProfileModal onClose={() => setIsEditProfileOpen(false)} />}
            {isMyAlbumsOpen && <MyAlbumsModal onClose={() => setIsMyAlbumsOpen(false)} />}
        </>
    );
};
