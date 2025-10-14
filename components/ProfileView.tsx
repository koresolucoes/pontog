import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePwaStore } from '../stores/pwaStore';
import { useNotificationStore } from '../stores/notificationStore';
import { EditProfileModal } from './EditProfileModal';
import { MyAlbumsModal } from './MyAlbumsModal';
import { BellIcon } from './icons';
import { NotificationType } from '../types';

const NotificationToggle: React.FC<{
    label: string;
    type: NotificationType;
    isChecked: boolean;
    onChange: (type: NotificationType, enabled: boolean) => void;
}> = ({ label, type, isChecked, onChange }) => (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800">
        <span className="font-semibold">{label}</span>
        <label className="relative inline-flex items-center cursor-pointer">
            <input 
                type="checkbox" 
                checked={isChecked}
                onChange={(e) => onChange(type, e.target.checked)}
                className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
        </label>
    </div>
);

export const ProfileView: React.FC = () => {
    const { user, signOut } = useAuthStore();
    const { 
        pushState, 
        checkPushSupport, 
        subscribeToPushNotifications,
        isSubscribing 
    } = usePwaStore();
    const {
        preferences,
        loading: loadingPreferences,
        fetchPreferences,
        updatePreference
    } = useNotificationStore();

    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isMyAlbumsOpen, setIsMyAlbumsOpen] = useState(false);

    useEffect(() => {
        checkPushSupport();
    }, [checkPushSupport]);

    useEffect(() => {
        if (pushState === 'granted') {
            fetchPreferences();
        }
    }, [pushState, fetchPreferences]);

    if (!user) return null;
    
    const renderPushSection = () => {
        switch (pushState) {
            case 'granted':
                return (
                    <>
                        <div className="p-3 rounded-lg bg-gray-800">
                           <p className="text-sm text-green-400">Notificações gerais ativadas no seu navegador.</p>
                        </div>
                        <h3 className="text-xs font-bold uppercase text-gray-500 px-3 pt-4">Preferências de Notificação</h3>
                        {loadingPreferences ? <p className="text-gray-400 px-3">Carregando...</p> : (
                            <>
                                <NotificationToggle 
                                    label="Novas Mensagens"
                                    type="new_message"
                                    isChecked={preferences.find(p => p.notification_type === 'new_message')?.enabled ?? true}
                                    onChange={updatePreference}
                                />
                                <NotificationToggle 
                                    label="Novos Chamados (Winks)"
                                    type="new_wink"
                                    isChecked={preferences.find(p => p.notification_type === 'new_wink')?.enabled ?? true}
                                    onChange={updatePreference}
                                />
                                <NotificationToggle 
                                    label="Solicitações de Acesso a Álbuns"
                                    type="new_album_request"
                                    isChecked={preferences.find(p => p.notification_type === 'new_album_request')?.enabled ?? true}
                                    onChange={updatePreference}
                                />
                            </>
                        )}
                    </>
                );
            case 'denied':
                return <div className="p-3 rounded-lg bg-gray-800"><p className="text-sm text-red-400">Notificações bloqueadas. Altere nas configurações do seu navegador para gerenciar as preferências.</p></div>;
            case 'unsupported':
                return <div className="p-3 rounded-lg bg-gray-800"><p className="text-sm text-gray-500">Seu navegador não suporta notificações.</p></div>;
            case 'prompt':
            default:
                return (
                    <button 
                        onClick={subscribeToPushNotifications}
                        disabled={isSubscribing}
                        className="w-full text-left p-3 rounded-lg bg-gray-700 text-white font-semibold flex items-center gap-3 hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                        <BellIcon className="w-5 h-5" />
                        {isSubscribing ? 'Ativando...' : 'Ativar Notificações Push'}
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
                            <div className="p-1 space-y-2">
                                {renderPushSection()}
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