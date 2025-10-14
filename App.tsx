import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useUiStore, View } from './stores/uiStore';
import { useMapStore } from './stores/mapStore';
import { Auth } from './components/Auth';
import { HomeView } from './components/HomeView';
import { UserGrid } from './components/UserGrid';
import { Map } from './components/Map';
import { Inbox } from './components/Inbox';
import { ProfileView } from './components/ProfileView';
import { ProfileModal } from './components/ProfileModal';
import { ChatWindow } from './components/ChatWindow';
import { AgoraView } from './components/AgoraView';
import { PwaInstallButton } from './components/PwaInstallButton'; // Importa o novo botão
import { SearchIcon, MessageCircleIcon, MapPinIcon, UserIcon, FlameIcon, HomeIcon } from './components/icons';
// Fix: Import 'usePwaStore' to resolve the undefined reference.
import { usePwaStore } from './stores/pwaStore';
import { SubscriptionModal } from './components/SubscriptionModal';

const App: React.FC = () => {
    const { session, user, loading } = useAuthStore();
    const { activeView, setActiveView, chatUser, setChatUser, isSubscriptionModalOpen } = useUiStore();
    const { setInstallPromptEvent } = usePwaStore(); // Movido de volta para App.tsx para escopo global
    const { 
        selectedUser, 
        setSelectedUser, 
        requestLocationPermission, 
        stopLocationWatch, 
        cleanupRealtime 
    } = useMapStore();

    // CRITICAL FIX: Registra o Service Worker e escuta pelo evento de instalação.
    useEffect(() => {
        // 1. Registra o Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('Service Worker registrado com sucesso:', registration.scope);
                    })
                    .catch(err => {
                        console.error('Falha ao registrar o Service Worker:', err);
                    });
            });
        }

        // 2. Escuta pelo evento de instalação do PWA
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e as any);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [setInstallPromptEvent]);


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
            case 'home':
                return <HomeView />;
            case 'grid':
                return <UserGrid />;
            case 'map':
                return <Map />;
            case 'agora':
                return <AgoraView />;
            case 'inbox':
                return <Inbox />;
            case 'profile':
                return <ProfileView />;
            default:
                return <HomeView />;
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
            
            <main className="flex-1 overflow-hidden pb-20 z-10">
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
            
            {isSubscriptionModalOpen && <SubscriptionModal />}

            {/* Novo Botão de Instalação Flutuante */}
            <PwaInstallButton />

            {/* Barra de Navegação Inferior */}
            <nav className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 z-20">
                <div className="max-w-md mx-auto grid grid-cols-6">
                   <NavButton 
                        icon={HomeIcon} 
                        label="Início" 
                        isActive={activeView === 'home'} 
                        onClick={() => setActiveView('home')}
                    />
                   <NavButton 
                        icon={SearchIcon} 
                        label="Buscar" 
                        isActive={activeView === 'grid'} 
                        onClick={() => setActiveView('grid')}
                    />
                    <NavButton 
                        icon={MapPinIcon} 
                        label="Mapa" 
                        isActive={activeView === 'map'} 
                        onClick={() => setActiveView('map')}
                    />
                    <NavButton 
                        icon={FlameIcon} 
                        label="Agora" 
                        isActive={activeView === 'agora'} 
                        onClick={() => setActiveView('agora')}
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
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center pt-2 pb-1 transition-colors ${
                isActive ? 'text-pink-500' : 'text-gray-400 hover:text-white'
            }`}
            aria-label={label}
        >
            <Icon className="w-7 h-7" />
            <span className="text-[10px] mt-0.5">{label}</span>
        </button>
    );
};

export default App;