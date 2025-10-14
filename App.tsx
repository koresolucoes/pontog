import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useUiStore, View } from './stores/uiStore';
import { useMapStore } from './stores/mapStore';
import { Auth } from './components/Auth';
import { UserGrid } from './components/UserGrid';
import { Inbox } from './components/Inbox';
import { ProfileView } from './components/ProfileView'; // Nova tela de perfil
import { ProfileModal } from './components/ProfileModal';
import { ChatWindow } from './components/ChatWindow';
import { SearchIcon, MessageCircleIcon, HeartIcon, UserIcon, FlameIcon } from './components/icons';

const App: React.FC = () => {
    const { session, user, loading } = useAuthStore();
    const { activeView, setActiveView, chatUser, setChatUser } = useUiStore();
    const { 
        selectedUser, 
        setSelectedUser, 
        requestLocationPermission, 
        stopLocationWatch, 
        cleanupRealtime 
    } = useMapStore();

    useEffect(() => {
        if (session) {
            requestLocationPermission();
        }
        return () => {
            stopLocationWatch();
            cleanupRealtime();
        };
    }, [session, requestLocationPermission, stopLocationWatch, cleanupRealtime]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-pink-500"></div>
            </div>
        );
    }
    
    if (!session || !user) {
        return <Auth />;
    }

    const renderActiveView = () => {
        switch (activeView) {
            case 'grid':
                return <UserGrid />;
            case 'inbox':
                return <Inbox />;
            case 'profile':
                return <ProfileView />;
            case 'interest': // Redireciona para a caixa de entrada por enquanto
                return <Inbox initialTab="winks" />;
            default:
                return <UserGrid />;
        }
    };

    return (
        <div className="h-screen w-screen bg-gray-900 text-white flex flex-col antialiased overflow-hidden">
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#1f2937', // gray-800
                        color: '#fff',
                        border: '1px solid #374151' // gray-700
                    },
                }}
            />
            
            <main className="flex-1 overflow-y-auto pb-20">
                {renderActiveView()}
            </main>
            
            {selectedUser && (
                <ProfileModal 
                    user={selectedUser} 
                    onClose={() => setSelectedUser(null)}
                    onStartChat={(userToChat) => setChatUser(userToChat)}
                />
            )}

            {chatUser && (
                <ChatWindow 
                    user={{
                        id: chatUser.id,
                        name: chatUser.username,
                        imageUrl: chatUser.avatar_url,
                        last_seen: chatUser.last_seen,
                    }} 
                    onClose={() => setChatUser(null)}
                />
            )}

            {/* Nova Barra de Navegação Inferior */}
            <nav className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 z-20">
                <div className="max-w-md mx-auto grid grid-cols-5">
                   <NavButton 
                        icon={SearchIcon} 
                        label="Buscar" 
                        isActive={activeView === 'grid'} 
                        onClick={() => setActiveView('grid')}
                    />
                    <NavButton 
                        icon={FlameIcon} 
                        label="Right Now" 
                        isActive={activeView === 'right-now'} 
                        onClick={() => { /* Placeholder */ }}
                        isPlaceholder
                    />
                     <NavButton 
                        icon={HeartIcon} 
                        label="Interesse" 
                        isActive={activeView === 'interest'} 
                        onClick={() => setActiveView('interest')}
                    />
                    <NavButton 
                        icon={MessageCircleIcon} 
                        label="Entrada" 
                        isActive={activeView === 'inbox'} 
                        onClick={() => setActiveView('inbox')}
                    />
                    <NavButton 
                        icon={UserIcon} 
                        label="Perfil" 
                        isActive={activeView === 'profile'} 
                        onClick={() => setActiveView('profile')}
                    />
                </div>
            </nav>
        </div>
    );
};

interface NavButtonProps {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isPlaceholder?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, isActive, onClick, isPlaceholder }) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center pt-2 pb-1 transition-colors ${
                isActive ? 'text-pink-500' : 'text-gray-400 hover:text-white'
            } ${isPlaceholder ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={label}
        >
            <Icon className="w-7 h-7" />
            <span className="text-[10px] mt-0.5">{label}</span>
        </button>
    );
};

export default App;