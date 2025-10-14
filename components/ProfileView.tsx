import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePwaStore } from '../stores/pwaStore';
import { EditProfileModal } from './EditProfileModal';
import { MyAlbumsModal } from './MyAlbumsModal';
import { DownloadCloudIcon } from './icons';

export const ProfileView: React.FC = () => {
    const { user, signOut } = useAuthStore();
    const { installPromptEvent, triggerInstall } = usePwaStore();
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isMyAlbumsOpen, setIsMyAlbumsOpen] = useState(false);

    if (!user) return null;

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
                        {installPromptEvent && (
                            <button 
                                onClick={triggerInstall} 
                                className="w-full text-left p-3 rounded-lg bg-pink-600 text-white font-semibold flex items-center gap-3 hover:bg-pink-700 transition-colors mb-2"
                            >
                                <DownloadCloudIcon className="w-5 h-5" />
                                Instalar App na Tela de Início
                            </button>
                        )}
                        <button onClick={() => setIsEditProfileOpen(true)} className="w-full text-left p-3 rounded-lg hover:bg-gray-800 font-semibold">
                            Editar Perfil
                        </button>
                        <button onClick={() => setIsMyAlbumsOpen(true)} className="w-full text-left p-3 rounded-lg hover:bg-gray-800 font-semibold">
                            Meus Álbuns
                        </button>
                         <button className="w-full text-left p-3 rounded-lg hover:bg-gray-800 font-semibold">
                            Configurações
                        </button>
                        <button onClick={signOut} className="w-full text-left p-3 rounded-lg hover:bg-gray-800 font-semibold text-red-400">
                            Sair
                        </button>
                    </div>

                </div>
            </div>
            {isEditProfileOpen && <EditProfileModal onClose={() => setIsEditProfileOpen(false)} />}
            {isMyAlbumsOpen && <MyAlbumsModal onClose={() => setIsMyAlbumsOpen(false)} />}
        </>
    );
};
