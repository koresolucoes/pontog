import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { EditProfileModal } from './EditProfileModal';
import { MyAlbumsModal } from './MyAlbumsModal';
import { PencilIcon, ShoppingBagIcon } from './icons';

export const ProfileView: React.FC = () => {
    const { user, signOut } = useAuthStore();
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isMyAlbumsOpen, setIsMyAlbumsOpen] = useState(false);

    if (!user) return null;

    return (
        <>
            <div className="bg-black min-h-full">
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
                        <button className="bg-zinc-800 p-2 rounded-lg flex items-center justify-center gap-2 border-2 border-green-500">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Online
                        </button>
                         <button className="bg-zinc-800 p-2 rounded-lg flex items-center justify-center gap-2 border-2 border-transparent text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                            Incógnito
                        </button>
                    </div>

                    {/* Supplements Section (Placeholder) */}
                    <div className="space-y-2">
                        <h2 className="text-xs font-bold text-gray-500 tracking-wider">SUPLEMENTOS</h2>
                        <div className="bg-zinc-800 p-3 rounded-lg font-semibold">⚡️ Boost</div>
                        <div className="bg-zinc-800 p-3 rounded-lg font-semibold">🔮 Right Now</div>
                    </div>

                    {/* Plan Section (Placeholder) */}
                    <div className="space-y-2">
                        <h2 className="text-xs font-bold text-gray-500 tracking-wider">ESCOLHER UM PLANO</h2>
                        <div className="bg-yellow-400 text-black p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">Obter XTRA</h3>
                                <p className="text-sm">Acesse 5x mais perfis</p>
                            </div>
                            <span className="text-2xl">→</span>
                        </div>
                        <div className="bg-zinc-800 p-3 rounded-lg">Ganhe 1 dia sem anúncios</div>
                        <div className="bg-zinc-800 p-3 rounded-lg">Comprar Ilimitado</div>
                    </div>

                    {/* Menu Options */}
                     <div className="space-y-1 pt-4 border-t border-zinc-800">
                        <button onClick={() => setIsEditProfileOpen(true)} className="w-full text-left p-3 rounded-lg hover:bg-zinc-800 font-semibold">
                            Editar Perfil
                        </button>
                        <button onClick={() => setIsMyAlbumsOpen(true)} className="w-full text-left p-3 rounded-lg hover:bg-zinc-800 font-semibold">
                            Meus Álbuns
                        </button>
                         <button className="w-full text-left p-3 rounded-lg hover:bg-zinc-800 font-semibold">
                            Configurações
                        </button>
                        <button onClick={signOut} className="w-full text-left p-3 rounded-lg hover:bg-zinc-800 font-semibold text-red-400">
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