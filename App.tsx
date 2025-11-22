
import React, { useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useUiStore, View } from './stores/uiStore';
import { useMapStore } from './stores/mapStore';
import { useInboxStore } from './stores/inboxStore';
import { Auth } from './components/Auth';
import { HomeView } from './components/HomeView';
import { UserGrid } from './components/UserGrid';
import { Map } from './components/Map';
import { Inbox } from './components/Inbox';
import { ProfileView } from './components/ProfileView';
import { ProfileModal } from './components/ProfileModal';
import { ChatWindow } from './components/ChatWindow';
import { AgoraView } from './components/AgoraView';
import { PwaInstallButton } from './components/PwaInstallButton';
import { usePwaStore } from './stores/pwaStore';
import { SubscriptionModal } from './components/SubscriptionModal';
import { DonationModal } from './components/DonationModal';
import { AdminPanel } from './pages/Admin/AdminPanel';
import { Onboarding } from './components/Onboarding';
import { Sidebar } from './components/Sidebar';
import { BackgroundParticles } from './components/BackgroundParticles';

const App: React.FC = () => {
    // Roteamento simples para o painel de administração
    if (window.location.pathname.startsWith('/admin')) {
        return <AdminPanel />;
    }

    const { session, user, loading, fetchProfile, showOnboarding } = useAuthStore();
    const { activeView, setActiveView, chatUser, setChatUser, isSubscriptionModalOpen, isDonationModalOpen, setSidebarOpen } = useUiStore();
    const { totalUnreadCount, fetchConversations, fetchWinks, fetchAccessRequests } = useInboxStore();
    const { setInstallPromptEvent, subscribeToPushNotifications } = usePwaStore();
    const { 
        selectedUser, 
        setSelectedUser, 
        requestLocationPermission, 
        stopLocationWatch, 
        cleanupRealtime 
    } = useMapStore();

    useEffect(() => {
        const registerServiceWorker = async () => {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('/service-worker.js');
                    console.log('Service Worker registrado com sucesso:', registration.scope);
                    
                    const subscription = await registration.pushManager.getSubscription();
                    
                    // Se não houver inscrição, a permissão for concedida e o usuário estiver logado, tenta se inscrever.
                    if (!subscription && Notification.permission === 'granted' && session) {
                        console.log('Permissão para notificações concedida, mas sem inscrição. Inscrevendo agora.');
                        await subscribeToPushNotifications();
                    }
                } catch (error) {
                    console.error('Falha ao registrar Service Worker:', error);
                }
            }
        };

        registerServiceWorker();

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e as any);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, [session, setInstallPromptEvent, subscribeToPushNotifications]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');
        if (paymentStatus) {
            if (paymentStatus === 'success') {
                toast.success('Pagamento aprovado! Seu plano Plus está ativo.');
                if(session?.user) fetchProfile(session.user);
            } else if (paymentStatus === 'success_donation') {
                toast.success('Muito obrigado pelo seu apoio!');
            } else if (paymentStatus === 'failure') {
                toast.error('O pagamento falhou. Tente novamente.');
            }
            window.history.replaceState({}, document.title, "/");
        }
    }, [session, fetchProfile]);

    useEffect(() => {
        if (session) {
            requestLocationPermission();
            fetchConversations();
            fetchWinks();
            fetchAccessRequests();
        }
        return () => {
            stopLocationWatch();
            cleanupRealtime();
        };
    }, [session, requestLocationPermission, stopLocationWatch, cleanupRealtime, fetchConversations, fetchWinks, fetchAccessRequests]);

    // Renderiza as visualizações que NÃO são o mapa
    const renderOtherViews = () => {
        switch (activeView) {
            case 'home': return <HomeView />;
            case 'grid': return <UserGrid />;
            case 'agora': return <AgoraView />;
            case 'inbox': return <Inbox />;
            case 'profile': return <ProfileView />;
            case 'map': return null; // Mapa é tratado separadamente
            default: return <HomeView />;
        }
    };

    return (
        <>
            <Toaster
                position="top-center"
                containerStyle={{
                    zIndex: 99999, // Garante que fique acima de tudo
                }}
                toastOptions={{
                    className: '!bg-dark-900/95 !backdrop-blur-xl !text-white !border !border-white/10 !rounded-2xl !shadow-2xl !font-outfit',
                    duration: 4000,
                    success: {
                        iconTheme: {
                            primary: '#4ade80', // Green-400
                            secondary: '#0f172a', // Slate-900
                        },
                        style: {
                            border: '1px solid rgba(74, 222, 128, 0.2)',
                            background: 'rgba(5, 5, 5, 0.95)',
                        }
                    },
                    error: {
                        iconTheme: {
                            primary: '#f87171', // Red-400
                            secondary: '#0f172a',
                        },
                        style: {
                            border: '1px solid rgba(248, 113, 113, 0.2)',
                            background: 'rgba(5, 5, 5, 0.95)',
                        }
                    },
                    loading: {
                        style: {
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(5, 5, 5, 0.95)',
                        }
                    },
                    style: {
                        color: '#f8fafc',
                        padding: '16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.7)',
                    },
                }}
            />
            
            {loading ? (
                <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-slate-700 opacity-30"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-t-pink-600 animate-spin"></div>
                    </div>
                </div>
            ) : (!session || !user) ? (
                <Auth />
            ) : showOnboarding ? (
                <Onboarding />
            ) : (
                <div className="h-screen w-screen bg-gradient-to-b from-dark-900 to-slate-900 text-slate-50 flex flex-col antialiased overflow-hidden relative">
                    
                    {/* Animated Particle Background (Visível apenas quando não estamos no mapa) */}
                    {activeView !== 'map' && <BackgroundParticles />}

                    {/* Sidebar Navigation Drawer */}
                    <Sidebar />

                    {/* Global Sidebar Trigger - Hamburger Menu */}
                    <button 
                        onClick={() => setSidebarOpen(true)}
                        className="fixed top-4 left-4 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-dark-900/50 backdrop-blur-md border border-white/10 text-white shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-rounded">menu</span>
                    </button>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-hidden pb-0 z-10 relative">
                        
                        {/* ESTRATÉGIA MAPA PERSISTENTE:
                            O Mapa é SEMPRE renderizado em uma camada absoluta.
                            Quando activeView === 'map', ele ganha z-index alto e opacidade total.
                            Quando não, ele fica no fundo (z-0) esperando.
                        */}
                        <div 
                            className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out ${
                                activeView === 'map' ? 'z-10 opacity-100 pointer-events-auto' : '-z-10 opacity-0 pointer-events-none'
                            }`}
                        >
                            <Map />
                        </div>

                        {/* As outras views são renderizadas SOBRE o mapa quando ativas */}
                        {activeView !== 'map' && (
                            <div key={activeView} className="w-full h-full animate-fade-in relative z-20 bg-dark-900">
                                {renderOtherViews()}
                            </div>
                        )}

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
                                subscription_tier: chatUser.subscription_tier,
                            }} 
                            onClose={() => setChatUser(null)}
                        />
                    )}
                    
                    {isSubscriptionModalOpen && <SubscriptionModal />}
                    {isDonationModalOpen && <DonationModal />}

                    <PwaInstallButton />

                    {/* Modern Floating Navigation Bar */}
                    <div className="fixed bottom-4 left-4 right-4 z-20 flex justify-center pointer-events-none">
                        <nav className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 pointer-events-auto max-w-md w-full">
                            <div className="grid grid-cols-6 p-1.5">
                                <NavButton icon="home" label="Início" isActive={activeView === 'home'} onClick={() => setActiveView('home')} />
                                <NavButton icon="grid_view" label="Grade" isActive={activeView === 'grid'} onClick={() => setActiveView('grid')} />
                                <NavButton icon="map" label="Mapa" isActive={activeView === 'map'} onClick={() => setActiveView('map')} />
                                <NavButton icon="local_fire_department" label="Agora" isActive={activeView === 'agora'} onClick={() => setActiveView('agora')} isFire />
                                <NavButton icon="chat_bubble" label="Chat" isActive={activeView === 'inbox'} onClick={() => setActiveView('inbox')} notificationCount={totalUnreadCount} />
                                <NavButton icon="person" label="Perfil" isActive={activeView === 'profile'} onClick={() => setActiveView('profile')} isPlus={user.subscription_tier === 'plus'} />
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
};

interface NavButtonProps {
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isPlus?: boolean;
    isFire?: boolean;
    notificationCount?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, isActive, onClick, isPlus = false, isFire = false, notificationCount = 0 }) => (
    <button
        onClick={onClick}
        className="relative flex flex-col items-center justify-center py-2 w-full transition-all duration-300 group focus:outline-none rounded-xl"
        aria-label={label}
    >
        <div className="relative transition-transform duration-300 group-active:scale-90">
            <div 
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                    ${isActive 
                        ? isFire ? 'bg-gradient-to-tr from-red-600 to-orange-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' 
                        : 'bg-gradient-to-tr from-pink-600 to-purple-600 shadow-[0_0_15px_rgba(219,39,119,0.5)]' 
                        : 'bg-transparent'}`
                }
            >
                <span 
                    className={`material-symbols-rounded text-[26px] transition-colors duration-300
                        ${isActive 
                            ? 'text-white filled' 
                            : 'text-slate-400 group-hover:text-slate-200'}`
                    }
                >
                    {icon}
                </span>
            </div>
            {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-900 z-10 animate-bounce">
                    {notificationCount > 9 ? '9+' : notificationCount}
                </span>
             )}
        </div>
        {isPlus && (
            <span className="absolute top-1 right-2 material-symbols-rounded !text-[10px] text-yellow-400 filled shadow-black drop-shadow-md">auto_awesome</span>
        )}
    </button>
);


export default App;
