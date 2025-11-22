
import React, { useState } from 'react';
import { useUiStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { MyAlbumsModal } from './MyAlbumsModal';
import { BlockedUsersModal } from './BlockedUsersModal';

export const Sidebar: React.FC = () => {
    const { isSidebarOpen, setSidebarOpen, setSubscriptionModalOpen, setDonationModalOpen } = useUiStore();
    const { user, toggleCanHost, toggleIncognitoMode, signOut } = useAuthStore();
    
    const [isMyAlbumsOpen, setIsMyAlbumsOpen] = useState(false);
    const [isBlockedUsersOpen, setIsBlockedUsersOpen] = useState(false);

    if (!user) return null;

    const handleClose = () => setSidebarOpen(false);

    const handleToggleHost = () => {
        toggleCanHost(!user.can_host);
    };

    const handleToggleIncognito = () => {
        if (user.subscription_tier !== 'plus') {
            setSubscriptionModalOpen(true);
            handleClose();
        } else {
            toggleIncognitoMode(!user.is_incognito);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={handleClose}
            />

            {/* Sidebar Drawer */}
            <div 
                className={`fixed inset-y-0 left-0 z-[91] w-72 bg-dark-950/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-out flex flex-col shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-6 pt-8 flex flex-col items-center border-b border-white/5 bg-gradient-to-b from-slate-900 to-dark-950">
                    <div className="relative w-20 h-20 mb-3">
                        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full animate-pulse opacity-75 blur-md"></div>
                        <img 
                            src={user.avatar_url} 
                            alt={user.username} 
                            className="relative w-full h-full rounded-full object-cover border-2 border-white/20"
                        />
                        {user.subscription_tier === 'plus' && (
                            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full p-1 shadow-lg border border-white">
                                <span className="material-symbols-rounded filled !text-[14px] block">auto_awesome</span>
                            </div>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-white font-outfit">{user.username}</h2>
                    <p className="text-xs text-slate-400">{user.subscription_tier === 'plus' ? 'Membro Plus' : 'Membro Grátis'}</p>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    
                    {/* Quick Action: Host Status */}
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                                <span className={`material-symbols-rounded ${user.can_host ? 'text-green-400 filled' : 'text-slate-500'}`}>home</span>
                                Tenho Local
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={user.can_host}
                                    onChange={handleToggleHost}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-500/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                            </label>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                            Ative para mostrar no mapa e na grade que você pode receber visitas agora.
                        </p>
                    </div>

                    {/* Menu Items */}
                    <nav className="space-y-1">
                        <SidebarLink 
                            icon="photo_library" 
                            label="Álbuns Privados" 
                            onClick={() => { setIsMyAlbumsOpen(true); handleClose(); }} 
                        />
                        <SidebarLink 
                            icon="block" 
                            label="Usuários Bloqueados" 
                            onClick={() => { setIsBlockedUsersOpen(true); handleClose(); }} 
                        />
                        <div className="py-2">
                            <div className="h-px bg-white/5 mx-2"></div>
                        </div>
                        <SidebarLink 
                            icon="visibility_off" 
                            label="Modo Invisível" 
                            subLabel={user.subscription_tier !== 'plus' ? 'Plus' : undefined}
                            onClick={handleToggleIncognito} 
                            isActive={user.is_incognito}
                            activeColor="text-green-400"
                        />
                        <SidebarLink 
                            icon="volunteer_activism" 
                            label="Apoie o Projeto" 
                            onClick={() => { setDonationModalOpen(true); handleClose(); }} 
                            iconColor="text-pink-500"
                        />
                         <SidebarLink 
                            icon="logout" 
                            label="Sair da Conta" 
                            onClick={() => { signOut(); handleClose(); }} 
                            variant="danger"
                        />
                    </nav>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 text-center">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Ponto G v1.2.0</p>
                    <p className="text-[9px] text-slate-700 font-medium mt-1">Propriedade de Kore Serviços de Tecnologia</p>
                </div>
            </div>

            {/* Nested Modals */}
            {isMyAlbumsOpen && <MyAlbumsModal onClose={() => setIsMyAlbumsOpen(false)} />}
            {isBlockedUsersOpen && <BlockedUsersModal onClose={() => setIsBlockedUsersOpen(false)} />}
        </>
    );
};

interface SidebarLinkProps {
    icon: string;
    label: string;
    subLabel?: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
    isActive?: boolean;
    iconColor?: string;
    activeColor?: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ 
    icon, label, subLabel, onClick, variant = 'default', isActive = false, iconColor, activeColor 
}) => {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all active:scale-95 ${
                variant === 'danger' 
                    ? 'hover:bg-red-500/10 text-red-400' 
                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
            }`}
        >
            <div className="flex items-center gap-3">
                <span className={`material-symbols-rounded text-xl ${isActive && activeColor ? activeColor : (iconColor || '')} ${isActive ? 'filled' : ''}`}>
                    {icon}
                </span>
                <span className={`text-sm font-medium ${isActive && activeColor ? activeColor : ''}`}>{label}</span>
            </div>
            {subLabel && (
                <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-md uppercase tracking-wide">
                    {subLabel}
                </span>
            )}
            {isActive && !subLabel && (
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
            )}
        </button>
    );
};
