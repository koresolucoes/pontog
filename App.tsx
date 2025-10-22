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

const App: React.FC = () => {
    // Roteamento simples para o painel de administração
    if (window.location.pathname.startsWith('/admin')) {
        return <AdminPanel />;
    }

    const { session, user, loading, fetchProfile, showOnboarding } = useAuthStore();
    const { activeView, setActiveView, chatUser, setChatUser, isSubscriptionModalOpen, isDonationModalOpen } = useUiStore();
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
                // Atualiza o perfil para refletir o novo status de assinatura
                if(session?.user) fetchProfile(session.user);
            } else if (paymentStatus === 'success_donation') {
                toast.success('Muito obrigado pelo seu apoio!');
            } else if (paymentStatus === 'failure') {
                toast.error('O pagamento falhou. Tente novamente.');
            }
            // Limpa os parâmetros da URL para evitar que o toast apareça novamente
            window.history.replaceState({}, document.title, "/");
        }
    }, [session, fetchProfile]);

    useEffect(() => {
        if (session) {
            requestLocationPermission();
            // Carrega os dados da caixa de entrada para ter a contagem de notificações
            fetchConversations();
            fetchWinks();
            fetchAccessRequests();
        }
        return () => {
            stopLocationWatch();
            cleanupRealtime();
        };
    }, [session, requestLocationPermission, stopLocationWatch, cleanupRealtime, fetchConversations, fetchWinks, fetchAccessRequests]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-pink-500"></div>
            </div>
        );
    }
    
    if (!session || !user) {
        return <Auth />;
    }

    if (showOnboarding) {
        return <Onboarding />;
    }

    const renderActiveView = () => {
        switch (activeView) {
            case 'home': return <HomeView />;
            case 'grid': return <UserGrid />;
            case 'map': return <Map />;
            case 'agora': return <AgoraView />;
            case 'inbox': return <Inbox />;
            case 'profile': return <ProfileView />;
            default: return <HomeView />;
        }
    };

    return (
        <div className="h-screen w-screen bg-slate-900 text-white flex flex-col antialiased overflow-hidden">
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#1e293b', // slate-800
                        color: '#fff',
                        border: '1px solid #334155' // slate-700
                    },
                }}
            />
            
            <main className="flex-1 overflow-hidden pb-20 z-10">{renderActiveView()}</main>
            
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

            <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-20">
                <div className="max-w-md mx-auto grid grid-cols-6">
                   <NavButton icon="home" label="Início" isActive={activeView === 'home'} onClick={() => setActiveView('home')} />
                   <NavButton icon="search" label="Buscar" isActive={activeView === 'grid'} onClick={() => setActiveView('grid')} />
                   <NavButton icon="travel_explore" label="Mapa" isActive={activeView === 'map'} onClick={() => setActiveView('map')} />
                   <NavButton icon="whatshot" label="Agora" isActive={activeView === 'agora'} onClick={() => setActiveView('agora')} />
                   <NavButton icon="image" label="Entrada" isActive={activeView === 'inbox'} onClick={() => setActiveView('inbox')} notificationCount={totalUnreadCount} />
                   <NavButton icon="person" label="Perfil" isActive={activeView === 'profile'} onClick={() => setActiveView('profile')} isPlus={user.subscription_tier === 'plus'} />
                </div>
            </nav>
        </div>
    );
};

interface NavButtonProps {
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isPlus?: boolean;
    notificationCount?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, isActive, onClick, isPlus = false, notificationCount = 0 }) => (
    <button
        onClick={onClick}
        className="relative flex flex-col items-center justify-center py-2 w-full transition-colors group focus:outline-none"
        aria-label={label}
    >
        <div className="relative">
            <div 
                className={`flex items-center justify-center w-16 h-8 rounded-xl transition-colors
                    ${isActive ? 'bg-fuchsia-950' : ''}`
                }
            >
                <span 
                    className={`material-symbols-outlined text-2xl transition-colors 
                        ${isActive ? 'text-pink-400' : 'text-slate-400 group-hover:text-white'}`
                    }
                >
                    {icon}
                </span>
            </div>
            {notificationCount > 0 && (
                <span className="absolute -top-1 right-0 h-5 min-w-[20px] px-1 bg-red-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-900 z-10">
                    {notificationCount > 9 ? '9+' : notificationCount}
                </span>
             )}
        </div>
        <span 
            className={`text-xs mt-1 font-medium transition-colors 
                ${isActive ? 'text-pink-400' : 'text-slate-400 group-hover:text-white'}`
            }
        >
            {label}
        </span>
        {isPlus && (
            <span className="absolute top-1 right-2 material-symbols-outlined !text-[12px] text-yellow-400">auto_awesome</span>
        )}
    </button>
);


export default App;